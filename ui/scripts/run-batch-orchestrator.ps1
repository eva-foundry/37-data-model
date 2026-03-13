#!/usr/bin/env pwsh
<#
.SYNOPSIS
Batch Orchestrator Wrapper - Runs Auto-Reviser/Fixer on Batch 1-4 sequentially

.DESCRIPTION
Safer wrapper around the Python orchestrator. Handles logging and error reporting.

.PARAMETER Batch
Batch number(s) to run: 1, 2, 3, 4, or "all"

.PARAMETER Test
Dry-run mode (preview without changes)

.EXAMPLE
# Run Batch 1 (20 layers, ~25 min)
.\run-batch-orchestrator.ps1 -Batch 1

# Run all batches (111 layers, ~2.5 hours)
.\run-batch-orchestrator.ps1 -Batch all

# Dry-run preview
.\run-batch-orchestrator.ps1 -Batch 1 -Test
#>

param(
    [string]$Batch = "1",
    [switch]$Test
)

# Configuration
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$UiRoot = Join-Path (Split-Path -Parent $ScriptRoot) "components" -ErrorAction SilentlyContinue
if (-not (Test-Path $UiRoot)) {
    $UiRoot = "C:\eva-foundry\37-data-model\ui"
}

$OrchestratorScript = Join-Path $ScriptRoot "batch-orchestrator-sequential.py"
$PythonExe = "c:\eva-foundry\.venv\Scripts\python.exe"

# Validate files exist
if (-not (Test-Path $PythonExe)) {
    Write-Host "[ERROR] Python executable not found: $PythonExe" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $OrchestratorScript)) {
    Write-Host "[ERROR] Orchestrator script not found: $OrchestratorScript" -ForegroundColor Red
    exit 1
}

# Build command
$cmd = @($OrchestratorScript)

if ($Batch -eq "all") {
    $cmd += "--all"
} else {
    $cmd += "--batch", $Batch
}

if ($Test) {
    $cmd += "--test"
}

# Log header
Write-Host "[INFO] Batch Orchestrator Starting" -ForegroundColor Cyan
Write-Host "[INFO] Batch(es): $Batch" -ForegroundColor Cyan
Write-Host "[INFO] Python: $PythonExe" -ForegroundColor Cyan
Write-Host "[INFO] Script: $OrchestratorScript" -ForegroundColor Cyan
Write-Host "[INFO] UI Root: $UiRoot" -ForegroundColor Cyan

if ($Test) {
    Write-Host "[WARN] DRY-RUN MODE (no actual changes)" -ForegroundColor Yellow
}

Write-Host "[INFO] Starting execution..." -ForegroundColor Green
Write-Host ""

# Run orchestrator
$startTime = Get-Date
try {
    & $PythonExe @cmd
    $exitCode = $LASTEXITCODE
}
catch {
    Write-Host "[ERROR] Execution failed: $_" -ForegroundColor Red
    $exitCode = 1
}

# Summary
$elapsed = (Get-Date) - $startTime
Write-Host ""
Write-Host "[INFO] Execution time: $($elapsed.TotalMinutes.ToString('F1')) minutes" -ForegroundColor Cyan
Write-Host "[INFO] Exit code: $exitCode" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "[OK] Batch orchestrator completed successfully" -ForegroundColor Green
    Write-Host "[INFO] Check evidence files in: C:\eva-foundry\37-data-model\evidence\" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Batch orchestrator failed with exit code $exitCode" -ForegroundColor Red
    Write-Host "[INFO] Review error output above" -ForegroundColor Yellow
}

exit $exitCode
