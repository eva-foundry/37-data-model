# Quick Start: Hardened Deployment System

**Created**: March 10, 2026  
**Purpose**: Get started with the evidence-based deployment system

---

## What This System Does

**Problem**: Previous deployments claimed success without verification, leading to documentation/reality mismatches.

**Solution**: Hardened system with:
- ✓ Side-by-side comparison (local vs cloud)
- ✓ Deterministic verification (exit 0 or exit 1)
- ✓ Mandatory evidence collection
- ✓ Layer-by-layer testing
- ✓ Screenshot requirements
- ✓ Zero trust - full proof

---

## Files in This System

| File | Purpose | When to Use |
|------|---------|-------------|
| `DEPLOYMENT-RUNBOOK-HARDENED.md` | Step-by-step deployment guide | During deployment |
| `scripts/deployment-verification-sbs.ps1` | Automated comparison script | After seed operation |
| `DEPLOYMENT-PROOF-PACK-TEMPLATE.md` | Evidence checklist | During evidence collection |
| `RCA-DATA-MODEL-FAILURE-2026-03-10.md` | Why this exists | For context |

---

## 10-Minute Deployment Verification

### Prerequisites

1. Local API running: `cd api && uvicorn server:app --port 8010`
2. Local API seeded: `curl -X POST http://localhost:8010/admin/seed -H "Authorization: Bearer dev-admin"`
3. Cloud API deployed and healthy
4. Cloud API seeded (this is what we're verifying)

### Step 1: Run Verification Script

```powershell
# Navigate to project root
cd C:\eva-foundry\37-data-model

# Run side-by-side comparison
.\scripts\deployment-verification-sbs.ps1 -ScreenshotRequired

# Script will:
# 1. Check both APIs are reachable
# 2. Compare layer counts
# 3. Compare record counts  
# 4. Test every layer individually
# 5. Generate evidence files
# 6. Prompt for screenshots
# 7. Return exit 0 (PASS) or exit 1 (FAIL)
```

**Expected Output**:
```
═══ Phase 1: Pre-flight Checks ═══
Testing LOCAL (8010) reachability... ✓ OK
Testing CLOUD (msub) reachability... ✓ OK

═══ Phase 2: Layer Count Summary ═══
Local:  51 layers, 5796 records
Cloud:  51 layers, 5796 records

═══ Phase 3: Layer-by-Layer Verification ═══
[2%] projects... ✓ 48 records
[4%] sprints... ✓ 12 records
[6%] evidence... ✓ 120 records
...
[100%] workspace_config... ✓ 3 records

═══ Phase 4: Final Verdict ═══
Results:
  ✓ Matching:    51 / 51
  ✗ Mismatching: 0 / 51
  Pass Rate:     100.0%

════════════════════════════════════════
  VERDICT: PASS
════════════════════════════════════════

✓ Stores are IDENTICAL - deployment successful
```

### Step 2: Check Evidence

```powershell
# Evidence automatically saved
Get-ChildItem ./deployment-evidence/20260310-HHMM

# Should contain:
# 01-preflight-check.json
# 02-summary-comparison.json
# 03-layer-by-layer-comparison.json
# EVIDENCE-PACK.json
```

### Step 3: Collect Screenshots

If you ran with `-ScreenshotRequired`, the script will pause and ask for screenshots.

**Required screenshots** (save to `./deployment-evidence/YYYYMMDD-HHMM/screenshots/`):
1. Local health: Browser showing `http://localhost:8010/health`
2. Cloud health: Browser showing `https://msub.../health`
3. Local summary: Browser showing `http://localhost:8010/model/agent-summary`
4. Cloud summary: Browser showing `https://msub.../model/agent-summary`
5. Verification result: Terminal showing the "VERDICT: PASS" section

### Step 4: Review Evidence Pack

```powershell
# Load and review
$evidence = Get-Content "./deployment-evidence/YYYYMMDD-HHMM/EVIDENCE-PACK.json" | ConvertFrom-Json

# Check verdict
$evidence.verdict.status  # Should be "PASS"
$evidence.verdict.stores_identical  # Should be $true

# Get actual numbers for documentation
$evidence.summary.cloud_layers  # e.g., 51
$evidence.summary.cloud_records  # e.g., 5796
```

### Step 5: Update Documentation

**ONLY IF verdict = PASS**, update documentation with actual numbers:

```powershell
# Get verified numbers
$layers = $evidence.summary.cloud_layers
$records = $evidence.summary.cloud_records

Write-Host "Updating documentation with verified numbers:"
Write-Host "  Layers: $layers"
Write-Host "  Records: $records"

# Manually update these files:
# - README.md
# - STATUS.md  
# - USER-GUIDE.md
# - .github/copilot-instructions.md
```

**DO NOT update documentation if verdict = FAIL**

---

## Common Scenarios

### Scenario 1: Fresh Deployment

You've deployed a new container image and seeded cloud Cosmos DB.

```powershell
# 1. Verify local is ready
curl http://localhost:8010/health

# 2. Run comparison
.\scripts\deployment-verification-sbs.ps1

# 3. If PASS, update docs
# 4. If FAIL, investigate discrepancies
```

### Scenario 2: Checking Current State

You want to verify that local and cloud match right now (no deployment).

```powershell
# Same command - works anytime
.\scripts\deployment-verification-sbs.ps1
```

### Scenario 3: Post-Deployment Audit

Deployment happened yesterday. You want to verify it's still good.

```powershell
# Create dated evidence directory
$date = Get-Date -Format "yyyyMMdd"
.\scripts\deployment-verification-sbs.ps1 -OutputDir "./audits/$date"
```

### Scenario 4: Something Looks Wrong

Cloud API is returning unexpected results.

```powershell
# Run comparison to find exact discrepancy
.\scripts\deployment-verification-sbs.ps1 -OutputDir "./investigation"

# Review detailed results
Get-Content "./investigation/*/03-layer-by-layer-comparison.json" | 
  ConvertFrom-Json | 
  Where-Object { -not $_.match } |
  Format-Table layer, local_count, cloud_count, discrepancy
```

---

## Understanding Exit Codes

The verification script returns:
- **0** = PASS - Stores are identical (safe to update docs)
- **1** = FAIL - Stores have discrepancies (DO NOT update docs)
- **2** = ERROR - Cannot reach one or both APIs

```powershell
.\scripts\deployment-verification-sbs.ps1
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
  Write-Host "Safe to proceed with documentation update" -ForegroundColor Green
} elseif ($exitCode -eq 1) {
  Write-Host "Discrepancies found - review evidence" -ForegroundColor Red
} else {
  Write-Host "API error - check connectivity" -ForegroundColor Red
}
```

---

## What Each Phase Does

### Phase 1: Pre-flight Checks
- Pings `/health` on both APIs
- Verifies both return `status: ok`
- Checks store types (memory vs cosmos)
- **Evidence**: `01-preflight-check.json`

### Phase 2: Layer Count Summary
- Calls `/model/agent-summary` on both APIs
- Compares total layer counts
- Compares total record counts
- Identifies layers only in one store
- **Evidence**: `02-summary-comparison.json`

### Phase 3: Layer-by-Layer Verification
- For each common layer:
  - Query count from local
  - Query count from cloud
  - Compare counts
  - Mark as match or mismatch
- Tracks pass/fail counts
- **Evidence**: `03-layer-by-layer-comparison.json`

### Phase 4: Final Verdict
- Calculates pass rate
- Determines PASS or FAIL
- Lists all discrepancies
- **Evidence**: `EVIDENCE-PACK.json` (master file)

### Phase 5: Evidence Pack Creation
- Bundles all results
- Adds metadata (timestamp, operator, hostname)
- Creates master evidence file
- **Evidence**: Complete evidence directory

### Phase 6: Screenshot Requirement (optional)
- Pauses script
- Prompts user to collect screenshots
- Validates screenshots present
- Fails if insufficient screenshots

---

## Full Deployment Example

```powershell
# Start from clean state
cd C:\eva-foundry\37-data-model

# 1. Deploy new container to Azure
az containerapp update `
  --name msub-eva-data-model `
  --resource-group rg-eva `
  --image msubsandacr.azurecr.io/eva/eva-data-model:deploy-20260310-1400

# 2. Wait for health
$baseUrl = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
do {
  $health = Invoke-RestMethod "$baseUrl/health" -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 5
} until ($health.status -eq "ok")

Write-Host "✓ Container healthy" -ForegroundColor Green

# 3. Seed Cosmos DB
$seedResponse = Invoke-RestMethod `
  -Uri "$baseUrl/model/admin/seed" `
  -Method POST `
  -Headers @{Authorization = "Bearer dev-admin"}

Write-Host "✓ Seeded $($seedResponse.total) records" -ForegroundColor Green

# 4. Run verification
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
.\scripts\deployment-verification-sbs.ps1 `
  -OutputDir "./deployment-evidence" `
  -ScreenshotRequired

# 5. Check result
if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
  Write-Host "║  DEPLOYMENT VERIFIED - READY FOR DOCS     ║" -ForegroundColor Green
  Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
  
  # Get numbers for docs
  $evidence = Get-Content "./deployment-evidence/$timestamp/EVIDENCE-PACK.json" | ConvertFrom-Json
  Write-Host ""
  Write-Host "Update documentation with:" -ForegroundColor Cyan
  Write-Host "  Layers: $($evidence.summary.cloud_layers)" -ForegroundColor White
  Write-Host "  Records: $($evidence.summary.cloud_records)" -ForegroundColor White
  
} else {
  Write-Host ""
  Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Red
  Write-Host "║  DEPLOYMENT VERIFICATION FAILED           ║" -ForegroundColor Red
  Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Red
  Write-Host ""
  Write-Host "DO NOT update documentation" -ForegroundColor Red
  Write-Host "Review evidence in: ./deployment-evidence/$timestamp" -ForegroundColor Yellow
}
```

---

## Troubleshooting

### "Local API unreachable"

```powershell
# Start local API
cd api
uvicorn server:app --port 8010

# In another terminal, verify
curl http://localhost:8010/health
```

### "Cloud API unreachable"

```powershell
# Check Azure Container App status
az containerapp show `
  --name msub-eva-data-model `
  --resource-group rg-eva `
  --query "properties.latestRevisionFqdn"

# Try health endpoint
$fqdn = # output from above
curl "https://$fqdn/health"
```

### "Stores have discrepancies"

```powershell
# Review detailed comparison
$evidence = Get-Content "./deployment-evidence/*/03-layer-by-layer-comparison.json" | ConvertFrom-Json

# Find mismatches
$mismatches = $evidence | Where-Object { -not $_.match }

# Show details
$mismatches | Format-Table layer, local_count, cloud_count, discrepancy

# Common causes:
# 1. Seed operation didn't run on cloud
# 2. Seed operation ran but had errors
# 3. JSON files different between local and cloud code
# 4. Cosmos DB had partial failure
```

### "Need to re-run verification"

```powershell
# Just run again - it's idempotent
.\scripts\deployment-verification-sbs.ps1

# Or with new evidence directory
$newTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
.\scripts\deployment-verification-sbs.ps1 -OutputDir "./evidence/$newTimestamp"
```

---

## Integration with CI/CD

Add to GitHub Actions:

```yaml
- name: Verify Deployment
  run: |
    # Run verification (no screenshot requirement in CI)
    ./scripts/deployment-verification-sbs.ps1
    
    if ($LASTEXITCODE -ne 0) {
      Write-Error "Deployment verification failed"
      exit 1
    }
    
    # Upload evidence as artifact
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $evidenceDir = "./deployment-evidence/$timestamp"
    
- name: Upload Evidence
  uses: actions/upload-artifact@v3
  with:
    name: deployment-evidence
    path: deployment-evidence/**/EVIDENCE-PACK.json
```

---

## Next Steps

1. **Try it now**: Run `.\scripts\deployment-verification-sbs.ps1`
2. **Read the runbook**: `DEPLOYMENT-RUNBOOK-HARDENED.md` for full process
3. **Understand the RCA**: `RCA-DATA-MODEL-FAILURE-2026-03-10.md` for why this exists

**Remember**: This system exists because previous deployments were claimed without verification. Always collect evidence. Always verify. Never trust - always verify.

---

**Quick Start v1.0.0** - Created March 10, 2026
