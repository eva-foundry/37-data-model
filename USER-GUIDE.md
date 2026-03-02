# EVA Data Model — Agent User Guide

**Version:** 2.6  
**Last Updated:** March 1, 2026 9:40 PM ET · v2.6 — Evidence Layer immutable audit trail API  
**Audience:** AI agents (GitHub Copilot, Claude, custom skills) executing work on the EVA project  
**Model state:** query `/model/agent-summary` for live counts; see docs/library/03-DATA-MODEL-REFERENCE.md for complete layer catalog

> **You are the primary audience for this guide.**
>
> Every task you execute on the EVA project must begin with a model query, not a source file read.
> The model is the single source of truth. `grep` and `file_search` are the last resort —
> they cost 10 turns; the model costs 1.

---

## Contents

1. [Bootstrap — Start Every Session Here](#1-bootstrap--start-every-session-here)
2. [Understanding the Task Context](#2-understanding-the-task-context)
3. [Before You Implement — Gather Context](#3-before-you-implement--gather-context)
4. [Implementing a Feature](#4-implementing-a-feature)
5. [Debugging a Screen or Endpoint](#5-debugging-a-screen-or-endpoint)
6. [Refactoring — Blast Radius First](#6-refactoring--blast-radius-first)
7. [Sprint Planning & Status Queries](#7-sprint-planning--status-queries)
8. [After Your Work — Updating the Model](#8-after-your-work--updating-the-model)
9. [Evidence Layer — Immutable Audit Trail API](#9-evidence-layer--immutable-audit-trail-api)
10. [Quick Reference](#10-quick-reference)

---

## 1. Bootstrap — Start Every Session Here

Before doing anything, establish whether the model API is reachable. The API is always preferred
over file reads — it returns structured JSON, includes audit columns, and saves context.

### Step 1 — ACA endpoint (primary, 24x7, no auth required)

The model API is deployed on Azure Container Apps and backed by Cosmos DB.
This is now the default for all agents and portal-face calls — no localhost needed.

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
Invoke-RestMethod "$base/health"
# Expected: {"status":"ok","service":"model-api","store":"cosmos","version":"..."}

# One-call state check: all 32 layer counts + total objects
Invoke-RestMethod "$base/model/agent-summary"
# Returns: {by_layer:{services:33,endpoints:186,...,evidence:31,...}, total:4152+, layers:[...]}
# Use this instead of querying each layer separately.

# Evidence Layer check (COMPETITIVE ADVANTAGE)
Invoke-RestMethod "$base/model/evidence/" | Select-Object -First 3
# Returns: 31+ receipts with story_id, phase, test_result, correlation_id
```

### Step 2 (optional) — Local dev fallback (localhost:8010)

Use only when you need to test un-committed model changes against a local MemoryStore.

```powershell
$base = "http://localhost:8010"
Invoke-RestMethod "$base/health"   # if 200 -> proceed

# Start local API if not running (~3 s)
$env:PYTHONPATH = "C:\AICOE\eva-foundation\37-data-model"
C:\AICOE\.venv\Scripts\python -m uvicorn api.server:app --port 8010 --reload
# Interactive docs: http://localhost:8010/docs
```

### Step 3 — Azure Production (APIM) — for CI / GitHub Actions

The model API is deployed to Azure as a sidecar inside `marco-eva-brain-api` and is accessible
through APIM at the path `data-model`. Use this when running in CI, GitHub Actions, or any agent
that cannot reach `localhost:8010`.

```powershell
$apimBase = "https://marco-sandbox-apim.azure-api.net/data-model"
# Key: Azure Portal → marco-sandbox-apim → Subscriptions
# Set once per shell session: $env:EVA_APIM_KEY = "<paste key from portal>"
$h        = @{"Ocp-Apim-Subscription-Key" = $env:EVA_APIM_KEY}

# Health
Invoke-WebRequest "$apimBase/health" -Headers $h -UseBasicParsing

# Agent summary (all 27 layer counts)
Invoke-RestMethod "$apimBase/model/agent-summary" -Headers $h

# Projects
Invoke-RestMethod "$apimBase/model/projects/" -Headers $h

# Any other layer: replace /model/projects/ with /model/{layer}/
```

> **Architecture note:** APIM → brain-api (port 8001) → model-api sidecar (port 8010).
> The sidecar runs `37-data-model` in-process; `localhost:8010` resolves to it inside the container.
> All read operations are available. `PUT` / `POST /model/admin/*` operations also route through
> the same chain — use the `X-Actor` header as normal.

---

## 2. Understanding the Task Context

When you receive a task, use the model to understand scope before touching any code.

### "What services and apps exist?"

```powershell
# NOTE: the services layer exposes obj_id (not id); type and port are not fields in this layer.
Invoke-RestMethod "http://localhost:8010/model/services/" |
  Select-Object obj_id, status, is_active, notes | Format-Table

Invoke-RestMethod "http://localhost:8010/model/screens/" |
  Select-Object obj_id, app, route, status | Sort-Object app | Format-Table
```

### "Who can do what?"

```powershell
# All personas and their feature flag grants
Invoke-RestMethod "http://localhost:8010/model/personas/" |
  Select-Object id, label, feature_flags | Format-List

# What gates a specific endpoint?
(Invoke-RestMethod "http://localhost:8010/model/endpoints/POST /v1/chat").feature_flag
(Invoke-RestMethod "http://localhost:8010/model/endpoints/POST /v1/chat").auth
```

### "What does screen X do?"

```powershell
$s = Invoke-RestMethod "http://localhost:8010/model/screens/TranslationsPage"
$s.api_calls     # endpoints it calls
$s.components    # React components rendered
$s.hooks         # custom hooks used
$s.min_role      # minimum persona required
```

### "What is the current implementation status?"

```powershell
# Endpoint counts by status
@('implemented','stub','planned') | ForEach-Object {
  $st = $_
  $n  = (Invoke-RestMethod "http://localhost:8010/model/endpoints/filter?status=$st").Count
  [PSCustomObject]@{ status = $st; count = $n }
} | Format-Table

# Screens by status
Invoke-RestMethod "http://localhost:8010/model/screens/" |
  Group-Object status | Select-Object Name, Count
```

---

## 3. Before You Implement — Gather Context

Run these queries before writing a single line of code.

> **Endpoint `id` is always `"METHOD /path"` — get it from the model, never construct it.**
>
> The `id` field of every endpoint object is the full string `"METHOD /path"`, where path uses
> the exact parameter placeholder names registered in the route
> (e.g., `"GET /v1/config/translations/{language}"`, not `{lang}` or `{code}`).
> A wrong parameter name **passes at PUT time** but **fails at `validate-model.ps1`** with:
> `screen 'X' api_calls references unknown endpoint 'Y'`
>
> Safe pattern — copy the id directly from the model:
> ```powershell
> Invoke-RestMethod "http://localhost:8010/model/endpoints/" |
>   Where-Object { $_.path -like '*translations*' } |
>   Select-Object id, path
> # Use the returned .id verbatim in api_calls — do not retype it
> ```

### Does this object already exist?

```powershell
# Endpoint
Invoke-RestMethod "http://localhost:8010/model/endpoints/" |
  Where-Object { $_.path -like '*translations*' } | Select-Object id, status

# Screen
Invoke-RestMethod "http://localhost:8010/model/screens/" |
  Where-Object { $_.id -like '*Settings*' } | Select-Object id, app, status
```

### Cosmos container schema

```powershell
$c = Invoke-RestMethod "http://localhost:8010/model/containers/translations"
$c.partition_key
$c.fields | Format-Table
```

### Auth and feature flag requirements

```powershell
Invoke-RestMethod "http://localhost:8010/model/feature_flags/" |
  Where-Object { $_.id -like '*translation*' } |
  Select-Object id, status, personas, description
```

### Jump directly to the source line — never grep (E-10)

```powershell
# Backend endpoint → route decorator
$ep = Invoke-RestMethod "http://localhost:8010/model/endpoints/GET /v1/health"
code --goto "C:\AICOE\eva-foundation\$($ep.implemented_in):$($ep.repo_line)"

# React component
$c = Invoke-RestMethod "http://localhost:8010/model/components/QuestionInput"
code --goto "C:\AICOE\eva-foundation\$($c.repo_path):$($c.repo_line)"

# Custom hook
$h = Invoke-RestMethod "http://localhost:8010/model/hooks/useAnnouncer"
code --goto "C:\AICOE\eva-foundation\$($h.repo_path):$($h.repo_line)"
```

---

## 4. Implementing a Feature

Follow this sequence every time. Skipping steps creates drift between model and reality.

> **PUT rules — read before using any PUT in this section.**
>
> **1. Always PUT the full object.** `PATCH` is not supported — a `PATCH` request returns 422.
> Always fetch first, mutate the specific field(s), strip audit columns, then PUT.
>
> **2. Strip audit columns before sending.** `Invoke-RestMethod` returns a `PSCustomObject`
> that includes server-stamped fields. The server silently overwrites them, but stripping keeps
> your PUT body clean and avoids confusion. Fields to strip:
> `obj_id · layer · modified_by · modified_at · created_by · created_at · row_version · source_file`
>
> **3. Use a helper function for safe PUT mutation:**
> ```powershell
> function Strip-Audit ($obj) {
>   $obj | Select-Object * -ExcludeProperty `
>     obj_id, layer, modified_by, modified_at, created_by, created_at, row_version, source_file
> }
> # Usage: $body = Strip-Audit $ep | ConvertTo-Json -Depth 5
> ```
>
> **4. Always assign `ConvertTo-Json` to a variable before piping into `Invoke-RestMethod`.**
> Inline pipelines can silently truncate in some terminals. Always:
> ```powershell
> $body = Strip-Audit $ep | ConvertTo-Json -Depth 5
> Invoke-RestMethod "http://localhost:8010/model/screens/X" `
>   -Method PUT -ContentType "application/json" -Body $body
> ```

```
Step 1  Bootstrap (Section 1)
Step 2  Query: does this object already exist in the model?
Step 3  Query: Cosmos container schema, persona, feature flag
Step 4  Navigate to source via code --goto (never grep)
Step 5  Implement the code
Step 6  Update the model via PUT (Section 8)
Step 7  Close the write cycle: POST /model/admin/commit  (PASS = done)
```

### New backend endpoint

```powershell
# After writing the route handler, register it:
$body = @{
  id              = "GET /v1/tags"
  method          = "GET"
  path            = "/v1/tags"
  auth            = @("admin","translator")
  feature_flag    = "action.admin.translations"
  cosmos_reads    = @("config")
  cosmos_writes   = @()
  request_schema  = $null
  response_schema = "TagListResponse"
  status          = "implemented"
  implemented_in  = "33-eva-brain-v2/app/routers/tags.py"
} | ConvertTo-Json

Invoke-RestMethod "http://localhost:8010/model/endpoints/GET /v1/tags" `
  -Method PUT -ContentType "application/json" -Body $body `
  -Headers @{"X-Actor"="agent:copilot"}
```

### New React screen

```powershell
$body = @{
  id         = "SettingsPage"
  app        = "admin-face"
  route      = "/admin/settings"
  status     = "implemented"
  min_role   = "admin"
  api_calls  = @("GET /v1/config/settings")
  components = @("SettingsForm","PageTitle")
  hooks      = @("useFeatureFlags","useRBAC")
} | ConvertTo-Json

Invoke-RestMethod "http://localhost:8010/model/screens/SettingsPage" `
  -Method PUT -ContentType "application/json" -Body $body `
  -Headers @{"X-Actor"="agent:copilot"}
```

### New i18n literal

```powershell
$body = @{
  id         = "settings.page.title"
  key        = "settings.page.title"
  default_en = "Settings"
  default_fr = "Paramètres"
  screens    = @("SettingsPage")
} | ConvertTo-Json

Invoke-RestMethod "http://localhost:8010/model/literals/settings.page.title" `
  -Method PUT -ContentType "application/json" -Body $body `
  -Headers @{"X-Actor"="agent:copilot"}
```

---

## 5. Debugging a Screen or Endpoint

Always start from the model. Source files are the last step, not the first.

```powershell
# Step 1: what does the broken screen call?
$calls = (Invoke-RestMethod "http://localhost:8010/model/screens/TranslationsPage").api_calls

# Step 2: are any of those endpoints not implemented?
Invoke-RestMethod "http://localhost:8010/model/endpoints/" |
  Where-Object { $_.id -in $calls -and $_.status -ne 'implemented' } |
  Select-Object id, status

# Step 3: what auth and feature flag does each require?
Invoke-RestMethod "http://localhost:8010/model/endpoints/" |
  Where-Object { $_.id -in $calls } |
  Select-Object id, auth, feature_flag, status

# Step 4: what Cosmos containers do they touch?
Invoke-RestMethod "http://localhost:8010/model/endpoints/" |
  Where-Object { $_.id -in $calls } |
  Select-Object id, cosmos_reads, cosmos_writes | Format-List

# Step 5: navigate to the implementation
$ep = Invoke-RestMethod "http://localhost:8010/model/endpoints/$($calls[0])"
code --goto "C:\AICOE\eva-foundation\$($ep.implemented_in):$($ep.repo_line)"
```

> **Typical finding:** a screen calls a `stub` or `planned` endpoint — that is exactly
> where to look, without any grep.

---

## 6. Refactoring — Blast Radius First

Never rename, move, or restructure code without mapping the blast radius first.

> **Why this section replaces file reads:**
> `GET /model/impact/?container=X` and `GET /model/graph/?node_id=X&depth=2` answer
> "what breaks if I change this" in a single API call with zero source file reads.
> Before these endpoints existed, mapping blast radius required reading config files,
> route files, and screen definitions across multiple projects — easily 10+ turns.
> Use these two calls before any rename, container schema change, or endpoint removal.

```powershell
# Impact of changing a Cosmos container (or a specific field within it)
Invoke-RestMethod "http://localhost:8010/model/impact/?container=translations"
Invoke-RestMethod "http://localhost:8010/model/impact/?container=translations&field=key"

# Graph traversal: all objects that depend on an endpoint (2 hops out)
$g = Invoke-RestMethod "http://localhost:8010/model/graph/?node_id=GET /v1/config/translations/{language}&depth=2"
$g.edges | Select-Object from_id, from_layer, to_id, to_layer, edge_type | Format-Table

# Which screens write to a container? (two-hop: writes → calls)
$writes  = (Invoke-RestMethod "http://localhost:8010/model/graph/?edge_type=writes").edges |
    Where-Object { $_.to_id -eq "translations" }
$callers = (Invoke-RestMethod "http://localhost:8010/model/graph/?edge_type=calls").edges |
    Where-Object { $_.to_id -in $writes.from_id }
$callers | Select-Object from_id, to_id

# All services that depend on eva-roles-api
(Invoke-RestMethod "http://localhost:8010/model/graph/?edge_type=depends_on").edges |
    Where-Object { $_.to_id -eq "eva-roles-api" } | Select-Object from_id
```

> **Rule:** if the blast radius spans more than 2 layers, document it in the ADO work item
> before committing any code.

---

## 7. Sprint Planning & Status Queries

```powershell
# Endpoints not yet implemented
Invoke-RestMethod "http://localhost:8010/model/endpoints/filter?status=stub"    | Select-Object id | Sort-Object id
Invoke-RestMethod "http://localhost:8010/model/endpoints/filter?status=planned" | Select-Object id

# Screens with empty components[] (structure not yet wired in model)
Invoke-RestMethod "http://localhost:8010/model/screens/" |
  Where-Object { $_.components.Count -eq 0 } | Select-Object id, app, status

# Requirements with no test coverage
Invoke-RestMethod "http://localhost:8010/model/requirements/" |
  Where-Object { $_.test_ids.Count -eq 0 } | Select-Object id, title, type, status

# Azure resources not yet provisioned
Invoke-RestMethod "http://localhost:8010/model/infrastructure/" |
  Where-Object { $_.status -eq 'planned' } | Select-Object id, type, azure_resource_name

# i18n coverage — literals missing French
Invoke-RestMethod "http://localhost:8010/model/literals/" |
  Where-Object { -not $_.default_fr -or $_.default_fr -eq '' } | Select-Object key, default_en

# Project plane: which projects are blocked?
Invoke-RestMethod "http://localhost:8010/model/projects/" |
  Where-Object { $_.blocked_by.Count -gt 0 } | Select-Object id, maturity, blocked_by
```

---

## 8. After Your Work — Updating the Model

> **The same-PR rule is non-negotiable.**
> Every source change that affects a model object must update the model in the same commit.
> Never defer. A stale model is worse than no model.

### What to update for each change type

| Source change | Model layers to update |
|---|---|
| New FastAPI endpoint | `endpoints` + `schemas` for the response shape |
| Endpoint promoted stub → implemented | `endpoints` — set `status`, `implemented_in`, `repo_line` |
| New Cosmos container or field | `containers` |
| New React screen | `screens` + `literals` for every new string key |
| New i18n key | `literals` |
| New custom hook | `hooks` |
| New React component | `components` |
| New persona or feature flag | `personas` + `feature_flags` |
| New Azure resource | `infrastructure` |
| New agent-fleet agent | `agents` |

### The full write cycle — always in this order

**Preferred (3-step with commit shortcut):**
```
1. PUT /model/{layer}/{id}          ← audit columns auto-stamped; row_version increments
2. GET /model/{layer}/{id}          ← verify row_version, modified_by, status
3. POST /model/admin/commit         ← export + assemble + validate in ONE call; PASS = clean
```

**Manual (if `POST /model/admin/commit` is unavailable):**
```
1. PUT /model/{layer}/{id}
2. GET /model/{layer}/{id}
3. POST /model/admin/export           ← writes model/*.json files
4. scripts/assemble-model.ps1         ← rebuilds eva-model.json
5. scripts/validate-model.ps1         ← must show PASS -- 0 violations
```

```powershell
# Full example: promote an endpoint from stub to implemented
$ep = Invoke-RestMethod "http://localhost:8010/model/endpoints/GET /v1/tags"
$ep.status         = "implemented"
$ep.implemented_in = "33-eva-brain-v2/app/routers/tags.py"
$ep.repo_line      = 14

# Strip audit columns before PUT (see PUT rules above)
$body = Strip-Audit $ep | ConvertTo-Json -Depth 5
Invoke-RestMethod "http://localhost:8010/model/endpoints/GET /v1/tags" `
  -Method PUT -ContentType "application/json" -Body $body `
  -Headers @{"X-Actor"="agent:copilot"}

# --- Canonical write confirmation ---
# row_version is the only reliable confirm when terminal output is truncated.
# Always GET after PUT and assert these three:
$written = Invoke-RestMethod "http://localhost:8010/model/endpoints/GET /v1/tags"
$written.row_version   # must be previous + 1
$written.modified_by   # must equal your X-Actor value
$written.status        # must equal what you PUT

# Close the cycle — commit shortcut (preferred)
$c = Invoke-RestMethod "http://localhost:8010/model/admin/commit" `
  -Method POST -Headers @{"Authorization"="Bearer dev-admin"}
$c.status           # "PASS" or "FAIL"
$c.violation_count  # 0 = clean; >0 = fix before merging
$c.exported_total   # e.g. 866
```

> **`repo_line` WARNs (38+) are pre-existing chronic noise — they are not caused by your work.**
>
> Every validate run reports WARNs for objects with `status=implemented` but no `repo_line`.
> These are pre-existing gaps; they are non-blocking. To distinguish your new violations from
> pre-existing noise, use the API validator instead of the PowerShell script:
> ```powershell
> $v = Invoke-RestMethod "http://localhost:8010/model/admin/validate" `
>        -Headers @{"Authorization"="Bearer dev-admin"}
> $v.count       # 0 = clean; >0 = new violations to fix right now
> $v.violations  # the actual cross-reference FAILs — fix these
> # Warnings (repo_line gaps) are separate and pre-existing — ignore unless you are the owner
> ```

### Fix a validation FAIL

When `validate-model.ps1` (or `GET /model/admin/validate`) reports violations, the pattern is:

```powershell
# --- Example violation ---
# screen 'JpSparkChatPage' api_calls references unknown endpoint 'POST /api/conversation'
#
# Root cause: the api_calls entry used a wrong id (missing path param, wrong method, etc.)
# Fix:

# Step 1 — find the exact endpoint id from the model (never construct it yourself)
Invoke-RestMethod "http://localhost:8010/model/endpoints/" |
  Where-Object { $_.path -like '*conversation*' } |
  Select-Object id, path

# Step 2 — fetch the offending screen, correct the api_calls array
$s = Invoke-RestMethod "http://localhost:8010/model/screens/JpSparkChatPage"
# Replace the bad id with the exact id returned in step 1:
$s.api_calls = @("POST /api/conversation", "GET /api/chathistory/sessions")  # etc.

# Step 3 — PUT with Strip-Audit
$body = Strip-Audit $s | ConvertTo-Json -Depth 5
Invoke-RestMethod "http://localhost:8010/model/screens/JpSparkChatPage" `
  -Method PUT -ContentType "application/json" -Body $body

# Step 4 — re-validate: count must drop to 0
$v = Invoke-RestMethod "http://localhost:8010/model/admin/validate" `
       -Headers @{"Authorization"="Bearer dev-admin"}
$v.count   # 0 = done
```

> **Never edit `model/*.json` files directly.** Direct edits bypass the audit trail —
> `modified_by` stays `"system:autoload"`, `row_version` stays `1`, and
> `GET /model/admin/audit` is blind to the change.

---

## 9. Evidence Layer — Immutable Audit Trail API

> **WHAT IT DOES:**
> Every story completion generates an immutable receipt with test results, artifacts, and validation gates.
> Receipts are queryable by sprint, story, phase, correlation ID, or test result.
> This enables blast-radius analysis, compliance audits, and cost tracking across projects.

### Problem

AI agents generate code changes constantly. When something breaks in production, teams need to answer:
- Which agent made the change?
- What requirement did it satisfy?
- Which tests passed before merge?
- Which files were changed?
- Were all validation gates green?

**Standard tools:** Git logs show commits, CI logs show test runs, but they don't connect them to requirements.
**Evidence Layer:** One receipt per phase, queryable by requirement, showing validation gates and artifacts atomically.

### Solution

**Evidence Receipts** contain:
- **story_id**: Requirement ID (e.g., ACA-14-001)
- **correlation_id**: Batch ID linking multi-repo changes (e.g., ACA-S11-20260301-285bd914)
- **phase**: DPDCA phase (D1, D2, P, D3, C, A)
- **test_result**: PASS/FAIL gate (merge blocker if FAIL)
- **artifacts**: Files changed, lines added, test files created
- **validation**: Test coverage, lint status, pass/fail counts
- **metrics**: Duration, token cost, AI model used

**Immutable:** Once written, receipts cannot be changed (Cosmos DB enforces this via partition keys).  
**Queryable:** Filter by sprint, story, phase, test result, or correlation ID to find related changes.  
**Compliance-ready:** JSON format works with audit log systems and compliance frameworks (SOX, HIPAA, etc.).

### When to Record Evidence

Record evidence after EACH phase of the DPDCA cycle:

| Phase | When | Required fields | Merge gate |
|---|---|---|---|
| **D1** (Discover) | Context gathered, model queried | story_id, phase, artifacts (files read) | No |
| **D2** (Discover-Audit) | Tests run, audit scanners complete | story_id, phase, validation (test_result, lint_result) | YES (test_result must be PASS) |
| **P** (Plan) | Design approved, schema validated | story_id, phase, artifacts (design docs) | No |
| **D3** (Do) | Code written, committed | story_id, phase, commits, artifacts (source files) | No |
| **C** (Check) | Tests green, audit PASS | story_id, phase, validation (coverage_percent >= 60) | YES (coverage must meet threshold) |
| **A** (Act) | Results recorded, story closed | story_id, phase, metrics (duration_ms, cost_usd) | No |

**Correlation IDs**: Use the same correlation_id for all receipts in a multi-repo batch. This enables blast-radius queries (see below).

### Record Evidence (Agent Pattern)

Use the Python library:

```python
import sys
sys.path.insert(0, r"C:\AICOE\eva-foundry\37-data-model")
from tools.evidence_generator import EvidenceBuilder
import httpx, json, hashlib, datetime

# Step 1: Generate correlation ID (once per batch, reuse across all receipts)
correlation_id = f"ACA-S11-{datetime.datetime.now().strftime('%Y%m%d')}-{hashlib.sha256(str(datetime.datetime.now()).encode()).hexdigest()[:8]}"

# Step 2: Create evidence builder
gen = EvidenceBuilder(
    sprint_id="ACA-S11",
    story_id="ACA-14-001",
    story_title="Rule loader for 51-ACA",
    phase="C",  # Check phase (test results)
    correlation_id=correlation_id  # Link to other receipts in this batch
)

# Step 3: Add validation results (CRITICAL — merge blocker if FAIL)
gen.add_validation(test_result="PASS", lint_result="PASS", coverage_percent=92)

# Step 4: Add metrics (for cost tracking and performance analysis)
gen.add_metrics(
    duration_ms=8450,
    files_changed=3,
    lines_added=245,
    lines_removed=18,
    tokens_used=12000,
    cost_usd=0.00045
)

# Step 5: Add artifacts (EVERY file touched — this is the audit trail)
gen.add_artifact(path="services/rules/app/loader.py", type_="source", action="modified", lines_changed=124)
gen.add_artifact(path="tests/test_loader.py", type_="test", action="created", lines_changed=98)
gen.add_artifact(path=".github/workflows/pytest.yml", type_="ci_config", action="modified", lines_changed=12)

# Step 6: Add commits (links receipt to git history)
gen.add_commit(sha="f7e9a2b1c", message="feat(ACA-14): rule loader for sprints")

# Step 7: Validate (raises ValueError if test_result=FAIL or required fields missing)
gen.validate()   # CRITICAL: Do not skip this — it enforces merge gates

receipt = gen.build()

# Step 8: POST to data model (ACA endpoint)
base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
client = httpx.Client()
response = client.put(
    f"{base}/model/evidence/{receipt['id']}",
    content=json.dumps(receipt),
    headers={"X-Actor": "agent:copilot", "Content-Type": "application/json"}
)
print(f"Evidence recorded: {receipt['id']} (row_version={response.json()['row_version']})")
```

**CRITICAL RULES:**
1. **Same correlation_id for all related changes** — If you changed 3 repos in one session, use the same correlation_id for all 3 receipts
2. **Do NOT skip validation** — `gen.validate()` enforces merge gates; test_result=FAIL blocks merge
3. **Include ALL files touched** — `add_artifact()` for EVERY file read or written (this is the audit trail)
4. **Record phase-specific receipts** — Do NOT write one mega-receipt; write separate receipts for D2, C, A phases

### Query Evidence (Blast Radius Analysis)

**Use case 1: Find all changes linked to a requirement**
```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

# All receipts for story ACA-14-001 (across all phases)
Invoke-RestMethod "$base/model/evidence/" |
  Where-Object { $_.story_id -eq "ACA-14-001" } |
  Select-Object id, phase, @{N="test_result";E={$_.validation.test_result}}, @{N="files";E={$_.artifacts.Count}}
```

**Use case 2: Find all changes in a correlated batch (blast radius)**
```powershell
# All receipts with correlation_id ACA-S11-20260301-285bd914 (multi-repo batch)
$correlation_id = "ACA-S11-20260301-285bd914"
$receipts = Invoke-RestMethod "$base/model/evidence/" |
  Where-Object { $_.correlation_id -eq $correlation_id }

Write-Host "Blast radius: $($receipts.Count) receipts across $(($receipts.story_id | Select-Object -Unique).Count) stories"

# List all files changed in this batch (compliance audit trail)
$receipts | ForEach-Object { $_.artifacts } | ForEach-Object { $_.path } | Sort-Object -Unique
```

**Use case 3: Find merge blockers (test failures)**
```powershell
# All receipts with test_result=FAIL (cannot merge until fixed)
Invoke-RestMethod "$base/model/evidence/" |
  Where-Object { $_.validation.test_result -eq "FAIL" } |
  Select-Object id, story_id, phase, @{N="error";E={$_.validation.error_message}}
```

**Use case 4: Sprint health check (coverage trends)**
```powershell
# All Check-phase receipts in sprint ACA-S11 (coverage must be >= 60%)
Invoke-RestMethod "$base/model/evidence/" |
  Where-Object { $_.sprint_id -eq "ACA-S11" -and $_.phase -eq "C" } |
  Select-Object story_id, @{N="coverage";E={$_.validation.coverage_percent}} |
  Sort-Object coverage
```

**Use case 5: Cost tracking (AI spend per sprint)**
```powershell
# Total AI cost for sprint ACA-S11
$receipts = Invoke-RestMethod "$base/model/evidence/" |
  Where-Object { $_.sprint_id -eq "ACA-S11" }

$total_cost = ($receipts | Measure-Object -Property { $_.metrics.cost_usd } -Sum).Sum
$total_tokens = ($receipts | Measure-Object -Property { $_.metrics.tokens_used } -Sum).Sum

Write-Host "Sprint ACA-S11: $($receipts.Count) receipts, $total_tokens tokens, `$$total_cost USD"
```

### Compliance Use Cases (Why Insurance Carriers Pay $199/dev/month)

**FDA 21 CFR Part 11 (Medical Devices):**
- Requirement: "Electronic signatures must be linked to their respective electronic records to ensure that the signer cannot repudiate the signed record"
- Evidence Layer: Every receipt includes `modified_by` (agent ID), `created_at` (timestamp), `commits` (git SHA)
- Audit query: `GET /model/evidence/?story_id=MED-04-022` retrieves immutable receipt proving which AI agent made which change

**SOX Compliance (Financial Services):**
- Requirement: "Maintain an audit trail of all changes to financial systems"
- Evidence Layer: Correlation IDs link multi-repo changes; blast radius query shows all systems touched in one batch
- Audit query: `GET /model/evidence/?correlation_id=FIN-S03-20260301-xyz` retrieves all changes in batch

**HIPAA (Healthcare):**
- Requirement: "Record who accessed or modified PHI and when"
- Evidence Layer: `artifacts` array lists every file read/written; `validation.test_result` proves data validation passed
- Audit query: Filter by `artifacts.path` containing "patient_data" to find all AI changes touching PHI

**Basel III (Banking Risk Management):**
- Requirement: "Model changes must be documented and approved before deployment"
- Evidence Layer: Phase P (Plan) receipt proves design was approved; Phase C (Check) proves tests passed
- Audit query: `GET /model/evidence/?phase=P&story_id=RISK-12-005` retrieves plan receipt; must exist before deploy

### Python Query Tool (Batch Analysis)

Located at `C:\AICOE\eva-foundry\37-data-model\scripts\evidence_query.py`:

```bash
# All evidence in a sprint (table view)
python scripts/evidence_query.py --sprint ACA-S11 --format table

# All evidence with test failures (JSON for CI pipeline)
python scripts/evidence_query.py --test-fail --format json > failures.json

# All evidence with low coverage (< 60%, merge blocker)
python scripts/evidence_query.py --low-coverage --threshold 60

# All phases of one story (requirement traceability)
python scripts/evidence_query.py --story ACA-14-001 --format table

# Blast radius for a correlation ID (find all related changes)
python scripts/evidence_query.py --correlation ACA-S11-20260301-285bd914 --format json

# Cost report for a sprint (AI spend tracking)
python scripts/evidence_query.py --sprint ACA-S11 --cost-report
```

### Validation Gates (CI/CD Integration)

Evidence validation runs automatically in CI/CD pipelines via `scripts/evidence_validate.ps1`:

```powershell
# Called by GitHub Actions as a merge gate — exits 1 if any FAIL receipts found
.\scripts\evidence_validate.ps1 -Sprint "ACA-S11" -Phase "C"

# Expected output (PASS example):
# [INFO] Validating evidence for sprint ACA-S11, phase C
# [INFO] Found 12 receipts
# [PASS] All 12 receipts have test_result=PASS
# [PASS] All 12 receipts have coverage >= 60%
# [PASS] No merge blockers found
# EXIT 0

# Expected output (FAIL example):
# [INFO] Validating evidence for sprint ACA-S11, phase C
# [INFO] Found 12 receipts
# [FAIL] 2 receipts have test_result=FAIL:
#        - ACA-14-002-C (validation.error_message: "AssertionError in test_loader.py:45")
#        - ACA-14-007-C (validation.error_message: "ImportError: module 'rules' not found")
# [FAIL] Merge blocked until failures are resolved
# EXIT 1

# Exit codes:
#   0 = all evidence valid, no merge blockers
#   1 = violations or FAIL gates detected → PR merge blocked
```

Merge-blocking conditions:
- `validation.test_result = "FAIL"`  — all tests must pass
- `validation.lint_result = "FAIL"`  — all linting must pass
- `validation.coverage_percent < 80` — warns but does not block (informational only)

If a human tries to merge with `test_result=FAIL`, CI blocks the PR. Fix the test and re-run evidence.

### Evidence schema

See `schema/evidence.schema.json` for the complete schema. Key fields:

| Field | Type | Purpose |
|---|---|---|
| `id` | string | Business key: `{SPRINT_ID}-{STORY_ID}-{PHASE}` |
| `sprint_id` | string | Link to sprints layer |
| `story_id` | string | Story being completed |
| `phase` | enum | D1, D2, P, D3, A |
| `created_at` | RFC3339 | When evidence was recorded |
| `validation.test_result` | enum | PASS, FAIL, WARN, SKIP → blocks merge if FAIL |
| `validation.lint_result` | enum | PASS, FAIL, WARN, SKIP → blocks merge if FAIL |
| `validation.coverage_percent` | int | 0-100 (warning if <80%) |
| `metrics.duration_ms` | int | How long the phase took |
| `metrics.files_changed` | int | Number of files touched |
| `metrics.tokens_used` | int | LM tokens if agent-assisted |
| `metrics.cost_usd` | decimal | Cost in USD |
| `artifacts` | array | Files created/modified/deleted |
| `commits` | array | Git commits in this phase |

---

### Decision table

| You want to… | API call |
|---|---|
| Browse layers + objects visually | portal-face `/model` — layer sidebar, EvaDataGrid, EvaDrawer detail |
| Report: overview stats / endpoint matrix / edge types | portal-face `/model/report` — 4-tab dashboard (requires `view:model` permission) |
| Find an object by id | `GET /model/{layer}/{id}` |
| List all objects in a layer | `GET /model/{layer}/` |
| Filter endpoints by status / auth / cosmos_writes | `GET /model/endpoints/filter?status=stub` — **filtering is only available on the `endpoints` layer**; for all other layers use `Where-Object` client-side |
| What does screen X call? | `GET /model/screens/{id}` → `.api_calls` |
| What breaks if container/endpoint X changes? | `GET /model/impact/?container=X` |
| Traverse relationships (DER/ERD) | `GET /model/graph?node_id=X&depth=2` |
| All edge types in the graph | `GET /model/graph/edge-types` |
| Navigate to source line in VS Code | `.repo_path` + `.repo_line` → `code --goto` |
| Who created/modified an object, which file | `.created_by` · `.modified_by` · `.row_version` · `.source_file` |
| Write a model update | `PUT /model/{layer}/{id}` + `X-Actor` header |
| Close the write cycle (export+assemble+validate) | `POST /model/admin/commit` → `.status` = `PASS` |
| All layer counts in one call | `GET /model/agent-summary` |
| Materialise changes to disk (manual) | `POST /model/admin/export` |
| Full audit trail | `GET /model/admin/audit` |
| Validate all cross-references | `GET /model/admin/validate` |

### ACA Direct Endpoint (primary, no auth required)

```
https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io
```

All portal-face API calls and veritas `model_audit` default to this endpoint.
No subscription key. No localhost. 24x7 Cosmos-backed.

### Azure Production Endpoints (APIM)

| URL | Description |
|---|---|
| `GET https://marco-sandbox-apim.azure-api.net/data-model/model/agent-summary` | All entity layers + object counts |
| `GET https://marco-sandbox-apim.azure-api.net/data-model/model/projects/` | 46 active projects |
| `GET https://marco-sandbox-apim.azure-api.net/data-model/model/{layer}/` | Any layer |
| `GET https://marco-sandbox-apim.azure-api.net/data-model/model/{layer}/{id}` | Single object |
| `PUT https://marco-sandbox-apim.azure-api.net/data-model/model/{layer}/{id}` | Write (X-Actor required) |
| `GET https://marco-sandbox-apim.azure-api.net/data-model/health` | Sidecar health |

Header required: `Ocp-Apim-Subscription-Key: <key>` — retrieve from Azure Portal → `marco-sandbox-apim` → Subscriptions. Set locally as `$env:EVA_APIM_KEY`.

Brain-api health (no key required): `GET https://marco-eva-brain-api.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/v1/health`

### Anti-patterns — these cost 10 turns instead of 1

| Do NOT | Do instead |
|---|---|
| `grep` source files for endpoint names | `GET /model/endpoints/` |
| `file_search` to find a React component's path | `GET /model/components/{id}` → `.repo_path` |
| Read all route files to understand the API surface | `GET /model/endpoints/` |
| Ask "what depends on X" by reading config files | `GET /model/graph?node_id=X&depth=1` |
| Edit `model/*.json` files directly | `PUT /model/{layer}/{id}` → export → assemble |
| Defer the model update to a later session | Update in the same commit as the source change |
| Mark an endpoint `implemented` before it is wired | Use `stub` until the route is complete and tested |

### Scripts — when to run each

| Script | Trigger |
|---|---|
| `assemble-model.ps1` | After `POST /model/admin/export` (manual path only) |
| `validate-model.ps1` | Manual path only — `POST /model/admin/commit` is preferred |
| `impact-analysis.ps1 -container X` | Before any refactor |
| `coverage-gaps.ps1` | Sprint review |
| `sync-from-source.ps1` | Sprint close audit |
| `backfill-repo-lines.py` | After new endpoints are wired |
| `ado-generate-artifacts.ps1` | Sprint planning |

---

*Model root:* `C:\AICOE\eva-foundation\37-data-model`  
*ACA endpoint (primary):* `https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io`  
*Interactive API docs (local dev):* `http://localhost:8010/docs`  
*Browser UI:* `portal-face /model` (layer browser) + `portal-face /model/report` (reports) -- requires `view:model` permission  
*Last updated:* February 25, 2026 10:14 ET  
*Questions -> AI Centre of Excellence*
