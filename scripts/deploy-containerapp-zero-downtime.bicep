// EVA Data Model -- Zero-Downtime Deployment Configuration
// Enables Multiple revision mode for blue-green deployments
// Story: Session 41 Part 12 (Vital Service Operations)
// Usage: az deployment group create -g EVA-Sandbox-dev -f deploy-containerapp-zero-downtime.bicep

@description('Container App name')
param containerAppName string = 'msub-eva-data-model'

@description('Location for resources')
param location string = resourceGroup().location

@description('Minimum replicas per revision')
param minReplicas int = 1

@description('Maximum replicas per revision')
param maxReplicas int = 3

@description('Revision mode - Multiple enables zero-downtime')
param revisionMode string = 'Multiple'

@description('External ingress visibility')
param externalIngress bool = true

@description('Target port for container')
param targetPort int = 8010

@description('Termination grace period for connection draining (seconds)')
param terminationGracePeriodSeconds int = 30

@description('Deployment timestamp')
param deploymentTimestamp string = utcNow()

// Update configuration for zero-downtime deployments
resource containerAppConfig 'Microsoft.App/containerApps@2023-11-02-preview' = {
  name: containerAppName
  location: location
  properties: {
    configuration: {
      activeRevisionsMode: revisionMode
      ingress: {
        external: externalIngress
        targetPort: targetPort
        transport: 'auto'
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
    }
    template: {
      terminationGracePeriodSeconds: terminationGracePeriodSeconds
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
}

@description('Zero-downtime configuration applied')
output configuration object = {
  revisionMode: revisionMode
  minReplicas: minReplicas
  maxReplicas: maxReplicas
  terminationGracePeriod: terminationGracePeriodSeconds
  trafficSplitting: 'Enabled (blue-green supported)'
  deployedAt: deploymentTimestamp
  notes: [
    'Multiple revision mode enables zero-downtime blue-green deployments'
    'Deploy new revision with 0% traffic, validate, then gradually shift 0->100%'
    'Old revision stays active during transition, then deactivates after 100% shift'
    '30s termination grace period allows in-flight requests to complete'
  ]
}
