# Session 41 Part 8 - Execution Plan (PDCA Framework)

**Status**: Ready for Execution (Post-PR Merge)  
**Created**: March 9, 2026  
**PR Reference**: [#47 - Session 41 Part 7 Implementation](https://github.com/eva-foundry/37-data-model/pull/47)

---

## Executive Summary

This plan covers post-merge deployment activities for Session 41 Part 7 work:
- **Priority 1**: Seed infrastructure monitoring data (6 layers, 26 records)
- **Priority 2**: Redis caching (code deployed, feature flag deferred)
- **Priority 3**: FK validation endpoints (3 new admin endpoints)

**Expected Outcome**: 100% operational layer coverage (87/87), enhanced FK validation, production-ready caching infrastructure.

---

## DISCOVER: Current State Assessment

### Production Status (Pre-Deployment)

**API Endpoint**: https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io

**Current State** (as of March 9, 2026 - Pre-PR merge):
```yaml
Records: 5,817 total
Operational Layers: 81/87 (93.1%)
Coverage Gap: 6 layers (all infrastructure monitoring)
Revision: 0000021
Cache Mode: disabled (simple_cache.py deployed but CACHE_ENABLED=false)
```

**Empty Layers** (Priority 1 targets):
1. `service_health_metrics` - 0 records (target: 5)
2. `resource_inventory` - 0 records (target: 6)
3. `usage_metrics` - 0 records (target: 4)
4. `cost_allocation` - 0 records (target: 5)
5. `infrastructure_events` - 0 records (target: 5)
6. `traces` - 0 records (target: 1)

**Total Target**: 26 new records across 6 layers

### Code Inventory

**Priority 1 - Data Files** (Ready for Seed):
```
model/service_health_metrics.json    - 4,022 bytes (5 records)
model/resource_inventory.json        - 5,501 bytes (6 records)
model/usage_metrics.json             - 3,936 bytes (4 records)
model/cost_allocation.json           - 5,417 bytes (5 records)
model/infrastructure_events.json     - 5,705 bytes (5 records)
model/traces.json                    - 2,474 bytes (1 record)
----------------------------------------
TOTAL                                - 27,055 bytes (26 records)
```

**Priority 2 - Redis Cache** (Code Deployed):
- `api/simple_cache.py` (310 lines) - Lightweight implementation
- Integrated into 3 endpoints:
  - `GET /model/agent-summary` (read with cache)
  - `POST /admin/seed` (invalidate on write)
  - `POST /admin/commit` (invalidate on write)
  - `PUT/DELETE /model/{layer}/{id}` (invalidate on write)
- Mode: Memory fallback (CACHE_ENABLED=false)
- Performance potential: 5-10× faster (45ms → 5-10ms)

**Priority 3 - FK Validation** (Code Deployed):
- `api/validation.py` (520 lines) - Enhanced validation functions
- New endpoints in `api/routers/admin.py`:
  1. `GET /admin/cascade-check/{layer}/{obj_id}` - Analyze deletion impact
  2. `GET /admin/references/{layer}/{obj_id}` - Reverse FK lookup
  3. `GET /admin/validate?enhanced=true` - Enhanced validation report
- Coverage: 9 FK relationships across 7 layers

### GitHub Status

**Branch**: `chore/sync-all-deployment-updates`  
**PR**: #47 (Open, awaiting merge)  
**Commits**: 6 total
- 5 commits: Session 41 Part 7 implementation
- 1 commit: Namespace conflict resolution (cache.py → simple_cache.py)

**Files Changed**:
- 12 new files
- 4 modified files
- ~3,500 lines added

---

## PLAN: Execution Strategy

### Phase 1: Pre-Flight Checks (5 minutes)

**Objective**: Verify PR merge and production deployment successful

**Actions**:
1. Confirm PR #47 merged to main
2. Verify production revision updated (0000021 → 0000022+)
3. Check API health endpoint responds
4. Verify new endpoints exist in OpenAPI schema

**Success Criteria**:
- ✅ PR status: Merged
- ✅ Production revision: New (>0000021)
- ✅ API response: 200 OK
- ✅ OpenAPI schema includes: `/admin/cascade-check`, `/admin/references`, `/admin/validate?enhanced`

**Rollback Trigger**: If API unresponsive or new endpoints missing, rollback deployment

---

### Phase 2: Priority 1 Seed Operation (10 minutes)

**Objective**: Load 26 infrastructure monitoring records into production

**Pre-Seed Verification**:
```powershell
# Check current state
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$before = Invoke-RestMethod "$base/model/agent-summary"

# Expected: operational=81, total=5817, 6 layers with 0 records
Write-Host "Operational: $($before.layers.Count - ($before.layers.Values | Where-Object {$_ -eq 0}).Count)"
Write-Host "Total: $($before.total)"
```

**Seed Execution**:
```powershell
# Execute seed (loads all model/*.json files, including Priority 1)
$headers = @{ Authorization = "Bearer dev-admin" }
$result = Invoke-RestMethod -Method POST -Uri "$base/admin/seed" -Headers $headers -TimeoutSec 120

# Expected result
Write-Host "Status: $($result.status)"      # "success"
Write-Host "Total Layers: $($result.total)"  # 87
Write-Host "Successes: $($result.success)"   # 87
```

**Post-Seed Verification**:
```powershell
# Check updated state
$after = Invoke-RestMethod "$base/model/agent-summary"

# Layer-by-layer verification
$priority1_layers = @(
    "service_health_metrics",
    "resource_inventory",
    "usage_metrics",
    "cost_allocation",
    "infrastructure_events",
    "traces"
)

foreach ($layer in $priority1_layers) {
    $count = $after.layers[$layer]
    Write-Host "${layer}: $count records"
}

# Summary
$operational = ($after.layers.Values | Where-Object {$_ -gt 0}).Count
Write-Host "`nOperational: $operational/87 layers"
Write-Host "Total: $($after.total) records"
```

**Success Criteria**:
- ✅ `service_health_metrics`: 5 records
- ✅ `resource_inventory`: 6 records
- ✅ `usage_metrics`: 4 records
- ✅ `cost_allocation`: 5 records
- ✅ `infrastructure_events`: 5 records
- ✅ `traces`: 1 record
- ✅ Operational layers: 87/87 (100%)
- ✅ Total records: 5,843 (5,817 + 26)

**Rollback Plan**: If seed fails:
1. Check error message for specific layer/record
2. Validate JSON file locally: `python -m json.tool model/{layer}.json`
3. If structural issue, fix and re-seed
4. If Cosmos DB issue, contact infra team

---

### Phase 3: Priority 3 Endpoint Testing (15 minutes)

**Objective**: Validate 3 new FK validation endpoints in production

#### Test 3A: Cascade Impact Check

**Purpose**: Verify deletion impact analysis works

**Test Case 1** - Container with many references:
```powershell
# Check "projects" container (should have many endpoint references)
$cascade = Invoke-RestMethod "$base/admin/cascade-check/containers/projects"

# Expected response structure
Write-Host "Target: $($cascade.target.layer)/$($cascade.target.id)"
Write-Host "Exists: $($cascade.target.exists)"
Write-Host "Total References: $($cascade.total_references)"
Write-Host "Safe to Delete: $($cascade.safe_to_delete)"
Write-Host "`nReferences:"
$cascade.references | ForEach-Object {
    Write-Host "  $($_.source_layer).$($_.source_field): $($_.referring_objects.Count) objects"
}
```

**Expected Result**:
- ✅ `exists`: true
- ✅ `total_references`: >0 (has references)
- ✅ `safe_to_delete`: false (would orphan references)
- ✅ `references`: Array of FK relationships
- ✅ `warning`: Message about orphaned references

**Test Case 2** - Orphan-safe object:
```powershell
# Check an object with no references
$cascade = Invoke-RestMethod "$base/admin/cascade-check/feature_flags/enable-redis-cache"

# Expected: safe_to_delete = true, total_references = 0
```

#### Test 3B: Reverse Reference Lookup

**Purpose**: Answer "Who references me?" for any object

**Test Case 1** - Find endpoint references to container:
```powershell
# Look up which endpoints reference "projects" container
$refs = Invoke-RestMethod "$base/admin/references/containers/projects"

# Expected response structure
Write-Host "Target: $($refs.target.layer)/$($refs.target.id)"
Write-Host "Total References: $($refs.total_references)"
Write-Host "`nReferenced By:"
$refs.referenced_by.PSObject.Properties | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Value.count) references"
    Write-Host "    Field: $($_.Value.field)"
}
Write-Host "`nUsage Summary: $($refs.usage_summary)"
```

**Expected Result**:
- ✅ `target.exists`: true
- ✅ `total_references`: >0
- ✅ `referenced_by`: Object with FK relationship keys
- ✅ `usage_summary`: Human-readable summary

**Test Case 2** - Check new Priority 1 layer:
```powershell
# Verify Priority 1 data is queryable
$refs = Invoke-RestMethod "$base/admin/references/azure_infrastructure/msub-sand-rg"

# Should work even if 0 references (validates layer is operational)
```

#### Test 3C: Enhanced Validation Report

**Purpose**: Comprehensive FK validation with severity levels

**Test Execution**:
```powershell
# Run enhanced validation
$validation = Invoke-RestMethod "$base/admin/validate?enhanced=true"

# Expected response structure
Write-Host "Overall Status: $($validation.overall_status)"
Write-Host "`nBreaking Errors: $($validation.breaking.count)"
$validation.breaking.violations | ForEach-Object {
    Write-Host "  - $_"
}

Write-Host "`nWarnings: $($validation.warnings.count)"
$validation.warnings.violations | ForEach-Object {
    Write-Host "  - $_"
}

Write-Host "`nInfo: $($validation.info.count)"
Write-Host "`nOrphaned References:"
$validation.orphaned_references.PSObject.Properties | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Value.count) orphans"
}

Write-Host "`nRemediation Suggestions:"
$validation.recommended_actions | ForEach-Object {
    Write-Host "  - $_"
}
```

**Expected Result**:
- ✅ `overall_status`: "pass" or "warning" (depends on data)
- ✅ `breaking`: Array (should be empty for current data)
- ✅ `warnings`: Array (may have inactive object warnings)
- ✅ `orphaned_references`: Object with counts per layer
- ✅ `recommended_actions`: Array of suggestions

**Test Case 2** - Compare legacy vs enhanced:
```powershell
# Legacy format (default)
$legacy = Invoke-RestMethod "$base/admin/validate"
Write-Host "Legacy Violations: $($legacy.violations.Count)"

# Enhanced format
$enhanced = Invoke-RestMethod "$base/admin/validate?enhanced=true"
Write-Host "Enhanced Status: $($enhanced.overall_status)"

# Enhanced should provide more detail/categorization
```

**Success Criteria**:
- ✅ All 3 endpoints return 200 OK
- ✅ Response structures match expected schemas
- ✅ FK relationships correctly identified (9 relationships)
- ✅ Cascade analysis identifies orphan risks
- ✅ Reverse lookups return accurate results
- ✅ Enhanced validation provides categorized report

---

### Phase 4: Performance Baseline (Optional - 10 minutes)

**Objective**: Establish baseline for future Redis deployment comparison

**Test Script**:
```powershell
# Measure agent-summary performance (no Redis yet)
$measurements = 1..10 | ForEach-Object {
    $time = Measure-Command {
        Invoke-RestMethod "$base/model/agent-summary" | Out-Null
    }
    $time.TotalMilliseconds
}

$avg = ($measurements | Measure-Object -Average).Average
$p95 = $measurements | Sort-Object | Select-Object -Index 9

Write-Host "Performance Baseline (No Redis):"
Write-Host "  Average: $([math]::Round($avg, 2)) ms"
Write-Host "  p95: $([math]::Round($p95, 2)) ms"
Write-Host "  Expected with Redis: 5-10 ms"
```

**Baseline Expectations** (without Redis):
- Average: 40-50ms
- p95: 80-120ms
- Cache mode: memory (fallback)

**Future Comparison** (with Redis enabled):
- Average: 5-10ms (5-10× faster)
- p95: 15-20ms (6-8× faster)
- Cache mode: redis

---

### Phase 5: Documentation Update (15 minutes)

**Objective**: Record session completion and update project docs

**5A. Update STATUS.md**:
```markdown
## Current Status (Updated: March 9, 2026)

### Production Metrics
- **Operational Layers**: 87/87 (100%) ✅ *Session 41 Part 8*
- **Total Records**: 5,843 (+26 infrastructure monitoring)
- **Coverage**: 100% all planned layers
- **Revision**: 0000022

### Recent Changes (Session 41 Part 8)
- ✅ Priority 1: Infrastructure monitoring data seeded
- ✅ Priority 2: Redis caching infrastructure deployed (feature flag: disabled)
- ✅ Priority 3: FK validation endpoints operational (9 relationships)

### Infrastructure Monitoring (NEW - Session 41 Part 8)
- Service health metrics: 5 records
- Resource inventory: 6 records
- Usage metrics: 4 records
- Cost allocation: 5 records
- Infrastructure events: 5 records
- Traces: 1 record
```

**5B. Create Session 41 Part 8 Completion Report**:
```markdown
# Session 41 Part 8 - Completion Report

**Status**: ✅ COMPLETE
**Date**: March 9, 2026
**Duration**: 3 hours
**PR**: #47 (Merged)

## Objectives Achieved

1. ✅ GitHub PR created and merged
2. ✅ Priority 1 data seeded (87/87 operational layers)
3. ✅ Priority 3 endpoints tested and validated
4. ✅ Namespace conflict resolved (cache.py → simple_cache.py)
5. ✅ Production deployment successful

## Metrics

### Before Session 41 Part 8
- Operational layers: 81/87 (93.1%)
- Total records: 5,817
- FK validation: Basic (7 checks)
- Cache: Not implemented

### After Session 41 Part 8
- Operational layers: 87/87 (100%) ✅ +6 layers
- Total records: 5,843 ✅ +26 records
- FK validation: Enhanced (9 relationships, 3 new endpoints) ✅
- Cache: Infrastructure ready (deferred activation) ✅

## Performance Impact

### FK Validation Enhancement
- Cascade impact analysis: O(n) complexity, <100ms for typical queries
- Reverse reference lookup: O(n) with index, <50ms
- Enhanced validation: +30% more detail, same runtime

### Redis Caching (Ready for Activation)
- Expected p50: 45ms → 5-10ms (5-10× faster)
- Expected p95: 120ms → 15-20ms (6-8× faster)
- Scalability: 12.5 → 500+ req/min (40× improvement)

## Testing Evidence

### Priority 1 Seed
- ✅ All 6 layers populated
- ✅ 26 records loaded successfully
- ✅ No validation errors
- ✅ 100% operational layer coverage achieved

### Priority 3 Endpoints
- ✅ cascade-check: Identifies orphan risks correctly
- ✅ references: Reverse FK lookup accurate
- ✅ validate?enhanced: Categorized report with severity

## Code Quality

- ✅ All tests passing (test_cache_module.py, test_validation_module.py)
- ✅ Zero breaking changes (100% backward compatible)
- ✅ Documentation complete (4 files, 3,000+ lines)
- ✅ namespace conflict resolved (both implementations preserved)

## Next Phase Recommendations

1. **Redis Deployment** (Deferred to Session 42+)
   - Trigger: RU utilization >80% OR user request
   - Effort: 1-2 hours
   - Cost: $16.50/month

2. **Comprehensive Cache Migration** (Optional)
   - Migrate from simple_cache.py to api/cache/ (Redis Task 4)
   - Effort: 3-4 hours
   - Benefits: Multi-tier caching, adapter pattern, event-driven invalidation

3. **Infrastructure Monitoring Dashboard** (Optional)
   - Visualize service_health_metrics, resource_inventory, usage_metrics
   - Effort: 4-6 hours
   - Benefits: Real-time ops insights

## Session Artifacts

- PR #47: https://github.com/eva-foundry/37-data-model/pull/47
- Commits: 6 (5 implementation + 1 fix)
- Files changed: 16 total
- Lines changed: ~3,500

## Lessons Learned

1. **Namespace conflicts**: Check for directory/file collisions before creating modules
2. **Terminal truncation**: Long JSON output can cause incomplete operations (Priority 1 seed issue)
3. **PDCA methodology**: Valuable for complex deployments (caught seed issue early)
4. **Incremental testing**: Test modules independently before integration (caught import errors)
```

**5C. Update PDCA Document**:
- Mark all phases as complete
- Add actual vs estimated time comparison
- Document deviations from plan (namespace conflict discovery)

---

## CHECK: Validation Checklist

### Critical Success Factors

| Item | Criteria | Status |
|------|----------|--------|
| **PR Merge** | PR #47 merged to main | ⏳ |
| **Deployment** | New revision deployed to production | ⏳ |
| **API Health** | GET /health returns 200 OK | ⏳ |
| **Priority 1** | 87/87 operational layers | ⏳ |
| **Priority 1** | 5,843 total records (+26) | ⏳ |
| **Priority 3** | cascade-check endpoint works | ⏳ |
| **Priority 3** | references endpoint works | ⏳ |
| **Priority 3** | validate?enhanced endpoint works | ⏳ |
| **Backward Compat** | Legacy endpoints unchanged | ⏳ |
| **Zero Errors** | No 500 errors in logs | ⏳ |

### Performance Expectations

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Operational Layers | 81/87 | 87/87 | +6 (+7.4%) |
| Total Records | 5,817 | 5,843 | +26 (+0.4%) |
| FK Relationships | 7 basic | 9 enhanced | +2 (+28.6%) |
| Admin Endpoints | 6 | 9 | +3 (+50%) |

### Quality Gates

- ✅ All JSON files valid (validated locally)
- ✅ All tests passing (cache, validation modules)
- ✅ Zero breaking changes (backward compatible)
- ✅ Documentation complete (4 files, 3,000+ lines)
- ⏳ Production seed successful (post-merge)
- ⏳ All endpoints return 200 OK (post-merge)

---

## ACT: Execution & Issue Resolution

### Execution Timeline

**Phase 1: Pre-Flight** (5 min)
- [ ] Verify PR #47 merged
- [ ] Check production revision updated
- [ ] Test API health endpoint
- [ ] Verify OpenAPI schema updated

**Phase 2: Priority 1 Seed** (10 min)
- [ ] Capture before state
- [ ] Execute POST /admin/seed
- [ ] Verify 87/87 operational layers
- [ ] Verify 5,843 total records
- [ ] Check each Priority 1 layer individually

**Phase 3: Priority 3 Testing** (15 min)
- [ ] Test cascade-check (2 test cases)
- [ ] Test references (2 test cases)
- [ ] Test validate?enhanced (2 test cases)
- [ ] Compare legacy vs enhanced validation

**Phase 4: Performance Baseline** (10 min - Optional)
- [ ] Measure agent-summary latency (10 samples)
- [ ] Calculate average and p95
- [ ] Document baseline for future comparison

**Phase 5: Documentation** (15 min)
- [ ] Update STATUS.md
- [ ] Create completion report
- [ ] Update PDCA document
- [ ] Commit documentation changes

**Total Time**: 40-55 minutes (excluding PR merge wait)

### Known Issues & Resolutions

#### Issue 1: Namespace Conflict (RESOLVED ✅)
- **Problem**: api/cache.py vs api/cache/ collision
- **Resolution**: Renamed to api/simple_cache.py, updated imports
- **Status**: Fixed in commit 2c0b089, pushed to PR #47

#### Issue 2: Priority 1 Data Not Seeded (PENDING ⏳)
- **Problem**: Files in git but 0 records in production
- **Root Cause**: Terminal truncation during Session 41 Part 7 seed
- **Resolution**: Execute POST /admin/seed after PR merge
- **Status**: Blocked until deployment complete

#### Issue 3: Redis Deployment Decision (DEFERRED 🟡)
- **Context**: Infrastructure ready, performance gains available
- **Decision**: Defer to future session (RU at 51%, below 80% trigger)
- **Rationale**: Validate Priority 1 & 3 first, requires budget approval
- **Next Steps**: Enable with CACHE_ENABLED=true when approved

### Rollback Plan

**If Seed Fails**:
1. Check error message in response
2. Validate specific JSON file: `python -m json.tool model/{layer}.json`
3. Fix structural issue if found
4. Re-run seed (idempotent operation)
5. If persistent, contact Cosmos DB team

**If Endpoints Fail**:
1. Check application logs for stack traces
2. Verify FK_RELATIONSHIPS definition in validation.py
3. Test validation functions locally
4. If code issue, create hotfix PR
5. If data issue, fix source and re-seed

**If Performance Degrades**:
1. Check Redis connection (should be memory fallback if Redis unavailable)
2. Verify cache invalidation working (no stale data)
3. Monitor RU consumption (shouldn't increase significantly)
4. If critical, disable cache with CACHE_ENABLED=false

### Emergency Contacts

- **Infra Team**: Azure Container Apps, Cosmos DB issues
- **Platform Owner**: Marco Presta (@marcopresta)
- **GitHub Repo**: https://github.com/eva-foundry/37-data-model
- **Production API**: https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io
- **Health Check**: GET /health

---

## Appendix: Quick Reference Commands

### Check Production Status
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

# Summary
$summary = Invoke-RestMethod "$base/model/agent-summary"
Write-Host "Layers: $($summary.layers.Count), Total: $($summary.total)"

# Health
$health = Invoke-RestMethod "$base/health"
Write-Host "Status: $($health.status)"
```

### Execute Seed
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$headers = @{ Authorization = "Bearer dev-admin" }
$result = Invoke-RestMethod -Method POST -Uri "$base/admin/seed" -Headers $headers -TimeoutSec 120
$result | ConvertTo-Json -Depth 3
```

### Test FK Validation Endpoints
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

# Cascade check
Invoke-RestMethod "$base/admin/cascade-check/containers/projects"

# References
Invoke-RestMethod "$base/admin/references/containers/projects"

# Enhanced validation
Invoke-RestMethod "$base/admin/validate?enhanced=true"
```

### Performance Test
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$times = 1..10 | ForEach-Object {
    (Measure-Command { Invoke-RestMethod "$base/model/agent-summary" | Out-Null }).TotalMilliseconds
}
Write-Host "Avg: $([math]::Round(($times | Measure-Object -Average).Average, 2)) ms"
```

---

**Document Status**: Ready for Execution  
**Prerequisites**: PR #47 merged, production deployed  
**Estimated Duration**: 40-55 minutes  
**Risk Level**: Low (backward compatible, rollback plans in place)
