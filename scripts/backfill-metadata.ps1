<#
.SYNOPSIS
    One-shot backfill of missing audit & source_file metadata on all 27 layers.

.DESCRIPTION
    Calls POST /model/admin/backfill  → stamps created_at/by, modified_at/by,
                                        row_version, is_active on every legacy object
                                        and derives source_file where possible.
    Then calls POST /model/admin/export → writes updated store back to model/*.json
    Then runs assemble-model.ps1       → rebuilds eva-model.json

.PARAMETER Port
    Port where the data-model API is running.  Default: 8010

.PARAMETER Token
    Admin token.  Default: dev-admin

.EXAMPLE
    .\scripts\backfill-metadata.ps1

.EXAMPLE
    .\scripts\backfill-metadata.ps1 -Port 8011 -Token my-secret
#>

param(
    [int]    $Port  = 8010,
    [string] $Token = "dev-admin"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$BaseUrl = "http://localhost:$Port"
$Headers = @{ "X-Admin-Token" = $Token; "Content-Type" = "application/json" }

function Invoke-Model {
    param([string]$Method, [string]$Path, [string]$Label)
    Write-Host "`n[$Label] $Method $BaseUrl$Path ..." -ForegroundColor Cyan
    try {
        $resp = Invoke-RestMethod -Method $Method -Uri "$BaseUrl$Path" -Headers $Headers
        return $resp
    } catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
        throw
    }
}

# ── STEP 1: backfill ──────────────────────────────────────────────────────────
$bf = Invoke-Model POST "/model/admin/backfill" "BACKFILL"

$bf.touched.PSObject.Properties | ForEach-Object {
    $layer  = $_.Name
    $count  = $_.Value
    $missed = $bf.skipped.$layer
    if ($count -gt 0) {
        Write-Host ("  [PATCHED] {0,-24} touched={1,4}  already_ok={2,4}" -f $layer, $count, $missed) -ForegroundColor Green
    } else {
        Write-Host ("  [ok]      {0,-24} all {1} objects already complete" -f $layer, $missed) -ForegroundColor DarkGray
    }
}
Write-Host
Write-Host "  Total touched : $($bf.total_touched)" -ForegroundColor Yellow
Write-Host "  Total skipped : $($bf.total_skipped)"
if ($bf.errors.Count -gt 0) {
    Write-Host "  ERRORS:" -ForegroundColor Red
    $bf.errors | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
}

# ── STEP 2: export ────────────────────────────────────────────────────────────
$ex = Invoke-Model POST "/model/admin/export" "EXPORT"
Write-Host "  Exported $($ex.total) objects across $($ex.exported.PSObject.Properties.Count) layers" -ForegroundColor Green
if ($ex.errors.Count -gt 0) {
    Write-Host "  EXPORT ERRORS:" -ForegroundColor Red
    $ex.errors | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
}

# ── STEP 3: assemble ──────────────────────────────────────────────────────────
Write-Host "`n[ASSEMBLE] Rebuilding eva-model.json ..." -ForegroundColor Cyan
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$scriptRoot\assemble-model.ps1"

Write-Host "`n[DONE] Backfill + export + assemble complete." -ForegroundColor Green
Write-Host "       Commit updated model/*.json to preserve the new audit trail."
