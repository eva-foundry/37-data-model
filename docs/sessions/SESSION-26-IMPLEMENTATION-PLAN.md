# Session 26: Agent Experience Enhancements Implementation Plan

**Date:** March 5, 2026 5:37 PM ET  
**Sprint:** Enhancement Sprint (All 5 improvements)  
**Goal:** Transform API to 100% self-documenting with universal query support

---

## DISCOVER (5:37-5:45 PM)

### Current State Analysis
- ✅ `/model/agent-guide` exists with comprehensive docs
- ✅ Base router pattern in `base_layer.py` (28 line function per layer)
- ✅ Specialized routers: `filter_endpoints.py` (has query support)
- ✅ Evidence layer has query support (`?sprint_id`, `?story_id`, `?phase`)
- ❌ No universal query support across all layers
- ❌ No schema introspection endpoints
- ❌ No pagination or count endpoints
- ❌ No aggregation endpoints
- ❌ No helpful error messages for unsupported queries

### Files to Modify
1. `api/server.py` — Enhanced agent-guide response (lines 420-549)
2. `api/routers/base_layer.py` — Add universal query support to factory
3. `api/routers/introspection.py` — NEW: Schema details, examples, fields
4. `api/routers/aggregation.py` — NEW: Evidence/sprint/project metrics
5. `api/server.py` — Register new routers

---

## PLAN (5:45-6:00 PM)

### Enhancement 1: Enhanced Agent Guide
**File:** `api/server.py` (lines 424-549)  
**Changes:**
- Add `discovery_journey` section (5 steps)
- Add `query_capabilities` section (what works where)
- Add `terminal_safety` section (pagination, Select-Object tricks)
- Add `common_mistakes` section (7 antipatterns)
- Add `examples` section (before/after patterns)

**Impact:** Agents learn terminal safety, query limitations, common pitfalls

### Enhancement 2: Schema Introspection
**New File:** `api/routers/introspection.py`  
**Endpoints:**
```
GET /model/schemas/{layer}     → Return schema/*.json content
GET /model/{layer}/example     → Return first real object
GET /model/{layer}/fields      → Return field name array
GET /model/{layer}/count       → Fast count without data transfer
```

**Implementation:**
- Read from `schema/` directory on disk
- Use existing store.get_all() for examples/count
- Cache schema files (immutable)

### Enhancement 3: Universal Query Support
**File:** `api/routers/base_layer.py` (modify list_objects function)  
**Changes:**
- Add `**query_params` to extract all query parameters
- Filter results server-side when query params provided
- Support operators: `=`, `.gt`, `.lt`, `.contains`, `.in`
- Add pagination: `?limit=N&offset=M`
- Return warning if unsupported field queried

**Example:**
```
GET /model/projects/?maturity=active    → Filter server-side
GET /model/projects/?limit=10&offset=0  → Paginate
GET /model/evidence/?validation.test_result=FAIL  → Nested field query
```

### Enhancement 4: Helpful Error Messages
**File:** `api/routers/base_layer.py`  
**Changes:**
- When query param used on unknown field:
  - Return 200 with warning in response
  - Include `_query_warning` field
  - Suggest valid fields
- Include example query in warning

**Example Response:**
```json
{
  "_query_warning": {
    "message": "Query parameter 'foo' not recognized on projects layer",
    "valid_fields": ["id", "label", "maturity", "phase", "status"],
    "example": "GET /model/projects/?maturity=active"
  },
  "data": [...]
}
```

### Enhancement 5: Aggregation Endpoints
**New File:** `api/routers/aggregation.py`  
**Endpoints:**
```
GET /model/evidence/aggregate
  ?sprint_id=X&group_by=phase&metrics=count,avg:coverage_percent

GET /model/sprints/{id}/metrics
  → Aggregated evidence metrics for sprint

GET /model/projects/{id}/metrics/trend
  → Multi-sprint trend data
```

**Implementation:**
- Query evidence layer from store
- Calculate aggregations (count, avg, sum, min, max)
- Group by specified field
- Return structured metrics

---

## DO (6:00-7:30 PM)

### Implementation Order
1. Enhancement 2: Schema introspection (easiest, no breaking changes)
2. Enhancement 1: Enhanced agent-guide (update existing endpoint)
3. Enhancement 3: Universal query support (modify base_layer)
4. Enhancement 4: Helpful errors (part of #3)
5. Enhancement 5: Aggregation (new router)

### Testing Strategy
- Manual PowerShell tests for each endpoint
- Verify terminal output doesn't scramble
- Test query combinations
- Verify cache invalidation still works

---

## CHECK (7:30-7:45 PM)

### Test Cases
1. **Schema Introspection**
   - `GET /model/schemas/projects` returns valid JSON schema
   - `GET /model/projects/example` returns one real project
   - `GET /model/projects/fields` returns field array
   - `GET /model/projects/count` returns fast count

2. **Universal Query**
   - `GET /model/projects/?maturity=active` filters correctly
   - `GET /model/projects/?limit=10` returns 10 objects
   - `GET /model/projects/?foo=bar` returns warning
   - `GET /model/evidence/?sprint_id=ACA-S11&phase=D3` combines filters

3. **Aggregation**
   - `GET /model/evidence/aggregate?sprint_id=ACA-S11&group_by=phase`
   - `GET /model/sprints/51-ACA-sprint-11/metrics`
   - `GET /model/projects/51-ACA/metrics/trend`

4. **Terminal Safety**
   - Large responses don't scramble terminal
   - Pagination works correctly
   - Count endpoint is fast

---

## ACT (7:45-8:00 PM)

### Documentation Updates
- [ ] Update STATUS.md with session 26 summary
- [ ] Create evidence record for this feature
- [ ] Update PLAN.md with new capabilities
- [ ] Create changelog entry

### Evidence Record
```json
{
  "id": "37-S9-F37-12-001-D3",
  "sprint_id": "37-S9",
  "story_id": "F37-12-001",
  "story_title": "Agent Experience Enhancements (All 5)",
  "phase": "D3",
  "created_at": "2026-03-05T17:37:00-05:00",
  "validation": {
    "test_result": "PASS",
    "lint_result": "SKIP"
  },
  "artifacts": [
    {"path": "api/routers/introspection.py", "type": "source", "action": "created"},
    {"path": "api/routers/aggregation.py", "type": "source", "action": "created"},
    {"path": "api/routers/base_layer.py", "type": "source", "action": "modified"},
    {"path": "api/server.py", "type": "source", "action": "modified"}
  ],
  "metrics": {
    "files_changed": 4,
    "lines_added": 450,
    "duration_ms": 7200000
  },
  "context": {
    "tech_stack": "python",
    "enhancements": [
      "Enhanced agent-guide with discovery journey",
      "Schema introspection endpoints",
      "Universal query support with pagination",
      "Helpful error messages",
      "Aggregation endpoints"
    ]
  }
}
```

---

## Success Criteria

- [ ] All 5 enhancements implemented
- [ ] Agent-guide includes discovery journey, terminal safety, examples
- [ ] Schema introspection works for all layers
- [ ] Universal query support with pagination
- [ ] Aggregation endpoints return metrics
- [ ] No terminal scrambling with large datasets
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Evidence recorded

---

## Risks & Mitigations

**Risk 1:** Breaking changes to existing base_layer router  
**Mitigation:** Add query support as optional, maintain backward compatibility

**Risk 2:** Performance impact of server-side filtering  
**Mitigation:** Cache still works, add limit parameter to prevent large scans

**Risk 3:** Schema files not accessible at runtime  
**Mitigation:** Use os.path.join with project root, test in Docker environment

**Risk 4:** Aggregation queries too slow  
**Mitigation:** Start with simple count/avg, optimize later if needed

---

## Timeline

| Time | Phase | Activity |
|------|-------|----------|
| 5:37-5:45 | DISCOVER | Review code, understand architecture |
| 5:45-6:00 | PLAN | Design all 5 enhancements |
| 6:00-6:30 | DO #2 | Implement schema introspection |
| 6:30-6:45 | DO #1 | Enhance agent-guide |
| 6:45-7:15 | DO #3+4 | Universal query + helpful errors |
| 7:15-7:30 | DO #5 | Aggregation endpoints |
| 7:30-7:45 | CHECK | Test all endpoints |
| 7:45-8:00 | ACT | Update docs, create evidence |

**Total Duration:** 2.5 hours (5:37 PM - 8:00 PM ET)

---

## Next Session

- Deploy to cloud (Azure Container Apps)
- Update 39-ado-dashboard to use new aggregation endpoints
- Implement Evidence Polymorphism (tech-stack contexts)
- Create WBS Layer (L26)
