# Project Plan

<!-- veritas-normalized 2026-02-25 prefix=F37 source=PLAN.md -->
<!-- Last updated: 2026-02-25 ET -- 31 layers, 4006 objects, MTI=100, Cosmos 24x7 -->

## Feature: Guiding Principle [ID=F37-01]
The model is the single source of truth. One HTTP call beats 10 file reads.
All 31 layers live in Cosmos (ACA 24x7) and local MemoryStore (port 8010 dev).
Every significant object is a typed node with explicit cross-references.

## Feature: Layer Build Order [ID=F37-02]
L0-L2 Foundation -> L3-L10 Data/API/UI/Agents/Requirements ->
L11-L17 Control Plane -> L18-L20 Frontend -> L21-L24 Catalog ->
L25-L26 Project Plane -> L27-L30 DPDCA Sprint/Milestone/Risk/Decision

## Feature: Sprint 1 -- Foundation Layers (L0-L2) [ID=F37-03] [DONE]
Completed 2026-02-20. 3 schemas, 3 model files, 2 scripts.

### Story: Deliverables [ID=F37-03-001]

- [x] `schema/service.schema.json` [ID=F37-03-001-T01]
- [x] `schema/persona.schema.json` [ID=F37-03-001-T02]
- [x] `schema/feature_flag.schema.json` [ID=F37-03-001-T03]
- [x] `model/services.json` -- 36 services (grew from 9 via Phase 5 wave) [ID=F37-03-001-T04]
- [x] `model/personas.json` -- 10 personas [ID=F37-03-001-T05]
- [x] `model/feature_flags.json` -- 15 flags [ID=F37-03-001-T06]
- [x] `scripts/validate-model.ps1` [ID=F37-03-001-T07]
- [x] `scripts/assemble-model.ps1` [ID=F37-03-001-T08]

### Story: Acceptance [ID=F37-03-002]
Done. validate-model.ps1 PASS 0 violations. assemble-model.ps1 31/31 [OK].

## Feature: Sprint 2 -- Data and API Layers (L3-L5) [ID=F37-04] [DONE]
Completed 2026-02-21. 3 schemas, 3 model files, impact-analysis.ps1.

### Story: Deliverables [ID=F37-04-001]

- [x] `schema/container.schema.json` -- extended 2026-02-25 with data_function_type + det_count [ID=F37-04-001-T01]
- [x] `schema/endpoint.schema.json` -- extended 2026-02-25 with story_ids, transaction_function_type, ftr_count [ID=F37-04-001-T02]
- [x] `schema/schema.schema.json` [ID=F37-04-001-T03]
- [x] `model/containers.json` -- 13 containers [ID=F37-04-001-T04]
- [x] `model/endpoints.json` -- 187 endpoints (implemented 52, stub 37, planned 98) [ID=F37-04-001-T05]
- [x] `model/schemas.json` -- 37 schemas [ID=F37-04-001-T06]
- [x] `scripts/impact-analysis.ps1` [ID=F37-04-001-T07]
- [x] Cross-reference validated [ID=F37-04-001-T08]

### Story: Acceptance [ID=F37-04-002]
Done. PASS 0 violations. FP fields added 2026-02-25 for IFPUG UFP calculator.

## Feature: Sprint 3 -- UI Layers (L6-L7) [ID=F37-05] [DONE]
Completed 2026-02-22. 2 schemas, screens + literals cataloged.

### Story: Deliverables [ID=F37-05-001]

- [x] `schema/screen.schema.json` [ID=F37-05-001-T01]
- [x] `schema/literal.schema.json` [ID=F37-05-001-T02]
- [x] `model/screens.json` -- 46 screens (admin-face 10, chat-face 1, portal-face 6, devbench/jp-spark stubs) [ID=F37-05-001-T03]
- [x] `model/literals.json` -- 375 literal keys (+96 WI-9/10/12-16, +58 portal model/modelReport) [ID=F37-05-001-T04]
- [x] Cross-reference validated [ID=F37-05-001-T05]

### Story: Acceptance [ID=F37-05-002]
Done. PASS 0 violations. Browser UI at /model and /model/report shipped 2026-02-25.

## Feature: Sprint 4 -- Agent Fleet + Infrastructure Layers (L8-L9) [ID=F37-06] [DONE]
Completed 2026-02-22. Agents catalog + Azure infrastructure resources.

### Story: Deliverables [ID=F37-06-001]

- [x] `schema/agent.schema.json` [ID=F37-06-001-T01]
- [x] `schema/infrastructure.schema.json` [ID=F37-06-001-T02]
- [x] `model/agents.json` -- 12 agents (4 app + 4 cp + 4 new agentic) [ID=F37-06-001-T03]
- [x] `model/infrastructure.json` -- 23 resources (provisioned 12, planned 11) [ID=F37-06-001-T04]
- [x] Cross-reference: agents reference output screens and input endpoints [ID=F37-06-001-T05]

### Story: Acceptance [ID=F37-06-002]
Done. PASS 0 violations.

## Feature: Sprint 5 -- Requirements Traceability Layer (L10) [ID=F37-07] [DONE]
Completed 2026-02-22. Requirements layer + coverage-gaps.ps1.

### Story: Deliverables [ID=F37-07-001]

- [x] `schema/requirement.schema.json` [ID=F37-07-001-T01]
- [x] `model/requirements.json` -- 29 requirements [ID=F37-07-001-T02]
- [x] Every requirement cross-referenced to endpoints[] and screens[] [ID=F37-07-001-T03]
- [x] `scripts/coverage-gaps.ps1` -- 89 gaps reported on first run [ID=F37-07-001-T04]

### Story: Acceptance [ID=F37-07-002]
Done. PASS 0 violations. DM-MAINT-WI-0 complete.

## Feature: Ongoing -- How the Model Grows and Is Maintained [ID=F37-08] [DONE]
Completed 2026-02-25. All governance stories have evidence scripts. MTI=100.

### Story: Growth Path 1 -- Same-PR Rule (day-to-day) [ID=F37-08-001]
`evidence/F37-08-001.py` -- [PASS] veritas score 100.

### Story: Growth Path 2 -- Sprint-Close Audit (every sprint) [ID=F37-08-002]
`evidence/F37-08-002.py` -- [PASS] sprint-close audit procedure documented.

### Story: Growth Path 3 -- Ecosystem Expansion (new service or repository) [ID=F37-08-003]
`evidence/F37-08-003.py` -- [PASS] expansion playbook documented.

### Story: Growth Path 4 -- New Model Layer (extending the schema) [ID=F37-08-004]
`evidence/F37-08-004.py` -- [PASS] layer extension pattern documented.

### Story: Validation Gate (all paths) [ID=F37-08-005]
`evidence/F37-08-005.py` -- [PASS] validate-model.ps1 PASS 0 violations.

### Story: Drift Signals -- How to Know the Model Is Stale [ID=F37-08-006]
`evidence/F37-08-006.py` -- [PASS] drift signal catalog documented.

### Story: Governance [ID=F37-08-007]
`evidence/F37-08-007.py` -- [PASS] governance charter documented.

## Feature: Dependencies [ID=F37-09]
CosmosDB: marco-sandbox-cosmos / evamodel / model_objects (24x7 ACA-backed).
ACA: marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io
APIM: marco-sandbox-apim.azure-api.net/data-model (CI/cloud agents).
Python venv: C:\AICOE\.venv\Scripts\python.exe

## Feature: Sprint 8-9 -- IFPUG FP Stamping + Sprint Seeds [ID=F37-10]
In progress. F37-10-001/002/003 DONE. ACA revision cosmos-v2 (20260225-2123, image:latest, cx26) deployed. F37-10-006 DONE.

### Story: Stamp transaction_function_type + story_ids on endpoints [ID=F37-10-001] [DONE]
Completed 2026-02-25. scripts/stamp-tft.ps1 stamped all 76 implemented endpoints.
EI=23 EO=25 EQ=28. story_ids already present on all 76 (G05 PASS).
G04: PASS 76/76 stamped. Unlocks FP calculator accuracy + 4th MTI component.

### Story: Stamp data_function_type on containers [ID=F37-10-002] [DONE]
Completed 2026-02-25. scripts/stamp-dft.ps1 stamped all 13 containers.
ILF=12 (jobs/chunks/sessions/messages/etc) EIF=1 (model_objects, owned by 37-data-model).
G06: PASS 13/13 stamped. Unlocks ILF/EIF terms in FP estimate.

### Story: Seed sprints.json -- Sprint-Backlog + Sprint 1-7 [ID=F37-10-003] [DONE]
Completed 2026-02-25 Session 16. model/sprints.json has 9 records (sprint-backlog + sprint-1 through sprint-8).
Seeded into Cosmos via POST /model/admin/seed after ACA redeploy.
G07: PASS 9 sprint records -- velocity calc enabled.
Unlocks: 39-ado-dashboard F39-01-004 velocity calculation.

### Story: DM-MAINT-WI-2 -- Same-PR enforcement check [ID=F37-10-004] [NOT STARTED]
Script that checks whether any source file changed without a corresponding model UPDATE.
Runs in GitHub Action on PR. 2 pts.

### Story: DM-MAINT-WI-3 -- Scheduled drift detection [ID=F37-10-005] [NOT STARTED]
cron job: compare GET /model/endpoints/filter?status=implemented against
implemented_in file list. Report drift. 3 pts.

### Story: E-11-WI-7 -- Mermaid graph output [ID=F37-10-006] [DONE]
Completed 2026-02-25 Session 16. api/routers/graph.py: added _safe_mid() + _to_mermaid() + fmt=Query(alias=format) param.
GET /model/graph/?format=mermaid returns flowchart LR Mermaid diagram (plain text).
Test T47 added to tests/test_graph.py: 41/42 passing. 3 pts.

## Feature: Core API Endpoints [ID=F37-API]
All implemented. Status: implemented in data model. ACA: 24x7.

### Story: GET /health [ID=F37-HEALTH-001]
Returns status, store, version, cache. PASS -- Cosmos-backed on ACA.

### Story: GET /ready [ID=F37-READY-001]
Returns store_reachable bool + latency. Use before any bulk operation.

### Story: GET /model/agent-summary [ID=F37-MODEL-001]
One-call state check: all 31 layer counts + total objects. Agent bootstrap step 1.

### Story: GET /model/agent-guide [ID=F37-MODEL-002]
Complete agent operating protocol. Agent bootstrap step 2.

### Story: GET /model/{layer}/ [ID=F37-OBJ_IDPATH-001]
List all objects in a layer. Cached (60s TTL).

### Story: GET /model/{layer}/{id} [ID=F37-OBJ_IDPATH-002]
Get one object by id. 404 if soft-deleted.

### Story: PUT /model/{layer}/{id} [ID=F37-OBJ_IDPATH-003]
Upsert -- stamps audit columns + increments row_version. Requires X-Actor header.

### Story: DELETE /model/{layer}/{id} [ID=F37-OBJ_IDPATH-004]
Soft-delete (is_active=false). Audit-logged.

### Story: GET /model/endpoints/filter [ID=F37-FILTER-001]
Filter endpoints by status, cosmos_writes, cosmos_reads, auth, feature_flag.

### Story: GET /model/impact [ID=F37-IMPACT-001]
Cross-layer impact: what endpoints/screens/agents break if container X changes.

### Story: GET /model/graph [ID=F37-GRAPH-001]
Typed edge list across all 31 layers. BFS traversal (node_id + depth). 20 edge types.

### Story: GET /model/graph/edge-types [ID=F37-EDGETYPES-001]
Edge type vocabulary (20 types: calls, reads, writes, depends_on, ...).

### Story: GET /model/fp/estimate [ID=F37-FP-001]
IFPUG UFP calculator. Queries containers (ILF/EIF) + endpoints (EI/EO/EQ).
Derives UFP, story-point estimate (UFP*2.4), effort-days (UFP*0.5).

### Story: POST /model/admin/seed [ID=F37-SEED-001]
Seed Cosmos from disk JSON. Idempotent. Cold-deploy use only.

### Story: POST /model/admin/export [ID=F37-EXPORT-001]
Export in-memory store to model/*.json + rebuild eva-model.json.

### Story: POST /model/admin/commit [ID=F37-COMMIT-001]
Full write cycle: export + assemble + validate. Returns violation_count + exported_total.
On ACA: assemble.rc=-1 is expected (script not deployed) -- check violation_count=0 only.

### Story: GET /model/admin/validate [ID=F37-VALIDATE-001]
In-process validation. Same checks as validate-model.ps1.

### Story: GET /model/admin/audit [ID=F37-AUDIT-001]
Audit trail -- last N writes across all layers.

### Story: POST /model/admin/backfill [ID=F37-BACKFILL-001]
Backfill repo_line and source_file fields from source scanning.
