# Seed Production Cosmos DB with Latest Model Data
# Run after deploying new layer files to ensure all data is loaded

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🌱 SEEDING PRODUCTION COSMOS DB WITH LATEST DATA             ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$BASE_URL = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$ADMIN_TOKEN = $env:ADMIN_TOKEN

if (-not $ADMIN_TOKEN) {
    Write-Host "❌ ERROR: ADMIN_TOKEN environment variable not set" -ForegroundColor Red
    Write-Host "`nUsage:" -ForegroundColor Yellow
    Write-Host "  `$env:ADMIN_TOKEN = 'your-admin-token'" -ForegroundColor Gray
    Write-Host "  .\seed-production.ps1`n" -ForegroundColor Gray
    exit 1
}

Write-Host "🔍 Checking current layer status..." -ForegroundColor Yellow

try {
    $layers = Invoke-RestMethod "$BASE_URL/model/layers"
    $emptyLayers = $layers.layers | Where-Object { $_.total_count -eq 0 }
    
    Write-Host "Total layers: $($layers.summary.total_layers)" -ForegroundColor White
    Write-Host "Active layers: $($layers.summary.active_layers)" -ForegroundColor White
    Write-Host "Empty layers: $($emptyLayers.Count)`n" -ForegroundColor Yellow
    
    if ($emptyLayers.Count -gt 0) {
        Write-Host "Empty layers that need data:" -ForegroundColor Yellow
        $emptyLayers | ForEach-Object {
            Write-Host "  - $($_.name)" -ForegroundColor Red
        }
        Write-Host ""
    }
} catch {
    Write-Host "⚠️  Could not query /model/layers: $_" -ForegroundColor Yellow
    Write-Host "Proceeding with seed operation...`n" -ForegroundColor Gray
}

Write-Host "🌱 Calling POST /model/admin/seed..." -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = "Bearer $ADMIN_TOKEN"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod `
        -Uri "$BASE_URL/model/admin/seed" `
        -Method Post `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✅ Seed operation complete!" -ForegroundColor Green
    Write-Host "`nResults:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    if ($response.layers_seeded) {
        Write-Host "`nLayers seeded: $($response.layers_seeded.Count)" -ForegroundColor White
        $response.layers_seeded | ForEach-Object {
            Write-Host "  ✅ $($_.layer): $($_.objects_loaded) objects" -ForegroundColor Green
        }
    }
    
    if ($response.total_objects) {
        Write-Host "`nTotal objects loaded: $($response.total_objects)" -ForegroundColor Green
    }
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message
    
    if ($statusCode -eq 401) {
        Write-Host "❌ Authentication failed (401 Unauthorized)" -ForegroundColor Red
        Write-Host "   Check that ADMIN_TOKEN is correct" -ForegroundColor Yellow
    } elseif ($statusCode -eq 403) {
        Write-Host "❌ Access forbidden (403 Forbidden)" -ForegroundColor Red
        Write-Host "   ADMIN_TOKEN may not have sufficient permissions" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Seed operation failed: $_" -ForegroundColor Red
        if ($errorBody) {
            Write-Host "`nError details:" -ForegroundColor Yellow
            Write-Host $errorBody -ForegroundColor Gray
        }
    }
    exit 1
}

Write-Host "`n🔍 Verifying post-seed layer status..." -ForegroundColor Yellow

try {
    Start-Sleep -Seconds 2  # Give Cosmos a moment to update
    
    $layers = Invoke-RestMethod "$BASE_URL/model/layers"
    $emptyLayers = $layers.layers | Where-Object { $_.total_count -eq 0 }
    
    Write-Host "Total layers: $($layers.summary.total_layers) (expected: 41)" -ForegroundColor White
    Write-Host "Active layers: $($layers.summary.active_layers)" -ForegroundColor White
    Write-Host "Total objects: $($layers.summary.total_objects)" -ForegroundColor White
    Write-Host "Empty layers: $($emptyLayers.Count)`n" -ForegroundColor $(if ($emptyLayers.Count -eq 0) { "Green" } else { "Yellow" })
    
    if ($emptyLayers.Count -gt 0) {
        Write-Host "⚠️  Still empty (may be placeholder layers):" -ForegroundColor Yellow
        $emptyLayers | ForEach-Object {
            Write-Host "  - $($_.name)" -ForegroundColor Gray
        }
    } else {
        Write-Host "✅ All layers populated!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "⚠️  Could not verify post-seed status: $_" -ForegroundColor Yellow
}

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ PRODUCTION DATABASE SEED COMPLETE                         ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
