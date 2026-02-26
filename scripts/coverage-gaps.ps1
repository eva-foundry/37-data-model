#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Reports semantic coverage gaps in the EVA data model.

.DESCRIPTION
  Loads model/eva-model.json and identifies objects that pass schema validation
  (non-null arrays, required fields present) but are semantically empty or
  incomplete — stub screens, hooks/components with no linkage, endpoints
  missing implementation metadata, etc.

  This is a non-blocking audit tool (always exits 0). It is intended to be
  run by a developer as part of sprint planning and by CI as a coverage report.

  Checks performed:
    screens    - implemented screens with empty api_calls, components, or hooks
    endpoints  - implemented endpoints missing 'implemented_in'
    endpoints  - stub/planned endpoints (inventory only)
    hooks      - implemented hooks with empty calls_endpoints or used_by_screens
    components - implemented components with empty used_by_screens
    feature_flags - stub or planned flags (inventory)

.PARAMETER Json
  Output machine-readable JSON instead of coloured text.

.PARAMETER Layer
  Filter to a single layer (screens|endpoints|hooks|components|feature_flags).
  Default: all layers.

.EXAMPLE
  ./scripts/coverage-gaps.ps1
  ./scripts/coverage-gaps.ps1 -Layer screens
  ./scripts/coverage-gaps.ps1 -Json | ConvertFrom-Json | Select -Expand gaps
#>

param(
  [switch]$Json,
  [ValidateSet("screens","endpoints","hooks","components","feature_flags","")]
  [string]$Layer = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root     = Split-Path $PSScriptRoot -Parent
$modelDir = Join-Path $root "model"
$modelFile = Join-Path $modelDir "eva-model.json"

if (-not (Test-Path $modelFile)) {
  Write-Error "Model file not found: $modelFile  (run: scripts/assemble-model.ps1)"
  exit 1
}

$m = Get-Content $modelFile -Raw | ConvertFrom-Json

function CountArr([psobject]$obj, [string]$field) {
  $p = $obj.PSObject.Properties[$field]
  if ($null -eq $p -or $null -eq $p.Value) { return 0 }
  return @($p.Value).Count
}

function GetStr([psobject]$obj, [string]$field) {
  $p = $obj.PSObject.Properties[$field]
  if ($null -eq $p -or $null -eq $p.Value) { return "" }
  return [string]$p.Value
}

# ── Collect gaps ─────────────────────────────────────────────────────────────

$gaps = [System.Collections.Generic.List[hashtable]]::new()

function Gap([string]$layer, [string]$id, [string]$field, [string]$detail) {
  $gaps.Add(@{ layer = $layer; id = $id; field = $field; detail = $detail })
}

# ── screens ──────────────────────────────────────────────────────────────────
if ($Layer -eq "" -or $Layer -eq "screens") {
  foreach ($sc in $m.screens) {
    $status = GetStr $sc "status"
    if ($status -ne "implemented") { continue }

    $apiCalls  = CountArr $sc "api_calls"
    $comps     = CountArr $sc "components"
    $hooks     = CountArr $sc "hooks"

    if ($apiCalls -eq 0) {
      Gap "screens" $sc.id "api_calls" "implemented screen has no api_calls — add endpoint wiring"
    }
    if ($comps -eq 0) {
      Gap "screens" $sc.id "components" "implemented screen lists no components"
    }
    if ($hooks -eq 0) {
      Gap "screens" $sc.id "hooks" "implemented screen lists no hooks (may be intentional if self-contained)"
    }
  }
}

# ── endpoints ────────────────────────────────────────────────────────────────
if ($Layer -eq "" -or $Layer -eq "endpoints") {
  foreach ($ep in $m.endpoints) {
    $status = GetStr $ep "status"

    if ($status -eq "implemented") {
      $implIn = GetStr $ep "implemented_in"
      if ($implIn -eq "") {
        Gap "endpoints" $ep.id "implemented_in" "status=implemented but 'implemented_in' (route file path) is missing"
      }
    }

    if ($status -in @("stub","planned","coded")) {
      # Informational — list stubs so sprint planning can prioritise
      Gap "endpoints" $ep.id "status" "not-yet-implemented: status=$status"
    }
  }
}

# ── hooks ─────────────────────────────────────────────────────────────────────
if ($Layer -eq "" -or $Layer -eq "hooks") {
  foreach ($hk in $m.hooks) {
    $status = GetStr $hk "status"
    if ($status -ne "implemented") { continue }

    $callsEp     = CountArr $hk "calls_endpoints"
    $usedByScr   = CountArr $hk "used_by_screens"

    if ($callsEp -eq 0) {
      Gap "hooks" $hk.id "calls_endpoints" "implemented hook has no calls_endpoints — add endpoint wiring"
    }
    if ($usedByScr -eq 0) {
      Gap "hooks" $hk.id "used_by_screens" "implemented hook is not referenced by any screen"
    }
  }
}

# ── components ────────────────────────────────────────────────────────────────
if ($Layer -eq "" -or $Layer -eq "components") {
  foreach ($cmp in $m.components) {
    $status = GetStr $cmp "status"
    if ($status -ne "implemented") { continue }

    $usedByScr = CountArr $cmp "used_by_screens"
    if ($usedByScr -eq 0) {
      Gap "components" $cmp.id "used_by_screens" "implemented component is not referenced by any screen"
    }
  }
}

# ── feature_flags ─────────────────────────────────────────────────────────────
if ($Layer -eq "" -or $Layer -eq "feature_flags") {
  foreach ($ff in $m.feature_flags) {
    $status = GetStr $ff "status"
    if ($status -in @("stub","planned")) {
      Gap "feature_flags" $ff.id "status" "flag not yet wired: status=$status"
    }
  }
}

# ── Output ───────────────────────────────────────────────────────────────────

if ($Json) {
  $summary = [ordered]@{
    generated_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    model_file   = $modelFile
    total_gaps   = $gaps.Count
    layers       = @{}
    gaps         = @($gaps)
  }
  foreach ($g in $gaps) {
    $l = $g.layer
    if (-not $summary.layers.ContainsKey($l)) { $summary.layers[$l] = 0 }
    $summary.layers[$l]++
  }
  $summary | ConvertTo-Json -Depth 5
  exit 0
}

# ── Coloured text output ──────────────────────────────────────────────────────

Write-Host ""
Write-Host "EVA Data Model — Coverage Gaps" -ForegroundColor Cyan
Write-Host "  model: $modelFile" -ForegroundColor DarkGray
Write-Host ""

if ($gaps.Count -eq 0) {
  Write-Host "  No coverage gaps found." -ForegroundColor Green
  Write-Host ""
  exit 0
}

$byLayer = $gaps | Group-Object { $_.layer }

foreach ($grp in ($byLayer | Sort-Object Name)) {
  $layerName  = $grp.Name
  $layerCount = $grp.Count
  Write-Host "  [$layerName]  $layerCount gap(s)" -ForegroundColor Yellow

  # Sub-group by field
  $byField = $grp.Group | Group-Object { $_.field }
  foreach ($fg in ($byField | Sort-Object Name)) {
    Write-Host "    .$($fg.Name)  ($($fg.Count))" -ForegroundColor DarkYellow
    foreach ($g in ($fg.Group | Sort-Object { $_.id })) {
      Write-Host "      $($g.id)" -ForegroundColor White
      Write-Host "        $($g.detail)" -ForegroundColor DarkGray
    }
  }
  Write-Host ""
}

# Summary bar
$layerSummary = ($byLayer | Sort-Object Name | ForEach-Object {
  "$($_.Name)=$($_.Count)"
}) -join "  "

Write-Host "  TOTAL: $($gaps.Count) gap(s)   [$layerSummary]" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Tip: pipe with -Json for machine-readable output." -ForegroundColor DarkGray
Write-Host "  Tip: use -Layer <name> to filter to one layer." -ForegroundColor DarkGray
Write-Host ""

# Always exit 0 — gaps are informational, not violations
exit 0
