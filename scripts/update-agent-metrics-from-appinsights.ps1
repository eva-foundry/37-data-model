#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Update agent performance metrics from Application Insights to L41.
    
.DESCRIPTION
    Queries Application Insights for agent execution telemetry and calculates
    performance metrics for the agent_performance_metrics layer (L41).
    
    Metrics calculated:
    - reliability_score: Success rate over last 24 hours
    - speed_percentile: Response time compared to baseline
    - cost_efficiency_percentile: Cost per operation compared to baseline
    - safety_incidents: Count of errors/warnings in period
    - rollback_rate: Deployment rollback frequency
    
.PARAMETER AppInsightsName
    Application Insights resource name (default: msub-sandbox-appinsights)
    
.PARAMETER ResourceGroup
    Resource group containing App Insights (default: EVA-Sandbox-dev)
    
.PARAMETER DataModelUrl
    Data model API endpoint (default: msub-eva-data-model)
    
.PARAMETER LookbackHours
    Hours to look back for metrics (default: 1 hour for scheduled runs)
    
.PARAMETER DryRun
    If set, shows metrics without uploading to data model
    
.EXAMPLE
    .\update-agent-metrics-from-appinsights.ps1
    # Update metrics for last hour (scheduled run)
    
.EXAMPLE
    .\update-agent-metrics-from-appinsights.ps1 -LookbackHours 24
    # Calculate metrics for last 24 hours
    
.EXAMPLE
    .\update-agent-metrics-from-appinsights.ps1 -DryRun
    # Preview metrics without uploading
    
.NOTES
    Author: EVA Foundation (Session 39)
    Date: 2026-03-08
    Requires: Azure CLI authenticated, App Insights access
    Schedule: Hourly (recommended)
#>

[CmdletBinding()]
param(
    [string]$AppInsightsName = "msub-sandbox-appinsights",
    [string]$ResourceGroup = "EVA-Sandbox-dev",
    [string]$DataModelUrl = $env:DATA_MODEL_URL ?? "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",
    [string]$XActor = $env:X_ACTOR ?? "agent:metrics-sync",
    [int]$LookbackHours = 1,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ───────────────────────────────────────────────────────────────────────────
# Helper Functions
# ───────────────────────────────────────────────────────────────────────────

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $colors = @{
        "INFO"    = "Cyan"
        "SUCCESS" = "Green"
        "WARNING" = "Yellow"
        "ERROR"   = "Red"
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $colors[$Level]
}

function Get-AppInsightsId {
    param([string]$Name, [string]$RG)
    
    Write-Log "Resolving Application Insights resource..."
    
    try {
        # Get token
        $token = az account get-access-token --query accessToken -o tsv
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to get access token"
        }
        
        # Get current subscription
        $subscription = az account show --query id -o tsv
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to get subscription ID"
        }
        
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type"  = "application/json"
        }
        
        # Get App Insights resource
        $url = "https://management.azure.com/subscriptions/$subscription/resourceGroups/$RG/providers/Microsoft.Insights/components/$Name?api-version=2020-02-02"
        
        $response = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -UseBasicParsing
        $appInsights = $response.Content | ConvertFrom-Json
        
        Write-Log "✓ Found: $($appInsights.name)" -Level SUCCESS
        
        return @{
            id = $appInsights.id
            appId = $appInsights.properties.AppId
            instrumentationKey = $appInsights.properties.InstrumentationKey
        }
        
    } catch {
        Write-Log "✗ Failed to resolve App Insights: $_" -Level ERROR
        throw
    }
}

function Invoke-AppInsightsQuery {
    param([string]$AppId, [string]$Query, [int]$Timespan)
    
    try {
        # Get token
        $token = az account get-access-token --query accessToken -o tsv
        
        Write-Log "Executing KQL query (timespan: $($Timespan)h)..." -Level INFO
        
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type"  = "application/json"
            "x-ms-app"      = "pwsh"
        }
        
        # App Insights Analytics API
        $url = "https://api.applicationinsights.io/v1/apps/$AppId/query"
        
        $body = @{
            query = $Query
            timespan = "PT{0}H" -f $Timespan
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri $url `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -UseBasicParsing
        
        $result = $response.Content | ConvertFrom-Json
        
        if ($result.tables -and $result.tables[0].rows) {
            $rowCount = $result.tables[0].rows.Count
            Write-Log "✓ Query returned $rowCount rows" -Level SUCCESS
            return $result.tables[0].rows
        } else {
            Write-Log "⚠ Query returned no data" -Level WARNING
            return @()
        }
        
    } catch {
        Write-Log "✗ Query failed: $_" -Level ERROR
        return @()
    }
}

function Get-AgentReliabilityMetrics {
    param([string]$AppId, [int]$Hours)
    
    Write-Log "Computing reliability metrics..."
    
    # Query: Success vs failure rates by agent
    $query = @"
requests
| where timestamp > ago($($Hours)h)
| where cloud_RoleName != ""
| summarize 
    Total = count(),
    Successful = countif(success == true),
    Failed = countif(success == false),
    AvgDuration = avg(duration),
    P50Duration = percentile(duration, 50),
    P95Duration = percentile(duration, 95)
  by AgentId = cloud_RoleName
| extend ReliabilityScore = (Successful * 100.0) / Total
| project AgentId, Total, Successful, Failed, ReliabilityScore, AvgDuration, P50Duration, P95Duration
"@
    
    $results = Invoke-AppInsightsQuery -AppId $AppId -Query $query -Timespan $Hours
    return $results
}

function Get-AgentSafetyIncidents {
    param([string]$AppId, [int]$Hours)
    
    Write-Log "Computing safety incident metrics..."
    
    # Query: Errors and exceptions by agent
    $query = @"
union exceptions, traces
| where timestamp > ago($($Hours)h)
| where cloud_RoleName != ""
| where severityLevel >= 2  // Warning and above
| summarize 
    TotalIncidents = count(),
    CriticalIncidents = countif(severityLevel >= 3),
    ErrorMessages = make_set(message, 10)
  by AgentId = cloud_RoleName
| project AgentId, TotalIncidents, CriticalIncidents, ErrorMessages
"@
    
    $results = Invoke-AppInsightsQuery -AppId $AppId -Query $query -Timespan $Hours
    return $results
}

function Get-AgentCostMetrics {
    param([string]$AppId, [int]$Hours)
    
    Write-Log "Computing cost efficiency metrics..."
    
    # Query: Request counts and estimated compute cost
    $query = @"
requests
| where timestamp > ago($($Hours)h)
| where cloud_RoleName != ""
| summarize 
    RequestCount = count(),
    TotalDuration = sum(duration),
    AvgDuration = avg(duration)
  by AgentId = cloud_RoleName
| extend EstimatedComputeCost = (TotalDuration / 1000.0) * 0.00001667  // Rough estimate: $0.00001667 per second
| extend CostPerRequest = EstimatedComputeCost / RequestCount
| project AgentId, RequestCount, EstimatedComputeCost, CostPerRequest
"@
    
    $results = Invoke-AppInsightsQuery -AppId $AppId -Query $query -Timespan $Hours
    return $results
}

function Calculate-Percentiles {
    param([decimal]$Value, [decimal[]]$AllValues)
    
    if ($AllValues.Count -eq 0) { return 50 }
    
    $sorted = $AllValues | Sort-Object
    $position = ($sorted | Where-Object { $_ -lt $Value }).Count
    $percentile = ($position / $sorted.Count) * 100
    
    return [Math]::Round($percentile, 2)
}

function Transform-ToL41Schema {
    param(
        [array]$ReliabilityData,
        [array]$SafetyData,
        [array]$CostData
    )
    
    Write-Log "Transforming to L41 schema format..."
    
    $l41Records = @()
    
    # Get unique agent IDs
    $allAgentIds = @()
    $allAgentIds += $ReliabilityData | ForEach-Object { $_[0] }
    $allAgentIds += $SafetyData | ForEach-Object { $_[0] }
    $allAgentIds += $CostData | ForEach-Object { $_[0] }
    $uniqueAgentIds = $allAgentIds | Select-Object -Unique
    
    Write-Log "  Found $($uniqueAgentIds.Count) unique agents"
    
    # Calculate percentiles for normalization
    $allReliabilityScores = $ReliabilityData | ForEach-Object { [decimal]$_[4] }
    $allSpeedScores = $ReliabilityData | ForEach-Object { [decimal]$_[5] }
    $allCostScores = $CostData | ForEach-Object { [decimal]$_[3] }
    
    foreach ($agentId in $uniqueAgentIds) {
        # Find data for this agent
        $reliability = $ReliabilityData | Where-Object { $_[0] -eq $agentId } | Select-Object -First 1
        $safety = $SafetyData | Where-Object { $_[0] -eq $agentId } | Select-Object -First 1
        $cost = $CostData | Where-Object { $_[0] -eq $agentId } | Select-Object -First 1
        
        # Build L41 record
        $record = @{
            id = $agentId.ToLower() -replace '[^a-z0-9-]', '-'
            agent_id = $agentId
            agent_name = $agentId
            measurement_period_hours = $LookbackHours
            reliability_score = if ($reliability) { [Math]::Round([decimal]$reliability[4], 2) } else { 0 }
            speed_percentile = if ($reliability) { 
                Calculate-Percentiles -Value ([decimal]$reliability[5]) -AllValues $allSpeedScores 
            } else { 50 }
            cost_efficiency_percentile = if ($cost) { 
                100 - (Calculate-Percentiles -Value ([decimal]$cost[3]) -AllValues $allCostScores)
            } else { 50 }
            total_executions = if ($reliability) { [int]$reliability[1] } else { 0 }
            successful_executions = if ($reliability) { [int]$reliability[2] } else { 0 }
            failed_executions = if ($reliability) { [int]$reliability[3] } else { 0 }
            safety_incidents = if ($safety) { [int]$safety[1] } else { 0 }
            critical_incidents = if ($safety) { [int]$safety[2] } else { 0 }
            rollback_rate = 0  # TODO: Calculate from deployment records
            performance_details = @{
                avg_duration_ms = if ($reliability) { [Math]::Round([decimal]$reliability[5], 2) } else { 0 }
                p50_duration_ms = if ($reliability) { [Math]::Round([decimal]$reliability[6], 2) } else { 0 }
                p95_duration_ms = if ($reliability) { [Math]::Round([decimal]$reliability[7], 2) } else { 0 }
                estimated_cost_usd = if ($cost) { [Math]::Round([decimal]$cost[2], 4) } else { 0 }
                cost_per_request_usd = if ($cost) { [Math]::Round([decimal]$cost[3], 6) } else { 0 }
            }
            metadata = @{
                last_updated = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                sync_agent = $XActor
                data_source = "Application Insights: $AppInsightsName"
                lookback_hours = $LookbackHours
            }
        }
        
        $l41Records += $record
    }
    
    Write-Log "✓ Transformed $($l41Records.Count) agent metrics" -Level SUCCESS
    return $l41Records
}

function Send-ToDataModel {
    param([hashtable]$Record)
    
    $recordId = $Record.id
    $url = "$DataModelUrl/model/agent_performance_metrics/$recordId"
    
    if ($DryRun) {
        Write-Log "[DRY-RUN] Would PUT to $url" -Level INFO
        Write-Log "[DRY-RUN] Metrics:" -Level INFO
        Write-Host "  Reliability: $($Record.reliability_score)%" -ForegroundColor Gray
        Write-Host "  Speed Percentile: $($Record.speed_percentile)" -ForegroundColor Gray
        Write-Host "  Cost Efficiency: $($Record.cost_efficiency_percentile)" -ForegroundColor Gray
        Write-Host "  Total Executions: $($Record.total_executions)" -ForegroundColor Gray
        Write-Host "  Safety Incidents: $($Record.safety_incidents)" -ForegroundColor Gray
        return $true
    }
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "X-Actor" = $XActor
        }
        
        $body = $Record | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri $url -Method Put -Body $body -Headers $headers -TimeoutSec 10
        
        Write-Log "✓ Metrics synced: $($Record.agent_name)" -Level SUCCESS
        return $true
        
    } catch {
        Write-Log "✗ Failed to sync $($Record.agent_name): $_" -Level ERROR
        return $false
    }
}

# ───────────────────────────────────────────────────────────────────────────
# Main Execution
# ───────────────────────────────────────────────────────────────────────────

Write-Host "`n" + ("=" * 80)
Write-Host "  EVA METRICS SYNC - Application Insights to L41"
Write-Host ("=" * 80) + "`n"

Write-Log "Configuration:"
Write-Log "  App Insights: $AppInsightsName"
Write-Log "  Resource Group: $ResourceGroup"
Write-Log "  Data Model: $DataModelUrl"
Write-Log "  Actor: $XActor"
Write-Log "  Lookback: $LookbackHours hours"
Write-Log "  Dry Run: $DryRun"
Write-Host ""

try {
    # Step 1: Get App Insights resource ID
    $appInsightsResource = Get-AppInsightsId -Name $AppInsightsName -RG $ResourceGroup
    $appId = $appInsightsResource.appId
    
    # Step 2: Query metrics
    Write-Host ""
    $reliabilityData = Get-AgentReliabilityMetrics -AppId $appId -Hours $LookbackHours
    $safetyData = Get-AgentSafetyIncidents -AppId $appId -Hours $LookbackHours
    $costData = Get-AgentCostMetrics -AppId $appId -Hours $LookbackHours
    
    if ($reliabilityData.Count -eq 0 -and $safetyData.Count -eq 0 -and $costData.Count -eq 0) {
        Write-Log "No agent telemetry found in period. Exiting." -Level WARNING
        exit 0
    }
    
    # Step 3: Transform to L41 schema
    Write-Host ""
    $l41Records = Transform-ToL41Schema `
        -ReliabilityData $reliabilityData `
        -SafetyData $safetyData `
        -CostData $costData
    
    # Step 4: Upload to data model
    Write-Host ""
    Write-Log "Uploading $($l41Records.Count) agent metrics..."
    
    $successCount = 0
    $failedCount = 0
    
    foreach ($record in $l41Records) {
        if (Send-ToDataModel -Record $record) {
            $successCount++
        } else {
            $failedCount++
        }
    }
    
    # Summary
    Write-Host "`n" + ("=" * 80)
    Write-Log "SYNC COMPLETE" -Level SUCCESS
    Write-Log "  Total Agents: $($l41Records.Count)"
    Write-Log "  Success: $successCount"
    Write-Log "  Failed: $failedCount"
    Write-Host ("=" * 80) + "`n"
    
    if ($failedCount -gt 0) { exit 1 }
    
    # Explicit exit for workflow status check
    exit 0
    
} catch {
    Write-Log "✗ Sync failed: $_" -Level ERROR
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
