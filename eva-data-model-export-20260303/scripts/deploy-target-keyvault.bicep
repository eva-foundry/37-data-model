// Deploy new Key Vault for target environment
// Includes access policies and configuration for portable secrets

param location string = resourceGroup().location
param vaultName string
param environment string = 'production'

param keyVaultSkuName string = 'standard'

param enableSoftDelete bool = true
param softDeleteRetentionDays int = 90
param enablePurgeProtection bool = true
param enableRbacAuthorization bool = true

param tags object = {
  project: 'eva-foundry'
  component: 'key-vault'
  environment: environment
  createdDate: utcNow('u')
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  location: location
  
  properties: {
    // Access and permissions
    enableRbacAuthorization: enableRbacAuthorization  // Use RBAC instead of vault policies
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: keyVaultSkuName
    }
    
    // Protection and compliance
    softDeleteRetentionInDays: enableSoftDelete ? softDeleteRetentionDays : null
    enableSoftDelete: enableSoftDelete
    enablePurgeProtection: enablePurgeProtection
    
    // Network access (all for now, restrict later via network rules)
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    
    // Audit and logging
    publicNetworkAccess: 'Enabled'  // Change to Disabled if using private endpoints
  }
  
  tags: tags
}

// Secrets for reference documentation (not actual secrets)
// These are placeholders; actual secrets are imported via Import-PortableSecrets.ps1

output keyVaultId string = keyVault.id
output keyVaultName string = keyVault.name
output keyVaultEndpoint string = keyVault.properties.vaultUri
output tenantId string = subscription().tenantId

output deploymentNotes string = '''
Key Vault created successfully.

Next steps:
1. Assign RBAC roles to users/services:
   - KeyVaultSecretsOfficer: For importing secrets
   - KeyVaultSecretsUser: For reading secrets in applications
   
2. Import portable secrets:
   pwsh -File Import-PortableSecrets.ps1 -InputFile "portable-secrets-export-*.json" -TargetVault "${keyVaultName}"

3. Add environment-specific secrets (from new resources):
   - cosmos-url, cosmos-key (from Cosmos DB)
   - apim-key (from APIM instance)
   - storage-account-key (from Storage account)
   - redis-url, redis-key (from Redis cache)

4. Update application configurations to reference new vault: ${keyVaultName}

5. Enable Azure Monitor logging (optional but recommended)
'''
