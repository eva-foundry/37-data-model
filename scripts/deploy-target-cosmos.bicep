// EVA Data Model -- Bicep Template for Target Cosmos DB
// Create a complete Cosmos DB infrastructure in the target subscription/RG
// Usage: az deployment group create -g <target-rg> -f deploy-target-cosmos.bicep --parameters cosmosAccountName=<name> location=<location>

param location string = resourceGroup().location
param cosmosAccountName string
param cosmosDbName string = 'evamodel'
param cosmosContainerName string = 'model_objects'
param environment string = 'production'
param tags object = {
  project: 'eva-data-model'
  component: '37-data-model'
  environment: environment
  createdDate: utcNow('u')
}

// Cosmos DB Account
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-02-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    consistencyPolicy: {
      defaultConsistencyLevel: 'Strong'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    databaseAccountOfferType: 'Standard'
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    publicNetworkAccess: 'Enabled'
    networkAclBypass: 'AzureServices'
  }
  tags: tags
}

// Cosmos DB Database
resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-02-15' = {
  parent: cosmosAccount
  name: cosmosDbName
  properties: {
    resource: {
      id: cosmosDbName
    }
  }
}

// Cosmos DB Container with autoscale throughput
resource cosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-02-15' = {
  parent: cosmosDatabase
  name: cosmosContainerName
  properties: {
    resource: {
      id: cosmosContainerName
      partitionKey: {
        paths: [
          '/layer'
        ]
        kind: 'Hash'
        version: 2
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
        spatialIndexes: []
        fullTextIndexes: []
        compositeIndexes: []
        vectorIndexes: []
      }
      defaultTtl: -1
      uniqueKeyPolicy: {
        uniqueKeys: []
      }
      conflictResolutionPolicy: {
        mode: 'LastWriterWins'
        conflictResolutionPath: '/_ts'
      }
    }
    options: {
      autoscaleSettings: {
        maxThroughput: 400000
      }
    }
  }
}

// Outputs for connection configuration
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output cosmosDatabaseId string = cosmosDatabase.id
output cosmosContainerId string = cosmosContainer.id
output cosmosAccountName string = cosmosAccount.name

// Instructions for environment variables
output environmentVariables string = '''
COSMOS_URL=${cosmosEndpoint}
COSMOS_KEY=<retrieve-via: az cosmosdb keys list --resource-group <rg> --name ${cosmosAccountName}>
MODEL_DB_NAME=${cosmosDbName}
MODEL_CONTAINER_NAME=${cosmosContainerName}
'''
