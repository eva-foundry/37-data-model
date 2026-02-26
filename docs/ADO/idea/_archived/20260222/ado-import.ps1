# ado-import.ps1 — EVA Data Model Maintenance & Extension Tooling epic
# Imports the Maintenance & Extension epic (Sprint-8 / Sprint-9) into ADO.
# The original 37-data-model build epic (id=30) must already exist in ADO.
#
# Usage:
#   $env:ADO_PAT = "<pat>"
#   .\docs\ADO\idea\ado-import.ps1
#   .\docs\ADO\idea\ado-import.ps1 -DryRun    # preview without creating anything
param([switch]$DryRun)
$sharedScript = "C:\AICOE\eva-foundation\38-ado-poc\scripts\ado-import-project.ps1"
if (-not (Test-Path $sharedScript)) { throw "Shared import script not found: $sharedScript" }
& $sharedScript -ArtifactsFile (Join-Path $PSScriptRoot "ado-artifacts.json") -DryRun:$DryRun
