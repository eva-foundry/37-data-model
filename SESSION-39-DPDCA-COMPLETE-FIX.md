# Session 39 - Complete DPDCA Fix for L41 & L49 Sync Scripts

**Date**: March 8, 2026  
**Agent**: Comprehensive fix after reactive debugging cycle  
**Methodology**: DPDCA (Discover → Plan → Do → Check → Act)

---

## DISCOVER - Complete Issue Analysis ✅

### Local Testing Results

**L41 (update-agent-metrics-from-appinsights.ps1)**:
- ❌ **Syntax**: Valid
- ❌ **Logic**: FAILING - Missing API version parameter
- **Error**: `MissingApiVersionParameter: The api-version query parameter (?api-version=) is required`
- **Location**: Line 108 in `Get-AppInsightsId()` function
- **Root Cause**: REST API call to management.azure.com missing required `?api-version=` query parameter

**L49 (sync-azure-costs.ps1)**:
- ✅ **Syntax**: Valid  
- ⏳ **Logic**: Testing in progress...

### Issues Found During Session

1. **Initial Issue**: Azure CLI commands (`az costmanagement`, `az monitor app-insights`) not available
2. **Fix Attempt #1**: Switched to REST APIs but added invalid `-AsArray` parameter
3. **Fix Attempt #2**: Removed `-AsArray` but left duplicate/orphaned code in L41
4. **Fix Attempt #3**: Removed duplicate code but missing API version parameter

###Root Problem

**Reactive debugging instead of systematic DPDCA**:
- Found one issue → fixed that issue → deployed
- Didn't test locally first (syntax + logic)
- Didn't test dry-run before production deployment
- Created cascade of half-fixes

---

## PLAN - Comprehensive Solution ✅

### L41 Fixes Required

1. **Add API version to App Insights resource lookup** (Line ~108)
   ```powershell
   # Current (broken):
   $url = "https://management.azure.com/subscriptions/$subscription/resourceGroups/$RG/providers/Microsoft.Insights/components/$Name"
   
   # Fixed:
   $url = "https://management.azure.com/subscriptions/$subscription/resourceGroups/$RG/providers/Microsoft.Insights/components/$Name?api-version=2020-02-02"
   ```

2. **Verify no duplicate code blocks remain**  
3. **Test dry-run locally BEFORE deployment**

### L49 Fixes Required

1. **Test current state** (completing now)
2. **Add API version if needed**  
3. **Test dry-run locally BEFORE deployment**

### Testing Strategy

```powershell
# Phase 1: Syntax validation (PowerShell parser)
[System.Management.Automation.Language.Parser]::ParseFile($scriptPath, [ref]$null, [ref]$null)

# Phase 2: Logic validation (dry-run with real Azure credentials)
.\update-agent-metrics-from-appinsights.ps1 -DryRun -LookbackHours 24
.\sync-azure-costs.ps1 -DryRun

# Phase 3: Production test (after local success)
# - Deploy to GitHub main
# - Trigger workflow with dry_run=true
# - Validate no errors in logs
# - Switch to dry_run=false
```

---

## DO - Implementation Plan 🔧

### Step 1: Fix L41 API Version

**File**: `scripts/update-agent-metrics-from-appinsights.ps1`  
**Function**: `Get-AppInsightsId`  
**Line**: ~100-115

Add `?api-version=2020-02-02` to management.azure.com URL

### Step 2: Test L49 Completion

Wait for dry-run test to complete, verify if API version also needed

### Step 3: Local Testing

Run both scripts with `-DryRun` flag to validate logic

### Step 4: Commit & Deploy

- Single PR with all fixes
- Clear commit message
- Test on GitHub with workflow dry-run
- Deploy to production

---

## CHECK - Validation Checklist ⏳

### Local Tests (Before GitHub Push)
- [ ] L41: PowerShell syntax valid
- [ ] L41: Dry-run completes without errors
- [ ] L49: PowerShell syntax valid  
- [ ] L49: Dry-run completes without errors

### GitHub Tests (After Push)
- [ ] Workflow triggered with dry_run=true
- [ ] L42 sync: SUCCESS (unchanged, should work)
- [ ] L41 sync: SUCCESS (API version fix)
- [ ] L49 sync: SUCCESS (API fix if needed)
- [ ] All jobs green checkmarks

### Data Validation (After Production Run)
- [ ] L42: Updated timestamp
- [ ] L41: Agent metrics populated (if telemetry exists)  
- [ ] L49: Cost data for current month

---

## ACT - Deployment Steps 🚀

1. **Complete L41 fix** (add API version)
2. **Complete L49 assessment** (awaiting test results)
3. **Test both locally** (dry-run)
4. **Create single PR** with all fixes
5. **Merge to main**
6. **Trigger workflow** (dry_run=true first)
7. **Validate** logs show success
8. **Production run** (dry_run=false)
9. **Document** in STATUS.md

---

## Lessons Learned 📚

### Anti-Patterns (What NOT  to Do)
- ❌ Debugging in production (GitHub Actions workflow)
- ❌ Fixing one issue at a time without full discovery
- ❌ Skipping local testing before deployment
- ❌ Not testing with dry-run flags first

### Best Practices (What TO Do)
- ✅ Use DPDCA: full discovery before any fixes
- ✅ Test locally first (syntax + logic dry-run)
- ✅ One comprehensive PR with all related fixes
- ✅ Progressive deployment (dry-run → production)
- ✅ "Find one, fix many" - understand root cause pattern

---

**Status**: DISCOVER & PLAN complete, awaiting L49 test results before DO phase
