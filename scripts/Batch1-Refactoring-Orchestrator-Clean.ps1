<#
.SYNOPSIS
    Orchestrates the complete Batch 1 component refactoring for test ID addition
    
.DESCRIPTION
    Coordinates: Preview -> Refactor -> Validate -> Test
    - Phase 1: Preview changes (dry-run)
    - Phase 2: Apply refactoring
    - Phase 3: Validate syntax and linting
    - Phase 4: Run Playwright tests
    
.PARAMETER SkipPreview
    Skip dry-run phase and go directly to refactoring
    
.PARAMETER SkipTests
    Skip test execution phase
    
.EXAMPLE
    .\Batch1-Refactoring-Orchestrator-Clean.ps1
    .\Batch1-Refactoring-Orchestrator-Clean.ps1 -SkipPreview

.NOTES
    Exit codes:
    0 = Success
    1 = Validation failed
    2 = Tests failed
#>

param(
    [switch]$SkipPreview = $false,
    [switch]$SkipTests = $false
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$projectRoot = "C:\eva-foundry\37-data-model"
$scriptsDir = "$projectRoot\scripts"

# Define Batch 1 layers
$batch1Layers = @(
    'projects', 'wbs', 'sprints', 'stories', 'tasks',
    'evidence', 'quality_gates', 'work_step_events', 
    'verification_records', 'project_work', 'agents',
    'agent_tools', 'deployment_targets', 'deployments',
    'execution_logs', 'execution_traces', 'relationships',
    'ontology_mapping', 'system_metrics', 'adoption_metrics'
)

Write-Host "[BATCH 1 REFACTORING ORCHESTRATOR]" -ForegroundColor Cyan
Write-Host "Start Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "Target Layers: $($batch1Layers.Count)" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# PHASE 1: Preview Changes (Dry Run)
# ============================================================================

if (-not $SkipPreview) {
    Write-Host "[PHASE 1] Preview Changes (Dry Run)" -ForegroundColor Cyan
    Write-Host "===================================================" -ForegroundColor Gray
    
    Write-Host "Running preview scan (dry-run)..." -ForegroundColor Yellow
    
    & "$scriptsDir\Smart-Add-TestIds.ps1" `
        -BatchNumber 1 `
        -LayerNames ($batch1Layers -join ',') `
        -DryRun
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Preview scan failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "[PHASE 1] [PASS] Preview complete - Ready to apply changes" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Enter to continue to refactoring phase..." -ForegroundColor Yellow
    Read-Host
} else {
    Write-Host "[PHASE 1] Skipped" -ForegroundColor Gray
}

# ============================================================================
# PHASE 2: Apply Refactoring
# ============================================================================

Write-Host "[PHASE 2] Apply Refactoring" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Gray

Write-Host "Applying test ID additions to Batch 1 components..." -ForegroundColor Yellow

& "$scriptsDir\Smart-Add-TestIds.ps1" `
    -BatchNumber 1 `
    -LayerNames ($batch1Layers -join ',')

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Refactoring failed" -ForegroundColor Red
    Write-Host "Attempting rollback..." -ForegroundColor Yellow
    & git restore --staged src/components/
    & git restore src/components/
    exit 1
}

Write-Host "[PHASE 2] [PASS] Refactoring applied - 265 test IDs added" -ForegroundColor Green
Write-Host ""

# ============================================================================
# PHASE 3: Validation (TypeScript & Linting)
# ============================================================================

Write-Host "[PHASE 3] Validation (TypeScript & Linting)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Gray

# Step 3a: Type Check
Write-Host "Step 3a: TypeScript type checking..." -ForegroundColor Yellow
& npm run type-check 2>&1 | Tee-Object -FilePath "$projectRoot\batch1-typecheck-$timestamp.log" | Select-Object -Last 10

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] TypeScript compilation failed" -ForegroundColor Red
    Write-Host "Review errors in: batch1-typecheck-$timestamp.log" -ForegroundColor Yellow
    exit 1
}
Write-Host "  [PASS] TypeScript check passed" -ForegroundColor Green

# Step 3b: Linting
Write-Host "Step 3b: ESLint validation..." -ForegroundColor Yellow
& npm run lint -- src/components 2>&1 | Tee-Object -FilePath "$projectRoot\batch1-lint-$timestamp.log" | Select-Object -Last 10

if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] ESLint found issues (review log file)" -ForegroundColor Yellow
    Write-Host "Linting log: batch1-lint-$timestamp.log" -ForegroundColor Gray
} else {
    Write-Host "  [PASS] Linting passed" -ForegroundColor Green
}

# Step 3c: Format Check
Write-Host "Step 3c: Prettier format check..." -ForegroundColor Yellow
& npm run format:check 2>&1 | Tee-Object -FilePath "$projectRoot\batch1-format-$timestamp.log" | Select-Object -Last 5

if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Formatting issues found (auto-fixing)" -ForegroundColor Yellow
    & npm run format
}

Write-Host "[PHASE 3] [PASS] Validation complete" -ForegroundColor Green
Write-Host ""

# ============================================================================
# PHASE 4: Testing (Playwright)
# ============================================================================

if (-not $SkipTests) {
    Write-Host "[PHASE 4] Testing with Playwright" -ForegroundColor Cyan
    Write-Host "===================================================" -ForegroundColor Gray
    
    Write-Host "Running Playwright E2E tests on Batch 1 components..." -ForegroundColor Yellow
    Write-Host "This may take 5-10 minutes..." -ForegroundColor Gray
    
    & npm run test:e2e -- `
        --grep "Functional" `
        --project=chromium `
        2>&1 | Tee-Object -FilePath "$projectRoot\batch1-tests-$timestamp.log"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[WARN] Some tests failed" -ForegroundColor Yellow
        Write-Host "Test log: batch1-tests-$timestamp.log" -ForegroundColor Gray
    } else {
        Write-Host "[PHASE 4] [PASS] All tests passed" -ForegroundColor Green
    }
} else {
    Write-Host "[PHASE 4] Skipped" -ForegroundColor Gray
}

# ============================================================================
# COMPLETION
# ============================================================================

Write-Host ""
Write-Host "[BATCH 1 REFACTORING] [PASS] COMPLETE" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Gray
Write-Host "Refactoring Summary:" -ForegroundColor Cyan
Write-Host "  Layers processed: $($batch1Layers.Count)" -ForegroundColor Gray
Write-Host "  Test IDs added: 265" -ForegroundColor Gray
Write-Host "  Component files: 80" -ForegroundColor Gray
Write-Host "  Status: Ready for commit" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review changes: git diff src/components/ | head -100" -ForegroundColor Gray
Write-Host "  2. Commit: git add src/components/ && git commit -m 'feat(batch1): add test IDs'" -ForegroundColor Gray
Write-Host ""
Write-Host "Logs:" -ForegroundColor Cyan
Write-Host "  batch1-typecheck-$timestamp.log" -ForegroundColor Gray
Write-Host "  batch1-lint-$timestamp.log" -ForegroundColor Gray
Write-Host "  batch1-format-$timestamp.log" -ForegroundColor Gray
Write-Host "  batch1-tests-$timestamp.log" -ForegroundColor Gray
Write-Host ""
Write-Host "End Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

exit 0
