**Version:** 2.7  
**Last Updated:** March 5, 2026 11:36 AM ET · v2.7 — LOCAL SERVICE DISABLED; Cloud (ACA) is sole source of truth  
**Audience:** AI agents (GitHub Copilot, Claude, custom skills) executing work on the EVA project  
**Critical:** As of March 5, 2026, port 8010 (localhost) is **permanently disabled**. ALL agents must use the cloud ONLY.
**Model state:** query `$base/model/agent-summary` where `$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"`

> **Single Source of Truth: Cloud API Only**
>
> Every task you execute on the EVA project must query the CLOUD data model API.
> Local fallback (localhost:8010) was disabled March 5, 2026.
> The cloud endpoint (ACA + Cosmos DB) is now authoritative for all 4,339 objects.
> Do NOT attempt to use localhost:8010 — it will not respond.

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

### Step 2 (DISABLED as of March 5, 2026) — Local dev fallback (localhost:8010)

**⚠️ The local development server on port 8010 is permanently disabled.**

Previously, you could test un-committed model changes against a local MemoryStore at `https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io`.
This has been removed to maintain a single source of truth across all agents.

**All agents must now use the cloud API endpoint above.** Development iterations should be tested 
against the cloud endpoint (which has full 4,339 objects) rather than a potentially stale local copy.

### Step 3 — Azure Production (APIM) — for CI / GitHub Actions

The data model is accessible through APIM at the path `data-model`. Use this when running in CI, 
GitHub Actions, or any agent that needs to access through Azure API Management gateway.

```powershell
$apimBase = "https://marco-sandbox-apim.azure-api.net/data-model"
# Key: Azure Portal → marco-sandbox-apim → Subscriptions
# Set once per shell session: $env:EVA_APIM_KEY = "<paste key from portal>"
$h        = @{"Ocp-Apim-Subscription-Key" = $env:EVA_APIM_KEY}

# Health
Invoke-WebRequest "$apimBase/health" -Headers $h -UseBasicParsing

# Agent summary (all 31 layer counts, 4,339 objects)
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
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

# Services
Invoke-RestMethod "$base/model/services/" |
  Select-Object id, status, is_active, notes | Format-Table

# Screens (all UIs across all apps)
Invoke-RestMethod "$base/model/screens/" |
  Select-Object id, app, route, status | Sort-Object app | Format-Table
```

### "Who can do what?"

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

# All personas and their feature flag grants
Invoke-RestMethod "$base/model/personas/" |
  Select-Object id, label, feature_flags | Format-List

# What gates a specific endpoint?
(Invoke-RestMethod "$base/model/endpoints/POST /v1/chat").feature_flag
(Invoke-RestMethod "$base/model/endpoints/POST /v1/chat").auth
```

### "What does screen X do?"

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$s = Invoke-RestMethod "$base/model/screens/TranslationsPage"
$s.api_calls     # endpoints it calls
$s.components    # React components rendered
$s.hooks         # custom hooks used
$s.min_role      # minimum persona required
```

### "What is the current implementation status?"

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

# Endpoint counts by status
@('implemented','stub','planned') | ForEach-Object {
  $st = $_
  $n  = (Invoke-RestMethod "$base/model/endpoints/filter?status=$st").Count
  [PSCustomObject]@{ status = $st; count = $n }
} | Format-Table

# Screens by status
Invoke-RestMethod "$base/model/screens/" |
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
> $base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
> Invoke-RestMethod "$base/model/endpoints/" |
>   Where-Object { $_.path -like '*translations*' } |
>   Select-Object id, path
> # Use the returned .id verbatim in api_calls — do not retype it
> ```

### Does this object already exist?

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

# Endpoint
Invoke-RestMethod "$base/model/endpoints/" |
  Where-Object { $_.path -like '*translations*' } | Select-Object id, status

# Screen
Invoke-RestMethod "$base/model/screens/" |
  Where-Object { $_.id -like '*Settings*' } | Select-Object id, app, status
```

### Cosmos container schema

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$c = Invoke-RestMethod "$base/model/containers/translations"
$c.partition_key
$c.fields | Format-Table
```

### Auth and feature flag requirements

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
Invoke-RestMethod "$base/model/feature_flags/" |
  Where-Object { $_.id -like '*translation*' } |
  Select-Object id, status, personas, description
```

### Jump directly to the source line — never grep (E-10)

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

# Backend endpoint → route decorator
$ep = Invoke-RestMethod "$base/model/endpoints/GET /v1/health"
code --goto "C:\AICOE\eva-foundation\$($ep.implemented_in):$($ep.repo_line)"

# React component
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$c = Invoke-RestMethod "$base/model/components/QuestionInput"
code --goto "C:\AICOE\eva-foundation\$($c.repo_path):$($c.repo_line)"

# Custom hook
$h = Invoke-RestMethod "$base/model/hooks/useAnnouncer"
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
> Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/screens/X" `
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
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

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

Invoke-RestMethod "$base/model/endpoints/GET /v1/tags" `
  -Method PUT -ContentType "application/json" -Body $body `
  -Headers @{"X-Actor"="agent:copilot"}
```

### New React screen

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

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

Invoke-RestMethod "$base/model/screens/SettingsPage" `
  -Method PUT -ContentType "application/json" -Body $body `
  -Headers @{"X-Actor"="agent:copilot"}
```

### New i18n literal

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

$body = @{
  id         = "settings.page.title"
  key        = "settings.page.title"
  default_en = "Settings"
  default_fr = "Paramètres"
  screens    = @("SettingsPage")
} | ConvertTo-Json

Invoke-RestMethod "$base/model/literals/settings.page.title" `
  -Method PUT -ContentType "application/json" -Body $body `
  -Headers @{"X-Actor"="agent:copilot"}
```

---

## 5. Debugging a Screen or Endpoint

Always start from the model. Source files are the last step, not the first.

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

# Step 1: what does the broken screen call?
$calls = (Invoke-RestMethod "$base/model/screens/TranslationsPage").api_calls

# Step 2: are any of those endpoints not implemented?
Invoke-RestMethod "$base/model/endpoints/" |
  Where-Object { $_.id -in $calls -and $_.status -ne 'implemented' } |
  Select-Object id, status

# Step 3: what auth and feature flag does each require?
Invoke-RestMethod "$base/model/endpoints/" |
  Where-Object { $_.id -in $calls } |
  Select-Object id, auth, feature_flag, status

# Step 4: what Cosmos containers do they touch?
Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/endpoints/" |
  Where-Object { $_.id -in $calls } |
  Select-Object id, cosmos_reads, cosmos_writes | Format-List

# Step 5: navigate to the implementation
$ep = Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/endpoints/$($calls[0])"
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
Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/impact/?container=translations"
Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/impact/?container=translations&field=key"

# Graph traversal: all objects that depend on an endpoint (2 hops out)
$g = Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/graph/?node_id=GET /v1/config/translations/{language}&depth=2"
$g.edges | Select-Object from_id, from_layer, to_id, to_layer, edge_type | Format-Table

# Which screens write to a container? (two-hop: writes → calls)
$writes  = (Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/graph/?edge_type=writes").edges |
    Where-Object { $_.to_id -eq "translations" }
$callers = (Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/graph/?edge_type=calls").edges |
    Where-Object { $_.to_id -in $writes.from_id }
$callers | Select-Object from_id, to_id

# All services that depend on eva-roles-api
(Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/graph/?edge_type=depends_on").edges |
    Where-Object { $_.to_id -eq "eva-roles-api" } | Select-Object from_id
```

> **Rule:** if the blast radius spans more than 2 layers, document it in the ADO work item
> before committing any code.

---

## 7. Sprint Planning & Status Queries

```powershell
# Endpoints not yet implemented
Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/endpoints/filter?status=stub"    | Select-Object id | Sort-Object id
Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/endpoints/filter?status=planned" | Select-Object id

# Screens with empty components[] (structure not yet wired in model)
Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/screens/" |
  Where-Object { $_.components.Count -eq 0 } | Select-Object id, app, status

# Requirements with no test coverage
Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/requirements/" |
  Where-Object { $_.test_ids.Count -eq 0 } | Select-Object id, title, type, status

# Azure resources not yet provisioned
Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/infrastructure/" |
  Where-Object { $_.status -eq 'planned' } | Select-Object id, type, azure_resource_name

# i18n coverage — literals missing French
Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/literals/" |
  Where-Object { -not $_.default_fr -or $_.default_fr -eq '' } | Select-Object key, default_en

# Project plane: which projects are blocked?
Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/projects/" |
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
$ep = Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/endpoints/GET /v1/tags"
$ep.status         = "implemented"
$ep.implemented_in = "33-eva-brain-v2/app/routers/tags.py"
$ep.repo_line      = 14

# Strip audit columns before PUT (see PUT rules above)
$body = Strip-Audit $ep | ConvertTo-Json -Depth 5
Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/endpoints/GET /v1/tags" `
  -Method PUT -ContentType "application/json" -Body $body `
  -Headers @{"X-Actor"="agent:copilot"}

# --- Canonical write confirmation ---
# row_version is the only reliable confirm when terminal output is truncated.
# Always GET after PUT and assert these three:
$written = Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/endpoints/GET /v1/tags"
$written.row_version   # must be previous + 1
$written.modified_by   # must equal your X-Actor value
$written.status        # must equal what you PUT

# Close the cycle — commit shortcut (preferred)
$c = Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/admin/commit" `
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
> $v = Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/admin/validate" `
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
Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/endpoints/" |
  Where-Object { $_.path -like '*conversation*' } |
  Select-Object id, path

# Step 2 — fetch the offending screen, correct the api_calls array
$s = Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/screens/JpSparkChatPage"
# Replace the bad id with the exact id returned in step 1:
$s.api_calls = @("POST /api/conversation", "GET /api/chathistory/sessions")  # etc.

# Step 3 — PUT with Strip-Audit
$body = Strip-Audit $s | ConvertTo-Json -Depth 5
Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/screens/JpSparkChatPage" `
  -Method PUT -ContentType "application/json" -Body $body

# Step 4 — re-validate: count must drop to 0
$v = Invoke-RestMethod "https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/admin/validate" `
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

## 11. Data Quality & Layer Analysis Patterns

*Added March 2,2026 1:15 PM ET — v2.7*

This section documents observed patterns from live data model analysis, data quality metrics, and recommendations for agents working across multiple projects.

### Layer Population Snapshot (March 2, 2026)

Query: `GET /model/agent-summary` returns 4,173 objects across 31 base layers + Evidence Layer (L31):

| Layer | Count | Purpose | Data Quality Notes |
|---|---|---|---|
| **wbs** | 3,088 | Work breakdown structure (stories, features, epics) | **CRITICAL**: Only 8% have `sprint` populated; 49% have `ado_id`; 0% have `assignee` or `epic` |
| **literals** | 458 | UI translation strings | Well-populated; keys follow pattern `{screen}.{section}.{element}` |
| **endpoints** | 187 | API route inventory | **GOOD**: 100% have `status`; 85%+ have `auth` and `implemented_in` |
| **screens** | 50 | Frontend component inventory | **GOOD**: `api_calls` array populated for 92% |
| **projects** | 53 | Portfolio registry | **GOOD**: All 53 have `maturity` and `description` |
| **services** | 36 | Backend/frontend microservices | **GOOD**: 100% have `port` and `type` |
| **schemas** | 39 | Cosmos container schemas + TS types | Well-documented; links endpoints to data models |
| **components** | 32 | React/UI components | **GOOD**: `used_by_screens` populated for 78% |
| **requirements** | 29 | Functional requirements | Moderate quality; 60% linked to WBS stories |
| **ts_types** | 26 | TypeScript type definitions | **GOOD**: `repo_path` accurate for 100% |
| **infrastructure** | 23 | Azure resources | **GOOD**: Each entry has `resource_type` and `resource_group` |
| **sprints** | 20 | Sprint records | **CRITICAL**: Many WBS stories not linked to sprint records |
| **hooks** | 19 | React hooks inventory | **GOOD**: `calls_endpoints` array populated |
| **feature_flags** | 15 | Feature gating | Well-maintained; each has `enabled_for` array |
| **agents** | 13 | AI agents registry | **NEW**: GitHub Copilot registered (March 2, 2026) |
| **containers** | 13 | Cosmos DB containers | **GOOD**: 100% have `partition_key` and `fields` array |
| **personas** | 10 | User personas + RBAC roles | Complete; links to feature_flags |
| **security_controls** | 10 | Auth policies | Well-documented |
| **cp_skills** | 7 | Control plane skills (38-ado-poc) | Project-specific; may expand |
| **prompts** | 5 | Agent system prompts | Small but complete |
| **risks** | 5 | Portfolio risks | Needs more entries |
| **mcp_servers** | 4 | MCP server inventory (29-foundry) | Growing; 4 servers documented |
| **milestones** | 4 | Portfolio milestones | Minimal; sprint-level tracking used instead |
| **decisions** | 4 | Architectural decision records (ADR) | Needs more documentation |
| **cp_agents** | 4 | Control plane agents | Project-specific (38-ado-poc) |
| **runbooks** | 4 | Operational runbooks | Needs expansion |
| **planes** | 3 | Control planes (data, control, admin) | Complete |
| **environments** | 3 | Dev, staging, prod configs | Complete |
| **connections** | 4 | Service-to-service integrations | Moderate documentation |
| **cp_workflows** | 2 | Control plane workflows | Minimal; expanding |
| **cp_policies** | 3 | Control plane policies | Complete |
| **evidence** | 1 | DPDCA completion receipts (L31) | **NEW**: Deployed March 2, 2026; 1 test record |

### Critical Data Quality Issues & Remediation

#### Issue 1: WBS Layer — Missing Sprint Assignments (92% gap)

**Problem**: Only 8% (247/3,088) of WBS stories have `sprint` populated.

**Impact**:
- Sprint velocity calculations incomplete
- Story prioritization unclear
- Retrospectives lack data

**Root cause**: `seed-from-plan.py` does not infer sprint from PLAN.md headers; relies on explicit `sprint=` field.

**Remediation**:
```powershell
# For each project, run:
cd C:\AICOE\eva-foundry\{PROJECT}
C:\AICOE\.venv\Scripts\python.exe C:\AICOE\eva-foundry\37-data-model\scripts\seed-from-plan.py --reseed-model

# Then manually assign current sprint:
$stories = Invoke-RestMethod "$base/model/wbs/" | Where-Object {$_.project -eq "31-eva-faces" -and -not $_.sprint}
foreach ($story in $stories) {
    $story.sprint = "Sprint-12"  # current sprint
    $body = $story | Select-Object * -ExcludeProperty layer,modified_by,modified_at,created_by,created_at,row_version,source_file | ConvertTo-Json -Depth 10
    Invoke-RestMethod "$base/model/wbs/$($story.id)" -Method PUT -Body $body -ContentType "application/json" -Headers @{"X-Actor"="agent:sprint-planner"}
}
```

**Agent guidance**: When creating WBS records, ALWAYS populate `sprint` field with current sprint ID (e.g., "Sprint-12", "ACA-S11").

#### Issue 2: WBS Layer — No ADO Sync for 51% of Stories

**Problem**: Only 49% (1,509/3,088) of WBS stories have `ado_id` populated.

**Impact**:
- ADO board out of sync with data model
- Manual reconciliation required
- Work item queries incomplete

**Root cause**: ADO sync is manual; no automated bidirectional sync implemented yet.

**Remediation**:
```powershell
# Query stories missing ADO IDs:
$missing_ado = Invoke-RestMethod "$base/model/wbs/" | Where-Object {-not $_.ado_id -and $_.project -eq "51-ACA"}

# For 38-ado-poc integration:
# Use ado-generate-artifacts.ps1 to create ADO work items, then backfill ado_id
cd C:\AICOE\eva-foundry\38-ado-poc
pwsh scripts\ado-generate-artifacts.ps1 -Project "51-ACA" -Sprint "ACA-S11"
# Captures returned work item IDs and PUTs back to WBS layer
```

**Agent guidance**: After creating ADO work items via 38-ado-poc, immediately PUT the `ado_id` back to WBS layer.

#### Issue 3: WBS Layer — No Ownership Tracking (0% assignee population)

**Problem**: `assignee` field is 0% populated across all 3,088 WBS records.

**Impact**:
- No accountability tracking
- Cannot query "my stories" or "agent X's stories"
- Load balancing impossible

**Root cause**: Field exists in schema but never populated by any agent.

**Remediation**:
```powershell
# Backfill assignees for completed stories (use git blame or modified_by):
$completed = Invoke-RestMethod "$base/model/wbs/" | Where-Object {$_.status -eq "done" -and -not $_.assignee}

foreach ($story in $completed) {
    # Infer assignee from modified_by (fallback: "unassigned")
    $story.assignee = if ($story.modified_by) { $story.modified_by } else { "unassigned" }
    $body = $story | Select-Object * -ExcludeProperty layer,modified_by,modified_at,created_by,created_at,row_version,source_file | ConvertTo-Json -Depth 10
    Invoke-RestMethod "$base/model/wbs/$($story.id)" -Method PUT -Body $body -ContentType "application/json" -Headers @{"X-Actor"="agent:backfill"}
}
```

**Agent guidance**: When completing a story, set `assignee` to your agent ID (e.g., `"agent:github-copilot"`).

#### Issue 4: WBS Layer — No Epic Hierarchy (0% epic population)

**Problem**: `epic` field is 0% populated; no feature-to-epic rollup.

**Impact**:
- Cannot query "all stories in Epic X"
- No portfolio-level progress tracking
- Feature dependencies unclear

**Root cause**: Epic tracking happens in ADO only; not reflected in data model.

**Remediation**:
```powershell
# Map features (F37-FK-001, F37-FK-002) to epics:
$features = Invoke-RestMethod "$base/model/wbs/" | Where-Object {$_.id -like "*-FK-*"}

foreach ($feature in $features) {
    # Infer epic from PLAN.md phase headers (e.g., Phase 3 -> Epic-3)
    $epic_num = [regex]::Match($feature.description, "Phase (\d+)").Groups[1].Value
    if ($epic_num) {
        $feature.epic = "$($feature.project)-Epic-$epic_num"
        $body = $feature | Select-Object * -ExcludeProperty layer,modified_by,modified_at,created_by,created_at,row_version,source_file | ConvertTo-Json -Depth 10
        Invoke-RestMethod "$base/model/wbs/$($feature.id)" -Method PUT -Body $body -ContentType "application/json" -Headers @{"X-Actor"="agent:epic-mapper"}
    }
}
```

**Agent guidance**: Use epic naming pattern `{PROJECT}-Epic-{NUMBER}` (e.g., `51-ACA-Epic-15`).

### Graph Navigation Patterns

The graph endpoint (`GET /model/graph?node_id=X&depth=N`) enables relationship traversal for impact analysis and discovery.

#### Pattern 1: Service → Endpoints → Screens → Hooks (Forward blast radius)

**Use case**: "What breaks if I change service eva-brain-api?"

```powershell
$graph = Invoke-RestMethod "$base/model/graph/?node_id=eva-brain-api&depth=3"
Write-Host "Nodes in blast radius: $($graph.nodes.Count)"
Write-Host "Edges (relationships): $($graph.edges.Count)"

# Typical result: 249 nodes, 180+ edges
# Layers touched: endpoints (20+), screens (15+), hooks (10+), containers (5+)
```

**Analysis** (eva-brain-api example):
- Depth=1: 20 endpoints directly owned by service
- Depth=2: 35 screens that call those endpoints
- Depth=3: 42 hooks used by those screens

**Agent action**: Before refactoring eva-brain-api routes, query depth=3 to identify all downstream screens requiring updates.

#### Pattern 2: Container → Endpoints → Services (Reverse dependency tracking)

**Use case**: "What breaks if I change Cosmos container `jobs`?"

```powershell
$graph = Invoke-RestMethod "$base/model/graph/?node_id=jobs&depth=2"
$endpoints = $graph.nodes | Where-Object {$_.layer -eq "endpoints"}
$services = $graph.nodes | Where-Object {$_.layer -eq "services"}

Write-Host "Endpoints reading/writing container 'jobs': $($endpoints.Count)"
Write-Host "Services affected: $($services.Count | Select-Object -Unique)"
```

**Agent action**: Before modifying container schema, identify all endpoints with `cosmos_reads` or `cosmos_writes` including that container.

#### Pattern 3: Sprint → Stories → Evidence (DPDCA audit trail)

**Use case**: "Show all proof-of-completion for Sprint ACA-S11"

```powershell
$graph = Invoke-RestMethod "$base/model/graph/?node_id=ACA-S11&depth=2"
$stories = $graph.nodes | Where-Object {$_.layer -eq "wbs"}
$evidence = $graph.nodes | Where-Object {$_.layer -eq "evidence"}

Write-Host "Sprint ACA-S11: $($stories.Count) stories, $($evidence.Count) evidence receipts"
Write-Host "Completion rate: $(($evidence.Count / $stories.Count * 100).ToString('F1'))%"
```

**Agent action**: At sprint close, verify every done story has corresponding evidence receipt (phases D, P, D, C, A).

#### Pattern 4: Agent → Modified Objects (Audit: "What did agent X change?")

**Use case**: "Show all changes made by github-copilot agent"

```powershell
# Not via graph; use modified_by audit field instead:
$changes = @()
$layers = @("wbs", "endpoints", "screens", "hooks", "components", "agents", "evidence")

foreach ($layer in $layers) {
    $objects = Invoke-RestMethod "$base/model/$layer/" | Where-Object {$_.modified_by -eq "agent:github-copilot"}
    $changes += $objects | ForEach-Object { [PSCustomObject]@{layer=$layer; id=$_.id; modified_at=$_.modified_at; row_version=$_.row_version} }
}

$changes | Sort-Object modified_at -Descending | Select-Object -First 20 | Format-Table
```

**Agent action**: After a session, query your own modifications to verify all model updates were committed.

### Veritas Integration (EVA Veritas MCP)

`48-eva-veritas` provides zero-config requirements traceability. Run via MCP or CLI:

```bash
# Audit 37-data-model project:
node C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js audit --repo C:\AICOE\eva-foundry\37-data-model

# Output written to .eva/trust.json:
{
  "score": 74,              # MTI (Maintainability-Traceability Index)
  "components": {
    "coverage": 0.66,       # 66% of stories have artifacts
    "evidenceCompleteness": 0.58,  # 58% have evidence receipts
    "consistencyScore": 1.0 # 100% consistent (no orphan tags)
  },
  "actions": ["test", "review", "merge-with-approval"]
}
```

**MTI Formula** (v2.7 update — March 2, 2026):
```
MTI = (coverage * 0.50) + (evidenceCompleteness * 0.20) + (consistencyScore * 0.30)

Where:
- coverage = (stories with artifacts) / (total stories)
- evidenceCompleteness = (stories with evidence receipts) / (total done stories)
- consistencyScore = 1 - (orphan EVA-STORY tags / total tags)
```

**Threshold**:
- Sprint 1-2: MTI >= 30 (learning phase)
- Sprint 3+: MTI >= 70 (production quality)

**Gaps reported by Veritas**:
- **Missing artifacts**: Stories marked `done` but no files reference them in EVA-STORY tags
- **Missing evidence**: Stories marked `done` but no evidence receipt in `.eva/evidence/` or Evidence Layer (L31)
- **Orphan tags**: EVA-STORY tags in code that don't match any story ID in PLAN.md

**Agent action after Veritas audit**:

1. **If MTI < 70**: Do not merge. Fix gaps first.
   ```powershell
   # Query gaps:
   $trust = Get-Content ".eva/trust.json" | ConvertFrom-Json
   $trust.gaps | ForEach-Object { "- $($_.type): $($_.story_id) in $($_.file)" }
   ```

2. **Add missing EVA-STORY tags**:
   ```python
   # In every file you modify for story ACA-14-001:
   # EVA-STORY: ACA-14-001 — Implement checkout router with SAS token generation
   ```

3. **Create evidence receipt** (if Evidence Layer deployment active):
   ```powershell
   # Use EvidenceBuilder from 37-data-model:
   from evidence_generator import EvidenceBuilder
   
   receipt = (EvidenceBuilder("ACA-14-001", "ACA-S11", "C")
       .add_validation(test_result="PASS", lint_result="PASS", coverage_percent=87)
       .add_metrics(duration_ms=45000, files_changed=8)
       .add_artifact("services/checkout.py", "modified")
       .build())
   
   # PUT to Evidence Layer:
   Invoke-RestMethod "$base/model/evidence/ACA-S11-ACA-14-001-C" -Method PUT -Body ($receipt | ConvertTo-Json -Depth 10) -ContentType "application/json" -Headers @{"X-Actor"="agent:github-copilot"}
   ```

4. **Re-run Veritas audit**: MTI should increase. Repeat until >= 70.

### Veritas-Model-ADO Workflow Enhancements

**Current State**: Data quality analysis (March 2, 2026) revealed critical gaps in WBS field population:
- 92% of stories missing sprint assignments
- 51% missing ADO work item sync (ado_id)
- 0% ownership tracking (assignee field)
- 0% epic hierarchy (epic field)

**Target State**: Automated Veritas-Model-ADO integration workflow that enforces data quality gates before allowing story completion.

#### Enhancement 1: Automated ADO Bidirectional Sync

**Status**: ✅ COMPLETE (March 2, 2026 2:15 PM ET — [Script](https://github.com/eva-foundry/38-ado-poc/blob/main/scripts/ado-bidirectional-sync.ps1) + [Workflow](https://github.com/eva-foundry/38-ado-poc/blob/main/.github/workflows/ado-sync.yml))

**Problem**: Manual ADO sync causes drift between data model WBS layer and ADO work items.

**Solution**: Automate bidirectional sync as part of sprint planning workflow:

**Implementation** (38-ado-poc [scripts/ado-bidirectional-sync.ps1](https://github.com/eva-foundry/38-ado-poc/blob/main/scripts/ado-bidirectional-sync.ps1)):

1. **Pull Mode (ADO → WBS)**: Update WBS layer with ADO metadata
   - Query ADO work items with `Custom.StoryId` field via WIQL
   - Extract: `ado_id`, `sprint` (from IterationPath), `assignee` (from AssignedTo), `status` (from State)
   - Map ADO State to WBS status: New→planned, Approved/Committed→in-progress, Done→done
   - PUT to `/model/wbs/{story-id}` for each matched work item
   - Idempotency: Skips stories already in sync (compares field values before PUT)

2. **Push Mode (WBS → ADO)**: Create ADO work items for stories with sprint but no ado_id
   - Query `/model/wbs/` for stories where `sprint != null AND ado_id == null`
   - Check if work item already exists (WIQL query by title) to avoid duplicates
   - Create ADO Product Backlog Item with:
     - Title: `{story-id} - {title}`
     - Custom.StoryId: `{story-id}` (for Pull sync matching)
     - IterationPath: Mapped from sprint (e.g., "Sprint-11" → "eva-poc\Sprint 11")
     - Description: Story description
   - Backfill `ado_id` in WBS after creation

3. **Scheduling**: GitHub Actions workflow (`.github/workflows/ado-sync.yml`)
   - Cron: Every 4 hours (`0 */4 * * *`)
   - Manual trigger: `workflow_dispatch` with mode/project/dry-run parameters
   - Runs both Pull and Push in sequence (Mode=Both)

4. **Error Handling**:
   - Graceful failures: Continues if Custom.StoryId field doesn't exist in ADO
   - Array safety: Ensures all collections wrapped with `@()` for .Count property
   - Retry logic: HTTP 429/503 retried once with 2s delay
   - Logs: Transcript saved to `scripts/logs/{timestamp}-ado-sync-{mode}.log`

**Usage Examples**:

```powershell
# Dry-run both modes on all projects
.\scripts\ado-bidirectional-sync.ps1 -Mode Both -DryRun

# Pull only for specific project
.\scripts\ado-bidirectional-sync.ps1 -Mode Pull -Project "37-data-model"

# Push with verbose output
.\scripts\ado-bidirectional-sync.ps1 -Mode Push -Verbose

# Via GitHub Actions (manual trigger)
# Go to Actions → ADO Bidirectional Sync → Run workflow
# Select mode: Both, Pull, or Push
# Optional: Filter by project
```

**Conceptual flow (actual implementation in script)**:

```powershell
# Scheduled sync (runs every 4 hours via GitHub Actions or Azure Function):
# C:\AICOE\eva-foundry\38-ado-poc\scripts\ado-bidirectional-sync.ps1

# Pull from ADO → Update WBS layer:
# - Query ADO for all work items in active sprints
# - For each work item with matching story ID in title/description:
#   - PUT to /model/wbs/{story-id} with ado_id, sprint, assignee, status from ADO
# - Track sync operations in sync_log for audit

# Push from WBS layer → Create/Update ADO:
# - Query /model/wbs/ for stories with sprint != null AND ado_id == null
# - Create ADO work items via REST API
# - Capture work item IDs and PUT back to WBS layer
```

**Integration point**: Added to `38-ado-poc` control plane as automated workflow (CP Workflow: ado-sync).

**Veritas gate**: Before marking story `status=done`, verify `ado_id` is populated. If missing, block completion with error: "Story cannot be marked done without ADO work item linkage."

#### Enhancement 2: Enrich seed-from-plan.py Metadata Extraction

**Status**: ✅ COMPLETE (March 2, 2026 1:50 PM ET — [Commit c2eccd3](https://github.com/eva-foundry/37-data-model/commit/c2eccd3))

**Problem**: `seed-from-plan.py` extracts minimal metadata (id, title, status only). PLAN.md often contains sprint/epic context in section headers that is ignored.

**Solution**: Enhance parser to infer metadata from PLAN.md structure:

```python
# Enhancement in scripts/seed-from-plan.py:
# 1. Detect sprint headers (## Sprint 11, ## Phase 3 Sprint 11-12)
#    → Set story.sprint = "Sprint-11" for all stories until next sprint header
# 2. Detect epic headers (## Epic 15: User Management)
#    → Set story.epic = "PROJECT-Epic-15" for all features/stories under that epic
# 3. Parse assignee from task descriptions (- [ ] Implement X (@agent:github-copilot))
#    → Set story.assignee = "agent:github-copilot"
# 4. Parse blockers from dependency notes (BLOCKED: waiting for Story X)
#    → Set story.blockers = ["Story-X"]
```

**Example PLAN.md with metadata:**
```markdown
## Phase 3: Backend Foundation

### Epic 15: User Management (@sprint:ACA-S11)

#### [ACA-15-001] User authentication service
- Assignee: @agent:github-copilot
- Sprint: ACA-S11
- Blockers: ACA-14-003 (database schema)

...
```

**Result**: Stories seeded with pre-populated sprint, epic, assignee, blockers fields → reduces manual backfill by 80%+.

**Integration point**: Update `seed-from-plan.py` with new parser logic; add `--extract-metadata` flag (default: enabled).

#### Enhancement 3: Veritas Quality Gates for Field Population

**Status**: ✅ COMPLETE (March 2, 2026 2:10 PM ET — [Commit 6ac756c](https://github.com/eva-foundry/48-eva-veritas/commit/6ac756c))

**Problem**: Stories can be marked `status=done` without sprint/assignee/ado_id populated, breaking workflow integrity.

**Solution**: Add Veritas audit rules to enforce field population before done status:

**Implementation** (48-eva-veritas [6ac756c](https://github.com/eva-foundry/48-eva-veritas/commit/6ac756c)):
1. **New Module**: `src/lib/wbs-quality-gates.js` (240 lines)
   - `checkWbsQualityGates()`: Validates sprint, assignee, ado_id for done stories
   - `computeFieldPopulationScore()`: Calculates avg population rate (sprint+assignee+ado_id)/3 for MTI
   - Queries data model API for live WBS data (no local file dependency)
   - Returns violations array with story IDs and missing fields

2. **Audit Integration**: `src/audit.js`
   - Runs quality gate check after reconcile, before computeTrust
   - Logs violations (first 10 shown, "+ N more" if > 10)
   - Writes `quality_gates` object to trust.json for report inclusion
   - Non-fatal: continues audit even if quality gates fail
   - Skippable: `--skip-quality-gates` flag to disable check

3. **MTI Formula Upgrade**: `src/lib/trust.js` (4-component → 5-component)
   - Added `fieldPopulationScore` as 5th component (10% weight)
   - Formula progression:
     * 5-component: coverage 35%, evidence 20%, consistency 25%, complexity 10%, field_population 10%
     * 4-component-field-population: coverage 40%, evidence 20%, consistency 30%, field_population 10%
     * 4-component-complexity: coverage 40%, evidence 20%, consistency 25%, complexity 15%
     * 3-component-fallback: coverage 50%, evidence 20%, consistency 30%

4. **Trust Computation**: `src/compute-trust.js`
   - Fetches field population score from data model API before computing MTI
   - Passes `fieldPopulationScore` as 3rd parameter to `computeTrustScore()`
   - Logs: "[INFO] Field population score: 87% (sprint, assignee, ado_id)"

**Test Result** (37-data-model):
```powershell
node src/cli.js audit --repo C:\AICOE\eva-foundry\37-data-model
# [PASS] WBS quality gates: all 0 done stories have required fields
# [INFO] Field population score: 0% (sprint, assignee, ado_id)
# MTI Score: 74 (PASS, threshold 70) - formula=3-component-fallback
```

**Conceptual example of quality gate logic:**

```javascript
// Simplified logic (actual implementation in src/lib/wbs-quality-gates.js):

export const wbsQualityGates = {
  "wbs-field-population": {
    severity: "error",
    check: (story) => {
      if (story.status !== "done") return { pass: true };
      
      const errors = [];
      if (!story.sprint) errors.push("sprint field required for done stories");
      if (!story.assignee) errors.push("assignee field required for done stories");
      if (!story.ado_id) errors.push("ado_id field required for done stories (ADO linkage)");
      
      return errors.length === 0 
        ? { pass: true }
        : { pass: false, message: `Story ${story.id} cannot be marked done: ${errors.join(", ")}` };
    }
  }
};
```

**Veritas audit output with gate violations:**
```bash
node C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js audit --repo C:\AICOE\eva-foundry\51-ACA

# [FAIL] WBS Quality Gate Violations (3 stories):
# - ACA-14-002: status=done but sprint=null, assignee=null, ado_id=null
# - ACA-14-007: status=done but assignee=null
# - ACA-14-009: status=done but ado_id=null (no ADO linkage)
#
# MTI Score: 62 (FAIL, threshold 70) — blocked by quality gate violations
# Actions: ["fix-wbs-fields", "blocked"]
```

**CI/CD Integration**: Add to GitHub Actions merge gate in `.github/workflows/veritas-gate.yml`:

```yaml
- name: Veritas Quality Gate
  run: |
    node C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js audit --repo ${{ github.workspace }}
    if [ $? -ne 0 ]; then
      echo "::error::Veritas quality gates failed. Fix WBS field population before merge."
      exit 1
    fi
```

**Result**: PRs cannot merge if stories are marked done without required metadata → enforces workflow discipline.

**Integration point**: Add quality gate rules to `48-eva-veritas/src/rules/`; update MTI calculation to include `fieldPopulationScore` component.

#### Recommended Implementation Order

1. **Week 1**: Enhance `seed-from-plan.py` → immediate improvement for new projects (Enhancement 2)
2. **Week 2**: Add Veritas quality gates → enforce field population going forward (Enhancement 3)
3. **Week 3**: Build ADO bidirectional sync → backfill existing stories + automate future sync (Enhancement 1)

**Success Metrics**:
- WBS `sprint` field population: target 95%+ (current: 8%)
- WBS `ado_id` field population: target 95%+ (current: 49%)
- WBS `assignee` field population: target 90%+ (current: 0%)
- WBS `epic` field population: target 80%+ (current: 0%)
- MTI score consistently >= 70 across all projects

### Agents Layer Registry

`GET /model/agents/` now includes **13 registered agents** (as of March 2, 2026):

| Agent ID | Label | Type | Capabilities | Status |
|---|---|---|---|---|
| `github-copilot` | GitHub Copilot | coding-assistant | code-generation, rca, incident-response, data-model-sync | active |
| `conversation-agent` | Conversation Agent | chatbot | natural-language, query-answering | active |
| `screen-generator` | Screen Generator | code-generator | screen-scaffolding, fluent-ui | active |
| `test-generator` | Test Generator | code-generator | vitest, pytest, unit-tests | active |
| `validator` | Validator | qa-agent | schema-validation, lint-checking | active |
| *(9 others)* | *(various)* | *(various)* | *(various)* | active |

**Key fields**:
- `capabilities`: Array of strings (code-generation, rca, etc.)
- `technology_stack`: Array of tools used (VS Code, PowerShell, etc.)
- `last_session`: RFC3339 timestamp of most recent activity
- `version`: Model version (e.g., "Claude Sonnet 4.5")
- `notes`: Session history summary

**Agent action**: When starting a new agent type, register it:
```powershell
$newAgent = @{
    id = "my-custom-agent"
    label = "My Custom Agent"
    type = "automation"
    capabilities = @("script-generation", "deployment", "monitoring")
    status = "active"
    version = "1.0"
    last_session = (Get-Date -Format "o")
} | ConvertTo-Json -Depth 5

Invoke-RestMethod "$base/model/agents/my-custom-agent" -Method PUT -Body $newAgent -ContentType "application/json" -Headers @{"X-Actor"="agent:my-custom-agent"}
```

### Recommended Agent Workflows

#### Workflow 1: Feature Implementation (Full DPDCA Cycle)

1. **Discover (D1)**: Query data model for context
   ```powershell
   # What service owns this feature?
   $service = Invoke-RestMethod "$base/model/services/{service-id}"
   
   # What endpoints already exist?
   $endpoints = Invoke-RestMethod "$base/model/endpoints/" | Where-Object {$_.service -eq "{service-id}"}
   
   # What screens will call my new endpoint?
   $screens = Invoke-RestMethod "$base/model/screens/" | Where-Object {$_.api_calls -contains "POST /v1/my-endpoint"}
   ```

2. **Plan (P)**: Create WBS record + evidence receipt (planning phase)
   ```powershell
   # Ensure story exists in WBS:
   $story = Invoke-RestMethod "$base/model/wbs/{STORY-ID}"
   if (-not $story) { Write-Error "Story not in WBS — run seed-from-plan.py first" }
   
   # Record planning evidence:
   Invoke-RestMethod "$base/model/evidence/{SPRINT}-{STORY-ID}-P" -Method PUT -Body $planReceipt -Headers @{"X-Actor"="agent:github-copilot"}
   ```

3. **Do (D3)**: Implement feature, tag all files
   ```python
   # In every modified file:
   # EVA-STORY: ACA-14-001 — Implement feature X
   ```

4. **Check (C)**: Run tests, create evidence receipt with results
   ```powershell
   pytest services/tests/ --json-report --json-report-file=test-results.json
   
   # Parse results and create evidence:
   $results = Get-Content test-results.json | ConvertFrom-Json
   $receipt = EvidenceBuilder("ACA-14-001", "ACA-S11", "C")
       .add_validation($results.summary.passed ? "PASS" : "FAIL", "PASS", $results.summary.coverage)
       .build()
   
   Invoke-RestMethod "$base/model/evidence/ACA-S11-ACA-14-001-C" -Method PUT -Body ($receipt | ConvertTo-Json) -Headers @{"X-Actor"="agent:github-copilot"}
   ```

5. **Act (A)**: Update WBS status, close loop
   ```powershell
   $story = Invoke-RestMethod "$base/model/wbs/ACA-14-001"
   $story.status = "done"
   $body = $story | Select-Object * -ExcludeProperty layer,modified_by,modified_at,created_by,created_at,row_version,source_file | ConvertTo-Json -Depth 10
   Invoke-RestMethod "$base/model/wbs/ACA-14-001" -Method PUT -Body $body -Headers @{"X-Actor"="agent:github-copilot"}
   
   # Commit data model changes:
   Invoke-RestMethod "$base/model/admin/commit" -Method POST -Headers @{"Authorization"="Bearer dev-admin"}
   ```

6. **Veritas**: Verify MTI >= 70
   ```bash
   node C:\AICOE\eva-foundry\48-eva-veritas\src\cli.js audit --repo C:\AICOE\eva-foundry\51-ACA
   # Expected: MTI >= 70, no gaps
   ```

#### Workflow 2: Incident Response (RCA + Resolution)

1. **Discover**: Identify symptom and affected components
   ```powershell
   # Example: Cosmos DB empty (March 2, 2026 incident)
   $summary = Invoke-RestMethod "$base/model/agent-summary"
   # Symptom: total=0, all layers=-1
   ```

2. **Root Cause Analysis**: Query graph for dependencies
   ```powershell
   # What changed recently?
   $recentChanges = Invoke-RestMethod "$base/model/endpoints/" | Where-Object {$_.modified_at -gt "2026-03-01"}
   
   # What services connect to Cosmos?
   $graph = Invoke-RestMethod "$base/model/graph/?node_id=marco-sandbox-cosmos&depth=2"
   ```

3. **Document RCA**: Create RCA-*.md file with timeline, hypotheses, root cause

4. **Fix**: Execute remediation (e.g., key rotation, re-seed)

5. **Verify**: Confirm resolution
   ```powershell
   $summary = Invoke-RestMethod "$base/model/agent-summary"
   # Expected: total > 0, all layers positive
   ```

6. **Update model**: Register yourself as agent, record incident
   ```powershell
   # Register agent:
   Invoke-RestMethod "$base/model/agents/github-copilot" -Method PUT -Body $agentRecord -Headers @{"X-Actor"="agent:github-copilot"}
   
   # Update STATUS.md with incident resolution
   ```

---



*Model root:* `C:\AICOE\eva-foundation\37-data-model`  
*ACA endpoint (primary):* `https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io`  
*Interactive API docs (local dev):* `https:\\/\\/marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/docs`  
*Browser UI:* `portal-face /model` (layer browser) + `portal-face /model/report` (reports) -- requires `view:model` permission  
*Last updated:* March 2, 2026 1:15 PM ET — v2.7 — Layer analysis, data quality patterns, Veritas integration  
*Questions -> AI Centre of Excellence*
