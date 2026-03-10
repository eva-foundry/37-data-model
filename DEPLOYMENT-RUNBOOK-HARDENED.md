# Hardened Deployment Runbook - Data Model API

**Version:** 2.0.0 (Post-RCA Hardened Edition)  
**Created:** March 10, 2026  
**Rationale:** RCA revealed false deployment claims. This runbook prevents lies through mandatory evidence collection.

---

## Philosophy: Trust But Verify

**Old way (FAILED)**:
- Code committed → Mark as ✓ complete
- Documentation updated → Claim deployment success
- No verification → Faith-based deployment

**New way (HARDENED)**:
- Every step requires evidence
- No ✓ without proof
- Side-by-side comparison mandatory
- Screenshots required
- Exit 0 or Exit 1 (no ambiguity)

---

## Pre-Deployment Checklist

### 1. Code Readiness ⬜
- [ ] All JSON files in `model/` directory validated
- [ ] `admin.py` `_LAYER_FILES` registry updated
- [ ] **Layer metadata index auto-generated**: `python scripts/generate-layer-metadata-index.py`
  - [ ] Reflects current Cosmos DB state (operational layers updated)
  - [ ] No manual edits to `layer-metadata-index.json` required
- [ ] Unit tests passing: `pytest tests/` (exit 0)
- [ ] Linting passing: `flake8 api/` (exit 0)
- [ ] **Evidence**: Screenshot of test output showing all PASS

**IMPORTANT**: The layer metadata index (`model/layer-metadata-index.json`) is **automatically generated** from Cosmos DB ground truth during deployment. The GitHub Actions workflow runs `scripts/generate-layer-metadata-index.py` before every Docker build to ensure the API always returns accurate operational layer counts. Manual edits are discouraged - let Cosmos DB be the source of truth.

### 2. Local Testing ⬜
- [ ] Local API running: `uvicorn api.server:app --port 8010`
- [ ] Health check: `GET /health` returns status=ok
- [ ] Seed operation: `POST /admin/seed` with Bearer token
- [ ] Layer count verification: `GET /model/agent-summary`
- [ ] **Evidence**: JSON file saved from /model/agent-summary showing layer counts

### 3. Container Image Build ⬜
- [ ] Image built: `docker build -t eva-data-model:deploy-YYYYMMDD-HHMM .`
- [ ] Image tagged: `docker tag eva-data-model:deploy-YYYYMMDD-HHMM msubsandacr.azurecr.io/eva/eva-data-model:deploy-YYYYMMDD-HHMM`
- [ ] Image pushed: `docker push msubsandacr.azurecr.io/eva/eva-data-model:deploy-YYYYMMDD-HHMM`
- [ ] **Evidence**: Screenshot of `docker images` showing new tag

### 4. Azure Pre-flight ⬜
- [ ] Azure CLI authenticated: `az account show`
- [ ] Cosmos DB accessible: `az cosmosdb database exists`
- [ ] Container registry accessible: `az acr repository list`
- [ ] **Evidence**: Screenshot of `az account show` with subscription details

---

## Deployment Steps (ZERO DEVIATION ALLOWED)

### Step 1: Deploy Container to Azure Container Apps

```powershell
# Deploy new revision
az containerapp update `
  --name msub-eva-data-model `
  --resource-group rg-eva `
  --image msubsandacr.azurecr.io/eva/eva-data-model:deploy-YYYYMMDD-HHMM

# Get revision name
$revision = az containerapp revision list `
  --name msub-eva-data-model `
  --resource-group rg-eva `
  --query "[0].name" `
  --output tsv

Write-Host "Deployed revision: $revision"
```

**Evidence Required**:
- ✓ Screenshot showing `az containerapp update` success
- ✓ Revision name captured
- ✓ Traffic percentage (should be 100% to new revision)

**File**: `deployment-evidence/YYYYMMDD-HHMM/step1-deploy-aca.png`

---

### Step 2: Wait for Container Healthy

```powershell
# Wait for health endpoint
$baseUrl = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$maxAttempts = 30
$attempt = 0

do {
  $attempt++
  Write-Host "Health check attempt $attempt/$maxAttempts..." -NoNewline
  
  try {
    $health = Invoke-RestMethod "$baseUrl/health" -TimeoutSec 5
    if ($health.status -eq "ok") {
      Write-Host " OK" -ForegroundColor Green
      break
    }
  } catch {
    Write-Host " Failed" -ForegroundColor Yellow
    Start-Sleep -Seconds 5
  }
} while ($attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
  Write-Host "FATAL: Health check failed after $maxAttempts attempts" -ForegroundColor Red
  exit 1
}
```

**Evidence Required**:
- ✓ Screenshot of successful health check
- ✓ Response shows: `status: ok`, `store: cosmos`
- ✓ Timestamp proving it's the new deployment

**File**: `deployment-evidence/YYYYMMDD-HHMM/step2-health-check.png`

---

### Step 3: Seed Cosmos DB (CRITICAL STEP)

```powershell
# MANDATORY: Seed operation with evidence collection
$seedUrl = "$baseUrl/model/admin/seed"
$bearerToken = "dev-admin"  # Replace with actual token

Write-Host "Starting seed operation..." -ForegroundColor Cyan
$seedStart = Get-Date

try {
  $seedResponse = Invoke-RestMethod `
    -Uri $seedUrl `
    -Method POST `
    -Headers @{Authorization = "Bearer $bearerToken"} `
    -TimeoutSec 300
  
  $seedEnd = Get-Date
  $duration = ($seedEnd - $seedStart).TotalSeconds
  
  Write-Host "Seed completed in $duration seconds" -ForegroundColor Green
  Write-Host "Total records: $($seedResponse.total)" -ForegroundColor Cyan
  Write-Host "Errors: $($seedResponse.errors.Count)" -ForegroundColor $(if ($seedResponse.errors.Count -eq 0) { 'Green' } else { 'Red' })
  
  # Save seed response
  $seedResponse | ConvertTo-Json -Depth 10 | Out-File "deployment-evidence/$timestamp/step3-seed-response.json"
  
} catch {
  Write-Host "FATAL: Seed operation failed" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}

# Verify seed was successful
if ($seedResponse.errors.Count -gt 0) {
  Write-Host "WARNING: Seed completed with errors" -ForegroundColor Red
  $seedResponse.errors | Format-Table
  exit 1
}
```

**Evidence Required**:
- ✓ JSON file with complete seed response
- ✓ Screenshot showing total records seeded
- ✓ Error count = 0
- ✓ Timestamp proving this happened AFTER deployment

**Files**: 
- `deployment-evidence/YYYYMMDD-HHMM/step3-seed-response.json`
- `deployment-evidence/YYYYMMDD-HHMM/step3-seed-screenshot.png`

**CHECKPOINT**: If seed fails, deployment FAILS. Do not proceed.

---

### Step 4: Verify Cloud Data

```powershell
# Get cloud layer summary
Write-Host "Fetching cloud data summary..." -ForegroundColor Cyan

$cloudSummary = Invoke-RestMethod "$baseUrl/model/agent-summary" -TimeoutSec 10

Write-Host "Cloud layers: $($cloudSummary.layer_counts.PSObject.Properties.Count)" -ForegroundColor White
Write-Host "Cloud records: $($cloudSummary.totals.total_records)" -ForegroundColor White

# Save summary
$cloudSummary | ConvertTo-Json -Depth 10 | Out-File "deployment-evidence/$timestamp/step4-cloud-summary.json"

# Display top 10 layers
$cloudSummary.layer_counts.PSObject.Properties | 
  Sort-Object Value -Descending | 
  Select-Object -First 10 | 
  Format-Table Name, Value
```

**Evidence Required**:
- ✓ JSON file with complete agent-summary response
- ✓ Screenshot showing layer count and record count
- ✓ Timestamp proving this is AFTER seed operation

**Files**:
- `deployment-evidence/YYYYMMDD-HHMM/step4-cloud-summary.json`
- `deployment-evidence/YYYYMMDD-HHMM/step4-cloud-screenshot.png`

---

### Step 5: Side-by-Side Comparison (MANDATORY)

```powershell
# Run deterministic comparison script
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " MANDATORY: Side-by-Side Store Comparison" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$evidenceDir = "deployment-evidence/$timestamp"

.\scripts\deployment-verification-sbs.ps1 `
  -OutputDir $evidenceDir `
  -ScreenshotRequired

$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
  Write-Host ""
  Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Red
  Write-Host "║  DEPLOYMENT VERIFICATION FAILED            ║" -ForegroundColor Red
  Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Red
  Write-Host ""
  Write-Host "Stores are NOT identical. Deployment cannot be approved." -ForegroundColor Red
  Write-Host "Review evidence in: $evidenceDir" -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "✓ Verification PASSED - Stores are identical" -ForegroundColor Green
```

**Evidence Required** (auto-generated by script):
- ✓ `01-preflight-check.json` - Both APIs reachable
- ✓ `02-summary-comparison.json` - Layer counts match
- ✓ `03-layer-by-layer-comparison.json` - Every layer matches
- ✓ `EVIDENCE-PACK.json` - Master evidence file
- ✓ `screenshots/` - 5+ screenshots showing actual API responses

**CHECKPOINT**: If comparison fails (exit 1), deployment FAILS. Do not proceed.

---

### Step 6: Update Documentation

```powershell
# ONLY if Step 5 passed - update docs with ACTUAL numbers from evidence

$evidencePack = Get-Content "$evidenceDir/EVIDENCE-PACK.json" | ConvertFrom-Json

$actualLayerCount = $evidencePack.summary.cloud_layers
$actualRecordCount = $evidencePack.summary.cloud_records
$verificationTime = $evidencePack.metadata.timestamp

Write-Host "Updating documentation with verified numbers:" -ForegroundColor Cyan
Write-Host "  Layers: $actualLayerCount" -ForegroundColor White
Write-Host "  Records: $actualRecordCount" -ForegroundColor White
Write-Host "  Verified: $verificationTime" -ForegroundColor White
```

**Update these files:**
1. `README.md` - Update layer count (line 45)
2. `STATUS.md` - Update layer count (line 4)
3. `USER-GUIDE.md` - Update layer count (line 11)
4. `.github/copilot-instructions.md` - Update layer count

**Evidence Required**:
- ✓ Git commit with message: "docs: update to $actualLayerCount layers (verified $verificationTime)"
- ✓ Git diff showing only number changes
- ✓ Screenshot of git commit

**File**: `deployment-evidence/YYYYMMDD-HHMM/step6-docs-update.png`

---

### Step 7: Create Deployment Record

```powershell
# Add to deployment_records layer
$deploymentRecord = @{
  id = "deploy-$timestamp"
  revision = $revision
  timestamp = $verificationTime
  operator = $env:USERNAME
  image_tag = "deploy-$timestamp"
  layers_deployed = $actualLayerCount
  records_deployed = $actualRecordCount
  verification_status = "PASS"
  evidence_pack = "$evidenceDir/EVIDENCE-PACK.json"
  seed_duration_seconds = $duration
  health_checks = @{
    local = $localHealth
    cloud = $cloudHealth
  }
}

# Write to API
Invoke-RestMethod `
  -Uri "$baseUrl/model/deployment_records/$($deploymentRecord.id)" `
  -Method PUT `
  -Body ($deploymentRecord | ConvertTo-Json -Depth 10) `
  -ContentType "application/json" `
  -Headers @{'X-Actor' = 'ops:deployment'}
```

**Evidence Required**:
- ✓ API response showing row_version = 1 (new record)
- ✓ Screenshot of deployment record creation

**File**: `deployment-evidence/YYYYMMDD-HHMM/step7-deployment-record.png`

---

## Post-Deployment Verification

### Smoke Tests (5 minutes)

```powershell
# Test 5 critical endpoints
$smokeTests = @(
  "/health",
  "/model/agent-guide",
  "/model/agent-summary",
  "/model/projects/?limit=5",
  "/model/evidence/?limit=5"
)

foreach ($endpoint in $smokeTests) {
  Write-Host "Testing $endpoint..." -NoNewline
  try {
    $response = Invoke-RestMethod "$baseUrl$endpoint" -TimeoutSec 5
    Write-Host " ✓" -ForegroundColor Green
  } catch {
    Write-Host " ✗ FAIL" -ForegroundColor Red
    exit 1
  }
}
```

**Evidence Required**:
- ✓ Screenshot showing all 5 tests passing

**File**: `deployment-evidence/YYYYMMDD-HHMM/post-smoke-tests.png`

---

## Evidence Pack Checklist

Before marking deployment as complete, verify ALL evidence collected:

```
deployment-evidence/
└── YYYYMMDD-HHMM/
    ├── step1-deploy-aca.png              ✓ Azure deployment
    ├── step2-health-check.png            ✓ Container healthy
    ├── step3-seed-response.json          ✓ Seed completed
    ├── step3-seed-screenshot.png         ✓ Seed visual proof
    ├── step4-cloud-summary.json          ✓ Cloud data verified
    ├── step4-cloud-screenshot.png        ✓ Cloud visual proof
    ├── 01-preflight-check.json           ✓ Pre-flight checks
    ├── 02-summary-comparison.json        ✓ Summary comparison
    ├── 03-layer-by-layer-comparison.json ✓ Detailed comparison
    ├── EVIDENCE-PACK.json                ✓ Master evidence
    ├── step6-docs-update.png             ✓ Documentation commit
    ├── step7-deployment-record.png       ✓ Record created
    ├── post-smoke-tests.png              ✓ Smoke tests passing
    └── screenshots/
        ├── local-health.png              ✓ Local API proof
        ├── cloud-health.png              ✓ Cloud API proof
        ├── local-summary.png             ✓ Local data proof
        ├── cloud-summary.png             ✓ Cloud data proof
        └── verification-verdict.png      ✓ Final verdict
```

**Minimum Required**: 17 files  
**Actual Collected**: _____ files

⬜ All evidence collected  
⬜ Evidence pack compressed: `deployment-evidence-YYYYMMDD-HHMM.zip`  
⬜ Evidence pack uploaded to blob storage / GitHub release

---

## Sign-Off

**THIS SECTION CANNOT BE MARKED COMPLETE WITHOUT ALL EVIDENCE**

I certify that:
- [ ] All 7 deployment steps completed successfully
- [ ] Side-by-side comparison PASSED (exit 0)
- [ ] All 17+ evidence files collected
- [ ] No steps skipped or falsified
- [ ] Actual numbers used (not aspirational)
- [ ] Cloud Cosmos DB verified to contain exact data

**Operator**: _______________________  
**Date/Time**: _______________________  
**Evidence Pack**: deployment-evidence-________.zip  
**Verification Hash**: _______________________

---

## Rollback Procedure

If deployment fails at ANY step:

```powershell
# Revert to previous revision
az containerapp traffic set `
  --name msub-eva-data-model `
  --resource-group rg-eva `
  --revision-weight $previousRevision=100 $newRevision=0

# Verify rollback
Invoke-RestMethod "$baseUrl/health"

# Document failure
Write-Host "Deployment FAILED and rolled back" -ForegroundColor Red
Write-Host "See evidence in: deployment-evidence/$timestamp" -ForegroundColor Yellow
exit 1
```

---

## Lessons from RCA

**What went wrong (March 8-10, 2026)**:
- Claimed "5,796 records deployed" without verification
- Documentation updated before seed operation
- No side-by-side comparison performed
- No screenshot evidence collected
- Trust-based verification (agent claimed success)

**What this runbook prevents**:
- ✓ Deterministic verification script (exit 0 or exit 1)
- ✓ Side-by-side comparison catches mismatches
- ✓ Evidence pack provides audit trail
- ✓ Screenshot requirement prevents fabrication
- ✓ Layer-by-layer comparison (no black boxes)
- ✓ Documentation updated AFTER verification (not before)

**Zero trust. Full verification. Evidence required.**

---

**END OF RUNBOOK**

*Version 2.0.0 created March 10, 2026 following RCA-DATA-MODEL-FAILURE-2026-03-10.md findings.*
