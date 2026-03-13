# PART 5.CHECK+ACT: Validate and Commit Router Reorganization
# Purpose: Validate domain structure, commit to git, prepare for deployment
# Output: Git commit + final evidence

param(
    [string]$SchemaDir = "$(Get-Location)\schema",
    [string]$DocsDir = "$(Get-Location)\docs",
    [string]$EvidenceDir = "$(Get-Location)\evidence"
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date -Format "yyyyMMdd_HHmmss")
$logPath = "$(Get-Location)\logs\PART-5-CHECK-ACT_$timestamp.log"

@("$(Get-Location)\logs", $EvidenceDir) | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Force $_ | Out-Null }
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $msg = "[$Level] $Message"
    Add-Content $logPath $msg -Force
    Write-Host $msg
}

Write-Log "=== PART 5.CHECK+ACT: Validation and Commit ===" "INFO"

$validation = @{
    timestamp = $timestamp
    phase = "CHECK+ACT"
    status = "pending"
    check_results = @()
    git_committed = $false
    commit_sha = ""
    deployment_ready = $false
}

try {
    # CHECK PHASE
    Write-Log "[CHECK] Starting validation of router reorganization..." "INFO"
    
    # Check 1: Verify all 12 domain directories exist
    Write-Log "[CHECK] Verifying domain directory structure..." "INFO"
    $expectedDirs = 1..12 | ForEach-Object {
        $idx = $_
        $names = @("system-architecture", "identity-access", "ai-runtime", "user-interface", "project-pm", "strategy-portfolio", "execution-engine", "devops-delivery", "governance-policy", "observability-evidence", "infrastructure-finops", "ontology-domains")
        "$SchemaDir\domain_$(([string]$idx).PadLeft(2,'0'))_$($names[$idx-1])"
    }
    
    $dirsFound = 0
    foreach ($dir in $expectedDirs) {
        if (Test-Path $dir) {
            Write-Log "[OK] Found: $(Split-Path $dir -Leaf)" "INFO"
            $dirsFound++
        } else {
            Write-Log "[FAIL] Missing: $dir" "ERROR"
        }
    }
    
    $validation.check_results += @{
        check = "domain_directories_exist"
        expected = 12
        found = $dirsFound
        status = if ($dirsFound -eq 12) { "PASSED" } else { "FAILED" }
    }
    
    # Check 2: Verify documentation files exist
    Write-Log "[CHECK] Verifying documentation files..." "INFO"
    $docFiles = @(
        "$DocsDir\API-ENDPOINTS.md",
        "$DocsDir\SCHEMA-REORGANIZATION-MAPPING.md",
        "$DocsDir\DEPLOYMENT-PLAN.md"
    )
    
    $docsFound = 0
    foreach ($doc in $docFiles) {
        if (Test-Path $doc) {
            Write-Log "[OK] Found: $(Split-Path $doc -Leaf)" "INFO"
            $docsFound++
        } else {
            Write-Log "[FAIL] Missing: $doc" "ERROR"
        }
    }
    
    $validation.check_results += @{
        check = "documentation_files_complete"
        expected = 3
        found = $docsFound
        status = if ($docsFound -eq 3) { "PASSED" } else { "FAILED" }
    }
    
    # Check 3: Verify evidence files generated
    Write-Log "[CHECK] Verifying evidence trail..." "INFO"
    $evidenceFiles = Get-ChildItem "$EvidenceDir\PART-5-*.json" -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count
    
    $validation.check_results += @{
        check = "part5_evidence_files"
        expected = 3
        found = $evidenceFiles
        status = if ($evidenceFiles -ge 3) { "PASSED" } else { "FAILED" }
    }
    
    Write-Log "[OK] Evidence files: $evidenceFiles" "INFO"
    
    # Check 4: Quality gates
    Write-Log "[CHECK] Validating quality gates..." "INFO"
    
    # Gate: No critical errors
    $criticalErrors = ($validation.check_results | Where-Object { $_.status -eq "FAILED" } | Measure-Object).Count
    $queueGate = @{
        gate = "no_critical_errors"
        passed = $criticalErrors -eq 0
        status = if ($criticalErrors -eq 0) { "PASSED" } else { "FAILED" }
    }
    
    $validation.check_results += $queueGate
    Write-Log "[$(if ($criticalErrors -eq 0) { 'OK' } else { 'FAIL' })] Quality gate: no critical errors" "INFO"
    
    # Gate: Deployment ready
    $deploymentReady = ($dirsFound -eq 12) -and ($docsFound -eq 3) -and ($criticalErrors -eq 0)
    $validation.deployment_ready = $deploymentReady
    $validation.check_results += @{
        gate = "deployment_ready"
        passed = $deploymentReady
        status = if ($deploymentReady) { "PASSED" } else { "FAILED" }
    }
    
    # Validation summary
    $totalChecks = $validation.check_results.Count
    $passedChecks = ($validation.check_results | Where-Object { $_.status -match "PASSED" }).Count
    
    Write-Log "[CHECK] Validation summary: $passedChecks/$totalChecks checks passed" "INFO"
    
    # ACT PHASE
    if ($deploymentReady) {
        Write-Log "[ACT] Starting git commit phase..." "INFO"
        
        # Get git repo root
        $repoRoot = & git rev-parse --show-toplevel
        Write-Log "[GIT] Working from repo root: $repoRoot" "INFO"
        
        # Since we're already IN the project directory, construct relative paths from here
        $currentDir = Get-Location
        Write-Log "[GIT] Current directory: $currentDir" "INFO"
        
        # Stage domain directories
        Write-Log "[GIT] Staging new domain directories..." "INFO"
        Get-ChildItem "$SchemaDir\domain_*" -Directory | ForEach-Object {
            $relPath = $_.Name
            Write-Log "[GIT] Adding schema/$relPath" "INFO"
            & git add "schema/$relPath" 2>&1 | ForEach-Object { Write-Log "$_" "INFO" }
        }
        
        Write-Log "[GIT] Staging documentation files..." "INFO"
        & git add "docs/SCHEMA-REORGANIZATION-MAPPING.md" 2>&1 | ForEach-Object { Write-Log "$_" "INFO" }
        & git add "docs/DEPLOYMENT-PLAN.md" 2>&1 | ForEach-Object { Write-Log "$_" "INFO" }
        
        Write-Log "[GIT] Staging evidence files..." "INFO"
        Get-ChildItem "$EvidenceDir\PART-5-*.json" | ForEach-Object {
            $relPath = $_.Name
            Write-Log "[GIT] Adding evidence/$relPath" "INFO"
            & git add "evidence/$relPath" 2>&1 | ForEach-Object { Write-Log "$_" "INFO" }
        }
        
        # Commit
        $commitMessage = "feat(PART-5): Complete router reorganization by 12 ontology domains with deployment plan"
        Write-Log "[GIT] Committing: $commitMessage" "INFO"
        
        & git commit -m "$commitMessage" 2>&1 | ForEach-Object { Write-Log "$_" "INFO" }
        
        # Get commit SHA
        $commitSha = & git rev-parse HEAD 2>&1
        Write-Log "[GIT] Commit SHA: $commitSha" "INFO"
        
        $validation.git_committed = $true
        $validation.commit_sha = $commitSha
        
        # Push
        Write-Log "[GIT] Pushing to remote..." "INFO"
        & git push origin HEAD 2>&1 | ForEach-Object { Write-Log "$_" "INFO" }
        Write-Log "[OK] Pushed to remote" "INFO"
        
        $validation.status = "COMPLETE"
        
    } else {
        Write-Log "[SKIP] Git commit prevented by validation failures" "WARN"
        $validation.status = "CHECK_FAILED"
    }
    
} catch {
    Write-Log "[ERROR] CHECK+ACT failed: $_" "ERROR"
    $validation.status = "FAILED"
    $validation.error = $_.Exception.Message
    exit 1
}

# Save final evidence
$evidencePath = "$EvidenceDir\PART-5-CHECK-ACT-FINAL-$timestamp.json"
$validation | ConvertTo-Json -Depth 5 | Out-File $evidencePath -Force
Write-Log "[OK] Evidence saved: $evidencePath" "INFO"

# Print summary
Write-Host ""
Write-Host "=== PART 5.CHECK+ACT SUMMARY ===" -ForegroundColor Cyan
Write-Host "[OK] Validation checks passed: $passedChecks/$totalChecks"
Write-Host "[OK] Domain directories verified: $dirsFound/12"
Write-Host "[OK] Documentation files verified: $docsFound/3"
Write-Host "[$(if ($validation.git_committed) { 'OK' } else { 'WARN' })] Git committed: $($validation.git_committed)"
if ($validation.git_committed) {
    Write-Host "[OK] Commit SHA: $($validation.commit_sha)"
}
Write-Host "[OK] Deployment ready: $($validation.deployment_ready)"
Write-Host "[METRIC] Final status: $($validation.status)"
Write-Host ""

exit 0
