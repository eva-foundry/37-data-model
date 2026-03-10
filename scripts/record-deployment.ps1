#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Record deployment event to Layer 36 (deployment_records) in the data model
.DESCRIPTION
    Writes deployment event with before/after state, metrics, and validation results.
    Supports both "start" (status: in_progress) and "complete" (status: success/failed).
.PARAMETER CloudApiUrl
    Base URL of the data model API (default: msub production)
.PARAMETER DeploymentId
    Unique deployment identifier (same for start and complete calls)
.PARAMETER Action
    Action to perform: "start" or "complete"
.PARAMETER Status
    Deployment status (for complete action): "success", "failed", "partial"
.PARAMETER Environment
    Target environment: "dev", "staging", "prod"
.PARAMETER ImageTag
    Docker image tag being deployed
.PARAMETER Revision
    ACA revision name
.PARAMETER BeforeState
    JSON string with pre-deployment state (metrics, uptime, etc.)
.PARAMETER AfterState
    JSON string with post-deployment state
.PARAMETER DurationSeconds
    Total deployment duration in seconds
.PARAMETER ValidationResults
    JSON array of validation check results
.EXAMPLE
    # Start deployment
    ./record-deployment.ps1 -DeploymentId "dep-20260309-1430" -Action "start" -ImageTag "20260309-1430"
    
    # Complete deployment
    ./record-deployment.ps1 -DeploymentId "dep-20260309-1430" -Action "complete" -Status "success" -DurationSeconds 180
#>
param(
    [string]$CloudApiUrl = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",
    [Parameter(Mandatory)]
    [string]$DeploymentId,
    
    [Parameter(Mandatory)]
    [ValidateSet("start", "complete")]
    [string]$Action,
    
    [ValidateSet("in_progress", "success", "failed", "partial")]
    [string]$Status = "in_progress",
    
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "prod",
    
    [string]$ImageTag = "",
    [string]$Revision = "",
    [string]$BeforeState = "{}",
    [string]$AfterState = "{}",
    [int]$DurationSeconds = 0,
    [string]$ValidationResults = "[]"
)

$ErrorActionPreference = "Stop"

# Determine deployment number (sequence)
try {
    Write-Host "📊 Querying existing deployment records..."
    $existing = Invoke-RestMethod -Uri "$CloudApiUrl/model/deployment_records/" -Method GET
    $deploymentNumber = ($existing.Count) + 1
} catch {
    Write-Warning "Could not fetch existing records, defaulting to deployment_number=1"
    $deploymentNumber = 1
}

# Build deployment record
$timestamp = Get-Date -Format "o"
$record = @{
    id = $DeploymentId
    deployment_number = $deploymentNumber
    timestamp = $timestamp
    agent_id = "github-actions"
    environment = $Environment
    deployment_method = "bicep"
    status = $Status
}

if ($Action -eq "start") {
    Write-Host "🚀 Recording deployment START..."
    $record["before_state"] = ConvertFrom-Json $BeforeState
    $record["image_tag"] = $ImageTag
    
} elseif ($Action -eq "complete") {
    Write-Host "✅ Recording deployment COMPLETE..."
    $record["completion_timestamp"] = $timestamp
    $record["duration_seconds"] = $DurationSeconds
    $record["after_state"] = ConvertFrom-Json $AfterState
    $record["validation_results"] = ConvertFrom-Json $ValidationResults
    $record["revision_name"] = $Revision
}

# Write to Layer 36
try {
    $response = Invoke-RestMethod `
        -Uri "$CloudApiUrl/model/deployment_records/" `
        -Method POST `
        -Body ($record | ConvertTo-Json -Depth 10) `
        -ContentType "application/json"
    
    Write-Host "✅ Deployment record written to Layer 36"
    Write-Host "   ID: $DeploymentId"
    Write-Host "   Status: $Status"
    Write-Host "   Deployment #: $deploymentNumber"
    
    return $response
} catch {
    Write-Error "Failed to write deployment record: $_"
    exit 1
}
