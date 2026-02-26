#!/usr/bin/env pwsh
<#
.SYNOPSIS
  DM-CAT migration: add precedence fields to existing model JSON files.

.DESCRIPTION
  Adds new optional fields (boot_order, deploy_order, rank, supersedes, priority,
  auth_mode, provision_order, depends_on) to all existing objects in the relevant
  layer JSON files. Objects that already have the field are left unchanged.

  Safe to re-run — idempotent.

.EXAMPLE
  ./scripts/add-precedence-fields.ps1
#>

Set-StrictMode -Version Latest
$root = Split-Path $PSScriptRoot -Parent
$model = "$root/model"

function Add-Field {
  param($obj, [string]$field, $default)
  if (-not (Get-Member -InputObject $obj -Name $field)) {
    $obj | Add-Member -MemberType NoteProperty -Name $field -Value $default
  }
}

$changed = 0

# ── services: boot_order + deploy_order ───────────────────────────────────────
$svcFile = "$model/services.json"
$svc = Get-Content $svcFile | ConvertFrom-Json
foreach ($s in $svc.services) {
  Add-Field $s "boot_order"   99
  Add-Field $s "deploy_order" 99
}
$svc | ConvertTo-Json -Depth 10 | Set-Content $svcFile
Write-Host "  services.json        — boot_order, deploy_order" -ForegroundColor Green
$changed++

# ── personas: rank + supersedes ───────────────────────────────────────────────
$pFile = "$model/personas.json"
$p = Get-Content $pFile | ConvertFrom-Json
foreach ($item in $p.personas) {
  Add-Field $item "rank"       99
  Add-Field $item "supersedes" @()
}
$p | ConvertTo-Json -Depth 10 | Set-Content $pFile
Write-Host "  personas.json        — rank, supersedes" -ForegroundColor Green
$changed++

# ── feature_flags: priority ───────────────────────────────────────────────────
$ffFile = "$model/feature_flags.json"
$ff = Get-Content $ffFile | ConvertFrom-Json
foreach ($item in $ff.feature_flags) {
  Add-Field $item "priority" 50
}
$ff | ConvertTo-Json -Depth 10 | Set-Content $ffFile
Write-Host "  feature_flags.json   — priority" -ForegroundColor Green
$changed++

# ── endpoints: auth_mode ─────────────────────────────────────────────────────
$epFile = "$model/endpoints.json"
$ep = Get-Content $epFile | ConvertFrom-Json
foreach ($item in $ep.endpoints) {
  Add-Field $item "auth_mode" "any"
}
$ep | ConvertTo-Json -Depth 10 | Set-Content $epFile
Write-Host "  endpoints.json       — auth_mode" -ForegroundColor Green
$changed++

# ── infrastructure: provision_order + iac_type ────────────────────────────────
$infraFile = "$model/infrastructure.json"
$infra = Get-Content $infraFile | ConvertFrom-Json
foreach ($item in $infra.infrastructure) {
  Add-Field $item "provision_order" 99
  # iac_type is optional — skip default to avoid noise; can be set per-object
}
$infra | ConvertTo-Json -Depth 10 | Set-Content $infraFile
Write-Host "  infrastructure.json  — provision_order" -ForegroundColor Green
$changed++

# ── requirements: depends_on ─────────────────────────────────────────────────
$reqFile = "$model/requirements.json"
$req = Get-Content $reqFile | ConvertFrom-Json
foreach ($item in $req.requirements) {
  Add-Field $item "depends_on" @()
}
$req | ConvertTo-Json -Depth 10 | Set-Content $reqFile
Write-Host "  requirements.json    — depends_on" -ForegroundColor Green
$changed++

Write-Host ""
Write-Host "Migration complete. $changed files updated." -ForegroundColor Cyan
Write-Host "Next: run assemble-model.ps1 then validate-model.ps1" -ForegroundColor Cyan
