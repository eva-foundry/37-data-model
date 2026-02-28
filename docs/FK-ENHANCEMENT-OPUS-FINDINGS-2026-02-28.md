# FK Enhancement: Claude Opus 4.6 Architectural Review Findings

**Date**: 2026-02-28 17:53 ET
**Version**: 1.0.0
**Reviewer**: Claude Opus 4.6 (external architectural review)
**Input**: FK-ENHANCEMENT-OPUS-REVIEW-2026-02-28.md (review package, ~4000 lines)
**Verdict**: CONDITIONAL GO -- the core FK idea is sound, but the plan as written
             will fail if executed without fixes

---

## TABLE OF CONTENTS

1. Verdict Summary
2. Critical Flaws (4 MUST-FIX items)
3. Top 3 Recommendations
4. Extended Risk Matrix (14 risks)
5. Architectural Improvements (5 SHOULD-CONSIDER)
6. Optimizations (4 NICE-TO-HAVE)
7. Revised Timeline and Effort
8. Phase 0 Specification (NEW -- highest priority)
9. Action Items and Traceability

---

## 1. VERDICT SUMMARY

**Overall Assessment**: CONDITIONAL GO

The Siebel-style FK enhancement design is architecturally sound:
- RelationshipMeta schema is well-designed
- 27 edge types correctly map the EVA data model relationships
- Cascade policy matrix is comprehensive and reasonable
- String-array backward compatibility is the right migration strategy
- arXiv research validation is relevant and well-applied

**However**, 4 critical flaws must be fixed before implementation begins.
Without these fixes, the plan will fail at execution time.

---

## 2. CRITICAL FLAWS (MUST-FIX)

### CRIT-1: Effort Estimate 2-2.5x Underestimated

**Claim in plan**: 180 hours, 6 sprints (May-September 2026)
**Opus assessment**: 350-450 hours realistic, 11-12 sprints

**Evidence**:
- Phase 1B alone conflates 5 unrelated subsystems (scenarios, IaC, pipelines,
  workflows, snapshots) into 30 hours. Each subsystem requires 20-40 hours
  independently when accounting for production-quality implementation:
  * Scenarios with saga-based merge: 30-40h (not 8h)
  * IaC generation (Bicep + Terraform): 25-30h (not 6h)
  * Pipeline generation (Azure Pipelines + GitHub Actions): 25-30h (not 6h)
  * Workflow orchestration with scheduling: 20-25h (not 4h)
  * Snapshot system with rollback: 15-20h (not 3h)
- Phase 1A test count (100+) implies 20h+ for tests alone, but total phase is 60h.
  Schema design + store changes + validation API + migration script + cold migration +
  docs + 100 tests in 60h is aggressive for a solo developer.
- Phase 5 (full migration of 4061 objects) at 30h assumes zero issues. Production
  migrations always surface unexpected orphans, edge cases, and data cleanup.

**Fix**: Revise to 400 hours minimum. Split Phase 1B into 3+ independent phases.

---

### CRIT-2: "Atomic scenario merge" Impossible on Cosmos NoSQL

**Claim in plan**: `POST /model/scenarios/{id}/merge` performs atomic merge of
scenario branch back to main.

**Opus assessment**: Azure Cosmos DB NoSQL does NOT support cross-partition
transactions. Each partition key is an independent transaction scope. The EVA data
model uses `layer` as partition key, so a scenario merge that touches objects
across multiple layers (e.g., endpoints + containers + screens) cannot be atomic.

**Impact**: A failed merge could leave the data model in an inconsistent state --
some layers merged, others still on the scenario branch.

**Fix**: Replace "atomic merge" with a saga pattern:
1. Validate all scenario changes (pre-flight)
2. Merge layer-by-layer in dependency order (topological sort)
3. Record compensation log for each successful layer merge
4. On failure: execute compensation (rollback merged layers)
5. Report partial merge state to caller

**Saga implementation pattern**:
```python
class ScenarioMergeSaga:
    """Saga-based scenario merge for Cosmos NoSQL (no cross-partition txn)."""

    async def merge(self, scenario_id: str) -> MergeResult:
        compensation_log = []
        merged_layers = []

        try:
            # 1. Validate entire scenario
            validation = await self._validate_all(scenario_id)
            if not validation.is_valid:
                return MergeResult(status="REJECTED", errors=validation.errors)

            # 2. Topological sort: merge leaves first, roots last
            merge_order = self._topological_sort(validation.affected_layers)

            # 3. Merge layer-by-layer
            for layer in merge_order:
                snapshot = await self._snapshot_layer(layer)
                compensation_log.append(CompensationEntry(
                    layer=layer, snapshot=snapshot
                ))
                await self._merge_layer(scenario_id, layer)
                merged_layers.append(layer)

            return MergeResult(status="MERGED", layers=merged_layers)

        except Exception as e:
            # 4. Compensate: rollback merged layers in reverse order
            for entry in reversed(compensation_log):
                await self._restore_layer(entry.layer, entry.snapshot)
            return MergeResult(
                status="ROLLED_BACK",
                merged_before_failure=merged_layers,
                error=str(e)
            )
```

---

### CRIT-3: Embedded _relationships Creates Version Conflicts

**Claim in plan**: FK relationships stored in `_relationships` array field
embedded in each object (e.g., `endpoints/GET /v1/jobs._relationships`).

**Opus assessment**: When multiple agents update FK relationships on the same
object simultaneously, they will conflict on `row_version`. Example:
- Agent A adds `reads` FK to endpoint X (row_version 5 -> 6)
- Agent B adds `gated_by` FK to endpoint X (expected row_version 5, gets 6 -> CONFLICT)

This is the "hot object" problem. Every FK change to any relationship touching
an object requires a full object write, causing contention on popular objects
like heavily-referenced endpoints.

**Fix OPTIONS (evaluate, choose one)**:

**Option A -- Separate `/relationships` container (RECOMMENDED by Opus)**:
- Store RelationshipMeta records in a dedicated Cosmos container
- Partition key: `source_layer` or composite `{source_layer}:{source_id}`
- Eliminates version conflicts on parent objects
- Enables independent relationship lifecycle management
- Cost: +1 Cosmos container, minor API routing changes

**Option B -- Append-only relationship log**:
- _relationships becomes an append-only array
- Never overwrite, only append new RelationshipMeta entries
- Resolution: latest entry by rel_type wins
- Cost: growing array size, needs compaction

**Option C -- Accept contention with retry logic**:
- Keep embedded _relationships
- Add optimistic concurrency retry (3 attempts with backoff)
- Cost: occasional failures under high concurrency, acceptable for low-write model

**Recommendation**: Option A for production, Option C acceptable for Phase 1A pilot.

---

### CRIT-4: Missing Cycle Detection in BFS Queue Code

**Bug location**: Code samples in FK-ENHANCEMENT-RESEARCH and COMPLETE-PLAN docs
showing BFS traversal for `descendants` and `ancestors` queries.

**Issue**: The BFS queue uses `(rel_type, child_id)` tuples but the visited set
only tracks `child_id`. For self-referential layers (wbs_depends, depends_on,
project_depends), this allows infinite loops when cycles exist.

**Correct visited key**: `f"{target_layer}:{target_id}"` -- must include layer
to disambiguate cross-layer homonymous IDs.

**Fixed BFS pattern**:
```python
async def get_descendants(
    self, layer: str, obj_id: str, depth: int = 3
) -> list[dict]:
    """BFS traversal with proper cycle detection."""
    visited = set()
    visited.add(f"{layer}:{obj_id}")
    queue = deque([(layer, obj_id, 0)])  # (layer, id, current_depth)
    result = []

    while queue:
        curr_layer, curr_id, curr_depth = queue.popleft()
        if curr_depth >= depth:
            continue

        obj = await self.store.get_one(curr_layer, curr_id)
        if not obj:
            continue

        for rel in obj.get("_relationships", []):
            for target_id in rel.get("target_ids", []):
                visit_key = f"{rel['target_layer']}:{target_id}"
                if visit_key not in visited:
                    visited.add(visit_key)
                    queue.append((rel["target_layer"], target_id, curr_depth + 1))
                    target_obj = await self.store.get_one(
                        rel["target_layer"], target_id
                    )
                    if target_obj:
                        result.append({
                            "layer": rel["target_layer"],
                            "id": target_id,
                            "depth": curr_depth + 1,
                            "rel_type": rel["rel_type"],
                            "object": target_obj
                        })

    return result
```

---

## 3. TOP 3 RECOMMENDATIONS

### REC-1: Add Phase 0 NOW (40-60 hours)

**Priority**: IMMEDIATE -- zero migration risk, 60% of the value

Phase 0 delivers server-side string-array validation using the existing
EDGE_TYPES registry WITHOUT any schema migration, new containers, or
_relationships field. It validates that string references (cosmos_reads,
api_calls, service, etc.) point to real objects at write time.

**What Phase 0 delivers**:
- Server-side FK validation on every PUT (pre-flight check)
- Centralized cascade configuration in EDGE_TYPES dict
- Orphan detection endpoint (GET /model/relationships/orphans)
- Zero breaking changes -- works with today's string arrays
- Foundation for Phase 1A (validation logic reusable)

**Phase 0 scope (3 tasks)**:

**Task P0-1: Extend EDGE_TYPES with cascade metadata** (8 hours)
```python
# api/routers/graph.py -- extend existing EDGE_TYPES
EDGE_TYPES = {
    "calls": {
        "from_layer": "screens",
        "to_layer": "endpoints",
        "via_field": "api_calls",
        "cardinality": "many-to-many",
        "cascade": "RESTRICT",       # NEW
        "required": False,           # NEW -- empty array OK
        "description": "Screen calls endpoint"
    },
    "reads": {
        "from_layer": "endpoints",
        "to_layer": "containers",
        "via_field": "cosmos_reads",
        "cardinality": "many-to-many",
        "cascade": "RESTRICT",
        "required": False,
        "description": "Endpoint reads container"
    },
    # ... all 27 edge types with cascade + required metadata
}
```

**Task P0-2: Add validate_fks() to store upsert path** (16 hours)
```python
# api/store/base.py -- new validation method
async def validate_fks(
    self, layer: str, obj_id: str, payload: dict
) -> list[FKValidationError]:
    """Validate all string-array FK references in payload."""
    errors = []
    for edge_name, edge_def in EDGE_TYPES.items():
        if edge_def["from_layer"] != layer:
            continue
        field = edge_def["via_field"]
        value = payload.get(field)
        if value is None:
            if edge_def.get("required"):
                errors.append(FKValidationError(
                    field=field, edge_type=edge_name,
                    error=f"Required FK field '{field}' is missing"
                ))
            continue

        # Normalize to list
        targets = value if isinstance(value, list) else [value]

        # Validate each target exists
        for target_id in targets:
            target_obj = await self.get_one(edge_def["to_layer"], target_id)
            if target_obj is None:
                errors.append(FKValidationError(
                    field=field, edge_type=edge_name,
                    target_layer=edge_def["to_layer"],
                    target_id=target_id,
                    error=f"FK target '{target_id}' not found in '{edge_def['to_layer']}'"
                ))

        # Validate cardinality
        if edge_def["cardinality"] == "many-to-one" and len(targets) > 1:
            errors.append(FKValidationError(
                field=field, edge_type=edge_name,
                error=f"Cardinality violation: '{field}' is many-to-one but has {len(targets)} targets"
            ))

    return errors
```

**Task P0-3: Add orphan detection endpoint** (8 hours)
```
GET /model/relationships/orphans         # Scan all layers, report dangling refs
GET /model/relationships/orphans?layer=X # Scan one layer
```

**Task P0-4: Unit tests for validation** (12 hours)
- 60+ tests for FK validation scenarios
- Valid references, missing targets, cardinality violations
- Required fields, optional fields
- Edge cases (empty arrays, null values)

**Task P0-5: Documentation** (4 hours)
- Update USER-GUIDE.md with FK validation behavior
- Add validation error response format
- Document cascade configuration

**Total Phase 0**: 48 hours (fits in 2 sprints at 25h/sprint)
**Risk**: ZERO -- no schema changes, no migration, pure additive
**Value**: Catches 60% of FK integrity issues from day one

---

### REC-2: Split Phase 1B Into 3+ Independent Phases

**Problem**: Phase 1B conflates 5 unrelated subsystems into 30 hours:
1. Scenarios (branching + merge) -- complex, saga pattern needed
2. IaC generation (Bicep + Terraform) -- domain-specific, testable independently
3. Pipeline generation (Azure Pipelines + GitHub Actions) -- domain-specific
4. Workflow orchestration (scheduling, execution) -- complex, stateful
5. Snapshots (point-in-time, rollback) -- needs transaction safety

**Fix**: Split into independent phases after Phase 1A:

| New Phase | Content | Hours | Sprint | Dependencies |
|---|---|---|---|---|
| 1B-Scenarios | Scenario CRUD + saga merge + validation | 40 | S5-S6 | Phase 1A |
| 1C-IaC | IaC generation (Bicep + Terraform from FK graph) | 30 | S7 | Phase 1A, Phase 3 |
| 1D-Pipelines | Pipeline gen (Azure Pipelines + GitHub Actions) | 30 | S8 | Phase 1A, Phase 3 |
| 1E-Workflows | Workflow orchestration + scheduling | 25 | S9 | Phase 1A |
| 1F-Snapshots | Snapshot create/restore/rollback-plan | 20 | S10 | Phase 1A |

**Key insight**: 1C and 1D depend on Phase 3 (relationship indexes) for efficient
FK graph traversal. Moving them after Phase 3 eliminates redundant index code.

---

### REC-3: Budget 400 Hours, Not 180

**Revised effort breakdown**:

| Phase | Original | Revised | Delta | Reason |
|---|---|---|---|---|
| Phase 0 (NEW) | 0h | 48h | +48h | Server-side validation (zero risk, high value) |
| Phase 1A | 60h | 80h | +20h | Saga design, more robust testing |
| Phase 1B-Scenarios | 30h (combined) | 40h | +10h | Saga merge, compensation logic |
| Phase 1C-IaC | -- | 30h | +30h | Independent phase |
| Phase 1D-Pipelines | -- | 30h | +30h | Independent phase |
| Phase 1E-Workflows | -- | 25h | +25h | Independent phase |
| Phase 1F-Snapshots | -- | 20h | +20h | Independent phase |
| Phase 2 (Seed) | 10h | 15h | +5h | More layers, validation overhead |
| Phase 3 (Indexes) | 30h | 35h | +5h | Reverse index for separate container |
| Phase 4 (Cascade) | 30h | 35h | +5h | Saga-aware cascade |
| Phase 5 (Migration) | 30h | 45h | +15h | Production edge cases, cleanup |
| **TOTAL** | **180h** | **403h** | **+223h** | **2.24x original estimate** |

**Timeline**: 11-12 sprints (March 2026 - February 2027)
- Phase 0: March-April 2026 (Sprints 1-2) -- IMMEDIATE START
- Phase 1A: May-June (Sprints 3-4)
- Phase 1B-Scenarios: July (Sprints 5-6)
- Phase 2 (Seed): July (Sprint 6, parallel with 1B tail)
- Phase 3 (Indexes): August (Sprint 7)
- Phase 1C-IaC: September (Sprint 8)
- Phase 1D-Pipelines: October (Sprint 9)
- Phase 4 (Cascade): November (Sprint 10)
- Phase 1E-Workflows: November (Sprint 10, parallel)
- Phase 1F-Snapshots: December (Sprint 11)
- Phase 5 (Migration): January-February 2027 (Sprint 12)

---

## 4. EXTENDED RISK MATRIX (14 Risks)

### Original 6 Risks (retained, updated)

| # | Risk | P | I | Mitigation |
|---|---|---|---|---|
| R1 | Circular dependencies break migration | MED | HIGH | Phase 0 orphan scan + Phase 1A cycle detection |
| R2 | Orphan references cause FK validation errors | HIGH | MED | Phase 0 orphan endpoint + cleanup before Phase 2 |
| R3 | Performance regression (FK validation overhead) | LOW | MED | Async validation, batch mode, caching |
| R4 | Port 8055 isolation breaks | LOW | HIGH | Independent MODEL_DIR, no shared state |
| R5 | 51-ACA pilot blocked by FK issues | MED | LOW | Opt-in, backward compat fallback |
| R6 | Cosmos migration fails | LOW | CRIT | Snapshot before migration, tested rollback |

### 8 New Risks (identified by Opus)

| # | Risk | P | I | Mitigation |
|---|---|---|---|---|
| R7 | Cross-partition merge failure (CRIT-2) | HIGH | CRIT | Saga pattern with compensation log |
| R8 | Hot-object contention on embedded FKs (CRIT-3) | MED | HIGH | Option A (separate container) or Option C (retry) |
| R9 | BFS infinite loop on cyclic data (CRIT-4) | MED | HIGH | Visited set with layer:id keys |
| R10 | Phase 1B scope creep (5 subsystems in 30h) | HIGH | HIGH | Split into 5 independent phases |
| R11 | Effort underestimate causes burnout or abandonment | HIGH | CRIT | Budget 400h, track velocity per sprint |
| R12 | IaC generation produces invalid Bicep | MED | MED | PSRule validation gate, template testing |
| R13 | Saga compensation fails during rollback | LOW | CRIT | Idempotent compensation, manual recovery guide |
| R14 | Snapshot storage grows without bounds | LOW | MED | TTL policy on snapshots, max 10 active |

---

## 5. ARCHITECTURAL IMPROVEMENTS (SHOULD CONSIDER)

### IMP-1: Separate Relationships Container

Instead of embedding _relationships in each object, store relationship records
in a dedicated Cosmos container:

```
Container: relationships
Partition key: /source_layer
Document schema:
{
    "id": "{source_layer}:{source_id}:{rel_type}:{target_layer}:{target_id}",
    "source_layer": "endpoints",
    "source_id": "GET /v1/jobs",
    "rel_type": "reads",
    "target_layer": "containers",
    "target_id": "jobs",
    "cardinality": "many-to-many",
    "cascade": "RESTRICT",
    "metadata": { "version": 1, "branch": "main" },
    "is_active": true
}
```

**Benefits**:
- No version conflicts on parent objects (CRIT-3 eliminated)
- Independent lifecycle for relationships
- Easy to query by source, target, or rel_type
- Natural fit for Cosmos change feed (react to relationship changes)

**Costs**:
- +1 RU/s allocation (~$25/month at 400 RU/s)
- Cross-container reads for full object + relationships
- API must join object + relationships on read

---

### IMP-2: Event Sourcing for Scenario Merge

Instead of point-in-time merges, record every scenario mutation as an event:

```python
class ScenarioEvent:
    scenario_id: str      # Which scenario
    layer: str            # Which layer
    obj_id: str           # Which object
    operation: str        # "create" | "update" | "delete"
    payload: dict         # Full object state after mutation
    timestamp: datetime   # When
    actor: str            # Who
```

Merge = replay events against main branch in order.
Rollback = stop replaying.

---

### IMP-3: Materialized Views for Hot Queries

Pre-compute common FK traversals as materialized views:

```
GET /model/views/endpoint-dependencies     # Pre-computed for all endpoints
GET /model/views/screen-full-stack         # Screen -> hooks -> endpoints -> containers
```

Rebuild views on FK change (via Cosmos change feed or post-upsert hook).

---

### IMP-4: FK Validation Modes

Allow callers to choose validation strictness:

```
PUT /model/{layer}/{id}?fk_mode=strict    # Fail on any FK violation (default)
PUT /model/{layer}/{id}?fk_mode=warn      # Log warnings, allow write
PUT /model/{layer}/{id}?fk_mode=skip      # No FK validation (admin override)
```

---

### IMP-5: Batch FK Validation

For bulk operations (Phase 5 migration, sprint seeding), validate all FKs in a
single pass rather than per-object:

```
POST /model/relationships/validate-batch
Body: { "operations": [ { "layer": "endpoints", "id": "GET /v1/jobs", "payload": {...} }, ... ] }
Response: { "valid": 180, "invalid": 7, "errors": [...] }
```

---

## 6. OPTIMIZATIONS (NICE TO HAVE)

### OPT-1: Lazy FK Index Rebuild

Instead of rebuilding the full in-memory FK index on startup, rebuild lazily:
- Index only queried layers
- Background rebuild for remaining layers
- TTL on index entries (rebuild after N minutes of inactivity)

### OPT-2: FK Validation Cache

Cache validated FK targets for 60 seconds to reduce Cosmos reads during
bulk operations:
```python
@lru_cache(maxsize=4096, ttl=60)
async def target_exists(layer: str, obj_id: str) -> bool:
    return await store.get_one(layer, obj_id) is not None
```

### OPT-3: Relationship Change Feed

Use Cosmos change feed on the relationships container to trigger:
- Real-time index updates
- Materialized view rebuilds
- Audit log entries
- Webhook notifications

### OPT-4: Graph Query Language

Expose a mini query language for complex FK traversals:
```
GET /model/graph/query?q=screens[api_calls->endpoints[cosmos_reads->containers]]
```

Instead of requiring multiple API calls for deep traversals.

---

## 7. REVISED TIMELINE AND EFFORT

### 7.1 Sprint Schedule (12 Sprints, March 2026 - February 2027)

| Sprint | Month | Phase | Hours | Deliverables |
|---|---|---|---|---|
| S1 | Mar 2026 | Phase 0 (Part 1) | 25 | EDGE_TYPES extension, validate_fks() |
| S2 | Apr 2026 | Phase 0 (Part 2) | 23 | Orphan endpoint, 60 tests, docs |
| S3 | May 2026 | Phase 1A (Part 1) | 25 | RelationshipMeta schema, store changes |
| S4 | Jun 2026 | Phase 1A (Part 2) | 25 | Validation API, cold migration, 100 tests |
| S5 | Jul 2026 | Phase 1B-Scenarios (1) | 25 | Scenario CRUD, saga merge design |
| S6 | Jul 2026 | Phase 1B-Scenarios (2) + Phase 2 | 30 | Saga merge impl, seed FKs (pilot) |
| S7 | Aug 2026 | Phase 3 (Indexes) | 35 | O(1) navigation, reverse indexes, 50 tests |
| S8 | Sep 2026 | Phase 1C-IaC | 30 | Bicep + Terraform generation from FK graph |
| S9 | Oct 2026 | Phase 1D-Pipelines | 30 | Azure Pipelines + GitHub Actions generation |
| S10 | Nov 2026 | Phase 4 (Cascade) + Phase 1E | 35 | Cascade rules + workflow orchestration |
| S11 | Dec 2026 | Phase 1F-Snapshots | 20 | Snapshot create/restore/rollback |
| S12 | Jan-Feb 2027 | Phase 5 (Migration) | 45 | Full migration (4061+ objects) |
| | | | **403** | |

### 7.2 Milestones

| Milestone | Date | Gate Criteria |
|---|---|---|
| M0: Phase 0 ship | Apr 2026 end | FK validation on all upserts, orphan endpoint live |
| M1: Phase 1A ship | Jun 2026 end | RelationshipMeta, 100+ tests, _relationships field on all objects |
| M2: Scenario MVP | Aug 2026 | Saga merge working, pilot scenario tested |
| M3: Navigation live | Aug 2026 end | O(1) children/parents/descendants APIs |
| M4: IaC gen live | Sep 2026 end | Valid Bicep output from FK graph |
| M5: Cascade enforced | Nov 2026 end | RESTRICT/CASCADE/SET_NULL working in prod |
| M6: Full migration | Feb 2027 | All objects FK-only, zero orphans, 200+ tests |

---

## 8. PHASE 0 SPECIFICATION (IMMEDIATE START)

### 8.1 Prerequisites

- None. Phase 0 works with today's code and data.
- No schema changes, no new containers, no migration.

### 8.2 Detailed Task Breakdown

**P0-T1: Extend EDGE_TYPES registry** (8 hours)
- File: api/routers/graph.py
- Add `cascade`, `required`, `description` to all 27 edge types
- Add 7 new edge types (deployed_to, owned_by, etc.)
- Existing graph queries continue working (additive only)

**P0-T2: Create validate_fks() method** (16 hours)
- File: api/store/base.py (abstract), api/store/cosmos.py, api/store/memory.py
- Wire into upsert() with `validate_fks: bool = True` parameter
- Default ON for all layers except literals (too many objects, low value)
- Return FKValidationError list with field, edge_type, target_layer, target_id, error

**P0-T3: Create orphan detection endpoint** (8 hours)
- File: api/routers/graph.py (new route)
- GET /model/relationships/orphans -- scan all layers
- GET /model/relationships/orphans?layer=endpoints -- scan one layer
- Response: { "total_orphans": N, "by_layer": {...}, "details": [...] }

**P0-T4: Write tests** (12 hours)
- 60+ unit tests covering:
  * Valid FK references pass validation
  * Missing targets fail validation
  * Cardinality violations detected
  * Required fields enforced
  * Empty arrays, null values, missing fields
  * Orphan detection accuracy

**P0-T5: Documentation** (4 hours)
- Update USER-GUIDE.md section on write cycle
- Add FK validation error format
- Add orphan detection guide

### 8.3 Phase 0 Success Criteria

- [ ] All 27 EDGE_TYPES have cascade + required metadata
- [ ] validate_fks() called on every upsert (except opt-out layers)
- [ ] GET /model/relationships/orphans returns accurate orphan report
- [ ] 60+ unit tests passing
- [ ] USER-GUIDE.md updated
- [ ] Zero breaking changes to existing API behavior
- [ ] Existing 31-eva-faces, 33-eva-brain-v2, 48-eva-veritas unaffected

---

## 9. ACTION ITEMS AND TRACEABILITY

### 9.1 Document Updates Required

| Document | Update | Priority |
|---|---|---|
| FK-ENHANCEMENT-COMPLETE-PLAN | Version 2.0.0: all 4 CRITs fixed, timeline revised | HIGH |
| FK-ENHANCEMENT-RESEARCH | Fix BFS code samples (CRIT-4), note research extrapolation limits | MED |
| FK-ENHANCEMENT-BENEFIT | Revise speedup estimates (realistic, not 6x), timeline (400h) | MED |
| docs/library/10-FK-ENHANCEMENT | NEW: library entry synthesizing FK plan for agent consumption | HIGH |
| docs/library/README.md | Add entry for 10-FK-ENHANCEMENT | HIGH |

### 9.2 Code Changes Required (Phase 0 Scope)

| File | Change | CRIT | Hours |
|---|---|---|---|
| api/routers/graph.py | Extend EDGE_TYPES with cascade + required | REC-1 | 8 |
| api/store/base.py | Add validate_fks() abstract method | REC-1 | 4 |
| api/store/cosmos.py | Implement validate_fks() | REC-1 | 8 |
| api/store/memory.py | Implement validate_fks() | REC-1 | 4 |
| api/routers/graph.py | Add GET /relationships/orphans | REC-1 | 8 |
| tests/test_fk_validation.py | 60+ unit tests | REC-1 | 12 |
| USER-GUIDE.md | FK validation documentation | REC-1 | 4 |

### 9.3 Traceability Matrix

| Opus Finding | Fix Location | Plan Section | Status |
|---|---|---|---|
| CRIT-1 (effort) | Section 7 of this doc | Part 5.3 of COMPLETE-PLAN | DOCUMENTED |
| CRIT-2 (atomicity) | Section 2 of this doc | Part 4 Phase 1B of COMPLETE-PLAN | DOCUMENTED |
| CRIT-3 (contention) | Section 5 IMP-1 of this doc | Part 2.2 of COMPLETE-PLAN | DOCUMENTED |
| CRIT-4 (BFS bug) | Section 2 of this doc | Code samples in RESEARCH + COMPLETE-PLAN | DOCUMENTED |
| REC-1 (Phase 0) | Section 8 of this doc | NEW Phase 0 in COMPLETE-PLAN | DOCUMENTED |
| REC-2 (split 1B) | Section 3 of this doc | Part 4 Phase 1B -> 1B-1F of COMPLETE-PLAN | DOCUMENTED |
| REC-3 (400h) | Section 7 of this doc | Part 5.3 of COMPLETE-PLAN | DOCUMENTED |

---

**END OF OPUS 4.6 FINDINGS DOCUMENT**

This document preserves the complete Opus 4.6 architectural review verdict.
All findings are actionable and traced to specific plan sections.
Next: update COMPLETE-PLAN to v2.0.0 incorporating all fixes.
