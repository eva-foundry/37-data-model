$schemaDir = "c:\eva-foundry\37-data-model\schema"
$evidenceDir = "c:\eva-foundry\37-data-model\evidence"

# Create evidence directory if missing
if (-not (Test-Path $evidenceDir)) { New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null }

# Define the 10 schemas for L112-L121
$schemas = @(
    "red_team_test_suite.schema.json",           # L112
    "attack_tactic_catalog.schema.json",         # L113
    "ai_security_finding.schema.json",           # L114
    "assertions_catalog.schema.json",            # L115
    "ai_security_metrics.schema.json",           # L116
    "vulnerability_scan_result.schema.json",     # L117
    "cve_finding.schema.json",                   # L118
    "risk_ranking.schema.json",                  # L119
    "remediation_task.schema.json",              # L120
    "remediation_effectiveness.schema.json"      # L121
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$evidenceFile = Join-Path $evidenceDir "PART-1-SCHEMA-VALIDATION-$timestamp.json"

Write-Host "[INFO] === PART 1.DO.1: Schema Validation ===" -ForegroundColor Cyan
Write-Host "[INFO] Target: 10 schemas for L112-L121"
Write-Host "[INFO] Evidence: $evidenceFile" -ForegroundColor Gray
Write-Host ""

$results = @{
    timestamp = [datetime]::UtcNow.ToString("o")
    part = 1
    phase = "DO.1-SchemaValidation"
    schemas_target = 10
    schemas_found = 0
    schemas_valid = 0
    schema_details = @()
    errors = @()
}

foreach ($schema in $schemas) {
    $path = Join-Path $schemaDir $schema
    Write-Host -NoNewline "[CHECK] $schema ... "
    
    if (-not (Test-Path $path)) {
        Write-Host "MISSING" -ForegroundColor Yellow
        $results.schema_details += @{
            name = $schema
            status = "MISSING"
            path = $path
        }
        continue
    }
    
    $results.schemas_found += 1
    Write-Host -NoNewline "found ... "
    
    try {
        $content = Get-Content -Raw $path
        $json = $content | ConvertFrom-Json -ErrorAction Stop
        
        # Verify required fields
        $hasId = $json.PSObject.Properties.Name -contains '$id'
        $hasTitle = $json.PSObject.Properties.Name -contains 'title'
        $hasProperties = $json.PSObject.Properties.Name -contains 'properties'
        $hasRequired = $json.PSObject.Properties.Name -contains 'required'
        
        if ($hasId -and $hasTitle -and $hasProperties) {
            Write-Host "VALID" -ForegroundColor Green
            $results.schemas_valid += 1
            $results.schema_details += @{
                name = $schema
                status = "VALID"
                path = $path
                has_id = $hasId
                has_title = $hasTitle
                has_properties = $hasProperties
                has_required = $hasRequired
            }
        } else {
            Write-Host "INVALID (missing fields)" -ForegroundColor Red
            $results.schema_details += @{
                name = $schema
                status = "INVALID"
                path = $path
                reason = "Missing required fields"
                has_id = $hasId
                has_title = $hasTitle
                has_properties = $hasProperties
            }
            $results.errors += "Schema '$schema' missing required fields (id=$hasId, title=$hasTitle, properties=$hasProperties)"
        }
    } catch {
        Write-Host "INVALID (parse error)" -ForegroundColor Red
        $results.schema_details += @{
            name = $schema
            status = "INVALID"
            path = $path
            reason = "JSON parse error: $($_.Exception.Message)"
        }
        $results.errors += "$schema : $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "[SUMMARY]" -ForegroundColor Cyan
Write-Host "  Found:  $($results.schemas_found) / $($results.schemas_target)"
Write-Host "  Valid:  $($results.schemas_valid) / $($results.schemas_target)"

# Determine status
if ($results.schemas_valid -eq 10) {
    $results.status = "SUCCESS"
    $results.exit_code = 0
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
} elseif ($results.schemas_found -ge 8) {
    $results.status = "PARTIAL_WARN"
    $results.exit_code = 1
    Write-Host "  Status: PARTIAL (warning)" -ForegroundColor Yellow
} else {
    $results.status = "FAIL"
    $results.exit_code = 1
    Write-Host "  Status: FAIL" -ForegroundColor Red
}

if ($results.errors.Count -gt 0) {
    Write-Host ""
    Write-Host "[ERRORS]" -ForegroundColor Red
    foreach ($error in $results.errors) {
        Write-Host "  - $error"
    }
}

Write-Host ""

# Save evidence JSON
$results | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 -FilePath $evidenceFile
Write-Host "[EVIDENCE] Saved: $evidenceFile" -ForegroundColor Gray

exit $results.exit_code
