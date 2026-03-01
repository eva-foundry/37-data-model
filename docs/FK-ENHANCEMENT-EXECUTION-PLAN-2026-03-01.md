# FK Enhancement -- Automated Execution Plan

**Version**: 1.0.0
**Created**: 2026-03-01 17:53 ET
**Author**: GitHub Copilot + Claude Opus 4.6 (architectural review)
**Project**: 37-data-model (EVA Data Model FK Enhancement)
**Execution Model**: Fully automated DPDCA via GitHub Actions

---

## Purpose

This document defines the complete automated execution plan for implementing the FK Enhancement
across 12 sprints (403 hours) from March 2026 to February 2027. Every sprint is executed via
DPDCA (Discover-Plan-Do-Check-Act) workflow with zero manual intervention.

**Three pillars**:
1. **Design complete** -- FK-ENHANCEMENT-COMPLETE-PLAN v2.0.0 approved with Opus 4.6 fixes
2. **Infrastructure ready** -- DPDCA workflow, skills, copilot-instructions integrated from 51-ACA
3. **Automation enabled** -- GitHub Actions workflows trigger on sprint-task label

---

## Sprint Overview (12 Sprints, 403h Total)

| Sprint | Name | Duration | Focus | Stories | FP |
|--------|------|----------|-------|---------|-----|
| 0 | Phase 0 Validation | 48h (Mar 2026) | Server-side string-array validation | 3 | 5 |
| 1 | Store Interface + Schema | 80h (Apr-May 2026) | RelationshipMeta, AbstractStore, MemoryStore | 8 | 13 |
| 2 | Scenarios Layer | 40h (May 2026) | Scenario versioning + saga merge | 5 | 8 |
| 3 | IaC Layer | 30h (Jun 2026) | IaC templates with relationship versioning | 4 | 6 |
| 4 | Pipelines Layer | 30h (Jun 2026) | Pipeline orchestration with FK tracking | 4 | 6 |
| 5 | Workflows Layer | 25h (Jul 2026) | Workflow definitions with edge types | 3 | 5 |
| 6 | Snapshots Layer | 20h (Jul 2026) | Temporal snapshots + point-in-time queries | 3 | 4 |
| 7 | CosmosStore Implementation | 15h (Aug 2026) | Cosmos adapter for /relationships container | 2 | 3 |
| 8 | Migration Utilities | 35h (Sep 2026) | Backfill tools + data migration scripts | 4 | 7 |
| 9 | Graph API Enhancement | 35h (Oct 2026) | BFS with cycle detection + edge type filters | 5 | 8 |
| 10 | Cascade Engine | 35h (Nov 2026) | Cascade policies + impact analysis | 5 | 8 |
| 11 | Testing + Documentation | 45h (Dec 2026-Jan 2027) | Comprehensive test suite + user guide updates | 6 | 10 |
| **Total** | **12 sprints** | **403h** | **Full FK Enhancement + Phase 0** | **52** | **83** |

---

## Phase 0 -- Server-Side Validation (Sprint 0)

**Timeline**: March 2026 (2 weeks, 48h)
**Opus Recommendation**: Implement NOW -- 60% value, zero risk
**Goal**: Prevent data quality issues before FK system starts

### Stories (3)

**F37-FK-001** (M, 2 FP, 15h) -- Implement string-array validator
- `api/validation.py`: Add `validate_endpoint_references()` function
- Validates: `calls_endpoints`, `reads_containers`, `writes_containers`
- Returns: `ValidationResult(valid: bool, errors: list[str])`
- Pattern: Query `/model/endpoints/` and `/model/containers/` for valid IDs
- Acceptance: Validator rejects invalid endpoint/container references

**F37-FK-002** (XS, 1 FP, 8h) -- Integrate validator into PUT routers
- `api/routers/endpoints.py`: Call validator before storing endpoint
- `api/routers/screens.py`: Call validator for `api_calls` field
- Returns 422 if validation fails with detailed error message
- Acceptance: PUT with invalid reference returns 422 with error list

**F37-FK-003** (M, 2 FP, 25h) -- Backfill validation + reporting
- `scripts/validate-all-refs.py`: Scan all 187 endpoints + 50 screens
- Report: CSV with object_id, field, invalid_ref, target_layer
- Optional: `--fix` flag to remove invalid references (dry-run default)
- Acceptance: Script identifies all existing cross-reference violations

---

## Phase 1A -- Store Interface + Schema (Sprint 1)

**Timeline**: April-May 2026 (2 weeks, 80h)
**Goal**: Foundation for relationshipmeta storage

### Stories (8)

**F37-FK-101** (L, 5 FP, 30h) -- Define RelationshipMeta schema
- `schema/relationship.schema.json`: Full schema with edge types
- Fields: `id`, `from_layer`, `from_id`, `to_layer`, `to_id`, `edge_type`, `cascade_on_delete`, `valid_from`, `valid_to`
- 27 edge types enum (20 existing + 7 new)
- Acceptance: Schema validates against all relationship patterns

**F37-FK-102** (M, 3 FP, 20h) -- Extend AbstractStore interface
- `api/store.py`: Add `put_relationship()`, `get_relationships()`, `delete_relationship()`
- `put_relationship()` signature: `(rel: dict, actor: str) -> dict`
- Returns: relationship with `row_version`, audit fields
- Acceptance: Interface compiles, typed correctly

**F37-FK-103** (M, 2 FP, 12h) -- Implement MemoryStore adapter
- `api/memory_store.py`: In-memory dict storage for relationships
- Key: `{from_layer}:{from_id}-{to_layer}:{to_id}:{edge_type}`
- Supports: temporal queries via `valid_from` / `valid_to` filters
- Acceptance: MemoryStore passes relationship CRUD tests

**F37-FK-104** (S, 1 FP, 6h) -- Add /relationships router stub
- `api/routers/relationships.py`: GET/PUT/DELETE endpoints (stub status)
- Routes: `GET /model/relationships/`, `PUT /model/relationships/{id}`, `DELETE /model/relationships/{id}`
- Returns: 501 Not Implemented with Phase 1A note
- Acceptance: Routes registered, OpenAPI docs updated

**F37-FK-105** (XS, 0.5 FP, 4h) -- Update layer registry
- `api/layers.py`: Add "relationships" to LAYER_REGISTRY
- Set: `has_id=True`, `stored_in_cosmos=True`, `edge_layer=True`
- Acceptance: `/model/agent-summary` includes relationships layer

**F37-FK-106** (S, 1 FP, 4h) -- Seed initial relationship test data
- `model/relationships.json`: 10 sample relationships covering all edge types
- Examples: service->endpoint, screen->endpoint, endpoint->container
- Acceptance: `GET /model/relationships/` returns test data

**F37-FK-107** (XS, 0.5 FP, 2h) -- Update USER-GUIDE
- Section: "Working with Relationships"
- Documents: edge types, cascade policies, temporal queries
- Acceptance: USER-GUIDE section added with code examples

**F37-FK-108** (S, 1 FP, 2h) -- Add relationship validation gate
- `scripts/validate-model.ps1`: Check relationship cross-references
- Rule: from_id must exist in from_layer, to_id must exist in to_layer
- Acceptance: Validator catches invalid relationship references

---

## Phase 1B-1F -- Layers + Scenarios (Sprints 2-6)

### Sprint 2: Scenarios Layer (40h, 5 stories, 8 FP)

**F37-FK-201** (L, 3 FP, 15h) -- Define scenarios schema
- `schema/scenario.schema.json`: versioning, branching, merge metadata
- Fields: `id`, `parent_scenario_id`, `version`, `status`, `changes`, `merged_at`
- Acceptance: Schema supports branching + merge workflow

**F37-FK-202** (M, 2 FP, 10h) -- Implement saga pattern for scenario merge
- `api/scenario_merge.py`: `merge_scenario()` with compensation log
- Steps: validate, apply changes, log compensations, mark complete
- No atomic transaction (CRIT-2 fix -- Cosmos has no cross-partition ACID)
- Acceptance: Merge succeeds or rolls back with compensation log

**F37-FK-203** (M, 2 FP, 8h) -- Add scenarios router
- `api/routers/scenarios.py`: GET/PUT/POST/DELETE + `/merge` action
- `/merge` endpoint: triggers saga merge, returns operation_id
- Acceptance: Scenarios CRUD + merge endpoint working

**F37-FK-204** (S, 0.5 FP, 4h) -- Seed scenario test data
- `model/scenarios.json`: 3 sample scenarios (dev, staging, prod)
- Acceptance: Scenarios layer seeded, queryable

**F37-FK-205** (S, 0.5 FP, 3h) -- Update docs with saga pattern
- `docs/FK-ENHANCEMENT-RESEARCH`: Add saga pattern code + failure handling
- Acceptance: Docs explain compensation log + retry strategy

### Sprint 3: IaC Layer (30h, 4 stories, 6 FP)

**F37-FK-301** (M, 2 FP, 12h) -- Define iac_templates schema
- `schema/iac_template.schema.json`: template_type, provider, resources
- FK field: `scenario_id` (links template to scenario version)
- Acceptance: Schema supports Bicep/Terraform templates

**F37-FK-302** (S, 1.5 FP, 8h) -- Implement IaC router
- `api/routers/iac_templates.py`: GET/PUT/DELETE + `/generate` action
- `/generate`: resolves scenario + relationships -> outputs Bicep/TF
- Acceptance: IaC CRUD + generation endpoint working

**F37-FK-303** (S, 1.5 FP, 6h) -- Seed IaC template library
- `model/iac_templates.json`: 5 templates (ACA, Function App, APIM, Cosmos, Storage)
- Acceptance: Templates seeded, linked to scenarios

**F37-FK-304** (S, 1 FP, 4h) -- Update docs
- `docs/library/10-FK-ENHANCEMENT.md`: Add IaC generation workflow
- Acceptance: Library updated with IaC examples

### Sprint 4: Pipelines Layer (30h, 4 stories, 6 FP)

**F37-FK-401** (M, 2 FP, 12h) -- Define pipelines schema
- `schema/pipeline.schema.json`: stages, dependencies, FK tracking
- Edge type: `pipeline_depends_on_iac_template`
- Acceptance: Schema supports CI/CD pipeline definitions

**F37-FK-402** (S, 1.5 FP, 8h) -- Implement pipelines router
- `api/routers/pipelines.py`: GET/PUT/DELETE + `/run` action
- `/run`: validates dependencies, triggers pipeline via FK graph
- Acceptance: Pipelines CRUD + run endpoint working

**F37-FK-403** (S, 1.5 FP, 6h) -- Seed pipeline definitions
- `model/pipelines.json`: 3 pipelines (build, test, deploy)
- Acceptance: Pipelines seeded with FK dependencies

**F37-FK-404** (S, 1 FP, 4h) -- Update docs
- `docs/library/10-FK-ENHANCEMENT.md`: Add pipeline orchestration workflow
- Acceptance: Library updated with pipeline examples

### Sprint 5: Workflows Layer (25h, 3 stories, 5 FP)

**F37-FK-501** (M, 2 FP, 10h) -- Define workflows schema
- `schema/workflow.schema.json`: steps, triggers, FK relationships
- Edge type: `workflow_triggers_pipeline`
- Acceptance: Schema supports workflow orchestration

**F37-FK-502** (M, 2 FP, 10h) -- Implement workflows router
- `api/routers/workflows.py`: GET/PUT/DELETE + `/execute` action
- `/execute`: walks FK graph to determine execution order
- Acceptance: Workflows CRUD + execute endpoint working

**F37-FK-503** (S, 1 FP, 5h) -- Seed + document workflows
- `model/workflows.json`: 2 workflows (DPDCA, release)
- Update `docs/library/10-FK-ENHANCEMENT.md`
- Acceptance: Workflows seeded, docs updated

### Sprint 6: Snapshots Layer (20h, 3 stories, 4 FP)

**F37-FK-601** (M, 1.5 FP, 8h) -- Define snapshots schema
- `schema/snapshot.schema.json`: timestamp, scope, version metadata
- Captures point-in-time state of all layers + relationships
- Acceptance: Schema supports temporal queries

**F37-FK-602** (M, 1.5 FP, 8h) -- Implement snapshots router
- `api/routers/snapshots.py`: POST `/create`, GET `/{id}`, GET `/{id}/restore`
- `/create`: snapshot all layers + relationships to separate JSON blob
- Acceptance: Snapshot CRUD working, restore endpoint returns historical state

**F37-FK-603** (S, 1 FP, 4h) -- Seed + document snapshots
- Create 1 test snapshot of current model state
- Update `docs/library/10-FK-ENHANCEMENT.md`
- Acceptance: Snapshot seeded, docs updated with temporal query examples

---

## Phase 2 -- CosmosStore Implementation (Sprint 7)

**Timeline**: August 2026 (1 week, 15h)
**Goal**: Production Cosmos adapter for /relationships container

### Stories (2)

**F37-FK-701** (M, 1.5 FP, 8h) -- Implement CosmosStore.put_relationship()
- `api/cosmos_store.py`: Add relationship methods to CosmosStore class
- Uses separate `/relationships` container (CRIT-3 fix -- no version conflicts)
- Partition key: `from_layer:from_id` (optimizes query by source object)
- Acceptance: CosmosStore passes relationship CRUD tests

**F37-FK-702** (M, 1.5 FP, 7h) -- Deploy /relationships container to ACA
- `infra/cosmos-containers.bicep`: Add relationships container definition
- Indexes: `/from_layer`, `/to_layer`, `/edge_type`, `/valid_from`
- Deploy to: marco-sandbox-cosmos (dev) + ACA production Cosmos
- Acceptance: Container deployed, API writes relationships to Cosmos

---

## Phase 3 -- Migration Utilities (Sprint 8)

**Timeline**: September 2026 (2 weeks, 35h)
**Goal**: Backfill existing cross-references as RelationshipMeta records

### Stories (4)

**F37-FK-801** (L, 3 FP, 15h) -- Implement backfill script for endpoints
- `scripts/backfill-endpoint-relationships.py`: Scan all endpoints
- Extract: `cosmos_reads`, `cosmos_writes`, `upstream_endpoints`, `downstream_endpoints`
- Write: RelationshipMeta records for each cross-reference
- Acceptance: Script creates relationships for all 187 endpoints

**F37-FK-802** (M, 2 FP, 10h) -- Backfill script for screens
- `scripts/backfill-screen-relationships.py`: Scan all screens
- Extract: `api_calls`, `literals_used`, `agent_calls`
- Write: RelationshipMeta records
- Acceptance: Script creates relationships for all 50 screens

**F37-FK-803** (S, 1 FP, 6h) -- Backfill script for services/agents
- `scripts/backfill-service-agent-relationships.py`
- Patterns: service->endpoints, agent->screens, agent->endpoints
- Acceptance: All service/agent relationships backfilled

**F37-FK-804** (S, 1 FP, 4h) -- Validation report generator
- `scripts/validate-relationship-coverage.py`: Compare old fields vs new relationships
- Report: Coverage percentage per layer, missing relationships
- Acceptance: Report confirms 100% cross-reference migration

---

## Phase 4 -- Graph API Enhancement (Sprint 9)

**Timeline**: October 2026 (2 weeks, 35h)
**Goal**: Production graph traversal with cycle detection

### Stories (5)

**F37-FK-901** (L, 3 FP, 12h) -- Implement BFS with cycle detection
- `api/graph.py`: Fix `get_descendants()` with proper visited set (CRIT-4 fix)
- Visited set: `f"{layer}:{id}"` keys (not object references)
- Collections: `deque` for BFS queue
- Acceptance: BFS handles cycles without infinite loop

**F37-FK-902** (M, 2 FP, 8h) -- Add edge type filtering to graph queries
- `GET /model/graph/?node_id=X&edge_types=service_has_endpoint,endpoint_reads_container`
- Filter relationships by edge_type before traversal
- Acceptance: Graph query returns only matching edge types

**F37-FK-903** (M, 2 FP, 8h) -- Implement temporal graph queries
- `GET /model/graph/?node_id=X&as_of=2026-06-01T00:00:00Z`
- Filter relationships by `valid_from <= as_of <= valid_to`
- Acceptance: Temporal query returns point-in-time graph state

**F37-FK-904** (S, 1 FP, 4h) -- Add graph visualization endpoint
- `GET /model/graph/visualize/?node_id=X&depth=2&format=mermaid`
- Returns: Mermaid diagram syntax or GraphViz DOT
- Acceptance: Portal face renders graph visualization

**F37-FK-905** (S, 1 FP, 3h) -- Update docs + USER-GUIDE
- Document: BFS algorithm, cycle detection, edge type filters, temporal queries
- Acceptance: USER-GUIDE section complete with examples

---

## Phase 5 -- Cascade Engine (Sprint 10)

**Timeline**: November 2026 (2 weeks, 35h)
**Goal**: Automated cascade policies + impact analysis

### Stories (5)

**F37-FK-1001** (L, 3 FP, 12h) -- Implement cascade policy engine
- `api/cascade.py`: `apply_cascade()` function
- Policies: `cascade`, `restrict`, `set_null`, `no_action`
- Dry-run mode: returns impacted objects without mutating
- Acceptance: Cascade engine respects policy + depth limits

**F37-FK-1002** (M, 2 FP, 8h) -- Add cascade matrix to schema
- `schema/relationship.schema.json`: Add `cascade_policy` field
- Default policies by edge type (from FK-ENHANCEMENT-COMPLETE-PLAN Table 5)
- Acceptance: Schema includes cascade_policy enum

**F37-FK-1003** (M, 2 FP, 8h) -- Implement impact analysis endpoint
- `GET /model/impact/?layer=endpoints&id=GET /v1/tags&action=delete&cascade=true`
- Returns: List of objects that would be affected by delete + cascade
- Acceptance: Impact analysis endpoint returns accurate dependency tree

**F37-FK-1004** (S, 1 FP, 4h) -- Add cascade UI to portal face
- Portal face: "Delete" button shows impact preview before confirming
- Modal: Lists all affected objects with cascade depth
- Acceptance: Portal face shows cascade impact before delete

**F37-FK-1005** (S, 1 FP, 3h) -- Update docs
- `docs/library/10-FK-ENHANCEMENT.md`: Add cascade policy matrix + examples
- Acceptance: Docs explain all 4 cascade policies with code samples

---

## Phase 6 -- Testing + Documentation (Sprint 11)

**Timeline**: December 2026 - January 2027 (3 weeks, 45h)
**Goal**: Comprehensive test suite + production documentation

### Stories (6)

**F37-FK-1101** (L, 4 FP, 15h) -- Implement relationship CRUD tests
- `tests/test_relationships.py`: 20+ test cases
- Coverage: create, read, update, delete, temporal queries, edge type filters
- Acceptance: All relationship tests pass with >90% coverage

**F37-FK-1102** (M, 2 FP, 10h) -- Implement graph traversal tests
- `tests/test_graph.py`: BFS cycle detection, depth limits, edge filters
- Test cases: diamond graph, circular graph, temporal snapshots
- Acceptance: All graph tests pass, cycle detection verified

**F37-FK-1103** (M, 2 FP, 8h) -- Implement cascade policy tests
- `tests/test_cascade.py`: All 4 policies + dry-run mode
- Test cases: cascade delete, restrict violation, set_null, no_action
- Acceptance: All cascade tests pass with expected side effects

**F37-FK-1104** (S, 1.5 FP, 6h) -- Update USER-GUIDE.md (v3.0)
- Complete rewrite of Section 4: "Working with Relationships"
- Add: edge type catalog, cascade policies, temporal queries, saga merge
- Acceptance: USER-GUIDE fully documents FK Enhancement API

**F37-FK-1105** (S, 1 FP, 4h) -- Update library/10-FK-ENHANCEMENT.md (v2.0)
- Add: migration guide, agent quick reference, troubleshooting
- Acceptance: Library entry updated for production use

**F37-FK-1106** (S, 0.5 FP, 2h) -- Update PLAN.md + STATUS.md
- Mark FK Enhancement as "Phase 6 complete"
- Update: MTI target (>= 95), test count (>100), next phase
- Acceptance: Governance docs reflect FK Enhancement completion

---

## Automated Execution via DPDCA

### GitHub Actions Workflow (.github/workflows/sprint-agent.yml)

**Triggers**: Issue labeled with `sprint-task`
**Agent**: GitHub Copilot coding agent (gpt-4o for M/L stories, gpt-4o-mini for XS/S)

**Workflow Steps**:
1. Parse SPRINT_MANIFEST JSON from issue body
2. Load context: copilot-instructions.md, PLAN.md, FK docs, USER-GUIDE
3. For each story in manifest:
   a. Load existing files referenced in story
   b. Call LLM with full context + story requirements
   c. Write code to target files
   d. Tag with `# EVA-STORY: F37-FK-NNN`
   e. Commit with format: `feat(F37-FK-NNN): <description>`
4. Run tests: `pytest tests/ -x -q` (must exit 0)
5. Run Veritas audit: MTI >= 95 required
6. Run model validation: `POST /model/admin/validate` (violation_count = 0 required)
7. Export to Cosmos: `POST /model/admin/commit`
8. Open PR with sprint summary

**Gates**:
- **pytest gate**: All tests must pass
- **MTI gate**: >= 95 (data model is foundational)
- **Validation gate**: Zero cross-reference violations
- **EVA-STORY tag gate**: Every modified file must have matching tag

**Manual Review Trigger** (optional):
- Add label `sonnet-review` to issue
- Workflow triggers separate review agent (Claude Sonnet 4.5)
- Review agent reads PR diff + docs, writes `docs/YYYYMMDD-review-findings-F37-FK-NNN.md`

---

## Success Criteria (End of Sprint 11)

### Technical Deliverables
- [ ] 27 edge types defined and implemented
- [ ] RelationshipMeta schema + store abstraction complete
- [ ] Scenarios layer with saga merge pattern
- [ ] IaC, pipelines, workflows, snapshots layers functional
- [ ] Cosmos /relationships container deployed + operational
- [ ] All 4 cascade policies implemented + tested
- [ ] BFS cycle detection working (CRIT-4 fix validated)
- [ ] Temporal graph queries operational
- [ ] Migration scripts backfill 100% of existing cross-references
- [ ] Test suite: >100 tests, >90% coverage
- [ ] USER-GUIDE.md v3.0 complete
- [ ] library/10-FK-ENHANCEMENT.md v2.0 production-ready

### Quality Gates
- [ ] MTI >= 95 (Veritas audit)
- [ ] pytest: 100+ tests passing
- [ ] validate-model: 0 violations
- [ ] All FK Enhancement stories status=done in PLAN.md
- [ ] Zero open blockers in WBS layer
- [ ] Production readiness checklist: 100% complete in ACCEPTANCE.md

### Business Outcomes
- [ ] Portal face shows relationship graph visualization
- [ ] Impact analysis endpoint prevents accidental cascade deletes
- [ ] Temporal snapshots enable rollback scenarios
- [ ] IaC generation from scenario versions working
- [ ] Pipeline orchestration uses FK graph for dependency resolution
- [ ] 403h actual effort within 10% of estimate (363h-443h acceptable)

---

## Risk Mitigation (14 Risks from Opus 4.6)

### CRIT-1: Effort Underestimated (FIXED)
- **Mitigation**: 403h budget (2.25x original 180h estimate)
- **Gate**: Sprint velocity tracking, escalate if >10% variance

### CRIT-2: Atomic Scenario Merge Impossible (FIXED)
- **Mitigation**: Saga pattern with compensation log
- **Gate**: Sprint 2 acceptance requires saga merge working

### CRIT-3: Version Conflicts on _relationships (FIXED)
- **Mitigation**: Separate /relationships container (Option A)
- **Gate**: Sprint 7 deploys separate container, validates no version contention

### CRIT-4: BFS Missing Cycle Detection (FIXED)
- **Mitigation**: Proper visited set with layer:id keys, deque
- **Gate**: Sprint 9 tests include circular graph test case

### REC-1: Phase 0 NOW (IMPLEMENTED)
- **Mitigation**: Sprint 0 (48h) runs before Phase 1A
- **Gate**: Phase 0 complete before starting Sprint 1

### Additional Risks (R05-R14)
See FK-ENHANCEMENT-COMPLETE-PLAN-2026-02-28.md Section 5.4 for full 14-risk matrix.

---

## Next Actions (Sprint 0 Start -- March 2026)

1. **Update PLAN.md** with FK Enhancement WBS stories (52 stories, 12 sprints)
2. **Reseed Veritas**: `python scripts/seed-from-plan.py --reseed-model`
3. **Reflect IDs**: `python scripts/reflect-ids.py` (annotates PLAN.md with F37-FK-NNN)
4. **Generate Sprint 0 manifest**: `python scripts/gen-sprint-manifest.py --sprint 00 --name "phase0-validation" --stories F37-FK-001,F37-FK-002,F37-FK-003`
5. **Create GitHub issue**: `gh issue create --repo eva-foundry/37-data-model --title "[SPRINT-00] phase0-validation" --body-file .github/sprints/sprint-00-phase0-validation.md --label sprint-task`
6. **Monitor workflow**: GitHub Actions executes sprint, opens PR when done
7. **Review + merge**: Manual review (or sonnet-review label), merge to main
8. **Run Act step**: Mark stories done in PLAN.md, reseed, commit, export to Cosmos
9. **Advance to Sprint 1**: Repeat DPDCA loop for next sprint

---

## References

- [FK-ENHANCEMENT-COMPLETE-PLAN-2026-02-28.md](FK-ENHANCEMENT-COMPLETE-PLAN-2026-02-28.md) -- Complete design (v2.0.0, 12 sprints, 403h)
- [FK-ENHANCEMENT-OPUS-FINDINGS-2026-02-28.md](FK-ENHANCEMENT-OPUS-FINDINGS-2026-02-28.md) -- Opus 4.6 verdict + 4 CRIT fixes
- [FK-ENHANCEMENT-RESEARCH-2026-02-28.md](FK-ENHANCEMENT-RESEARCH-2026-02-28.md) -- 14 arXiv papers + research foundation
- [library/10-FK-ENHANCEMENT.md](library/10-FK-ENHANCEMENT.md) -- Agent-consumable quick reference
- [.github/DPDCA-WORKFLOW.md](../.github/DPDCA-WORKFLOW.md) -- DPDCA execution loop protocol
- [.github/copilot-instructions.md](../.github/copilot-instructions.md) -- Agent operating manual
- [USER-GUIDE.md](../USER-GUIDE.md) -- Model API user guide (will be updated to v3.0)

---

**Execution Status**: READY TO START
**First Sprint**: Sprint 0 (Phase 0 Validation, March 2026, 48h, 3 stories, 5 FP)
**Estimated Completion**: February 2027 (12 months from now)
**Automation**: Fully enabled via GitHub Actions + DPDCA workflow
