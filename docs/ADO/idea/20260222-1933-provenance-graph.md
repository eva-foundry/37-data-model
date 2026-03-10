# 37-data-model · Feature Proposals E-09 / E-10 / E-11

**Recorded:** 2026-02-22 · 19:33 ET  
**Author:** marco.presta (EVA AI Co-Intelligence session)  
**Status:** Proposed — ready to plan  
**Sprint target:** Sprint 8–9  
**Total estimate:** 26 pts (E-09: 3 · E-10: 8 · E-11: 15)

---

## Context

Three features recorded from the 19:33 ET session. The user's exact intent:

> "would be useful for an agent consulting the EVA data model to know the **location** of that
> object in the repo, **when it was created**, **metadata related to the object in question** —
> that is what I am talking about.
> Then the next is about the **objects' relationships** — like in a DER.
> I am giving ideas for cutting-edge features that could save a lot of time in development,
> operations, monitoring, auditing."

These features extend the EVA data model from a static object catalog into a fully navigable,
auditable, relationship-aware knowledge graph — queryable by agents, developers, and auditors
without touching source files.

---

## E-09 · Full Provenance Export to Disk · 3 pts

### What it is
First-ever `POST /model/admin/export` run after the `server.py` auto-seed fix (2026-02-22).
Every JSON file in `model/` will be overwritten with the fully enriched payload: all audit
fields stamped on every object.

### Why it matters
Right now, the 25 legacy JSON files have zero audit metadata (no `source_file`, no
`created_at/by`, no `modified_at/by`, no `row_version`). The store already has them in
memory (stamped by `bulk_load` on startup), but they have never been flushed back to disk.
Without this export:
- Every cold-deploy seed loses the audit trail.
- Agents reading the JSON files directly see objects with no provenance.
- The enriched JSON (the cold-deploy artifact) is never produced.

### Fields that will appear on every object after export

| Field | Value on first export |
|---|---|
| `source_file` | `"model/<filename>.json"` (e.g. `"model/endpoints.json"`) |
| `created_by` | `"system:autoload"` (bootstrap; overwritten by next PUT from a real actor) |
| `created_at` | ISO-8601 timestamp of first auto-seed |
| `modified_by` | `"system:autoload"` |
| `modified_at` | ISO-8601 timestamp |
| `row_version` | `1` |
| `is_active` | `true` |

### What is already done
- `server.py` auto-seed: fixed from `upsert` to `bulk_load` + `source_file` stamping ✅
- `admin.py /seed`: `source_file` stamped before `bulk_load` ✅
- `admin.py /export`: strips Cosmos internals, preserves all audit fields ✅
- `memory.py bulk_load`: `setdefault` pattern preserves existing audit fields ✅

### What is missing before we can execute E-09

| Gap | Blocking? | Action |
|---|---|---|
| API has not been started with the fixed code | YES | Start uvicorn after code fix |
| `POST /model/admin/export` has never been run | YES | Run once → enriched JSON materializes |
| `assemble-model.ps1` not yet re-run post-export | YES | Run after export |
| `validate-model.ps1` not verified post-export | YES | Must still PASS — 0 violations |
| No automated test asserting `source_file` present on every object | NO (nice-to-have) | Add to `test_admin.py` |

### Acceptance criteria
- [ ] `POST /model/admin/export` returns `{"exported": {...}, "total": N, "errors": []}` with `errors == []`
- [ ] Every object in every model JSON file has `source_file`, `created_by`, `created_at`, `modified_by`, `modified_at`, `row_version`, `is_active`
- [ ] `assemble-model.ps1` runs → `27/27 layers populated`
- [ ] `validate-model.ps1` → `PASS — 0 violations`
- [ ] Re-running `POST /model/admin/seed` then `POST /model/admin/export` is idempotent — `row_version` does not increment on pure re-seed
- [ ] `GET /model/admin/audit` shows the export event

### Exact commands

```powershell
# 1 — Start API (picks up both server.py and admin.py fixes)
$env:PYTHONPATH = "C:\eva-foundry\eva-foundation\37-data-model"
C:\eva-foundry\.venv\Scripts\python -m uvicorn api.server:app --port 8010 --log-level warning

# 2 — Trigger export
Invoke-RestMethod -Method POST "http://localhost:8010/model/admin/export" `
    -Headers @{ Authorization = "Bearer dev-admin" } | ConvertTo-Json -Depth 4

# 3 — Rebuild eva-model.json
cd "C:\eva-foundry\eva-foundation\37-data-model"
.\scripts\assemble-model.ps1

# 4 — Validate
.\scripts\validate-model.ps1
```

---

## E-10 · `repo_line` — Exact File + Line on Every Implemented Object · 8 pts

### What it is
Add `repo_line: int | null` to every layer that has `implemented` objects. Stores the
1-based line number of the primary definition point in the source file (route decorator,
`export function`, `export const`, `export class`, `export interface`).

Combined with the existing `implemented_in` / `repo_path` / `component_path` fields, this
gives every agent and developer a single-click jump target.

### Affected layers and fields

| Layer | Existing path field | New field | Meaning |
|---|---|---|---|
| `endpoints` | `implemented_in` | `repo_line` | Line of the `@router.get(...)` / `@router.post(...)` decorator |
| `components` | `repo_path` | `repo_line` | Line of `export const ComponentName` or `export function` |
| `hooks` | `repo_path` | `repo_line` | Line of `export function useHookName` |
| `screens` | `component_path` | `repo_line` | Line of `export default function PageName` or `export const` |
| `requirements` | — | `source_file` + `repo_line` | Spec document line (markdown heading or acceptance criterion) |
| `agents` | — | `source_file` + `repo_line` | Prompty/agent config file + heading line |

### Example object after E-10

```json
{
  "id": "GET /v1/health",
  "method": "GET",
  "path": "/v1/health",
  "service": "eva-brain-api",
  "implemented_in": "33-eva-brain-v2/services/eva-brain-api/app/routes/health.py",
  "repo_line": 12,
  "source_file": "model/endpoints.json",
  "created_by": "system:autoload",
  "created_at": "2026-02-22T19:41:00Z",
  "modified_by": "system:autoload",
  "modified_at": "2026-02-22T19:41:00Z",
  "row_version": 1
}
```

### What is already done
- `components.json`: all 12 objects have `repo_path` ✅ (no `repo_line` yet)
- `hooks.json`: all 17 objects have `repo_path` ✅ (no `repo_line` yet)
- `endpoints.json`: all 123 objects have `implemented_in` ✅ (no `repo_line` yet)
- `screens.json`: all 27 objects have `component_path` ✅ (no `repo_line` yet)

### What is missing before we can execute E-10

| Gap | Category | Action |
|---|---|---|
| `repo_line` not in `endpoint.schema.json` | Schema | Add `"repo_line": {"type": ["integer","null"], "description": "1-based line of route decorator in implemented_in file"}` |
| `repo_line` not in `component.schema.json` | Schema | Same pattern |
| `repo_line` not in `hook.schema.json` | Schema | Same pattern |
| `repo_line` not in `screen.schema.json` | Schema | Same pattern |
| No backfill script exists | Tooling | Write `scripts/backfill-repo-lines.py` — reads source files, uses `grep`/`ast` to find line numbers, outputs PUT commands or directly populates JSON |
| No validation rule for `repo_line` presence | Validation | Add to `validate-model.ps1`: warn if `status==implemented` and `repo_line` is null |
| No pytest asserting `repo_line` coverage | Tests | Add to `tests/test_admin.py` or new `tests/test_provenance.py` |
| `repo_line` not in `_STRIP` exclusion (should NOT be stripped on export) | Admin | Already confirmed `_STRIP` does not include it — no action needed ✅ |

### Backfill script design (`scripts/backfill-repo-lines.py`)

```
Input:  eva-model.json (or read each layer via HTTP)
For each object with implemented_in / repo_path / component_path:
  1. resolve path relative to C:\eva-foundry\eva-foundation\
  2. open the file
  3. scan lines for the first match of:
       - endpoints: re.compile(r'@router\.(get|post|put|patch|delete)\s*\(')
       - hooks:     re.compile(r'export\s+(function|const)\s+use[A-Z]')
       - components:re.compile(r'export\s+(default\s+)?(function|const|class)\s+[A-Z]')
       - screens:   same as components
  4. emit: PUT /model/{layer}/{id}  body delta: {"repo_line": N}
Output: summary of hits vs misses
```

### Acceptance criteria
- [ ] JSON schemas for endpoints, components, hooks, screens all accept `repo_line: integer | null`
- [ ] `validate-model.ps1` warns (not errors) when `status == "implemented"` and `repo_line` is null
- [ ] `backfill-repo-lines.py` exits 0, produces ≥1 match per layer
- [ ] After backfill + export + assemble: all `implemented` endpoints, components, hooks, screens have `repo_line > 0`
- [ ] `pytest` passes — new `test_provenance.py` asserts `repo_line` is integer on implemented objects
- [ ] An agent can jump directly to source: `$ep.implemented_in + ":" + $ep.repo_line`

---

## E-11 · `GET /model/graph` — Typed Edge List (DER/ERD over HTTP) · 15 pts

### What it is
A new API endpoint that materialises all cross-layer relationships as a typed graph of
nodes and edges — the ERD / DER that the user requested.

```
GET /model/graph
GET /model/graph?from_layer=screens&to_layer=endpoints
GET /model/graph?edge_type=calls
GET /model/graph?node_id=TranslationsPage
GET /model/graph?depth=2&node_id=TranslationsPage
```

Response:
```json
{
  "nodes": [
    {"id": "TranslationsPage", "layer": "screens", "label": "Translations", "status": "implemented"},
    {"id": "GET /v1/config/translations/{language}", "layer": "endpoints", "label": "Get translations", "status": "implemented"},
    {"id": "translations", "layer": "containers", "label": "Translations container"}
  ],
  "edges": [
    {"from": "TranslationsPage", "from_layer": "screens", "to": "GET /v1/config/translations/{language}", "to_layer": "endpoints", "type": "calls", "via_field": "api_calls"},
    {"from": "GET /v1/config/translations/{language}", "from_layer": "endpoints", "to": "translations", "to_layer": "containers", "type": "reads", "via_field": "cosmos_reads"}
  ],
  "meta": {"node_count": 3, "edge_count": 2, "depth": 1, "duration_ms": 12}
}
```

### Edge type vocabulary (16 types across all 27 layers)

| Edge type | From layer | To layer | Via field |
|---|---|---|---|
| `calls` | screens | endpoints | `api_calls` |
| `reads` | endpoints | containers | `cosmos_reads` |
| `writes` | endpoints | containers | `cosmos_writes` |
| `uses_component` | screens | components | `components` |
| `uses_hook` | screens | hooks | `hooks` |
| `hook_calls` | hooks | endpoints | `calls_endpoints` |
| `implemented_by` | endpoints | services | `service` |
| `depends_on` | services | services | `depends_on` |
| `gated_by` | endpoints | feature_flags | `feature_flag` |
| `satisfies` | endpoints | requirements | `satisfied_by` (inverse) |
| `reads_schema` | endpoints | schemas | `request_schema` |
| `writes_schema` | endpoints | schemas | `response_schema` |
| `translates` | screens | literals | `screens` (inverse on literals) |
| `agent_reads` | agents | endpoints | `input_endpoints` |
| `wbs_depends` | wbs | wbs | `depends_on_wbs` |
| `project_depends` | projects | projects | `depends_on` |
| `project_wbs` | projects | wbs | `wbs_id` |
| `persona_access` | personas | feature_flags | `can_access` |
| `runbook_skill` | runbooks | cp_skills | `skills` |
| `wbs_runbook` | wbs | runbooks | `ci_runbook` |

### What is already done
- All relationship fields already populated in JSON ✅
- `impact.py` already traverses `screen→endpoint→container` — same logic, different shape ✅
- `components.json` has `used_by_screens` (reverse edge already encoded) ✅
- `hooks.json` has `calls_endpoints` and `used_by_screens` ✅

### What is missing before we can execute E-11

| Gap | Category | Action |
|---|---|---|
| `api/routers/graph.py` does not exist | Code — required | Create new router |
| `GraphNode` and `GraphEdge` Pydantic models not defined | Code — required | Define in `api/models/graph.py` or inline |
| Router not registered in `server.py` / `create_app()` | Code — required | Add `app.include_router(graph.router)` |
| `depth` traversal (multi-hop, BFS) not implemented | Code — required | BFS loop with visited set (cycle guard) |
| No tests for graph endpoint | Tests — required | Create `tests/test_graph.py` — 6 test cases |
| README "How Agents Use This" table missing graph rows | Docs — required | Add `GET /model/graph` examples |
| No cycle-detection guard | Code — required | `visited: set[str]` prevents infinite loops |
| Query param `?format=mermaid` (optional) | Code — stretch | Emit Mermaid `graph LR` syntax for diagram generation |
| `GET /model/graph/edge-types` meta endpoint | Code — stretch | Returns the 20-row vocabulary table as JSON |

### Proposed module layout

```
api/
  models/
    graph.py          # GraphNode, GraphEdge, GraphResponse Pydantic models
  routers/
    graph.py          # GET /model/graph  + GET /model/graph/edge-types
    impact.py         # existing — may refactor to share edge resolver
tests/
  test_graph.py       # 6 test cases (see below)
```

### Test cases for `tests/test_graph.py`

| # | Input | Expected |
|---|---|---|
| T1 | `GET /model/graph?from_layer=screens&to_layer=endpoints` | All screen→endpoint `calls` edges |
| T2 | `GET /model/graph?edge_type=reads` | All endpoint→container `reads` edges |
| T3 | `GET /model/graph?node_id=TranslationsPage&depth=1` | 3 nodes, 2 edges |
| T4 | `GET /model/graph?node_id=TranslationsPage&depth=2` | Container node included |
| T5 | `GET /model/graph?from_layer=services&to_layer=services` | `depends_on` edges only |
| T6 | Cycle guard: add synthetic circular dep, confirm no infinite loop | Returns ≤200 nodes |

### Acceptance criteria
- [ ] `GET /model/graph` returns valid `GraphResponse` with `nodes`, `edges`, `meta`
- [ ] All 20 edge types are discoverable at `GET /model/graph/edge-types`
- [ ] `from_layer` + `to_layer` filter returns only edges between those two layers
- [ ] `edge_type` filter returns only edges of that type
- [ ] `node_id` + `depth=1` returns direct neighbours only
- [ ] `node_id` + `depth=2` returns second-hop neighbours (neighbors of neighbors)
- [ ] Cycle guard: no infinite loop on circular dependencies in services/projects/wbs
- [ ] `pytest tests/test_graph.py` — 6/6 pass
- [ ] `GET /model/graph` response time < 500 ms (MemoryStore, all 27 layers)
- [ ] README "How Agents Use This" and decision table updated with graph examples
- [ ] Mermaid output (`?format=mermaid`) — stretch goal, not blocking

---

## Gap Summary — What is missing to plan, do, test, and verify all three

### Gaps that block execution (must be resolved before any WI can start)

| # | Gap | Affects | Effort |
|---|---|---|---|
| G-1 | API never started + `POST /model/admin/export` never run | E-09 | 15 min |
| G-2 | `repo_line` not in 4 JSON schemas | E-10 | 1 hr |
| G-3 | `backfill-repo-lines.py` does not exist | E-10 | 4 hrs |
| G-4 | `api/routers/graph.py` does not exist | E-11 | 1 day |
| G-5 | `api/models/graph.py` Pydantic models not defined | E-11 | 2 hrs |
| G-6 | Router not registered in `server.py` | E-11 | 15 min |
| G-7 | No `tests/test_graph.py` | E-11 | 4 hrs |

### Gaps that block validation (must be resolved before Done is claimed)

| # | Gap | Affects | Effort |
|---|---|---|---|
| G-8 | `validate-model.ps1` has no `repo_line` coverage check | E-10 | 1 hr |
| G-9 | No `tests/test_provenance.py` | E-10 | 2 hrs |
| G-10 | README missing graph query examples | E-11 | 1 hr |
| G-11 | Decision table missing `GET /model/graph` row | E-11 | 15 min |
| G-12 | No `GET /model/graph/edge-types` endpoint | E-11 (stretch) | 1 hr |

### Gaps that are informational (not blocking)

| # | Gap | Affects | Note |
|---|---|---|---|
| G-13 | `created_by` / `created_at` not yet in `projects.json` / `wbs.json` | E-09 | Will be stamped by first export |
| G-14 | 25 legacy layers have `row_version=null` in disk JSON | E-09 | Resolved by first export |
| G-15 | Mermaid output format not implemented | E-11 | Stretch goal, Sprint 9 |
| G-16 | `GET /model/graph` not yet in Swagger UI | E-11 | Auto-generated once router registered |

---

## Work Items (draft — ready for ADO import)

### Epic: EVA Data Model — Provenance & Graph (Sprint 8–9)

| WI | Title | Layer | Pts | Sprint | Depends on |
|---|---|---|---|---|---|
| E-09-WI-1 | Run first `POST /model/admin/export` — materialize audit trail | ops | 1 | 8 | G-1 fixed |
| E-09-WI-2 | Add `test_provenance_export` to `test_admin.py` | test | 2 | 8 | E-09-WI-1 |
| E-10-WI-1 | Add `repo_line` to 4 JSON schemas | schema | 1 | 8 | — |
| E-10-WI-2 | Write `scripts/backfill-repo-lines.py` | tooling | 3 | 8 | E-10-WI-1 |
| E-10-WI-3 | Run backfill + PUT all `implemented` objects via API | ops | 1 | 8 | E-10-WI-2 |
| E-10-WI-4 | Add `repo_line` coverage check to `validate-model.ps1` | tooling | 1 | 8 | E-10-WI-1 |
| E-10-WI-5 | Write `tests/test_provenance.py` (3 test cases) | test | 2 | 8 | E-10-WI-3 |
| E-11-WI-1 | Define `GraphNode`, `GraphEdge`, `GraphResponse` Pydantic models | code | 2 | 8 | — |
| E-11-WI-2 | Implement `api/routers/graph.py` — 20 edge types, all query params | code | 5 | 8 | E-11-WI-1 |
| E-11-WI-3 | Register graph router in `server.py` | code | 1 | 8 | E-11-WI-2 |
| E-11-WI-4 | Write `tests/test_graph.py` — 6 test cases | test | 3 | 8 | E-11-WI-3 |
| E-11-WI-5 | Update README — graph examples + decision table | docs | 1 | 8 | E-11-WI-3 |
| E-11-WI-6 | Add `GET /model/graph/edge-types` meta endpoint | code | 2 | 9 | E-11-WI-2 |
| E-11-WI-7 | Mermaid output (`?format=mermaid`) — stretch | code | 3 | 9 | E-11-WI-2 |

**Sprint 8 total: 23 pts · Sprint 9: 5 pts (stretch)**

---

## How agents will use these features (post-implementation preview)

```powershell
# ── E-09 (provenance) ────────────────────────────────────────────────────────
# Who created this endpoint and when?
$ep = Invoke-RestMethod "http://localhost:8010/model/endpoints/GET /v1/health"
Write-Host "Created: $($ep.created_at) by $($ep.created_by)  v$($ep.row_version)"
Write-Host "Source:  $($ep.source_file)"

# ── E-10 (repo_line) ─────────────────────────────────────────────────────────
# Jump directly to the route decorator in VS Code:
$ep = Invoke-RestMethod "http://localhost:8010/model/endpoints/GET /v1/health"
code --goto "C:\eva-foundry\eva-foundation\$($ep.implemented_in):$($ep.repo_line)"

# Same for a React component:
$c = Invoke-RestMethod "http://localhost:8010/model/components/AdminListPage"
code --goto "C:\eva-foundry\eva-foundation\$($c.repo_path):$($c.repo_line)"

# ── E-11 (graph / DER) ───────────────────────────────────────────────────────
# Full graph — all edges, all layers
$g = Invoke-RestMethod "http://localhost:8010/model/graph"
Write-Host "$($g.meta.node_count) nodes · $($g.meta.edge_count) edges"

# What does TranslationsPage touch, 2 hops deep?
$g = Invoke-RestMethod "http://localhost:8010/model/graph?node_id=TranslationsPage&depth=2"
$g.edges | Format-Table from, to, type

# Which screens write to the translations container? (2-hop: screen→endpoint→container)
$g = Invoke-RestMethod "http://localhost:8010/model/graph?edge_type=writes"
$writers = $g.edges | Where-Object { $_.to -eq "translations" }
$hitEps = $writers.from
$callScreens = Invoke-RestMethod "http://localhost:8010/model/graph?edge_type=calls" |
    Select-Object -ExpandProperty edges |
    Where-Object { $_.to -in $hitEps }
$callScreens | Select-Object from, to

# All services that depend on eva-roles-api (1-hop)
Invoke-RestMethod "http://localhost:8010/model/graph?edge_type=depends_on&to_layer=services" |
    Select-Object -ExpandProperty edges | Where-Object { $_.to -eq "eva-roles-api" }

# What edge types exist?
Invoke-RestMethod "http://localhost:8010/model/graph/edge-types" | Format-Table
```

---

*Next action: run E-09-WI-1 immediately (15-minute task). Then create ADO WIs for E-10 and E-11.*
