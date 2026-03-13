#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test POST /model/admin/layers endpoint with Phase A layer schemas (L122-L129)
.DESCRIPTION
    Reads a layer schema from evidence/phase-a/schemas/ and POSTs it to the 
    layer registration endpoint. Tests both locally (if API running on 8000) 
    and against cloud API endpoint.
.PARAMETER LayerPath
    Path to layer schema JSON file (e.g., L122-discovery_contexts.json)
.PARAMETER ApiUrl
    Base URL for API (default: http://localhost:8000)
.PARAMETER AdminToken
    Admin token for authentication (default: dev-admin)
.EXAMPLE
    .\test-layer-registration.ps1 -LayerPath "./evidence/phase-a/schemas/L122-discovery_contexts.json"
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$LayerPath,

    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "http://localhost:8000",

    [Parameter(Mandatory=$false)]
    [string]$AdminToken = "dev-admin"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─────────────────────────────────────────────────────────────────────────────
# Functions
# ─────────────────────────────────────────────────────────────────────────────

function Test-ApiAvailable {
    param([string]$Url)
    try {
        $response = Invoke-WebRequest -Uri "$Url/model/health" -ErrorAction Stop -TimeoutSec 2
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Register-Layer {
    param(
        [string]$LayerJson,
        [string]$ApiUrl,
        [string]$AdminToken
    )

    $url = "$ApiUrl/model/admin/layers"
    $headers = @{
        "Authorization" = "Bearer $AdminToken"
        "Content-Type" = "application/json"
    }

    Write-Host "[INFO] Sending registration request to $url" -ForegroundColor Cyan
    Write-Host "[DEBUG] Payload: $($LayerJson.Length) bytes" -ForegroundColor DarkGray

    try {
        $response = Invoke-WebRequest -Uri $url `
            -Method POST `
            -Headers $headers `
            -Body $LayerJson `
            -TimeoutSec 30 `
            -ErrorAction Stop

        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Body = $response.Content | ConvertFrom-Json
        }
    } catch {
        $errorBody = $_.ErrorDetails.Message
        $statusCode = $_.Exception.Response.StatusCode.Value
        return @{
            Success = $false
            StatusCode = $statusCode
            Error = $_.Exception.Message
            ErrorBody = $errorBody
        }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "═════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "Phase A Layer Registration Test" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Verify layer file exists
if (-not (Test-Path -Path $LayerPath)) {
    Write-Host "[ERROR] Layer file not found: $LayerPath" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Layer file found: $LayerPath" -ForegroundColor Green

# Read layer schema
try {
    $layerContent = Get-Content -Path $LayerPath -Raw -ErrorAction Stop
    $layerJson = $layerContent | ConvertFrom-Json -ErrorAction Stop
    Write-Host "[OK] Layer schema valid JSON: $($layerJson | Select-Object layer_id, layer_name)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to parse layer schema: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Layer Details:" -ForegroundColor Yellow
Write-Host "  - ID: $($layerJson.layer_id)" -ForegroundColor Gray
Write-Host "  - Name: $($layerJson.layer)" -ForegroundColor Gray
Write-Host "  - Domain: $($layerJson.domain_id) ($($layerJson.domain_name))" -ForegroundColor Gray
$isImmutable = if ($null -eq $layerJson.immutable) { $false } else { $layerJson.immutable }
Write-Host "  - Immutable: $isImmutable" -ForegroundColor Gray
Write-Host "  - Schema Fields: $(@($layerJson.schema.PSObject.Properties).Count)" -ForegroundColor Gray
Write-Host ""

# Check API availability
Write-Host "Testing API availability..." -ForegroundColor Yellow
if (Test-ApiAvailable -Url $ApiUrl) {
    Write-Host "[OK] API available at $ApiUrl" -ForegroundColor Green
} else {
    Write-Host "[WARN] API not responding at $ApiUrl" -ForegroundColor Yellow
    Write-Host "[INFO] Will attempt registration anyway..." -ForegroundColor Gray
}

Write-Host ""

# Create registration payload (without "schema" field to avoid shadowing)
# Actually, we include schema directly as it's part of the request model
$registrationPayload = @{
    layer_id = $layerJson.layer_id
    layer_name = $layerJson.layer
    domain_id = $layerJson.domain_id
    domain_name = $layerJson.domain_name
    schema = $layerJson.schema
    relationships = $layerJson.relationships
    description = $layerJson.description
    purpose = $layerJson.purpose
    notes = $layerJson.notes
    immutable = if ($null -eq $layerJson.immutable) { $false } else { $layerJson.immutable }
} | ConvertTo-Json -Depth 10

# Register layer
Write-Host "Registering layer..." -ForegroundColor Yellow
$result = Register-Layer -LayerJson $registrationPayload -ApiUrl $ApiUrl -AdminToken $AdminToken

if ($result.Success) {
    Write-Host "[OK] Registration successful! Status: $($result.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $result.Body | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Gray
    Write-Host ""
    Write-Host "═════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[ERROR] Registration failed! Status: $($result.StatusCode)" -ForegroundColor Red
    Write-Host "[ERROR] $($result.Error)" -ForegroundColor Red
    if ($result.ErrorBody) {
        Write-Host "[ERROR] Details: $($result.ErrorBody)" -ForegroundColor Red
    }
    exit 1
}
