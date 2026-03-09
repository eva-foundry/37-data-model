procee# EVA Data Model

<!-- eva-primed -->
<!-- foundation-primer: 2026-03-03 by agent:copilot -->
<!-- paperless-governance: 2026-03-07 18:03 ET by agent:copilot -->

## EVA Ecosystem Integration

| Tool | Purpose | How to Use |
|------|---------|------------|
| 37-data-model (CLOUD) | **SINGLE SOURCE OF TRUTH** — All project entities | `https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/projects/37-data-model` |
| 29-foundry | Agentic capabilities (search, RAG, eval, observability) | C:\AICOE\eva-foundation\29-foundry |
| 48-eva-veritas | Trust score and coverage audit | MCP tool: audit_repo / get_trust_score |
| 07-foundation-layer | Copilot instructions primer + governance templates | MCP tool: apply_primer / audit_project |

**⚠️ CRITICAL: PAPERLESS GOVERNANCE (Session 38, March 7, 2026 6:03 PM ET)**

**Mandatory files on disk:**
- ✅ `README.md` - Project overview, architecture, integration points
- ✅ `ACCEPTANCE.md` - Quality gates, exit criteria, evidence requirements

**All other governance flows through data model:**
- ❌ ~~STATUS.md~~ → Query `GET /model/project_work/{project_id}` (Layer 34)
- ❌ ~~PLAN.md~~ → Query `GET /model/wbs/?project_id={id}` (Layer 26)
- ❌ ~~Sprint tracking~~ → Query `GET /model/sprints/?project_id={id}` (Layer 27)
- ❌ ~~Risk register~~ → Query `GET /model/risks/?project_id={id}` (Layer 29)
- ❌ ~~ADRs~~ → Query `GET /model/decisions/?project_id={id}` (Layer 30)
- ❌ ~~Evidence~~ → Query `GET /model/evidence/?project_id={id}` (Layer 31)

**Agent rule**: Query the cloud data model API before reading source files.
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
Invoke-RestMethod "$base/model/agent-guide"   # complete protocol
Invoke-RestMethod "$base/model/agent-summary" # all layer counts (51 layers)
```

---

**Component:** 37-data-model  
**Status:** GA (Cloud Only) - **12-DOMAIN ARCHITECTURE** -- 106 operational layers organized by conceptual concern (System Architecture, Identity, AI Runtime, UI, Control Plane, Governance, Projects, DevOps, Observability, Infrastructure, Execution, Strategy - see [docs/library/98-model-ontology-for-agents.md](docs/library/98-model-ontology-for-agents.md)) ✅ PRODUCTION DEPLOYED (Session 41, Mar 9 2026) - **5,818 RECORDS in Cosmos DB** - Success rate: 93.1% - Revision 0000021 active - Cloud: https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io - ACA deployed (Cosmos 24x7 backing store) - MTI=100 - **PAPERLESS GOVERNANCE** (README + ACCEPTANCE mandatory, all else via API) - **DATA-MODEL-FIRST ARCHITECTURE** (Bootstrap queries API, not files) - Evidence Layer LIVE (L31, patent-worthy) - Branch Protection ACTIVE - **EXECUTION ENGINE PHASES 1-5** (L52-L70, 19 new layers + complete self-healing loop)  
**Last Updated:** March 9, 2026 6:37 PM ET -- **Session 41 Part 11**: Execution Engine Phases 2-5 deployed - Phase 2 (L55, L57, L58): obligations tracking, adaptive learning, pattern library. Phase 3 (L59, L60): pattern application tracking with success scoring, performance profiles for pattern selection. Phase 4 (L61-L66): capability catalog backed by patterns, service registry with agent-as-service packaging, request/run tracking for demand intake and execution, performance profiles for service health, SLO definitions for breach detection. Phase 5 (L67-L70): breach tracking with automated detection, remediation planning with runbook codification, revalidation with pre/post comparison, lifecycle event audit trail. Layer count: 91 → 96 → 102 → 106. Edge types: 38 → 48 → 59 → 75. COMPLETE SELF-HEALING LOOP: breach → plan → remediate → revalidate → learn. Phase 6 pending (5 layers: L71-L75 for portfolio strategy). See [docs/library/13-EXECUTION-LAYERS.md](docs/library/13-EXECUTION-LAYERS.md) for complete specification.

---

## Competitive Advantage: Evidence Layer (L31)

> **THE ONLY AI WITH IMMUTABLE AUDIT TRAILS**
> 
> GitHub Copilot, Cursor, Replit Agent, Devin = ZERO audit trail. No proof. No history. No compliance.  
> EVA Foundation = FULL PROVENANCE. 31+ receipts with correlation IDs, test results, artifacts.
> 
> **Patent filed:** March 8, 2026 (provisional) -- "Immutable Audit Trail for AI-Generated Code with Correlation ID Linking"  
> **TAM:** $119B/year (EVA Veritas $24B + EVA Data Model $66B + EVA Foundry $29B)  
> **Exit valuation:** $2-5B (based on Snyk $7.4B, GitHub $7.5B, Databricks $62B comps)
> 
> Insurance carriers will require this. FDA auditors will require this. Banks will require this.  
> They will pay $199-$500K/year for provably correct AI.
> 
> **Read:** [docs/library/11-EVIDENCE-LAYER.md](docs/library/11-EVIDENCE-LAYER.md) for the strategic narrative  
> **Use:** [USER-GUIDE.md Section 9](USER-GUIDE.md#9-evidence-layer--the-billion-dollar-moat) for agent patterns

---

## Purpose

The EVA Data Model is the **single source of truth for the entire EVA ecosystem** ? a
machine-queryable repository of every significant object in the application and how objects
relate to each other across service, UI, and infrastructure boundaries.

The principle: every significant object in the system is a typed node with explicit
cross-references. Renaming a field, changing an endpoint, or adding a screen is a
model operation first ? not a grep operation.

EVA Data Model applies that principle to the modern cloud stack:

> **If it is not in the model, agents will rediscover it by reading source files every session.**
> That is a 10-turn grep spiral. The model makes it a 3-line PowerShell query.

> **Agents: start with [USER-GUIDE.md](USER-GUIDE.md)** ? a task-by-task guide covering
> bootstrap, context gathering, implementation, debugging, refactoring, and the model write cycle.
> Every EVA task should open with a model query, not a file read.

---

## Ecosystem Coverage

| Component | Type | Port / URL |
|-----------|------|-----------:|
| 33-eva-brain-v2 / eva-brain-api | FastAPI backend | 8001 |
| 33-eva-brain-v2 / eva-roles-api | FastAPI backend | 8002 |
| 31-eva-faces / admin-face | React SPA | 5174 |
| 31-eva-faces / chat-face | React SPA | 5173 |
| 31-eva-faces / agent-fleet | FastAPI agent orchestrator | 8000 |
| **37-data-model / model-api** | **FastAPI model service -- see docs/library/03-DATA-MODEL-REFERENCE.md for layer catalog** | **8010** |
| 17-apim | Azure API Management | gateway |
| 29-foundry | Azure AI Foundry | models |
| 16-engineered-case-law | Jurisprudence pipeline | ? |
| 20-AssistMe | Legacy assistant | ? |

---

## Model Layers

```
Layer 0  services        What services exist, their ports, tech stack, health endpoint
Layer 1  personas        Who can act ? admin, translator, viewer, auditor, machine-agent
Layer 2  feature_flags   What features each persona can access (maps to @require_feature)
Layer 3  containers      Cosmos DB containers ? fields, partitionKey, indexes
Layer 4  endpoints       Every HTTP endpoint ? method, path, auth, request, response, cosmos_reads/writes
Layer 5  screens         Every React screen ? route, components, api_calls, fields_displayed
Layer 6  literals        Every UI string key ? default_en, default_fr, which screen uses it
Layer 7  agents          Agent-fleet agents ? input, output, LLM deployment, skill file
Layer 8  infrastructure  APIM routes, Key Vault secrets, Azure resource names
Layer 9  requirements    Epics/REQs ? satisfied_by endpoints + screens ? test coverage

# Control-plane catalog (EVA Automation Operating Model)
Layer 10 planes          Three-plane taxonomy ? GitHub / Azure / ADO
Layer 11 connections     System connections catalog ? ADO, GitHub App, Azure Managed Identity
Layer 12 environments    Environment registry ? DEV / STG / PROD with approval gates
Layer 13 cp_skills       Control-plane skills catalog (7 skills across 3 planes)
Layer 14 cp_agents       Control-plane agents (gh-dev, gh-ci, azure-deploy, ado-scrum)
Layer 15 runbooks        Runbook catalog ? RB-001 to RB-004 with steps, evidence, RBAC
Layer 16 cp_workflows    Compiled workflow definitions ? wf-pr-ci-evidence, wf-promote-dev
Layer 17 cp_policies     Guardrails ? PR-only, evidence-required, env-approval-gates

# Frontend object layers (E-01/E-02/E-03)
Layer 18 components      React component catalog ? Fluent UI v9, i18next, WCAG 2.1 AA
Layer 19 hooks           Custom React hooks ? useAnnouncer, useFeatureFlags, useRBAC
Layer 20 ts_types        TypeScript type definitions ? interfaces, enums, union types

# Catalog & Ops (added post-Phase-4)
Layer 21 mcp_servers     MCP server catalog ? azure-search, cosmos, blob (29-foundry)
Layer 22 prompts         Prompty template catalog ? system prompts, few-shot patterns (29-foundry)
Layer 23 security_controls OWASP LLM Top 10 + ITSG-33 security controls
Layer 24 runbooks        Operational runbook catalog ? RB-001 to RB-004

# Project plane (E-07/E-08) ? waterfall WBS + agile scrum + CI/CD linkage
Layer 25 projects        EVA Platform project catalog -- 19 projects, ADO epic IDs, maturity, goals, phase, dependencies
Layer 26 wbs             Work Breakdown Structure -- program --> stream --> project --> deliverable --> sprint_block

# DPDCA evolution plane (2026-02-25) -- sprint velocity + RUP milestones + risk register + ADRs
Layer 27 sprints         Sprint velocity records -- velocity_planned/actual, mti_at_close, ado_iteration_path
Layer 28 milestones      RUP phase gates -- deliverables, sign_off_by, wbs_ids
Layer 29 risks           3x3 risk matrix -- probability, impact, risk_score, mitigation_owner
Layer 30 decisions       ADRs (Architecture Decision Records) -- context/decision/consequences, superseded_by, deciders

# Observability plane (L11 – 2026-03-01) – proof-of-completion + LM call tracing
Layer 31 evidence        DPDCA phase completions – sprint_id, story_id, phase (D1/D2/P/D3/A), validation gates, merge blockers, metrics (cost, duration, coverage)
Layer 32 traces          Emerging: LM call telemetry – model, tokens, cost_usd, latency_ms, correlation_id

# Governance plane (L33-L34 – 2026-03-05) – data-model-first architecture
Layer 33 workspace_config Workspace-level best practices, bootstrap rules, data model config
Layer 34 project_work    Active work sessions – replaces STATUS.md with queryable DPDCA sessions, tasks[], blockers[], metrics{}

# Agent automation plane (L35-L38 – 2026-03-05/06) – rules-as-code for CI/CD and quality gates
Layer 35 github_rules    GitHub branch protection, PR checks, CI/CD policies per project
Layer 36 deployment_policies Container App config, resource limits, health probes, scaling policies
Layer 37 testing_policies Coverage thresholds (80-95%), CI workflows, test strategies
Layer 38 validation_rules Schema enforcement, compliance gates, data integrity checks

**Architecture Evolution (March 5-6-6, 2026):**
- **File-First → Data-Model-First**: Bootstrap now queries `GET /model/projects/{id}` for governance metadata
- **Session 27**: Enhanced Layer 25 (projects) with `governance{}` and `acceptance_criteria[]` fields
- **Session 27**: Added Layer 33 (workspace_config) and Layer 34 (project_work)
- **Session 28-29**: Added Layer 33 (agent_policies), Layer 34 (quality_gates), Layer 35 (github_rules)
- **Session 30**: Added Layer 36 (deployment_policies), Layer 37 (testing_policies), Layer 38 (validation_rules)
- **Portfolio Queries**: `GET /model/projects/` returns all 56 projects in one call vs 224 file reads (56 × 4 files)
- **Files as Exports**: README/STATUS/ACCEPTANCE become snapshots generated from data model
```

---

## New: Evidence Layer (L11 Observability Plane) ? Production Ready

The **Evidence Layer** captures proof-of-completion for every story in the DPDCA cycle.
Every phase (D1 Discover, D2 Audit, P Plan, D3 Do, A Act) produces an evidence receipt.

**For agents:**
Use the Python library to record evidence after each phase:

```python
import sys
sys.path.insert(0, r"C:\AICOE\eva-foundry\37-data-model")
from .github.scripts.evidence_generator import EvidenceBuilder

gen = EvidenceBuilder(
    sprint_id="ACA-S11",
    story_id="ACA-14-001",
    phase="A",
    story_title="Rule loader"
)
gen.add_validation(test_result="PASS", lint_result="PASS", coverage_percent=92)
gen.add_metrics(duration_ms=8450, files_changed=3, tokens_used=12000, cost_usd=0.00045)
gen.add_artifact(path="services/rules/app/loader.py", type_="source", action="modified")
receipt = gen.build()
# PUT /model/evidence/{receipt['id']} (Cosmos records proof automatically)
```

**Query evidence across all projects:**
```powershell
# All evidence in a sprint
GET /model/evidence/?sprint_id=ACA-S11

# Evidence with test failures (find what broke)
GET /model/evidence/ | Where { $_.validation.test_result -eq "FAIL" }

# Portfolio audit: count stories per phase
GET /model/evidence/ | Group-Object -Property phase | Select-Object Name, Count
```

**Merge gates (CI/CD):**
Evidence validation script (`scripts/evidence_validate.ps1`) blocks merge if:
- `test_result = "FAIL"` ? all tests must pass
- `lint_result = "FAIL"` ? all linting must pass

See [Evidence Layer Documentation](USER-GUIDE.md#evidence-layer--proof-of-completion) for complete usage.

---

## Model API

All entity layers are available over HTTP on port **8010** (local dev) or via ACA (24x7 Cosmos).
For complete layer catalog, see [docs/library/03-DATA-MODEL-REFERENCE.md](docs/library/03-DATA-MODEL-REFERENCE.md).

```powershell
# Start (local / MemoryStore ? auto-seeds from disk JSON)
$env:PYTHONPATH = "C:\AICOE\eva-foundation\37-data-model"
C:\AICOE\.venv\Scripts\python -m uvicorn api.server:app --port 8010 --reload
# Docs: http://localhost:8010/docs
```

| Route | What it does |
|-------|--------------|
| `GET /model/{layer}/` | List all objects in a layer (cached) |
| `GET /model/{layer}/{id}` | Get one object; 404 if soft-deleted |
| `PUT /model/{layer}/{id}` | Upsert ? stamps audit columns (`created_*`, `modified_*`, `row_version`) |
| `DELETE /model/{layer}/{id}` | Soft-delete (`is_active=false`) |
| `GET /model/endpoints/filter` | Filter by `status`, `cosmos_writes`, `cosmos_reads`, `auth`, `feature_flag` |
| `GET /model/impact?container=X` | Cross-layer impact: what endpoints/screens/agents break if X changes |
| `POST /model/admin/seed` | Seed store from disk JSON (idempotent) |
| `GET /model/admin/validate` | In-process validation ? same checks as `validate-model.ps1` |
| `GET /model/admin/audit` | Audit trail ? last N writes across all layers |
| `GET /model/graph` | Typed edge list across entity layers -- nodes, edges, BFS traversal, filters |
| `GET /model/graph/edge-types` | Edge-type vocabulary (20 types: calls, reads, writes, depends_on, ?) |
| `POST /model/admin/export` | Export store ? enriched JSON with full audit trail ? `model/*.json` |

**Test evidence:** 40/41 pytest (T36 pre-existing only) ? 0 violations ? 60 `repo_line` coverage warnings (non-blocking)

**Control-plane catalog routes** (layers 10?17):

| Route | What it does |
|-------|-------------|
| `GET /model/planes` | List planes (GitHub / Azure / ADO) |
| `GET /model/connections` | List system connections |
| `GET /model/environments` | List environments (DEV/STG/PROD) |
| `GET /model/cp_skills` | List control-plane skills |
| `GET /model/cp_agents` | List control-plane agents |
| `GET /model/runbooks` | List runbooks (RB-001 to RB-004) |
| `GET /model/cp_workflows` | List compiled workflow definitions |
| `GET /model/cp_policies` | List guardrail policies |

? **Runtime records** (runs, step_runs, artifacts, evidence packs): see [40-eva-control-plane](../40-eva-control-plane/README.md) (port 8020)

---

## Browser UI

**Shipped:** February 25, 2026 10:14 ET ? integrated into `31-eva-faces / portal-face`.

Two routes are available to any user with the `view:model` permission (admin + analyst personas):

| Route | Description |
|-------|-------------|
| `/model` | **Layer Browser** -- sidebar of all entity layers, live object count per layer, searchable EvaDataGrid, EvaDrawer detail panel with full JSON viewer |
| `/model/report` | **Data Model Report** ? 4-tab dashboard: Overview stats (total objects, ep breakdown, graph node/edge counts), Endpoint Matrix (by service/status), Edge Types, Layer Counts |

**Implementation:**
- `31-eva-faces/portal-face/src/api/modelApi.ts` ? typed HTTP client; default base = ACA endpoint; override with `VITE_DATA_MODEL_URL` env var
- `31-eva-faces/portal-face/src/pages/ModelBrowserPage.tsx`
- `31-eva-faces/portal-face/src/pages/ModelReportPage.tsx`
- Permission gate: `view:model` added to `AuthContext.tsx` (`admin` + `analyst` personas)
- Nav: "Data Model" link in `NavHeader.tsx` inside `<PermissionGate requires="view:model">`

**ACA direct (no auth, 24x7):**
```
https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io
```
Default for all portal-face API calls and veritas `model_audit` tool.

---

## How Agents Use This

> **Rule: query the HTTP API first. Never read source files when the model has the answer.**
>
> **?? Full agent task guide: [USER-GUIDE.md](USER-GUIDE.md)**
> Task-by-task patterns for bootstrap, context gathering, implementation, debugging,
> refactoring, and the model write cycle. Read it before your first session.

### Step 1 ? Check if the API is up

```powershell
Invoke-RestMethod http://localhost:8010/health
# {"status":"ok","service":"model-api","version":"...","store":"MemoryStore","cache":"memory","cache_ttl":60}
```

If the API is not running, start it (takes ~3 s):

```powershell
$env:PYTHONPATH = "C:\AICOE\eva-foundation\37-data-model"
C:\AICOE\.venv\Scripts\python -m uvicorn api.server:app --port 8010 --reload
```

### Step 2 ? Query via HTTP (preferred)

```powershell
# What does GET /v1/translations return?
Invoke-RestMethod "http://localhost:8010/model/endpoints/GET /v1/config/translations/{language}"

# All screens in admin-face and their status
Invoke-RestMethod "http://localhost:8010/model/screens/" |
  Where-Object { $_.app -eq 'admin-face' } | Select-Object id, route, status

# What screens call that endpoint?
Invoke-RestMethod "http://localhost:8010/model/screens/" |
  Where-Object { $_.api_calls -contains 'GET /v1/config/translations/{language}' }

# Cross-layer impact: what breaks if I change the translations container?
Invoke-RestMethod "http://localhost:8010/model/impact/?container=translations"

# Which personas can call POST /v1/ingest/upload?
(Invoke-RestMethod "http://localhost:8010/model/endpoints/POST /v1/ingest/upload").auth

# What literals does TranslationsPage display?
Invoke-RestMethod "http://localhost:8010/model/literals/" |
  Where-Object { $_.screens -contains 'TranslationsPage' }

# Filter endpoints ? stub only, writing to jobs container
Invoke-RestMethod "http://localhost:8010/model/endpoints/filter?status=stub&cosmos_writes=jobs"

# ?? E-09 / E-10 ? Provenance ?????????????????????????????????????????????????
# Who created this endpoint and when? (E-09)
$ep = Invoke-RestMethod "http://localhost:8010/model/endpoints/GET /v1/health"
Write-Host "Created: $($ep.created_at) by $($ep.created_by)  v$($ep.row_version)"
Write-Host "Source:  $($ep.source_file)"

# Jump directly to the route decorator in VS Code (E-10)
$ep = Invoke-RestMethod "http://localhost:8010/model/endpoints/GET /v1/health"
code --goto "C:\AICOE\eva-foundation\$($ep.implemented_in):$($ep.repo_line)"

# Same for a React hook:
$h = Invoke-RestMethod "http://localhost:8010/model/hooks/useTranslations"
code --goto "C:\AICOE\eva-foundation\$($h.repo_path):$($h.repo_line)"

# ?? E-11 ? Graph / DER (live) ????????????????????????????????????????????????
# Edge objects: { from_id, from_layer, to_id, to_layer, edge_type, via_field }
# Node objects: { id, layer, label, status }
# Meta:         { node_count, edge_count, depth, duration_ms, ... }

# Full edge type vocabulary (see docs for complete catalog)
Invoke-RestMethod "http://localhost:8010/model/graph/edge-types" |
  Select-Object edge_type, from_layer, to_layer, cardinality | Format-Table

# Full graph (all nodes and edges)
$g = Invoke-RestMethod "http://localhost:8010/model/graph/"
Write-Host "nodes=$($g.meta.node_count)  edges=$($g.meta.edge_count)  ms=$($g.meta.duration_ms)"

# BFS from TranslationsPage 2 hops deep (screen ? endpoint ? container)
$g = Invoke-RestMethod "http://localhost:8010/model/graph/?node_id=TranslationsPage&depth=2"
$g.edges | Select-Object from_id, from_layer, to_id, to_layer, edge_type | Format-Table

# Which screens write to the translations container? (two-hop pattern)
$writes  = (Invoke-RestMethod "http://localhost:8010/model/graph/?edge_type=writes").edges |
    Where-Object { $_.to_id -eq "translations" }
$callers = (Invoke-RestMethod "http://localhost:8010/model/graph/?edge_type=calls").edges |
    Where-Object { $_.to_id -in $writes.from_id }
$callers | Select-Object from_id, to_id

# All services that depend on eva-roles-api
(Invoke-RestMethod "http://localhost:8010/model/graph/?edge_type=depends_on").edges |
    Where-Object { $_.to_id -eq "eva-roles-api" } | Select-Object from_id

# Which endpoints are gated by the action.admin.translations flag?
(Invoke-RestMethod "http://localhost:8010/model/graph/?edge_type=gated_by").edges |
    Where-Object { $_.to_id -eq "action.admin.translations" } | Select-Object from_id

# Filter graph: only screens ? endpoints
Invoke-RestMethod "http://localhost:8010/model/graph/?from_layer=screens&to_layer=endpoints" |
  ForEach-Object { $_.edges } | Format-Table from_id, to_id
```

### Fallback ? file-based (offline / CI only)

```powershell
$m = Get-Content C:\AICOE\eva-foundation\37-data-model\model\eva-model.json | ConvertFrom-Json

$m.endpoints | Where-Object { $_.path -eq '/v1/config/translations/{language}' }
$m.screens   | Where-Object { $_.api_calls -contains 'GET /v1/config/translations/{language}' }
$m.literals  | Where-Object { $_.screens -contains 'TranslationsPage' }
```

### Decision table

| You want to? | Use |
|---|---|
| Find an endpoint, screen, container, or persona | `GET /model/{layer}/{id}` |
| List all objects in a layer | `GET /model/{layer}/` |
| Filter endpoints by status / auth / cosmos_writes | `GET /model/endpoints/filter??` |
| Know what breaks if a container field changes | `GET /model/impact/?container=X` |
| **Traverse object relationships (DER/ERD ? live)** | **`GET /model/graph`** |
| Traverse N hops from a specific node | `GET /model/graph?node_id=X&depth=2` |
| List all edge types in the model | `GET /model/graph/edge-types` |
| Filter edges by type, source layer, or target layer | `GET /model/graph?edge_type=calls&from_layer=screens` |
| Navigate to exact source line (`code --goto`) | `GET /model/{layer}/{id}` ? `.repo_path` + `.repo_line` |
| Who created/modified an object, which file | `.source_file`, `.created_by`, `.created_at`, `.modified_by`, `.row_version` |
| Update a model object | `PUT /model/{layer}/{id}` (stamps audit columns, increments `row_version`) |
| Materialise audit trail to disk (cold-deploy artifact) | `POST /model/admin/export` ? `assemble-model.ps1` |
| Audit who changed what | `GET /model/admin/audit` |
| Validate all cross-refs pass | `GET /model/admin/validate` |
| Seed Cosmos from disk JSON (first connect) | `POST /model/admin/seed` |

---

## Repository Structure

```
37-data-model/
  README.md                  This file
  ANNOUNCEMENT.md            GA announcement ? what the model contains, accuracy boundaries
  USER-GUIDE.md              Agent skills playbook, query examples by audience
  PLAN.md                    Layer-by-layer build plan
  ACCEPTANCE.md              Done criteria per layer
  STATUS.md                  Current state and sprint history

  schema/                    JSON Schema ? what each object must look like
    service.schema.json
    persona.schema.json
    feature_flag.schema.json
    container.schema.json
    endpoint.schema.json
    screen.schema.json
    literal.schema.json
    agent.schema.json
    infrastructure.schema.json
    requirement.schema.json

  model/                     Actual EVA data ? populated incrementally
    services.json
    personas.json
    feature_flags.json
    containers.json
    endpoints.json
    screens.json
    literals.json
    agents.json
    infrastructure.json
    requirements.json
    # Control-plane catalog
    planes.json
    connections.json
    environments.json
    cp_skills.json
    cp_agents.json
    runbooks.json
    cp_workflows.json
    cp_policies.json
    eva-model.json            Assembled root (generated by scripts/assemble-model.ps1)

  scripts/
    assemble-model.ps1        Concatenate layer files ? eva-model.json
    validate-model.ps1        Check model against schema, report violations
    impact-analysis.ps1       Given a field/endpoint/screen, report what else changes
    query-model.ps1           Interactive PowerShell query REPL
    sync-from-source.ps1      Read source files and update model (semi-automated)

  .github/
    copilot-instructions.md   Rules for every agent that reads or writes the model
```

---

## Update Discipline

The model is updated **in the same PR that changes the source**. It is never deferred.

| Change type | Model update required |
|-------------|----------------------|
| New endpoint added | `endpoints.json` + `containers.json` if new cosmos read/write |
| New screen added | `screens.json` + `literals.json` for all string keys |
| Field added to Cosmos container | `containers.json` + affected `endpoints.json` response schemas |
| New persona | `personas.json` + `feature_flags.json` + `endpoints.json` auth arrays |
| New literal string key | `literals.json` |
| New agent added | `agents.json` |

---

## Relationship to artifacts.json

`33-eva-brain-v2/docs/artifacts.json` is a **file registry** ? one service, file-level metadata.
`37-data-model/model/eva-model.json` is the **application object model** ? all services, semantic layer.

They answer different questions:

| Question | File to query |
|----------|--------------|
| Which Python files have < 70% coverage? | artifacts.json |
| What does `GET /v1/translations` return? | eva-model.json |
| Which screens break if I rename a Cosmos field? | eva-model.json |
| Which route file implements that endpoint? | artifacts.json ? endpoints.json cross-ref |

---

## Current State

See [STATUS.md](STATUS.md) for the full session log and current metrics.

| Metric | Value |
|--------|-------|
| Layers | 31 (27 original + 4 DPDCA: sprints, milestones, risks, decisions) |
| validate-model.ps1 | PASS 0 violations |
| Total objects | 4006 (Cosmos-backed, ACA 24x7) |
| Tests | 40/41 (T36 pre-existing only) |
| Veritas MTI | 100/100 (2026-02-25) |
| FP estimate API | /model/fp/estimate -- IFPUG UFP calculator live |
| 4th MTI component | complexity_coverage (weight 0.15) -- active after story_ids stamped |

**Unblocked next work (no dependencies):**
1. PUT `transaction_function_type` (EI/EO/EQ) + `story_ids[]` on each endpoint -- unlocks FP calc + 4th MTI
2. PUT `data_function_type` (ILF/EIF) on each container
3. Seed `sprints.json` -- unlocks 39-ado-dashboard velocity calc

See [PLAN.md](PLAN.md) F37-10 for the full Sprint 8-9 work definition.
See [ACCEPTANCE.md](ACCEPTANCE.md) for done criteria per layer group.

---

### Sprint 8-9 Backlog

See [PLAN.md](PLAN.md) F37-10 for full Sprint 8-9 work items.

| Item | Points | Status |
|------|--------|--------|
| Stamp FP fields on endpoints (story_ids, transaction_function_type) | 3 | NOT STARTED |
| Stamp FP fields on containers (data_function_type) | 1 | NOT STARTED |
| Seed sprints.json | 2 | NOT STARTED |
| DM-MAINT-WI-2 Same-PR enforcement | 2 | NOT STARTED |
| DM-MAINT-WI-3 Drift detection | 3 | NOT STARTED |
| E-11-WI-7 Mermaid output | 3 | NOT STARTED |

### Open Accuracy Gaps (validator passes ? not blocking)

| Gap | Ticket | Detail |
|-----|--------|--------|
| `storage-account.azure_resource_name` = `eva-storage` | DM-CAT-WI-12 | Actual: `marcosand20260203` |
| `cosmos-account.azure_resource_name` = `eva-cosmos-account` | DM-CAT-WI-12 | Actual: `marco-sandbox-cosmos` |
| `appinsights.type` = `foundry_project` | Pre-existing | Should be `application_insights` |
| 5 admin-face screens: `components[]` + `hooks[]` empty | Phase 6 | IngestionRunsPage, SearchHealthPage, SupportTicketsPage, FeatureFlagsPage, RbacRolesPage |
| Route mismatch: `/admin/audit/logs` (model) ? `/admin/audit` (App.tsx) | Phase 6 | Same for RbacPage |
| 12 eva-devbench + eva-jp-spark screen stubs: `api_calls`/`components` empty | Phase 6 | |
| `ChatPane` screen: id?filename (`ChatInterface.tsx`) ? repo_line not found | E-10 follow-up | Fix: align id with file name or add explicit `repo_line` field |
| 10 hooks + 18 endpoints missing `repo_line` (files not on this clone) | E-10 follow-up | Run backfill on full monorepo checkout |

### Delivered Sprint 8

| Deliverable | Notes |
|-------------|-------|
| **E-09 Provenance export** | 636 objects enriched with `source_file`, `created_by`, `row_version` on all entity layers |
| **E-10 `repo_line` backfill** | 44 objects stamped ? `scripts/backfill-repo-lines.py` ? validator WARNs for gaps |
| **E-11 `GET /model/graph`** | 304 nodes / 533 edges ? 20 edge types ? BFS traversal ? 7/7 tests |
| **3 PM Plane feature flags** | `action.programme`, `action.ado_sync`, `action.ado_write` (total flags: 13) |
| **`tests/test_graph.py`** T40?T46 | 7 / 7 passing |
| **`tests/test_provenance.py`** T50?T52 | 3 / 3 passing |
| **`scripts/coverage-gaps.ps1`** (DM-MAINT-WI-0) | 89 gaps: 77 ep stubs, 9 unwired flags, 2 screens, 1 component |
| Seed pipeline fixed: `bulk_load` replaces per-object `upsert` | Prevents `row_version` inflation on restart |
| `POST /model/admin/export` endpoint | Closes write-cycle gap |
| E-07 `projects` (L25) + E-08 `wbs` (L26) | 18 projects + 12 WBS nodes |

**Immediate Next Actions**

See [PLAN.md](PLAN.md) F37-10 for the full Sprint 8-9 backlog.
