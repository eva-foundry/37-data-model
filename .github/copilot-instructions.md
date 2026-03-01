# GitHub Copilot Instructions -- EVA Data Model

**Template Version**: 3.3.2
**Last Updated**: February 28, 2026
**Project**: EVA Data Model -- Single source of truth API (port 8010)
**Path**: `C:\AICOE\eva-foundry\37-data-model\`
**Stack**: Python, FastAPI, SQLite

> This file is the Copilot operating manual for this repository.
> PART 1 is universal -- identical across all EVA Foundation projects.
> PART 2 is project-specific -- customise the placeholders before use.

---

## PART 1 -- UNIVERSAL RULES
> Applies to every EVA Foundation project. Do not modify.

---

### 1. Session Bootstrap (run in this order, every session)

Before answering any question or writing any code:

1. **Establish $base** (ACA primary -- run the bootstrap block in Section 3.1 first):
   - ACA (24x7, Cosmos-backed, no auth): `https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io`
   - Local dev fallback only: `http://localhost:8010`
   - `$base` must be set before any model query in this session.

2. **Read this project's governance docs** (in order):
   - `README.md` -- identity, stack, quick start
   - `PLAN.md` -- phases, current phase, next tasks
   - `STATUS.md` -- last session snapshot, open blockers
   - `ACCEPTANCE.md` -- DoD checklist, quality gates (if exists)
   - Latest `docs/YYYYMMDD-plan.md` and `docs/YYYYMMDD-findings.md` (if exists)

3. **Read the skills index** (if `.github/copilot-skills/` exists):
   - List files: `Get-ChildItem .github/copilot-skills/ -Filter "*.skill.md" | Select-Object Name`
   - Read `00-skill-index.skill.md` or the first skill matching the current task's trigger phrase
   - Each skill has a `triggers:` YAML block -- match it to the user's intent

4. **Query the data model** for this project's record:
   ```powershell
   Invoke-RestMethod "$base/model/projects/{PROJECT_FOLDER}" | Select-Object id, maturity, notes
   ```

5. **Produce a Session Brief** -- one paragraph: active phase, last test count, next task, open blockers.
   Do not skip this. Do not start implementing before the brief is written.

---

### 2. DPDCA Execution Loop

Every session runs this cycle. Do not skip steps.

```
Discover  --> synthesise current sprint from plan + findings docs
Plan      --> pick next unchecked task from yyyymmdd-plan.md checklist
Do        --> implement -- make the change, do not just describe it
Check     --> run the project test command (see PART 2); must exit 0
Act       --> update STATUS.md, PLAN.md, yyyymmdd-plan.md, findings doc
Loop      --> return to Discover if tasks remain
```

**Execution Rule**: Make the change. Do not propose, narrate, or ask for permission on a step you can determine yourself. If uncertain about scope, ask one clarifying question then proceed.

---

### 3. EVA Data Model API -- Mandatory Protocol

> **GOLDEN RULE**: The `model/*.json` files are an internal implementation detail of the API server.
> Agents must never read, grep, parse, or reference them directly -- not even to "check" something.
> The HTTP API is the only interface. One HTTP call beats ten file reads.
> The API self-documents: `GET /model/agent-guide` returns the complete operating protocol.

> **Full reference**: `C:\AICOE\eva-foundry\37-data-model\USER-GUIDE.md` (v2.5)
> The model is the single source of truth. One HTTP call beats 10 file reads.
> Never grep source files for something the model already knows.

#### 3.1  Bootstrap

```powershell
# Primary -- ACA (24x7 Cosmos-backed, no auth required, always up)
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$h = Invoke-RestMethod "$base/health" -ErrorAction SilentlyContinue
# Local fallback -- only if ACA is in a rare maintenance window
if (-not $h) {
    $base = "http://localhost:8010"
    $h = Invoke-RestMethod "$base/health" -ErrorAction SilentlyContinue
    if (-not $h) {
        $env:PYTHONPATH = "C:\AICOE\eva-foundry\37-data-model"
        Start-Process "C:\AICOE\.venv\Scripts\python.exe" `
            "-m uvicorn api.server:app --port 8010 --reload" -WindowStyle Hidden
        Start-Sleep 4
    }
}
# Readiness check
$r = Invoke-RestMethod "$base/ready" -ErrorAction SilentlyContinue
if (-not $r.store_reachable) { Write-Warning "Cosmos unreachable -- check COSMOS_URL/KEY" }
# The API self-documents -- read the agent guide before doing anything
Invoke-RestMethod "$base/model/agent-guide"
# One-call state check -- all 27 layer counts + total objects
Invoke-RestMethod "$base/model/agent-summary"
```

**Azure APIM (CI / cloud agents):**
```powershell
$base = "https://marco-sandbox-apim.azure-api.net/data-model"
$hdrs = @{"Ocp-Apim-Subscription-Key" = $env:EVA_APIM_KEY}
Invoke-RestMethod "$base/model/agent-summary" -Headers $hdrs
```

#### 3.2  Query Decision Table

| You want to know... | One-turn API call | FORBIDDEN (costs 10 turns) |
|---|---|---|
| Browse all layers + objects visually | portal-face `/model` (requires `view:model` permission) | grep model/*.json |
| Report: overview / endpoint matrix / edge types | portal-face `/model/report` | build ad-hoc queries |
| All layer counts | `GET /model/agent-summary` | query each layer separately |
| Object by ID | `GET /model/{layer}/{id}` | grep, file_search |
| All objects in a layer | `GET /model/{layer}/` | read source files |
| All ready-to-call endpoints | `GET /model/endpoints/filter?status=implemented` | grep router files |
| All unimplemented stubs | `GET /model/endpoints/filter?status=stub` | grep router files |
| Filter ANY other layer | `GET /model/{layer}/` + `Where-Object` client-side | no server filter on non-endpoint layers |
| What a screen calls | `GET /model/screens/{id}` -> `.api_calls` | read screen source |
| Auth / feature flag for endpoint | `GET /model/endpoints/{id}` -> `.auth`, `.auth_mode`, `.feature_flag` | grep auth middleware |
| Where is the route handler | `GET /model/endpoints/{id}` -> `.implemented_in`, `.repo_line` | file_search |
| Cosmos container schema | `GET /model/containers/{id}` -> `.fields`, `.partition_key` | read Cosmos config |
| What breaks if container changes | `GET /model/impact/?container=X` | trace imports manually |
| Relationship graph | `GET /model/graph/?node_id=X&depth=2` | read config files |
| Services list | `GET /model/services/` -> `obj_id, status, is_active, notes` | services uses obj_id not id; no type/port |
| Is the process alive? | `GET /health` -> `.status`, `.store`, `.version` | check process list |
| Is Cosmos reachable? | `GET /health` -> `.store` == "cosmos" means Cosmos-backed | ping Cosmos directly |
| Browse all layers + objects visually | portal-face `/model` (requires `view:model` permission) | grep model/*.json |
| Report: overview stats / endpoint matrix / edge types | portal-face `/model/report` | build ad-hoc PowerShell queries |

#### 3.3  PUT Rules -- Read Before Every Write

**Rule 1 -- Capture `row_version` BEFORE mutating (not in USER-GUIDE)**
Store it before any field changes so the confirm assert can check `previous + 1`.
```powershell
$ep      = Invoke-RestMethod "$base/model/endpoints/GET /v1/tags"
$prev_rv = $ep.row_version   # capture BEFORE mutation
$ep.status         = "implemented"
```

**Rule 2 -- Strip audit columns, keep domain fields**
Exclude: `obj_id`, `layer`, `modified_by`, `modified_at`, `created_by`, `created_at`, `row_version`, `source_file`.
`is_active` is a domain field -- keep it.
```powershell
function Strip-Audit ($obj) {
    $obj | Select-Object * -ExcludeProperty `
        obj_id, layer, modified_by, modified_at, created_by, created_at, row_version, source_file
}
```

**Rule 3 -- Assign ConvertTo-Json before piping; use -Depth 10 for nested schemas**
`-Depth 5` silently truncates `request_schema` / `response_schema` objects. Always use `-Depth 10`.
```powershell
$body = Strip-Audit $ep | ConvertTo-Json -Depth 10
Invoke-RestMethod "$base/model/endpoints/GET /v1/tags" `
    -Method PUT -ContentType "application/json" -Body $body `
    -Headers @{"X-Actor"="agent:copilot"}
```

**Rule 4 -- PATCH is not supported** -- always PUT the full object (422 otherwise).

**Rule 5 -- Endpoint id = exact string "METHOD /path"** -- never construct; copy verbatim:
```powershell
Invoke-RestMethod "$base/model/endpoints/" |
    Where-Object { $_.path -like '*translations*' } | Select-Object id, path
```

**Rule 6 -- Never call create_file on a path that already exists**
create_file on an existing file returns a hard error and makes no change.
Before any create_file, use Test-Path to check, then use replace_string_in_file or
multi_replace_string_in_file for edits to existing files.

```powershell
# Pre-flight check
if (Test-Path "C:\AICOE\path\to\file.ps1") {
    # use replace_string_in_file -- do NOT call create_file
} else {
    # safe to call create_file
}
```

**Rule 7 -- Never use PowerShell backtick (`) for line continuation**
Backtick continuations break silently when pasted into terminals, cause JSON escaping failures
in inline strings, and make diffs noisy. Always use splatting (@params) or put the command
on a single line.

WRONG -- backtick continuation (BANNED):
```
Invoke-RestMethod $url `
    -Method PUT -Body $body
```

RIGHT -- splatting:
```powershell
$p = @{ Method="PUT"; ContentType="application/json"; Body=$body; Headers=@{"X-Actor"="agent:copilot"} }
Invoke-RestMethod $url @p
```

RIGHT -- single line (acceptable for short calls):
```powershell
Invoke-RestMethod $url -Method POST -Headers @{"Authorization"="Bearer dev-admin"}
```

#### 3.4  Write Cycle -- Every Model Change

**Preferred -- 3-step (admin/commit = export + assemble + validate in one call):**
```powershell
# Step 1 -- PUT (use splatting per Rule 7)
$iwr = @{ Method="PUT"; ContentType="application/json"; Body=$body; Headers=@{"X-Actor"="agent:copilot"} }
Invoke-RestMethod "$base/model/endpoints/GET /v1/tags" @iwr

# Step 2 -- Canonical confirm: assert all three
$w = Invoke-RestMethod "$base/model/endpoints/GET /v1/tags"
$w.row_version   # must equal $prev_rv + 1
$w.modified_by   # must equal "agent:copilot"
$w.status        # must equal the value you PUT

# Step 3 -- Close the cycle
$c = Invoke-RestMethod "$base/model/admin/commit" -Method POST -Headers @{"Authorization"="Bearer dev-admin"}
$c.status          # "PASS" = done; "FAIL" = fix violations before merging
$c.violation_count # 0 = clean
# ACA note: commit returns status=FAIL with assemble.stderr="Script not found" -- EXPECTED on ACA.
# PASS conditions on ACA: violation_count=0 AND exported_total matches agent-summary.total AND export_errors.Count=0.
```

**Manual fallback (if admin/commit unavailable):**
```
POST /model/admin/export  ->  scripts/assemble-model.ps1  ->  scripts/validate-model.ps1
[FAIL] lines block; [WARN] repo_line lines (38+) are pre-existing noise -- ignore
```

**Validate only (distinguishes new violations from pre-existing noise):**
```powershell
$v = Invoke-RestMethod "$base/model/admin/validate" -Headers @{"Authorization"="Bearer dev-admin"}
$v.count       # 0 = clean; >0 = new violations to fix NOW
$v.violations  # the cross-reference FAILs -- fix these before commit
```

#### 3.5  Fix a Validation FAIL

```
Pattern: "screen 'X' api_calls references unknown endpoint 'Y'"
Root cause: api_calls used a wrong or constructed id.
```
```powershell
# Find the exact id  (never construct)
Invoke-RestMethod "$base/model/endpoints/" |
    Where-Object { $_.path -like '*conversation*' } | Select-Object id, path
# Fetch screen, replace bad id, PUT + Strip-Audit + ConvertTo-Json -Depth 10 + commit
```

#### 3.6  What to Update for Each Source Change

| Source change | Model layers to update |
|---|---|
| New FastAPI endpoint | `endpoints` + `schemas` |
| Stub -> implemented | `endpoints` -- set `status`, `implemented_in`, `repo_line` |
| New Cosmos container/field | `containers` |
| New React screen | `screens` + `literals` |
| New i18n key | `literals` |
| New hook / component | `hooks` / `components` |
| New persona / feature flag | `personas` + `feature_flags` |
| New Azure resource | `infrastructure` |
| New agent | `agents` |

> **Same-PR rule**: every source change that affects a model object must update the model
> in the same commit. Never defer. A stale model is worse than no model.

---

### 4. Encoding and Output Safety

**ASCII-ONLY -- ABSOLUTE RULE -- NO EXCEPTIONS**

This applies to every file created or edited: .md, .ps1, .py, .ts, .json, .yaml, .txt, every string literal, log line, comment, commit message, copilot-instructions file.

Forbidden output:
- Emoji (any Unicode codepoint above U+007F)
- Unicode arrows -- use ASCII -> instead
- Unicode dashes -- use -- instead
- Curly quotes -- use " or ' instead
- Non-breaking spaces
- PowerShell backtick (`) line continuation -- see Rule 7
- UTF-8 BOM in any text file

Allowed output tokens: [PASS] / [FAIL] / [WARN] / [INFO]

```python
# [FORBIDDEN] -- causes UnicodeEncodeError in enterprise Windows
print("success")   # with any emoji or unicode

# [REQUIRED] -- ASCII only
print("[PASS] Done")
print("[FAIL] Failed")
print("[INFO] Wait...")
```

- All Python scripts: PYTHONIOENCODING=utf-8 in any .bat wrapper
- All PowerShell output: [PASS] / [FAIL] / [WARN] / [INFO] -- never emoji
- Machine-readable outputs (JSON, YAML, evidence files): ASCII-only always
- Markdown docs (README, STATUS, PLAN, ACCEPTANCE, copilot-instructions): ASCII-only -- no emoji anywhere
- PowerShell scripts: no backtick (`) line continuations -- use splatting or single line (Rule 7)
---

### 5. Context Health Protocol

Maintain a mental count of Do steps (file edits, terminal commands, test runs) this session.

| Milestone | Action |
|---|---|
| Step 5  | Context health check -- answer 4 questions from memory, verify against state files |
| Step 10 | Health check + re-read SESSION-STATE.md or STATUS.md |
| Step 15 | Health check + re-read + state summary aloud |
| Every 5 after | Repeat step-10 pattern |

**4 health questions:**
1. What is the active task and its one-line description?
2. What was the last recorded test count?
3. What file am I currently editing or about to edit?
4. Have I run any terminal command I cannot account for?

**Drift signals** -- trigger immediate check:
- About to search for a file already read this session
- About to run the full test suite without isolating the failing test first
- Proposing an approach that contradicts a decision in PLAN.md
- Uncertainty about which task or sprint is active

**Recovery**: re-read STATUS.md from disk -> run baseline tests -> resume from last verified state.

---

### 6. Python Environment

```
venv exec: C:\AICOE\.venv\Scripts\python.exe
activate:  C:\AICOE\.venv\Scripts\Activate.ps1
```

Never use bare `python` or `python3`. Always use the full venv path.

---

### 7. Azure Account Pattern

- **Personal**: `{PERSONAL_SUBSCRIPTION_NAME}` -- sandbox experiments
- **Professional**: `{PROFESSIONAL_EMAIL}` -- Government of Canada / production resources
  - Dev subscription:  `{DEV_SUBSCRIPTION_ID}`
  - Prod subscription: `{PROD_SUBSCRIPTION_ID}`

If `az` fails with "subscription doesn't exist":
```powershell
az account show --query user.name
az logout; az login --use-device-code --tenant {TENANT_ID}
```

---

## PART 2 -- PROJECT-SPECIFIC: EVA Data Model

### Project Lock

This file is the copilot-instructions for **37-data-model** (EVA Data Model).

The workspace-level bootstrap rule "Step 1 -- Identify the active project from the currently open file path"
applies **only at the initial load of this file** (first read at session start).
Once this file has been loaded, the active project is locked to **37-data-model** for the entire session.
Do NOT re-evaluate project identity from editorContext or terminal CWD on each subsequent request.
Work state and sprint context are read from `STATUS.md` and `PLAN.md` at bootstrap -- not from this file.

---

<!--
  AUTO-LOADED by VS Code Copilot at every session start for this workspace.
  These rules apply to any agent reading or writing the EVA Data Model.
  Model declared GA: 2026-02-20T05:01:00-05:00  |  Last updated: 2026-02-24T23:30:00-05:00
  27/27 layers complete (L0-L26) -- E-09/E-10/E-11 provenance + graph features in Sprint 8
  962 objects (27 layers) -- ACA deployed + Cosmos 24x7 -- both local + ACA at 962 objects
  Counts grow each sprint -- always query the live API for current totals:
    Invoke-RestMethod "$base/health"
  As of 2026-02-24 last recorded: 27 layers -- 186 endpoints -- 46 screens -- 375 literals -- 50 projects
-->

> **Model is complete: 27/27 layers -- PASS 0 violations**
> **Object counts grow each sprint -- always query the live API for current totals.**
> **API is running on port 8010 -- use HTTP queries, not PowerShell file reads.**
> See [USER-GUIDE.md](../USER-GUIDE.md) for query examples and agent skill patterns.
> See [ANNOUNCEMENT.md](../ANNOUNCEMENT.md) for accuracy boundaries.

---

## What This Repository Is

`37-data-model` is the **semantic object model for the entire EVA ecosystem** --
every significant object (service, persona, container, endpoint, screen, literal,
agent, requirement) is a typed node with explicit FK-style cross-references,
automatically audited on every write.

**Read `eva-model.json` before reading any source file.**

---

## Bootstrap (every session)

> Run this block verbatim. It resolves the best available endpoint automatically:
> **Option A** (ACA, 24x7 Cosmos) -> **Option B** (localhost:8010) -> **Option C** (file, offline/CI).
> Never choose manually; let the script decide.

```powershell
# Option A -- ACA (24x7 Cosmos-backed, no auth required, always up)
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$h = Invoke-RestMethod "$base/health" -ErrorAction SilentlyContinue

# Option B -- localhost:8010 (local dev / fallback)
if (-not $h) {
    $base = "http://localhost:8010"
    $h = Invoke-RestMethod "$base/health" -ErrorAction SilentlyContinue
    if (-not $h) {
        # Start local API if not running
        $env:PYTHONPATH = "C:\AICOE\eva-foundry\37-data-model"
        Start-Process "C:\AICOE\.venv\Scripts\python.exe" `
            "-m uvicorn api.server:app --port 8010 --reload" -WindowStyle Hidden
        Start-Sleep 4
        $h = Invoke-RestMethod "$base/health" -ErrorAction SilentlyContinue
    }
}

# Option C -- file fallback (offline / CI -- no HTTP API available)
if (-not $h) {
    Write-Warning "No HTTP API reachable -- loading from file (read-only, no audit trail)"
    $m = Get-Content C:\AICOE\eva-foundry\37-data-model\model\eva-model.json | ConvertFrom-Json
    $m.meta | Select-Object last_updated, layers_complete, total_layers
} else {
    # Readiness check (ACA store=cosmos is always reachable; local checks Cosmos connectivity)
    $r = Invoke-RestMethod "$base/ready" -ErrorAction SilentlyContinue
    if (-not $r.store_reachable) { Write-Warning "Cosmos unreachable -- check COSMOS_URL/KEY" }
    # The API self-documents -- read the agent guide before doing anything
    Invoke-RestMethod "$base/model/agent-guide"    # complete operating protocol
    Invoke-RestMethod "$base/model/agent-summary"  # 27 layer counts + total objects
}
```

If `validate-model.ps1` reports violations -> **fix them before doing any other work**.
A model with dangling references is worse than no model.

---

## Model API (HTTP service -- port 8010)

The EVA Model API offers every read/write operation over HTTP, with structured
audit columns (`created_*`, `modified_*`, `row_version`, `is_active`), a Redis-backed
cache, and cross-layer impact analysis.
No PowerShell, no file I/O -- any language can consume the model.

### Start (local dev / MemoryStore)

```powershell
cd C:\AICOE\eva-foundry\37-data-model
$env:PYTHONPATH = $PWD
C:\AICOE\.venv\Scripts\python -m uvicorn api.server:app --port 8010 --reload
```

Interactive docs (local dev): **http://localhost:8010/docs** | ACA: `$base/docs`

### Key API patterns

```powershell
# Health check
Invoke-RestMethod "$base/health"

# List a layer (cached 60 s)
Invoke-RestMethod "$base/model/services/"
Invoke-RestMethod "$base/model/endpoints/"

# Get one object by id
Invoke-RestMethod "$base/model/services/eva-brain-api"

# Create or update an object (audit fields are server-stamped -- never send them)
Invoke-RestMethod "$base/model/services/my-new-svc" `
  -Method PUT -ContentType "application/json" `
  -Body '{"name":"My New Service","type":"internal_api","status":"planned"}'

# Soft-delete (sets is_active=false, increments row_version)
Invoke-RestMethod "$base/model/services/old-svc" -Method DELETE

# Filter endpoints by any combination of fields
Invoke-RestMethod "$base/model/endpoints/filter?status=stub"
Invoke-RestMethod "$base/model/endpoints/filter?cosmos_writes=jobs&auth=admin"

# Cross-layer impact analysis (equivalent to impact-analysis.ps1)
Invoke-RestMethod "$base/model/impact/?container=jobs"
Invoke-RestMethod "$base/model/impact/?container=config&field=key"

# Admin -- export store to enriched JSON (completes write cycle, materialises audit trail)
Invoke-RestMethod "$base/model/admin/export" `
  -Method POST -Headers @{"Authorization"="Bearer dev-admin"}

# Admin -- seed store from disk (idempotent; run after first start with Cosmos)
Invoke-RestMethod "$base/model/admin/seed" `
  -Method POST -Headers @{"Authorization"="Bearer dev-admin"}

# Admin -- audit trail (last 50 writes across all layers)
Invoke-RestMethod "$base/model/admin/audit" `
  -Headers @{"Authorization"="Bearer dev-admin"}

# Admin -- in-process validation (same checks as validate-model.ps1)
Invoke-RestMethod "$base/model/admin/validate" `
  -Headers @{"Authorization"="Bearer dev-admin"}

# Admin -- flush cache
Invoke-RestMethod "$base/model/admin/cache/flush" `
  -Method POST -Headers @{"Authorization"="Bearer dev-admin"}
```

### Audit columns on every stored object

| Field | Type | Meaning |
|-------|------|---------|
| `created_by` | string | Actor who first created the object |
| `created_at` | ISO-8601 | Timestamp of first upsert |
| `modified_by` | string | Actor of last write |
| `modified_at` | ISO-8601 | Timestamp of last write |
| `row_version` | int | Monotonically increasing counter -- +1 on every write |
| `is_active` | bool | False = soft-deleted; GET one returns 404, list skips it |
| `source_file` | string | Origin JSON file, e.g. `"model/endpoints.json"` |
| `repo_line` | int or null | 1-based line of primary definition in `implemented_in` / `repo_path` |
| `obj_id` | string | Business key (matches the URL `{id}` segment) |
| `layer` | string | Layer name (services, endpoints, etc.) |

Pass `X-Actor: your-name` header to tag writes with a meaningful identity.

### Store / cache mode selection

| Env vars set | Store | Cache |
|-------------|-------|-------|
| (none) | MemoryStore -- auto-seeds from disk JSON on startup | MemoryCache |
| `COSMOS_URL` + `COSMOS_KEY` | CosmosStore -- partition key `/layer` | MemoryCache |
| `REDIS_URL` | (same as above) | RedisCache |

> **Note:** With MemoryStore the model is ephemeral -- data resets on every restart.
> Run `POST /model/admin/seed` once after connecting Cosmos to load disk JSON into Cosmos.

---

## Graph API -- Object Relationships (DER/ERD over HTTP)

```powershell
# All edge types (20 types across 27 layers)
Invoke-RestMethod "$base/model/graph/edge-types" | Format-Table

# Full graph -- all nodes and edges
$g = Invoke-RestMethod "$base/model/graph"
Write-Host "$($g.meta.node_count) nodes -- $($g.meta.edge_count) edges"

# Filter to one edge type
Invoke-RestMethod "$base/model/graph?edge_type=calls"       # screen -> endpoint
Invoke-RestMethod "$base/model/graph?edge_type=reads"       # endpoint -> container
Invoke-RestMethod "$base/model/graph?edge_type=depends_on"  # service -> service

# Traverse from one node, N hops deep
$g = Invoke-RestMethod "$base/model/graph?node_id=TranslationsPage&depth=2"
$g.edges | Format-Table from, to, type

# What screens write to the translations container? (2-hop)
$writers = (Invoke-RestMethod "$base/model/graph?edge_type=writes").edges |
    Where-Object { $_.to -eq "translations" }
$callers = (Invoke-RestMethod "$base/model/graph?edge_type=calls").edges |
    Where-Object { $_.to -in $writers.from }
$callers | Select-Object from, to
```

> **Rule:** Use `GET /model/graph` for all relationship questions. Never grep source files for
> cross-references when the graph can answer it in one HTTP call.

---

## Provenance Queries

```powershell
# Provenance: who created this object and when?
$ep = Invoke-RestMethod "$base/model/endpoints/GET /v1/health"
"Created: $($ep.created_at) by $($ep.created_by)  v$($ep.row_version)  source: $($ep.source_file)"

# Navigation: jump directly to route decorator in VS Code
$ep = Invoke-RestMethod "$base/model/endpoints/GET /v1/health"
code --goto "C:\AICOE\eva-foundry\$($ep.implemented_in):$($ep.repo_line)"

# Same for a React hook or component:
$h = Invoke-RestMethod "$base/model/hooks/useTranslations"
code --goto "C:\AICOE\eva-foundry\$($h.repo_path):$($h.repo_line)"
```

---

## JSON Files -- Read-Only Snapshots (NEVER Edit Directly)

The 27 files in `model/*.json` (services.json, endpoints.json, etc.) are
**git-trackable snapshots of the live store -- they are NOT the source of truth**.
Agents must never edit them by hand, by file-write tool, or by any script that
writes directly to `model/`.

### Architecture

```
Cosmos DB (ACA 24x7) <--> MemoryStore (local)    <- LIVE, authoritative
         |
         | POST /model/admin/export
         | POST /model/admin/commit  (preferred, 1 call)
         | Server shutdown hook (PROD-WI-7, MemoryStore only)
         v
model/services.json, endpoints.json ... (27 files)   <- SNAPSHOT, git-tracked
model/eva-model.json                                 <- ASSEMBLED aggregate (never hand-edit)
```

On ACA (Cosmos mode), the JSON files have zero effect on the live store between
exports. Editing them changes what git tracks; it does NOT change what the running
API serves or what Cosmos stores.

### Why direct JSON edits cause silent corruption

| Problem | Detail |
|---|---|
| No audit trail | modified_by stays "system:autoload", row_version stays 1 -- no record of what changed or who |
| Cosmos drift | ACA runs against Cosmos. A JSON edit does not touch Cosmos until seed-cosmos.py is re-run. Live API serves stale data. |
| MemoryStore drift | Local server reads JSON only at startup (bulk_load). Edits while server is running are invisible until restart. |
| Row version collision | JSON says row_version=5 but Cosmos has row_version=7 -- next PUT silently resets progress or fails. |
| False CI green | validate-model.ps1 reads the edited JSON and passes -- but the live store is out of sync. Clean gate on dirty data. |

### Legitimate JSON writers (only these four)

| Writer | When | Direction |
|---|---|---|
| POST /model/admin/export | After PUT writes are verified | store -> JSON |
| POST /model/admin/commit | Agent shortcut (export + assemble + validate) | store -> JSON -> validated |
| Server shutdown hook (PROD-WI-7) | On SIGTERM, MemoryStore only | store -> JSON |
| scripts/seed-cosmos.py | Cold deploy / disaster recovery | JSON -> Cosmos (one-way) |

### Correct agent write protocol

```powershell
# Step 1 -- read, mutate, PUT through the API (never touch the JSON file)
$obj = Invoke-RestMethod "$base/model/{layer}/{id}"
$prev_rv = $obj.row_version
$obj.{field} = "new-value"
$body = $obj | Select-Object * -ExcludeProperty `
    obj_id,layer,modified_by,modified_at,created_by,created_at,row_version,source_file `
    | ConvertTo-Json -Depth 10
Invoke-RestMethod "$base/model/{layer}/{id}" -Method PUT `
    -ContentType "application/json" -Body $body `
    -Headers @{"X-Actor"="agent:copilot"}

# Step 2 -- verify row_version incremented
$v = Invoke-RestMethod "$base/model/{layer}/{id}"
if ($v.row_version -ne $prev_rv + 1) { throw "[FAIL] write not confirmed" }

# Step 3 -- commit (export + assemble + validate in ONE call)
$c = Invoke-RestMethod "$base/model/admin/commit" `
    -Method POST -Headers @{"Authorization"="Bearer dev-admin"}
if ($c.violation_count -ne 0) { throw "[FAIL] violations=$($c.violation_count)" }
# [PASS] on ACA: violation_count=0 AND export_errors.Count=0
# assemble.rc=-1 on ACA is expected (scripts not deployed) -- ignore it
```

**Direct JSON edits bypass all three steps** -- no audit, no verify, no validation gate.
Treat a direct JSON edit the same as a direct `UPDATE` on a production database.

---

## Writing Rules

### When to update the model

The model is updated **in the same commit that changes the source**. Never defer.

| Source change | Model update |
|---------------|-------------|
| New endpoint | `endpoints.json` + `schemas.json` for new response shape |
| New Pydantic model | `schemas.json` |
| New Cosmos container | `containers.json` |
| New React screen | `screens.json` + `literals.json` for all new string keys |
| New persona | `personas.json` + `feature_flags.json` |
| New feature flag | `feature_flags.json` |
| New agent | `agents.json` |
| New Azure resource | `infrastructure.json` |

### Validation gate

Before marking any layer complete:
```powershell
scripts/validate-model.ps1
```
Must exit 0. Zero dangling references. Zero schema violations.

### Assemble after every update

After editing any layer file:
```powershell
scripts/assemble-model.ps1
```
This regenerates `model/eva-model.json`. Never hand-edit `eva-model.json` directly.

---

## Schema Discipline

Required fields that can NEVER be null:
- All objects: `id`, `status`
- endpoints: `method`, `path`, `auth`, `feature_flag`, `cosmos_reads`, `cosmos_writes`
- screens: `app`, `route`, `api_calls`, `components`
- literals: `key`, `default_en`, `default_fr`, `screens`
- containers: `partition_key`, `fields`

Optional fields that must be `null` (never omitted):
- `endpoint.request_schema` -- null if no request body
- `screen.notes` -- null if no caveats

---

## Cross-Reference Integrity Rules

1. Every `endpoint.cosmos_reads[]` value must be an `id` in `containers.json`
2. Every `endpoint.cosmos_writes[]` value must be an `id` in `containers.json`
3. Every `endpoint.feature_flag` must be an `id` in `feature_flags.json`
4. Every `endpoint.auth[]` value must be an `id` in `personas.json`
5. Every `screen.api_calls[]` value must be an `id` in `endpoints.json`
6. Every `literal.screens[]` value must be an `id` in `screens.json`
7. Every `requirement.satisfied_by[]` value must resolve to endpoint or screen id
8. Every `agent.output_screens[]` value must be an `id` in `screens.json`

Violations are reported by `scripts/validate-model.ps1`.

---

## Anti-Patterns

| Do NOT do this | Do this instead |
|----------------|-----------------|
| Run file_search to find all endpoints | `$m.endpoints \| Select-Object id, path` |
| grep source files for Cosmos container names | `$m.containers \| Select-Object id` |
| Read all route files to build impact analysis | `scripts/impact-analysis.ps1 -field <name>` |
| Ask "what calls what" by reading source | `GET /model/graph?edge_type=calls` |
| Ask "what depends on X" by scanning service configs | `GET /model/graph?node_id=X&depth=1` |
| Find a component's file by reading the repo tree | `GET /model/components/{id}` -> `.repo_path` + `.repo_line` |
| Hand-edit `eva-model.json` | Edit the layer file, then run `assemble-model.ps1` |
| Edit JSON files directly to update model objects | `PUT /model/{layer}/{id}` -> `POST /model/admin/commit` |
| Defer model update to next session | Update in same commit as source change |

---

## Layer Status Reference

Check `STATUS.md` for current layer completeness before any query.
If a layer is NOT STARTED, fall back to reading source files for that layer.
If a layer is COMPLETE, the model is authoritative -- do not re-read source.

---

## Relationship to Other Repositories

- `33-eva-brain-v2/docs/artifacts.json` -- file registry (one service) -> cross-ref `endpoint.implemented_in`
- `31-eva-faces/EVA-FACES-MASTER-TRACKER.md` -- implementation status cross-ref `screen.status`
- `33-eva-brain-v2/.github/copilot-instructions.md` -- service-level coding rules (still apply)
- This file governs model reads/writes only; coding conventions remain in service repos

---

## PART 3 -- QUALITY GATES

All must pass before merging a PR:

- [ ] Test command exits 0
- [ ] `validate-model.ps1` exits 0 (if any model layer was changed)
- [ ] No [FORBIDDEN] encoding patterns in new code
- [ ] STATUS.md updated with session summary
- [ ] PLAN.md reflects actual remaining work
- [ ] If new screen / endpoint / component added: model PUT + write cycle closed

---

*Source template*: `C:\AICOE\eva-foundry\07-foundation-layer\02-design\artifact-templates\copilot-instructions-template.md` v3.3.2
*Project 07 README*: `C:\AICOE\eva-foundry\07-foundation-layer\README.md`
*EVA Data Model USER-GUIDE*: `C:\AICOE\eva-foundry\37-data-model\USER-GUIDE.md`
