#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Interactive PowerShell query REPL for the EVA Data Model.

.DESCRIPTION
  Loads eva-model.json into $m and drops you into an interactive prompt.
  Type any PowerShell expression — it has access to $m.
  Type 'help' for query examples. Type 'exit' or Ctrl+C to quit.

.EXAMPLE
  ./scripts/query-model.ps1
#>

Set-StrictMode -Version Latest
$root = Split-Path $PSScriptRoot -Parent
$m = Get-Content "$root/model/eva-model.json" | ConvertFrom-Json

$help = @"
  EVA Data Model — Query REPL
  Model loaded into: `$m

  Quick queries:
    `$m.meta                                                   -- model status
    `$m.services | Select-Object id, type, port               -- all services
    `$m.personas | Select-Object id, label, type              -- all personas
    `$m.endpoints | Where-Object { `$_.status -eq 'implemented' } | Select-Object id
    `$m.endpoints | Where-Object { `$_.cosmos_writes -contains 'translations' }
    `$m.screens | Where-Object { `$_.app -eq 'admin-face' } | Select-Object id, status
    `$m.screens | Where-Object { `$_.api_calls -contains 'GET /v1/translations' }
    `$m.literals | Where-Object { `$_.screens -contains 'TranslationsPage' }
    `$m.feature_flags | Where-Object { `$_.personas -contains 'admin' } | Select-Object id

  Impact analysis (use the script instead for full report):
    & `$PSScriptRoot/impact-analysis.ps1 -Field key -Container translations
    & `$PSScriptRoot/impact-analysis.ps1 -Screen TranslationsPage

  Type 'exit' to quit.
"@

Write-Host $help -ForegroundColor Cyan

while ($true) {
  $input = Read-Host "`nmodel>"
  if ($input -eq 'exit' -or $input -eq 'quit') { break }
  if ($input -eq 'help') { Write-Host $help -ForegroundColor Cyan; continue }
  if ([string]::IsNullOrWhiteSpace($input)) { continue }
  try {
    $result = Invoke-Expression $input
    $result | Format-Table -AutoSize
  } catch {
    Write-Host "Error: $_" -ForegroundColor Red
  }
}
