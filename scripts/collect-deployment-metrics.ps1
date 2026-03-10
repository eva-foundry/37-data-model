#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Collect comprehensive deployment metrics from msub API
.DESCRIPTION
    Queries /health, /ready, and /model/agent-summary to build a complete snapshot
    of the system state. Used for before/after deployment comparison.
.PARAMETER CloudApiUrl
    Base URL of the data model API
.PARAMETER OutputJson
    If specified, write metrics to this JSON file path
.EXAMPLE
    $before = ./collect-deployment-metrics.ps1 -CloudApiUrl "https://msub-eva..."
    # ... deploy ...
    $after = ./collect-deployment-metrics.ps1 -CloudApiUrl "https://msub-eva..."
    Compare-Object $before.layers.evidence $after.layers.evidence
#>
param(
    [string]$CloudApiUrl = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",
    [string]$OutputJson = ""
)

$ErrorActionPreference = "Stop"

Write-Host "📊 Collecting metrics from $CloudApiUrl..."

# Collect /health
try {
    Write-Host "  ➤ /health..."
    $health = Invoke-RestMethod -Uri "$CloudApiUrl/health" -Method GET -TimeoutSec 10
} catch {
    Write-Warning "/health failed: $_"
    $health = @{ status = "unreachable"; error = $_.Exception.Message }
}

# Collect /ready
try {
    Write-Host "  ➤ /ready..."
    $ready = Invoke-RestMethod -Uri "$CloudApiUrl/ready" -Method GET -TimeoutSec 10
} catch {
    Write-Warning "/ready failed: $_"
    $ready = @{ status = "not_ready"; error = $_.Exception.Message }
}

# Collect /model/agent-summary
try {
    Write-Host "  ➤ /model/agent-summary..."
    $summary = Invoke-RestMethod -Uri "$CloudApiUrl/model/agent-summary" -Method GET -TimeoutSec 30
} catch {
    Write-Warning "/model/agent-summary failed: $_"
    $summary = @{ layers = @{}; total = 0; error = $_.Exception.Message }
}

# Build comprehensive snapshot
$metrics = @{
    timestamp = Get-Date -Format "o"
    health = $health
    ready = $ready
    summary = $summary
    derived_metrics = @{
        is_healthy = ($health.status -eq "ok")
        is_ready = ($ready.store_reachable -eq $true)
        store_type = $health.store
        cache_type = $health.cache
        uptime_seconds = $health.uptime_seconds
        request_count = $health.request_count
        total_objects = $summary.total
        layer_count = $summary.layers.Count
        store_latency_ms = $ready.store_latency_ms
    }
}

Write-Host "✅ Metrics collected successfully"
Write-Host "   Status: $($health.status)"
Write-Host "   Store: $($health.store) ($($ready.store_reachable))"
Write-Host "   Uptime: $($health.uptime_seconds)s"
Write-Host "   Objects: $($summary.total) across $($summary.layers.Count) layers"

# Optionally write to file
if ($OutputJson) {
    $metrics | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputJson -Encoding UTF8
    Write-Host "📁 Written to: $OutputJson"
}

# Return metrics object
return $metrics
