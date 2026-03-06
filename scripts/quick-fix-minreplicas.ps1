#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Quick fix for cold starts - Use direct Azure CLI approach
  
.DESCRIPTION
  Applies minReplicas=1 directly using az containerapp patch
  This is the fastest way to eliminate cold start timeouts.
  
.EXAMPLE
  .\quick-fix-minreplicas.ps1
#>

$CONTAINER_APP = "msub-eva-data-model"
$RESOURCE_GROUP = "EVA-Sandbox-dev"
$SUBSCRIPTION = "c59ee575-eb2a-4b51-a865-4b618f9add0a"

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  QUICK FIX: minReplicas=1 for Data Model API              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Set subscription
az account set --subscription $SUBSCRIPTION 2>&1 | Out-Null
Write-Host "✓ Subscription context set" -ForegroundColor Green

# Check current status
Write-Host "`nCurrent configuration:" -ForegroundColor Yellow
$current = az containerapp show --name $CONTAINER_APP --resource-group $RESOURCE_GROUP --query "properties.template.scale" 2>&1
Write-Host $current

# Apply fix
Write-Host "`nApplying minReplicas=1 fix..." -ForegroundColor Yellow

# Method 1: Try using properties update
$result = az containerapp update `
  --name $CONTAINER_APP `
  --resource-group $RESOURCE_GROUP `
  --set properties.template.scale.minReplicas=1 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host "✓ Successfully applied minReplicas=1" -ForegroundColor Green
  Write-Host "`nVerifying..." -ForegroundColor Gray
  Start-Sleep -Seconds 2
  az containerapp show --name $CONTAINER_APP --resource-group $RESOURCE_GROUP --query "properties.template.scale.minReplicas" 2>&1
} else {
  Write-Host "⚠ Direct update may require different approach" -ForegroundColor Yellow
  Write-Host "`nRunning alternative: Full scale configuration..." -ForegroundColor Gray
  
  # Get current full config and update via JSON merge
  $caConfig = az containerapp show --name $CONTAINER_APP --resource-group $RESOURCE_GROUP 2>&1 | ConvertFrom-Json
  
  # Update scale in template
  if (-not $caConfig.properties.template.scale) {
    $caConfig.properties.template | Add-Member -MemberType NoteProperty -Name "scale" -Value @{}
  }
  
  $caConfig.properties.template.scale.minReplicas = 1
  $caConfig.properties.template.scale.maxReplicas = 3
  
  # Save updated config
  $updatedJson = $caConfig | ConvertTo-Json -Depth 10
  $tempFile = New-TemporaryFile -Suffix ".json"
  $updatedJson | Set-Content $tempFile
  
  Write-Host "Updating with JSON config..." -ForegroundColor Gray
  az containerapp update `
    --name $CONTAINER_APP `
    --resource-group $RESOURCE_GROUP `
    --template $tempFile 2>&1
  
  Remove-Item $tempFile -Force
  
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Successfully applied minReplicas=1 via JSON" -ForegroundColor Green
  }
}

Write-Host "`nDeployment complete. API should respond faster now." -ForegroundColor Green
Write-Host "Test with: Invoke-RestMethod 'https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/health' -TimeoutSec 10`n" -ForegroundColor Gray
