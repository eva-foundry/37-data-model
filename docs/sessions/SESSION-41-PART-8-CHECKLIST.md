# Session 41 Part 8 - Quick Checklist

**Status**: Ready for Execution  
**Prerequisites**: PR #47 merged, production deployed

---

## Pre-Execution Checklist

- [ ] PR #47 merged to main
- [ ] Production deployment completed (revision updated)
- [ ] API responding (https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/health)
- [ ] PowerShell scripts ready (deploy-session-41-part-8.ps1, test-endpoints.ps1)

---

## Execution Checklist

### Phase 1: Pre-Flight (5 min)
- [ ] API health check passes
- [ ] Current state captured (operational layers, total records)
- [ ] New endpoints exist (cascade-check, references, validate?enhanced)

### Phase 2: Priority 1 Seed (10 min)
- [ ] Before state documented
- [ ] POST /admin/seed executed successfully
- [ ] After state verified:
  - [ ] service_health_metrics: 5 records
  - [ ] resource_inventory: 6 records
  - [ ] usage_metrics: 4 records
  - [ ] cost_allocation: 5 records
  - [ ] infrastructure_events: 5 records
  - [ ] traces: 1 record
- [ ] Operational layers: 87/87 ✅
- [ ] Total records: 5,843+ ✅

### Phase 3: Priority 3 Testing (15 min)
- [ ] cascade-check endpoint tested (2 cases)
- [ ] references endpoint tested (2 cases)
- [ ] validate?enhanced endpoint tested (2 cases)
- [ ] All responses match expected schemas
- [ ] FK relationships correctly identified (9 total)

### Phase 4: Performance Baseline (10 min - Optional)
- [ ] agent-summary latency measured (10 samples)
- [ ] Average and p95 documented
- [ ] Baseline recorded for future Redis comparison

### Phase 5: Documentation (15 min)
- [ ] STATUS.md updated with results
- [ ] Session 41 Part 8 completion report created
- [ ] PDCA document marked complete
- [ ] Documentation committed to git

---

## Validation Checklist

### Functional Requirements
- [ ] ✅ 100% operational layer coverage (87/87)
- [ ] ✅ Priority 1 data seeded (26 records)
- [ ] ✅ FK validation endpoints operational (3 new)
- [ ] ✅ Redis infrastructure deployed (feature flag: disabled)

### Non-Functional Requirements
- [ ] ✅ Zero breaking changes (backward compatible)
- [ ] ✅ No 500 errors in logs
- [ ] ✅ API response time acceptable (<200ms p95)
- [ ] ✅ All tests passing

### Quality Gates
- [ ] ✅ All JSON files valid
- [ ] ✅ All imports resolved (simple_cache namespace fix)
- [ ] ✅ Documentation complete
- [ ] ✅ Code reviewed (PR #47)

---

## Success Metrics

| Metric | Before | After | Target | Status |
|--------|--------|-------|--------|--------|
| Operational Layers | 81/87 | 87/87 | 87/87 | ⏳ |
| Total Records | 5,817 | 5,843 | 5,843 | ⏳ |
| FK Relationships | 7 | 9 | 9 | ✅ |
| Admin Endpoints | 6 | 9 | 9 | ✅ |
| Cache Infrastructure | ❌ | ✅ | ✅ | ✅ |

---

## Issues & Resolutions

### Issue 1: Namespace Conflict ✅ RESOLVED
- **Problem**: api/cache.py vs api/cache/ directory collision
- **Resolution**: Renamed to api/simple_cache.py, updated imports
- **Commit**: 2c0b089

### Issue 2: Priority 1 Data Not Seeded ⏳ PENDING
- **Problem**: Files in git but 0 records in production
- **Resolution**: Execute POST /admin/seed after PR merge
- **Status**: Blocked until deployment

### Issue 3: Redis Deployment 🟡 DEFERRED
- **Decision**: Defer to future session (RU at 51%)
- **Rationale**: Validate Priority 1 & 3 first
- **Next Steps**: Enable with CACHE_ENABLED=true when approved

---

## Rollback Plan

**If Seed Fails**:
1. Check error message
2. Validate JSON: `python -m json.tool model/{layer}.json`
3. Fix and re-seed (idempotent)

**If Endpoints Fail**:
1. Check logs for stack traces
2. Test validation functions locally
3. Create hotfix PR if needed

**If Performance Degrades**:
1. Check Redis connection (should fallback to memory)
2. Monitor RU consumption
3. Disable cache if critical: CACHE_ENABLED=false

---

## Quick Commands

### Check Status
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
Invoke-RestMethod "$base/model/agent-summary"
```

### Execute Deployment
```powershell
.\deploy-session-41-part-8.ps1
```

### Test Endpoints
```powershell
.\test-endpoints.ps1
```

### Measure Performance
```powershell
$times = 1..10 | % { (Measure-Command { Invoke-RestMethod "$base/model/agent-summary" | Out-Null }).TotalMilliseconds }
($times | Measure-Object -Average).Average
```

---

## Next Phase (After Completion)

1. **Redis Deployment** (Session 42+)
   - Trigger: RU >80% OR user request
   - Effort: 1-2 hours
   - Cost: $16.50/month

2. **Cache Migration** (Optional)
   - Migrate simple_cache.py → api/cache/ (Redis Task 4)
   - Effort: 3-4 hours
   - Benefits: Multi-tier, adapter pattern, event-driven

3. **Infrastructure Dashboard** (Optional)
   - Visualize Priority 1 data
   - Effort: 4-6 hours

---

**Document Status**: Ready  
**Estimated Time**: 40-55 minutes  
**Risk Level**: Low
