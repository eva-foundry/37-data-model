#!/usr/bin/env pwsh
<#
.SYNOPSIS
  EVA Data Model -- Proactive Readiness Gate Probe

.DESCRIPTION
  Queries the live ACA API and local model to evaluate every known dependency
  gate that could block active sprint work.  Prints a structured PASS/FAIL/WARN
  table.  Exits 0 when all gates pass; exits 1 if any gate FAILS (blockers
  are visible in CI).

  Designed to run at the START of every Copilot session (Step 5 of bootstrap)
  so blockers are surfaced before any work begins.

  Gates evaluated:
    G01  ACA reachable + Cosmos-backed
    G02  validate-model violations = 0
    G03  fp/estimate endpoint exists on ACA (DPDCA sprint deployed)
    G04  Implemented endpoints stamped with transaction_function_type (FP gate)
    G05  Implemented endpoints stamped with story_ids (MTI complexity_coverage gate)
    G06  Containers stamped with data_function_type (FP gate)
    G07  sprints.json seeded (L27 -- velocity calc + 39-ado-dashboard gate)
    G08  milestones / risks / decisions layers seeded (L28-L30)
    G09  veritas MTI score (reads .eva/trust.json if present)
    G10  ACA image includes graph endpoint (GET /model/graph/edge-types)

.PARAMETER Json
  Output machine-readable JSON instead of coloured text.

.PARAMETER WarnOnly
  Exit 0 even if gates fail (useful in read-only sessions).

.PARAMETER Base
  Override the ACA base URL (default: production ACA).

.EXAMPLE
  ./scripts/readiness-probe.ps1
  ./scripts/readiness-probe.ps1 -Json
  ./scripts/readiness-probe.ps1 -WarnOnly
#>

param(
  [switch]$Json,
  [switch]$WarnOnly,
  [string]$Base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'SilentlyContinue'

$gates   = [System.Collections.Generic.List[hashtable]]::new()
$blocked = 0

function Add-Gate {
  param([string]$Id, [string]$Label, [string]$Status, [string]$Detail, [string]$Fix)
  $gate = @{ id=$Id; label=$Label; status=$Status; detail=$Detail; fix=$Fix }
  $gates.Add($gate)
  if ($Status -eq "FAIL") { $script:blocked++ }
}

# ── G01 ACA reachable ─────────────────────────────────────────────────────────
try {
  $h = Invoke-RestMethod "$Base/health" -TimeoutSec 10
  if ($h.store -eq "cosmos") {
    Add-Gate "G01" "ACA reachable + Cosmos-backed" "PASS" "store=cosmos version=$($h.version)" ""
  } else {
    Add-Gate "G01" "ACA reachable + Cosmos-backed" "WARN" "store=$($h.store) -- not cosmos" "Check COSMOS_URL/KEY on ACA container"
  }
} catch {
  Add-Gate "G01" "ACA reachable + Cosmos-backed" "FAIL" "Connection error: $_" "ping ACA; check VPN/firewall; check ACA container status"
}

# ── G02 validate-model violations = 0 ────────────────────────────────────────
try {
  $c = Invoke-RestMethod "$Base/model/admin/commit" -Method POST -Headers @{"Authorization"="Bearer dev-admin"} -TimeoutSec 15
  $v = $c.violation_count
  $exp = $c.exported_total
  if ($v -eq 0) {
    Add-Gate "G02" "validate-model violations=0" "PASS" "violations=0 exported=$exp" ""
  } else {
    Add-Gate "G02" "validate-model violations=0" "FAIL" "violations=$v exported=$exp" "Run POST /model/admin/commit and fix each listed violation"
  }
} catch {
  Add-Gate "G02" "validate-model violations=0" "WARN" "Could not call admin/commit: $_" "Run: Invoke-RestMethod `"$Base/model/admin/commit`" -Method POST -Headers @{Authorization=`"Bearer dev-admin`"}"
}

# ── G03 fp/estimate endpoint on ACA ──────────────────────────────────────────
try {
  $fp = Invoke-RestMethod "$Base/model/fp/estimate" -TimeoutSec 10
  Add-Gate "G03" "fp/estimate accessible on ACA" "PASS" "UFP=$($fp.ufp) method=$($fp.method)" ""
} catch {
  $status = if ($_.Exception.Response.StatusCode -eq 404) { "FAIL" } else { "WARN" }
  Add-Gate "G03" "fp/estimate accessible on ACA" $status "404 Not Found -- ACA image predates DPDCA sprint" "Rebuild + redeploy 37-data-model to ACA with current main branch image"
}

# ── G04 Endpoints stamped (transaction_function_type) ────────────────────────
try {
  $eps   = Invoke-RestMethod "$Base/model/endpoints/" -TimeoutSec 15
  $impl  = @($eps | Where-Object { $_.status -eq "implemented" })
  $tft   = @($impl | Where-Object { [string]($_.PSObject.Properties['transaction_function_type']?.Value) -ne "" })
  $ratio = if ($impl.Count -gt 0) { [math]::Round(($tft.Count / $impl.Count) * 100) } else { 0 }
  if ($tft.Count -eq $impl.Count -and $impl.Count -gt 0) {
    Add-Gate "G04" "Endpoints stamped (transaction_function_type)" "PASS" "$($tft.Count)/$($impl.Count) stamped (100%)" ""
  } elseif ($tft.Count -eq 0) {
    Add-Gate "G04" "Endpoints stamped (transaction_function_type)" "FAIL" "0/$($impl.Count) stamped -- FP calc returns estimates only; complexity_coverage MTI component inactive" "F37-10-001: PUT EI/EO/EQ on each implemented endpoint"
  } else {
    Add-Gate "G04" "Endpoints stamped (transaction_function_type)" "WARN" "$($tft.Count)/$($impl.Count) stamped ($ratio%) -- FP partially calculable" "F37-10-001: stamp remaining $($impl.Count - $tft.Count) endpoints"
  }
} catch {
  Add-Gate "G04" "Endpoints stamped (transaction_function_type)" "WARN" "Could not query endpoints: $_" ""
}

# ── G05 Endpoints have story_ids (4th MTI component gate) ────────────────────
try {
  if (-not $eps) { $eps = Invoke-RestMethod "$Base/model/endpoints/" -TimeoutSec 15 }
  $impl2 = @($eps | Where-Object { $_.status -eq "implemented" })
  $sid   = @($impl2 | Where-Object { @($_.PSObject.Properties['story_ids']?.Value).Count -gt 0 })
  if ($sid.Count -eq $impl2.Count -and $impl2.Count -gt 0) {
    Add-Gate "G05" "Endpoints have story_ids (MTI 4th component)" "PASS" "$($sid.Count)/$($impl2.Count) have story_ids" ""
  } elseif ($sid.Count -eq 0) {
    Add-Gate "G05" "Endpoints have story_ids (MTI 4th component)" "FAIL" "0/$($impl2.Count) have story_ids -- complexity_coverage=0; veritas uses 3-component formula" "F37-10-001: stamp story_ids alongside transaction_function_type"
  } else {
    Add-Gate "G05" "Endpoints have story_ids (MTI 4th component)" "WARN" "$($sid.Count)/$($impl2.Count) have story_ids" "F37-10-001: stamp remaining endpoints"
  }
} catch {
  Add-Gate "G05" "Endpoints have story_ids (MTI 4th component)" "WARN" "Could not evaluate: $_" ""
}

# ── G06 Containers stamped (data_function_type) ───────────────────────────────
try {
  $ctrs = Invoke-RestMethod "$Base/model/containers/" -TimeoutSec 10
  $dft  = @($ctrs | Where-Object { [string]($_.PSObject.Properties['data_function_type']?.Value) -ne "" })
  if ($dft.Count -eq $ctrs.Count -and $ctrs.Count -gt 0) {
    Add-Gate "G06" "Containers stamped (data_function_type)" "PASS" "$($dft.Count)/$($ctrs.Count) stamped" ""
  } elseif ($dft.Count -eq 0) {
    Add-Gate "G06" "Containers stamped (data_function_type)" "FAIL" "0/$($ctrs.Count) stamped -- no ILF/EIF data in FP estimate" "F37-10-002: PUT ILF or EIF on each container"
  } else {
    Add-Gate "G06" "Containers stamped (data_function_type)" "WARN" "$($dft.Count)/$($ctrs.Count) stamped" "F37-10-002: stamp remaining containers"
  }
} catch {
  Add-Gate "G06" "Containers stamped (data_function_type)" "WARN" "Could not query containers: $_" ""
}

# ── G07 Sprints seeded (L27) ──────────────────────────────────────────────────
try {
  $sprints = Invoke-RestMethod "$Base/model/sprints/" -TimeoutSec 10
  $sc = @($sprints).Count
  if ($sc -ge 8) {
    Add-Gate "G07" "L27 sprints seeded (>=8 records)" "PASS" "$sc sprint records -- velocity calc enabled" ""
  } elseif ($sc -gt 0) {
    Add-Gate "G07" "L27 sprints seeded (>=8 records)" "WARN" "$sc records -- Sprint-Backlog + Sprint 1-7 expected" "F37-10-003: seed remaining sprints in model/sprints.json"
  } else {
    Add-Gate "G07" "L27 sprints seeded (>=8 records)" "FAIL" "0 records -- 39-ado-dashboard velocity calc blocked; F31-DM-PMLIVE1 blocked" "F37-10-003: seed model/sprints.json"
  }
} catch {
  Add-Gate "G07" "L27 sprints seeded (>=8 records)" "FAIL" "Layer not found or not on ACA -- DPDCA sprint not deployed" "Redeploy ACA with current main branch (includes L27-L30)"
}

# ── G08 L28-L30 layers exist ──────────────────────────────────────────────────
$l28ok = $true; $l29ok = $true; $l30ok = $true
try { Invoke-RestMethod "$Base/model/milestones/" -TimeoutSec 8 | Out-Null } catch { $l28ok = $false }
try { Invoke-RestMethod "$Base/model/risks/" -TimeoutSec 8 | Out-Null } catch { $l29ok = $false }
try { Invoke-RestMethod "$Base/model/decisions/" -TimeoutSec 8 | Out-Null } catch { $l30ok = $false }
$missing = @(if (-not $l28ok){"milestones(L28)"}; if (-not $l29ok){"risks(L29)"}; if (-not $l30ok){"decisions(L30)"})
if ($missing.Count -eq 0) {
  Add-Gate "G08" "L28-L30 layers reachable (milestones/risks/decisions)" "PASS" "All three DPDCA layers reachable" ""
} else {
  Add-Gate "G08" "L28-L30 layers reachable (milestones/risks/decisions)" "FAIL" "Not reachable: $($missing -join ', ') -- ACA image predates DPDCA sprint" "Redeploy 37-data-model ACA with current main branch"
}

# ── G09 Veritas MTI (local .eva/trust.json) ───────────────────────────────────
$trustPath = Join-Path (Split-Path $PSScriptRoot -Parent) ".eva\trust.json"
if (Test-Path $trustPath) {
  try {
    $t = Get-Content $trustPath -Raw | ConvertFrom-Json
    $score = $t.score
    $formula = if ($null -ne $t.PSObject.Properties['components'] -and
                   $null -ne $t.components.PSObject.Properties['formula']) {
                 $t.components.formula } else { 'n/a' }
    if ($score -ge 95) {
      Add-Gate "G09" "Veritas MTI >= 95" "PASS" "MTI=$score formula=$formula delta=$($t.sparkline_delta)" ""
    } elseif ($score -ge 70) {
      Add-Gate "G09" "Veritas MTI >= 95" "WARN" "MTI=$score (below 95 target) formula=$formula" "Run: eva audit --repo C:\eva-foundry\eva-foundation\37-data-model"
    } else {
      Add-Gate "G09" "Veritas MTI >= 95" "FAIL" "MTI=$score -- below passing threshold of 70" "Run: eva audit --repo C:\eva-foundry\eva-foundation\37-data-model"
    }
  } catch {
    Add-Gate "G09" "Veritas MTI >= 95" "WARN" "trust.json unreadable: $_" ""
  }
} else {
  Add-Gate "G09" "Veritas MTI (local cache)" "WARN" "No .eva/trust.json -- run eva audit to populate" "Run: eva audit --repo C:\eva-foundry\eva-foundation\37-data-model"
}

# ── G10 ACA image has graph endpoint ──────────────────────────────────────────
try {
  $et = Invoke-RestMethod "$Base/model/graph/edge-types" -TimeoutSec 10
  $etc = @($et).Count
  Add-Gate "G10" "Graph endpoint accessible (ACA image)" "PASS" "$etc edge types registered" ""
} catch {
  Add-Gate "G10" "Graph endpoint accessible (ACA image)" "FAIL" "GET /model/graph/edge-types -- $($_.Exception.Response.StatusCode) -- ACA image may be stale" "Redeploy 37-data-model ACA with current main branch"
}

# ── Output ────────────────────────────────────────────────────────────────────

if ($Json) {
  $result = @{
    generated_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    base_url     = $Base
    blocked      = $blocked
    gates        = $gates
  }
  $result | ConvertTo-Json -Depth 5
} else {
  $colMap = @{ PASS="Green"; WARN="Yellow"; FAIL="Red" }
  Write-Host ""
  Write-Host "=== EVA Data Model -- Readiness Probe $(Get-Date -Format 'yyyy-MM-dd HH:mm') ===" -ForegroundColor Cyan
  Write-Host ""
  $fmt = "{0,-4}  {1,-50}  {2,-4}  {3}"
  Write-Host ($fmt -f "ID", "Gate", "Status", "Detail") -ForegroundColor White
  Write-Host ("-" * 100)
  foreach ($g in $gates) {
    $color = $colMap[$g.status]
    Write-Host ($fmt -f $g.id, $g.label, $g.status, $g.detail) -ForegroundColor $color
    if ($g.fix -and $g.status -ne "PASS") {
      Write-Host ("      FIX: " + $g.fix) -ForegroundColor DarkGray
    }
  }
  Write-Host ""
  if ($blocked -eq 0) {
    Write-Host "[PASS] All gates pass -- no blockers detected." -ForegroundColor Green
  } else {
    Write-Host "[FAIL] $blocked gate(s) failing. Resolve FIX items above before starting sprint work." -ForegroundColor Red
  }
  Write-Host ""
}

if (-not $WarnOnly -and $blocked -gt 0) { exit 1 }
exit 0
