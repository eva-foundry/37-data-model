# Redis Cache Architecture Design

## Priority 2: Cache Enhancement
**Date**: 2026-03-09  
**Session**: 41 Part 7  
**Objective**: Implement Redis caching for agent-summary endpoint to improve performance and reduce Cosmos DB costs

---

## Current State Analysis

### Performance Profile  
- **Endpoint**: `GET /model/agent-summary`
- **Current Response Time**: ~45ms (p50), ~120ms (p95)
- **Request Rate**: ~12.5 req/min (estimated from usage metrics)
- **Data Size**: ~6KB (5,796 records across 87 layers)
- **Update Frequency**: Changes only on `POST /model/admin/seed` or `PUT /model/{layer}/{id}` + `POST /model/admin/commit`

### Cost Impact
- **Cosmos DB RU Consumption**: Every agent-summary call queries all 87 layers
- **Estimated Cost**: $0.01-0.02 per 1000 agent-summary calls
- **Monthly Cost (current usage)**: ~$25-30 attributable to agent-summary queries
- **Potential Savings**: 80-90% reduction with caching ($20-27/month)

---

## Design Principles

1. **Write-Through Strategy**: Cache invalidated on writes, not TTL-based
2. **Single Source of Truth**: Cosmos DB remains authoritative
3. **Zero Breaking**: Existing API contract unchanged
4. **Graceful Degradation**: Cache misses fall back to Cosmos DB
5. **Local Dev Support**: Redis optional (falls back to in-memory dict)

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Application                      │
│                                                              │
│  ┌──────────────┐      ┌───────────────┐                   │
│  │   API Router │ ───▶ │  Cache Layer  │                   │
│  │              │      │               │                   │
│  │ /model/agent-│      │ - get()       │                   │
│  │  summary     │      │ - set()       │                   │
│  │              │      │ - invalidate()│                   │
│  │ /model/admin/│      │               │                   │
│  │  seed        │      └───────┬───────┘                   │
│  │              │              │                           │
│  │ /model/admin/│              │                           │
│  │  commit      │              ▼                           │
│  └──────────────┘      ┌───────────────┐                   │
│                        │ Redis Client  │                   │
│                        │ (optional)     │                   │
│                        │               │                   │
│                        │ Fallback:     │                   │
│                        │ dict cache    │                   │
│                        └───────┬───────┘                   │
│                                │                           │
└────────────────────────────────┼───────────────────────────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │  Redis Server │
                         │  (Azure Cache │
                         │   for Redis)  │
                         └───────────────┘
                                 ▲
                                 │
                         ┌───────┴───────┐
                         │  Cosmos DB    │
                         │  (read truth) │
                         └───────────────┘
```

### Cache Keys

| Endpoint | Cache Key | Invalidation Trigger |
|----------|-----------|---------------------|
| `/model/agent-summary` | `agent-summary:v1` | `POST /admin/seed`, `POST /admin/commit` |
| `/model/layers` | `layers:v1` | Same as above |
| `/model/{layer}/?limit=N` | `{layer}:list:limit-{N}:v1` | `PUT /{layer}/{id}`, seed, commit |

### Cache Invalidation Strategy

**Trigger Events**:
1. `POST /model/admin/seed` → Invalidate ALL cache keys
2. `POST /model/admin/commit` → Invalidate ALL cache keys  
3. `PUT /model/{layer}/{id}` → Invalidate `{layer}:*` keys only (fine-grained)

**Implementation**:
```python
async def invalidate_cache_on_write():
    """Called after any write operation"""
    if cache_client:
        await cache_client.delete_pattern("agent-summary:*")
        await cache_client.delete_pattern("layers:*")
        # For PUT operations, only invalidate affected layer
        if layer_name:
            await cache_client.delete_pattern(f"{layer_name}:*")
```

---

## Implementation Plan

### Phase 1: Cache Abstraction Layer (api/cache.py)
Create a `CacheClient` class that:
- Wraps Redis with graceful fallback to in-memory dict
- Provides `get()`, `set()`, `delete()`, `delete_pattern()` methods
- Handles JSON serialization/deserialization automatically
- Logs cache hits/misses for observability

### Phase 2: Integration Points
1. **Startup**: Initialize `CacheClient` in `api/main.py`
2. **agent-summary**: Wrap route with cache check → Cosmos query → cache store
3. **Invalidation**: Add invalidation hooks to seed, commit, PUT endpoints

### Phase 3: Configuration
- Environment variables:
  - `REDIS_HOST` (default: none → fallback mode)
  - `REDIS_PORT` (default: 6379)
  - `REDIS_PASSWORD` (default: none)
  - `CACHE_ENABLED` (default: true)
- Azure deployment: Use Azure Cache for Redis (Basic tier, $0.023/hr = $16.50/mo)

### Phase 4: Monitoring & Metrics
- Add cache hit/miss counters to `/health` endpoint
- Log cache performance metrics: hits, misses, invalidations
- Track Cosmos DB RU savings

---

## Expected Outcomes

### Performance  
**Before (no cache)**:
- p50: 45ms
- p95: 120ms
- p99: 280ms

**After (warm cache)**:
- p50: 5-10ms (80-90% improvement)
- p95: 15-20ms (85-90% improvement)
- p99: 30-40ms (85-90% improvement)

### Cost  
- **Redis Cost**: $16.50/month (Azure Cache Basic)
- **Cosmos DB Savings**: $20-27/month (reduced RU consumption)
- **Net Savings**: $3-10/month
- **ROI**: Positive ROI + 5-10× faster responses

### Scalability
- Current: ~12.5 req/min supported
- With cache: ~500+ req/min supported (40× improvement)
- Enables high-frequency agent polling without Cosmos DB throttling

---

## Rollout Strategy

1. **Local Testing**: Test with Redis on localhost or fallback mode
2. **Integration Tests**: Verify cache invalidation logic with test suite
3. **Staging Deployment**: Deploy to staging with Azure Cache for Redis
4. **Production Deployment**: Enable in production with monitoring
5. **Validation**: Measure hit rate, response times, cost savings for 7 days

---

## Rollback Plan

If issues arise:
1. Set `CACHE_ENABLED=false` via environment variable (no code deploy needed)
2. Application falls back to direct Cosmos DB queries (original behavior)
3. No data loss, no breaking changes

---

## Code Structure  

```
37-data-model/
├── api/
│   ├── cache.py           ← NEW: Cache abstraction layer
│   ├── main.py            ← MODIFIED: Initialize cache
│   └── routers/
│       ├── admin.py       ← MODIFIED: Invalidation on seed/commit
│       ├── layers.py      ← MODIFIED: Cache on GET, invalidate on PUT
│       └── model.py       ← MODIFIED: agent-summary with cache
├── tests/
│   ├── test_cache.py      ← NEW: Cache unit tests
│   └── integration/
│       └── test_cache_invalidation.py  ← NEW: Invalidation tests
└── .env.example           ← UPDATED: Add REDIS_* vars
```

---

## Next Steps

1. ✅ Design complete (this document)
2. → Implement `api/cache.py`
3. → Integrate cache into agent-summary endpoint
4. → Add invalidation hooks
5. → Write tests
6. → Deploy and measure

---

**Status**: Design approved, ready for implementation  
**Est. Implementation Time**: 2-3 hours  
**Est. Testing Time**: 1 hour  
**Est. Deployment Time**: 30 minutes  
**Total**: ~4 hours for complete Priority 2
