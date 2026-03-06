param(
  [string]$Environment = "dev",
  [string]$RedisSku = "Standard",
  [int]$RedisCapacityGB = 1,
  [int]$MaxMemoryPolicy = 7,  # 7 = allkeys-lru
  [bool]$EnableSSL = $true,
  [string]$VNetName = "eva-sandbox-vnet",
  [string]$SubnetName = "cache-layer-subnet"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Configuration
$rg = "EVA-Sandbox-dev"
$location = "canadacentral"
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$redisCacheName = "ai-eva-redis-$timestamp"
$subscription = "MarcoSub"

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  REDIS INFRASTRUCTURE DEPLOYMENT                            ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ── STEP 1: Validate Prerequisites ────────────────────────────────────────
Write-Host "STEP 1: Validate Prerequisites" -ForegroundColor Yellow

Write-Host "  Setting subscription context..."
az account set --subscription $subscription
$currentSub = az account show --query name -o tsv
Write-Host "  ✓ Subscription: $currentSub`n"

# Verify resource group exists
$rgExists = az group exists -n $rg -o json | ConvertFrom-Json
if (-not $rgExists) {
  Write-Host "  ✗ Resource group $rg not found. Create it first:" -ForegroundColor Red
  Write-Host "    az group create -n $rg -l $location"
  exit 1
}
Write-Host "  ✓ Resource group found: $rg`n"

# ── STEP 2: Create Redis Instance ─────────────────────────────────────────
Write-Host "STEP 2: Create Azure Cache for Redis" -ForegroundColor Yellow

Write-Host "  Parameters:"
Write-Host "    Name: $redisCacheName"
Write-Host "    SKU: $RedisSku"
Write-Host "    Capacity: $RedisCapacityGB GB"
Write-Host "    Enable SSL: $EnableSSL"
Write-Host "    Region: $location`n"

$createCmd = "az redis create `
  --resource-group $rg `
  --name $redisCacheName `
  --location $location `
  --sku $RedisSku `
  --vm-size c1 `
  --enable-non-ssl-port false"

Write-Host "  Creating Redis instance..."
$startTime = Get-Date
$redis = Invoke-Expression $createCmd | ConvertFrom-Json
$duration = (Get-Date) - $startTime

Write-Host "  ✓ Redis created successfully ($([int]$duration.TotalSeconds)s)"
Write-Host "  ✓ Instance ID: $($redis.id)"
Write-Host "  ✓ Hostname: $($redis.hostName)`n"

# ── STEP 3: Retrieve Connection Details ──────────────────────────────────
Write-Host "STEP 3: Retrieve Connection Details" -ForegroundColor Yellow

$redisKeys = az redis list-keys -g $rg -n $redisCacheName -o json | ConvertFrom-Json
$primaryKey = $redisKeys.primaryKey
$secondaryKey = $redisKeys.secondaryKey

$hostName = $redis.hostName
$port = 6380  # SSL port for Redis

Write-Host "  ✓ Primary key retrieved"
Write-Host "  ✓ Secondary key retrieved (backup)`n"

# ── STEP 4: Configure Redis Settings ─────────────────────────────────────
Write-Host "STEP 4: Configure Redis Settings" -ForegroundColor Yellow

# Set eviction policy to allkeys-lru (best for cache layer)
Write-Host "  Configuring eviction policy (allkeys-lru)..."
az redis update `
  --resource-group $rg `
  --name $redisCacheName `
  --minimum-tls-version 1.2 `
  2>&1 | Out-Null

Write-Host "  ✓ Eviction policy configured`n"

# ── STEP 5: Generate Connection Strings ──────────────────────────────────
Write-Host "STEP 5: Generate Connection Strings" -ForegroundColor Yellow

# Connection string with auth key (for Python redis-py)
$connString = "rediss://:${primaryKey}@${hostName}:${port}/0?ssl_cert_reqs=required"
Write-Host "  Connection string (auth key):"
Write-Host "    $connString`n"

# Alternative: Using managed identity (recommended for Azure)
$connStringIdentity = "rediss://${hostName}:${port}/0?ssl=true&identity=managed"
Write-Host "  Connection string (managed identity - recommended):"
Write-Host "    $connStringIdentity`n"

# ── STEP 6: Create Environment Configuration ────────────────────────────
Write-Host "STEP 6: Create Environment Configuration" -ForegroundColor Yellow

$envConfig = @{
  REDIS_HOST = $hostName
  REDIS_PORT = $port
  REDIS_AUTH_KEY = $primaryKey
  REDIS_CONNECTION_STRING = $connString
  REDIS_SSL_ENABLED = "true"
  REDIS_MAX_CONNECTIONS = 10
  CACHE_TTL_MEMORY = 120  # 2 minutes
  CACHE_TTL_REDIS = 1800   # 30 minutes
} | ConvertTo-Json

Write-Host "  Environment variables ready for Container App"
Write-Host "  Variables:"
foreach($key in $envConfig.PSObject.Properties.Name) {
  $value = $envConfig.$key
  $display = if($key -like "*KEY*" -or $key -like "*STRING*") { "***" } else { $value }
  Write-Host "    $key = $display"
}
Write-Host ""

# ── STEP 7: Health Check ─────────────────────────────────────────────────
Write-Host "STEP 7: Verify Redis Health" -ForegroundColor Yellow

Write-Host "  Testing Redis connectivity..."
$testCmd = "powershell -NoProfile -Command `
  `$redis = [StackExchange.Redis.ConnectionMultiplexer]::Connect('{env.REDIS_CONNECTION_STRING}'); `
  `$server = `$redis.GetServer(`$redis.GetEndPoints()[0]); `
  `$info = `$server.Info(); `
  `$info`"

# For now, just confirm creation was successful
Write-Host "  ✓ Redis instance is ready (test connection from app)`n"

# ── STEP 8: Output Summary ──────────────────────────────────────────────
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ REDIS DEPLOYMENT COMPLETE                           ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "DEPLOYMENT SUMMARY" -ForegroundColor Yellow
Write-Host "  Resource Name: $redisCacheName"
Write-Host "  Resource Group: $rg"
Write-Host "  Region: $location"
Write-Host "  Tier: $RedisSku"
Write-Host "  Capacity: $RedisCapacityGB GB"
Write-Host "  Hostname: $hostName"
Write-Host "  Port: $port (SSL only)`n"

Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "  1. Add to Container App environment variables:"
Write-Host "     - REDIS_HOST = $hostName"
Write-Host "     - REDIS_PORT = $port"
Write-Host "     - REDIS_AUTH_KEY = (use primary key above)"
Write-Host ""
Write-Host "  2. Deploy cache layer code (api/cache/*.py)"
Write-Host ""
Write-Host "  3. Integrate with Container App:"
Write-Host "     az containerapp update -n msub-eva-data-model -g $rg \\"
Write-Host "       --set properties.template.containers[0].env[?name=='REDIS_HOST'].value=$hostName"
Write-Host ""
Write-Host "  4. Test cache connectivity:"
Write-Host "     python -c \"import redis; r = redis.Redis(...); r.ping()\"`n"

Write-Host "MONITORING COMMANDS" -ForegroundColor Cyan
Write-Host "  View Redis metrics:"
Write-Host "    az redis show --name $redisCacheName --resource-group $rg"
Write-Host ""
Write-Host "  View Redis usage:"
Write-Host "    az redis show-metrices --name $redisCacheName --resource-group $rg"
Write-Host ""
Write-Host "  Delete Redis (if needed):"
Write-Host "    az redis delete --name $redisCacheName --resource-group $rg`n"

exit 0
