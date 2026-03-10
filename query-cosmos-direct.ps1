# query-cosmos-direct.ps1 - Query Cosmos DB directly
param()

Write-Host "=== DIRECT COSMOS DB QUERY ===" -ForegroundColor Cyan

# Get Cosmos credentials
Write-Host "`n[1/3] Retrieving Cosmos credentials..." -ForegroundColor Yellow
$cosmosUrl = az keyvault secret show --vault-name msubsandkv202603031449 --name cosmos-url --query value -o tsv
$cosmosKey = az keyvault secret show --vault-name msubsandkv202603031449 --name cosmos-key --query value -o tsv

if (!$cosmosUrl -or !$cosmosKey) {
    Write-Host "  ERROR: Failed to retrieve Cosmos credentials" -ForegroundColor Red
    exit 1
}

Write-Host "  Cosmos URL: $cosmosUrl" -ForegroundColor Green
Write-Host "  Cosmos Key: $($cosmosKey.Length) characters" -ForegroundColor Green

# Install Cosmos module if needed
Write-Host "`n[2/3] Checking Az.CosmosDB module..." -ForegroundColor Yellow
if (!(Get-Module -ListAvailable -Name Az.CosmosDB)) {
    Write-Host "  Installing Az.CosmosDB module..." -ForegroundColor Yellow
    Install-Module -Name Az.CosmosDB -Force -AllowClobber -Scope CurrentUser
}

# Query using REST API instead (more reliable)
Write-Host "`n[3/3] Querying Cosmos DB via REST API..." -ForegroundColor Yellow

# Generate authorization signature
function Get-CosmosAuthHeader {
    param($verb, $resourceType, $resourceId, $date, $key)
    
    $keyBytes = [System.Convert]::FromBase64String($key)
    $text = @($verb.ToLowerInvariant() + "`n" + 
              $resourceType.ToLowerInvariant() + "`n" + 
              $resourceId + "`n" + 
              $date.ToLowerInvariant() + "`n" + 
              "" + "`n")

    $body = [Text.Encoding]::UTF8.GetBytes($text)
    $hmacsha = New-Object System.Security.Cryptography.HMACSHA256
    $hmacsha.Key = $keyBytes
    $signature = [System.Convert]::ToBase64String($hmacsha.ComputeHash($body))
    
    return [System.Web.HttpUtility]::UrlEncode("type=master&ver=1.0&sig=$signature")
}

Add-Type -AssemblyName System.Web

# Query for distinct layers with counts
$verb = "POST"
$resourceType = "docs"
$resourceId = "dbs/eva-data-model/colls/model_objects"
$date = [DateTime]::UtcNow.ToString("r")

$authHeader = Get-CosmosAuthHeader -verb $verb -resourceType $resourceType -resourceId $resourceId -date $date -key $cosmosKey

$headers = @{
    "Authorization" = $authHeader
    "x-ms-date" = $date
    "x-ms-version" = "2018-12-31"
    "Content-Type" = "application/query+json"
    "x-ms-documentdb-isquery" = "True"
    "x-ms-documentdb-query-enablecrosspartition" = "True"
}

$query = @{
    query = "SELECT c.layer, COUNT(1) as count FROM c GROUP BY c.layer"
} | ConvertTo-Json

$url = "$cosmosUrl/dbs/eva-data-model/colls/model_objects/docs"

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $query -ContentType "application/query+json"
    
    $results = $response.Documents | Sort-Object -Property layer
    $totalLayers = $results.Count
    $totalObjects = ($results | Measure-Object -Property count -Sum).Sum
    
    Write-Host "`n$('Layer'.PadRight(40)) $('Count'.PadLeft(10))" -ForegroundColor White
    Write-Host $("=" * 52) -ForegroundColor Gray
    
    foreach ($result in $results) {
        $layer = $result.layer
        $count = $result.count
        Write-Host "$($layer.PadRight(40)) $($count.ToString('N0').PadLeft(10))"
    }
    
    Write-Host $("=" * 52) -ForegroundColor Gray
    Write-Host "$('TOTAL OPERATIONAL LAYERS'.PadRight(40)) $($totalLayers.ToString().PadLeft(10))" -ForegroundColor Yellow
    Write-Host "$('TOTAL OBJECTS'.PadRight(40)) $($totalObjects.ToString('N0').PadLeft(10))" -ForegroundColor Yellow
    
    Write-Host "`n=== RESULT ===" -ForegroundColor Cyan
    Write-Host "Operational Layers: $totalLayers" -ForegroundColor White
    Write-Host "Target: 91 layers" -ForegroundColor White
    
    if ($totalLayers -ge 91) {
        Write-Host "STATUS: SUCCESS - Target achieved!" -ForegroundColor Green
    } elseif ($totalLayers -gt 51) {
        Write-Host "STATUS: PARTIAL - Improved from 51 to $totalLayers" -ForegroundColor Yellow
    } else {
        Write-Host "STATUS: NO CHANGE - Still at $totalLayers layers" -ForegroundColor Red
    }
    
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Using Azure CLI instead..." -ForegroundColor Yellow
    
    # Fallback to Azure CLI
    $accountName = "msub-sandbox-cosmos"
    $dbName = "eva-data-model"
    $containerName = "model_objects"
    
    Write-Host "`n  Attempting az cosmosdb query..." -ForegroundColor Gray
    # Note: az CLI doesn't have direct query support, falling back to portal recommendation
    Write-Host "`n  Please use Azure Portal Data Explorer or Azure Cosmos DB extension in VS Code" -ForegroundColor Yellow
    Write-Host "  Navigation: Azure Portal > msub-sandbox-cosmos > Data Explorer > eva-data-model > model_objects" -ForegroundColor Gray
}
