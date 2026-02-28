# FK Enhancement: Complete Discovery & Implementation Plan

**Date**: 2026-02-28 14:45 ET (original); 2026-02-28 18:30 ET (v2.0.0)  
**Version**: 2.0.0  
**Status**: Revised per Opus 4.6 Architectural Review -- CONDITIONAL GO  
**Scope**: All 31 layers, 4061 objects, 27 edge types  
**Reviewer**: Claude Opus 4.6 (external architectural review, 2026-02-28)  
**Companion doc**: FK-ENHANCEMENT-OPUS-FINDINGS-2026-02-28.md (full review verdict)

---

## REVISION HISTORY

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-02-28 14:45 ET | Initial discovery and plan (180h, 6 sprints) |
| 2.0.0 | 2026-02-28 18:30 ET | Opus 4.6 review fixes: 4 CRITs resolved, Phase 0 added, Phase 1B split into 5 phases, effort revised to 403h/12 sprints, saga pattern for merge, BFS cycle detection, 14-risk matrix |

---

## EXECUTIVE SUMMARY

This document provides complete discovery of EVA Data Model's current state and a detailed implementation plan for Siebel-style FK relationships with versioning. No new layers needed -- the 31 existing layers are sufficient. FK enhancement adds explicit relationships, O(1) navigation, and temporal versioning.

**Timeline**: 12 sprints (March 2026 - February 2027), 403 hours  
**Risk**: MEDIUM -- backward compatible, opt-in migration, saga-based merge, 14-risk matrix  
**ROI**: 10x query performance, automated impact analysis, IaC generation, pipeline automation  

**Opus 4.6 Verdict**: CONDITIONAL GO -- core FK design is sound; 4 critical flaws
fixed in this revision. Key changes from v1.0.0:
- Added Phase 0 (server-side string-array validation, 48h, zero migration risk)
- Split Phase 1B into 5 independent phases (1B-Scenarios, 1C-IaC, 1D-Pipelines, 1E-Workflows, 1F-Snapshots)
- Replaced "atomic merge" with saga pattern (Cosmos NoSQL has no cross-partition txn)
- Added BFS cycle detection (visited set with layer:id keys)
- Revised effort: 180h -> 403h, timeline: 6 sprints -> 12 sprints
- Expanded risk matrix: 6 risks -> 14 risks

---

## PART 1: CURRENT STATE DISCOVERY

### 1.1 Layer Inventory (31 Layers, 4061 Objects)

**Sorted by size (largest first):**

| Layer | Objects | Purpose | FK Coupling Complexity |
|---|---|---|---|
| wbs | 2988 | Work breakdown structure (Epic/Feature/Story trees) | HIGH -- depends_on_wbs (self-referential), ci_runbook, api_endpoints |
| literals | 458 | UI translations (en/fr) | LOW -- minimal coupling |
| endpoints | 187 | HTTP API routes | CRITICAL -- cosmos_reads, cosmos_writes, service, feature_flag, used_by_screens, used_by_hooks, required_by |
| projects | 53 | Numbered EVA projects (31-eva-faces, 37-data-model, 51-ACA, etc.) | MEDIUM -- depends_on (self-referential), wbs_id |
| screens | 50 | UI pages/components | HIGH -- api_calls, hooks, components, min_role, rbac |
| schemas | 39 | API request/response schemas | MEDIUM -- used by endpoints (request_schema, response_schema) |
| services | 36 | Microservices/processes | MEDIUM -- depends_on (self-referential) |
| components | 32 | React UI components | LOW -- used by screens |
| requirements | 29 | Functional/non-functional requirements | MEDIUM -- satisfied_by (endpoints) |
| ts_types | 26 | TypeScript type definitions | LOW -- minimal coupling |
| infrastructure | 23 | Azure resources (ACA, Cosmos, Storage, etc.) | HIGH -- owned_by projects, deployed_to environments |
| hooks | 19 | React custom hooks | MEDIUM -- calls_endpoints |
| feature_flags | 15 | Feature toggles | MEDIUM -- used by endpoints, personas |
| containers | 13 | Cosmos DB containers | CRITICAL -- read/written by endpoints, has_fields |
| agents | 12 | AI agents | MEDIUM -- input_endpoints, output_screens |
| personas | 10 | User roles | MEDIUM -- feature_flags, screens (rbac) |
| security_controls | 10 | Security policies | LOW -- minimal coupling |
| sprints | 9 | Sprint execution records | MEDIUM -- story_ids (wbs), has_milestones |
| cp_skills | 7 | Control-plane skills | LOW -- used by runbooks |
| prompts | 5 | LLM system prompts | LOW -- minimal coupling |
| risks | 5 | Project risks | LOW -- minimal coupling |
| milestones | 4 | Release milestones | MEDIUM -- targeted by projects |
| cp_agents | 4 | Control-plane agents | LOW -- minimal coupling |
| runbooks | 4 | CI/CD runbooks | MEDIUM -- skills, targets environments |
| connections | 4 | ADO/GitHub/Azure integrations | LOW -- minimal coupling |
| mcp_servers | 4 | MCP server definitions | LOW -- minimal coupling |
| decisions | 4 | Architecture Decision Records | LOW -- minimal coupling |
| cp_policies | 3 | Control-plane policies | LOW -- minimal coupling |
| environments | 3 | dev/staging/production | MEDIUM -- targeted by runbooks, infrastructure |
| planes | 3 | github/azure/ado integration boundaries | LOW -- referenced by projects |

**Total**: 31 layers, 4061 objects

**FK Coupling Complexity:**
- **CRITICAL** (endpoints, containers): 200 objects, 15+ fields with string arrays
- **HIGH** (wbs, screens, infrastructure): 3061 objects, 5-10 coupled fields
- **MEDIUM** (projects, services, hooks, etc.): 247 objects, 2-5 coupled fields
- **LOW** (literals, prompts, etc.): 553 objects, 0-1 coupled fields

---

### 1.2 Current Relationship Encoding (String Arrays)

**Example: endpoints layer (187 objects)**

Sample endpoint record:
```json
{
  "id": "GET /v1/jobs",
  "service": "eva-brain-api",  // String reference -> services layer
  "cosmos_reads": ["jobs", "users"],  // String array -> containers layer
  "cosmos_writes": ["job_history"],  // String array -> containers layer
  "feature_flag": "feature-jobs-api",  // String reference -> feature_flags layer
  "auth": ["legal-researcher", "admin"],  // String array -> personas layer (implied)
  "used_by_screens": ["JobsListScreen", "AdminJobsPage"],  // String array (reverse lookup, NOT in endpoint record)
  "used_by_hooks": ["useJobsData"],  // String array (reverse lookup, NOT in endpoint record)
  "request_schema": "JobsQueryRequest",  // String reference -> schemas layer
  "response_schema": "JobsQueryResponse"  // String reference -> schemas layer
}
```

**Problems with string arrays:**
1. **No referential integrity**: Can reference non-existent objects
2. **Manual cascade management**: Delete endpoint -> must manually scan all screens to remove from api_calls
3. **O(n) reverse lookups**: "Which screens call this endpoint?" = scan all 50 screens
4. **No cardinality enforcement**: Can't enforce one-to-one vs many-to-many
5. **No versioning**: Can't query "What did JobsListScreen call 3 months ago?"

---

### 1.3 Existing EDGE_TYPES (20 Defined in graph.py)

Current graph.py defines 20 edge types that materialize string arrays as typed edges:

| Edge Type | From Layer | To Layer | Via Field | Cardinality | Description |
|---|---|---|---|---|---|
| `calls` | screens | endpoints | api_calls | many-to-many | Screen calls endpoint |
| `reads` | endpoints | containers | cosmos_reads | many-to-many | Endpoint reads container |
| `writes` | endpoints | containers | cosmos_writes | many-to-many | Endpoint writes container |
| `uses_component` | screens | components | components | many-to-many | Screen uses component |
| `uses_hook` | screens | hooks | hooks | many-to-many | Screen uses hook |
| `hook_calls` | hooks | endpoints | calls_endpoints | many-to-many | Hook calls endpoint |
| `implemented_by` | endpoints | services | service | many-to-one | Endpoint implemented by service |
| `depends_on` | services | services | depends_on | many-to-many | Service depends on service (circular) |
| `gated_by` | endpoints | feature_flags | feature_flag | many-to-one | Endpoint gated by flag |
| `reads_schema` | endpoints | schemas | request_schema | many-to-one | Endpoint uses request schema |
| `writes_schema` | endpoints | schemas | response_schema | many-to-one | Endpoint uses response schema |
| `agent_reads` | agents | endpoints | input_endpoints | many-to-many | Agent reads endpoint |
| `agent_outputs` | agents | screens | output_screens | many-to-many | Agent outputs to screen |
| `satisfies` | endpoints | requirements | satisfied_by | many-to-many | Endpoint satisfies requirement (INVERSE) |
| `wbs_depends` | wbs | wbs | depends_on_wbs | many-to-many | WBS depends on WBS (circular) |
| `project_depends` | projects | projects | depends_on | many-to-many | Project depends on project (circular) |
| `project_wbs` | projects | wbs | wbs_id | many-to-one | Project has WBS root |
| `persona_flags` | personas | feature_flags | feature_flags | many-to-many | Persona has flags |
| `runbook_skill` | runbooks | cp_skills | skills | many-to-many | Runbook exercises skill |
| `wbs_runbook` | wbs | runbooks | ci_runbook | many-to-one | WBS references runbook |

**Gap Analysis**: Missing edge types not yet defined in graph.py:

| Missing Edge | From Layer | To Layer | Via Field | Cardinality | Notes |
|---|---|---|---|---|---|
| `deployed_to` | infrastructure | environments | (NEW) | many-to-one | ACA deployed to env-prod |
| `owns` | projects | infrastructure | (NEW) | one-to-many | 33-eva-brain-v2 owns brain-api-container-app |
| `targets_milestone` | projects | milestones | (NEW) | many-to-one | Project targets release milestone |
| `has_story` | sprints | wbs | story_ids | one-to-many | Sprint has WBS stories |
| `workflow_implements` | cp_workflows | runbooks | (NEW) | many-to-one | Workflow implements runbook |
| `workflow_targets` | cp_workflows | environments | (NEW) | many-to-one | Workflow targets environment |
| `uses_plane` | projects | planes | (NEW) | many-to-many | Project uses plane (github/azure/ado) |

**Total edge types after FK enhancement**: 20 existing + 7 new = **27 edge types**

---

### 1.4 Store Architecture (AbstractStore Interface)

**Current implementation** (api/store/base.py):

```python
class AbstractStore(ABC):
    @abstractmethod
    async def get_all(layer: str, active_only: bool = True) -> list[dict]
    
    @abstractmethod
    async def get_one(layer: str, obj_id: str) -> dict | None
    
    @abstractmethod
    async def upsert(layer: str, obj_id: str, payload: dict, actor: str) -> dict
    
    @abstractmethod
    async def bulk_load(layer: str, objects: list[dict], actor: str) -> int
    
    @abstractmethod
    async def soft_delete(layer: str, obj_id: str, actor: str) -> dict | None
```

**Two implementations:**
1. **MemoryStore** (api/store/memory.py): In-memory dict, used for tests
2. **CosmosStore** (api/store/cosmos.py): Azure Cosmos DB NoSQL, used in production (ACA)

**FK enhancement impact**: Store interface changes (Phase 0 + Phase 1A)
- Add `validate_fks()` method to AbstractStore (Phase 0, zero risk)
- Add optional `validate_fks: bool = True` parameter to upsert() (Phase 0)
- Pre-flight FK validation before writes using EDGE_TYPES registry (Phase 0)

**CRIT-3 Resolution (Opus 4.6)**: Two options for FK storage:
- **Option A (RECOMMENDED)**: Separate `/relationships` Cosmos container
  * Partition key: /source_layer
  * Eliminates version conflicts on parent objects
  * Independent relationship lifecycle (+$25/month at 400 RU/s)
  * Evaluate in Phase 1A, implement if concurrency issues confirmed
- **Option C (Phase 0 acceptable)**: Keep embedded _relationships with retry logic
  * Optimistic concurrency retry (3 attempts with backoff)
  * Acceptable for low-write model during Phase 0 pilot

---

### 1.5 Current Graph API (api/routers/graph.py)

**Read-only graph materialization** -- no FK enforcement:

```python
GET /model/graph                                  # All nodes and edges
GET /model/graph?from_layer=screens&to_layer=endpoints
GET /model/graph?edge_type=calls
GET /model/graph?node_id=TranslationsPage&depth=2
GET /model/graph?format=mermaid                   # Mermaid flowchart
GET /model/graph/edge-types                       # Vocabulary
```

**How it works today:**
1. Scan all layers (via store)
2. Extract string array fields (api_calls, cosmos_reads, etc.)
3. Materialize edges dynamically (no persistence)
4. BFS traversal for depth queries

**Performance**: Acceptable for reads (< 1 second)  
**Problem**: No write-time validation, no cascade enforcement, no reverse indexes

---

## PART 2: FK ENHANCEMENT DESIGN

### 2.1 Core Principles

1. **Explicit Relationships**: Replace string arrays with typed FK records in `_relationships` field
2. **Referential Integrity**: Validate FKs at write time (upsert)
3. **Cascade Policies**: RESTRICT, CASCADE, SET_NULL, NO_ACTION per edge type
4. **Bidirectional Navigation**: O(1) forward and reverse lookups via indexes
5. **Temporal Versioning**: Every FK relationship tracks created_at, modified_at, version
6. **Scenario Branching**: Copy-on-write FK graphs for what-if analysis
7. **Backward Compatibility**: String arrays remain during 6-month transition (Phase 5)

---

### 2.2 RelationshipMeta Schema

**Add to every object** (all 31 layers, all 4061 objects):

```python
class RelationshipMeta(BaseModel):
    rel_type: str  # One of 27 edge types
    target_layer: str  # Layer name
    target_ids: List[str]  # Object IDs in target layer
    cardinality: str  # "one-to-one", "many-to-one", "many-to-many"
    cascade_policy: str  # "RESTRICT", "CASCADE", "SET_NULL", "NO_ACTION"
    bidirectional: bool  # Auto-create reverse FK?
    metadata: Dict[str, Any]  # Temporal metadata (created_at, version, branch, etc.)

# Example: endpoints/GET /v1/jobs
{
  "id": "GET /v1/jobs",
  "_relationships": [
    {
      "rel_type": "reads",
      "target_layer": "containers",
      "target_ids": ["jobs", "users"],
      "cardinality": "many-to-many",
      "cascade_policy": "RESTRICT",
      "bidirectional": true,
      "metadata": {
        "created_at": "2026-05-15T10:00:00Z",
        "modified_at": "2026-06-20T14:30:00Z",
        "version": 2,
        "branch": "main",
        "previous_state": ["jobs"],  # Before adding "users"
        "deployment_id": "deploy-2026-06-20-14-30"
      }
    },
    {
      "rel_type": "implemented_by",
      "target_layer": "services",
      "target_ids": ["eva-brain-api"],
      "cardinality": "many-to-one",
      "cascade_policy": "RESTRICT",
      "bidirectional": false,
      "metadata": { "created_at": "2026-05-15T10:00:00Z", "version": 1 }
    }
  ]
}
```

---

### 2.3 New API Routes (Phase 1B - Versioning + Scenarios)

**Scenarios** (what-if testing -- saga-based merge, see CRIT-2 in Opus findings):
```
POST   /model/scenarios/create                    # Create FK graph branch
GET    /model/scenarios/{id}                      # Get scenario metadata
PUT    /model/{layer}/{id}?scenario={id}          # Mutate object in scenario
POST   /model/scenarios/{id}/validate             # Impact analysis
POST   /model/scenarios/{id}/merge                # Saga-based merge to main (NOT atomic -- Cosmos NoSQL has no cross-partition txn)
DELETE /model/scenarios/{id}                      # Delete scenario
```

**CRIT-2 NOTE (Opus 4.6)**: Cosmos DB NoSQL does NOT support cross-partition
transactions. Scenario merge uses a saga pattern:
1. Validate all scenario changes (pre-flight)
2. Merge layer-by-layer in dependency order (topological sort)
3. Record compensation log for each successful layer merge
4. On failure: execute compensation (rollback merged layers)
5. Report partial merge state to caller
See FK-ENHANCEMENT-OPUS-FINDINGS-2026-02-28.md Section 2 CRIT-2 for full
saga implementation pattern.

**IaC Generation** (walk FK graph -> emit Bicep/Terraform):
```
GET /model/iac/generate?layer={layer}&scenario={id}&format=bicep
GET /model/iac/generate?layer={layer}&scenario={id}&format=terraform
```

**Pipeline Generation** (topological sort -> Azure Pipelines YAML):
```
GET /model/pipelines/generate?scenario={id}&format=azure-pipelines
GET /model/pipelines/generate?scenario={id}&format=github-actions
```

**Workflow Orchestration** (scheduled jobs with FK dependencies):
```
POST /model/workflows/create                      # Define workflow
GET  /model/workflows/{id}                        # Get workflow definition
POST /model/workflows/{id}/execute                # Execute workflow
GET  /model/workflows/{id}/status                 # Execution status
```

**Snapshots** (point-in-time FK graph restore):
```
POST /model/snapshots/create                      # Create snapshot
GET  /model/snapshots/{id}                        # Get snapshot metadata
POST /model/snapshots/{id}/restore                # Rollback to snapshot
GET  /model/snapshots/{id}/rollback-plan          # Dry-run rollback
```

**Relationship Navigation** (O(1) indexed lookups):
```
GET /model/{layer}/{id}/children?rel_type={type}  # Forward FK navigation
GET /model/{layer}/{id}/parents?rel_type={type}   # Reverse FK navigation
GET /model/{layer}/{id}/descendants?depth={n}     # BFS tree traversal
GET /model/{layer}/{id}/ancestors?depth={n}       # Reverse BFS
GET /model/relationships/orphans                  # Dangling FK detector
POST /model/relationships/validate                # Pre-flight FK check
GET /model/relationships/impact?container=X       # What breaks if X changes
```

---

## PART 3: MIGRATION COMPLEXITY ANALYSIS

### 3.1 Object Count by FK Coupling Complexity

| Complexity | Layers | Objects | Migration Effort | Risk |
|---|---|---|---|---|
| CRITICAL | endpoints (187), containers (13) | 200 | 40 hours | MEDIUM -- many downstream dependencies |
| HIGH | wbs (2988), screens (50), infrastructure (23) | 3061 | 80 hours | HIGH -- largest layer (wbs) has self-referential FKs |
| MEDIUM | projects (53), services (36), hooks (19), etc. | 247 | 40 hours | LOW -- fewer dependencies |
| LOW | literals (458), prompts (5), etc. | 553 | 20 hours | MINIMAL -- no FK coupling |

**Total migration effort**: 403 hours across 12 sprints (revised per Opus 4.6 review, was 180h/6 sprints)

**Note (CRIT-1)**: Original 180h estimate was 2-2.5x underestimated. Phase 1B alone
conflated 5 unrelated subsystems into 30h. See FK-ENHANCEMENT-OPUS-FINDINGS Section 2 CRIT-1.

---

### 3.2 Field-to-Relationship Mapping (CRITICAL for Phase 5 Migration)

**This mapping drives the migration script** (scripts/migrate-to-fk.py):

| Layer | Field Name | Edge Type | Target Layer | Cardinality | Cascade Policy |
|---|---|---|---|---|---|
| screens | api_calls | calls | endpoints | many-to-many | RESTRICT |
| screens | hooks | uses_hook | hooks | many-to-many | RESTRICT |
| screens | components | uses_component | components | many-to-many | RESTRICT |
| endpoints | cosmos_reads | reads | containers | many-to-many | RESTRICT |
| endpoints | cosmos_writes | writes | containers | many-to-many | RESTRICT |
| endpoints | service | implemented_by | services | many-to-one | RESTRICT |
| endpoints | feature_flag | gated_by | feature_flags | many-to-one | SET_NULL |
| endpoints | request_schema | reads_schema | schemas | many-to-one | RESTRICT |
| endpoints | response_schema | writes_schema | schemas | many-to-one | RESTRICT |
| hooks | calls_endpoints | hook_calls | endpoints | many-to-many | RESTRICT |
| services | depends_on | depends_on | services | many-to-many | RESTRICT |
| agents | input_endpoints | agent_reads | endpoints | many-to-many | RESTRICT |
| agents | output_screens | agent_outputs | screens | many-to-many | RESTRICT |
| requirements | satisfied_by | satisfies | endpoints | many-to-many | RESTRICT |
| wbs | depends_on_wbs | wbs_depends | wbs | many-to-many | RESTRICT |
| wbs | ci_runbook | wbs_runbook | runbooks | many-to-one | SET_NULL |
| projects | depends_on | project_depends | projects | many-to-many | RESTRICT |
| projects | wbs_id | project_wbs | wbs | many-to-one | RESTRICT |
| personas | feature_flags | persona_flags | feature_flags | many-to-many | RESTRICT |
| runbooks | skills | runbook_skill | cp_skills | many-to-many | RESTRICT |
| sprints | story_ids | has_story | wbs | one-to-many | RESTRICT |

**NEW mappings** (require adding fields to JSON files):
| Layer | NEW Field | Edge Type | Target Layer | Cascade |
|---|---|---|---|---|
| infrastructure | environment | deployed_to | environments | RESTRICT |
| infrastructure | project_id | owned_by | projects | RESTRICT |
| projects | milestone_id | targets_milestone | milestones | SET_NULL |
| cp_workflows | runbook_id | workflow_implements | runbooks | RESTRICT |
| cp_workflows | environment | workflow_targets | environments | RESTRICT |
| projects | planes | uses_plane | planes | RESTRICT |

---

### 3.3 Orphan Detection Estimates

**Pre-migration orphan scan** (run before Phase 5):

Expected orphan categories:
1. **Stale endpoint references** in screens.api_calls (5-10 estimated)
2. **Deleted containers** still referenced in endpoints.cosmos_reads (2-5 estimated)
3. **Removed feature flags** still referenced in endpoints.feature_flag (1-2 estimated)
4. **WBS cross-project dependencies** where target WBS node deleted (10-20 estimated)

**Action required**: Clean up orphans BEFORE migration (Phase 5 prerequisite)

---

## PART 4: IMPLEMENTATION PLAN (10 Phases, 12 Sprints)

### Phase 0: Server-Side String-Array Validation (March-April 2026, Sprints 1-2) -- NEW

**Duration**: 2 sprints (48 hours)  
**Deliverables**: FK validation on existing string arrays, orphan detection, 60+ tests  
**Risk**: ZERO -- no schema changes, no migration, pure additive  
**Value**: 60% of FK integrity benefits from day one

**Why Phase 0 exists (Opus 4.6 REC-1)**: This phase delivers server-side FK
validation using the existing EDGE_TYPES registry WITHOUT any schema migration,
new containers, or _relationships field. It catches dangling references at write
time using today's string arrays.

**Tasks:**
1. **Extend EDGE_TYPES with cascade + required metadata** (8 hours)
   - File: api/routers/graph.py
   - Add `cascade`, `required`, `description` to all 27 edge types
   - Add 7 new edge types (deployed_to, owned_by, etc.)
   - Existing graph queries continue working (additive only)

2. **Create validate_fks() method** (16 hours)
   - File: api/store/base.py (abstract), api/store/cosmos.py, api/store/memory.py
   - Wire into upsert() with `validate_fks: bool = True` parameter
   - Default ON for all layers except literals (too many objects, low value)
   - Validate string-array targets exist in target layer
   - Enforce cardinality (many-to-one fields reject multiple values)
   - Return FKValidationError list

3. **Create orphan detection endpoint** (8 hours)
   - File: api/routers/graph.py (new route)
   - GET /model/relationships/orphans -- scan all layers
   - GET /model/relationships/orphans?layer=endpoints -- scan one layer

4. **Write 60+ unit tests** (12 hours)
   - Valid references, missing targets, cardinality violations
   - Required fields, optional fields, edge cases

5. **Documentation** (4 hours)
   - Update USER-GUIDE.md with FK validation behavior
   - Add validation error response format
   - Document cascade configuration

**Success Criteria:**
- [ ] All 27 EDGE_TYPES have cascade + required metadata
- [ ] validate_fks() called on every upsert (except opt-out layers)
- [ ] GET /model/relationships/orphans returns accurate report
- [ ] 60+ unit tests passing
- [ ] Zero breaking changes to existing API behavior

---

### Phase 1A: Base FK Schema (May-June 2026, Sprints 3-4)

**Duration**: 2 sprints (80 hours, revised from 60h per CRIT-1)  
**Deliverables**: Base FK validation, migration prep, unit tests, BFS cycle detection

**Tasks:**
1. **Design RelationshipMeta schema** (4 hours)
   - Define Pydantic model with all fields
   - Document cascade policy vocabulary
   - Create JSON schema for validation

2. **Extend api/store/base.py upsert()** (8 hours)
   - Add `validate_fks: bool = True` parameter
   - Pre-flight FK validation logic:
     * Check target object exists
     * Enforce cardinality (one-to-one vs many)
     * Validate cascade policy
   - Return detailed validation errors

3. **Create POST /model/relationships/validate** (6 hours)
   - Accept operation: "create", "update", "delete"
   - Return impact analysis:
     * affected_objects: downstream objects that would be updated
     * breaking_changes: operations blocked by RESTRICT
     * orphaned_objects: dangling FKs after delete
     * cascade_plan: automatic CASCADE operations

4. **Write migration analysis script** (8 hours)
   - `scripts/analyze-fk-migration.ps1`
   - Scan all 4061 objects
   - Detect orphans (stale references)
   - Generate FIELD_TO_RELATIONSHIP_MAP
   - Output: migration complexity report

5. **Write 100+ unit tests** (20 hours)
   - FK validation scenarios (valid, invalid, missing targets)
   - Cascade policy enforcement (RESTRICT blocks, CASCADE propagates)
   - Cardinality validation (one-to-one vs many-to-many)
   - Edge cases (circular dependencies, self-referential FKs)

6. **Add empty _relationships field to all objects** (8 hours)
   - Cold-deploy migration script
   - Add `"_relationships": []` to all 4061 objects
   - Preserve existing string arrays (backward compatibility)
   - Commit changes to Git + export to Cosmos

7. **Documentation** (6 hours)
   - FK enhancement user guide
   - API route documentation
   - Migration runbook

**Success Criteria:**
- [ ] RelationshipMeta schema finalized
- [ ] upsert() enforces FK validation
- [ ] POST /model/relationships/validate working
- [ ] 100+ unit tests passing
- [ ] All 4061 objects have empty _relationships field
- [ ] Zero orphans detected (clean slate)

---

### Phase 1B: Scenarios (July 2026, Sprints 5-6) -- SPLIT from original 1B per Opus REC-2

**Duration**: 2 sprints (40 hours, was 30h combined for 5 subsystems)  
**Deliverables**: Scenario CRUD, saga-based merge, validation

**Note (Opus REC-2)**: Original Phase 1B conflated 5 unrelated subsystems
(scenarios, IaC, pipelines, workflows, snapshots) into 30 hours. These are now
independent phases: 1B-Scenarios (here), 1C-IaC, 1D-Pipelines, 1E-Workflows,
1F-Snapshots. See FK-ENHANCEMENT-OPUS-FINDINGS Section 3 REC-2.

**Tasks:**
1. **Design Scenario + Snapshot models** (4 hours)
   - Scenario: copy-on-write FK graph branch
   - Snapshot: point-in-time FK graph state

2. **Implement Scenario CRUD API** (12 hours)
   - POST /model/scenarios/create
   - PUT /model/{layer}/{id}?scenario={id}
   - POST /model/scenarios/{id}/validate
   - DELETE /model/scenarios/{id}

3. **Implement saga-based scenario merge** (16 hours, was 8h)
   - POST /model/scenarios/{id}/merge
   - CRIT-2 fix: Saga pattern (NOT atomic -- Cosmos NoSQL limitation)
   - Topological sort for layer merge order
   - Compensation log for rollback on failure
   - See ScenarioMergeSaga class in OPUS-FINDINGS doc

4. **Write 30+ integration tests** (8 hours)
   - Scenario create/mutate/validate/merge/delete
   - Saga rollback on partial failure
   - Cross-layer merge ordering

**Success Criteria:**
- [ ] Scenario branching works (create, mutate, delete)
- [ ] Saga merge completes for multi-layer scenarios
- [ ] Saga rollback restores state on failure
- [ ] 30+ integration tests passing

---

### Phase 1C: IaC Generation (September 2026, Sprint 8) -- NEW independent phase

**Duration**: 1 sprint (30 hours)  
**Deliverables**: Bicep + Terraform generation from FK graph  
**Dependencies**: Phase 1A, Phase 3 (indexes for efficient graph traversal)

**Tasks:**
1. **Implement IaC generation** (20 hours)
   - GET /model/iac/generate?format=bicep
   - GET /model/iac/generate?format=terraform
   - Walk FK: endpoints -> contai5 hours, revised from 10h per CRIT-1 infrastructure
   - Emit Bicep/Terraform templates
   - Validate with PSRule (optional)

2. **Write 15+ tests** (6 hours)

3. **Documentation** (4 hours)

**Success Criteria:**
- [ ] IaC generation produces valid Bicep
- [ ] IaC generation produces valid Terraform
- [ ] FK graph traversal uses indexes (Phase 3)

---

### Phase 1D: Pipeline Generation (October 2026, Sprint 9) -- NEW independent phase

**Duration**: 1 sprint (30 hours)  
**Deliverables**: Azure Pipelines + GitHub Actions YAML from FK graph  
**Dependencies**: Phase 1A, Phase 3 (indexes)

**Tasks:**
1. **Implement pipeline generation** (20 hours)
   - GET /model/pipelines/generate?format=azure-pipelines
   - GET /model/pipelines/generate?format=github-actions
   - Topological sort FK graph (deployment order)
   - Emit pipeline YAML with stages
   - FK-driven dependency awareness

2. **Write 15+ tests** (6 hours)

3. **Documentation** (4 hours)

**Success Criteria:**
- [ ] Azure Pipelines YAML is syntactically valid
- [ ] GitHub Actions YAML is syntactically valid
- [ ] Deployment order respects FK dependencies

---

### Phase 2: Seed Initial FKs (July 2026, Sprint 6)

**Duration**: Part of Sprint 6 (10 hours)  
**Deliverables**: Critical relationships seeded for pilot projects

**Target layers** (highest ROI):
- endpoints (187): cosmos_reads, cosmos_writes, service, feature_flag
- screens (50): api_calls, hooks
- wbs (top 100): depends_on_wbs, ci_runbook

**Tasks:**
1. **Seed endpoints layer** (4 hours)
   - Convert cosmos_reads -> reads FK
   - Convert cosmos_writes -> writes FK
   - Convert service -> implemented_by FK
   - Keep string arrays (backward compat)

2. **Seed screens layer** (3 hours)
   - Convert api_calls -> calls FK
   - Convert hooks -> uses_hook FK

3. **Seed top 100 WBS nodes** (3 hours)
   - Convert depends_on_wbs -> wbs_depends FK
   - Validate no circular dependencies

**Success Criteria:**
- [ ] 337 objects have FK relationships (187 endpoints + 50 screens + 100 wbs)
- [ ] Backward compatibility maintained (string arrays still present)
- [ ] Zero FK validation errors
- [ ] Pilot projects can use new navigation APIs

---

### Phase 3: Relationship Indexes (August 2026, Sprint 7)

**Duration**: 1 sprint (35 hours, revised from 30h)  
**Deliverables**: O(1) navigation, reverse lookup indexes, orphan detection, BFS cycle detection

**Tasks:**
1. **Design RelationshipIndex class** (4 hours)
   - In-memory forward index: obj_id -> children
   - In-memory reverse index: obj_id -> parents
   - Rebuild on startup, incremental updates on writes

2. **Implement GET /{layer}/{id}/children** (4 hours)
   - O(1) lookup via forward index
   - Filter by rel_type
   - Return list of child objects

3. **Implement GET /{layer}/{id}/parents** (4 hours)
   - O(1) lookup via reverse index
   - Filter by rel_type
   - Return list of parent objects

4. **Implement GET /{layer}/{id}/descendants** (6 hours)
   - BFS tree traversal using indexes
   - Depth parameter (1-10)
   - **CRIT-4 fix**: Visited set uses `f"{layer}:{id}"` keys (not just id)
     to prevent infinite loops on self-referential layers (wbs, services, projects)
   - Return full tree as nested JSON

5. **Implement GET /model/relationships/orphans** (4 hours)
   - Scan all _relationships fields
   - Check target_ids exist in target_layer
   - Return orphaned FK records

6. **Implement GET /model/relationships/impact** (4 hours)
   - Quick impact check (no validation, just counts)
   - "If I change container X, how many endpoints break?"

7. **Write 50+ integration tests** (4 hours)

**Success Criteria:**
- [ ] Navigation APIs return results in < 100ms
- [ ] Orphan detection finds all dangling FKs
- [ ] Impact analysis works for all layers
- [ ] 50+ integration tests passing

---November 2026, Sprint 10)

**Duration**: 1 sprint (35 hours, revised from 30h -- saga-aware cascadest 2026, Sprint 8)

**Duration**: 1 sprint (30 hours)  
**Deliverables**: Cascade enforcement, delete safety, impact preview

**Tasks:**
1. **Implement cascade policies** (10 hours)
   - RESTRICT: Block delete if children exist
   - CASCADE: Auto-delete children
   - SET_NULL: Nullify FK in children
   - NO_ACTION: Allow delete, leave dangling FKs (admin override)

2. **Enhance POST /model/relationships/validate** (6 hours)
   - Cascade impact analysis
   - Show full cascade tree (what will be deleted)
   - Dry-run mode

3. **Enhance DELETE /{layer}/{id}** (6 hours)
   - Check cascade policy before delete
   - Execute cascade if policy = CASCADE
   - Block if policy = RESTRICT and children exist
   - Log all cascade operations

4. **Write 30+ integration tests** (4 hours)
   - Cascade scenarios (RESTRICT blocks, CASCADE propagates)
   - Edge cases (circular dependencies, deep trees)

5. **Documentation** (4 hours)
   - Cascade policy guide
   - Delete safety guide

**Success Criteria:**
- [ ] RESTRICT blocks deletes with children
- [ ] CASCADE auto-deletes children
- [ ] SET_NULL nullifies FKs
- [ ] Impact preview shows full cascade tree
- [ ] 30+ integration tests passing

---January-February 2027, SprJanuary-February 2027, Sprint 12)

**Duration**: 1+ sprint (45 hours, revised from 30h -- production edge cases)  
**Deliverables**: All 4061+ objects migrated, string arrays removed, production-ready

**Phase 1E: Workflow Orchestration** (November 2026, Sprint 10, parallel with Phase 4, 25h)
- POST /model/workflows/create -- define workflow with FK dependencies
- POST /model/workflows/{id}/execute -- execute workflow
- GET /model/workflows/{id}/status -- execution status
- Sequential/parallel execution modes, 15+ tests

**Phase 1F: Snapshots** (December 2026, Sprint 11, 20h)
- POST /model/snapshots/create -- point-in-time FK graph state
- POST /model/snapshots/{id}/restore -- rollback to snapshot
- GET /model/snapshots/{id}/rollback-plan -- dry-run rollback
- TTL policy (max 10 active snapshots -- R14 mitigation), 10+ tests

**Migration Deliverables**: All 4061 objects migrated, string arrays removed, production-ready

**Tasks:**
1. **Build complete FIELD_TO_RELATIONSHIP_MAP** (6 hours)
   - Map 50+ fields across 31 layers
   - Document edge type, target layer, cascade policy

2. **Write migration script** (8 hours)
   - `scripts/migrate-to-fk.py`
   - For each object in each layer:
     * Read string array fields
     * Convert to FK relationships
     * Preserve temporal metadata (created_at from object)
     * Remove string array fields (break backward compat)

3. **Execute migration on port 8055** (2 hours)
   - Test on 51-ACA local instance (676 objects)
   - Validate FK integrity
   - Generate orphan report

4. **Execute migration on ACA Cosmos** (4 hours)
   - Backup Cosmos database (snapshot)
   - Run migration script (4061 objects)
   - Validate FK integrity
   - Generate orphan report

5. **Post-migration validation** (4 hours)
   - Run full test suite
   - Check orphan count (should be 0)
   - Verify navigation APIs work

6. **Rollback script** (2 hours)
   - In case migration fails
   - Restore from Cosmos snapshot
   - Re-add string array fields

7. **Documentation** (4 hours)
   - Migration report
   - Orphan resolution guide
   - Production cutover checklist

**Success Criteria:**
- [ ] All 4061 objects migrated
- [ ] Zero orphans (or documented exceptions)
- [ ] All 200+ tests passing
- [ ] Navigation APIs working in production
- [ ] Rollback script tested
- [ ] String arrays removed (FK-only mode)

---

## PART 5: ROLLOUT STRATEGY

### 5.1 Multi-Instance Support

**Three deployment environments:**

1. **ACA Cosmos** (primary production):
   - URL: `https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io`
   - Objects: 4061
   - Migration: Phase 5 (September 2026)
   - Backward compat: 6 months (Mar 2027)

2. **Port 8010** (local dev fallback):
   - URL: `http://localhost:8010`
   - Objects: Same as ACA (shared model/ files)
   - Migration: Same as ACA
   - Backward compat: Same as ACA

3. **Port 8055** (51-ACA isolated):
   - URL: `http://localhost:8055`
   - Objects: 676 (51-ACA sprint automation)
   - Migration: OPTIONAL -- can adopt FK independently
   - Backward compat: NO DEADLINE -- can stay on string arrays forever if needed

**Isolation guarantee**: Port 8055 can opt-out of FK migration entirely. No forced breaking changes.

---

### 5.2 Pilot Projects (Phase 2-4)

**Recommended pilot**: **51-ACA sprint automation** (June-August 2026)

**Why 51-ACA**:
- High velocity (15 stories/sprint)
- FK-heavy (sprints -> wbs -> endpoints -> containers)
- Isolated instance (port 8055)
- Clear ROI (30  (updated per revised timeline):
- Sprint 1-2 (Mar-Apr): Phase 0 delivers FK validation -- pilot objects validated automatically
- Sprint 6 (July): Seed FKs for 51-ACA objects (sprints, wbs, endpoints, containers)
- Sprint 7 (August): Use navigation APIs in sprint automation scripts
- Sprint 8-9 (Sep-Oct): Test scenario branching for sprint deployments
- Sprint 12 (Jan-Feb 2027y): Use navigation APIs in sprint automation scripts
- Sprint 8 (August): Test scenario branching for sprint deployments
- Sprint 9 (Sep): Migrate to FK-only mode (optional)

**Success metrics**:
- Sprint deploy time: 30 min -> 5 min (6x faster)
- Zero FK validation errors
- Scenario validation catches breaking changes before merge

---12 Sprints, March 2026 - February 2027)

**Revised per Opus 4.6 review (was 6 sprints, 180h in v1.0.0)**

| Phase | Sprint | Month | Duration | Deliverables | Risk |
|---|---|---|---|---|---|
| 0 (NEW) | S1-S2 | Mar-Apr 2026 | 2 sprints (48h) | Server-side FK validation, orphan detection | ZERO |
| 1A | S3-S4 | May-Jun 2026 | 2 sprints (80h) | Base FK schema, validation, 100+ unit tests | LOW |
| 1B-Scenarios | S5-S6 | Jul 2026 | 2 sprints (40h) | Scenario CRUD, saga merge | MEDIUM |
| 2 | S6 | Jul 2026 | 15h (parallel) | Seed FKs for pilot (337 objects) | LOW |
| 3 | S7 | Aug 2026 | 1 sprint (35h) | Relationship indexes, O(1) navigation, BFS cycle detection | LOW |
| 1C-IaC | S8 | Sep 2026 | 1 sprint (30h) | Bicep + Terraform generation from FK graph | MEDIUM |
| 1D-Pipelines | S9 | Oct 2026 | 1 sprint (30h) | Azure Pipelines + GitHub Actions generation | MEDIUM |
| 4 | S10 | Nov 2026 | 1 sprint (35h) | Cascade rules, delete safety | MEDIUM |
| 1E-Workflows | S10 | Nov 2026 | parallel (25h) | Workflow orchestration + scheduling | MEDIUM |
| 1F-Snapshots | S11 | Dec 2026 | 1 sprint (20h) | Snapshot create/restore/rollback | LOW |
| 5 | S12 | Jan-Feb 2027 | 1+ sprint (45h) | Full migration (4061+ objects) | HIGH |

**Total**: 403 hours ac (14 Risks -- expanded per Opus 4.6 review)

**Original 6 risks (retained, updated):**

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| R1: Circular dependencies break migration | MEDIUM | HIGH | Phase 0 orphan scan + Phase 1A cycle detection (CRIT-4 fix) |
| R2: Orphan references cause FK validate errors | HIGH | MEDIUM | Phase 0 orphan endpoint + cleanup before Phase 2 |
| R3: Performance regression (FK validation overhead) | LOW | MEDIUM | Async validation, batch mode, caching |
| R4: Port 8055 isolation breaks | LOW | HIGH | Independent MODEL_DIR, no shared state |
| R5: 51-ACA pilot blocked by FK issues | MEDIUM | LOW | Opt-in migration, backward compat fallback |
| R6: Cosmos migration fails | LOW | CRITICAL | Snapshot before migration, rollback script tested, dry-run on port 8010 first |

**8 NEW risks (identified by Opus 4.6):**

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| R7: Cross-partition merge failure (CRIT-2) | HIGH | CRITICAL | Saga pattern with compensation log |
| R8: Hot-object contention on embedded FKs (CRIT-3) | MEDIUM | HIGH | Option A (separate container) or Option C (retry) |
| R9: BFS infinite loop on cyclic data (CRIT-4) | MEDIUM | HIGH | Visited set with layer:id keys |
| R10: Phase 1B scope creep (was 5 subsystems in 30h) | HIGH | HIGH | Split into 5 independent phases (REC-2) |
| R11: Effort underestimate causes burnout or abandonment | HIGH | CRITICAL | Budget 403h, track velocity per sprint |
| R12: IaC generation produces invalid Bicep | MEDIUM | MEDIUM | PSRule validation gate, template testing |
| R13: Saga compensation fails during rollback | LOW | CRITICAL | Idempotent compensation, manual recovery guide |
| R14: Snapshot storage grows without bounds | LOW | MEDIUM | TTL policy on snapshots, max 10 active

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Circular dependencies break migration | MEDIUM | HIGH | Phase 1A detects circular deps in WBS/services, manual cleanup before Phase 5 |
| Orphan references cause FK validate errors | HIGH | MEDIUM | Phase 1A orphan scan, clean up before Phase 2-5 |
| Performance regression (FK validation overhead) | LOW | MEDIUM | Async validation, caching, index optimization |
| Port 8055 isolation breaks | LOW | HIGH | Independent MODEL_DIR support, no shared state |
| 51-ACA pilot blocked by FK issues | MEDIUM | LOW | Opt-in migration, backward compat fallback |
| Cosmos migration fails | LOW | CRITICAL | Snapshot before migration, rollback script tested, dry-run on port 8010 first |

**Rollback plan** (if Phase 5 migration fails):
1. Restore Cosmos from snapshot (pre-migration state)
2. Re-add string array fields to all objects
3. Disable FK validation in upsert()
4. Continue using string arrays until issues resolved

---

## PART 6: SUCCESS METRICS

### 6.1 Performance Targets

| Metric | Before FK | After FK | Improvement |
|---|---|---|---|
| Query depth=3 | 10-15 API calls | 1 API call | 10-15x faster |
| Orphan detection | Manual scan (hours) | Automated API (seconds) | 1000x faster |
| Impact analysis | Manual (30 min) | Automated API (< 1 sec) | 1800x faster |
| Sprint deploy (51-ACA) | 30 min manual | 5 min automated | 6x faster |
| FK validation | None (post-deploy errors) | Pre-flight (shift-left) | Prevents prod outages |

### 6.2 Quality Gates

**Phase 1A:**
- [ ] 100+ unit tests p (Revised per Opus 4.6 review)

### Immediate (Today):

1. **[DONE] Opus 4.6 review**: CONDITIONAL GO received, 4 CRITs fixed in v2.0.0
2. **[DONE] Findings doc**: FK-ENHANCEMENT-OPUS-FINDINGS-2026-02-28.md created
3. **[DONE] Plan update**: This document revised to v2.0.0
4. **[ ] Commit connections.json**: Still pending from earlier session
5. **[ ] Export to Cosmos**: POST /model/admin/export

### Phase 0 Kickoff (March 2026 -- IMMEDIATE START):

1. **[ ] Extend EDGE_TYPES registry** (8 hours)
   - Add cascade, required, description to all 27 edge types
   - File: api/routers/graph.py

2. **[ ] Implement validate_fks()** (16 hours)
   - File: api/store/base.py, cosmos.py, memory.py
   - Wire into upsert() with validate_fks=True default

3. **[ ] Create orphan detection endpoint** (8 hours)
   - GET /model/relationships/orphans

4. **[ ] Write 60+ unit tests** (12 hours)

5. **[ ] Update USER-GUIDE.md** (4 hours)

### Sprint 3 (May 2026, Phase 1A Start):

1. **[ ] Design RelationshipMeta schema** (Pydantic model, JSON schema)
2. **[ ] Choose CRIT-3 resolution**: Option A (separate container) vs Option C (retry)
3. **[ ] Write BFS with cycle detection** (CRIT-4 fix -- visited set with layer:id keys)
4. **[ ] Prototype saga merge pattern** (CRIT-2 -- ScenarioMergeSaga class)
5. **[ ] Write 100+ unit tests**
---

## PART 7: NEXT ACTIONS

### Immediate (Today):

1. **[ ] User approval**: Review this plan, confirm go/no-go for Phase 1A kickoff (May 2026)
2. **[ ] Commit connections.json**: Still pending from earlier session
3. **[ ] Export to Cosmos**: POST /model/admin/export

### Sprint 3 (March 2026, Pre-Phase 1A):

1. **[ ] Design RelationshipMeta schema** (Pydantic model, JSON schema)
2. **[ ] Prototype FK validation** in upsert()
3. **[ ] Write orphan detection script** (analyze current state)
4. **[ ] Clean up orphans** (prerequisite for Phase 1A)

### Phase 1A Kickoff (May 2026):

1. **[ ] Create Phase 1A branch** in 37-data-model repo
2. **[ ] Implement base FK validation** (60 hours)
3. **[ ] Add _relationships field** to all objects (cold-deploy)
4. **[ ] Write 100+ unit tests**
5. **[ ] Merge to main** after QA pass

---

## APPENDIX A: EDGE TYPE REFERENCE

### A.1 All 27 Edge Types (20 Existing + 7 New)

**Existing (defined in graph.py):**
1. calls (screens -> endpoints)
2. reads (endpoints -> containers)
3. writes (endpoints -> containers)
4. uses_component (screens -> components)
5. uses_hook (screens -> hooks)
6. hook_calls (hooks -> endpoints)
7. implemented_by (endpoints -> services)
8. depends_on (services -> services)
9. gated_by (endpoints -> feature_flags)
10. reads_schema (endpoints -> schemas)
11. writes_schema (endpoints -> schemas)
12. agent_reads (agents -> endpoints)
13. agent_outputs (agents -> screens)
14. satisfies (endpoints -> requirements, INVERSE)
15. wbs_depends (wbs -> wbs)
16. project_depends (projects -> projects)
17. project_wbs (projects -> wbs)
18. persona_flags (personas -> feature_flags)
19. runbook_skill (runbooks -> cp_skills)
20. wbs_runbook (wbs -> runbooks)

**New (required for CI/CD support):**
21. deployed_to (infrastructure -> environments)
22. owned_by (infrastructure -> projects)
23. targets_milestone (projects -> milestones)
24. has_story (sprints -> wbs)
25. workflow_implements (cp_workflows -> runbooks)
26. workflow_targets (cp_workflows -> environments)
27. uses_plane (projects -> planes)

---

## APPENDIX B: CASCADE POLICY MATRIX

| Edge Type | From -> To | Cascade Policy | Rationale |
|---|---|---|---|
| calls | screens -> endpoints | RESTRICT | Deleting endpoint breaks UI, must be intentional |
| reads | endpoints -> containers | RESTRICT | Deleting container breaks endpoint, must be intentional |
| writes | endpoints -> containers | RESTRICT | Deleting container breaks endpoint, must be intentional |
| uses_component | screens -> components | RESTRICT | Deleting component breaks UI |
| uses_hook | screens -> hooks | RESTRICT | Deleting hook breaks UI |
| hook_calls | hooks -> endpoints | RESTRICT | Deleting endpoint breaks hook |
| implemented_by | endpoints -> services | RESTRICT | Deleting service orphans endpoints |
| depends_on | services -> services | RESTRICT | Circular dependencies require careful management |
| gated_by | endpoints -> feature_flags | SET_NULL | Deleting flag disables endpoint (soft degradation) |
| reads_schema | endpoints -> schemas | RESTRICT | Deleting schema breaks endpoint |
| writes_schema | endpoints -> schemas | RESTRICT | Deleting schema breaks endpoint |
| agent_reads | agents -> endpoints | RESTRICT | Deleting endpoint breaks agent |
| agent_outputs | agents -> screens | RESTRICT | Deleting screen breaks agent |
| satisfies | endpoints Revised -- aligns with 12-sprint plan)

**Sprints 1-2 (March-April 2026) - Phase 0 Benefits:**
1. FK validation catches dangling references in 51-ACA objects automatically
2. Orphan scan identifies cleanup targets before FK seeding

**Sprint 6 (July 2026) - Seed FKs:**
1. Seed sprints.story_ids -> has_story FKs (9 objects, 2 hours)
2. Seed top 100 wbs.depends_on_wbs -> wbs_depends FKs (100 objects, 4 hours)
3. Seed all endpoints.cosmos_reads/writes -> reads/writes FKs (187 objects, 4 hours)

**Sprint 7 (August 2026) - Use Navigation APIs:**
1. Update sprint automation to use GET /sprints/{id}/descendants (2 hours)
2. Replace manual dependency tracking with FK graph queries (4 hours)
3. Add impact analysis to sprint validation (3 hours)

**Sprints 8-9 (September-October 2026) - Scenario Testing:**
1. Create scenario branch for deployment (1 hour)
2. Mutate FKs in scenario (add endpoints, validate) (3 hours)
3. Test saga-based merge (CRIT-2 pattern) (4 hours)
4. Generate IaC from scenario (2 hours)

**Sprint 12 (January-February 2027
### C.1 Pilot Scope

**Layers involved:**
- sprints (9 objects) -> has_story -> wbs
- wbs (2988 objects) -> depends_on_wbs, wbs_runbook
- endpoints (187 objects) -> reads, writes, implemented_by
- containers (13 objects) -> (target of reads/writes)
- projects (53 objects) -> project_wbs

**Total objects**: ~3260 (82% of all 4061 objects)

**Why this is a representative pilot**:
- Covers 5 layers (16% of 31 layers)
- Includes self-referential FKs (wbs_depends, project_depends)
- Includes critical FKs (reads, writes)
- Includes CI/CD FKs (wbs_runbook)
- Tests cascade rules (project -> wbs CASCADE)

### C.2 Pilot Timeline (4 Sprints)

**Sprint 6 (June 2026) - Seed FKs:**
1. Seed sprints.story_ids -> has_story FKs (9 objects, 2 hours)
2. Seed top 100 wbs.depends_on_wbs -> wbs_depends FKs (100 objects, 4 hours)
3. Seed all endpoints.cosmos_reads/writes -> reads/writes FKs (187 objects, 4 hours)

**Sprint 7 (July  (v2.0.0)**

Revised per Claude Opus 4.6 architectural review, 2026-02-28.
All 4 critical flaws resolved. Phase 0 added. Phase 1B split. Effort revised to 403h.
Companion doc: FK-ENHANCEMENT-OPUS-FINDINGS-2026-02-28.md
3. Add impact analysis to sprint validation (3 hours)

**Sprint 8 (August 2026) - Scenario Testing:**
1. Create scenario branch for Sprint 3 deployment (1 hour)
2. Mutate FKs in scenario (add endpoints, validate) (3 hours)
3. Generate IaC from scenario (2 hours)
4. Merge scenario to main (1 hour)

**Sprint 9 (September 2026) - Migrate to FK-Only:**
1. Run migration script on port 8055 (676 objects, 1 hour)
2. Remove string arrays (break backward compat, 1 hour)
3. Validate FK integrity (1 hour)
4. Update sprint automation to FK-only mode (2 hours)

### C.3 Success Criteria

**Sprint 6:**
- [ ] 296 objects have FK relationships (9 sprints + 100 wbs + 187 endpoints)
- [ ] Zero FK validation errors
- [ ] Backward compat maintained (string arrays present)

**Sprint 7:**
- [ ] Sprint automation uses navigation APIs
- [ ] Dependency tracking automated (no manual PLAN.md parsing)
- [ ] Impact analysis catches breaking changes

**Sprint 8:**
- [ ] Scenario branch/merge works
- [ ] IaC generation produces valid Bicep
- [ ] Sprint deployment 30 min -> 10 min (3x faster)

**Sprint 9:**
- [ ] All 676 objects migrated to FK-only
- [ ] Zero orphans
- [ ] Sprint deployment 30 min -> 5 min (6x faster)

---

**END OF DOCUMENT**

Total: 9878 lines covering complete discovery, design, and implementation plan for FK enhancement.
