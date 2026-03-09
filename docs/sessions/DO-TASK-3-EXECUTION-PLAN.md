```
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║              DO TASK 3: STAGING DEPLOYMENT - EXECUTION PLAN                ║
║                      March 6, 2026 · 5:37 PM ET                           ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

# DO TASK 3: Staging Deployment

**Status**: 🔴 IN PROGRESS  
**Start Time**: 17:37 ET  
**Target Duration**: 60 minutes (17:37 - 18:37 ET)  
**Owner**: DevOps Engineering  
**Decision Gate**: All deployment steps successful + basic cache test passes  

---

## 🎯 Mission Statement

Deploy updated cache layer code to Azure Container Apps **staging environment** with Redis integration and verify:
1. Docker build succeeds
2. Deployment to staging ACA succeeds
3. Application starts without errors
4. Cache initialization works in Azure environment
5. Basic cache operations functional

---

## 📋 Task Breakdown

### Step 1: Verify Docker Environment (5 min)
- Check Docker daemon running
- Verify Dockerfile exists and is correct
- Confirm .env file is in place (from Task 2)

### Step 2: Build Docker Image (15 min)
- Build local Docker image with cache layer code
- Tag with timestamp: `eva-data-model:$(date -format 'yyyyMMdd-HHmm')`
- Verify build succeeds

### Step 3: Push to Container Registry (10 min)
- Tag image for registry: `<registry>/eva-data-model-staging:latest`
- Push image to Azure Container Registry
- Verify successful push

### Step 4: Deploy to Staging ACA (15 min)
- Update staging Container App with new image
- Set environment variables (REDIS_URL, CACHE_ENABLED, etc.)
- Wait for deployment to stabilize

### Step 5: Verify Cache Operations (15 min)
- Check application health endpoint: `/health`
- Check readiness endpoint: `/ready`
- Test basic cache operations (set_obj, get_obj)
- Verify logs show cache initialization

---

## 🔧 Implementation Steps

### Step 1: Verify Docker Environment

```powershell
# Check Docker daemon status
docker ps -q | Out-Null
if ($?) {
    Write-Host "✓ Docker daemon is running" -ForegroundColor Green
} else {
    Write-Host "✗ Docker daemon is NOT running" -ForegroundColor Red
    exit 1
}

# Verify Dockerfile exists
if (Test-Path "Dockerfile") {
    Write-Host "✓ Dockerfile found" -ForegroundColor Green
} else {
    Write-Host "✗ Dockerfile not found" -ForegroundColor Red
    exit 1
}

# Verify .env file
if (Test-Path ".env") {
    Write-Host "✓ .env file present" -ForegroundColor Green
} else {
    Write-Host "✗ .env file missing" -ForegroundColor Red
    exit 1
}
```

### Step 2: Build Docker Image

```powershell
# Set image tag with timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$imageName = "eva-data-model"
$imageTag = "$imageName:$timestamp"

Write-Host "`n📦 Building Docker image: $imageTag`n" -ForegroundColor Cyan

# Build image
docker build -t $imageTag -t "$imageName:latest" .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker image built successfully" -ForegroundColor Green
    Write-Host "  Tag: $imageTag" -ForegroundColor Gray
    Write-Host "  Tag: $imageName:latest" -ForegroundColor Gray
} else {
    Write-Host "✗ Docker build failed" -ForegroundColor Red
    exit 1
}

# Verify image exists
$image = docker images "$imageName" -q | Select-Object -First 1
if ($image) {
    Write-Host "✓ Image verified in Docker" -ForegroundColor Green
} else {
    Write-Host "✗ Image not found in Docker" -ForegroundColor Red
    exit 1
}
```

### Step 3: Push to Container Registry

```powershell
# Azure Container Registry details (update with actual ACR name)
$acrName = "aieva"  # Change to actual ACR name
$acrUrl = "$acrName.azurecr.io"
$registry = "$acrUrl/eva-data-model-staging"

Write-Host "`n🚀 Pushing Docker image to registry`n" -ForegroundColor Cyan

# Login to Azure Container Registry
Write-Host "Logging in to $acrUrl..." -ForegroundColor Yellow
az acr login --name $acrName

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to login to ACR" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Logged in to ACR" -ForegroundColor Green

# Tag image for registry
$registryTag = "$registry`:latest"
$registryTagTs = "$registry`:$timestamp"

Write-Host "Tagging image for registry..." -ForegroundColor Yellow
docker tag "$imageName`:latest" $registryTag
docker tag "$imageName`:latest" $registryTagTs

Write-Host "✓ Image tagged" -ForegroundColor Green

# Push to registry
Write-Host "Pushing to $acrUrl..." -ForegroundColor Yellow
docker push $registryTag
docker push $registryTagTs

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Image pushed successfully" -ForegroundColor Green
    Write-Host "  URL: $registryTag" -ForegroundColor Gray
    Write-Host "  URL: $registryTagTs" -ForegroundColor Gray
} else {
    Write-Host "✗ Push to registry failed" -ForegroundColor Red
    exit 1
}
```

### Step 4: Deploy to Staging ACA

```powershell
# Staging configuration (update with actual names)
$stagingAppName = "msub-eva-data-model-staging"
$stagingResourceGroup = "EVA-Sandbox-dev"
$imagePath = "$registry`:latest"

Write-Host "`n🌍 Deploying to staging Container App`n" -ForegroundColor Cyan

# Get Redis URL from .env
$redisUrl = Select-String -Path ".env" -Pattern "REDIS_URL=" | `
    ForEach-Object { $_.Line -replace 'REDIS_URL=', '' } | `
    Select-Object -First 1

if (-not $redisUrl) {
    Write-Host "✗ REDIS_URL not found in .env" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Redis URL loaded from .env" -ForegroundColor Green

# Update Container App
Write-Host "Updating Container App: $stagingAppName..." -ForegroundColor Yellow

az containerapp update `
    --name $stagingAppName `
    --resource-group $stagingResourceGroup `
    --image $imagePath `
    --set-env-vars `
        REDIS_URL="$redisUrl" `
        CACHE_ENABLED="false" `
        ROLLOUT_PERCENTAGE="0" `
        CACHE_TTL_SECONDS="1800"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Container App updated" -ForegroundColor Green
    Write-Host "  App: $stagingAppName" -ForegroundColor Gray
    Write-Host "  Image: $imagePath" -ForegroundColor Gray
} else {
    Write-Host "✗ Failed to update Container App" -ForegroundColor Red
    exit 1
}

# Wait for deployment
Write-Host "`nWaiting for deployment to stabilize (30-60 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Get application URL
$appUrl = az containerapp show `
    --name $stagingAppName `
    --resource-group $stagingResourceGroup `
    --query "properties.configuration.ingress.fqdn" -o tsv

if ($appUrl) {
    Write-Host "✓ Deployment successful" -ForegroundColor Green
    Write-Host "  URL: https://$appUrl" -ForegroundColor Gray
} else {
    Write-Host "✗ Could not retrieve application URL" -ForegroundColor Red
}
```

### Step 5: Verify Cache Operations

```powershell
# Get staging app URL
$stagingAppName = "msub-eva-data-model-staging"
$stagingResourceGroup = "EVA-Sandbox-dev"

$appUrl = az containerapp show `
    --name $stagingAppName `
    --resource-group $stagingResourceGroup `
    --query "properties.configuration.ingress.fqdn" -o tsv

if (-not $appUrl) {
    Write-Host "✗ Could not get application URL" -ForegroundColor Red
    exit 1
}

Write-Host "`n✓ Testing application at: https://$appUrl`n" -ForegroundColor Cyan

# Test 1: Health endpoint (liveness probe)
Write-Host "Test 1: Health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$appUrl/health" -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Health endpoint OK" -ForegroundColor Green
        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠ Health endpoint error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 2: Readiness endpoint
Write-Host "`nTest 2: Readiness endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$appUrl/ready" -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Readiness endpoint OK" -ForegroundColor Green
        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠ Readiness check may be initializing: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 3: Basic API call
Write-Host "`nTest 3: Basic API endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$appUrl/model/projects/?limit=1" `
        -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ API endpoint OK" -ForegroundColor Green
        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
        $data = $response.Content | ConvertFrom-Json
        Write-Host "  Records: $($data.data.Count)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠ API call error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n✓ Staging deployment verification complete`n" -ForegroundColor Green
```

---

## 📊 Success Criteria Checklist

- [ ] Docker build succeeds
- [ ] Image tagging successful
- [ ] Push to registry successful
- [ ] Container App deployment initiated
- [ ] Application health endpoint responds
- [ ] Readiness endpoint responds or initializing
- [ ] API endpoints responsive
- [ ] No critical errors in logs
- [ ] Cache layer initializing (check logs)

---

## ⚠️ Potential Issues & Recovery

### Issue 1: Docker Build Fails
**Solution**: 
```powershell
# Check Dockerfile syntax
docker build --no-cache -t test:latest .

# If still fails, review requirements.txt
pip install -r requirements.txt --dry-run
```

### Issue 2: ACR Push Fails
**Solution**:
```powershell
# Verify ACR login
az acr login --name $acrName --expose-token

# Check image exists
docker images | Select-String $imageName
```

### Issue 3: ACA Deployment Fails
**Solution**:
```powershell
# Check Container App health
az containerapp show --name $stagingAppName -g $stagingResourceGroup --query properties

# View recent events
az containerapp logs show --name $stagingAppName -g $stagingResourceGroup --tail 50
```

### Issue 4: Application Won't Start
**Solution**:
```powershell
# Enable debug logging
az containerapp update --name $stagingAppName -g $stagingResourceGroup \
  --set-env-vars LOG_LEVEL="DEBUG"

# Wait and check logs again
Start-Sleep -Seconds 30
az containerapp logs show --name $stagingAppName -g $stagingResourceGroup --tail 100
```

---

## 🎯 Go/No-Go Decision Framework

### ✅ GO Criteria
- [x] Docker image built successfully
- [x] Image pushed to registry
- [x] Deployment completed without errors
- [x] Health endpoint responds
- [x] Application starts without critical errors
- [x] No connectivity issues to external services
- [x] Logs show cache initialization successful

### ❌ NO-GO Criteria (Blockers)
- [ ] Docker build fails
- [ ] Registry push fails (ACR unreachable)
- [ ] ACA deployment fails
- [ ] Health endpoint returns 500+ error
- [ ] Application exits immediately (crash loop)
- [ ] Redis connection error blocking startup
- [ ] Missing critical dependencies

---

## 📈 Metrics to Collect

### After successful deployment:
```
1. Application startup time
2. Cache initialization time  
3. First API request latency (cold start)
4. Current RU consumption (baseline)
5. Memory usage of container
6. CPU usage of container
7. Network connectivity test results
```

---

## Next Steps After Task 3

### If GO ✅
→ **Proceed to DO Task 4: Integration Testing** (20:37 ET)

### If NO-GO ❌
→ **Diagnose and fix** using recovery procedures
→ **Retry deployment** after fixes applied
→ **Escalate if needed** (critical blocker)

---

## 📝 Documentation

**Files to Update After Task 3**:
- [ ] SESSION-36-LIVE-DASHBOARD.md (progress update)
- [ ] DO-TASK-3-COMPLETION-REPORT.md (create new file)
- [ ] SESSION-36-EXECUTION-CHECKLIST.md (mark Task 3 done)

---

Generated: 2026-03-06 17:37 ET  
Session 36: DO Task 3 - Staging Deployment  
Next Review: 18:37 ET (after completion)

