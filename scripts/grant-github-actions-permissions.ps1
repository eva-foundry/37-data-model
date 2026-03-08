#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Grant GitHub Actions service principal permissions to access App Insights

.DESCRIPTION
    This script grants the "Monitoring Reader" role to the service principal
    used by GitHub Actions, allowing it to read Application Insights resources.

.PARAMETER ServicePrincipalAppId
    The Application ID (Client ID) of the GitHub Actions service principal.
    This can be found in the AZURE_CREDENTIALS secret (clientId field).

.EXAMPLE
    .\grant-github-actions-permissions.ps1 -ServicePrincipalAppId "12345678-1234-1234-1234-123456789012"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ServicePrincipalAppId,
    
    [string]$ResourceGroup = "EVA-Sandbox-dev",
    [string]$SubscriptionId = "c59ee575-eb2a-4b51-a865-4b618f9add0a"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "GitHub Actions Permissions Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Set subscription context
Write-Host "Setting subscription context..." -ForegroundColor Yellow
az account set --subscription $SubscriptionId

# Get service principal object ID
Write-Host "Looking up service principal..." -ForegroundColor Yellow
$spObjectId = az ad sp show --id $ServicePrincipalAppId --query "id" -o tsv

if (-not $spObjectId) {
    Write-Host "✗ Service principal not found with AppId: $ServicePrincipalAppId" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Found SP: $spObjectId" -ForegroundColor Green

# Grant Monitoring Reader role at resource group level
Write-Host "`nGranting 'Monitoring Reader' role at resource group level..." -ForegroundColor Yellow
$scope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup"

try {
    az role assignment create `
        --role "Monitoring Reader" `
        --assignee-object-id $spObjectId `
        --assignee-principal-type ServicePrincipal `
        --scope $scope `
        --description "GitHub Actions: Read App Insights metrics"
    
    Write-Host "✓ Successfully granted 'Monitoring Reader' role" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -match "already exists") {
        Write-Host "✓ Role assignment already exists" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to grant role: $_" -ForegroundColor Red
        exit 1
    }
}

# Verify assignment
Write-Host "`nVerifying role assignment..." -ForegroundColor Yellow
$assignments = az role assignment list `
    --assignee $spObjectId `
    --scope $scope `
    --query "[?roleDefinitionName=='Monitoring Reader'].roleDefinitionName" `
    -o tsv

if ($assignments -contains "Monitoring Reader") {
    Write-Host "✓ Verified: Service principal has 'Monitoring Reader' role" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: Could not verify role assignment" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✓ Permissions setup complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Trigger the GitHub Actions workflow" -ForegroundColor White
Write-Host "  2. Verify L41 (Agent Metrics) job succeeds" -ForegroundColor White
Write-Host ""
