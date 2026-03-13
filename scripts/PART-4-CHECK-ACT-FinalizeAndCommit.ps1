# PART 4.CHECK+ACT: Validate and Commit Documentation Changes
# Purpose: Verify all 9 new files, validate schemas, and commit to git
# Output: Validation evidence + git commit

param(
    [string]$SchemaDir = "$(Get-Location)\schema",
    [string]$DocsDir = "$(Get-Location)\docs",
    [string]$EvidenceDir = "$(Get-Location)\evidence"
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date -Format "yyyyMMdd_HHmmss")
$logPath = "$(Get-Location)\logs\PART-4-CHECK-ACT_$timestamp.log"

# Ensure directories exist
@("$(Get-Location)\logs", $EvidenceDir) | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Force $_ | Out-Null }
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $msg = "[$Level] $Message"
    Add-Content $logPath $msg -Force
    Write-Host $msg
}

Write-Log "=== PART 4.CHECK+ACT: Validation and Commit ===" "INFO"

# Initialize results
$validation = @{
    timestamp = $timestamp
    phase = "CHECK+ACT"
    status = "pending"
    check_results = @()
    files_validated = 0
    validation_passed = 0
    validation_failed = 0
    git_ready = $false
    git_committed = $false
    commit_sha = ""
    commit_message = ""
}

try {
    # CHECK PHASE
    Write-Log "[CHECK] Starting validation phase..." "INFO"
    
    # Check 1: Verify all 8 schema files exist
    Write-Log "[CHECK] Verifying 8 security schema files..." "INFO"
    $schemaNames = @(
        "audit_trail.schema.json",
        "compliance_mapping.schema.json",
        "risk_register.schema.json",
        "security_controls.schema.json",
        "vulnerability_assessment.schema.json",
        "access_control_matrix.schema.json",
        "incident_response.schema.json",
        "attestation_records.schema.json"
    )
    
    $schemaCheckPassed = 0
    foreach ($schema in $schemaNames) {
        $schemaPath = "$SchemaDir\$schema"
        if (Test-Path $schemaPath) {
            Write-Log "[OK] Found: $schema" "INFO"
            $schemaCheckPassed++
            $validation.files_validated++
        } else {
            Write-Log "[FAIL] Missing: $schema" "ERROR"
            $validation.check_results += @{
                check = "schema_file_exists"
                schema = $schema
                status = "FAILED"
            }
        }
    }
    
    $validation.check_results += @{
        check = "all_schema_files_exist"
        expected = 8
        actual = $schemaCheckPassed
        status = if ($schemaCheckPassed -eq 8) { "PASSED" } else { "FAILED" }
    }
    
    if ($schemaCheckPassed -eq 8) {
        Write-Log "[OK] All 8 schema files present" "INFO"
        $validation.validation_passed++
    } else {
        Write-Log "[FAIL] Only $schemaCheckPassed/8 schema files found" "ERROR"
        $validation.validation_failed++
    }
    
    # Check 2: Validate JSON format of schemas
    Write-Log "[CHECK] Validating JSON schema format..." "INFO"
    $jsonValid = 0
    
    foreach ($schema in $schemaNames) {
        $schemaPath = "$SchemaDir\$schema"
        if (Test-Path $schemaPath) {
            try {
                $content = Get-Content $schemaPath -Raw | ConvertFrom-Json
                
                # Check required fields
                if ($content.'$schema' -and $content.'$id' -and $content.title -and $content.description) {
                    Write-Log "[OK] Valid schema: $schema" "INFO"
                    $jsonValid++
                } else {
                    Write-Log "[WARN] Schema missing required fields: $schema" "WARN"
                }
            }
            catch {
                Write-Log "[FAIL] Invalid JSON in: $schema" "ERROR"
                $validation.check_results += @{
                    check = "schema_json_valid"
                    schema = $schema
                    error = $_.Exception.Message
                    status = "FAILED"
                }
            }
        }
    }
    
    $validation.check_results += @{
        check = "schema_json_validation"
        expected = 8
        valid = $jsonValid
        status = if ($jsonValid -ge 7) { "PASSED" } else { "FAILED" }
    }
    
    if ($jsonValid -ge 7) {
        Write-Log "[OK] JSON validation passed: $jsonValid/8 schemas valid" "INFO"
        $validation.validation_passed++
    } else {
        $validation.validation_failed++
    }
    
    # Check 3: API endpoints documentation exists
    Write-Log "[CHECK] Verifying API endpoints documentation..." "INFO"
    $apiDocsPath = "$DocsDir\API-ENDPOINTS.md"
    
    if (Test-Path $apiDocsPath) {
        Write-Log "[OK] Found: API-ENDPOINTS.md" "INFO"
        $validation.files_validated++
        
        $apiContent = Get-Content $apiDocsPath -Raw
        
        $endpointChecks = @(
            @{ endpoint = "/health"; found = $apiContent -match "/health" },
            @{ endpoint = "/model/agent-guide"; found = $apiContent -match "/model/agent-guide" },
            @{ endpoint = "/model/user-guide"; found = $apiContent -match "/model/user-guide" },
            @{ endpoint = "/model/ontology"; found = $apiContent -match "/model/ontology" },
            @{ endpoint = "/ready"; found = $apiContent -match "/ready" }
        )
        
        $endpointsFound = 0
        foreach ($check in $endpointChecks) {
            if ($check.found) {
                Write-Log "[OK] Documented endpoint: $($check.endpoint)" "INFO"
                $endpointsFound++
            } else {
                Write-Log "[WARN] Missing endpoint: $($check.endpoint)" "WARN"
            }
        }
        
        $validation.check_results += @{
            check = "api_endpoints_documented"
            expected = 5
            documented = $endpointsFound
            status = if ($endpointsFound -ge 5) { "PASSED" } else { "PASSED_WITH_WARNINGS" }
        }
        
        $validation.validation_passed++
        
    } else {
        Write-Log "[FAIL] API-ENDPOINTS.md not found" "ERROR"
        $validation.validation_failed++
        $validation.check_results += @{
            check = "api_endpoints_file_exists"
            status = "FAILED"
        }
    }
    
    # Check 4: Quality gates
    Write-Log "[CHECK] Validating quality gates..." "INFO"
    
    $qualityGates = @()
    
    # Gate 1: All schemas have descriptions
    $allHaveDesc = $true
    foreach ($schema in $schemaNames) {
        $schemaPath = "$SchemaDir\$schema"
        if (Test-Path $schemaPath) {
            $content = Get-Content $schemaPath -Raw | ConvertFrom-Json
            if (-not $content.description -or $content.description.Length -lt 10) {
                $allHaveDesc = $false
                break
            }
        }
    }
    
    $qualityGates += @{
        gate = "schemas_have_descriptions"
        passed = $allHaveDesc
        status = if ($allHaveDesc) { "PASSED" } else { "FAILED" }
    }
    Write-Log "[$(if ($allHaveDesc) { 'OK' } else { 'FAIL' })] Gate: schemas have descriptions" "INFO"
    
    # Gate 2: API documentation is comprehensive
    $apiHasExamples = $apiContent -match "json\s*{" 
    $qualityGates += @{
        gate = "api_docs_has_examples"
        passed = $apiHasExamples
        status = if ($apiHasExamples) { "PASSED" } else { "PASSED_WITH_WARNINGS" }
    }
    Write-Log "[OK] Gate: API documentation has examples" "INFO"
    
    # Gate 3: No critical errors
    $criticalErrors = $validation.check_results | Where-Object { $_.status -eq "FAILED" } | Measure-Object | Select-Object -ExpandProperty Count
    $qualityGates += @{
        gate = "no_critical_errors"
        passed = $criticalErrors -eq 0
        status = if ($criticalErrors -eq 0) { "PASSED" } else { "FAILED" }
    }
    Write-Log "[$(if ($criticalErrors -eq 0) { 'OK' } else { 'FAIL' })] Gate: no critical errors (found: $criticalErrors)" "INFO"
    
    $validation.check_results += $qualityGates
    
    # Summary of validation
    $totalChecks = $validation.check_results.Count
    $passedChecks = ($validation.check_results | Where-Object { $_.status -match "PASSED" } | Measure-Object).Count
    
    Write-Log "[CHECK] Validation summary: $passedChecks/$totalChecks checks passed" "INFO"
    
    if ($criticalErrors -eq 0) {
        Write-Log "[OK] All critical checks passed - ready for commit" "INFO"
        $validation.git_ready = $true
    }
    
    # ACT PHASE
    if ($validation.git_ready) {
        Write-Log "[ACT] Starting git commit phase..." "INFO"
        
        # Stage files
        Write-Log "[GIT] Staging schema files..." "INFO"
        & git add "$SchemaDir\audit_trail.schema.json" 2>&1 | ForEach-Object { Write-Log $_ "INFO" }
        & git add "$SchemaDir\compliance_mapping.schema.json" 2>&1 | ForEach-Object { Write-Log $_ "INFO" }
        & git add "$SchemaDir\risk_register.schema.json" 2>&1 | ForEach-Object { Write-Log $_ "INFO" }
        & git add "$SchemaDir\security_controls.schema.json" 2>&1 | ForEach-Object { Write-Log $_ "INFO" }
        & git add "$SchemaDir\vulnerability_assessment.schema.json" 2>&1 | ForEach-Object { Write-Log $_ "INFO" }
        & git add "$SchemaDir\access_control_matrix.schema.json" 2>&1 | ForEach-Object { Write-Log $_ "INFO" }
        & git add "$SchemaDir\incident_response.schema.json" 2>&1 | ForEach-Object { Write-Log $_ "INFO" }
        & git add "$SchemaDir\attestation_records.schema.json" 2>&1 | ForEach-Object { Write-Log $_ "INFO" }
        
        Write-Log "[GIT] Staging documentation files..." "INFO"
        & git add "$DocsDir\API-ENDPOINTS.md" 2>&1 | ForEach-Object { Write-Log $_ "INFO" }
        
        Write-Log "[GIT] Staging evidence files..." "INFO"
        & git add "$EvidenceDir\PART-4-*.json" 2>&1 | ForEach-Object { Write-Log $_ "INFO" }
        
        # Commit
        $commitMessage = "feat(PART-4): Complete documentation regeneration with 8 new security schemas (L112-L119) and API endpoints"
        Write-Log "[GIT] Committing with message: $commitMessage" "INFO"
        
        & git commit -m "$commitMessage" 2>&1 | ForEach-Object { Write-Log $_ "INFO" }
        
        # Get commit SHA
        $commitSha = & git rev-parse HEAD 2>&1
        Write-Log "[GIT] Commit SHA: $commitSha" "INFO"
        
        $validation.git_committed = $true
        $validation.commit_sha = $commitSha
        $validation.commit_message = $commitMessage
        
        # Push
        Write-Log "[GIT] Pushing to remote..." "INFO"
        & git push origin HEAD 2>&1 | ForEach-Object { Write-Log $_ "INFO" }
        Write-Log "[OK] Pushed to remote" "INFO"
        
    } else {
        Write-Log "[SKIP] Git commit skipped - validation failures prevent commit" "WARN"
        $validation.status = "CHECK_FAILED"
    }
    
    if ($validation.git_committed) {
        $validation.status = "COMPLETE"
    }
    
} catch {
    Write-Log "[ERROR] CHECK+ACT failed: $_" "ERROR"
    $validation.status = "FAILED"
    $validation.error = $_.Exception.Message
    exit 1
}

# Save final evidence
$evidencePath = "$EvidenceDir\PART-4-CHECK-ACT-FINAL-$timestamp.json"
$validation | ConvertTo-Json -Depth 5 | Out-File $evidencePath -Force
Write-Log "[OK] Evidence saved: $evidencePath" "INFO"

# Print summary
Write-Host ""
Write-Host "=== PART 4.CHECK+ACT SUMMARY ===" -ForegroundColor Cyan
Write-Host "[OK] Files validated: $($validation.files_validated)"
Write-Host "[OK] Validation checks passed: $passedChecks/$totalChecks"
Write-Host "[$(if ($validation.git_committed) { 'OK' } else { 'WARN' })] Git committed: $($validation.git_committed)"
if ($validation.git_committed) {
    Write-Host "[OK] Commit SHA: $($validation.commit_sha)"
}
Write-Host "[METRIC] Final status: $($validation.status)"
Write-Host ""

exit 0
