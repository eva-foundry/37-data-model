# Recover Data from Old Production Endpoint (Option A)
# Created: March 6, 2026
# Purpose: Export complete dataset from marco-eva-data-model (4,339 objects)
# This is the MOST AUTHORITATIVE source - actual production Cosmos DB

param(
    [string]$AdminToken = "dev-admin",
    [switch]$SkipBackup = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  🔄 RECOVER DATA FROM OLD PRODUCTION                          ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

$oldBase = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$exportDir = "recovery-export-$timestamp"
$modelDir = "$PSScriptRoot\..\model"

# ==============================================================================
# STEP 1: Verify Old Endpoint
# ==============================================================================
Write-Host "1️⃣ VERIFY OLD ENDPOINT" -ForegroundColor Cyan
Write-Host "   URL: $oldBase" -ForegroundColor Gray

try {
    $health = Invoke-RestMethod "$oldBase/health" -TimeoutSec 5
    Write-Host "   ✅ Health: $($health.status)" -ForegroundColor Green
    
    $summary = Invoke-RestMethod "$oldBase/model/agent-summary" -TimeoutSec 8
    Write-Host "   📊 Total objects: $($summary.total)" -ForegroundColor Yellow
    Write-Host "   📊 Active layers: $($summary.active_layers)" -ForegroundColor White
    
    if ($summary.total -lt 4000) {
        Write-Host "`n   ⚠️ WARNING: Object count lower than expected!" -ForegroundColor Yellow
        Write-Host "      Expected: ~4,300+ objects" -ForegroundColor Gray
        Write-Host "      Found: $($summary.total) objects" -ForegroundColor Gray
        Write-Host "`n   Continue anyway? (Y/N)" -ForegroundColor Yellow
        $response = Read-Host
        if ($response -ne "Y" -and $response -ne "y") {
            Write-Host "   ❌ Aborted by user" -ForegroundColor Red
            exit 0
        }
    }
} catch {
    Write-Host "   ❌ Old endpoint unavailable: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n   Cannot proceed without access to old production" -ForegroundColor Red
    exit 1
}

# ==============================================================================
# STEP 2: Check for Export Endpoint
# ==============================================================================
Write-Host "`n2️⃣ CHECK EXPORT ENDPOINT" -ForegroundColor Cyan

$exportUrl = "$oldBase/model/admin/export"
Write-Host "   Testing: GET $exportUrl" -ForegroundColor Gray

try {
    $exportTest = Invoke-RestMethod $exportUrl -Headers @{ "X-Admin-Token" = $AdminToken } -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ Export endpoint available!" -ForegroundColor Green
    $useExportEndpoint = $true
} catch {
    if ($_.Exception.Message -match "404|Not Found") {
        Write-Host "   ⚠️ Export endpoint not available (404)" -ForegroundColor Yellow
        Write-Host "      Will use manual layer-by-layer export" -ForegroundColor Gray
        $useExportEndpoint = $false
    } else {
        Write-Host "   ⚠️ Export test failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "      Will try manual export" -ForegroundColor Gray
        $useExportEndpoint = $false
    }
}

# ==============================================================================
# STEP 3: Backup Current Model (unless skipped)
# ==============================================================================
if (-not $SkipBackup) {
    Write-Host "`n3️⃣ BACKUP CURRENT MODEL" -ForegroundColor Cyan
    
    $backupDir = "$PSScriptRoot\..\model-backup-before-recovery-$timestamp"
    Write-Host "   Creating backup: $backupDir" -ForegroundColor Gray
    
    if (Test-Path $backupDir) {
        Write-Host "   ⚠️ Backup directory already exists!" -ForegroundColor Yellow
    } else {
        Copy-Item $modelDir -Destination $backupDir -Recurse -Force
        Write-Host "   ✅ Backup created" -ForegroundColor Green
        
        # Count objects in backup
        $backupFiles = Get-ChildItem $backupDir -Filter "*.json" | Where-Object { $_.Name -ne "eva-model.json" }
        $backupTotal = 0
        foreach ($file in $backupFiles) {
            $data = Get-Content $file.FullName | ConvertFrom-Json
            foreach ($prop in $data.PSObject.Properties) {
                if ($prop.Value -is [Array]) {
                    $backupTotal += $prop.Value.Count
                }
            }
        }
        Write-Host "   📊 Backed up: $backupTotal objects" -ForegroundColor White
    }
} else {
    Write-Host "`n3️⃣ BACKUP SKIPPED (--SkipBackup)" -ForegroundColor Yellow
}

# ==============================================================================
# STEP 4: Export Data from Old Production
# ==============================================================================
Write-Host "`n4️⃣ EXPORT DATA FROM OLD PRODUCTION" -ForegroundColor Cyan

# Create export directory
$exportPath = "$PSScriptRoot\..\$exportDir"
New-Item -ItemType Directory -Path $exportPath -Force | Out-Null
Write-Host "   Export directory: $exportPath" -ForegroundColor Gray

if ($useExportEndpoint) {
    # Use built-in export endpoint
    Write-Host "   Using admin export endpoint..." -ForegroundColor Gray
    
    try {
        $exportData = Invoke-RestMethod $exportUrl -Headers @{ "X-Admin-Token" = $AdminToken } -TimeoutSec 30
        
        # Save export data
        $exportData | ConvertTo-Json -Depth 100 -Compress:$false | Out-File "$exportPath\full-export.json" -Encoding UTF8
        Write-Host "   ✅ Export complete: full-export.json" -ForegroundColor Green
        
        # Extract layers from export
        Write-Host "   Extracting layers..." -ForegroundColor Gray
        foreach ($prop in $exportData.PSObject.Properties) {
            if ($prop.Value -is [Array] -or $prop.Value -is [Object]) {
                $layerFile = "$exportPath\$($prop.Name).json"
                @{ $prop.Name = $prop.Value } | ConvertTo-Json -Depth 100 -Compress:$false | Out-File $layerFile -Encoding UTF8
                Write-Host "      ✅ $($prop.Name).json" -ForegroundColor White
            }
        }
    } catch {
        Write-Host "   ❌ Export failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "      Falling back to manual export..." -ForegroundColor Yellow
        $useExportEndpoint = $false
    }
}

if (-not $useExportEndpoint) {
    # Manual layer-by-layer export
    Write-Host "   Using layer-by-layer export..." -ForegroundColor Gray
    
    # Get list of layers
    $layers = Invoke-RestMethod "$oldBase/model/layers" -TimeoutSec 10
    Write-Host "   Found: $($layers.layers.Count) layers" -ForegroundColor White
    
    $exportedCount = 0
    $failedLayers = @()
    
    foreach ($layer in $layers.layers) {
        try {
            Write-Host "      Exporting: $($layer.name)..." -ForegroundColor Gray -NoNewline
            
            # Export all objects (no pagination limit)
            $layerData = Invoke-RestMethod "$oldBase/model/$($layer.name)/?limit=10000" -TimeoutSec 30
            
            # Extract data array
            $objects = if ($layerData.data) { $layerData.data } else { $layerData.$($layer.name) }
            $count = if ($objects) { $objects.Count } else { 0 }
            
            # Save to file
            $layerFile = "$exportPath\$($layer.name).json"
            @{ $layer.name = $objects } | ConvertTo-Json -Depth 100 -Compress:$false | Out-File $layerFile -Encoding UTF8
            
            Write-Host " ✅ $count objects" -ForegroundColor Green
            $exportedCount += $count
        } catch {
            Write-Host " ❌ FAILED" -ForegroundColor Red
            $failedLayers += $layer.name
        }
    }
    
    Write-Host "`n   📊 Total exported: $exportedCount objects" -ForegroundColor Yellow
    
    if ($failedLayers.Count -gt 0) {
        Write-Host "   ⚠️ Failed layers: $($failedLayers -join ', ')" -ForegroundColor Yellow
    }
}

# ==============================================================================
# STEP 5: Verify Export Quality
# ==============================================================================
Write-Host "`n5️⃣ VERIFY EXPORT QUALITY" -ForegroundColor Cyan

$exportFiles = Get-ChildItem $exportPath -Filter "*.json"
Write-Host "   Files exported: $($exportFiles.Count)" -ForegroundColor White

# Count total objects
$exportTotal = 0
$wbsCount = 0
foreach ($file in $exportFiles) {
    if ($file.Name -eq "full-export.json") { continue }
    
    $data = Get-Content $file.FullName | ConvertFrom-Json
    foreach ($prop in $data.PSObject.Properties) {
        if ($prop.Value -is [Array]) {
            $count = $prop.Value.Count
            $exportTotal += $count
            
            if ($prop.Name -eq "wbs") {
                $wbsCount = $count
            }
        }
    }
}

Write-Host "   📊 Total objects: $exportTotal" -ForegroundColor $(if ($exportTotal -gt 4000) { "Green" } else { "Yellow" })
Write-Host "   📊 WBS objects: $wbsCount" -ForegroundColor $(if ($wbsCount -gt 3000) { "Green" } else { "Red" })

if ($exportTotal -lt 4000) {
    Write-Host "`n   ⚠️ WARNING: Export has fewer objects than expected!" -ForegroundColor Yellow
    Write-Host "      Expected: ~4,300 objects" -ForegroundColor Gray
    Write-Host "      Exported: $exportTotal objects" -ForegroundColor Gray
    Write-Host "`n   Continue anyway? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "Y" -and $response -ne "y") {
        Write-Host "   ❌ Aborted by user" -ForegroundColor Red
        exit 0
    }
}

if ($DryRun) {
    Write-Host "`n🔍 DRY RUN MODE - Stopping before file replacement" -ForegroundColor Yellow
    Write-Host "   Export saved to: $exportPath" -ForegroundColor White
    Write-Host "   Review exported data and run without --DryRun to apply" -ForegroundColor Gray
    exit 0
}

# ==============================================================================
# STEP 6: Replace Local Model Files
# ==============================================================================
Write-Host "`n6️⃣ REPLACE LOCAL MODEL FILES" -ForegroundColor Cyan

Write-Host "   Clearing current model/ directory..." -ForegroundColor Gray
Get-ChildItem $modelDir -Filter "*.json" | Where-Object { $_.Name -ne "eva-model.json" } | Remove-Item -Force

Write-Host "   Copying exported files..." -ForegroundColor Gray
Get-ChildItem $exportPath -Filter "*.json" | Where-Object { $_.Name -ne "full-export.json" } | ForEach-Object {
    Copy-Item $_.FullName -Destination "$modelDir\$($_.Name)" -Force
    Write-Host "      ✅ $($_.Name)" -ForegroundColor White
}

# ==============================================================================
# STEP 7: Reassemble eva-model.json
# ==============================================================================
Write-Host "`n7️⃣ REASSEMBLE eva-model.json" -ForegroundColor Cyan

$layerFiles = Get-ChildItem $modelDir -Filter "*.json" | Where-Object { $_.Name -ne "eva-model.json" }
$combinedModel = @{}

foreach ($file in $layerFiles) {
    $layerData = Get-Content $file.FullName | ConvertFrom-Json
    foreach ($prop in $layerData.PSObject.Properties) {
        $combinedModel[$prop.Name] = $prop.Value
    }
}

$combinedModel | ConvertTo-Json -Depth 100 -Compress:$false | Out-File "$modelDir\eva-model.json" -Encoding UTF8
Write-Host "   ✅ eva-model.json reassembled" -ForegroundColor Green

# ==============================================================================
# STEP 8: Verify Final State
# ==============================================================================
Write-Host "`n8️⃣ VERIFY FINAL STATE" -ForegroundColor Cyan

$finalFiles = Get-ChildItem $modelDir -Filter "*.json"
Write-Host "   Files in model/: $($finalFiles.Count)" -ForegroundColor White

$finalTotal = 0
$finalWbs = 0
foreach ($file in $finalFiles) {
    if ($file.Name -eq "eva-model.json") { continue }
    
    $data = Get-Content $file.FullName | ConvertFrom-Json
    foreach ($prop in $data.PSObject.Properties) {
        if ($prop.Value -is [Array]) {
            $count = $prop.Value.Count
            $finalTotal += $count
            
            if ($prop.Name -eq "wbs") {
                $finalWbs = $count
            }
        }
    }
}

Write-Host "   📊 Total objects: $finalTotal" -ForegroundColor $(if ($finalTotal -gt 4000) { "Green" } else { "Yellow" })
Write-Host "   📊 WBS objects: $finalWbs" -ForegroundColor $(if ($finalWbs -gt 3000) { "Green" } else { "Red" })

# ==============================================================================
# SUMMARY & NEXT STEPS
# ==============================================================================
Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ RECOVERY COMPLETE                                         ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📊 RECOVERY SUMMARY:" -ForegroundColor Cyan
Write-Host "   Before: 1,084 objects (75% loss)" -ForegroundColor Red
Write-Host "   After:  $finalTotal objects (recovered)" -ForegroundColor Green
Write-Host "   WBS:    $finalWbs objects (was 13)" -ForegroundColor Green

Write-Host "`n📋 CRITICAL NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Review data quality:" -ForegroundColor White
Write-Host "      - Check key layers (wbs, evidence, literals)" -ForegroundColor Gray
Write-Host "      - Verify object counts match expectations" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Commit to git (CRITICAL - prevents future loss):" -ForegroundColor White
Write-Host "      cd C:\AICOE\eva-foundry\37-data-model" -ForegroundColor Gray
Write-Host "      git add model/" -ForegroundColor Gray
Write-Host "      git commit -m ""fix(data): Recover $finalTotal objects from old production""" -ForegroundColor Gray
Write-Host "      git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Reseed NEW production (msub-eva-data-model):" -ForegroundColor White
Write-Host "      cd scripts" -ForegroundColor Gray
Write-Host "      .\seed-production.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Verify new production:" -ForegroundColor White
Write-Host "      Check object count at msub endpoint" -ForegroundColor Gray
Write-Host ""
Write-Host "   5. Update RCA document:" -ForegroundColor White
Write-Host "      Document recovery in RCA-DATA-LOSS-20260306.md" -ForegroundColor Gray

Write-Host "`n📁 FILES CREATED:" -ForegroundColor Cyan
Write-Host "   Export: $exportPath" -ForegroundColor White
if (-not $SkipBackup) {
    Write-Host "   Backup: model-backup-before-recovery-$timestamp" -ForegroundColor White
}

Write-Host "`n╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
