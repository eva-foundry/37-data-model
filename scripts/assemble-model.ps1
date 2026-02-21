#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Assembles all layer JSON files into a single eva-model.json.

.DESCRIPTION
  Reads model/services.json, personas.json, feature_flags.json, containers.json,
  schemas.json, endpoints.json, screens.json, literals.json, agents.json,
  infrastructure.json, requirements.json and merges them into model/eva-model.json.

  Run this after editing any layer file.

.EXAMPLE
  ./scripts/assemble-model.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path $PSScriptRoot -Parent
$modelDir = Join-Path $root "model"

Write-Host "EVA Data Model — Assembler" -ForegroundColor Cyan
Write-Host "Root: $root"

# Load each layer
$layers = @{
  services       = (Get-Content "$modelDir/services.json"       | ConvertFrom-Json).services
  personas       = (Get-Content "$modelDir/personas.json"       | ConvertFrom-Json).personas
  feature_flags  = (Get-Content "$modelDir/feature_flags.json"  | ConvertFrom-Json).feature_flags
  containers     = (Get-Content "$modelDir/containers.json"     | ConvertFrom-Json).containers
  schemas        = (Get-Content "$modelDir/schemas.json"        | ConvertFrom-Json).schemas
  endpoints      = (Get-Content "$modelDir/endpoints.json"      | ConvertFrom-Json).endpoints
  screens        = (Get-Content "$modelDir/screens.json"        | ConvertFrom-Json).screens
  literals       = (Get-Content "$modelDir/literals.json"       | ConvertFrom-Json).literals
  agents         = (Get-Content "$modelDir/agents.json"         | ConvertFrom-Json).agents
  infrastructure = (Get-Content "$modelDir/infrastructure.json" | ConvertFrom-Json).infrastructure
  requirements   = (Get-Content "$modelDir/requirements.json"   | ConvertFrom-Json).requirements
}

# Count populated layers
$layersComplete = ($layers.GetEnumerator() | Where-Object { $_.Value.Count -gt 0 }).Count

$assembled = [ordered]@{
  meta = [ordered]@{
    schema_version  = "1.0.0"
    last_updated    = (Get-Date -Format "yyyy-MM-dd")
    layers_complete = $layersComplete
    total_layers    = 11
    generated_by    = "scripts/assemble-model.ps1"
    note            = "DO NOT hand-edit this file. Edit layer files then run assemble-model.ps1."
  }
  services       = $layers.services
  personas       = $layers.personas
  feature_flags  = $layers.feature_flags
  containers     = $layers.containers
  schemas        = $layers.schemas
  endpoints      = $layers.endpoints
  screens        = $layers.screens
  literals       = $layers.literals
  agents         = $layers.agents
  infrastructure = $layers.infrastructure
  requirements   = $layers.requirements
}

$outputPath = "$modelDir/eva-model.json"
$assembled | ConvertTo-Json -Depth 20 | Set-Content $outputPath -Encoding UTF8

Write-Host ""
Write-Host "Assembled: $outputPath" -ForegroundColor Green
Write-Host "Layers populated: $layersComplete / 11"
foreach ($layer in $layers.GetEnumerator() | Sort-Object Name) {
  $icon = if ($layer.Value.Count -gt 0) { "[OK]" } else { "[  ]" }
  Write-Host "  $icon $($layer.Name.PadRight(16)) $($layer.Value.Count) items"
}
