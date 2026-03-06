"""
PHASE 3 - DPDCA EXECUTION ROADMAP

Project: 37-data-model (EVA Data Model API)
Story: F37-11-010 - Infrastructure Optimization
Task 4: Redis Cache Layer
Phase: 3 - Full Integration & Deployment (Discover, Plan, Do, Check, Act)
Status: Ready to Execute
Estimated Duration: 12 hours (distributed across 1-2 days)
"""

# ============================================================================
# PHASE 3 OVERVIEW
# ============================================================================

Phase 3 transforms the completed cache layer into a live, production-ready system.

Goals:
✅ Integrate cache into all 41 data model API layers
✅ Validate 80-95% RU reduction in staging
✅ Deploy to production with gradual rollout
✅ Monitor performance and make go/no-go decisions
✅ Establish live monitoring and alerting

---

# ============================================================================
# DISCOVER PHASE (1 hour)
# ============================================================================

### D1: Current State Inventory

**Existing Routers (Need Caching)**
```
api/layer/
├── projects.py          # 40+ methods
├── evidence.py          # 30+ methods
├── sprints.py           # 25+ methods
├── milestones.py        # 20+ methods
├── workflows.py         # 15+ methods
├── quality_gates.py     # 15+ methods
└── ... (36 layers total)
```

**Current Performance Baseline (from Session 34-35)**
- P50 Latency: 487ms (direct Cosmos)
- P95 Latency: 892ms
- Cosmos RU: 450-520 RU/sec (51% of provisioned 1000)
- Error rate: 0.02%
- Uptime: 99.9%+

**Infrastructure Status**
- ✅ minReplicas=1 (Session 32 fix - operational)
- ✅ App Insights active (Session 33)
- ✅ Redis infrastructure scripts ready (Phase 2)
- ✅ Cache code complete (Phase 2)
- ⏳ Redis instance: NOT YET DEPLOYED
- ⏳ Cache integrated: NOT YET ENABLED

### D2: Gap Analysis

**What's Complete**
✅ Cache module code (2,300 lines)
✅ Test suite (1,150 lines)
✅ Configuration system (CacheConfig, CacheManager)
✅ Adapter patterns (LayerRouterCacheAdapter, CachedLayerRouter)
✅ Integration examples (in docstrings)

**What's Needed**
❌ Actual router wrapper code (for projects, evidence, sprints, etc.)
❌ FastAPI app initialization template
❌ Redis infrastructure deployed
❌ Feature flag system
❌ Monitoring dashboard
❌ Rollout automation

### D3: Risk & Dependencies

**Critical Path**
1. Deploy Redis infrastructure (1 hour)
2. Integrate routers (2 hours)
3. Application startup setup (1 hour)
4. Staging validation (2 hours) ← Gate decision
5. Production gradual rollout (4-8 hours)
6. Live monitoring (ongoing)

**Blockers**
- Redis deployment must complete before testing
- All tests must pass before production
- Rollout decisions depend on staging metrics

**Dependencies**
- Azure subscription access (for Redis & metrics)
- Container App deployment permissions
- GitOps workflow for config updates

---

# ============================================================================
# PLAN PHASE (2 hours)
# ============================================================================

### P1: Integration Strategy

**Approach: Adapter Wrapper Pattern**

Each router gets wrapped non-intrusively:
```python
# Before (direct Cosmos)
projects_router = ProjectsRouter(cosmos_db)

# After (with cache)
cache_adapter = LayerRouterCacheAdapter(cache_layer, invalidation_manager)
projects_router = CachedLayerRouter(
    original_router=ProjectsRouter(cosmos_db),
    adapter=cache_adapter,
    entity_type='projects'
)
```

**Benefits**
- Zero changes to existing router code
- Can enable/disable per router via feature flags
- Automatic invalidation on writes
- Metrics collection built-in

### P2: Staged Deployment Plan

**Stage 1: Infrastructure & Setup (2 hours)**
1. Deploy Redis instance
2. Update Container App secrets
3. Build new application image
4. Run integration tests in staging

**Stage 2: Read-Only Caching (4 hours)**
- Enable cache for GET endpoints
- Monitor cache hit rates
- Validate RU reduction
- Collect metrics

**Stage 3: Write Invalidation (2 hours)**
- Enable cache invalidation on CREATE/UPDATE/DELETE
- Monitor cache consistency
- Validate no stale data

**Stage 4: Production Rollout (4 hours)**
- 10% traffic: 1 replica with cache
- 25% traffic: 2 replicas with cache
- 50% traffic: Half of capacity
- 100% traffic: Full deployment

**Decision Gates**
- After Stage 1 (Infrastructure): Must have healthy Redis connection
- After Stage 2 (Read Cache): Must have ≥60% hit rate, ≤5ms P50 latency
- After Stage 3 (Write Cache): Must have zero consistency issues in 30 min
- After Stage 4 (Rollout): Monitor for 24 hours, validate savings achieved

### P3: Resource Allocation

**Tasks & Owners**
```
Deploy Redis (1h)           → PowerShell/Az CLI
Integrate Routers (2h)      → Code generation
App Startup (1h)            → main.py updates
Staging Tests (2h)          → Integration tests
Monitoring Setup (1h)       → KQL queries
Production Rollout (4h)     → Feature flags + gradual deployment
Live Monitoring (ongoing)   → Dashboard + alerts
```

### P4: Success Criteria

**Integration Complete When:**
- ✅ All 41 layers have cached versions available
- ✅ Cache enable/disable toggles work
- ✅ Feature flags control rollout
- ✅ Application starts without errors
- ✅ Cache initializes successfully

**Staging Validation Passes When:**
- ✅ P50 latency: 487ms → <100ms (5x improvement)
- ✅ Hit rate: >60% in first hour, >75% after 24h
- ✅ RU consumption: <250 RU/sec (75% reduction)
- ✅ Cache consistency: Zero stale data
- ✅ Error rate: <0.01% (no increase from baseline)

**Production Ready When:**
- ✅ All staging gates passed
- ✅ Monitoring dashboards live
- ✅ Rollback procedure tested
- ✅ On-call team briefed

---

# ============================================================================
# DO PHASE (6.5 hours)
# ============================================================================

See: **PHASE-3-DO-INTEGRATION-GUIDE.md** (detailed step-by-step)

### D1: Redis Infrastructure (1 hour)

```bash
# Step 1: Deploy Redis
cd 37-data-model
./scripts/deploy-redis-infrastructure.ps1

# Step 2: Capture credentials
$redis_host = "myredis.redis.cache.windows.net"
$redis_password = (az redis list-keys -g EVA-Sandbox-dev -n myredis --query primaryKey -o tsv)

# Step 3: Update Container App secrets
az containerapp secret set -n msub-eva-data-model \
  --secrets redis_host="$redis_host" \
            redis_password="$redis_password"
```

### D2: Router Integration (2 hours)

```bash
# Step 1: Generate wrapper code
python scripts/generate-cache-wrappers.py

# Step 2: Update main.py
cp example_cache_integration_main.py main.py  # (after review)

# Step 3: Test locally
pytest tests/test_cache_integration.py -v
```

### D3: Application Build & Deploy (1 hour)

```bash
# Step 1: Build new image
docker build -t eva/eva-data-model:20260306-cache .
docker push eva/eva-data-model:20260306-cache

# Step 2: Deploy to staging
az containerapp update -n msub-eva-data-model-staging \
  -g EVA-Sandbox-dev \
  -i eva/eva-data-model:20260306-cache

# Step 3: Verify startup
sleep 30
curl https://staging-msub-eva-data-model.../health/cache
```

### D4: Staging Validation (2 hours)

```bash
# Step 1: Run integration tests
pytest tests/test_cache_integration.py -v --cache-enabled

# Step 2: Run load test (warm cache)
python scripts/load-test-cache.py --duration 300s --concurrency 100

# Step 3: Collect baseline metrics
Get-Content METRICS-STAGING-BASELINE.json | ConvertFrom-Json
```

### D5: Production Preparation (0.5 hours)

```bash
# Step 1: Prepare feature flags
Update configuration:
  CACHE_ENABLED=true (feature flag)
  REDIS_ENABLED=true
  ROLLOUT_PERCENTAGE=10  # Start at 10%

# Step 2: Test rollback
Verify Redis can be disabled without crashes
Verify app gracefully falls back to Cosmos
```

---

# ============================================================================
# CHECK PHASE (2 hours)
# ============================================================================

See: **PHASE-3-CHECK-VALIDATION.md** (detailed procedures)

### C1: Pre-Integration Validation (30 min)

**Checklist**
```
Redis Infrastructure:
  ✅ Connection successful: redis-cli -h $host -p 6380 -a $password ping
  ✅ TLS working: Port 6380 responds to SSL connections
  ✅ Persistence: Can store and retrieve test data
  ✅ Eviction policy: allkeys-lru configured

Cache Module:
  ✅ Import successful: python -c "from api.cache import CacheLayer"
  ✅ Unit tests pass: pytest tests/test_cache_layer.py -v
  ✅ All 50+ tests pass: pytest tests/test_cache*.py --tb=short
  ✅ Type checking: mypy api/cache/ --strict
```

### C2: Integration Validation (1 hour)

**Staging Tests**
```
Application Startup:
  ✅ App starts without errors
  ✅ Cache initializes successfully
  ✅ Redis connection established
  ✅ No startup delays (>500ms)

Basic Operations:
  ✅ GET project returns data (either from cache or Cosmos)
  ✅ LIST returns complete data sets
  ✅ CREATE triggers cache invalidation
  ✅ UPDATE cache reflects changes
  ✅ DELETE removes from cache

Metrics Collection:
  ✅ Cache hit/miss ratio tracked
  ✅ Latency measured per tier (L1, L2, L3)
  ✅ RU consumption monitored
  ✅ Invalidation events logged
```

### C3: Performance Validation (30 min)

**Staging Load Test (100 concurrent requests, 5 minute duration)**
```
Expected Results:
  ✅ P50 Latency: <150ms (from 487ms baseline)
  ✅ P95 Latency: <300ms (from 892ms baseline)
  ✅ Cache hit rate: >60%
  ✅ RU consumed: <250/sec (from 450-520 baseline)
  ✅ Error rate: <0.01%
  ✅ Max queue depth: <5 requests

Decision Gate:
  🟢 PASS: If all metrics within tolerance
  🔴 FAIL: If any metric outside tolerance → Investigate & fix
```

### C4: Data Consistency Validation (30 min)

**Validations**
```
Write-Through Cache:
  ✅ Update project → Cache invalidated ✓
  ✅ Delete evidence → Related caches cleared ✓
  ✅ Create sprint → List cache refreshed ✓

Cascading Invalidation:
  ✅ Evidence change → Project cache purged ✓
  ✅ Milestone update → Sprint cache cleared ✓

TTL Correctness:
  ✅ L1 items expire after 2 minutes
  ✅ L2 items expire after 30 minutes
  ✅ No stale data after TTL expiration
```

---

# ============================================================================
# ACT PHASE (1.5 hours)
# ============================================================================

See: **PHASE-3-ACT-DEPLOYMENT.md** (monitoring & rollout automation)

### A1: Monitoring Dashboard Setup (30 min)

**Application Insights Queries**
```kusto
// Real-time cache hit rate
customMetrics
| where name == "cache_hit_rate"
| project timestamp, value
| render timechart

// P95 Latency over time
customMetrics
| where name == "api_latency_p95"
| project timestamp, value

// RU consumption reduction
customMetrics
| where name == "cosmos_ru_consumed"
| project timestamp, value
```

**Dashboard Widgets**
- Cache hit rate (target: >65%)
- Latency percentiles (P50, P95, P99)
- RU consumption (target: <250/sec)
- Error rate (target: <0.01%)
- Redis memory usage (target: <50MB)

### A2: Rollout Execution (1 hour)

**Stage 1: 10% Traffic (15 min)**
```
Action:
  ROLLOUT_PERCENTAGE=10
  Deploy 1 replica with cache enabled

Monitor:
  Hit rate trend (should reach 50%+)
  Latency improvement (should see 3-5x)
  Error rate stability (should be <0.01%)
  RU reduction (should be 40%+)

Decision:
  ✅ PASS: Proceed to 25%
  ⏸️ HOLD: Investigate, keep at 10%
  🔴 ABORT: Disable cache, troubleshoot
```

**Stage 2: 25% Traffic (20 min)**
```
Action:
  ROLLOUT_PERCENTAGE=25
  Deploy 2-3 replicas with cache enabled

Monitor:
  Hit rate reaching 60%+ (cache warming)
  Latency stable at 80-120ms
  Error rate stable (<0.01%)
  RU at 60% reduction (220/sec)

Decision:
  ✅ PASS: Proceed to 50%
  ⏸️ HOLD: Wait for cache warming
  🔴 ABORT: Rollback to 10%
```

**Stage 3: 50% Traffic (15 min)**
```
Action:
  ROLLOUT_PERCENTAGE=50
  Deploy to half of capacity

Monitor:
  All metrics stable
  Hit rate 70%+ (near steady state)
  RU at 70%+ reduction (140/sec)
  No resource congestion

Decision:
  ✅ PASS: Proceed to 100%
  ⏸️ HOLD: Extend 50% window
  🔴 ABORT: Rollback to 25%
```

**Stage 4: 100% Traffic (10 min)**
```
Action:
  ROLLOUT_PERCENTAGE=100
  Full production deployment

Monitor:
  All metrics stable at target
  Hit rate 75-85% (steady state)
  RU at 80-95% reduction (50-100/sec)
  No incidents

Decision:
  ✅ SUCCESS: Full production deployment complete
  🔔 ALERT: Set monitoring for next 24h
  📊 COLLECT: Metrics for final report
```

### A3: Post-Launch Monitoring (24 hours)

**Hourly Checks**
```
✅ Cache hit rate: Maintain >70%
✅ P50 Latency: Stay <150ms
✅ Error rate: Stay <0.01%
✅ RU/sec: Stay <250 RU
✅ Redis memory: Stay <100MB
✅ No alert storms
```

**Daily Report** (24 hours post-launch)
```
Metric           Baseline    Now         Improvement
─────────────────────────────────────────────────────
P50 Latency      487ms       45ms        10.8x ✅
P95 Latency      892ms       150ms       5.9x ✅
RU/sec           470         95          80% savings ✅
Hit rate         0%          78%         ✅
Error rate       0.02%       0.01%       ✅
Cost/month       ~$2,800     ~$600       78% savings ✅
```

---

# ============================================================================
# DECISION MATRIX
# ============================================================================

### Go/No-Go Decision Points

```
┌─ DISCOVER GATE ─────────────────────────────────┐
│ Decision: Proceed to PLAN?                      │
│ ✅ YES if: Current state understood, no blockers │
│ ⏸️ HOLD if: Missing information, dependencies    │
│ 🔴 NO if: Significant risks identified          │
└─ PLAN GATE ────────────────────────────────────┘
  ↓
┌─ PRE-DEPLOYMENT VALIDATION ─────────────────────┐
│ Redis: Healthy connection ✓                     │
│ Cache code: All tests pass ✓                    │
│ Staging: Ready for deployment ✓                │
│ Team: Briefed and ready ✓                      │
│ Decision: Proceed to DO?                        │
│ ✅ YES if: All 4 checks pass                    │
│ 🔴 NO if: Any check fails → Fix & revalidate   │
└─ INTEGRATION GATE ─────────────────────────────┘
  ↓
┌─ STAGING VALIDATION ────────────────────────────┐
│ P50 Latency: <100ms ✓                          │
│ Hit Rate: >60% ✓                               │
│ RU Reduction: >50% ✓                           │
│ Error Rate: <0.01% ✓                           │
│ Decision: Proceed to PRODUCTION?               │
│ ✅ YES if: All 4 metrics pass tolerance        │
│ 🔴 NO if: Any metric fails → Troubleshoot      │
└─ PRODUCTION GATE ──────────────────────────────┘
  ↓
┌─ ROLLOUT DECISIONS ─────────────────────────────┐
│ After 10%:  Hit rate >40%? RU <400/sec?        │
│             ✅ Proceed to 25%  🔴 STOP          │
│ After 25%:  Hit rate >60%? RU <300/sec?        │
│             ✅ Proceed to 50%  🔴 STOP          │
│ After 50%:  Hit rate >70%? RU <250/sec?        │
│             ✅ Proceed to 100% 🔴 STOP         │
│ After 100%: Hit rate >75%? RU <150/sec?        │
│             ✅ SUCCESS        🔴 ROLLBACK      │
└─────────────────────────────────────────────────┘
```

---

# ============================================================================
# ROLLBACK PROCEDURES
# ============================================================================

### Emergency Rollback (If Issues Detected)

**At Any Stage: Immediate Rollback**
```powershell
# Set to 0% (disable cache, use Cosmos directly)
az containerapp env update -n EVA-Sandbox-dev \
  --set-env-vars ROLLOUT_PERCENTAGE=0

# Verify fallback working
curl https://msub-eva-data-model.../health/cache

# Check error rate stabilizes
# (should return to <0.01% within 2 minutes)
```

**Post-Rollback Actions**
1. Investigate root cause
2. Fix issue in code or configuration
3. Run validation tests again
4. Re-attempt rollout (at 10%)

**Graceful Degradation Modes**
```
Scenario                    Action
─────────────────────────────────────────────────
Redis unavailable          Use L1 (memory) only
Memory cache full          LRU evict oldest entries
Invalidation loop slow     Increase event batch size
High CPU from hashing      Reduce L1 max size
High latency from Redis    Reduce L2 TTL
```

---

# ============================================================================
# TIMELINE & MILESTONES
# ============================================================================

**Day 1: Discover, Plan, Do (4 hours)**
```
09:00-09:30  DISCOVER: Inventory and gap analysis
09:30-11:00  PLAN: Integration strategy and roadmap
11:00-12:00  DO: Redis infrastructure deployment
12:00-13:00  BREAK
13:00-15:00  DO: Router integration and app updates
15:00-15:30  CHECK: Pre-integration validation
```

**Day 2: Continue Do, Check, Act (8 hours)**
```
09:00-11:00  DO: Staging deployment and warmup
11:00-12:00  CHECK: Staging validation tests
12:00-13:00  BREAK
13:00-14:30  ACT: Production rollout 10% → 25%
14:30-15:00  ACT: Production rollout 25% → 50%
15:00-15:30  ACT: Production rollout 50% → 100%
15:30-17:00  CHECK: Post-launch monitoring & reports
```

**Day 3: Ongoing (Minimal intervention)**
```
09:00-17:00  Monitor metrics
             Address any alerts
             Collect data for final report
```

---

# ============================================================================
# SUCCESS CRITERIA
# ============================================================================

**Phase 3 Complete When:**

✅ **Integration Complete**
- All 41 layers have cached versions available
- Application starts successfully
- Cache initializes without errors
- Feature flags working

✅ **Staging Validated**
- P50 latency: 487ms → <150ms (3x improvement minimum)
- Hit rate: >60% after 1 hour, >75% after 24h
- RU reduction: >50% (200+ RU/sec saved)
- Zero data consistency issues in 24h window
- Error rate: <0.01%

✅ **Production Deployed**
- 100% traffic using cache
- All metrics stable at targets
- No alert storms
- Monitoring dashboard live

✅ **Cost Savings Achieved**
- ~80% RU reduction (from 470/sec → ~95/sec)
- ~$300-400/month cost savings
- Performance improvement 5-10x faster

---

# ============================================================================
# SUPPORTING DOCUMENTS
# ============================================================================

See companion files for detailed procedures:

1. **PHASE-3-DO-INTEGRATION-GUIDE.md**
   - Exact commands and code samples
   - Router wrapper templates
   - main.py integration example

2. **PHASE-3-CHECK-VALIDATION.md**
   - Detailed test procedures
   - Health check checklist
   - Validation step-by-step

3. **PHASE-3-ACT-DEPLOYMENT.md**
   - Monitoring dashboard setup
   - Feature flag configuration
   - Rollout automation scripts

4. **MONITORING-KQUERIES.md**
   - KQL queries for KQL queries for Application Insights
   - Dashboard creation steps
   - Alert thresholds

5. **CACHE-LAYER-HEALTH-CHECK.md**
   - Redis health checks
   - Cache consistency validation
   - Performance verification

6. **ROLLOUT-DECISION-MATRIX.md**
   - Go/no-go criteria
   - Metrics thresholds
   - Escalation procedures

---

# ============================================================================
# TEAM RESPONSIBILITIES
# ============================================================================

**Phase 3 Team Assignments**

| Role           | Tasks                        | Hours |
|----------------|------------------------------|-------|
| DevOps         | Redis deployment, Container Apps update | 2 |
| Backend        | Router integration, app startup | 3 |
| QA/Testing     | Integration tests, validation | 2 |
| Monitoring     | Dashboard setup, alert config | 1 |
| Product Owner  | Go/no-go decisions | 0.5 |
| On-call        | 24h post-launch monitoring | 8 |
|                | **TOTAL**                    | **16.5** |

---

# ============================================================================
# RISKS & MITIGATION
# ============================================================================

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Redis deployment fails | Low | High | Automated scripts, fallback to L1-only |
| Cache hit rate <40% | Low | Medium | TTL tuning, cache warming, pre-population |
| Data consistency issues | Low | Critical | Event-driven invalidation, write-through pattern |
| Performance worse with cache | Very Low | High | Immediate rollback, investigation |
| Memory cache fills up | Low | Low | LRU eviction policy, size limits |
| RU savings <50% | Low | Medium | Scale up cache, reduce TTL |

---

End of Phase 3 DPDCA Execution Roadmap
Ready to proceed to DO phase on approval
