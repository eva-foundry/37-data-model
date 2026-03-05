param(
    [int]$Port = 8010,
    [string]$BackupDir = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
)

Set-StrictMode -Off
$ErrorActionPreference = "Continue"

$LocalModelDir = Join-Path $BackupDir "model"
$PythonEnv = Join-Path (Split-Path -Parent $BackupDir) ".venv\Scripts\python.exe"

Write-Host ""
Write-Host "=== EVA Data Model - Restore from Backup ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "USE THIS ONLY IF CLOUD API IS DOWN FOR EXTENDED TIME" -ForegroundColor Yellow
Write-Host "After cloud is restored, run sync-cloud-to-local.ps1 to re-sync" -ForegroundColor Yellow
Write-Host ""

# Verify backup files exist
if (-not (Test-Path $LocalModelDir)) {
    Write-Host "[ERROR] Backup directory not found: $LocalModelDir" -ForegroundColor Red
    exit 1
}

$backupFiles = Get-ChildItem $LocalModelDir -Filter "*.json" | Measure-Object
if ($backupFiles.Count -eq 0) {
    Write-Host "[ERROR] No backup files found in: $LocalModelDir" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Found $($backupFiles.Count) backup files" -ForegroundColor Green

# Check if server is already running
$running = Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*api.server*" }

if ($running) {
    Write-Host ""
    Write-Host "[INFO] Local service already running on port $Port" -ForegroundColor Gray
    $health = $null
    try {
        $health = Invoke-RestMethod "http://localhost:$Port/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "[OK] Service is healthy" -ForegroundColor Green
        exit 0
    } catch {
        Write-Host "[WARN] Service appears stuck, restarting..." -ForegroundColor Yellow
        Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
        Start-Sleep 2
    }
}

# Start the service
Write-Host ""
Write-Host "Starting local service on port $Port..." -ForegroundColor Green

if (-not (Test-Path $PythonEnv)) {
    Write-Host "[ERROR] Python venv not found at: $PythonEnv" -ForegroundColor Red
    exit 1
}

try {
    $proc = Start-Process -FilePath $PythonEnv `
        -ArgumentList "-m", "uvicorn", "api.server:app", "--port", $Port `
        -WorkingDirectory $BackupDir `
        -ErrorAction Stop `
        -NoNewWindow `
        -PassThru
    
    Write-Host "[OK] Service started with PID $($proc.Id)" -ForegroundColor Green
    
    # Wait for startup
    Write-Host "Waiting for service to be ready..." -ForegroundColor Gray
    Start-Sleep 5
    
    # Test health
    try {
        $health = Invoke-RestMethod "http://localhost:$Port/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "[OK] Service is HEALTHY and responding on port $Port" -ForegroundColor Green
        Write-Host ""
        Write-Host "Local backup service available at: http://localhost:$Port" -ForegroundColor Cyan
        exit 0
    } catch {
        Write-Host "[WARN] Service started but health check failed" -ForegroundColor Yellow
        Write-Host "Please check logs and try again" -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "[ERROR] Failed to start service: $_" -ForegroundColor Red
    exit 1
}
