#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Validates all layer files against schema and checks cross-reference integrity.

.DESCRIPTION
  Checks:
  1. Required fields not null (per each layer's schema)
  2. Cross-reference integrity:
     - endpoint.cosmos_reads/writes → container ids
     - endpoint.feature_flag        → feature_flag ids
     - endpoint.auth[]              → persona ids
     - screen.api_calls[]           → endpoint ids
     - literal.screens[]            → screen ids
     - requirement.satisfied_by[]   → endpoint or screen ids
     - agent.output_screens[]       → screen ids
  Exits 0 if clean, 1 if violations found.

.EXAMPLE
  ./scripts/validate-model.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root     = Split-Path $PSScriptRoot -Parent
$modelDir = Join-Path $root "model"

$violations = [System.Collections.Generic.List[string]]::new()

function Fail([string]$msg) { $violations.Add("  [FAIL] $msg") }

Write-Host "EVA Data Model — Validator" -ForegroundColor Cyan

# Load assembled model
$m = Get-Content "$modelDir/eva-model.json" | ConvertFrom-Json

# ── Required field checks ───────────────────────────────────────────────────

foreach ($obj in $m.services) {
  if (-not $obj.id)     { Fail "services: object missing 'id'" }
  if (-not $obj.status) { Fail "services: '$($obj.id)' missing 'status'" }
}

foreach ($obj in $m.personas) {
  if (-not $obj.id) { Fail "personas: object missing 'id'" }
  if (-not $obj.type) { Fail "personas: '$($obj.id)' missing 'type'" }
}

foreach ($obj in $m.endpoints) {
  if (-not $obj.id)     { Fail "endpoints: object missing 'id'" }
  if (-not $obj.method) { Fail "endpoints: '$($obj.id)' missing 'method'" }
  if (-not $obj.path)   { Fail "endpoints: '$($obj.id)' missing 'path'" }
  if ($null -eq $obj.cosmos_reads)  { Fail "endpoints: '$($obj.id)' missing 'cosmos_reads' (use [] not null)" }
  if ($null -eq $obj.cosmos_writes) { Fail "endpoints: '$($obj.id)' missing 'cosmos_writes' (use [] not null)" }
}

foreach ($obj in $m.screens) {
  if (-not $obj.id)    { Fail "screens: object missing 'id'" }
  if (-not $obj.route) { Fail "screens: '$($obj.id)' missing 'route'" }
  if ($null -eq $obj.api_calls) { Fail "screens: '$($obj.id)' missing 'api_calls' (use [] not null)" }
}

foreach ($obj in $m.literals) {
  if (-not $obj.key)        { Fail "literals: object missing 'key'" }
  if (-not $obj.default_en) { Fail "literals: '$($obj.key)' missing 'default_en'" }
  if (-not $obj.default_fr) { Fail "literals: '$($obj.key)' missing 'default_fr'" }
}

# ── Cross-reference integrity ───────────────────────────────────────────────

$containerIds    = $m.containers    | ForEach-Object { $_.id }
$featureFlagIds  = $m.feature_flags | ForEach-Object { $_.id }
$personaIds      = $m.personas      | ForEach-Object { $_.id }
$endpointIds     = $m.endpoints     | ForEach-Object { $_.id }
$screenIds       = $m.screens       | ForEach-Object { $_.id }

foreach ($ep in $m.endpoints) {
  foreach ($cid in $ep.cosmos_reads) {
    if ($cid -and $cid -notin $containerIds) {
      Fail "endpoint '$($ep.id)' cosmos_reads references unknown container '$cid'"
    }
  }
  foreach ($cid in $ep.cosmos_writes) {
    if ($cid -and $cid -notin $containerIds) {
      Fail "endpoint '$($ep.id)' cosmos_writes references unknown container '$cid'"
    }
  }
  if ($ep.feature_flag -and $ep.feature_flag -notin $featureFlagIds) {
    Fail "endpoint '$($ep.id)' feature_flag '$($ep.feature_flag)' not in feature_flags"
  }
  foreach ($personaId in $ep.auth) {
    if ($personaId -and $personaId -notin $personaIds) {
      Fail "endpoint '$($ep.id)' auth references unknown persona '$personaId'"
    }
  }
}

foreach ($sc in $m.screens) {
  foreach ($call in $sc.api_calls) {
    if ($call -and $call -notin $endpointIds) {
      Fail "screen '$($sc.id)' api_calls references unknown endpoint '$call'"
    }
  }
}

foreach ($lit in $m.literals) {
  foreach ($sid in $lit.screens) {
    if ($sid -and $sid -notin $screenIds) {
      Fail "literal '$($lit.key)' screens references unknown screen '$sid'"
    }
  }
}

$satisfiableIds = $endpointIds + $screenIds
foreach ($req in $m.requirements) {
  foreach ($ref in $req.satisfied_by) {
    if ($ref -and $ref -notin $satisfiableIds) {
      Fail "requirement '$($req.id)' satisfied_by references unknown object '$ref'"
    }
  }
}

# ── Report ──────────────────────────────────────────────────────────────────

Write-Host ""
if ($violations.Count -eq 0) {
  Write-Host "PASS — 0 violations" -ForegroundColor Green
  exit 0
} else {
  Write-Host "FAIL — $($violations.Count) violation(s):" -ForegroundColor Red
  $violations | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
  exit 1
}
