param(
    [string]$CloudBase = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io",
    [string]$BackupDir = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
)

Set-StrictMode -Off
$ErrorActionPreference = "Continue"

$LocalModelDir = Join-Path $BackupDir "model"
$SyncManifest = Join-Path $BackupDir "BACKUP-SYNC-MANIFEST.json"

Write-Host ""
Write-Host "=== EVA Data Model - Validate Cloud Sync ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $SyncManifest)) {
    Write-Host "[ERROR] No sync manifest found. Run sync-cloud-to-local.ps1 first." -ForegroundColor Red
    exit 1
}

# Load manifest
$manifest = Get-Content $SyncManifest | ConvertFrom-Json
Write-Host "[OK] Loaded manifest from: $SyncManifest" -ForegroundColor Green
Write-Host "    Last sync: $($manifest.timestamp)" -ForegroundColor Gray
Write-Host "    Objects: $($manifest.total_objects)" -ForegroundColor Gray

Write-Host ""
Write-Host "Validating local backup files..." -ForegroundColor Green

$localFiles = Get-ChildItem $LocalModelDir -Filter "*.json" -ErrorAction SilentlyContinue
$issues = @()

foreach ($file in $localFiles) {
    $layerName = $file.BaseName
    
    try {
        $content = Get-Content $file.FullName | ConvertFrom-Json -ErrorAction Stop
        
        # Count objects in this layer
        if ($content -is [array]) {
            $count = $content.Count
        } else {
            $count = $content.PSObject.Properties.Value[0].Count
        }
        
        Write-Host "  [OK] $($file.Name) - $count objects" -ForegroundColor Gray
        
        # Verify it matches manifest
        if ($manifest.layers.$layerName) {
            if ($count -ne $manifest.layers.$layerName.count) {
                $issues += "Layer '$layerName' mismatch: local=$count, manifest=$($manifest.layers.$layerName.count)"
            }
        }
        
    } catch {
        $issues += "Cannot read file: $($file.Name) - $_"
        Write-Host "  [FAIL] $($file.Name) - Parse error" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== VALIDATION SUMMARY ===" -ForegroundColor Green
Write-Host "Local files: $($localFiles.Count)" -ForegroundColor Cyan
Write-Host "Manifest entries: $($manifest.layers.Count)" -ForegroundColor Cyan

if ($issues.Count -eq 0) {
    Write-Host "Status: VALID - Backup matches manifest" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Status: ISSUES FOUND" -ForegroundColor Yellow
    $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    exit 1
}
