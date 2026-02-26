# EVA Data Model — Agent User Guide

**Version:** 2.5  
**Last Updated:** February 25, 2026 10:14 ET · v2.5 — ACA endpoint is now primary (no localhost default); Browser UI shipped in portal-face (/model + /model/report); localhost:8010 demoted to local-dev fallback; veritas model_audit default updated to ACA  
**Audience:** AI agents (GitHub Copilot, Claude, custom skills) executing work on the EVA project  
**Model state:** as of 2026-02-25 10:14 ET: 27 layers · 186 endpoints · 46 screens · 375 literals · 960 total objects · query `/model/agent-summary` for live counts

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
9. [Quick Reference](#9-quick-reference)

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

# One-call state check: all 27 layer counts + total objects
Invoke-RestMethod "$base/model/agent-summary"
# Returns: {layers:{services:22,endpoints:186,...,projects:50,...}, total:962, cache_ttl:0}
# Use this instead of querying each layer separately.
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

## 9. Quick Reference

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
| `GET https://marco-sandbox-apim.azure-api.net/data-model/model/agent-summary` | 866 objects, 27 layers |
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
