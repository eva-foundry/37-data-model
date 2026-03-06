param(
  @description('Environment name (dev/staging/prod)')
  param environment string = 'dev'
  
  @description('Redis cache name')
  param redisCacheName string = 'ai-eva-redis-${uniqueString(resourceGroup().id)}'
  
  @description('SKU (Basic, Standard, Premium)')
  param sku string = 'Standard'
  
  @description('Capacity in GB (0 for Basic, 1-6 for Standard, 1-6 for Premium)')
  param capacityGB int = 1
  
  @description('Location for resources')
  param location string = resourceGroup().location
  
  @description('Tags for resource organization')
  param tags object = {
    project: 'eva-sandbox'
    environment: environment
    component: 'redis-cache-layer'
    createdBy: 'bicep'
  }
)

var vmSize = 'c1'
var enableNonSslPort = false
var minimumTlsVersion = '1.2'

resource redisCache 'Microsoft.Cache/Redis@2023-04-01' = {
  name: redisCacheName
  location: location
  tags: tags
  properties: {
    sku: {
      name: sku
      family: 'C'
      capacity: capacityGB
    }
    enableNonSslPort: enableNonSslPort
    minimumTlsVersion: minimumTlsVersion
    publicNetworkAccess: 'Enabled'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
      'notify-keyspace-events': 'Ex'  # Enable expiration notifications
    }
    accessKeys: {
      primaryKey: listKeys('${redisCache.id}', '2023-04-01').primaryKey
      secondaryKey: listKeys('${redisCache.id}', '2023-04-01').secondaryKey
    }
  }
}

output redisCacheId string = redisCache.id
output redisCacheName string = redisCache.name
output redisHostName string = redisCache.properties.hostName
output redisPort int = 6380
output redisPrimaryKey string = listKeys('${redisCache.id}', '2023-04-01').primaryKey
output redisSecondaryKey string = listKeys('${redisCache.id}', '2023-04-01').secondaryKey
output connectionString string = 'rediss://:${listKeys('${redisCache.id}', '2023-04-01').primaryKey}@${redisCache.properties.hostName}:6380/0?ssl_cert_reqs=required'
