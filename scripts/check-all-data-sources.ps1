# Check All Potential Data Sources for Missing 3,212 WBS Objects
# Created: March 6, 2026
# Purpose: RCA follow-up - verify user's suggestion to check GitHub and old endpoint

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  🔍 COMPREHENSIVE DATA SOURCE CHECK                           ║" -ForegroundColor Magenta
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

$results = @{}
$foundDataSource = $false

# ==============================================================================
# 1. CHECK GITHUB REMOTE REPOSITORY
# ==============================================================================
Write-Host "1️⃣ GITHUB REMOTE REPOSITORY (origin/main)" -ForegroundColor Cyan
Write-Host "   Checking if data was pushed but not pulled locally..." -ForegroundColor Gray

try {
    Push-Location $PSScriptRoot\..
    
    # Fetch latest
    Write-Host "   Fetching from origin..." -ForegroundColor Gray
    git fetch origin main 2>&1 | Out-Null
    
    # Get remote commit
    $remoteCommit = git rev-parse origin/main 2>$null
    $localCommit = git rev-parse main 2>$null
    
    Write-Host "   Remote: $remoteCommit" -ForegroundColor White
    Write-Host "   Local:  $localCommit" -ForegroundColor White
    
    if ($remoteCommit -eq $localCommit) {
        Write-Host "   ✅ In sync" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ OUT OF SYNC - may have unpulled changes!" -ForegroundColor Yellow
    }
    
    # Check wbs.json in remote
    Write-Host "`n   Checking model/wbs.json in origin/main..." -ForegroundColor Gray
    $remoteWbsRaw = git show origin/main:model/wbs.json 2>&1
    
    if ($remoteWbsRaw -match "fatal|error") {
        Write-Host "   ❌ Cannot read wbs.json from remote: $($remoteWbsRaw -split "`n" | Select-Object -First 1)" -ForegroundColor Red
        $results['github'] = @{ status = 'error'; count = 0 }
    } else {
        $remoteWbs = $remoteWbsRaw | ConvertFrom-Json
        $count = $remoteWbs.wbs.Count
        Write-Host "   📊 WBS objects in GitHub remote: $count" -ForegroundColor $(if ($count -gt 3000) { "Green" } else { if ($count -gt 100) { "Yellow" } else { "Red" } })
        
        if ($count -gt 3000) {
            Write-Host "`n   🎉🎉🎉 BREAKTHROUGH!" -ForegroundColor Green -BackgroundColor DarkGreen
            Write-Host "   GitHub remote HAS the complete data!" -ForegroundColor Green
            Write-Host "   ACTION: Pull from remote to restore data" -ForegroundColor Green
            $foundDataSource = $true
        }
        
        $results['github'] = @{ status = 'success'; count = $count }
    }
    
    Pop-Location
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    $results['github'] = @{ status = 'error'; count = 0; error = $_.Exception.Message }
}

# ==============================================================================
# 2. CHECK OLD PRODUCTION ENDPOINT (marco's Cosmos DB)
# ==============================================================================
Write-Host "`n2️⃣ OLD PRODUCTION ENDPOINT (marco-eva-data-model)" -ForegroundColor Cyan
Write-Host "   https://marco-eva-data-model.livelyflower-7990bc7b..." -ForegroundColor Gray

$oldBase = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

try {
    Write-Host "   Testing connection..." -ForegroundColor Gray
    $health = Invoke-RestMethod "$oldBase/health" -TimeoutSec 8 -ErrorAction Stop
    Write-Host "   ✅ Status: $($health.status)" -ForegroundColor Green
    
    # Get total object count
    Write-Host "   Querying agent-summary..." -ForegroundColor Gray
    $summary = Invoke-RestMethod "$oldBase/model/agent-summary" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   📊 Total objects: $($summary.total)" -ForegroundColor $(if ($summary.total -gt 4000) { "Green" } else { "Yellow" })
    Write-Host "   📊 Active layers: $($summary.active_layers)" -ForegroundColor White
    
    # Get WBS count specifically
    Write-Host "   Querying WBS layer..." -ForegroundColor Gray
    $wbsResponse = Invoke-RestMethod "$oldBase/model/wbs/?limit=1" -TimeoutSec 10 -ErrorAction Stop
    $wbsCount = if ($wbsResponse.metadata) { $wbsResponse.metadata.total } else { $wbsResponse.data.Count }
    Write-Host "   📊 WBS objects: $wbsCount" -ForegroundColor $(if ($wbsCount -gt 3000) { "Green" } else { "Yellow" })
    
    if ($summary.total -gt 4000 -and $wbsCount -gt 3000) {
        Write-Host "`n   🎉🎉🎉 BREAKTHROUGH!" -ForegroundColor Green -BackgroundColor DarkGreen
        Write-Host "   Old endpoint HAS the complete data!" -ForegroundColor Green
        Write-Host "   Total: $($summary.total) | WBS: $wbsCount" -ForegroundColor Green
        Write-Host "   ACTION: Export from old Cosmos DB" -ForegroundColor Green
        Write-Host "   Command: GET $oldBase/model/admin/export (if endpoint exists)" -ForegroundColor Gray
        $foundDataSource = $true
    }
    
    $results['old_endpoint'] = @{ status = 'success'; total = $summary.total; wbs = $wbsCount }
    
} catch {
    $msg = $_.Exception.Message
    if ($msg -match "timeout|timed out") {
        Write-Host "   ⏱️ Timeout - container likely scaled to zero" -ForegroundColor Yellow
        Write-Host "   NOTE: Container may still have data, but is unavailable" -ForegroundColor Gray
        Write-Host "   ACTION: Scale up container via Azure Portal to check" -ForegroundColor Gray
        $results['old_endpoint'] = @{ status = 'timeout'; note = 'Container scaled to zero' }
    } elseif ($msg -match "404|Not Found") {
        Write-Host "   ❌ Container deleted or URL changed" -ForegroundColor Red
        $results['old_endpoint'] = @{ status = 'not_found' }
    } else {
        Write-Host "   ❌ Error: $($msg.Split("`n")[0])" -ForegroundColor Red
        $results['old_endpoint'] = @{ status = 'error'; error = $msg }
    }
}

# ==============================================================================
# 3. CHECK eva-data-model-export-20260303
# ==============================================================================
Write-Host "`n3️⃣ EXPORT FOLDER: eva-data-model-export-20260303" -ForegroundColor Cyan
Write-Host "   Searching in C:\AICOE\eva-foundry..." -ForegroundColor Gray

$exportFolder = Get-ChildItem "C:\AICOE\eva-foundry" -Recurse -Directory -Filter "eva-data-model-export-20260303" -Depth 3 -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($exportFolder) {
    Write-Host "   ✅ Found: $($exportFolder.FullName)" -ForegroundColor Green
    
    $jsonFiles = Get-ChildItem $exportFolder.FullName -Recurse -Filter "*.json" -ErrorAction SilentlyContinue
    Write-Host "   📊 JSON files: $($jsonFiles.Count)" -ForegroundColor White
    
    $wbsFile = $jsonFiles | Where-Object { $_.Name -eq "wbs.json" } | Select-Object -First 1
    if ($wbsFile) {
        $wbsData = Get-Content $wbsFile.FullName | ConvertFrom-Json
        $wbsCount = $wbsData.wbs.Count
        Write-Host "   📊 WBS objects: $wbsCount" -ForegroundColor $(if ($wbsCount -gt 3000) { "Green" } else { "Red" })
        
        if ($wbsCount -gt 3000) {
            Write-Host "`n   🎉 DATA FOUND in export folder!" -ForegroundColor Green
            Write-Host "   Location: $($wbsFile.FullName)" -ForegroundColor Green
            $foundDataSource = $true
        }
        
        $results['export_20260303'] = @{ status = 'success'; count = $wbsCount; path = $wbsFile.FullName }
    } else {
        Write-Host "   ❌ No wbs.json found in export" -ForegroundColor Red
        $results['export_20260303'] = @{ status = 'no_wbs' }
    }
} else {
    Write-Host "   ❌ Export folder not found" -ForegroundColor Red
    $results['export_20260303'] = @{ status = 'not_found' }
}

# ==============================================================================
# 4. CHECK LOCAL ARCHIVE (already known to have data)
# ==============================================================================
Write-Host "`n4️⃣ LOCAL ARCHIVE: model-archive-disabled-20260305-1136" -ForegroundColor Cyan
Write-Host "   (Known source from RCA)" -ForegroundColor Gray

$archivePath = "C:\AICOE\eva-foundry\37-data-model\model-archive-disabled-20260305-1136"
if (Test-Path $archivePath) {
    $wbsArchive = Get-Content "$archivePath\wbs.json" | ConvertFrom-Json
    Write-Host "   ✅ Archive exists" -ForegroundColor Green
    Write-Host "   📊 WBS objects: $($wbsArchive.wbs.Count)" -ForegroundColor Green
    Write-Host "   📁 Location: $archivePath" -ForegroundColor White
    $results['archive'] = @{ status = 'success'; count = $wbsArchive.wbs.Count }
} else {
    Write-Host "   ❌ Archive missing!" -ForegroundColor Red
    $results['archive'] = @{ status = 'missing' }
}

# ==============================================================================
# 5. CHECK AZURE BLOB STORAGE (if configured)
# ==============================================================================
Write-Host "`n5️⃣ AZURE BLOB STORAGE (if configured)" -ForegroundColor Cyan
Write-Host "   Checking for backup storage account..." -ForegroundColor Gray

# Check if Azure CLI available and logged in
try {
    $azAccountCheck = az account show 2>&1
    if ($azAccountCheck -match "error|No subscription") {
        Write-Host "   ⚠️ Azure CLI not logged in" -ForegroundColor Yellow
        Write-Host "   SKIP: Cannot check blob storage" -ForegroundColor Gray
        $results['blob_storage'] = @{ status = 'skipped'; reason = 'not_logged_in' }
    } else {
        Write-Host "   ✅ Azure CLI logged in" -ForegroundColor Green
        Write-Host "   TODO: Search for storage accounts with 'backup' or 'data-model' in name" -ForegroundColor Yellow
        Write-Host "   (Manual check required)" -ForegroundColor Gray
        $results['blob_storage'] = @{ status = 'manual_check_required' }
    }
} catch {
    Write-Host "   ⚠️ Azure CLI not available" -ForegroundColor Yellow
    $results['blob_storage'] = @{ status = 'not_available' }
}

# ==============================================================================
# SUMMARY
# ==============================================================================
Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  📊 SUMMARY                                                   ║" -ForegroundColor Magenta
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

if ($foundDataSource) {
    Write-Host "🎉 COMPLETE DATA FOUND IN:" -ForegroundColor Green
    
    if ($results['github'].count -gt 3000) {
        Write-Host "   ✅ GitHub remote: $($results['github'].count) WBS objects" -ForegroundColor Green
    }
    if ($results['old_endpoint'].wbs -gt 3000) {
        Write-Host "   ✅ Old endpoint: $($results['old_endpoint'].wbs) WBS objects" -ForegroundColor Green
    }
    if ($results['export_20260303'].count -gt 3000) {
        Write-Host "   ✅ Export folder: $($results['export_20260303'].count) WBS objects" -ForegroundColor Green
    }
    
    Write-Host "`n📋 RECOMMENDED ACTIONS:" -ForegroundColor Cyan
    Write-Host "   1. Verify data quality in found source" -ForegroundColor White
    Write-Host "   2. Copy to model/ folder" -ForegroundColor White
    Write-Host "   3. Commit to git (CRITICAL)" -ForegroundColor White
    Write-Host "   4. Reseed production Cosmos DB" -ForegroundColor White
    
} else {
    Write-Host "⚠️ NO EXTERNAL DATA SOURCE FOUND" -ForegroundColor Yellow
    Write-Host "   Only recovery option: model-archive-disabled-20260305-1136" -ForegroundColor White
    Write-Host "`n📋 RECOMMENDED ACTIONS:" -ForegroundColor Cyan
    Write-Host "   1. Use recover-data.ps1 to restore from archive" -ForegroundColor White
    Write-Host "   2. Investigate data provenance before committing" -ForegroundColor White
    Write-Host "   3. Commit to git (CRITICAL)" -ForegroundColor White
    Write-Host "   4. Reseed production Cosmos DB" -ForegroundColor White
}

Write-Host "`n📄 Results saved to: check-all-data-sources-results.json" -ForegroundColor Gray
$results | ConvertTo-Json -Depth 10 | Out-File "check-all-data-sources-results.json"

Write-Host "`n╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta
