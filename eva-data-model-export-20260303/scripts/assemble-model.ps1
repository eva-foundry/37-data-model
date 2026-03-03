#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Assembles all layer JSON files into a single eva-model.json.

.DESCRIPTION
  Reads all 27 layer JSON files and merges them into model/eva-model.json:
    Application: services, personas, feature_flags, containers, schemas,
                 endpoints, screens, literals, agents, infrastructure, requirements
    Control-plane catalog: planes, connections, environments, cp_skills,
                           cp_agents, runbooks, cp_workflows, cp_policies
    Catalog extensions: mcp_servers, prompts, security_controls
    Frontend object layers (E-01/E-02/E-03): components, hooks, ts_types
    Project plane (E-07/E-08): projects, wbs

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
  # Control-plane catalog (EVA automation operating model)
  planes         = (Get-Content "$modelDir/planes.json"         | ConvertFrom-Json).planes
  connections    = (Get-Content "$modelDir/connections.json"    | ConvertFrom-Json).connections
  environments   = (Get-Content "$modelDir/environments.json"   | ConvertFrom-Json).environments
  cp_skills      = (Get-Content "$modelDir/cp_skills.json"      | ConvertFrom-Json).cp_skills
  cp_agents      = (Get-Content "$modelDir/cp_agents.json"      | ConvertFrom-Json).cp_agents
  runbooks       = (Get-Content "$modelDir/runbooks.json"       | ConvertFrom-Json).runbooks
  cp_workflows   = (Get-Content "$modelDir/cp_workflows.json"   | ConvertFrom-Json).cp_workflows
  cp_policies    = (Get-Content "$modelDir/cp_policies.json"    | ConvertFrom-Json).cp_policies
  # Catalog extensions
  mcp_servers      = (Get-Content "$modelDir/mcp_servers.json"      | ConvertFrom-Json).mcp_servers
  prompts          = (Get-Content "$modelDir/prompts.json"           | ConvertFrom-Json).prompts
  security_controls = (Get-Content "$modelDir/security_controls.json" | ConvertFrom-Json).security_controls
  # Frontend object layers (E-01/E-02/E-03)
  components       = (Get-Content "$modelDir/components.json"        | ConvertFrom-Json).components
  hooks            = (Get-Content "$modelDir/hooks.json"             | ConvertFrom-Json).hooks
  ts_types         = (Get-Content "$modelDir/ts_types.json"          | ConvertFrom-Json).ts_types
  # Project plane (E-07/E-08) -- waterfall WBS + agile scrum + CI/CD linkage
  projects         = (Get-Content "$modelDir/projects.json"          | ConvertFrom-Json).projects
  wbs              = (Get-Content "$modelDir/wbs.json"               | ConvertFrom-Json).wbs
  sprints          = (Get-Content "$modelDir/sprints.json"           | ConvertFrom-Json).sprints
  milestones       = (Get-Content "$modelDir/milestones.json"        | ConvertFrom-Json).milestones
  risks            = (Get-Content "$modelDir/risks.json"             | ConvertFrom-Json).risks
  decisions        = (Get-Content "$modelDir/decisions.json"         | ConvertFrom-Json).decisions
}

# Count populated layers
$layersComplete = ($layers.GetEnumerator() | Where-Object { $_.Value.Count -gt 0 }).Count

$assembled = [ordered]@{
  meta = [ordered]@{
    schema_version  = "1.0.0"
    last_updated    = (Get-Date -Format "yyyy-MM-dd")
    layers_complete = $layersComplete
    total_layers    = 27
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
  # Control-plane catalog
  planes         = $layers.planes
  connections    = $layers.connections
  environments   = $layers.environments
  cp_skills      = $layers.cp_skills
  cp_agents      = $layers.cp_agents
  runbooks       = $layers.runbooks
  cp_workflows   = $layers.cp_workflows
  cp_policies    = $layers.cp_policies
  # Catalog extensions
  mcp_servers       = $layers.mcp_servers
  prompts           = $layers.prompts
  security_controls = $layers.security_controls
  # Frontend object layers (E-01/E-02/E-03)
  components        = $layers.components
  hooks             = $layers.hooks
  ts_types          = $layers.ts_types
  # Project plane (E-07/E-08)
  projects          = $layers.projects
  wbs               = $layers.wbs
}

$outputPath = "$modelDir/eva-model.json"
$assembled | ConvertTo-Json -Depth 20 | Set-Content $outputPath -Encoding UTF8

Write-Host ""
Write-Host "Assembled: $outputPath" -ForegroundColor Green
Write-Host "Layers populated: $layersComplete / 27"
foreach ($layer in $layers.GetEnumerator() | Sort-Object Name) {
  $icon = if ($layer.Value.Count -gt 0) { "[OK]" } else { "[  ]" }
  Write-Host "  $icon $($layer.Name.PadRight(16)) $($layer.Value.Count) items"
}
