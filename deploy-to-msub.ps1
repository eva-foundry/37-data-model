#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Deploy 37-data-model to msub-eva-data-model Container App (2-subscription deployment).

.DESCRIPTION
  Step 1: Build image in target ACR (msubsandacr202603031449) under MarcoSub subscription
  Step 2: Update Container App (msub-eva-data-model) to new image
  Step 3: Verify deployment (health check, agent-summary, L33-L35 endpoints)

.PARAMETER Tag
  Image tag (default: date-time stamp like 20260306-0900)

.PARAMETER SkipBuild
  Skip ACR build (use existing image)

.PARAMETER SkipVerify
  Skip post-deployment verification

.EXAMPLE
  .\deploy-to-msub.ps1
  # Builds and deploys with auto-generated tag

.EXAMPLE
  .\deploy-to-msub.ps1 -Tag "session-28-pr12"
  # Deploys with custom tag

.EXAMPLE
  .\deploy-to-msub.ps1 -SkipBuild -Tag "20260305-2022"
  # Deploys existing image without rebuilding
#>

param(
  [string]$Tag = "",
  [switch]$SkipBuild,
  [switch]$SkipVerify
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Configuration ──────────────────────────────────────────────────────────────
$SOURCE_SUBSCRIPTION = "e5ca0637-198e-4ff9-bc6a-30dcb8f1f8f1"  # DevEval
$TARGET_SUBSCRIPTION = "c59ee575-eb2a-4b51-a865-4b618f9add0a"  # MarcoSub

$SOURCE_ACR = "marcoeva"
$TARGET_ACR = "msubsandacr202603031449"
$IMAGE_NAME = "eva/eva-data-model"

$CONTAINER_APP = "msub-eva-data-model"
$RESOURCE_GROUP = "EVA-Sandbox-dev"
$CLOUD_URL = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

# ── Helper Functions ───────────────────────────────────────────────────────────
function Write-Step {
  param([string]$Message)
  Write-Host "`n━━━ $Message ━━━" -ForegroundColor Cyan
}

function Write-Success {
  param([string]$Message)
  Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Info {
  param([string]$Message)
  Write-Host "  $Message" -ForegroundColor Gray
}

function Write-Warn {
  param([string]$Message)
  Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error-Message {
  param([string]$Message)
  Write-Host "✗ $Message" -ForegroundColor Red
}

# ── Generate Tag if not provided ───────────────────────────────────────────────
if (-not $Tag) {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
  $Tag = $timestamp
  Write-Info "Auto-generated tag: $Tag"
}

$FULL_IMAGE = "${IMAGE_NAME}:${Tag}"
Write-Info "Image: $FULL_IMAGE"

# ── STEP 1: Build in Target ACR (Simplified - Single Subscription) ────────────
if (-not $SkipBuild) {
  Write-Step "Step 1: Build image in target ACR ($TARGET_ACR)"
  
  Write-Info "Switching to MarcoSub subscription..."
  az account set --subscription $TARGET_SUBSCRIPTION
  
  $currentSub = az account show --query name -o tsv
  Write-Info "Current subscription: $currentSub"
  
  Write-Info "Building Docker image in ACR..."
  Write-Info "Command: az acr build --registry $TARGET_ACR --image $FULL_IMAGE --file Dockerfile ."
  
  $buildStartTime = Get-Date
  az acr build --registry $TARGET_ACR --image $FULL_IMAGE --file Dockerfile .
  
  if ($LASTEXITCODE -ne 0) {
    Write-Error-Message "ACR build failed with exit code $LASTEXITCODE"
    exit 1
  }
  
  $buildDuration = (Get-Date) - $buildStartTime
  Write-Success "Image built successfully in $([int]$buildDuration.TotalSeconds)s"
  Write-Info "Image: ${TARGET_ACR}.azurecr.io/${FULL_IMAGE}"
  
  # Verify image exists in ACR
  Write-Info "Verifying image in ACR..."
  $tags = az acr repository show-tags --name $TARGET_ACR --repository $IMAGE_NAME --output json | ConvertFrom-Json
  
  if ($tags -contains $Tag) {
    Write-Success "Image verified in ACR: ${TARGET_ACR}.azurecr.io/${FULL_IMAGE}"
  } else {
    Write-Error-Message "Image not found in ACR after build"
    exit 1
  }
} else {
  Write-Warn "Skipping build (using existing image: $FULL_IMAGE)"
}

# ── STEP 2: Update Container App ──────────────────────────────────────────────
Write-Step "Step 2: Update Container App ($CONTAINER_APP)"

Write-Info "Updating Container App to new image..."
Write-Info "Command: az containerapp update --name $CONTAINER_APP --resource-group $RESOURCE_GROUP --image ${TARGET_ACR}.azurecr.io/${FULL_IMAGE}"

az containerapp update `
  --name $CONTAINER_APP `
  --resource-group $RESOURCE_GROUP `
  --image "${TARGET_ACR}.azurecr.io/${FULL_IMAGE}"

if ($LASTEXITCODE -ne 0) {
  Write-Error-Message "Container App update failed with exit code $LASTEXITCODE"
  exit 1
}

Write-Success "Container App updated successfully"

# Get new revision name
$revision = az containerapp revision list `
  --name $CONTAINER_APP `
  --resource-group $RESOURCE_GROUP `
  --query "[0].name" `
  --output tsv

Write-Info "New revision: $revision"

# ── STEP 3: Verify Deployment ─────────────────────────────────────────────────
if (-not $SkipVerify) {
  Write-Step "Step 3: Verify Deployment"
  
  Write-Info "Waiting 60 seconds for Container App to restart..."
  Start-Sleep -Seconds 60
  
  # Health check
  Write-Info "Testing health endpoint..."
  try {
    $health = Invoke-RestMethod "$CLOUD_URL/health" -ErrorAction Stop
    $uptime = $health.uptime_seconds
    
    if ($uptime -lt 120) {
      Write-Success "Health check PASS (uptime: ${uptime}s - recently restarted)"
    } else {
      Write-Warn "Health check PASS but uptime unexpected (${uptime}s - may not have restarted)"
    }
  } catch {
    Write-Error-Message "Health check FAILED: $_"
    exit 1
  }
  
  # Agent summary check
  Write-Info "Testing agent-summary endpoint..."
  try {
    $summary = Invoke-RestMethod "$CLOUD_URL/model/agent-summary" -ErrorAction Stop
    $layerCount = ($summary.layers.PSObject.Properties | Measure-Object).Count
    $evidenceCount = $summary.layers.evidence
    
    Write-Success "Agent summary PASS"
    Write-Info "  Layers: $layerCount"
    Write-Info "  Evidence: $evidenceCount"
    
    # Check for Session 28 layers (L33-L35)
    $hasL33 = $null -ne $summary.layers.agent_policies
    $hasL34 = $null -ne $summary.layers.quality_gates
    $hasL35 = $null -ne $summary.layers.github_rules
    
    if ($hasL33 -and $hasL34 -and $hasL35) {
      Write-Success "Session 28 layers detected (L33-L35: ✓)"
      Write-Info "  L33 agent_policies: $($summary.layers.agent_policies) objects"
      Write-Info "  L34 quality_gates: $($summary.layers.quality_gates) objects"
      Write-Info "  L35 github_rules: $($summary.layers.github_rules) objects"
    } else {
      Write-Warn "Session 28 layers NOT detected"
      Write-Info "  L33 agent_policies: $(if($hasL33){'✓'}else{'✗'})"
      Write-Info "  L34 quality_gates: $(if($hasL34){'✓'}else{'✗'})"
      Write-Info "  L35 github_rules: $(if($hasL35){'✓'}else{'✗'})"
    }
  } catch {
    Write-Error-Message "Agent summary check FAILED: $_"
    exit 1
  }
  
  # Test L33-L35 endpoints
  Write-Info "Testing Session 28 endpoints..."
  
  $endpoints = @(
    "/model/agent_policies/",
    "/model/quality_gates/",
    "/model/github_rules/"
  )
  
  $passCount = 0
  $failCount = 0
  
  foreach ($endpoint in $endpoints) {
    try {
      $response = Invoke-RestMethod "$CLOUD_URL$endpoint" -ErrorAction Stop
      $count = ($response.data | Measure-Object).Count
      Write-Success "  $endpoint → 200 OK ($count objects)"
      $passCount++
    } catch {
      Write-Error-Message "  $endpoint → FAILED: $_"
      $failCount++
    }
  }
  
  if ($failCount -eq 0) {
    Write-Success "All Session 28 endpoints operational ($passCount/$($endpoints.Count))"
  } else {
    Write-Warn "Some endpoints failed ($passCount/$($endpoints.Count) passed, $failCount failed)"
  }
  
} else {
  Write-Warn "Skipping verification (use -SkipVerify to skip)"
}

# ── Summary ────────────────────────────────────────────────────────────────────
Write-Step "Deployment Complete"
Write-Success "Image: ${TARGET_ACR}.azurecr.io/${FULL_IMAGE}"
Write-Success "Container App: $CONTAINER_APP (revision: $revision)"
Write-Success "Cloud URL: $CLOUD_URL"

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Test endpoints manually: $CLOUD_URL/model/agent-guide" -ForegroundColor Gray
Write-Host "  2. Update STATUS.md with deployment timestamp" -ForegroundColor Gray
Write-Host "  3. Monitor Container App logs: az containerapp logs show -n $CONTAINER_APP -g $RESOURCE_GROUP --follow" -ForegroundColor Gray

exit 0
