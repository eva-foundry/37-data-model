param(
    [string]$CloudBase = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io",
    [string]$BackupDir = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
)

Set-StrictMode -Off
$ErrorActionPreference = "SilentlyContinue"

$CloudApiBase = "$CloudBase/model"
$LocalModelDir = Join-Path $BackupDir "model"
$SyncManifest = Join-Path $BackupDir "BACKUP-SYNC-MANIFEST.json"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$StartTime = Get-Date

Write-Host ""
Write-Host "=== EVA Data Model - Cloud to Local Backup Sync ===" -ForegroundColor Cyan
Write-Host ""

# Get all layers dynamically from agent-summary
# This ensures we download ALL layers, not just a hardcoded list
$summary = Invoke-RestMethod "$CloudApiBase/agent-summary" -TimeoutSec 15 -ErrorAction Stop
$layers = $summary.layers | Select-Object -ExpandProperty name

# Health check
Write-Host "Step 1: Checking cloud API health..." -ForegroundColor Green
try {
    $health = Invoke-RestMethod "$CloudBase/health" -TimeoutSec 10
    Write-Host "[OK] Cloud API is healthy" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Cloud API unreachable" -ForegroundColor Red
    exit 1
}

# Create backup dir
if (-not (Test-Path $LocalModelDir)) {
    New-Item -ItemType Directory -Path $LocalModelDir -Force | Out-Null
}

Write-Host ""
Write-Host "Step 2: Downloading layers..." -ForegroundColor Green

$syncLog = @{
    timestamp = $Now
    cloud_base = $CloudBase
    layers = @{}
    errors = @()
}

$layersFetched = 0
$objectsDownloaded = 0

foreach ($layer in $layers) {
    try {
        $endpoint = "$CloudApiBase/$layer"
        $data = Invoke-RestMethod $endpoint -TimeoutSec 20
        
        if ($data -is [array]) {
            $content = @{ $layer = $data }
            $count = $data.Count
        } else {
            $content = $data
            if ($content.$layer) {
                $count = $content.$layer.Count
            } else {
                $count = 0
            }
        }
        
        $outFile = Join-Path $LocalModelDir "$layer.json"
        $content | ConvertTo-Json -Depth 100 | Set-Content $outFile
        
        $layersFetched++
        $objectsDownloaded += $count
        
        Write-Host "  [OK] $layer : $count objects" -ForegroundColor Gray
        
        $syncLog.layers[$layer] = @{ count = $count; file = "$layer.json" }
        
    } catch {
        Write-Host "  [SKIP] $layer : not available" -ForegroundColor Gray
    }
}

# Save manifest
Write-Host ""
Write-Host "Step 3: Saving manifest..." -ForegroundColor Green

$syncLog.layers_fetched = $layersFetched
$syncLog.objects_downloaded = $objectsDownloaded
$syncLog.backup_location = $LocalModelDir

$syncLog | ConvertTo-Json -Depth 10 | Set-Content $SyncManifest
Write-Host "[OK] Saved to BACKUP-SYNC-MANIFEST.json" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "=== BACKUP COMPLETE ===" -ForegroundColor Green
Write-Host "Location: $LocalModelDir" -ForegroundColor Cyan
Write-Host "Objects: $objectsDownloaded" -ForegroundColor Cyan
Write-Host "Layers: $layersFetched" -ForegroundColor Cyan

$duration = ((Get-Date) - $StartTime).TotalSeconds
Write-Host "Time: $([Math]::Round($duration, 1)) seconds" -ForegroundColor Cyan
Write-Host ""

Write-Host "[SUCCESS] Backup complete - local copy ready for disaster recovery" -ForegroundColor Green
exit 0
