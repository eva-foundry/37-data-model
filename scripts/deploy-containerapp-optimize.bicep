// EVA Data Model -- ACA Infrastructure Optimization
// Configures minReplicas=1 to eliminate cold starts
// Story: F37-11-010 (Infrastructure Optimization)
// Usage: az deployment group create -g EVA-Sandbox-dev -f deploy-containerapp-optimize.bicep

@description('Container App name')
param containerAppName string = 'msub-eva-data-model'

@description('Resource Group name')
param resourceGroupName string = 'EVA-Sandbox-dev'

@description('Minimum replicas (set to 1 to eliminate cold starts)')
param minReplicas int = 1

@description('Maximum replicas for scale-out')
param maxReplicas int = 3

@description('CPU allocation per replica')
param containerCpu string = '0.5'

@description('Memory allocation per replica')
param containerMemory string = '1.0Gi'

// Reference existing Container App
resource containerApp 'Microsoft.App/containerApps@2023-11-02' = {
  name: containerAppName
  location: resourceGroup().location
  properties: {
    template: {
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
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
    }
  }
}

@description('Updated scale configuration')
output scalingConfig object = {
  minReplicas: minReplicas
  maxReplicas: maxReplicas
  reason: 'Minimum 1 replica always running eliminates cold starts (P50 latency ~500ms vs 5-10s cold start)'
  deployedAt: utcNow()
}
