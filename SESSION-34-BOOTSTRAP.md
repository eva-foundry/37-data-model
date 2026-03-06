# EVA Data Model - Session 34 Bootstrap

**Date:** March 6, 2026  
**Previous Session:** Session 33 (COMPLETE ✅)  
**Next Phase:** Session 34 (Application Insights Configuration)  

---

## Current Project State

### Infrastructure Status (Post-Session 33)
- ✅ **PR #18 Deployed:** 41-layer improvements live in production (revision 0000008)
- ✅ **minReplicas=1:** Cold start bug fixed (5-10s → ~500ms)
- ✅ **Application Insights:** Workspace deployed (`ai-eva-data-model-20260306`)
- ✅ **API Health:** Responding < 500ms, 41 layers operational, 1,218 objects
- ✅ **Uptime:** 24x7 availability with always-on replica

### Key Metrics (Live)
- **Container App:** `msub-eva-data-model` revision 0000008
- **API Endpoint:** `https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io`
- **Response Time:** < 500ms P50
- **Layers:** 41 total (L0-L41, includes Session 28 automation layers L33-L35, L36-L38)
- **Data Objects:** 1,218 objects across all layers
- **Evidence:** 120 evidence objects tracked

### Story F37-11-010 Progress
| Task | Status | Session | Notes |
|------|--------|---------|-------|
| 1 | ✅ COMPLETE | 32 | minReplicas=1 deployed |
| 2 | ✅ COMPLETE | 33 | App Insights workspace active |
| 3 | ⏳ QUEUED | 34 | Configure dashboards & alerts (THIS SESSION) |
| 4 | ⏳ QUEUED | Q2 2026 | Redis cache (conditional, depends on RU metrics) |

---

## Session 34 Objectives

### PRIMARY: Configure Application Insights Monitoring (Task 3)

**Deliverables:**
1. ✅ P50/P95/P99 latency dashboard
2. ✅ Error rate & exception tracking alerts
3. ✅ Cosmos RU consumption monitoring
4. ✅ Dependency health checks
5. ✅ Alert rules (response time, errors, RU threshold)

**Success Criteria:**
- Dashboard created and accessible
- At least 3 alert rules configured
- Baseline metrics collected (24-48 hours)
- Decision point ready for Task 4 (Redis cache)

### SECONDARY: Establish Monitoring Baseline

**Data Collection (24-48 hours):**
- P50/P95/P99 latency trends
- Daily request volume
- Error rate patterns
- Cosmos RU consumption
- Cache hit rates (memory cache)

**Output:**
- Baseline metrics documented in `SESSION-34-COMPLETION-SUMMARY.md`
- Decision data for Task 4 (Redis cache trigger: RU > 80%)
- Updated PLAN.md with Task 3 completion

---

## Quick Start Commands

### Verify Infrastructure Health
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

# Test health endpoint
Invoke-RestMethod "$base/health" -TimeoutSec 10

# Get layer summary
$summary = Invoke-RestMethod "$base/model/agent-summary" -TimeoutSec 10
$summary.layers | ConvertTo-Json

# Test specific endpoint (L33)
Invoke-RestMethod "$base/model/agent_policies/" -TimeoutSec 10
```

### Application Insights Access
```powershell
# Check workspace exists
az monitor app-insights component show `
  --app ai-eva-data-model-20260306 `
  --resource-group EVA-Sandbox-dev

# Get instrumentation key (if needed)
az monitor app-insights component show `
  --app ai-eva-data-model-20260306 `
  --resource-group EVA-Sandbox-dev `
  --query "instrumentationKey" -o tsv
```

### Container App Status
```powershell
# View scaling configuration
az containerapp show `
  --name msub-eva-data-model `
  --resource-group EVA-Sandbox-dev `
  --query "properties.template.scale"

# View current revision
az containerapp revision list `
  --name msub-eva-data-model `
  --resource-group EVA-Sandbox-dev `
  --query "[0].{name:name, active:active, created:createdTime}"
```

---

## Session 34 Implementation Plan

### Step 1: Connect App Insights to Container App (if not already linked)
```powershell
# Option A: Via Azure Portal Dashboard
# 1. Navigate to: msub-eva-data-model Container App
# 2. Settings → Monitoring → Enable Application Insights
# 3. Select: ai-eva-data-model-20260306
# 4. Save

# Option B: Via Azure CLI
az containerapp update `
  --name msub-eva-data-model `
  --resource-group EVA-Sandbox-dev `
  --set "properties.template.containers[0].env[?name=='APPINSIGHTS_INSTRUMENTATION_KEY'].value=575ab6a4-3e72-4624-8ce4-fcc5421d3a93"
```

### Step 2: Create Monitoring Dashboards
1. Open Application Insights: ai-eva-data-model-20260306 (Azure Portal)
2. Create workbook for API metrics:
   - Response time (P50, P95, P99)
   - Request rate
   - Error rate
   - Dependency health
3. Pin to dashboard

### Step 3: Configure Alert Rules
- **Rule 1:** Response time > 1000ms (P95)
- **Rule 2:** Error rate > 1% (5-minute window)
- **Rule 3:** Cosmos RU > 80% of provisioned limit
- **Rule 4:** Availability < 99.9% (daily)

### Step 4: Collect Baseline Metrics
- Run for 24-48 hours
- Document all metrics in `SESSION-34-COMPLETION-SUMMARY.md`
- Create recommendations for Task 4 (Redis cache)

### Step 5: Decision Point
- ✅ If Cosmos RU < 80%: Continue with current stack, no cache needed
- ⚠️ If Cosmos RU 80-90%: Plan Redis cache for Q2 2026
- 🚨 If Cosmos RU > 90%: Implement Redis cache immediately (escalate)

---

## Files to Update (Session 34)

### PLAN.md
- [ ] Update Story F37-11-010 Task 3 from "NOT STARTED" to "IN PROGRESS - Session 34"
- [ ] Update Task 4 (Redis cache) decision criteria based on RU metrics
- [ ] Add timestamps for Session 34 work

### STATUS.md
- [ ] Add "Session 34 SUMMARY" section
- [ ] Document dashboard creation
- [ ] Log baseline metrics collected
- [ ] Note decision point for Task 4

### Create New
- [ ] `SESSION-34-COMPLETION-SUMMARY.md`: Comprehensive metrics, decision data, next steps

---

## Potential Issues & Troubleshooting

### Issue: App Insights not connecting to Container App
**Solution:**
1. Manually add instrumentation key via Azure Portal
2. Or: Use `az containerapp update` command (see Step 1 above)
3. Restart Container App after linking
4. Wait 5-10 minutes for data to appear

### Issue: No telemetry data appearing in App Insights
**Check:**
1. Container App is actually sending data (requires SDK integration in FastAPI)
2. Instrumentation key is correct
3. Container App has been running > 5 minutes since restart
4. Check Application Insights logs for ingestion errors

### Issue: High latency spikes during baseline collection
**Investigation:**
1. Check if related to Cosmos RU throttling
2. Review error logs for specific endpoint patterns
3. Check cache hit rates (should improve over time)
4. Correlate with Container App scaling events

---

## Success Indicators

✅ **Monitoring Operational:**
- Dashboard shows > 4 hours of data
- No missing metrics or errors in telemetry
- Alerts have been triggered and resolved at least once (test)
- Baseline metrics show consistent < 500ms P50

✅ **Decision Ready:**
- Cosmos RU metrics clearly show sustained trend
- Recommendation documented for Task 4
- Clear trigger threshold identified for Redis cache
- Cost-benefit analysis complete

✅ **Documentation Complete:**
- All metrics logged in SESSION-34-COMPLETION-SUMMARY.md
- PLAN.md and STATUS.md updated with Task 3 completion
- Lessons learned documented
- Next session prerequisites clear

---

## Reference Materials

### Deployed Infrastructure
- **Bicep Template:** `scripts/deploy-containerapp-optimize.bicep`
- **Orchestration Script:** `scripts/optimize-datamodel-infra.ps1`
- **Quick Fix Script:** `scripts/quick-fix-minreplicas.ps1`
- **Session 32 Guide:** `INFRASTRUCTURE-OPTIMIZATION-SESSION-32.md`

### Documentation
- **PLAN.md:** Current feature roadmap (Story F37-11-010)
- **STATUS.md:** Session history and metrics
- **README.md:** Project overview and infrastructure section
- **SESSION-33-COMPLETION-SUMMARY.md:** Previous session summary

### Key Endpoints (Live)
- Health: `/health`
- Agent Guide: `/model/agent-guide`
- Projects: `/model/projects/`
- Agent Policies (L33): `/model/agent_policies/`
- Quality Gates (L34): `/model/quality_gates/`
- GitHub Rules (L35): `/model/github_rules/`

---

## Next Steps (After Session 34)

### Immediate (Session 35+)
1. Evaluate Redis cache need based on Cosmos RU baseline
2. If RU < 80%: Continue normal operations, recheck in Q2 2026
3. If RU 80-90%: Schedule Task 4 implementation
4. If RU > 90%: Escalate, implement Task 4 immediately

### Future (Q2 2026+)
1. **Task 4:** Implement Redis cache layer (if Cosmos RU justifies)
2. **Cost Analysis:** Evaluate cache infrastructure cost vs Cosmos RU savings
3. **Performance Testing:** Validate 80-95% RU reduction post-cache
4. **Documentation:** Update architecture guide with caching strategy

### Ongoing (All Sessions)
1. Monitor alert thresholds
2. Keep Application Insights dashboard live
3. Collect weekly RU trends
4. Plan capacity increments if needed

---

## Bootstrap Checklist (For Any Session)

- [ ] Verify API health: `$base/health` responds < 500ms
- [ ] Check layer count: `GET /model/agent-summary` returns 41 layers
- [ ] Test critical endpoint: `GET /model/projects/37-data-model`
- [ ] Confirm minReplicas: `az containerapp show` shows minReplicas=1
- [ ] Check App Insights: Workspace exists and has recent telemetry

---

**Status:** ✅ Ready for Session 34 (Dashboard Configuration)  
**Blocking Issues:** None  
**Dependencies:** Application Insights workspace deployed (Session 33 ✅)  
**Estimated Duration:** 30-40 minutes live work + 48 hours for baseline collection
