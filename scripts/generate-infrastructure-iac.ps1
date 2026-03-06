#Requires -Version 7.0
<#
.SYNOPSIS
    Generate Bicep IaC templates from L39 (azure-infrastructure.json)
    
.DESCRIPTION
    Transforms data model layer L39 desired state into production-ready Bicep templates.
    Implements DPDCA cycle: Discover (L39) → Plan (schema) → Do (generate) → Check (validate) → Act (output)
    
.PARAMETER Environment
    Target environment: dev, staging, prod
    
.PARAMETER ProjectId
    Project ID (e.g., eva-foundry, 37-data-model)
    
.PARAMETER OutputPath
    Directory to write .bicep files (default: ./generated/)
    
.PARAMETER ShowDiff
    Display what will change before generating (default: $true)
    
.EXAMPLE
    .\generate-infrastructure-iac.ps1 -Environment prod -ProjectId 37-data-model
    .\generate-infrastructure-iac.ps1 -Environment dev -OutputPath ./bicep-output
    
.NOTES
    Session: 31 - Priority #2 (IaC Integration)
    Author: GitHub Copilot
    Date: 2026-03-06
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = '37-data-model',
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = './generated-bicep',
    
    [Parameter(Mandatory=$false)]
    [bool]$ShowDiff = $true
)

# ============================================================================
# PHASE: DISCOVER (Load L39 desired state)
# ============================================================================

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ GENERATE INFRASTRUCTURE IaC FROM L39                       ║" -ForegroundColor Cyan
Write-Host "║ Environment: $Environment" -PadRight 35 -ForegroundColor Cyan
Write-Host "║ Project: $ProjectId" -PadRight 35 -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "📋 PHASE 1: DISCOVER (Load L39 desired state)" -ForegroundColor Yellow

# Load L39 from data model
$l39Path = './model/azure_infrastructure.json'
if (-not (Test-Path $l39Path)) {
    throw "L39 file not found: $l39Path"
}

$l39 = Get-Content $l39Path | ConvertFrom-Json
Write-Host "  ✅ L39 loaded ($($l39.metadata.layer): $($l39.metadata.layer_name))" -ForegroundColor Green

# Validate environment config exists
if (-not $l39.environments.$Environment) {
    throw "Environment '$Environment' not configured in L39"
}

$envConfig = $l39.environments.$Environment
Write-Host "  ✅ Environment: $($envConfig.description)" -ForegroundColor Green

# ============================================================================
# PHASE: PLAN (Design Bicep schema)
# ============================================================================

Write-Host "`n📋 PHASE 2: PLAN (Design Bicep structure)" -ForegroundColor Yellow

# Create output directory
if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath | Out-Null
    Write-Host "  ✅ Created output directory: $OutputPath" -ForegroundColor Green
}

# ============================================================================
# PHASE: DO (Generate Bicep templates)
# ============================================================================

Write-Host "`n📋 PHASE 3: DO (Generate Bicep templates)" -ForegroundColor Yellow

# 1. Main Bicep file
$mainBicep = @"
// Generated from L39: azure-infrastructure
// Environment: $Environment
// Project: $ProjectId
// Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

@description('Environment name')
param environment string = '$Environment'

@description('Location for resources')
param location string = '$($envConfig.region)'

@description('Resource group name')
param resourceGroupName string = '$($envConfig.resource_group)'

@description('Container image tag')
param containerImageTag string = 'latest'

@description('Log level for application')
param logLevel string = '$($l39.resources.'data-model-aca'.environment_variables | Where-Object { \$_.name -eq 'LOG_LEVEL' } | Select-Object -ExpandProperty 'value_by_env').($Environment)'

// Get reference to existing resource group
param subscriptionId string = subscription().subscriptionId

// ============================================================================
// CONTAINER APP - EVA Data Model API
// ============================================================================

@description('Get Managed Environment (Container App environment)')
resource containerEnvironment 'Microsoft.App/managedEnvironments@2023-05-02' existing = {
  name: 'eva-aca-env-\${environment}'
}

var containerAppName = 'msub-eva-data-model-\${environment}'
var dataModelConfig = $($l39.resources.'data-model-aca'.resource_config | ConvertTo-Json -Depth 10)

@description('Create Container App for Data Model API')
resource containerApp 'Microsoft.App/containerApps@2023-05-02' = {
  name: containerAppName
  location: location
  properties: {
    environmentId: containerEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
        transport: 'tcp'
      }
      secrets: [
        {
          name: 'cosmos-connection'
          keyVaultUrl: 'https://eva-kv-\${environment}.vault.azure.net/secrets/COSMOS_CONNECTION_STRING'
          identity: 'system'
        }
        {
          name: 'openai-key'
          keyVaultUrl: 'https://eva-kv-\${environment}.vault.azure.net/secrets/OPENAI_API_KEY'
          identity: 'system'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'data-model-api'
          image: 'ghcr.io/eva-foundry/37-data-model:\${containerImageTag}'
          resources: {
            cpu: json('$($l39.resources.'data-model-aca'.resource_config[$Environment].cpu)')
            memory: '$($l39.resources.'data-model-aca'.resource_config[$Environment].memory)'
          }
          env: [
            {
              name: 'DOTNET_ENVIRONMENT'
              value: environment == 'prod' ? 'Production' : environment == 'staging' ? 'Staging' : 'Development'
            }
            {
              name: 'LOG_LEVEL'
              value: logLevel
            }
          ]
          volumeMounts: []
        }
      ]
      scale: {
        minReplicas: $($l39.resources.'data-model-aca'.resource_config[$Environment].minReplicas)
        maxReplicas: $($l39.resources.'data-model-aca'.resource_config[$Environment].maxReplicas)
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
      volumes: []
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// ============================================================================
// COSMOS DB - Data Storage
// ============================================================================

var cosmosAccountName = 'eva-cosmos-\${environment}'
var cosmosThroughput = $($l39.resources.'cosmos-db'.resource_config[$Environment].throughput)

@description('Create Cosmos DB account')
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    enableAutomaticFailover: environment == 'prod' ? true : false
    enableMultipleWriteLocations: environment == 'prod' ? true : false
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        isZoneRedundant: environment == 'prod' ? true : false
      }
    ]
  }
}

@description('Create Cosmos DB database')
resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: 'eva-foundation'
  properties: {
    resource: {
      id: 'eva-foundation'
    }
    options: {
      throughput: cosmosThroughput
    }
  }
}

// ============================================================================
// KEY VAULT - Secrets Management
// ============================================================================

var keyVaultName = 'eva-kv-\${environment}'

@description('Create Key Vault for secrets')
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: containerApp.identity.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
    enablePurgeProtection: environment == 'prod'
    enableSoftDelete: true
  }
}

// ============================================================================
// APPLICATION INSIGHTS - Monitoring
// ============================================================================

var insightsName = 'eva-insights-\${environment}'

@description('Create Application Insights')
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: insightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    RetentionInDays: $($l39.resources.'app-insights'.resource_config[$Environment].retention_in_days)
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

@description('Container App URL')
output containerAppUrl string = 'https://\${containerApp.properties.configuration.ingress.fqdn}'

@description('Cosmos DB endpoint')
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint

@description('Key Vault URI')
output keyVaultUri string = keyVault.properties.vaultUri

@description('Application Insights key')
output appInsightsKey string = appInsights.properties.InstrumentationKey

@description('Resource deployment IDs')
output resourceIds object = {
  containerApp: containerApp.id
  cosmosAccount: cosmosAccount.id
  keyVault: keyVault.id
  appInsights: appInsights.id
}
"@

# Write main Bicep file
$mainBicepPath = Join-Path $OutputPath 'main.bicep'
Set-Content -Path $mainBicepPath -Value $mainBicep -Encoding UTF8
Write-Host "  ✅ Generated: main.bicep" -ForegroundColor Green

# 2. Parameters file
$parametersBicep = @"
// Environment-specific parameters
param environment = '$Environment'
param location = '$($envConfig.region)'
param resourceGroupName = '$($envConfig.resource_group)'
param containerImageTag = 'latest'
"@

$paramsBicepPath = Join-Path $OutputPath 'parameters.bicep'
Set-Content -Path $paramsBicepPath -Value $parametersBicep -Encoding UTF8
Write-Host "  ✅ Generated: parameters.bicep" -ForegroundColor Green

# 3. Bicep parameters JSON file
$bicepParams = @{
    '`$schema' = 'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#'
    contentVersion = '1.0.0.0'
    parameters = @{
        environment = @{ value = $Environment }
        location = @{ value = $envConfig.region }
        resourceGroupName = @{ value = $envConfig.resource_group }
        containerImageTag = @{ value = 'latest' }
    }
} | ConvertTo-Json -Depth 10

$bicepParamsPath = Join-Path $OutputPath 'parameters.json'
Set-Content -Path $bicepParamsPath -Value $bicepParams -Encoding UTF8
Write-Host "  ✅ Generated: parameters.json" -ForegroundColor Green

# ============================================================================
# PHASE: CHECK (Validate generated IaC)
# ============================================================================

Write-Host "`n📋 PHASE 4: CHECK (Validate generated IaC)" -ForegroundColor Yellow

# Validate Bicep syntax
$bicepValidate = az bicep build --file $mainBicepPath --output-format json 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Bicep validation failed:" -ForegroundColor Red
    Write-Host $bicepValidate
    exit 1
}

Write-Host "  ✅ Bicep syntax valid" -ForegroundColor Green

# Show what will be deployed
if ($ShowDiff) {
    Write-Host "`n📋 DIFF: Resources to be created/updated" -ForegroundColor Yellow
    Write-Host "  Container App: msub-eva-data-model-$Environment" -ForegroundColor White
    Write-Host "  Replica Range: $($l39.resources.'data-model-aca'.resource_config[$Environment].minReplicas)-$($l39.resources.'data-model-aca'.resource_config[$Environment].maxReplicas)" -ForegroundColor White
    Write-Host "  Cosmos DB: eva-cosmos-$Environment ($($l39.resources.'cosmos-db'.resource_config[$Environment].throughput) RU/s)" -ForegroundColor White
    Write-Host "  Key Vault: eva-kv-$Environment (purge protection: $($Environment -eq 'prod'))" -ForegroundColor White
    Write-Host "  App Insights: eva-insights-$Environment ($($l39.resources.'app-insights'.resource_config[$Environment].retention_in_days) days retention)" -ForegroundColor White
}

# ============================================================================
# PHASE: ACT (Summary)
# ============================================================================

Write-Host "`n📋 PHASE 5: ACT (Summary)" -ForegroundColor Yellow
Write-Host "  ✅ Generated 3 Bicep files in: $(Resolve-Path $OutputPath)" -ForegroundColor Green
Write-Host "  ✅ Ready for deployment via: az deployment group create -g $($envConfig.resource_group) -f $mainBicepPath" -ForegroundColor Green

Write-Host "`n📦 OUTPUT FILES:" -ForegroundColor Cyan
Get-ChildItem $OutputPath -Filter '*.bicep' | ForEach-Object {
    $size = (Get-Item $_.FullName).Length
    Write-Host "  • $($_.Name) ($size bytes)" -ForegroundColor White
}

Write-Host "`n✨ Generation complete! Files ready for deployment.`n" -ForegroundColor Green
