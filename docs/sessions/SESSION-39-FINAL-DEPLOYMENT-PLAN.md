# Session 39 - Final Deployment Plan

**Date**: March 8, 2026 9:35 AM ET  
**Phase**: PLAN for final deployment steps  
**Status**: Ready to execute

---

## 1. Workflow File Placement (COMPLETE)

**Issue Discovered**: Workflow file was created at parent level (`eva-foundry/.github/workflows/`) but `eva-foundry` is NOT a git repository.

**Solution**: Created workflow at correct location: `37-data-model/.github/workflows/infrastructure-monitoring-sync.yml`

**Changes Made**:
- Fixed `working-directory` paths: `37-data-model/scripts` → `scripts`
- Ready to commit to 37-data-model repository

---

## 2. Azure Service Principal Setup

### Create Service Principal

```powershell
# Step 1: Create service principal with Reader role
$sp = az ad sp create-for-rbac `
  --name "eva-data-model-github-actions" `
  --role "Reader" `
  --scopes "/subscriptions/c59ee575-eb2a-4b51-a865-4b618f9add0a" `
  --sdk-auth

# Save output - needed for GitHub secret
$sp | Out-File -FilePath "service-principal-credentials.json"
Write-Host "✓ Service principal created. JSON saved to service-principal-credentials.json"
Write-Host "  IMPORTANT: Store this securely and delete after adding to GitHub"
```

### Assign Additional Roles

```powershell
# Step 2: Get service principal object ID
$appId = ($sp | ConvertFrom-Json).clientId
$spObjectId = az ad sp list --filter "appId eq '$appId'" --query "[0].id" -o tsv

Write-Host "Service Principal Object ID: $spObjectId"

# Step 3: Assign Cost Management Reader role
az role assignment create `
  --assignee $spObjectId `
  --role "Cost Management Reader" `
  --scope "/subscriptions/c59ee575-eb2a-4b51-a865-4b618f9add0a"

Write-Host "✓ Cost Management Reader role assigned"

# Step 4: Assign Monitoring Reader role (for Application Insights)
az role assignment create `
  --assignee $spObjectId `
  --role "Monitoring Reader" `
  --scope "/subscriptions/c59ee575-eb2a-4b51-a865-4b618f9add0a/resourceGroups/EVA-Sandbox-dev"

Write-Host "✓ Monitoring Reader role assigned"

# Step 5: Verify role assignments
Write-Host "`nVerifying role assignments:"
az role assignment list --assignee $spObjectId --output table

Write-Host "`n✓ Service principal setup complete"
Write-Host "  Next: Add credentials to GitHub as AZURE_CREDENTIALS secret"
```

### Verification

```powershell
# Verify the service principal can access required APIs
az login --service-principal `
  -u $appId `
  -p <client-secret-from-json> `
  --tenant <tenant-id-from-json>

# Test Resource Graph query
az graph query -q "Resources | take 1"

# Test Cost Management query
az costmanagement query --type Usage --timeframe MonthToDate --scope "/subscriptions/c59ee575-eb2a-4b51-a865-4b618f9add0a" | Select-Object -First 5

# Test Application Insights access
az monitor app-insights component show --app msub-sandbox-appinsights --resource-group EVA-Sandbox-dev

Write-Host "✓ All API access verified"
```

---

## 3. Local Script Testing

### Test L42: Infrastructure Sync

```powershell
cd C:\AICOE\eva-foundry\37-data-model\scripts

# Ensure logged in as yourself (not service principal)
az account show

# Dry run first
python sync-azure-infrastructure.py --dry-run

# Expected: Query succeeds, shows resources, doesn't upload

# Real run if dry-run succeeds
python sync-azure-infrastructure.py

# Verify data uploaded
curl "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/azure_infrastructure/?limit=2" | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

### Test L49: Cost Sync (optional - slower)

```powershell
.\sync-azure-costs.ps1 -DryRun

# If successful and time permits:
.\sync-azure-costs.ps1
```

### Test L41: Metrics Sync (optional - requires agent telemetry)

```powershell
.\update-agent-metrics-from-appinsights.ps1 -LookbackHours 24 -DryRun

# If successful:
.\update-agent-metrics-from-appinsights.ps1 -LookbackHours 24
```

---

## 4. GitHub Setup

### Add Workflow and Commit

```powershell
cd C:\AICOE\eva-foundry\37-data-model

git status  # Should show workflow file as untracked

git add .github/workflows/infrastructure-monitoring-sync.yml

git commit -m "Session 39: Add GitHub Actions workflow for infrastructure monitoring

Added scheduled workflow for automated data ingestion into L40-L49 layers:
- L42 (azure_infrastructure): Every 4 hours via Azure Resource Graph
- L49 (resource_costs): Daily at 6 AM ET via Cost Management API
- L41 (agent_performance_metrics): Hourly via Application Insights

Features:
- Manual trigger with workflow_dispatch (all/infrastructure/costs/metrics)
- Dry-run mode for safe testing
- Summary report job with status table
- Error handling and exit codes

Requires AZURE_CREDENTIALS secret with service principal JSON.
See docs/INTEGRATION-SETUP-GUIDE.md for deployment instructions."

git push origin session-38-instruction-hardening
```

### Add GitHub Secret

**Manual Steps** (requires GitHub UI):

1. Navigate to: `https://github.com/eva-foundry/37-data-model/settings/secrets/actions`
2. Click **"New repository secret"**
3. Name: `AZURE_CREDENTIALS`
4. Value: Paste contents of `service-principal-credentials.json`
5. Click **"Add secret"**
6. Delete local `service-principal-credentials.json` file

### Test Workflow

```powershell
# Option 1: GitHub UI
# - Go to Actions tab
# - Select "EVA Infrastructure Monitoring - Scheduled Data Sync"
# - Click "Run workflow"
# - Select branch: session-38-instruction-hardening
# - Sync target: infrastructure
# - Dry run: checked
# - Click "Run workflow"

# Option 2: GitHub CLI (if installed)
gh workflow run infrastructure-monitoring-sync.yml `
  -f sync_target=infrastructure `
  -f dry_run=true `
  --ref session-38-instruction-hardening
```

---

## 5. Validation Checklist

After first workflow run:

- [ ] Workflow completes without errors
- [ ] L42 job reports success
- [ ] Data appears in data model: `GET /model/azure_infrastructure/?limit=5`
- [ ] Records have correct schema fields
- [ ] Timestamps are recent
- [ ] No authentication errors in logs

---

## 6. Risk Mitigation

### Known Risks

1. **Service Principal Permissions**
   - **Risk**: Insufficient RBAC roles
   - **Mitigation**: Verify with test queries before adding to GitHub

2. **Script Compatibility**
   - **Risk**: Python script uses `az.cmd` on Windows but GitHub Actions runs Linux
   - **Mitigation**: Script already detects platform via `sys.platform`

3. **Cost Management API Limits**
   - **Risk**: Daily query limits (~1000/day per subscription)
   - **Mitigation**: Scheduled once daily, well below limit

4. **Workflow Schedule Misalignment**
   - **Risk**: Cron expressions in UTC, documentation mentions ET
   - **Mitigation**: Comments in workflow clarify both UTC and ET times

### Rollback Plan

If workflow fails:
1. Disable workflow: Edit file, change schedules to comments
2. Debug locally with same scripts
3. Fix issue
4. Re-enable schedules

---

## 7. Success Criteria

**Service Principal Setup**: ✅ Complete when all 3 role assignments verified

**Local Testing**: ✅ Complete when L42 script runs successfully (dry-run acceptable)

**GitHub Workflow**: ✅ Complete when committed and pushed

**GitHub Secret**: ✅ Complete when AZURE_CREDENTIALS added to repo secrets

**Workflow Validation**: ✅ Complete when first manual run succeeds

---

## 8. Time Estimates

| Task | Estimated Time | Priority |
|------|---------------|----------|
| Create service principal | 10 minutes | CRITICAL |
| Assign additional roles | 5 minutes | CRITICAL |
| Test L42 script locally | 15 minutes | HIGH |
| Commit workflow file | 5 minutes | CRITICAL |
| Add GitHub secret | 5 minutes | CRITICAL |
| Test workflow run | 10 minutes | HIGH |
| Validate data population | 10 minutes | MEDIUM |
| **Total** | **60 minutes** | |

---

## 9. Next Steps (Execution Order)

1. ✅ **Create service principal** (critical path)
2. ⏸️ **Test L42 script locally** (recommended, can skip if time-constrained)
3. ✅ **Commit and push workflow file** (critical path)
4. ✅ **Add AZURE_CREDENTIALS to GitHub** (critical path, manual)
5. ⏸️ **Trigger test workflow run** (recommended)
6. ⏸️ **Validate data appears in model** (recommended)
7. ✅ **Document completion** (finalize session)

---

**Document Version:** 1.0  
**Last Updated:** March 8, 2026 9:35 AM ET  
**Next Action:** Execute service principal creation
