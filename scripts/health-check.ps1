param(
    [string]$CloudBase = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io",
    [int]$TimeoutSeconds = 10
)

Set-StrictMode -Off
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=== EVA Data Model - Cloud API Health Check ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking: $CloudBase" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod "$CloudBase/health" -TimeoutSec $TimeoutSeconds -ErrorAction Stop
    
    Write-Host "[OK] Cloud API is HEALTHY" -ForegroundColor Green
    Write-Host ""
    Write-Host "Status Details:" -ForegroundColor Gray
    $response | Format-Table -AutoSize | Out-Host
    
    exit 0
    
} catch {
    Write-Host "[FAIL] Cloud API is UNAVAILABLE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If cloud is down, you can re-enable local service on port 8010:" -ForegroundColor Yellow
    Write-Host "  powershell -File .\scripts\restore-from-backup.ps1" -ForegroundColor Gray
    Write-Host ""
    
    exit 1
}
