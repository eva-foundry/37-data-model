# API 404 Root Cause Analysis — COMPLETE

**Date**: 2026-03-13  
**Session**: 47  
**Status**: ✅ ROOT CAUSE IDENTIFIED

---

## Finding: `/model/query` Endpoint NOT IMPLEMENTED

### Discovery Summary

**Phase 1: DISCOVER Results** ✅ COMPLETE

| Check | Result | Finding |
|-------|--------|---------|
| **Container Logs** | ✅ CLEAN | Application started successfully, no errors |
| **Container Status** | ✅ HEALTHY | `provisioningState: "Succeeded"`, no unhealthy replicas |
| **Uptime** | ✅ 48+ hours | Running since 2026-03-11 20:33:29 UTC |
| **HTTP /health** | ✅ 200 OK | Liveness probe working perfectly |
| **HTTP /docs** | ✅ 200 OK | Swagger UI operational |
| **HTTP /model/query** | ❌ 404 NOT FOUND | **Endpoint NOT IMPLEMENTED** |

### Root Cause

**`/model/query` endpoint is completely missing from the codebase.**

**Evidence**:
```
Searched all files: 37-data-model/api/routers/*.py
Patterns checked:
  - @router.post("/model/query")  → NOT FOUND
  - @router.get("/model/query")   → NOT FOUND
  - "model/query" in code         → NOT FOUND (except docs/plans)

Existing routers reviewed:
  ✅ admin.py         — Has /admin/* endpoints (seed, export, etc.)
  ✅ aggregation.py   — Has /evidence/aggregate (specific queries, not generic)
  ✅ introspection.py — Has /schema-def/{layer}, etc.
  ✅ fp.py            — Fingerprinting endpoints
  ✅ graph.py         — Graph endpoints
  ✅ impact.py        — Impact endpoints
  ❌ NONE have /model/query
```

### Impact

Projects expecting `/model/query` to work:
- 37-data-model (itself — internal queries)
- 59-performance (PLAN.md references it)
- 61-GovOps (PLAN.md references it)
- 19-ai-gov (Paperless governance scripts)
- Multiple workspace scripts + documentation

---

## Fix Strategy

### What `/model/query` Should Do

**Purpose**: Generic layer query endpoint for agents and scripts

**Interface** (from documentation):
```
POST /model/query
Content-Type: application/json

{
  "layer": "project_work",           # Required: which layer
  "filters": {                        # Optional: filter criteria
    "project_id": "61-govops",
    "status": "active"
  },
  "limit": 100,                       # Optional: max results
  "offset": 0                         # Optional: pagination
}

Response (200 OK):
{
  "layer": "project_work",
  "count": 5,
  "results": [...],
  "filters_applied": {...}
}
```

### Approach: Create `/model/query` Router

**File**: `api/routers/query.py` (NEW)

**Function**: Generic query interface for any layer

**Implementation**:
1. Extract `layer` parameter (required)
2. Call `store.query(layer, filters)` helper
3. Apply pagination
4. Return results

**Registration** in `server.py`:
```python
from api.routers.query import router as query_router
# Add to include_router loop
app.include_router(query_router)
```

### Implementation Sketch

```python
# api/routers/query.py
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel

router = APIRouter(prefix="/model", tags=["query"])

class QueryRequest(BaseModel):
    layer: str                             # Required
    filters: dict | None = None            # Optional filter criteria
    limit: int = 100
    offset: int = 0

@router.post("/query")
async def query_layer(
    req: QueryRequest,
    store = Depends(get_store)
) -> dict:
    """
    Generic query interface for any layer.
    
    Supports filtering, pagination, and optional parameters.
    """
    # Validate layer exists
    valid_layers = await store.get_layer_names()  # May need to implement
    if req.layer not in valid_layers:
        raise HTTPException(404, f"Layer not found: {req.layer}")
    
    # Query with filters
    results = await store.query(
        layer=req.layer,
        filters=req.filters or {},
        limit=req.limit,
        offset=req.offset
    )
    
    return {
        "layer": req.layer,
        "count": len(results),
        "results": results,
        "filters_applied": req.filters,
        "pagination": {"limit": req.limit, "offset": req.offset}
    }
```

### Timeline

**Phase 2: PLAN** (Current - 0 min)
- ✅ Root cause identified
- ✅ Fix strategy documented

**Phase 3: DO** (5-10 min)
- [ ] Create `api/routers/query.py`
- [ ] Implement `/model/query` POST endpoint
- [ ] Test locally (if possible)
- [ ] Commit to git
- [ ] Rebuild Docker image
- [ ] Push to ACR
- [ ] Redeploy to Container Apps

**Phase 4: CHECK** (2 min)
- [ ] Test `/model/query` returns 200
- [ ] Test with sample query

**Phase 5: ACT** (3 min)
- [ ] Tag release: `phase-a-b-v1.1-query-endpoint-added`
- [ ] Document fix in INFRASTRUCTURE-TICKET
- [ ] Update SESSION-47-FIX-REPORT.md

**Total**: ~20 min to production

---

## Decision Point

**Option 1: Implement `/model/query` Endpoint** (Recommended)
- **Time**: 20 min
- **Benefit**: Unblocks all paperless governance, enables agent queries
- **Risk**: Low (new endpoint, doesn't change existing code)

**Option 2: Use Layer-Specific Endpoints** (Workaround)
- **Time**: 0 min (immediate)
- **Benefit**: Get paperless registration working now
- **Risk**: Requires scripts to be rewritten, less flexible

**Option 3: Wait for Next Session** (Defer)
- **Time**: N/A
- **Benefit**: More time to plan
- **Risk**: Blocks Phase A+B production deployment

---

## Recommendation

✅ **Proceed with Option 1** (Implement `/model/query`)

**Reasoning**:
1. Documentation promises this endpoint (many places)
2. Only 20 min to implement
3. Low risk (new code doesn't touch existing functionality)
4. Unblocks all paperless governance + seeding
5. Production deployment complete after fix

**Next Action**: Approve Phase 3 (DO) - Implement endpoint

---

## Root Cause Classification

| Aspect | Value |
|--------|-------|
| **Severity** | MEDIUM (blocks production, but not code quality issue) |
| **Root Cause Category** | **MISSING FEATURE** (not a bug in existing code) |
| **Detection Method** | Code audit (endpoint not in routers) |
| **Fix Complexity** | LOW (straightforward endpoint) |
| **Deploy Impact** | CONTAINER RESTART (new image build + push) |
| **Post-Fix Status** | UNBLOCKS FULL OPERATIONAL API |
