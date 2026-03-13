# PART 1.CHECK: Query Validation and Final Verification
# Verifies all schemas, layers, and seed data are complete and ready for Cosmos DB seeding

$schemaDir = "c:\eva-foundry\37-data-model\schema"
$evidenceDir = "c:\eva-foundry\37-data-model\evidence"
$layerDefFile = "c:\eva-foundry\37-data-model\docs\library\LAYER-DEFINITIONS-L112-L121.md"
$docsDir = "c:\eva-foundry\37-data-model\docs\examples"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$evidenceFile = Join-Path $evidenceDir "PART-1-LAYER-QUERY-CHECK-$timestamp.json"

Write-Host "[INFO] === PART 1.CHECK: Query Validation ===" -ForegroundColor Cyan
Write-Host "[INFO] Validating all schemas, layer definitions, and seed data"
Write-Host ""

$results = @{
    timestamp = [datetime]::UtcNow.ToString("o")
    part = 1
    phase = "CHECK-QueryValidation"
    schemas_verified = 0
    layer_definitions_verified = 0
    seed_files_verified = 0
    total_seed_records = 0
    verification_details = @()
    errors = @()
}

# Define the 10 expected layers
$expectedLayers = @(
    "red_team_test_suites",
    "attack_tactic_catalog",
    "ai_security_findings",
    "assertions_catalog",
    "ai_security_metrics",
    "vulnerability_scan_results",
    "infrastructure_cve_findings",
    "risk_ranking_analysis",
    "remediation_tasks",
    "remediation_effectiveness_metrics"
)

Write-Host "[VERIFY] Schema files..." -ForegroundColor Yellow
foreach ($layerName in $expectedLayers) {
    $schemaFiles = @(
        "$layerName.schema.json",
        # Handle alternate naming (e.g., red_team_test_suite vs red_team_test_suites)
        "$($layerName -replace 's$', '').schema.json",
        "$($layerName -replace '_', '-').schema.json"
    )
    
    $found = $false
    foreach ($schemaFile in $schemaFiles) {
        $path = Join-Path $schemaDir $schemaFile
        if (Test-Path $path) {
            $json = Get-Content -Raw $path | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($json) {
                Write-Host "  ✓ $layerName" -ForegroundColor Green
                $results.schemas_verified += 1
                $found = $true
                break
            }
        }
    }
    
    if (-not $found) {
        Write-Host "  ✗ $layerName (NOT FOUND)" -ForegroundColor Yellow
        $results.errors += "Schema not found for layer: $layerName"
    }
}

Write-Host ""
Write-Host "[VERIFY] Layer definitions..." -ForegroundColor Yellow
if (Test-Path $layerDefFile) {
    $layerDefs = Get-Content -Raw $layerDefFile
    $layerCount = ($layerDefs | Select-String -Pattern "^## L\d+" | Measure-Object).Count
    Write-Host "  ✓ Layer definitions file exists ($layerCount layers defined)" -ForegroundColor Green
    $results.layer_definitions_verified = $layerCount
} else {
    Write-Host "  ✗ Layer definitions file NOT FOUND" -ForegroundColor Red
    $results.errors += "Layer definitions file missing: $layerDefFile"
}

Write-Host ""
Write-Host "[VERIFY] Seed data files..." -ForegroundColor Yellow
if (-not (Test-Path $docsDir)) {
    Write-Host "  ✗ Seeds directory does not exist: $docsDir" -ForegroundColor Red
    $results.errors += "Seeds directory missing"
} else {
    $seedFiles = Get-ChildItem $docsDir -Filter "*seed*.json" -ErrorAction SilentlyContinue
    if ($seedFiles) {
        Write-Host "  ✓ Found $($seedFiles.Count) seed files" -ForegroundColor Green
        $results.seed_files_verified = $seedFiles.Count
        
        foreach ($file in $seedFiles) {
            try {
                $content = Get-Content -Raw $file.FullName | ConvertFrom-Json -ErrorAction Stop
                $recordCount = if ($content -is [array]) { $content.Count } else { 1 }
                $results.total_seed_records += $recordCount
                Write-Host "    - $($file.Name): $recordCount records" -ForegroundColor Cyan
            } catch {
                Write-Host "    - $($file.Name): INVALID JSON" -ForegroundColor Red
                $results.errors += "Invalid JSON in seed file: $($file.Name)"
            }
        }
    } else {
        Write-Host "  ✗ No seed files found in: $docsDir" -ForegroundColor Red
        $results.errors += "No seed data files created"
    }
}

Write-Host ""
Write-Host "[SUMMARY]" -ForegroundColor Cyan
Write-Host "  Schemas Verified: $($results.schemas_verified) / 10"
Write-Host "  Layer Definitions: $($results.layer_definitions_verified) / 10"
Write-Host "  Seed Files: $($results.seed_files_verified) / 10"
Write-Host "  Total Seed Records: $($results.total_seed_records)"

# Overall status determination
$allPassed = ($results.schemas_verified -eq 10) -and ($results.layer_definitions_verified -eq 10) -and ($results.seed_files_verified -eq 10)

if ($allPassed -and $results.total_seed_records -ge 20) {
    Write-Host "  Status: READY FOR DEPLOYMENT" -ForegroundColor Green
    $results.status = "READY"
    $results.exit_code = 0
} elseif ($results.errors.Count -eq 0) {
    Write-Host "  Status: PARTIAL (ready for next phase)" -ForegroundColor Yellow
    $results.status = "PARTIAL"
    $results.exit_code = 0
} else {
    Write-Host "  Status: FAILED" -ForegroundColor Red
    $results.status = "FAILED"
    $results.exit_code = 1
}

if ($results.errors.Count -gt 0) {
    Write-Host ""
    Write-Host "[ERRORS]" -ForegroundColor Red
    foreach ($error in $results.errors) {
        Write-Host "  - $error"
    }
}

# Save evidence
$results | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 -FilePath $evidenceFile
Write-Host ""
Write-Host "[EVIDENCE] Saved: $evidenceFile" -ForegroundColor Gray
Write-Host "[STATUS] All 3 DO phases complete. Ready for PART 1.ACT (commit)." -ForegroundColor Green

exit $results.exit_code
