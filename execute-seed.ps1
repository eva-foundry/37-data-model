# execute-seed.ps1 - Call seed endpoint with proper error handling
param()

Write-Host "=== DATA MODEL SEED OPERATION ===" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Step 1: Get admin token
Write-Host "`n[1/3] Retrieving admin token from Key Vault..." -ForegroundColor Yellow
try {
    $adminToken = az keyvault secret show --vault-name msubsandkv202603031449 --name admin-token --query value -o tsv
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to retrieve admin token"
    }
    Write-Host "  Token retrieved: $($adminToken.Length) characters" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Call seed endpoint
Write-Host "`n[2/3] Calling POST /model/admin/seed..." -ForegroundColor Yellow
$url = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/admin/seed"
$headers = @{
    Authorization = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -ErrorAction Stop
    Write-Host "  SUCCESS: Seed operation completed" -ForegroundColor Green
    Write-Host "  Message: $($response.message)" -ForegroundColor White
    Write-Host "  Duration: $($response.duration_seconds)s" -ForegroundColor White
    Write-Host "  Objects seeded: $($response.objects_seeded)" -ForegroundColor White
    Write-Host "  Layers processed: $($response.layers_processed)" -ForegroundColor White
    
    # Save evidence
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $evidencePath = "evidence/seed-success_$timestamp.json"
    $response | ConvertTo-Json -Depth 10 | Out-File $evidencePath -Encoding UTF8
    Write-Host "  Evidence saved: $evidencePath" -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Step 3: Verify operational layer count
Write-Host "`n[3/3] Verifying operational layer count..." -ForegroundColor Yellow
try {
    $guideUrl = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/agent-guide"
    $guide = Invoke-RestMethod -Uri $guideUrl -ErrorAction Stop
    $layerCount = $guide.layers_available.Count
    
    Write-Host "  Operational layers: $layerCount" -ForegroundColor White
    
    if ($layerCount -ge 91) {
        Write-Host "`n=== SUCCESS: Target of 91+ operational layers achieved! ===" -ForegroundColor Green
    } elseif ($layerCount -gt 51) {
        Write-Host "`n=== PARTIAL: Improved from 51 to $layerCount (target: 91) ===" -ForegroundColor Yellow
    } else {
        Write-Host "`n=== WARNING: Still at $layerCount operational layers (target: 91) ===" -ForegroundColor Red
    }
} catch {
    Write-Host "  ERROR: Could not verify layer count" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== OPERATION COMPLETE ===" -ForegroundColor Cyan
