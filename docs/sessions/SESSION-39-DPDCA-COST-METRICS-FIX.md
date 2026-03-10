# Session 39 - Cost & Metrics Fixes (DPDCA Cycle)

**Date**: March 8, 2026  
**Status**: Fixes Implemented - Ready for Testing  
**Focus**: L49 (Costs) and L41 (Metrics) Sync Failures

---

## DISCOVER - Root Causes Identified ✅

### L49 (Cost Sync) Failure
- **Error**: `'costmanagement' is misspelled or not recognized by the system`
- **Root Cause**: `az costmanagement query` CLI command doesn't exist / has compatibility issues
- **Impact**: Cannot query Azure Cost Management via CLI

### L41 (Metrics Sync) Failure  
- **Error**: `az monitor app-insights query` CLI compatibility issues
- **Root Cause**: Azure CLI command availability varies by environment/version
- **Impact**: Cannot query Application Insights telemetry  

### Common Problem
- Both scripts depend on Azure CLI commands that have version/environment variability
- Extensions not always available in CI/CD runners
- CLI commands less reliable than direct REST API calls

---

## PLAN - Solution Architecture ✅

**Strategy**: Replace Azure CLI calls with direct REST API calls

### L49 (sync-azure-costs.ps1)
```
OLD: az costmanagement query --type Usage ...
NEW: POST https://management.azure.com/subscriptions/{id}/providers/Microsoft.CostManagement/query
```
- Uses Cost Management REST API (2021-10-01)
- Eliminates dependency on `az costmanagement` command
- Bearer token authentication via `az account get-access-token`

### L41 (update-agent-metrics-from-appinsights.ps1)
```
OLD: az monitor app-insights query --analytics-query ...
NEW: POST https://api.applicationinsights.io/v1/apps/{appId}/query
```
- Uses Application Insights Analytics REST API
- Queries via public API endpoint (not management.azure.com)
- KQL queries same, just delivery mechanism changed

### Workflow Changes
- Remove `az extension add --name costmanagement`
- Remove `az extension add --name application-insights`
- Both jobs now "just work" without extension installation

---

## DO - Implementation Completed ✅

### Files Modified

**1. sync-azure-costs.ps1**
- `Get-AzureCostData()`: Replaced CLI call with REST API (POST to Cost Management API)
- `Get-BudgetInfo()`: Replaced CLI call with REST API (GET to Consumption API)
- Added token retrieval: `az account get-access-token`
- Added proper HTTP headers and error handling

**2. update-agent-metrics-from-appinsights.ps1**
- `Get-AppInsightsId()`: Replaced CLI call with REST API (GET resource via management.azure.com)
- `Invoke-AppInsightsQuery()`: Replaced CLI with Analytics REST API (POST to api.applicationinsights.io)
- Updated main execution to handle new return type from `Get-AppInsightsId()`

**3. infrastructure-monitoring-sync.yml**
- Removed `az extension add --name costmanagement` step from sync-costs job
- Removed `az extension add --name application-insights` step from sync-agent-metrics job
- Kept `azure/login@v2` (still needed for bearer token)

### Code Quality
- All functions maintain same parameter signatures
- Error handling improved (REST API status codes vs. CLI exit codes)
- Logging messages updated to reflect API-based approach
- Non-blocking error handling for budget info (non-critical)

---

## CHECK - Testing Requirements ⏳

### Pre-Deployment Verification (Local)
```powershell
# Test L49 with dry-run
cd C:\eva-foundry\37-data-model\scripts
.\sync-azure-costs.ps1 -DryRun

# Test L41 with dry-run  
.\update-agent-metrics-from-appinsights.ps1 -DryRun -LookbackHours 24
```

### Post-Deployment Validation (GitHub Actions)
1. **Manual trigger workflow** with `sync_target=all` and `dry_run=false`
2. **Monitor all 3 jobs**:
   - sync-infrastructure (should still work)
   - sync-costs (NEW: using REST API)
   - sync-agent-metrics (NEW: using REST API)
3. **Validate endpoints**:
   ```
   # L42
   curl "...data-model/model/azure_infrastructure/?limit=1&sort=-last_synced"
   
   # L49 (current month)
   $month = Get-Date -Format "yyyy-MM"
   curl "...data-model/model/resource_costs/c59ee575-eb2a-4b51-a865-4b618f9add0a-$month"
   
   # L41
   curl "...data-model/model/agent_performance_metrics/?limit=2"
   ```

---

## ACT - Deployment Steps 🚀

### 1. Push Changes to GitHub
```bash
cd C:\eva-foundry\37-data-model
git status  # Verify staged files
git commit -m "Fix: Replace Azure CLI commands with REST APIs for L41 and L49 syncs"
git push origin main  # (requires PR if branch protection enabled)
```

### 2. Create Pull Request (if protected branch)
- Title: "Fix: Replace Azure CLI commands with REST APIs"
- Description: References this document
- Assigns reviewers if needed
- Merges to main

### 3. Trigger Manual Workflow Run
```
https://github.com/eva-foundry/37-data-model/actions
- Select: "EVA Infrastructure Monitoring - Scheduled Data Sync"
- Click: "Run workflow"
- sync_target: "all"
- dry_run: false (after previous success with dry_run: true)
```

### 4. Monitor Workflow Execution
- Expected duration: ~2-3 minutes total
- L42: 30-40 seconds
- L49: 60-80 seconds (includes API depth)
- L41: 20-30 seconds
- Summary: 5-10 seconds

### 5. Validate Data Population
- Check timestamps in L42, L49, L41
- Verify record counts increased or updated
- Review logs for any warnings/errors

---

## Expected Outcomes ✅

### Before Fix
```
L42: ✅ SUCCESS (32 resources, last: 10:06 AM ET)
L49: ❌ FAILED ('costmanagement' not recognized)
L41: ❌ FAILED (app-insights query issues)
```

### After Fix
```
L42: ✅ SUCCESS (updated timestamps)
L49: ✅ SUCCESS (cost record for 2026-03)
L41: ✅ SUCCESS (agent metrics if telemetry exists)
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| REST API auth failures | Token obtained fresh each sync; proper error messages |
| API rate limits | Low volume queries; no concurrent requests |
| Network timeouts | 10-second timeout on REST calls; retry logic possible |
| Data format changes | Same schema applied post-API call |
| Loss of CLI flexibility | REST APIs more standardized and reliable |

---

## Success Criteria

- [x] All Azure CLI commands replaced with REST API equivalents
- [x] Workflow extension installation steps removed
- [x] Error handling maintains or improves robustness
- [ ] L49 sync completes without errors (pending test)
- [ ] L41 sync completes without errors (pending test)
- [ ] L42 continues to work (should not be affected)
- [ ] All 3 layers have updated timestamps post-run

---

## Files Changed

- `scripts/sync-azure-costs.ps1` - REST API implementation
- `scripts/update-agent-metrics-from-appinsights.ps1` - REST API implementation
- `.github/workflows/infrastructure-monitoring-sync.yml` - Removed extension steps

**Commit Hash**: (Pending push)  
**Branch**: main  
**Related Issues**: Session 39 L41/L49 sync failures

---

## Next Steps

1. **Push** these changes to GitHub
2. **Test** with workflow manual trigger  
3. **Monitor** all three jobs for success
4. **Validate** data in all three layers
5. **Document** results in Session 39 completion summary

---

**Session 39**: All infrastructure monitoring automation - DPDCA cycle for failures
**Status**: Ready for final push and testing
