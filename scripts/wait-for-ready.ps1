#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Wait for Container App to become ready (intelligent polling, not blind sleep)
.DESCRIPTION
    Polls /ready endpoint until store is reachable OR timeout is reached.
    Replaces "sleep 90" with actual readiness detection.
.PARAMETER CloudApiUrl
    Base URL of the data model API
.PARAMETER TimeoutSeconds
    Maximum time to wait (default: 180 seconds = 3 minutes)
.PARAMETER PollIntervalSeconds
    How often to check (default: 5 seconds)
.EXAMPLE
    ./wait-for-ready.ps1 -CloudApiUrl "https://msub-eva..." -TimeoutSeconds 120
#>
param(
    [string]$CloudApiUrl = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",
    [int]$TimeoutSeconds = 180,
    [int]$PollIntervalSeconds = 5
)

$ErrorActionPreference = "Continue"

Write-Host "⏳ Waiting for Container App to become ready..."
Write-Host "   URL: $CloudApiUrl/ready"
Write-Host "   Timeout: ${TimeoutSeconds}s"
Write-Host "   Poll interval: ${PollIntervalSeconds}s"

$startTime = Get-Date
$attempt = 0

while ($true) {
    $attempt++
    $elapsed = ((Get-Date) - $startTime).TotalSeconds
    
    if ($elapsed -gt $TimeoutSeconds) {
        Write-Error "❌ Timeout reached after ${TimeoutSeconds}s. Container App did not become ready."
        exit 1
    }
    
    Write-Host "[$attempt] Checking readiness (elapsed: $([int]$elapsed)s)..."
    
    try {
        $response = Invoke-RestMethod -Uri "$CloudApiUrl/ready" -Method GET -TimeoutSec 10
        
        if ($response.status -eq "ready" -and $response.store_reachable -eq $true) {
            $totalWait = [int]$elapsed
            Write-Host "✅ Container App is READY!"
            Write-Host "   Status: $($response.status)"
            Write-Host "   Store: $($response.store) (reachable)"
            Write-Host "   Latency: $($response.store_latency_ms)ms"
            Write-Host "   Uptime: $($response.uptime_seconds)s"
            Write-Host "   Total wait: ${totalWait}s"
            exit 0
        } else {
            Write-Host "   Status: $($response.status) (store_reachable: $($response.store_reachable))"
            Write-Host "   Waiting ${PollIntervalSeconds}s before retry..."
        }
    } catch {
        Write-Host "   Request failed: $($_.Exception.Message)"
        Write-Host "   Waiting ${PollIntervalSeconds}s before retry..."
    }
    
    Start-Sleep -Seconds $PollIntervalSeconds
}
