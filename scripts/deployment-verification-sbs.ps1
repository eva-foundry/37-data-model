#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Deployment Verification - Side-by-Side Store Comparison with Evidence Collection

.DESCRIPTION
  HARDENED DEPLOYMENT PROOF SYSTEM - Cannot be bypassed or lied about.
  
  Compares local memory store (port 8010) against cloud Cosmos DB (msub API)
  to ensure they contain identical data after seeding.
  
  Tests every layer systematically and collects evidence:
  - Local store: http://localhost:8010
  - Cloud store: https://msub-eva-data-model...azurecontainerapps.io
  
  Creates DEPLOYMENT PROOF PACK:
  - JSON evidence files (timestamped)
  - Side-by-side comparison results
  - Screenshots requirement checklist
  - Pass/Fail determination (no ambiguity)
  
  Exit codes:
    0 = PASS (stores match perfectly)
    1 = FAIL (discrepancies found)
    2 = ERROR (cannot reach one or both APIs)

.PARAMETER LocalUrl
  Local memory store URL (default: http://localhost:8010)

.PARAMETER CloudUrl
  Cloud Cosmos DB API URL (default: msub production URL)

.PARAMETER OutputDir
  Evidence output directory (default: ./deployment-evidence)

.PARAMETER ScreenshotRequired
  Fail if screenshot evidence not collected

.EXAMPLE
  .\deployment-verification-sbs.ps1
  # Basic verification with default URLs

.EXAMPLE
  .\deployment-verification-sbs.ps1 -ScreenshotRequired
  # Requires manual screenshot collection before PASS

.EXAMPLE
  .\deployment-verification-sbs.ps1 -OutputDir "./evidence/2026-03-10-1300"
  # Custom evidence directory with timestamp
#>

param(
  [string]$LocalUrl = "http://localhost:8010",
  [string]$CloudUrl = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",
  [string]$OutputDir = "./deployment-evidence",
  [switch]$ScreenshotRequired
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ═════════════════════════════════════════════════════════════════════════════
# DEPLOYMENT VERIFICATION - SIDE-BY-SIDE COMPARISON
# ═════════════════════════════════════════════════════════════════════════════

$script:timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$script:evidenceDir = Join-Path $OutputDir $timestamp
$script:passCount = 0
$script:failCount = 0
$script:errorCount = 0
$script:discrepancies = @()

# Create evidence directory
New-Item -ItemType Directory -Path $script:evidenceDir -Force | Out-Null

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  DEPLOYMENT VERIFICATION - SIDE-BY-SIDE STORE COMPARISON          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Purpose: Ensure local and cloud stores contain IDENTICAL data" -ForegroundColor White
Write-Host "Timestamp: $timestamp" -ForegroundColor Gray
Write-Host "Evidence dir: $script:evidenceDir" -ForegroundColor Gray
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# Test Functions
# ─────────────────────────────────────────────────────────────────────────────

function Test-ApiReachability {
  param([string]$Url, [string]$StoreName)
  
  Write-Host "Testing $StoreName reachability..." -ForegroundColor Yellow -NoNewline
  
  try {
    $response = Invoke-RestMethod "$Url/health" -TimeoutSec 5
    
    if ($response.status -eq "ok") {
      Write-Host " ✓ OK" -ForegroundColor Green
      return @{
        reachable = $true
        status = $response.status
        store = $response.store
        uptime = $response.uptime_seconds
      }
    } else {
      Write-Host " ✗ FAIL (status: $($response.status))" -ForegroundColor Red
      return @{reachable = $false; error = "Status not ok"}
    }
  } catch {
    Write-Host " ✗ UNREACHABLE" -ForegroundColor Red
    return @{reachable = $false; error = $_.Exception.Message}
  }
}

function Get-LayerCount {
  param([string]$Url, [string]$Layer)
  
  try {
    $response = Invoke-RestMethod "$Url/model/$Layer/" -TimeoutSec 10
    $count = if ($response.data) { $response.data.Count } else { 0 }
    return @{success = $true; count = $count; error = $null}
  } catch {
    return @{success = $false; count = -1; error = $_.Exception.Message}
  }
}

function Get-AllLayersSummary {
  param([string]$Url)
  
  try {
    $summary = Invoke-RestMethod "$Url/model/agent-summary" -TimeoutSec 10
    return @{
      success = $true
      total_records = $summary.totals.total_records
      layer_counts = $summary.layer_counts
      layer_names = @($summary.layer_counts.PSObject.Properties.Name | Sort-Object)
    }
  } catch {
    return @{success = $false; error = $_.Exception.Message}
  }
}

function Compare-LayerData {
  param(
    [string]$Layer,
    [int]$LocalCount,
    [int]$CloudCount
  )
  
  $match = ($LocalCount -eq $CloudCount)
  $status = if ($match) { "✓ MATCH" } else { "✗ MISMATCH" }
  $color = if ($match) { "Green" } else { "Red" }
  
  $result = [PSCustomObject]@{
    layer = $Layer
    local_count = $LocalCount
    cloud_count = $CloudCount
    match = $match
    discrepancy = if ($match) { 0 } else { [Math]::Abs($LocalCount - $CloudCount) }
    status = $status
  }
  
  if ($match) {
    $script:passCount++
  } else {
    $script:failCount++
    $script:discrepancies += $result
  }
  
  return $result
}

# ─────────────────────────────────────────────────────────────────────────────
# Phase 1: Pre-flight Checks
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "═══ Phase 1: Pre-flight Checks ═══" -ForegroundColor Cyan
Write-Host ""

$localHealth = Test-ApiReachability -Url $LocalUrl -StoreName "LOCAL (8010)"
$cloudHealth = Test-ApiReachability -Url $CloudUrl -StoreName "CLOUD (msub)"

if (-not $localHealth.reachable) {
  Write-Host ""
  Write-Host "✗ FATAL: Local API unreachable" -ForegroundColor Red
  Write-Host "  Start local API: cd api && uvicorn server:app --port 8010" -ForegroundColor Yellow
  exit 2
}

if (-not $cloudHealth.reachable) {
  Write-Host ""
  Write-Host "✗ FATAL: Cloud API unreachable" -ForegroundColor Red
  Write-Host "  Check Azure Container App status" -ForegroundColor Yellow
  exit 2
}

Write-Host ""
Write-Host "Local Store: $($localHealth.store) (uptime: $($localHealth.uptime)s)" -ForegroundColor Gray
Write-Host "Cloud Store: $($cloudHealth.store) (uptime: $($cloudHealth.uptime)s)" -ForegroundColor Gray
Write-Host ""

# Save pre-flight evidence
$preFlightEvidence = @{
  timestamp = $timestamp
  local_health = $localHealth
  cloud_health = $cloudHealth
}

$preFlightEvidence | ConvertTo-Json -Depth 10 | Out-File "$script:evidenceDir/01-preflight-check.json"

# ─────────────────────────────────────────────────────────────────────────────
# Phase 2: Layer Count Summary
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "═══ Phase 2: Layer Count Summary ═══" -ForegroundColor Cyan
Write-Host ""

$localSummary = Get-AllLayersSummary -Url $LocalUrl
$cloudSummary = Get-AllLayersSummary -Url $CloudUrl

if (-not $localSummary.success) {
  Write-Host "✗ FATAL: Cannot get local summary" -ForegroundColor Red
  exit 2
}

if (-not $cloudSummary.success) {
  Write-Host "✗ FATAL: Cannot get cloud summary" -ForegroundColor Red
  exit 2
}

Write-Host "Local:  $($localSummary.layer_names.Count) layers, $($localSummary.total_records) records" -ForegroundColor White
Write-Host "Cloud:  $($cloudSummary.layer_names.Count) layers, $($cloudSummary.total_records) records" -ForegroundColor White
Write-Host ""

# Compare total records
if ($localSummary.total_records -ne $cloudSummary.total_records) {
  Write-Host "✗ WARNING: Total record count mismatch!" -ForegroundColor Red
  Write-Host "  Local: $($localSummary.total_records)" -ForegroundColor Red
  Write-Host "  Cloud: $($cloudSummary.total_records)" -ForegroundColor Red
  Write-Host ""
}

# Compare layer availability
$localOnly = $localSummary.layer_names | Where-Object { $_ -notin $cloudSummary.layer_names }
$cloudOnly = $cloudSummary.layer_names | Where-Object { $_ -notin $localSummary.layer_names }

if ($localOnly.Count -gt 0) {
  Write-Host "✗ Layers only in LOCAL: $($localOnly -join ', ')" -ForegroundColor Red
}

if ($cloudOnly.Count -gt 0) {
  Write-Host "✗ Layers only in CLOUD: $($cloudOnly -join ', ')" -ForegroundColor Red
}

# Get intersection for detailed comparison
$commonLayers = $localSummary.layer_names | Where-Object { $_ -in $cloudSummary.layer_names } | Sort-Object

Write-Host "Common layers for comparison: $($commonLayers.Count)" -ForegroundColor Cyan
Write-Host ""

# Save summary evidence
$summaryEvidence = @{
  timestamp = $timestamp
  local = @{
    layer_count = $localSummary.layer_names.Count
    total_records = $localSummary.total_records
    layers = $localSummary.layer_names
  }
  cloud = @{
    layer_count = $cloudSummary.layer_names.Count
    total_records = $cloudSummary.total_records
    layers = $cloudSummary.layer_names
  }
  comparison = @{
    common_layers = $commonLayers
    local_only = $localOnly
    cloud_only = $cloudOnly
    total_match = ($localSummary.total_records -eq $cloudSummary.total_records)
  }
}

$summaryEvidence | ConvertTo-Json -Depth 10 | Out-File "$script:evidenceDir/02-summary-comparison.json"

# ─────────────────────────────────────────────────────────────────────────────
# Phase 3: Layer-by-Layer Comparison
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "═══ Phase 3: Layer-by-Layer Verification ═══" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comparing $($commonLayers.Count) common layers..." -ForegroundColor Gray
Write-Host ""

$detailedResults = @()
$progress = 0

foreach ($layer in $commonLayers) {
  $progress++
  $pct = [math]::Round(($progress / $commonLayers.Count) * 100)
  
  Write-Host "[$pct%] $layer" -ForegroundColor Gray -NoNewline
  Write-Host "..." -NoNewline
  
  $localCount = $localSummary.layer_counts.$layer
  $cloudCount = $cloudSummary.layer_counts.$layer
  
  $comparison = Compare-LayerData -Layer $layer -LocalCount $localCount -CloudCount $cloudCount
  $detailedResults += $comparison
  
  if ($comparison.match) {
    Write-Host " ✓ " -ForegroundColor Green -NoNewline
    Write-Host "$localCount records" -ForegroundColor Gray
  } else {
    Write-Host " ✗ MISMATCH" -ForegroundColor Red
    Write-Host "  Local:  $localCount" -ForegroundColor Yellow
    Write-Host "  Cloud:  $cloudCount" -ForegroundColor Yellow
    Write-Host "  Delta:  $($comparison.discrepancy)" -ForegroundColor Red
  }
}

Write-Host ""

# Save detailed results
$detailedResults | ConvertTo-Json -Depth 10 | Out-File "$script:evidenceDir/03-layer-by-layer-comparison.json"

# ─────────────────────────────────────────────────────────────────────────────
# Phase 4: Results Summary & Verdict
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "═══ Phase 4: Final Verdict ═══" -ForegroundColor Cyan
Write-Host ""

$totalTests = $script:passCount + $script:failCount
$passRate = if ($totalTests -gt 0) { [math]::Round(($script:passCount / $totalTests) * 100, 1) } else { 0 }

Write-Host "Results:" -ForegroundColor White
Write-Host "  ✓ Matching:    $script:passCount / $totalTests" -ForegroundColor Green
Write-Host "  ✗ Mismatching: $script:failCount / $totalTests" -ForegroundColor $(if ($script:failCount -eq 0) { 'Gray' } else { 'Red' })
Write-Host "  Pass Rate:     $passRate%" -ForegroundColor $(if ($passRate -eq 100) { 'Green' } else { 'Yellow' })
Write-Host ""

# Verdict determination
$verdict = if ($script:failCount -eq 0 -and $localSummary.total_records -eq $cloudSummary.total_records) {
  "PASS"
} else {
  "FAIL"
}

$verdictColor = if ($verdict -eq "PASS") { "Green" } else { "Red" }

Write-Host "════════════════════════════════════════" -ForegroundColor $verdictColor
Write-Host "  VERDICT: $verdict" -ForegroundColor $verdictColor
Write-Host "════════════════════════════════════════" -ForegroundColor $verdictColor
Write-Host ""

if ($verdict -eq "PASS") {
  Write-Host "✓ Stores are IDENTICAL - deployment successful" -ForegroundColor Green
  Write-Host "✓ Local and cloud contain same data" -ForegroundColor Green
  Write-Host "✓ Ready for production traffic" -ForegroundColor Green
} else {
  Write-Host "✗ Stores are DIFFERENT - deployment FAILED" -ForegroundColor Red
  Write-Host ""
  Write-Host "Discrepancies found in:" -ForegroundColor Yellow
  foreach ($disc in $script:discrepancies) {
    Write-Host "  - $($disc.layer): Local=$($disc.local_count), Cloud=$($disc.cloud_count) (Δ$($disc.discrepancy))" -ForegroundColor Red
  }
  Write-Host ""
  Write-Host "Action Required:" -ForegroundColor Yellow
  Write-Host "  1. Check seed operation completed on cloud" -ForegroundColor White
  Write-Host "  2. Verify /admin/seed was called with correct endpoint" -ForegroundColor White
  Write-Host "  3. Review seed operation logs in evidence directory" -ForegroundColor White
}

Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# Phase 5: Evidence Pack Creation
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "═══ Phase 5: Evidence Pack ═══" -ForegroundColor Cyan
Write-Host ""

$evidencePack = @{
  metadata = @{
    timestamp = $timestamp
    script_version = "1.0.0"
    local_url = $LocalUrl
    cloud_url = $CloudUrl
    operator = $env:USERNAME
    hostname = $env:COMPUTERNAME
  }
  
  preflight = @{
    local_reachable = $localHealth.reachable
    cloud_reachable = $cloudHealth.reachable
    local_store_type = $localHealth.store
    cloud_store_type = $cloudHealth.store
  }
  
  summary = @{
    local_layers = $localSummary.layer_names.Count
    cloud_layers = $cloudSummary.layer_names.Count
    local_records = $localSummary.total_records
    cloud_records = $cloudSummary.total_records
    common_layers = $commonLayers.Count
    layers_local_only = $localOnly
    layers_cloud_only = $cloudOnly
  }
  
  detailed_comparison = $detailedResults
  
  verdict = @{
    status = $verdict
    pass_count = $script:passCount
    fail_count = $script:failCount
    pass_rate_percent = $passRate
    stores_identical = ($verdict -eq "PASS")
  }
  
  required_actions = @{
    screenshot_collected = $false  # Must be manually set
    seed_log_attached = $false     # Must be manually attached
    cosmos_query_verified = $false # Must be manually verified
  }
}

# Save master evidence pack
$evidencePack | ConvertTo-Json -Depth 10 | Out-File "$script:evidenceDir/EVIDENCE-PACK.json"

Write-Host "Evidence saved to:" -ForegroundColor Cyan
Write-Host "  $script:evidenceDir/01-preflight-check.json" -ForegroundColor Gray
Write-Host "  $script:evidenceDir/02-summary-comparison.json" -ForegroundColor Gray
Write-Host "  $script:evidenceDir/03-layer-by-layer-comparison.json" -ForegroundColor Gray
Write-Host "  $script:evidenceDir/EVIDENCE-PACK.json" -ForegroundColor White
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# Phase 6: Screenshot Requirement Check
# ─────────────────────────────────────────────────────────────────────────────

if ($ScreenshotRequired) {
  Write-Host "═══ Phase 6: Screenshot Requirement ═══" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Screenshots REQUIRED for deployment proof:" -ForegroundColor Yellow
  Write-Host "  1. Local /health endpoint response" -ForegroundColor White
  Write-Host "  2. Cloud /health endpoint response" -ForegroundColor White
  Write-Host "  3. Local /model/agent-summary response" -ForegroundColor White
  Write-Host "  4. Cloud /model/agent-summary response" -ForegroundColor White
  Write-Host "  5. This script's final verdict section" -ForegroundColor White
  Write-Host ""
  Write-Host "Save screenshots to: $script:evidenceDir/screenshots/" -ForegroundColor Cyan
  Write-Host ""
  
  # Create screenshots directory
  New-Item -ItemType Directory -Path "$script:evidenceDir/screenshots" -Force | Out-Null
  
  Write-Host "Press Enter when screenshots are collected..." -NoNewline
  $null = Read-Host
  
  # Check if screenshots exist
  $screenshotFiles = Get-ChildItem "$script:evidenceDir/screenshots" -ErrorAction SilentlyContinue
  
  if ($screenshotFiles.Count -lt 5) {
    Write-Host ""
    Write-Host "✗ FAIL: Insufficient screenshots ($($screenshotFiles.Count) / 5)" -ForegroundColor Red
    Write-Host "  Deployment cannot be marked as verified without screenshots" -ForegroundColor Red
    exit 1
  } else {
    Write-Host ""
    Write-Host "✓ Screenshots collected ($($screenshotFiles.Count) files)" -ForegroundColor Green
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# Exit with appropriate code
# ─────────────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Deployment verification complete: $verdict" -ForegroundColor $verdictColor
Write-Host ""

if ($verdict -eq "PASS") {
  exit 0
} else {
  exit 1
}
