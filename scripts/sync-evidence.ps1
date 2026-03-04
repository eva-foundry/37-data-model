# ============================================================================
# Evidence Layer Sync Wrapper for CI/CD Systems
# 
# Usage:
#   pwsh scripts/sync-evidence.ps1 -SourceRepo "C:\AICOE\eva-foundry\51-ACA" 
#                                  -TargetRepo "C:\AICOE\eva-foundry\37-data-model"
#
# Environments:
#   - Works with GitHub Actions (via bash wrapper)
#   - Works with Azure Pipelines
#   - Works with AppVeyor
#   - Works with local development
# ============================================================================

param(
    [string]$SourceRepo = (Resolve-Path "../../51-ACA"),
    [string]$TargetRepo = (Get-Location),
    [switch]$AutoCommit = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURATION
# ============================================================================

$scriptName = "sync-evidence.ps1"
$pythonScript = Join-Path $TargetRepo "scripts" "sync-evidence-from-51-aca.py"
$reportFile = Join-Path $TargetRepo "sync-evidence-report.json"
$evidenceFile = Join-Path $TargetRepo "model" "evidence.json"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "Evidence Layer Synchronization Wrapper" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source Repo:  $SourceRepo"
Write-Host "Target Repo:  $TargetRepo"
Write-Host "Timestamp:    $timestamp"
Write-Host "AutoCommit:   $AutoCommit"
Write-Host ""

# ============================================================================
# VALIDATION
# ============================================================================

Write-Host "Validating environment..."

if (-not (Test-Path $SourceRepo)) {
    Write-Error "Source repo not found: $SourceRepo"
    exit 1
}

if (-not (Test-Path $TargetRepo)) {
    Write-Error "Target repo not found: $TargetRepo"
    exit 1
}

if (-not (Test-Path $pythonScript)) {
    Write-Error "Python script not found: $pythonScript"
    exit 1
}

# Check Python
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Error "Python not found in PATH"
    exit 1
}

Write-Host "✓ All paths validated"
Write-Host ""

# ============================================================================
# STAGE 1: RUN SYNC
# ============================================================================

Write-Host "[STAGE 1] Running evidence sync..."
Write-Host ""

$syncArgs = @(
    $pythonScript,
    $SourceRepo,
    $TargetRepo
)

if ($Verbose) {
    Write-Host "Command: python $($syncArgs -join ' ')"
}

try {
    $output = & python @syncArgs 2>&1
    $exitCode = $LASTEXITCODE
    
    $output | ForEach-Object { Write-Host $_ }
    
    if ($exitCode -ne 0) {
        Write-Error "Sync script failed with exit code $exitCode"
        exit $exitCode
    }
    
    Write-Host ""
    Write-Host "✓ Sync completed successfully"
    Write-Host ""
    
} catch {
    Write-Error "Failed to execute sync script: $_"
    exit 1
}

# ============================================================================
# STAGE 2: READ REPORT
# ============================================================================

Write-Host "[STAGE 2] Reading sync report..."

if (-not (Test-Path $reportFile)) {
    Write-Error "Report file not created: $reportFile"
    exit 1
}

try {
    $report = Get-Content $reportFile | ConvertFrom-Json
    
    $status = $report.status
    $extracted = $report.extracted_count
    $merged = $report.merged_count
    $validated = $report.validated_count
    $errors = $report.failure_count
    $warnings = $report.warning_count
    $duration = $report.duration_ms
    
    Write-Host "Status:        $status"
    Write-Host "Extracted:     $extracted"
    Write-Host "Merged:        $merged"
    Write-Host "Validated:     $validated"
    Write-Host "Errors:        $errors"
    Write-Host "Warnings:      $warnings"
    Write-Host "Duration:      $($duration)ms"
    Write-Host ""
    
    if ($status -ne "PASS") {
        Write-Warning "Sync completed with status: $status"
    }
    
} catch {
    Write-Error "Failed to parse report: $_"
    exit 1
}

# ============================================================================
# STAGE 3: CHECK FOR CHANGES
# ============================================================================

Write-Host "[STAGE 3] Checking for changes..."

$hasChanges = $false

if (Test-Path $evidenceFile) {
    try {
        $evidence = Get-Content $evidenceFile | ConvertFrom-Json
        $recordCount = ($evidence.objects | Measure-Object).Count
        Write-Host "✓ evidence.json contains $recordCount records"
        
        # Check for test/lint failures (merge-blocking gates)
        $testFailures = $evidence.objects | Where-Object { $_.validation.test_result -eq "FAIL" } | Measure-Object | Select-Object -ExpandProperty Count
        $lintFailures = $evidence.objects | Where-Object { $_.validation.lint_result -eq "FAIL" } | Measure-Object | Select-Object -ExpandProperty Count
        
        if ($testFailures -gt 0) {
            Write-Warning "⚠ $testFailures records have test_result=FAIL (merge-blocking)"
        } else {
            Write-Host "✓ No test failures (merge-blocking gate PASS)"
        }
        
        if ($lintFailures -gt 0) {
            Write-Warning "⚠ $lintFailures records have lint_result=FAIL (merge-blocking)"
        } else {
            Write-Host "✓ No lint failures (merge-blocking gate PASS)"
        }
        
        $hasChanges = $merged -gt 0
        
    } catch {
        Write-Error "Failed to validate evidence.json: $_"
        exit 1
    }
}

Write-Host ""

# ============================================================================
# STAGE 4: GIT OPERATIONS (Optional)
# ============================================================================

if ($AutoCommit -and $hasChanges) {
    Write-Host "[STAGE 4] Committing changes to git..."
    
    try {
        Push-Location $TargetRepo
        
        # Check if git is available
        $gitCmd = Get-Command git -ErrorAction SilentlyContinue
        if (-not $gitCmd) {
            Write-Warning "Git not found, skipping commit"
        } else {
            # Check for uncommitted changes
            $status = git status --porcelain
            
            if ($status) {
                Write-Host "Changes detected:"
                $status | ForEach-Object { Write-Host "  $_" }
                
                # Configure git user (if not already configured)
                git config user.name "Evidence Sync Bot" 2>$null
                git config user.email "bot@eva-foundry.local" 2>$null
                
                # Stage files
                git add model/evidence.json
                git add sync-evidence-report.json
                
                # Commit
                $commitMsg = "chore: sync evidence from 51-ACA ($merged records)`n`nAutomatic sync from 51-ACA/.eva/evidence/ to 37-data-model/model/evidence.json`n`nSynced: $timestamp`nRecords: $merged`nValidated: $validated"
                
                git commit -m $commitMsg
                Write-Host "✓ Committed changes"
                Write-Host ""
            } else {
                Write-Host "No changes to commit"
                Write-Host ""
            }
        }
        
    } finally {
        Pop-Location
    }
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "========================================================================" -ForegroundColor Green
Write-Host "Evidence Sync Complete" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "✓ Status:      $status"
Write-Host "✓ Records:     $merged"
Write-Host "✓ Duration:    $($duration)ms"
Write-Host "✓ Timestamp:   $timestamp"
Write-Host ""

if ($hasChanges) {
    Write-Host "ℹ New evidence records synced and committed (if AutoCommit enabled)" -ForegroundColor Yellow
} else {
    Write-Host "ℹ No new records to sync" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Report: $reportFile"

exit 0
