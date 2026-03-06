# Recover Data from Existing Export Folder (eva-data-model-export-20260303)
# Created: March 6, 2026
# Purpose: Use validated export folder with 3,212 WBS objects + other layers

param(
    [switch]$SkipBackup = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  🔄 RECOVER FROM EXPORT FOLDER (March 3, 2026)                ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

$exportDir = "C:\AICOE\eva-foundry\37-data-model\eva-data-model-export-20260303\model-data"
$modelDir = "C:\AICOE\eva-foundry\37-data-model\model"
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"

# ==============================================================================
# STEP 1: Verify Export Folder
# ==============================================================================
Write-Host "1️⃣ VERIFY EXPORT FOLDER" -ForegroundColor Cyan
Write-Host "   Source: eva-data-model-export-20260303" -ForegroundColor Gray

if (-not (Test-Path $exportDir)) {
    Write-Host "   ❌ Export folder not found!" -ForegroundColor Red
    Write-Host "      Expected: $exportDir" -ForegroundColor Gray
    exit 1
}

$exportFiles = Get-ChildItem $exportDir -Filter "*.json"
Write-Host "   ✅ Export folder exists" -ForegroundColor Green
Write-Host "   📊 JSON files: $($exportFiles.Count)" -ForegroundColor White

# Count objects in export
$exportTotal = 0
$exportWbs = 0
foreach ($file in $exportFiles) {
    $data = Get-Content $file.FullName | ConvertFrom-Json
    foreach ($prop in $data.PSObject.Properties) {
        if ($prop.Value -is [Array]) {
            $count = $prop.Value.Count
            $exportTotal += $count
            
            if ($prop.Name -eq "wbs") {
                $exportWbs = $count
            }
        }
    }
}

Write-Host "   📊 Total objects: $exportTotal" -ForegroundColor $(if ($exportTotal -gt 4000) { "Green" } else { "Yellow" })
Write-Host "   📊 WBS objects: $exportWbs" -ForegroundColor $(if ($exportWbs -gt 3000) { "Green" } else { "Red" })

if ($exportWbs -lt 3000) {
    Write-Host "`n   ⚠️ WARNING: WBS count lower than expected!" -ForegroundColor Yellow
    Write-Host "      Expected: 3,212 WBS objects" -ForegroundColor Gray
    Write-Host "      Found: $exportWbs WBS objects" -ForegroundColor Gray
    Write-Host "`n   Continue anyway? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "Y" -and $response -ne "y") {
        Write-Host "   ❌ Aborted by user" -ForegroundColor Red
        exit 0
    }
}

# ==============================================================================
# STEP 2: Backup Current Model (unless skipped)
# ==============================================================================
if (-not $SkipBackup) {
    Write-Host "`n2️⃣ BACKUP CURRENT MODEL" -ForegroundColor Cyan
    
    $backupDir = "C:\AICOE\eva-foundry\37-data-model\model-backup-before-recovery-$timestamp"
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
    Write-Host "`n2️⃣ BACKUP SKIPPED (--SkipBackup)" -ForegroundColor Yellow
}

if ($DryRun) {
    Write-Host "`n🔍 DRY RUN MODE - Stopping before file replacement" -ForegroundColor Yellow
    Write-Host "   Export verified: $exportDir" -ForegroundColor White
    Write-Host "   Ready to copy $exportTotal objects ($exportWbs WBS)" -ForegroundColor White
    Write-Host "   Run without --DryRun to apply changes" -ForegroundColor Gray
    exit 0
}

# ==============================================================================
# STEP 3: Replace Local Model Files
# ==============================================================================
Write-Host "`n3️⃣ REPLACE LOCAL MODEL FILES" -ForegroundColor Cyan

Write-Host "   Clearing current model/ directory..." -ForegroundColor Gray
Get-ChildItem $modelDir -Filter "*.json" | Where-Object { $_.Name -ne "eva-model.json" } | Remove-Item -Force

Write-Host "   Copying exported files..." -ForegroundColor Gray
$copiedCount = 0
foreach ($file in $exportFiles) {
    Copy-Item $file.FullName -Destination "$modelDir\$($file.Name)" -Force
    Write-Host "      ✅ $($file.Name)" -ForegroundColor White
    $copiedCount++
}

Write-Host "   📊 Copied: $copiedCount files" -ForegroundColor Green

# ==============================================================================
# STEP 4: Reassemble eva-model.json
# ==============================================================================
Write-Host "`n4️⃣ REASSEMBLE eva-model.json" -ForegroundColor Cyan

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
# STEP 5: Verify Final State
# ==============================================================================
Write-Host "`n5️⃣ VERIFY FINAL STATE" -ForegroundColor Cyan

$finalFiles = Get-ChildItem $modelDir -Filter "*.json"
Write-Host "   Files in model/: $($finalFiles.Count)" -ForegroundColor White

$finalTotal = 0
$finalWbs = 0
$finalLiterals = 0
$finalEvidence = 0

foreach ($file in $finalFiles) {
    if ($file.Name -eq "eva-model.json") { continue }
    
    $data = Get-Content $file.FullName | ConvertFrom-Json
    foreach ($prop in $data.PSObject.Properties) {
        if ($prop.Value -is [Array]) {
            $count = $prop.Value.Count
            $finalTotal += $count
            
            switch ($prop.Name) {
                "wbs" { $finalWbs = $count }
                "literals" { $finalLiterals = $count }
                "evidence" { $finalEvidence = $count }
            }
        }
    }
}

Write-Host "   📊 Total objects: $finalTotal" -ForegroundColor $(if ($finalTotal -gt 4000) { "Green" } else { "Yellow" })
Write-Host "   📊 WBS: $finalWbs" -ForegroundColor $(if ($finalWbs -gt 3000) { "Green" } else { "Red" })
Write-Host "   📊 Literals: $finalLiterals" -ForegroundColor White
Write-Host "   📊 Evidence: $finalEvidence" -ForegroundColor White

# ==============================================================================
# SUMMARY & NEXT STEPS
# ==============================================================================
Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ RECOVERY COMPLETE                                         ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📊 RECOVERY SUMMARY:" -ForegroundColor Cyan
Write-Host "   Source: eva-data-model-export-20260303 (March 3, 2026)" -ForegroundColor White
Write-Host "   Before: 1,084 objects (75% loss)" -ForegroundColor Red
Write-Host "   After:  $finalTotal objects" -ForegroundColor Green
Write-Host "   Recovered: $($finalTotal - 1084) objects" -ForegroundColor Green
Write-Host ""
Write-Host "   Key Layers:" -ForegroundColor White
Write-Host "   - WBS:      $finalWbs objects (was 13)" -ForegroundColor Green
Write-Host "   - Literals: $finalLiterals objects" -ForegroundColor White
Write-Host "   - Evidence: $finalEvidence objects" -ForegroundColor White

Write-Host "`n📋 CRITICAL NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   ✅ Step 1: Review Data Quality" -ForegroundColor White
Write-Host "      # Check key files" -ForegroundColor Gray
Write-Host "      Get-Content model/wbs.json | ConvertFrom-Json | Select -First 3" -ForegroundColor Gray
Write-Host "      Get-Content model/evidence.json | ConvertFrom-Json | Select -First 3" -ForegroundColor Gray
Write-Host ""
Write-Host "   ✅ Step 2: Commit to Git (CRITICAL)" -ForegroundColor White
Write-Host "      cd C:\AICOE\eva-foundry\37-data-model" -ForegroundColor Gray
Write-Host "      git status" -ForegroundColor Gray
Write-Host "      git add model/" -ForegroundColor Gray
Write-Host "      git commit -m ""fix(data): Recover $finalTotal objects from March 3 export" -ForegroundColor Gray
Write-Host ""
Write-Host "      Source: eva-data-model-export-20260303" -ForegroundColor Gray
Write-Host "      Recovered: $($finalTotal - 1084) objects (WBS: $finalWbs, Literals: $finalLiterals, Evidence: $finalEvidence)" -ForegroundColor Gray
Write-Host ""
Write-Host "      RCA: RCA-DATA-LOSS-20260306.md" -ForegroundColor Gray
Write-Host "      Session: 30 (March 6, 2026)""" -ForegroundColor Gray
Write-Host ""
Write-Host "      git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "   ✅ Step 3: Reseed Production (msub-eva-data-model)" -ForegroundColor White
Write-Host "      cd scripts" -ForegroundColor Gray
Write-Host "      .\seed-production.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "   ✅ Step 4: Verify Production" -ForegroundColor White
Write-Host "      # Check new endpoint" -ForegroundColor Gray
Write-Host "      `$base = ""https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io""" -ForegroundColor Gray
Write-Host "      Invoke-RestMethod ""`$base/model/agent-summary""" -ForegroundColor Gray
Write-Host ""
Write-Host "   ✅ Step 5: Update RCA Document" -ForegroundColor White
Write-Host "      Document recovery in RCA-DATA-LOSS-20260306.md" -ForegroundColor Gray

Write-Host "`n📁 FILES CREATED:" -ForegroundColor Cyan
if (-not $SkipBackup) {
    Write-Host "   Backup: model-backup-before-recovery-$timestamp" -ForegroundColor White
}
Write-Host "   Recovered: $copiedCount layer files" -ForegroundColor White
Write-Host "   Total objects: $finalTotal (was 1,084)" -ForegroundColor Green

Write-Host "`n╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
