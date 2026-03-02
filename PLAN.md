# Project Plan

<!-- veritas-normalized 2026-02-25 prefix=F37 source=PLAN.md -->
<!-- Last updated: 2026-03-01 ET -- MTI=74, Cosmos 24x7, Evidence Layer LIVE -->

## Feature: Guiding Principle [ID=F37-01]
The model is the single source of truth. One HTTP call beats 10 file reads.
All entity layers live in Cosmos (ACA 24x7) and local MemoryStore (port 8010 dev).
For complete layer catalog, see docs/library/03-DATA-MODEL-REFERENCE.md.

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
Typed edge list across entity layers. BFS traversal (node_id + depth). 20 edge types.

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

---

## Epic FK -- FK Enhancement (12 Sprints, 403h, 52 Stories, 83 FP)

Automated execution via DPDCA + GitHub Actions. March 2026 - February 2027.
See: `docs/FK-ENHANCEMENT-EXECUTION-PLAN-2026-03-01.md` for complete details.

## Feature: Sprint 0 -- Phase 0 Validation (48h, 3 stories, 5 FP) [ID=F37-FK-SPRINT0]

### Story: Implement string-array validator [ID=F37-FK-001]
- Size: M, 2 FP, 15h
- File: api/validation.py
- Validates: calls_endpoints, reads_containers, writes_containers
- Acceptance: Validator rejects invalid endpoint/container references

### Story: Integrate validator into PUT routers [ID=F37-FK-002]
- Size: XS, 1 FP, 8h
- Files: api/routers/endpoints.py, api/routers/screens.py
- Returns 422 if validation fails with detailed error message
- Acceptance: PUT with invalid reference returns 422 with error list

### Story: Backfill validation + reporting [ID=F37-FK-003]
- Size: M, 2 FP, 25h
- File: scripts/validate-all-refs.py
- Scans all 187 endpoints + 50 screens for invalid cross-references
- Acceptance: Script identifies all existing violations

## Feature: Sprint 1 -- Phase 1A Store Interface + Schema (80h, 8 stories, 13 FP) [ID=F37-FK-SPRINT1]

### Story: Define RelationshipMeta schema [ID=F37-FK-101]
- Size: L, 5 FP, 30h
- File: schema/relationship.schema.json
- Fields: id, from_layer, from_id, to_layer, to_id, edge_type, cascade_on_delete, valid_from, valid_to
- 27 edge types enum (20 existing + 7 new)
- Acceptance: Schema validates against all relationship patterns

### Story: Extend AbstractStore interface [ID=F37-FK-102]
- Size: M, 3 FP, 20h
- File: api/store.py
- Methods: put_relationship(), get_relationships(), delete_relationship()
- Acceptance: Interface compiles, typed correctly

### Story: Implement MemoryStore adapter [ID=F37-FK-103]
- Size: M, 2 FP, 12h
- File: api/memory_store.py
- In-memory dict storage for relationships with temporal query support
- Acceptance: MemoryStore passes relationship CRUD tests

### Story: Add /relationships router stub [ID=F37-FK-104]
- Size: S, 1 FP, 6h
- File: api/routers/relationships.py
- Routes: GET/PUT/DELETE endpoints (stub status)
- Acceptance: Routes registered, OpenAPI docs updated

### Story: Update layer registry [ID=F37-FK-105]
- Size: XS, 0.5 FP, 4h
- File: api/layers.py
- Add relationships to LAYER_REGISTRY
- Acceptance: /model/agent-summary includes relationships layer

### Story: Seed initial relationship test data [ID=F37-FK-106]
- Size: S, 1 FP, 4h
- File: model/relationships.json
- 10 sample relationships covering all edge types
- Acceptance: GET /model/relationships/ returns test data

### Story: Update USER-GUIDE [ID=F37-FK-107]
- Size: XS, 0.5 FP, 2h
- Section: Working with Relationships
- Acceptance: USER-GUIDE section added with code examples

### Story: Add relationship validation gate [ID=F37-FK-108]
- Size: S, 1 FP, 2h
- File: scripts/validate-model.ps1
- Check relationship cross-references
- Acceptance: Validator catches invalid relationship references

## Feature: Sprint 2 -- Phase 1B Scenarios Layer (40h, 5 stories, 8 FP) [ID=F37-FK-SPRINT2]

### Story: Define scenarios schema [ID=F37-FK-201]
- Size: L, 3 FP, 15h
- File: schema/scenario.schema.json
- Fields: id, parent_scenario_id, version, status, changes, merged_at
- Acceptance: Schema supports branching + merge workflow

### Story: Implement saga pattern for scenario merge [ID=F37-FK-202]
- Size: M, 2 FP, 10h
- File: api/scenario_merge.py
- Saga pattern with compensation log (no atomic transaction)
- Acceptance: Merge succeeds or rolls back with compensation log

### Story: Add scenarios router [ID=F37-FK-203]
- Size: M, 2 FP, 8h
- File: api/routers/scenarios.py
- Routes: GET/PUT/POST/DELETE + /merge action
- Acceptance: Scenarios CRUD + merge endpoint working

### Story: Seed scenario test data [ID=F37-FK-204]
- Size: S, 0.5 FP, 4h
- File: model/scenarios.json
- 3 sample scenarios (dev, staging, prod)
- Acceptance: Scenarios layer seeded, queryable

### Story: Update docs with saga pattern [ID=F37-FK-205]
- Size: S, 0.5 FP, 3h
- File: docs/FK-ENHANCEMENT-RESEARCH
- Add saga pattern code + failure handling
- Acceptance: Docs explain compensation log + retry strategy

## Feature: Sprint 3 -- Phase 1C IaC Layer (30h, 4 stories, 6 FP) [ID=F37-FK-SPRINT3]

### Story: Define iac_templates schema [ID=F37-FK-301]
- Size: M, 2 FP, 12h
- File: schema/iac_template.schema.json
- FK field: scenario_id (links template to scenario version)
- Acceptance: Schema supports Bicep/Terraform templates

### Story: Implement IaC router [ID=F37-FK-302]
- Size: S, 1.5 FP, 8h
- File: api/routers/iac_templates.py
- Routes: GET/PUT/DELETE + /generate action
- Acceptance: IaC CRUD + generation endpoint working

### Story: Seed IaC template library [ID=F37-FK-303]
- Size: S, 1.5 FP, 6h
- File: model/iac_templates.json
- 5 templates (ACA, Function App, APIM, Cosmos, Storage)
- Acceptance: Templates seeded, linked to scenarios

### Story: Update docs [ID=F37-FK-304]
- Size: S, 1 FP, 4h
- File: docs/library/10-FK-ENHANCEMENT.md
- Add IaC generation workflow
- Acceptance: Library updated with IaC examples

## Feature: Sprint 4 -- Phase 1D Pipelines Layer (30h, 4 stories, 6 FP) [ID=F37-FK-SPRINT4]

### Story: Define pipelines schema [ID=F37-FK-401]
- Size: M, 2 FP, 12h
- File: schema/pipeline.schema.json
- Edge type: pipeline_depends_on_iac_template
- Acceptance: Schema supports CI/CD pipeline definitions

### Story: Implement pipelines router [ID=F37-FK-402]
- Size: S, 1.5 FP, 8h
- File: api/routers/pipelines.py
- Routes: GET/PUT/DELETE + /run action
- Acceptance: Pipelines CRUD + run endpoint working

### Story: Seed pipeline definitions [ID=F37-FK-403]
- Size: S, 1.5 FP, 6h
- File: model/pipelines.json
- 3 pipelines (build, test, deploy)
- Acceptance: Pipelines seeded with FK dependencies

### Story: Update docs [ID=F37-FK-404]
- Size: S, 1 FP, 4h
- File: docs/library/10-FK-ENHANCEMENT.md
- Add pipeline orchestration workflow
- Acceptance: Library updated with pipeline examples

## Feature: Sprint 5 -- Phase 1E Workflows Layer (25h, 3 stories, 5 FP) [ID=F37-FK-SPRINT5]

### Story: Define workflows schema [ID=F37-FK-501]
- Size: M, 2 FP, 10h
- File: schema/workflow.schema.json
- Edge type: workflow_triggers_pipeline
- Acceptance: Schema supports workflow orchestration

### Story: Implement workflows router [ID=F37-FK-502]
- Size: M, 2 FP, 10h
- File: api/routers/workflows.py
- Routes: GET/PUT/DELETE + /execute action
- Acceptance: Workflows CRUD + execute endpoint working

### Story: Seed + document workflows [ID=F37-FK-503]
- Size: S, 1 FP, 5h
- Files: model/workflows.json, docs/library/10-FK-ENHANCEMENT.md
- 2 workflows (DPDCA, release)
- Acceptance: Workflows seeded, docs updated

## Feature: Sprint 6 -- Phase 1F Snapshots Layer (20h, 3 stories, 4 FP) [ID=F37-FK-SPRINT6]

### Story: Define snapshots schema [ID=F37-FK-601]
- Size: M, 1.5 FP, 8h
- File: schema/snapshot.schema.json
- Captures point-in-time state of all layers + relationships
- Acceptance: Schema supports temporal queries

### Story: Implement snapshots router [ID=F37-FK-602]
- Size: M, 1.5 FP, 8h
- File: api/routers/snapshots.py
- Routes: POST /create, GET /{id}, GET /{id}/restore
- Acceptance: Snapshot CRUD working, restore endpoint returns historical state

### Story: Seed + document snapshots [ID=F37-FK-603]
- Size: S, 1 FP, 4h
- Create 1 test snapshot + update docs
- Acceptance: Snapshot seeded, docs updated with temporal query examples

## Feature: Sprint 7 -- Phase 2 CosmosStore Implementation (15h, 2 stories, 3 FP) [ID=F37-FK-SPRINT7]

### Story: Implement CosmosStore.put_relationship() [ID=F37-FK-701]
- Size: M, 1.5 FP, 8h
- File: api/cosmos_store.py
- Partition key: from_layer:from_id
- Acceptance: CosmosStore passes relationship CRUD tests

### Story: Deploy /relationships container to ACA [ID=F37-FK-702]
- Size: M, 1.5 FP, 7h
- File: infra/cosmos-containers.bicep
- Indexes: /from_layer, /to_layer, /edge_type, /valid_from
- Acceptance: Container deployed, API writes relationships to Cosmos

## Feature: Sprint 8 -- Phase 3 Migration Utilities (35h, 4 stories, 7 FP) [ID=F37-FK-SPRINT8]

### Story: Implement backfill script for endpoints [ID=F37-FK-801]
- Size: L, 3 FP, 15h
- File: scripts/backfill-endpoint-relationships.py
- Scans all endpoints, extracts cross-references, writes RelationshipMeta
- Acceptance: Script creates relationships for all 187 endpoints

### Story: Backfill script for screens [ID=F37-FK-802]
- Size: M, 2 FP, 10h
- File: scripts/backfill-screen-relationships.py
- Extracts: api_calls, literals_used, agent_calls
- Acceptance: Script creates relationships for all 50 screens

### Story: Backfill script for services/agents [ID=F37-FK-803]
- Size: S, 1 FP, 6h
- File: scripts/backfill-service-agent-relationships.py
- Patterns: service->endpoints, agent->screens
- Acceptance: All service/agent relationships backfilled

### Story: Validation report generator [ID=F37-FK-804]
- Size: S, 1 FP, 4h
- File: scripts/validate-relationship-coverage.py
- Reports: Coverage percentage per layer, missing relationships
- Acceptance: Report confirms 100% cross-reference migration

## Feature: Sprint 9 -- Phase 4 Graph API Enhancement (35h, 5 stories, 8 FP) [ID=F37-FK-SPRINT9]

### Story: Implement BFS with cycle detection [ID=F37-FK-901]
- Size: L, 3 FP, 12h
- File: api/graph.py
- Fix get_descendants() with proper visited set (CRIT-4 fix)
- Acceptance: BFS handles cycles without infinite loop

### Story: Add edge type filtering to graph queries [ID=F37-FK-902]
- Size: M, 2 FP, 8h
- Endpoint: GET /model/graph/?node_id=X&edge_types=...
- Filter relationships by edge_type before traversal
- Acceptance: Graph query returns only matching edge types

### Story: Implement temporal graph queries [ID=F37-FK-903]
- Size: M, 2 FP, 8h
- Endpoint: GET /model/graph/?node_id=X&as_of=2026-06-01T00:00:00Z
- Filter relationships by valid_from <= as_of <=valid_to
- Acceptance: Temporal query returns point-in-time graph state

### Story: Add graph visualization endpoint [ID=F37-FK-904]
- Size: S, 1 FP, 4h
- Endpoint: GET /model/graph/visualize/?node_id=X&depth=2&format=mermaid
- Returns: Mermaid diagram syntax or GraphViz DOT
- Acceptance: Portal face renders graph visualization

### Story: Update docs + USER-GUIDE [ID=F37-FK-905]
- Size: S, 1 FP, 3h
- Document: BFS algorithm, cycle detection, edge type filters
- Acceptance: USER-GUIDE section complete with examples

## Feature: Sprint 10 -- Phase 5 Cascade Engine (35h, 5 stories, 8 FP) [ID=F37-FK-SPRINT10]

### Story: Implement cascade policy engine [ID=F37-FK-1001]
- Size: L, 3 FP, 12h
- File: api/cascade.py
- Policies: cascade, restrict, set_null, no_action
- Acceptance: Cascade engine respects policy + depth limits

### Story: Add cascade matrix to schema [ID=F37-FK-1002]
- Size: M, 2 FP, 8h
- File: schema/relationship.schema.json
- Add cascade_policy field with default policies by edge type
- Acceptance: Schema includes cascade_policy enum

### Story: Implement impact analysis endpoint [ID=F37-FK-1003]
- Size: M, 2 FP, 8h
- Endpoint: GET /model/impact/?layer=X&id=Y&action=delete&cascade=true
- Returns: List of objects affected by delete + cascade
- Acceptance: Impact analysis endpoint returns accurate dependency tree

### Story: Add cascade UI to portal face [ID=F37-FK-1004]
- Size: S, 1 FP, 4h
- Portal face: Delete button shows impact preview
- Acceptance: Portal face shows cascade impact before delete

### Story: Update docs [ID=F37-FK-1005]
- Size: S, 1 FP, 3h
- File: docs/library/10-FK-ENHANCEMENT.md
- Add cascade policy matrix + examples
- Acceptance: Docs explain all 4 cascade policies

## Feature: Sprint 11 -- Phase 6 Testing + Documentation (45h, 6 stories, 10 FP) [ID=F37-FK-SPRINT11]

### Story: Implement relationship CRUD tests [ID=F37-FK-1101]
- Size: L, 4 FP, 15h
- File: tests/test_relationships.py
- 20+ test cases: create, read, update, delete, temporal queries
- Acceptance: All relationship tests pass with >90% coverage

### Story: Implement graph traversal tests [ID=F37-FK-1102]
- Size: M, 2 FP, 10h
- File: tests/test_graph.py
- BFS cycle detection, depth limits, edge filters
- Acceptance: All graph tests pass, cycle detection verified

### Story: Implement cascade policy tests [ID=F37-FK-1103]
- Size: M, 2 FP, 8h
- File: tests/test_cascade.py
- All 4 policies + dry-run mode
- Acceptance: All cascade tests pass with expected side effects

### Story: Update USER-GUIDE.md (v3.0) [ID=F37-FK-1104]
- Size: S, 1.5 FP, 6h
- Rewrite Section 4: Working with Relationships
- Add: edge type catalog, cascade policies, temporal queries
- Acceptance: USER-GUIDE fully documents FK Enhancement API

### Story: Update library/10-FK-ENHANCEMENT.md (v2.0) [ID=F37-FK-1105]
- Size: S, 1 FP, 4h
- Add: migration guide, agent quick reference, troubleshooting
- Acceptance: Library entry updated for production use

### Story: Update PLAN.md + STATUS.md [ID=F37-FK-1106]
- Size: S, 0.5 FP, 2h
- Mark FK Enhancement as Phase 6 complete
- Update: MTI target (>= 95), test count (>100)
- Acceptance: Governance docs reflect FK Enhancement completion
```
