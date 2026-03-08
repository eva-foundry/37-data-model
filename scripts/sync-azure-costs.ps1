#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Sync Azure cost data to L49 (resource_costs layer).
    
.DESCRIPTION
    Queries Azure Cost Management API for current month costs and uploads to
    the EVA data model L49 layer for budget tracking and optimization insights.
    
    This script:
    1. Queries Azure Cost Management for month-to-date costs
    2. Aggregates costs by service
    3. Calculates cost trends and forecasts
    4. Identifies optimization opportunities
    5. Uploads to /model/resource_costs/{subscription-id}-{YYYY-MM}
    
.PARAMETER SubscriptionId
    Azure subscription ID to query costs for (default: from env or MarcoSub)
    
.PARAMETER DataModelUrl
    Data model API endpoint (default: msub-eva-data-model)
    
.PARAMETER DryRun
    If set, shows what would be synced without actually uploading
    
.PARAMETER Month
    Month to query in YYYY-MM format (default: current month)
    
.EXAMPLE
    .\sync-azure-costs.ps1
    # Sync current month costs to data model
    
.EXAMPLE
    .\sync-azure-costs.ps1 -DryRun
    # Preview what would be synced without uploading
    
.EXAMPLE
    .\sync-azure-costs.ps1 -Month "2026-02"
    # Sync specific month costs
    
.NOTES
    Author: EVA Foundation (Session 39)
    Date: 2026-03-08
    Requires: Azure CLI authenticated (az login)
    Schedule: Daily at 6 AM ET (recommended)
#>

[CmdletBinding()]
param(
    [string]$SubscriptionId = $env:AZURE_SUBSCRIPTION_ID ?? "c59ee575-eb2a-4b51-a865-4b618f9add0a",
    [string]$DataModelUrl = $env:DATA_MODEL_URL ?? "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",
    [string]$XActor = $env:X_ACTOR ?? "agent:cost-sync",
    [string]$Month,
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

function Get-AzureCostData {
    param([string]$Subscription, [string]$Month)
    
    Write-Log "Querying Azure Cost Management for subscription $Subscription..."
    
    # Determine time period
    if (-not $Month) {
        $Month = Get-Date -Format "yyyy-MM"
    }
    
    $year = $Month.Split("-")[0]
    $monthNum = $Month.Split("-")[1]
    $startDate = "$year-$monthNum-01"
    $endDate = (Get-Date "$year-$monthNum-01").AddMonths(1).AddDays(-1).ToString("yyyy-MM-dd")
    
    Write-Log "  Time period: $startDate to $endDate"
    
    # Query Cost Management API
    $query = @{
        type = "Usage"
        timeframe = "Custom"
        timePeriod = @{
            from = $startDate
            to = $endDate
        }
        dataset = @{
            granularity = "Daily"
            aggregation = @{
                totalCost = @{
                    name = "Cost"
                    function = "Sum"
                }
            }
            grouping = @(
                @{
                    type = "Dimension"
                    name = "ServiceName"
                }
            )
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        # Get access token for REST API
        $token = az account get-access-token --query accessToken -o tsv
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to get access token"
        }
        
        # Format dates for ARM API
        $startDateISO = "$startDate`T00:00:00Z"
        $endDateISO = "$endDate`T23:59:59Z"
        
        # Build Cost Management REST API query
        $costQueryBody = @{
            type = "Usage"
            timeframe = "Custom"
            timePeriod = @{
                from = $startDateISO
                to = $endDateISO
            }
            dataset = @{
                granularity = "Daily"
                aggregation = @{
                    totalCost = @{
                        name = "Cost"
                        function = "Sum"
                    }
                }
                grouping = @(
                    @{
                        type = "Dimension"
                        name = "ServiceName"
                    }
                )
            }
        } | ConvertTo-Json -Depth 10
        
        # Call Cost Management Operations API
        $scope = "/subscriptions/$Subscription"
        $apiVersion = "2021-10-01"
        $url = "https://management.azure.com$scope/providers/Microsoft.CostManagement/query?api-version=$apiVersion"
        
        Write-Log "Querying Cost Management REST API..."
        
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type"  = "application/json"
        }
        
        $response = Invoke-WebRequest -Uri $url `
            -Method POST `
            -Headers $headers `
            -Body $costQueryBody `
            -UseBasicParsing
        
        if ($response.StatusCode -ne 200) {
            throw "Cost Management API returned status: $($response.StatusCode)"
        }
        
        $result = $response.Content | ConvertFrom-Json
        $rowCount = if ($result.properties.rows) { $result.properties.rows.Count } else { 0 }
        
        Write-Log "✓ Retrieved cost data for $rowCount rows" -Level SUCCESS
        return $result.properties.rows
        
    } catch {
        Write-Log "✗ Failed to query Cost Management: $_" -Level ERROR
        throw
    }
}

function Get-BudgetInfo {
    param([string]$Subscription)
    
    Write-Log "Checking budgets via REST API..."
    
    try {
        # Get access token
        $token = az account get-access-token --query accessToken -o tsv
        
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type"  = "application/json"
        }
        
        # Budgets REST API
        $scope = "/subscriptions/$Subscription"
        $apiVersion = "2021-10-01"
        $url = "https://management.azure.com$scope/providers/Microsoft.Consumption/budgets?api-version=$apiVersion"
        
        $response = Invoke-WebRequest -Uri $url `
            -Method GET `
            -Headers $headers `
            -UseBasicParsing
        
        $result = $response.Content | ConvertFrom-Json
        
        if ($result.value -and $result.value.Count -gt 0) {
            $budget = $result.value[0]
            Write-Log "✓ Found budget: $($budget.name)" -Level SUCCESS
            
            return @{
                budget_name = $budget.name
                budget_amount = [decimal]$budget.properties.amount
                currency = $budget.properties.timeGrain
                time_grain = $budget.properties.timeGrain
            }
        } else {
            Write-Log "⚠ No budgets configured for subscription" -Level WARNING
            return @{
                budget_name = "none"
                budget_amount = 0
                currency = "USD"
                time_grain = "Monthly"
            }
        }
        
    } catch {
        Write-Log "⚠ Could not retrieve budget info (non-blocking): $_" -Level WARNING
        return @{
            budget_name = "unknown"
            budget_amount = 0
            currency = "USD"
            time_grain = "Monthly"
        }
    }
}

function Transform-ToL49Schema {
    param(
        [string]$Subscription,
        [string]$Month,
        [array]$CostData,
        [hashtable]$Budget
    )
    
    Write-Log "Transforming to L49 schema format..."
    
    # Group costs by service
    $costByService = @{}
    $totalCost = 0
    
    foreach ($row in $CostData) {
        $cost = [decimal]$row[0]
        $service = $row[2]
        $date = $row[1]
        
        if (-not $costByService.ContainsKey($service)) {
            $costByService[$service] = @{
                service_name = $service
                total_cost = 0
                daily_breakdown = @{}
            }
        }
        
        $costByService[$service].total_cost += $cost
        $costByService[$service].daily_breakdown[$date] = $cost
        $totalCost += $cost
    }
    
    # Convert to array sorted by cost descending
    $costByServiceArray = $costByService.Values | Sort-Object -Property total_cost -Descending
    
    # Simple forecast (based on current trend)
    $daysInMonth = (Get-Date "$Month-01").AddMonths(1).AddDays(-1).Day
    $daysElapsed = (Get-Date).Day
    $forecastedCost = if ($daysElapsed -gt 0) { ($totalCost / $daysElapsed) * $daysInMonth } else { 0 }
    
    # Identify optimization opportunities (services >10% of total)
    $optimizationOpportunities = @()
    foreach ($service in $costByServiceArray) {
        $percentage = ($service.total_cost / $totalCost) * 100
        if ($percentage -gt 10) {
            $optimizationOpportunities += @{
                service = $service.service_name
                current_cost = $service.total_cost
                percentage_of_total = [math]::Round($percentage, 2)
                recommendation = "Review resource sizing and utilization"
                estimated_savings = [math]::Round($service.total_cost * 0.15, 2)  # Assume 15% potential savings
            }
        }
    }
    
    # Build L49 record with proper serialization
    # Convert daily_breakdown hashtable to array of objects for JSON serialization
    $costByServiceFormatted = @()
    foreach ($service in $costByServiceArray) {
        $dailyBreakdownArray = @()
        if ($service.daily_breakdown) {
            foreach ($date in $service.daily_breakdown.Keys | Sort-Object) {
                $dailyBreakdownArray += @{
                    date = $date
                    cost = $service.daily_breakdown[$date]
                }
            }
        }
        
        $costByServiceFormatted += @{
            service_name = $service.service_name
            total_cost = $service.total_cost
            daily_breakdown = $dailyBreakdownArray
        }
    }
    
    $l49Record = @{
        id = "$Subscription-$Month"
        subscription_id = $Subscription
        reporting_period = $Month
        total_cost = [math]::Round($totalCost, 2)
        currency = $Budget.currency
        budget = @{
            budget_name = $Budget.budget_name
            budget_amount = $Budget.budget_amount
            budget_remaining = [math]::Round($Budget.budget_amount - $totalCost, 2)
            budget_utilized_percent = if ($Budget.budget_amount -gt 0) { 
                [math]::Round(($totalCost / $Budget.budget_amount) * 100, 2) 
            } else { 0 }
        }
        cost_by_service = $costByServiceFormatted
        forecasted_cost = @{
            month_end_forecast = [math]::Round($forecastedCost, 2)
            forecast_confidence = "medium"
            days_remaining = $daysInMonth - $daysElapsed
            forecast_method = "linear_trend"
        }
        optimization_opportunities = $optimizationOpportunities
        metadata = @{
            last_synced = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            sync_agent = $XActor
            data_source = "Azure Cost Management API"
        }
    }
    
    Write-Log "✓ Transformed to L49 format ($($costByServiceArray.Count) services, $($optimizationOpportunities.Count) opportunities)" -Level SUCCESS
    return $l49Record
}

function Send-ToDataModel {
    param([hashtable]$Record)
    
    $recordId = $Record.id
    $url = "$DataModelUrl/model/resource_costs/$recordId"
    
    if ($DryRun) {
        Write-Log "[DRY-RUN] Would PUT to $url" -Level INFO
        Write-Log "[DRY-RUN] Payload preview:" -Level INFO
        $Record | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Gray
        return $true
    }
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "X-Actor" = $XActor
        }
        
        $body = $Record | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri $url -Method Put -Body $body -Headers $headers -TimeoutSec 10
        
        Write-Log "✓ Cost data synced: $recordId" -Level SUCCESS
        return $true
        
    } catch {
        Write-Log "✗ Failed to sync: $_" -Level ERROR
        return $false
    }
}

# ───────────────────────────────────────────────────────────────────────────
# Main Execution
# ───────────────────────────────────────────────────────────────────────────

Write-Host "`n" + ("=" * 80)
Write-Host "  EVA COST SYNC - Azure Cost Management to L49"
Write-Host ("=" * 80) + "`n"

Write-Log "Configuration:"
Write-Log "  Subscription: $SubscriptionId"
Write-Log "  Data Model: $DataModelUrl"
Write-Log "  Actor: $XActor"
Write-Log "  Month: $(if ($Month) { $Month } else { 'Current' })"
Write-Log "  Dry Run: $DryRun"
Write-Host ""

try {
    # Step 1: Query cost data
    $costData = Get-AzureCostData -Subscription $SubscriptionId -Month $Month
    
    if ($costData.Count -eq 0) {
        Write-Log "No cost data found for period. Exiting." -Level WARNING
        exit 0
    }
    
    # Step 2: Get budget info
    $budgetInfo = Get-BudgetInfo -Subscription $SubscriptionId
    
    # Step 3: Transform to L49 schema
    $l49Record = Transform-ToL49Schema `
        -Subscription $SubscriptionId `
        -Month $(if ($Month) { $Month } else { Get-Date -Format "yyyy-MM" }) `
        -CostData $costData `
        -Budget $budgetInfo
    
    # Step 4: Upload to data model
    $success = Send-ToDataModel -Record $l49Record
    
    # Summary
    Write-Host "`n" + ("=" * 80)
    if ($success) {
        Write-Log "SYNC COMPLETE" -Level SUCCESS
        Write-Log "  Total Cost: $($l49Record.total_cost) $($l49Record.currency)"
        Write-Log "  Services: $($l49Record.cost_by_service.Count)"
        Write-Log "  Optimization Opportunities: $($l49Record.optimization_opportunities.Count)"
        Write-Log "  Forecast: $($l49Record.forecasted_cost.month_end_forecast) $($l49Record.currency)"
    } else {
        Write-Log "SYNC FAILED" -Level ERROR
        exit 1
    }
    Write-Host ("=" * 80) + "`n"
    
} catch {
    Write-Log "✗ Sync failed: $_" -Level ERROR
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
