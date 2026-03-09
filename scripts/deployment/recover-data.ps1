# CRITICAL: Data Recovery from model-archive-disabled-20260305-1136
# Restores 3,230 lost objects including 3,212 WBS entries from Project 51-ACA

$ErrorActionPreference = "Stop"

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║  ⚠️  CRITICAL DATA RECOVERY OPERATION                        ║" -ForegroundColor Red
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Red

$ARCHIVE_SOURCE = "model-archive-disabled-20260305-1136"
$CURRENT_MODEL = "model"
$BACKUP_DEST = "model-current-backup-$(Get-Date -Format 'yyyyMMdd-HHmm')"

# Verify archive exists
if (-not (Test-Path $ARCHIVE_SOURCE)) {
    Write-Host "❌ ERROR: Archive not found: $ARCHIVE_SOURCE" -ForegroundColor Red
    exit 1
}

# Show data loss assessment
Write-Host "📊 DATA LOSS ASSESSMENT:`n" -ForegroundColor Cyan

$currentTotal = 0
Get-ChildItem $CURRENT_MODEL -Filter "*.json" | ForEach-Object {
    if ($_.Name -ne "eva-model.json") {
        $content = Get-Content $_.FullName | ConvertFrom-Json
        foreach ($prop in $content.PSObject.Properties) {
            if ($prop.Value -is [Array]) {
                $currentTotal += $prop.Value.Count
            }
        }
    }
}

$archiveTotal = 0
$archiveWbs = 0
Get-ChildItem $ARCHIVE_SOURCE -Filter "*.json" | ForEach-Object {
    if ($_.Name -ne "eva-model.json") {
        $content = Get-Content $_.FullName | ConvertFrom-Json
        foreach ($prop in $content.PSObject.Properties) {
            if ($prop.Value -is [Array]) {
                $archiveTotal += $prop.Value.Count
                if ($prop.Name -eq "wbs") {
                    $archiveWbs = $prop.Value.Count
                }
            }
        }
    }
}

Write-Host "Current model/ folder: $currentTotal objects" -ForegroundColor Red
Write-Host "Archive source:        $archiveTotal objects ($archiveWbs WBS)" -ForegroundColor Green
Write-Host "Data to recover:       $($archiveTotal - $currentTotal) objects" -ForegroundColor Yellow
Write-Host ""

# User confirmation
Write-Host "⚠️  This will:" -ForegroundColor Yellow
Write-Host "   1. Backup current model/ → $BACKUP_DEST" -ForegroundColor White
Write-Host "   2. Restore from $ARCHIVE_SOURCE → model/" -ForegroundColor White
Write-Host "   3. Reseed production Cosmos DB with recovered data" -ForegroundColor White
Write-Host ""

$response = Read-Host "Proceed with data recovery? (YES to continue)"

if ($response -ne "YES") {
    Write-Host "`n❌ Cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 1: Backup Current State" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

try {
    Copy-Item $CURRENT_MODEL $BACKUP_DEST -Recurse -Force
    Write-Host "✅ Backup created: $BACKUP_DEST" -ForegroundColor Green
    Write-Host "   ($currentTotal objects preserved)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backup failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 2: Restore from Archive" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

try {
    # Copy all JSON files except eva-model.json
    Get-ChildItem $ARCHIVE_SOURCE -Filter "*.json" | Where-Object { $_.Name -ne "eva-model.json" } | ForEach-Object {
        Copy-Item $_.FullName "$CURRENT_MODEL\$($_.Name)" -Force
        Write-Host "  ✅ Restored: $($_.Name)" -ForegroundColor Green
    }
    
    Write-Host "`n✅ All layer files restored from archive" -ForegroundColor Green
} catch {
    Write-Host "❌ Restore failed: $_" -ForegroundColor Red
    Write-Host "`nRolling back..." -ForegroundColor Yellow
    Remove-Item $CURRENT_MODEL -Recurse -Force
    Copy-Item $BACKUP_DEST $CURRENT_MODEL -Recurse -Force
    Write-Host "✅ Rollback complete - original state restored" -ForegroundColor Green
    exit 1
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 3: Reassemble eva-model.json" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

try {
    & .\assemble-model.ps1
    Write-Host "`n✅ eva-model.json reassembled" -ForegroundColor Green
} catch {
    Write-Host "⚠️  assemble-model.ps1 not found or failed - skip this step" -ForegroundColor Yellow
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 4: Verify Recovery" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$recoveredTotal = 0
$recoveredWbs = 0
Get-ChildItem $CURRENT_MODEL -Filter "*.json" | ForEach-Object {
    if ($_.Name -ne "eva-model.json") {
        $content = Get-Content $_.FullName | ConvertFrom-Json
        foreach ($prop in $content.PSObject.Properties) {
            if ($prop.Value -is [Array]) {
                $recoveredTotal += $prop.Value.Count
                if ($prop.Name -eq "wbs") {
                    $recoveredWbs = $prop.Value.Count
                }
            }
        }
    }
}

Write-Host "Recovered objects: $recoveredTotal (expected: $archiveTotal)" -ForegroundColor $(if ($recoveredTotal -eq $archiveTotal) { "Green" } else { "Yellow" })
Write-Host "WBS objects: $recoveredWbs (expected: $archiveWbs)" -ForegroundColor $(if ($recoveredWbs -eq $archiveWbs) { "Green" } else { "Yellow" })
Write-Host ""

if ($recoveredTotal -ne $archiveTotal) {
    Write-Host "⚠️  Object count mismatch!" -ForegroundColor Yellow
    Write-Host "   Expected: $archiveTotal" -ForegroundColor Gray
    Write-Host "   Got:      $recoveredTotal" -ForegroundColor Gray
    Write-Host "   Diff:     $($archiveTotal - $recoveredTotal)" -ForegroundColor Gray
}

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ DATA RECOVERY COMPLETE                                   ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 NEXT STEPS:`n" -ForegroundColor Cyan
Write-Host "1. Review recovered data:" -ForegroundColor White
Write-Host "   Get-ChildItem model -Filter '*.json' | Measure-Object`n" -ForegroundColor Gray

Write-Host "2. Commit recovered data to git:" -ForegroundColor White
Write-Host "   git add model/" -ForegroundColor Gray
Write-Host "   git commit -m 'fix(data): Recover 3,230 lost objects from archive'`n" -ForegroundColor Gray

Write-Host "3. Reseed production Cosmos DB:" -ForegroundColor White
Write-Host "   `$env:ADMIN_TOKEN = 'dev-admin'" -ForegroundColor Gray
Write-Host "   .\seed-production.ps1`n" -ForegroundColor Gray

Write-Host "4. Verify in production:" -ForegroundColor White
Write-Host "   `$base = 'https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io'" -ForegroundColor Gray
Write-Host "   Invoke-RestMethod `"`$base/model/wbs/`" | Select-Object -ExpandProperty data | Measure-Object`n" -ForegroundColor Gray

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
