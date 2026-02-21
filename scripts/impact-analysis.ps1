#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Given a field name, endpoint, screen, or container — reports everything that changes.

.DESCRIPTION
  This is the "what breaks if I rename X?" tool.
  Traverses the full dependency graph in eva-model.json.

.PARAMETER Field
  A field name in a Cosmos container (e.g. 'key', 'locale').

.PARAMETER Container
  Container id to scope field lookup (optional — if field exists in multiple containers).

.PARAMETER Endpoint
  An endpoint id (e.g. 'GET /v1/translations').

.PARAMETER Screen
  A screen id (e.g. 'TranslationsPage').

.EXAMPLE
  # What breaks if 'key' is renamed in the translations container?
  ./scripts/impact-analysis.ps1 -Field key -Container translations

  # What depends on GET /v1/translations?
  ./scripts/impact-analysis.ps1 -Endpoint "GET /v1/translations"

  # What endpoints and literals does TranslationsPage use?
  ./scripts/impact-analysis.ps1 -Screen TranslationsPage
#>

param(
  [string]$Field,
  [string]$Container,
  [string]$Endpoint,
  [string]$Screen
)

Set-StrictMode -Version Latest
$root = Split-Path $PSScriptRoot -Parent
$m = Get-Content "$root/model/eva-model.json" | ConvertFrom-Json

Write-Host "EVA Data Model — Impact Analyzer" -ForegroundColor Cyan
Write-Host ""

if ($Field) {
  $scope = if ($Container) { $Container } else { "*" }
  Write-Host "FIELD '$Field' in container '$scope'" -ForegroundColor Yellow

  # Containers that have this field
  $affectedContainers = $m.containers | Where-Object {
    $c = $_
    ($Container -eq "" -or $c.id -eq $Container) -and
    ($c.fields | Where-Object { $_.name -eq $Field })
  }
  Write-Host "  Containers: $($affectedContainers.id -join ', ')"

  # Endpoints that read/write those containers
  $cids = $affectedContainers | ForEach-Object { $_.id }
  $affectedEndpoints = $m.endpoints | Where-Object {
    ($_.cosmos_reads | Where-Object { $_ -in $cids }) -or
    ($_.cosmos_writes | Where-Object { $_ -in $cids })
  }
  Write-Host "  Endpoints ($($affectedEndpoints.Count)): $($affectedEndpoints.id -join ', ')"

  # Schemas for those endpoints
  $affectedSchemas = $affectedEndpoints | ForEach-Object { $_.response_schema, $_.request_schema } |
    Where-Object { $_ } | Select-Object -Unique
  Write-Host "  Schemas: $($affectedSchemas -join ', ')"

  # Screens that call those endpoints
  $epIds = $affectedEndpoints | ForEach-Object { $_.id }
  $affectedScreens = $m.screens | Where-Object {
    $sc = $_
    $sc.api_calls | Where-Object { $_ -in $epIds }
  }
  Write-Host "  Screens ($($affectedScreens.Count)): $($affectedScreens.id -join ', ')"

  # Literals used by those screens
  $scIds = $affectedScreens | ForEach-Object { $_.id }
  $affectedLiterals = $m.literals | Where-Object {
    $lit = $_
    $lit.screens | Where-Object { $_ -in $scIds }
  }
  Write-Host "  Literals ($($affectedLiterals.Count)): $($affectedLiterals.key -join ', ')"
}

if ($Endpoint) {
  Write-Host "ENDPOINT '$Endpoint'" -ForegroundColor Yellow
  $ep = $m.endpoints | Where-Object { $_.id -eq $Endpoint }
  if (-not $ep) { Write-Host "  Not found in model." -ForegroundColor Red; exit 1 }

  Write-Host "  Containers read:  $($ep.cosmos_reads -join ', ')"
  Write-Host "  Containers write: $($ep.cosmos_writes -join ', ')"
  Write-Host "  Feature flag: $($ep.feature_flag)"
  Write-Host "  Auth: $($ep.auth -join ', ')"

  $affectedScreens = $m.screens | Where-Object { $_.api_calls -contains $Endpoint }
  Write-Host "  Screens that call this ($($affectedScreens.Count)): $($affectedScreens.id -join ', ')"

  $affectedReqs = $m.requirements | Where-Object { $_.satisfied_by -contains $Endpoint }
  Write-Host "  Requirements satisfied ($($affectedReqs.Count)): $($affectedReqs.id -join ', ')"
}

if ($Screen) {
  Write-Host "SCREEN '$Screen'" -ForegroundColor Yellow
  $sc = $m.screens | Where-Object { $_.id -eq $Screen }
  if (-not $sc) { Write-Host "  Not found in model." -ForegroundColor Red; exit 1 }

  Write-Host "  Route:  $($sc.route)"
  Write-Host "  Status: $($sc.status)"
  Write-Host "  API calls: $($sc.api_calls -join ', ')"

  $usedLiterals = $m.literals | Where-Object { $_.screens -contains $Screen }
  Write-Host "  Literals ($($usedLiterals.Count)): $($usedLiterals.key -join ', ')"

  # Which containers does this screen ultimately touch?
  $eps = $m.endpoints | Where-Object { $_.id -in $sc.api_calls }
  $containers = ($eps | ForEach-Object { $_.cosmos_reads + $_.cosmos_writes }) | Select-Object -Unique
  Write-Host "  Cosmos containers: $($containers -join ', ')"
}
