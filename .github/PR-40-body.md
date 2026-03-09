## Issue

GitHub Actions workflow failing with:
- ✅ **L42 (Infrastructure)**: Working correctly
- ❌ **L49 (Costs)**: Script succeeds but status check fails  
- ❌ **L41 (Agent Metrics)**: Service principal lacks App Insights read permissions

## Root Cause

### Problem 1: Missing Exit Codes (L49 & L41)
PowerShell scripts don't automatically set `$LASTEXITCODE` on successful completion. The workflow's status check step:
```powershell
if ($LASTEXITCODE -eq 0) {
  Write-Host "✓ Sync completed successfully"
} else {
  exit 1
}
```
...fails because `$LASTEXITCODE` is undefined (not 0).

**Evidence**: L49 logs show:
```
[SUCCESS] SYNC COMPLETE
  Total Cost: 17.02 USD
  Services: 12
```
...but status step reports failure.

### Problem 2: Service Principal Permissions (L41)
L41 script calls App Insights REST API:
```
GET https://management.azure.com/.../Microsoft.Insights/components/{name}?api-version=2020-02-02
```

**Error**: `MissingApiVersionParameter` at line 108  
**Actual Issue**: Service principal authenticated but lacks **Reader** or **Monitoring Reader** role to access App Insights resource metadata.

## Changes

### 1. Add explicit `exit 0` on success
- **sync-azure-costs.ps1** (L49): Line ~438 after "SYNC COMPLETE"
- **update-agent-metrics-from-appinsights.ps1** (L41): Line ~430 after success reporting

### 2. Helper script for permissions
- **scripts/grant-github-actions-permissions.ps1**
- Grants "Monitoring Reader" role to GitHub Actions service principal
- Requires service principal App ID from AZURE_CREDENTIALS secret

## Testing

### Local Validation
✅ Both scripts run successfully locally with proper authentication  
✅ L49: Retrieved 56 cost rows, transformed to L49 schema  
✅ L41 API call: Returns 200 OK with AppId  

### Manual Steps Required
After merging, run:
```powershell
# Get clientId from GitHub secret AZURE_CREDENTIALS
# Then run:
.\scripts\grant-github-actions-permissions.ps1 -ServicePrincipalAppId "<client-id>"
```

## Expected Outcome

After merge + permissions grant:
- ✅ L42: Continues working (32 resources)  
- ✅ L49: Status check succeeds (cost data to L49)  
- ✅ L41: Successfully queries App Insights and uploads agent metrics to L41

## Related

- PR #39: Fixed parser error (duplicate catch block) ✅ Merged  
- Session 39 DPDCA: Systematic fix after reactive debugging failures
