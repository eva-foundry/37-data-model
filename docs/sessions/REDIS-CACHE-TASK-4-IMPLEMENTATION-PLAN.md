# Story F37-11-010 Task 4: Redis Cache Implementation Plan

**Status:** ⏳ READY FOR IMPLEMENTATION  
**Decision Point:** Sessions 34-35 complete (RU at 51%, below 80% threshold)  
**Strategic Decision:** PROCEED NOW (proactive scaling, prepare for growth)  
**Estimated Duration:** 8-12 hours development + testing  

---

## Executive Summary

**Decision:** Move forward with Redis implementation for data model API caching layer

**Business Case:**
- Current Cosmos RU: 51% utilization (450-520 RU/sec avg)
- Opportunity: 80-95% RU reduction potential with Redis cache
- Cost impact: ~$150/month Redis cache vs future $500/month to scale Cosmos
- Strategic benefit: Prepare architecture for 10x growth without Cosmos scaling

**Rationale:** 
Even though we're below the 80% trigger threshold, the proactive investment in Redis:
1. Prevents future fire-fighting when RU hits 80%
2. Enables rapid growth without database scaling friction
3. Provides cache layer architecture for multi-tenant patterns
4. Reduces latency for read-heavy workloads (estimated P50: 500ms → 50-100ms)

---

## Architecture Overview

### Current Stack (Pre-Redis)
```
FastAPI Server
    ↓
Memory Cache (67% hit rate)
    ↓
Cosmos DB (51% RU utilization)
    ├─ Containers: 41 collections
    └─ Throughput: 1000 RU/sec provisioned
```

### Target Stack (Post-Redis)
```
FastAPI Server
    ↓
L1 Cache: Memory Cache (hot set, ~2min TTL)
    ↓
L2 Cache: Redis (warm set, ~30min TTL)
    ↓
L3 Store: Cosmos DB (cold set, no cache)
    ├─ Containers: 41 collections
    └─ Throughput: 1000 RU/sec provisioned (optimized by Redis)
```

### Cache Strategy
- **L1 (Memory):** In-process cache for hot objects (2-minute TTL)
- **L2 (Redis):** Distributed cache for warm layer (30-minute TTL)
- **L3 (Cosmos):** Source of truth (no cache bypass)

### Benefits
- **Latency:** 500ms → 50-100ms P50 (5-10x improvement)
- **RU Savings:** 450-520 RU/sec → 50-60 RU/sec (8-9x reduction)
- **Cost Savings:** ~$350/month ongoing once implemented
- **Scalability:** Supports 10x growth without Cosmos changes

---

## Implementation Phases

### Phase 1: Infrastructure Setup (2 hours)
✅ **Objective:** Deploy Redis instance in Azure
- Create Azure Cache for Redis (Standard tier, 1GB)
- Configure VNet integration with Container App  
- Enable SSL/TLS for transit encryption
- Document connection string & auth key

**Deliverables:**
- Redis instance deployed
- Bicep/ARM template for IaC
- Connection parameters documented

### Phase 2: Adapter Layer (3 hours)
✅ **Objective:** Build cache abstraction layer
- Create `CacheLayer` class (in-process + Redis fallthrough)
- Implement TTL policies (L1: 2min, L2: 30min)
- Add cache invalidation logic
- Implement fallthrough on cache miss

**Deliverables:**
- `api/cache/layer.py` (cache abstraction)
- `api/cache/redis_client.py` (Redis ops)
- TTL configuration schema
- Cache key naming conventions

### Phase 3: Integration (2 hours)
✅ **Objective:** Wire cache into data model API
- Integrate cache layer into router handlers
- Add cache invalidation on write operations
- Implement cache warming for high-frequency queries
- Add metrics/monitoring for cache hit rates

**Deliverables:**
- Cache integration into 41 layer routers
- Write-through cache invalidation
- Cache warmup logic
- Updated Application Insights for cache metrics

### Phase 4: Testing & Validation (3 hours)
✅ **Objective:** Verify performance improvements & correctness
- Unit tests: Cache layer functionality
- Integration tests: End-to-end from API to Cosmos
- Performance tests: Latency & RU reduction
- Load tests: Cache hit rate under 10x load projection

**Deliverables:**
- Test suite (80%+ coverage)
- Performance benchmarks (before/after)
- Validation report (RU reduction, latency gain)

### Phase 5: Deployment & Monitoring (2 hours)
✅ **Objective:** Deploy to production & verify
- Blue-green deployment (optional: feature flag for rollback)
- Monitor cache hit rates in production
- Validate Cosmos RU reduction (target: 80-95% savings)
- Document lessons learned

**Deliverables:**
- Deployment scripts
- Monitoring dashboards (cache metrics)
- Runbook for cache troubleshooting
- Post-deployment metrics report

---

## Technical Specification

### Redis Configuration

**Instance Details:**
- **Service:** Azure Cache for Redis
- **Tier:** Standard (1GB, 6 connections, 1 Gbps throughput)
- **SKU:** C1 (1GB, sufficient for 30-min TTL, warm layer)
- **Eviction Policy:** `allkeys-lru` (LRU when memory limit reached)
- **VNet Integration:** Subnet within EVA-Sandbox-dev
- **SSL/TLS:** Enabled (port 6380)
- **Authentication:** Managed identity (Azure AD)

**Connection Pattern:**
```python
# Connection string format
redis_url = f"rediss://{managed_identity}@{redis_host}:6380/0?ssl_cert_reqs=required"

# Backup: Direct auth key (fallback pattern)
redis_url = f"rediss://:{auth_key}@{redis_host}:6380/0?ssl=true"
```

### Cache Layer Design

**Class Hierarchy:**
```python
CacheLayer:
  ├─ MemoryCache (in-process, TTL=2min)
  ├─ RedisCache (distributed, TTL=30min)
  └─ CosmosStore (source of truth, no cache)

Operations:
  • get(key): Check memory → Redis → Cosmos
  • set(key, value, ttl): Write to memory + Redis
  • delete(key): Remove from memory + Redis
  • invalidate_pattern(pattern): Wildcard remove
  • stats(): Cache hit rates, eviction count
```

**TTL Strategy:**
```
Layer 1 (Memory):  2 minutes  - Hot objects actively used
Layer 2 (Redis):   30 minutes - Warm objects recently accessed
Layer 3 (Cosmos):  ∞ seconds  - Cold objects, source of truth

Cache Invalidation:
  • Write ops: Invalidate immediately (memory + Redis)
  • Bulk ops: Async invalidation pattern
  • TTL expiry: Automatic eviction per TTL
```

### Integration Points

**Update Layer Routers (41 layers):**
```python
@router.get("/model/{layer_name}/")
async def list_layer(layer_name: str, cache: CacheLayer):
    cache_key = f"layer:{layer_name}:all"
    
    # Try cache first (L1 → L2 → L3)
    cached = await cache.get(cache_key)
    if cached:
        return cached
        
    # Miss: Query Cosmos
    data = await cosmos.query(f"SELECT * FROM c WHERE c.layer = '{layer_name}'")
    
    # Populate cache for next request
    await cache.set(cache_key, data, ttl=30*60)
    
    return data
```

**Write Invalidation:**
```python
@router.post("/model/{layer_name}/")
async def create_item(layer_name: str, item: dict, cache: CacheLayer):
    # Write to Cosmos
    result = await cosmos.create_item(item)
    
    # Invalidate related caches
    await cache.invalidate_pattern(f"layer:{layer_name}:*")
    
    return result
```

---

## Metrics & Success Criteria

### Performance Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| P50 Latency | 500ms | 50-100ms | < 150ms |
| P95 Latency | 892ms | 200-400ms | < 500ms |
| P99 Latency | 1,240ms | 400-800ms | < 1000ms |
| Throughput | 120 req/sec | 1,000+ req/sec | > 500 req/sec |

### Cache Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| L1 Hit Rate | > 60% | In-process cache |
| L2 Hit Rate | > 40% | Redis layer |
| Combined Hit Rate | > 80% | Cosmos queries avoided |
| Eviction Rate | < 5% | Memory pressure indicator |
| Cache Staleness | < 1% | TTL-based freshness |

### RU Reduction

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Avg RU/sec | 450-520 | 50-60 | 8-9x (89-90%) |
| Peak RU/sec | 1000 | 150-200 | 5-7x (80-85%) |
| Monthly cost | $500 | ~$200 | $300/month savings |

### Availability

| Metric | Target | Notes |
|--------|--------|-------|
| Uptime | 99.99% | Cosmos maintains SLA |
| Cache Reliability | 99.9% | Redis occasional failures acceptable |
| Fallthrough | Automatic | Cache miss → Cosmos read |

---

## Dependencies & Prerequisites

### Infrastructure Requirements
- ✅ Azure subscription (MarcoSub)
- ✅ Resource group (EVA-Sandbox-dev)
- ✅ VNet integration available
- ✅ Managed identity for auth

### Software Requirements
- ✅ Python 3.10+ (already deployed)
- ✅ FastAPI framework (already in use)
- ✅ Redis-py client library
- ✅ Async Redis client support

### Operational Requirements
- ✅ Container App fully operational
- ✅ Cosmos DB stable at 51% RU
- ✅ Application Insights monitoring active
- ✅ Deployment scripts & Bicep templates ready

### Team Readiness
- ✅ Infrastructure scripts available (quick-fix, orchestration patterns)
- ✅ DPDCA process established
- ✅ Testing framework in place
- ✅ Documentation standards clear

**All prerequisites satisfied. Ready for implementation.**

---

## Risk Assessment & Mitigation

### Risk 1: Cache Invalidation Bugs
**impact:** Serving stale data to agents  
**Mitigation:**
- Comprehensive invalidation tests
- Event-driven invalidation pattern
- TTL as safety net (30-minute max staleness)
- Comparison queries (cache vs Cosmos) in tests

### Risk 2: Redis Availability
**Impact:** Cache layer down, fallthrough takes longer  
**Mitigation:**
- Redis in Premium tier (99.9% SLA)
- Automatic fallthrough to Cosmos
- Circuit breaker pattern
- Monitoring alerts on Redis failures

### Risk 3: Performance Degradation
**Impact:** Cache hits slower than expected  
**Mitigation:**
- Load testing before production
- Gradual rollout (feature flag option)
- Performance benchmarks at each phase
- Rollback plan prepared

### Risk 4: RU Reduction Below Expectations
**Impact:** Cost savings not realized  
**Mitigation:**
- Query analysis to identify cacheable patterns
- Cache warming for high-frequency queries
- TTL tuning based on query patterns
- Reassess after 2-week monitoring window

**Overall Risk Level:** LOW (mature Redis patterns, comprehensive fallthrough)

---

## Implementation Timeline

| Phase | Duration | Start | End | Owner |
|-------|----------|-------|-----|-------|
| Infrastructure | 2 hours | Session 35 | Session 35 | DevOps |
| Adapter Layer | 3 hours | Session 35 | Session 36 | Backend |
| Integration | 2 hours | Session 36 | Session 36 | Backend |
| Testing | 3 hours | Session 36 | Session 36 | QA |
| Deployment | 2 hours | Session 36 | Session 36 | DevOps |
| **Total** | **12 hours** | **Session 35** | **Session 36** | **Team** |

**Estimated Completion:** 2 sessions (same day possible if resources available)

---

## Deployment Strategy

### Approach: Gradual Rollout

**Step 1: Feature Flag (Production-safe)**
- Deploy Redis & cache layer with feature flag disabled
- Cache code in production, not active yet
- Monitor Redis health for 24 hours
- No impact to production traffic

**Step 2: Canary Release**
- Enable cache for 10% of requests
- Monitor for cache hits, misses, errors
- Validate RU reduction in 10% subset
- Compare latency improvement

**Step 3: Gradual Ramp**
- 10% → 25% → 50% → 100% over 4 hours
- Monitor metrics at each step
- Auto-rollback if hit rate < 70% or errors spike
- 1-hour observation at each level

**Step 4: Full Production**
- 100% traffic through cache layer
- Cosmos RU should drop 80-95%
- Monitor for 24-48 hours post-deployment
- Measure actual cost savings

### Rollback Plan

**If issues detected:**
```bash
# Option 1: Feature flag disable (immediate, < 1 second)
./scripts/disable-cache-layer.ps1

# Option 2: Deploy previous version (revert to Session 33)
git revert <commit-hash>
az containerapp update -n msub-eva-data-model -g EVA-Sandbox-dev --image <previous-image>

# Option 3: Scale down Redis (if Redis is problem)
az redis delete --name ai-eva-redis --resource-group EVA-Sandbox-dev
```

---

## Supporting Deliverables

### Code Structure
```
37-data-model/
  api/
    cache/
      ├─ __init__.py
      ├─ layer.py           # Main CacheLayer class
      ├─ memory_cache.py    # L1 in-process cache
      ├─ redis_client.py    # L2 Redis operations
      └─ invalidation.py    # Invalidation patterns
  
  scripts/
    ├─ deploy-redis-infrastructure.bicep   # Redis deployment IaC
    ├─ setup-redis-cache.ps1              # Redis setup & config
    ├─ enable-cache-layer-feature.ps1     # Feature flag toggle
    └─ test-cache-performance.py          # Performance validation
  
  tests/
    ├─ test_cache_layer.py
    ├─ test_redis_operations.py
    ├─ test_cache_invalidation.py
    └─ test_performance_benchmarks.py
  
  docs/
    └─ REDIS-CACHE-ARCHITECTURE.md
```

### Documentation
- REDIS-CACHE-ARCHITECTURE.md (detailed design)
- API cache behavior documentation
- Troubleshooting guide
- Monitoring guide for cache metrics

### Monitoring
- Cache hit/miss rates dashboard in App Insights
- RU consumption trend (before/after comparison)
- Latency improvement metrics
- Redis health indicators

---

## Next Steps

### Immediate (Session 35)
- [ ] Review & approve implementation plan
- [ ] Create Bicep template for Redis infrastructure
- [ ] Draft PowerShell deployment script
- [ ] Set up feature flag configuration

### Session 35-36
- [ ] Deploy Redis infrastructure
- [ ] Implement cache layer classes
- [ ] Integrate with all 41 layer routers
- [ ] Write comprehensive test suite
- [ ] Prepare gradual rollout

### Post-Deployment
- [ ] Monitor cache metrics for 48 hours
- [ ] Validate RU reduction (target: 80-95%)
- [ ] Document final metrics & lessons learned
- [ ] Update Story F37-11-010 Task 4 → COMPLETE

---

## References

### Design Patterns Used
- **Cache-Aside Pattern:** Check cache, fallthrough to source on miss
- **Circuit Breaker:** Prevent cascading failures on Redis issues
- **TTL-Based Expiration:** Automatic staleness management
- **Invalidation Pattern:** Event-driven immediate invalidation

### Best Practices Applied
- Layered caching (memory + Redis + Cosmos)
- Async/await for non-blocking operations
- Metrics-driven decision making
- Gradual rollout strategy
- Comprehensive test coverage

### External References
- [Redis: Azure Cache for Redis Documentation](https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/)
- [Cosmos DB: RU Optimization](https://docs.microsoft.com/en-us/azure/cosmos-db/optimize-cost-reads-writes)
- [Cache-Aside Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)

---

**Status:** ✅ Ready for implementation approval  
**Blocking Issues:** NONE  
**Dependencies:** All satisfied  
**Risk Level:** LOW  
**Estimated Success Probability:** 95%+  
