# generate-layer-metadata-index.ps1
# Automatically generate layer-metadata-index.json from Cosmos DB ground truth
param(
    [string]$CosmosUrl = "",
    [string]$CosmosKey = "",
    [switch]$FromKeyVault = $true,
    [switch]$DryRun = $false
)

Write-Host "=== LAYER METADATA INDEX GENERATOR ===" -ForegroundColor Cyan
Write-Host "Generates layer-metadata-index.json from Cosmos DB ground truth`n"

# Get Cosmos credentials
if ($FromKeyVault) {
    Write-Host "[1/4] Retrieving Cosmos credentials from Key Vault..." -ForegroundColor Yellow
    $CosmosUrl = az keyvault secret show --vault-name msubsandkv202603031449 --name cosmos-url --query value -o tsv
    $CosmosKey = az keyvault secret show --vault-name msubsandkv202603031449 --name cosmos-key --query value -o tsv
    
    if (!$CosmosUrl -or !$CosmosKey) {
        Write-Host "  ERROR: Failed to retrieve credentials" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Retrieved: $CosmosUrl" -ForegroundColor Green
}

# Query API for all layer counts (faster than direct Cosmos query)
Write-Host "`n[2/4] Querying Data Model API for layer counts..." -ForegroundColor Yellow
$apiUrl = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

try {
    $summary = Invoke-RestMethod -Uri "$apiUrl/model/agent-summary" -Method Get
    $totalObjects = $summary.total
    Write-Host "  Total objects in Cosmos: $totalObjects" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Failed to query API: $($_.Exception.Message)" -ForegroundColor Red
    exit 2
}

# Convert to layer metadata entries
Write-Host "`n[3/4] Generating metadata entries..." -ForegroundColor Yellow
$metadataEntries = @()
$layerCount = 0
$operationalCount = 0

foreach ($prop in $summary.layers.PSObject.Properties) {
    $layerName = $prop.Name
    $objectCount = $prop.Value
    $layerCount++
    
    # Determine if operational (has data in Cosmos)
    $isOperational = $objectCount -gt 0
    if ($isOperational) {
        $operationalCount++
    }
    
    # Create metadata entry
    $entry = [ordered]@{
        layer_name = $layerName
        operational = $isOperational
        object_count = $objectCount
        priority = "P3"  # Default, can be overridden
        category = "General"  # Default, can be overridden
    }
    
    $metadataEntries += $entry
}

Write-Host "  Processed $layerCount layers ($operationalCount operational)" -ForegroundColor Green

# Load existing metadata to preserve priority/category overrides
$existingMetadataPath = "..\model\layer-metadata-index.json"
$categoryMap = @{}
$priorityMap = @{}

if (Test-Path $existingMetadataPath) {
    Write-Host "`n  Loading existing metadata for priority/category preservation..." -ForegroundColor Gray
    $existingMetadata = Get-Content $existingMetadataPath | ConvertFrom-Json
    
    foreach ($existingLayer in $existingMetadata.layers) {
        $categoryMap[$existingLayer.layer_name] = $existingLayer.category
        $priorityMap[$existingLayer.layer_name] = $existingLayer.priority
    }
    Write-Host "  Preserved $($categoryMap.Count) category/priority mappings" -ForegroundColor Gray
}

# Apply preserved priority/category to new entries
foreach ($entry in $metadataEntries) {
    if ($categoryMap.ContainsKey($entry.layer_name)) {
        $entry.category = $categoryMap[$entry.layer_name]
    }
    if ($priorityMap.ContainsKey($entry.layer_name)) {
        $entry.priority = $priorityMap[$entry.layer_name]
    }
}

# Build final metadata index
$metadataIndex = [ordered]@{
    schema_version = "2.0"
    generated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    generated_by = "generate-layer-metadata-index.ps1"
    source = "Cosmos DB (via API /model/agent-summary)"
    total_layers = $layerCount
    operational_layers = $operationalCount
    layers = $metadataEntries
}

# Preview
Write-Host "`n[4/4] Generated metadata index:" -ForegroundColor Yellow
Write-Host "  Total layers: $layerCount" -ForegroundColor White
Write-Host "  Operational: $operationalCount" -ForegroundColor Green
Write-Host "  Stub (no data): $($layerCount - $operationalCount)" -ForegroundColor Gray
Write-Host "  Generated at: $($metadataIndex.generated_at)" -ForegroundColor White

# Save or dry-run
if ($DryRun) {
    Write-Host "`n=== DRY RUN MODE ===" -ForegroundColor Yellow
    Write-Host "Would write to: $existingMetadataPath" -ForegroundColor Gray
    Write-Host "Preview (first 5 layers):" -ForegroundColor Gray
    $metadataIndex.layers | Select-Object -First 5 | ConvertTo-Json -Depth 5
} else {
    # Backup existing file
    if (Test-Path $existingMetadataPath) {
        $backupPath = $existingMetadataPath -replace '\.json$', ".backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
        Copy-Item $existingMetadataPath $backupPath
        Write-Host "`n  Backed up existing file to: $backupPath" -ForegroundColor Gray
    }
    
    # Write new file
    $metadataIndex | ConvertTo-Json -Depth 10 | Out-File $existingMetadataPath -Encoding UTF8
    Write-Host "`n=== SUCCESS ===" -ForegroundColor Green
    Write-Host "Generated: $existingMetadataPath" -ForegroundColor White
    Write-Host "File size: $((Get-Item $existingMetadataPath).Length) bytes" -ForegroundColor Gray
    
    # Verify
    $verify = Get-Content $existingMetadataPath | ConvertFrom-Json
    Write-Host "`nVerification:" -ForegroundColor Cyan
    Write-Host "  Schema version: $($verify.schema_version)" -ForegroundColor White
    Write-Host "  Total layers: $($verify.total_layers)" -ForegroundColor White
    Write-Host "  Operational: $($verify.operational_layers)" -ForegroundColor Green
    Write-Host "  Generated: $($verify.generated_at)" -ForegroundColor White
}

Write-Host "`n=== COMPLETE ===" -ForegroundColor Cyan

# Usage instructions
Write-Host "`nUsage:" -ForegroundColor Gray
Write-Host "  # Generate from API (default)" -ForegroundColor Gray
Write-Host "  .\generate-layer-metadata-index.ps1" -ForegroundColor White
Write-Host "" -ForegroundColor Gray
Write-Host "  # Dry-run (preview without writing)" -ForegroundColor Gray
Write-Host "  .\generate-layer-metadata-index.ps1 -DryRun" -ForegroundColor White
Write-Host "" -ForegroundColor Gray
Write-Host "  # Manual Cosmos credentials" -ForegroundColor Gray
Write-Host "  .\generate-layer-metadata-index.ps1 -CosmosUrl '...' -CosmosKey '...' -FromKeyVault:`$false" -ForegroundColor White
