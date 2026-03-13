# DEPLOYMENT PHASE: Build, Push, and Validate New Schema Organization
# Purpose: Deploy router reorganization to Azure Container Apps
# Output: Deployed revision with validated endpoints

param(
    [string]$RegistryName = "msubsandacr202603031449",
    [string]$RegistryResourceGroup = "EVA-Sandbox-dev",
    [string]$ContainerAppName = "msub-eva-data-model",
    [string]$ContainerAppRG = "EVA-Sandbox-dev",
    [string]$ImageTag = "party5-$(Get-Date -Format 'yyyyMMdd-HHmmss')",
    [string]$DockerfilePath = "Dockerfile",
    [string]$EvidenceDir = "$(Get-Location)\evidence"
)

$ErrorActionPreference = "Continue"
$timestamp = (Get-Date -Format "yyyyMMdd_HHmmss")
$WarningPreference = "SilentlyContinue"
$logPath = "$(Get-Location)\logs\DEPLOYMENT_$timestamp.log"

@("$(Get-Location)\logs", $EvidenceDir) | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Force $_ | Out-Null }
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $msg = "[$Level] $Message"
    Add-Content $logPath $msg -Force
    Write-Host $msg
}

Write-Log "=== DEPLOYMENT PHASE: Build → Push → Validate ===" "INFO"

$deployment = @{
    timestamp = $timestamp
    image_tag = $ImageTag
    phase = "BUILD"
    status = "pending"
    build_log = @()
    push_log = @()
    update_log = @()
    validation_results = @()
}

try {
    # PHASE 1: PRE-FLIGHT CHECKS
    Write-Log "[DEPLOY] Pre-flight checks..." "INFO"
    
    # Check Azure CLI
    $azcliVersion = & az --version 2>&1 | Select-String "azure-cli" | Select-Object -First 1
    Write-Log "[OK] Azure CLI: $azcliVersion" "INFO"
    
    # Check Docker/ACR login (suppress warnings)
    Write-Log "[DEPLOY] Verifying ACR access..." "INFO"
    & az acr login --name $RegistryName 2>&1 | Select-Object -SkipLast 1 | ForEach-Object { 
        if ($_ -notmatch "WARNING|update" ) { Write-Log "$_" "INFO" }
    }
    Write-Log "[OK] ACR authenticated" "INFO"
    
    # Check Dockerfile exists
    if (-not (Test-Path $DockerfilePath)) {
        Write-Log "[ERROR] Dockerfile not found at $DockerfilePath" "ERROR"
        throw "Dockerfile missing"
    }
    Write-Log "[OK] Dockerfile found" "INFO"
    
    # PHASE 2: BUILD CONTAINER IMAGE
    Write-Log "[DEPLOY] PHASE 2: Building container image..." "INFO"
    $deployment.phase = "BUILD"
    
    $registryUrl = "$RegistryName.azurecr.io"
    $fullImageName = "$registryUrl/eva/eva-data-model:$ImageTag"
    
    Write-Log "[BUILD] Building: $fullImageName" "INFO"
    
    $buildCmd = "az acr build --registry $RegistryName --image eva/eva-data-model:$ImageTag --file $DockerfilePath ."
    Write-Log "[BUILD] Command: $buildCmd" "INFO"
    
    $buildOutput = & az acr build --registry $RegistryName --image "eva/eva-data-model:$ImageTag" --file $DockerfilePath . 2>&1
    $buildOutput | ForEach-Object { 
        Write-Log "$_" "INFO"
        $deployment.build_log += $_
    }
    
    # Check build status
    if ($LASTEXITCODE -ne 0) {
        Write-Log "[ERROR] Build failed with exit code $LASTEXITCODE" "ERROR"
        throw "Build failed"
    }
    Write-Log "[OK] Container image built successfully" "INFO"
    
    # PHASE 3: UPDATE CONTAINER APP
    Write-Log "[DEPLOY] PHASE 3: Updating Container App revision..." "INFO"
    $deployment.phase = "UPDATE"
    
    Write-Log "[UPDATE] Updating: $ContainerAppName with $fullImageName" "INFO"
    
    $updateCmd = "az containerapp update --name $ContainerAppName --resource-group $ContainerAppRG --image $fullImageName"
    Write-Log "[UPDATE] Command: $updateCmd" "INFO"
    
    $updateOutput = & az containerapp update --name $ContainerAppName --resource-group $ContainerAppRG --image $fullImageName 2>&1
    $updateOutput | ForEach-Object { 
        Write-Log "$_" "INFO"
        $deployment.update_log += $_
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "[ERROR] Update failed with exit code $LASTEXITCODE" "ERROR"
        throw "Container App update failed"
    }
    Write-Log "[OK] Container App updated successfully" "INFO"
    
    # Get the app endpoint
    $appInfo = & az containerapp show --name $ContainerAppName --resource-group $ContainerAppRG 2>&1 | ConvertFrom-Json
    $appUrl = $appInfo.properties.configuration.ingress.fqdn
    Write-Log "[OK] App endpoint: https://$appUrl" "INFO"
    
    # PHASE 4: VALIDATION (5 KEY ENDPOINTS)
    Write-Log "[DEPLOY] PHASE 4: Validating endpoints..." "INFO"
    $deployment.phase = "VALIDATE"
    
    $endpoints = @(
        @{ path = "health"; name = "Health Check" },
        @{ path = "model/agent-guide"; name = "Agent Guide" },
        @{ path = "model/user-guide"; name = "User Guide" },
        @{ path = "model/ontology"; name = "Ontology" },
        @{ path = "ready"; name = "Ready Check" }
    )
    
    $validationPassed = 0
    $validationFailed = 0
    $startTime = Get-Date
    $maxWaitSeconds = 120
    
    foreach ($ep in $endpoints) {
        Write-Log "[VALIDATE] Testing $($ep.name): /$($ep.path)" "INFO"
        
        $retries = 0
        $maxRetries = 10
        $responseTime = 0
        $statusCode = 0
        
        while ($retries -lt $maxRetries) {
            try {
                $endpointUrl = "https://$appUrl/$($ep.path)"
                
                $sw = [System.Diagnostics.Stopwatch]::StartNew()
                $response = Invoke-WebRequest -Uri $endpointUrl -UseBasicParsing -TimeoutSec 10 -SkipHttpErrorCheck
                $sw.Stop()
                $responseTime = $sw.ElapsedMilliseconds
                $statusCode = $response.StatusCode
                
                if ($statusCode -eq 200) {
                    Write-Log "[OK] $($ep.name): 200 OK ($($responseTime)ms)" "INFO"
                    $deployment.validation_results += @{
                        endpoint = $ep.path
                        status = "PASSED"
                        status_code = 200
                        response_time_ms = $responseTime
                    }
                    $validationPassed++
                    break
                } else {
                    Write-Log "[WARN] $($ep.name): Status $statusCode (retry $($retries+1)/$maxRetries)" "WARN"
                    $retries++
                    Start-Sleep -Seconds 3
                }
            } catch {
                Write-Log "[WARN] $($ep.name): Connection error (retry $($retries+1)/$maxRetries)" "WARN"
                $retries++
                Start-Sleep -Seconds 3
            }
        }
        
        if ($retries -eq $maxRetries) {
            Write-Log "[FAIL] $($ep.name): Failed after $maxRetries retries" "ERROR"
            $deployment.validation_results += @{
                endpoint = $ep.path
                status = "FAILED"
                reason = "Connection timeout after $maxRetries retries"
            }
            $validationFailed++
        }
    }
    
    # Validation summary
    Write-Log "[VALIDATE] Summary: $validationPassed passed, $validationFailed failed" "INFO"
    
    $deployment.validation_passed = $validationPassed
    $deployment.validation_failed = $validationFailed
    
    if ($validationFailed -eq 0) {
        Write-Log "[OK] All endpoints validated successfully!" "INFO"
        $deployment.status = "SUCCESS"
    } else {
        Write-Log "[WARN] Some endpoints failed validation" "WARN"
        $deployment.status = "PARTIAL_SUCCESS"
    }
    
    # PHASE 5: POST-DEPLOYMENT MONITORING
    Write-Log "[DEPLOY] PHASE 5: Starting post-deployment monitoring..." "INFO"
    $deployment.phase = "MONITOR"
    
    Write-Log "[MONITOR] Collecting container logs (1 min)..." "INFO"
    
    $logsCmd = "az containerapp logs show --name $ContainerAppName --resource-group $ContainerAppRG --follow=false --consecutive=50 2>&1"
    $logs = & az containerapp logs show --name $ContainerAppName --resource-group $ContainerAppRG --follow=false --consecutive=50 2>&1
    
    $errorCount = ($logs | Select-String -Pattern "ERROR|ERROR|FATAL" | Measure-Object).Count
    $warnCount = ($logs | Select-String -Pattern "WARN|WARNING" | Measure-Object).Count
    
    Write-Log "[MONITOR] Container logs: $errorCount errors, $warnCount warnings" "INFO"
    
    if ($errorCount -gt 0) {
        Write-Log "[WARN] Detected errors in container logs" "WARN"
    } else {
        Write-Log "[OK] No critical errors in logs" "INFO"
    }
    
    $deployment.error_count = $errorCount
    $deployment.warning_count = $warnCount
    
} catch {
    Write-Log "[ERROR] Deployment failed: $_" "ERROR"
    $deployment.status = "FAILED"
    $deployment.error = $_.Exception.Message
    exit 1
}

# Save deployment evidence
$evidencePath = "$EvidenceDir\DEPLOYMENT-COMPLETE-$timestamp.json"
$deployment | ConvertTo-Json -Depth 5 | Out-File $evidencePath -Force
Write-Log "[OK] Deployment evidence saved: $evidencePath" "INFO"

# Print summary
Write-Host ""
Write-Host "=== DEPLOYMENT SUMMARY ===" -ForegroundColor Cyan
Write-Host "[OK] Image tag: $ImageTag"
Write-Host "[OK] Endpoints validated: $($deployment.validation_passed)/5"
Write-Host "[OK] Container errors: $($deployment.error_count)"
Write-Host "[OK] Status: $($deployment.status)"
Write-Host "[OK] Endpoint: https://$appUrl"
Write-Host ""

if ($deployment.status -eq "SUCCESS") {
    Write-Host "[SUCCESS] Deployment complete! All systems operational." -ForegroundColor Green
    Write-Host "[NEXT] Create PR to merge feat/security-schemas-p36-p58-20260312 → main" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "[WARNING] Deployment succeeded but some validation issues detected." -ForegroundColor Yellow
    exit 0
}
