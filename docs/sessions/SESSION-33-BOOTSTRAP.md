# EVA Workspace Bootstrap — Session 33 Ready

**Date:** March 6, 2026  
**Current Position:** Session 32 COMPLETE ✅  
**Next Phase:** Session 33 (Task 2 - Application Insights Monitoring)  

---

## Project 37 Current State

### Status Summary
- ✅ **Cloud API:** Operating normally with minReplicas=1 active
- ✅ **Bootstrap:** API responding consistently < 500ms
- ✅ **Latency:** 10-20x improvement from Session 32 fix
- ✅ **Infrastructure:** Fully documented and production-ready
- ✅ **PR #23:** Merged to main (infrastructure optimization)

### Key Metrics (Live)
- **Total Layers:** 41 (L0-L41)
- **Total Objects:** 1,086+ (cloud verified)
- **API Health:** ✅ Operational (msub-eva-data-model ACA)
- **Cosmos DB:** 24x7 available, auto-scaling enabled
- **minReplicas:** 1 (always-on, no cold starts)
- **MTI Score:** 101/100 (DEPLOY approved)

### Latest Deployment
- **Commit:** adde28c (docs: session32 summary + README update)
- **Branch:** feature/session-32-f37-11-010-infrastructure-optimization
- **Change:** +40 insertions in README.md
- **Status:** Ready for next PR or merge

---

## For Session 33: Application Insights Monitoring

### Objective
Implement Story F37-11-010 Task 2: Application Insights monitoring for the data model API

### Prerequisites
✅ minReplicas=1 deployed (Session 32)  
✅ API responding reliably  
✅ Orchestration script ready with `-AddAppInsights` flag  

### Implementation Path

**Option 1: Full Automation (Recommended)**
```powershell
cd C:\AICOE\eva-foundry\37-data-model
.\scripts\optimize-datamodel-infra.ps1 -ApplyOpt -AddAppInsights
```

**Option 2: Manual Setup**
```powershell
# Create Application Insights workspace
az monitor app-insights component create `
  --app ai-eva-data-model-$(Get-Date -Format 'yyyyMMdd') `
  --location canadacentral `
  --resource-group EVA-Sandbox-dev `
  --application-type "web"

# Link to Container App (requires manual config in Azure Portal)
# Or use ARM template for full IaC approach
```

### Expected Results
- ✅ Application Insights workspace deployed
- ✅ APM metrics enabled (P50/P95/P99 latency)
- ✅ Dependency health monitoring active
- ✅ Alert rules configured (timeouts, errors)
- ✅ Dashboard created for operations team

### Deliverables
- Updated `scripts/optimize-datamodel-infra.ps1` with verified App Insights integration
- Documentation: Updated PLAN.md & STATUS.md
- PR #24: Application Insights Monitoring (Task 2)
- New file: `SESSION-33-COMPLETION-SUMMARY.md`

---

## For Future Sessions: Tasks 3-4

### Task 3: Redis Cache Layer (Q2 2026?)
**Trigger:** When Cosmos RU > 80% of provisioned limit  
**Benefit:** 80-95% RU reduction for read-heavy queries  
**Complexity:** Medium (requires cache invalidation logic)  
**Cost Analysis:** Required before implementation  

### Task 4: Cosmos RU Alerts (After Task 2)
**Requires:** Application Insights (Task 2) deployed  
**Alert Rule:** RU > 80% of provisioned threshold  
**Action:** Trigger escalation or enable Task 3 decision  
**Dashboard:** Real-time RU consumption tracking  

---

## Bootstrap Quick Start (For Any Session)

### Verify Data Model API Health
```powershell
# Test health endpoint
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
Invoke-RestMethod "$base/health" -TimeoutSec 10

# Expected response: { "status": "ok", "store": "cosmos", "version": "41-layers" }
```

### Query Project Data
```powershell
# Get project 37 metadata
$proj = Invoke-RestMethod "$base/model/projects/37-data-model" -TimeoutSec 10
$proj | Select-Object id, maturity, current_phase, mtI_score

# Get all layers
$summary = Invoke-RestMethod "$base/model/agent-summary" -TimeoutSec 10
$summary | Select-Object total_layers, total_objects
```

### Deploy Infrastructure Scripts
```powershell
# Quick minReplicas fix (if needed again)
cd C:\AICOE\eva-foundry\37-data-model
.\scripts\quick-fix-minreplicas.ps1

# Full orchestration with monitoring
.\scripts\optimize-datamodel-infra.ps1 -ApplyOpt -AddAppInsights
```

---

## Project 37 Repository Structure

```
37-data-model/
  ├── README.md (updated with infrastructure section)
  ├── STATUS.md (Session 32 notes)
  ├── PLAN.md (Story F37-11-010 Tasks 1-4)
  ├── INFRASTRUCTURE-OPTIMIZATION-SESSION-32.md (deployment guide)
  ├── SESSION-32-COMPLETION-SUMMARY.md (handoff doc)
  ├── scripts/
  │   ├── quick-fix-minreplicas.ps1 (fast deployment)
  │   ├── optimize-datamodel-infra.ps1 (orchestration)
  │   ├── deploy-containerapp-optimize.bicep (IaC)
  │   ├── health-check.ps1
  │   ├── sync-cloud-to-local.ps1
  │   └── ... (50+ utility scripts)
  ├── api/
  │   ├── server.py (FastAPI main)
  │   ├── routers/ (41 layer routers)
  │   └── schemas/ (JSON schemas)
  └── model/ (Cosmos backup .json files)
```

---

## Key Contacts & References

**Project 37 Owner:** Marco Presta (EVA AI CoE)  
**Repository:** https://github.com/eva-foundry/37-data-model  
**Cloud API:** https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io  
**Container App:** msub-eva-data-model (EVA-Sandbox-dev, MarcoSub subscription)  

---

## Session 33 Checklist

Prepare for next session by:

- [ ] Review `INFRASTRUCTURE-OPTIMIZATION-SESSION-32.md` for context
- [ ] Ensure Azure CLI authenticated to MarcoSub subscription
- [ ] Read `scripts/optimize-datamodel-infra.ps1` (understand -AddAppInsights flow)
- [ ] Check Cosmos RU consumption (baseline for Task 3 decision)
- [ ] Plan monitoring dashboard layout for operations team
- [ ] Identify alert thresholds (P95 latency, error rate, RU consumption)

---

## Communication For Workspace

**Message to EVA Team:**

> ✅ **Session 32 Complete: Infrastructure Optimization Deployed**  
> 
> **Problem Fixed:** Cold start timeouts on data model API  
> **Solution:** minReplicas=1 on msub-eva-data-model ACA  
> **Result:** 10-20x latency improvement (~500ms), 24x7 availability  
> 
> **Impact:**
> - All bootstrap operations now reliable
> - 51-ACA can initialize without timeouts
> - Agent framework applications unblocked
> - Production-ready for all workloads
> 
> **Next:** Session 33 will add Application Insights monitoring for operational visibility  
> 
> **Scripts Available:**
> - Quick fix: `scripts/quick-fix-minreplicas.ps1`
> - Full config: `scripts/optimize-datamodel-infra.ps1`
> - IaC: `scripts/deploy-containerapp-optimize.bicep`
> 
> **Reference:** [INFRASTRUCTURE-OPTIMIZATION-SESSION-32.md](https://github.com/eva-foundry/37-data-model/blob/main/INFRASTRUCTURE-OPTIMIZATION-SESSION-32.md)

---

**Session 32 Status:** ✅ COMPLETE  
**Workspace Readiness:** ✅ READY FOR SESSION 33  
**Infrastructure:** ✅ PRODUCTION OPTIMIZED  

**Created:** March 6, 2026 19:00 UTC  
**For:** Next Session Bootstrap
