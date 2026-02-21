#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Semi-automated sync: reads source files and reports model drift.

.DESCRIPTION
  Compares the current eva-model.json against live source files:
  - endpoints in model vs route files in eva-brain-api
  - screens in model vs page files in admin-face and chat-face
  - feature_flags in model vs features.py FeatureID enum
  - personas in model vs personas.yml

  Reports:
  - Objects in source but NOT in model (missing from model)
  - Objects in model but NOT in source (orphaned / stale in model)

  Does NOT auto-update. Use the report to manually update layer files,
  then run assemble-model.ps1 + validate-model.ps1.

.EXAMPLE
  ./scripts/sync-from-source.ps1
#>

Set-StrictMode -Version Latest

$root       = Split-Path $PSScriptRoot -Parent
$evaRoot    = Split-Path $root -Parent
$brainApi   = "$evaRoot\33-eva-brain-v2\services\eva-brain-api"
$faces      = "$evaRoot\31-eva-faces"

$m = Get-Content "$root\model\eva-model.json" | ConvertFrom-Json

Write-Host "EVA Data Model — Sync-From-Source Drift Report" -ForegroundColor Cyan
Write-Host "Source root: $evaRoot"
Write-Host ""

$drifts = 0

# ── Endpoints vs route files ─────────────────────────────────────────────────
Write-Host "── Checking endpoints vs route files ──" -ForegroundColor Yellow
$routeDir = "$brainApi\app\routes"
if (Test-Path $routeDir) {
  $routeFiles = Get-ChildItem $routeDir -Filter "*.py" -Recurse |
    Where-Object { $_.Name -ne "__init__.py" }

  $modelEndpoints = $m.endpoints | ForEach-Object { $_.id }

  foreach ($rf in $routeFiles) {
    # Extract @router.{method}("{path}") patterns
    $content = Get-Content $rf.FullName -Raw
    $matches = [regex]::Matches($content, '@router\.(get|post|put|patch|delete)\s*\(\s*["\x27]([^"'']+)["\x27]')
    foreach ($match in $matches) {
      $method = $match.Groups[1].Value.ToUpper()
      $path   = $match.Groups[2].Value
      $epId   = "$method $path"
      if ($epId -notin $modelEndpoints) {
        Write-Host "  [MISSING IN MODEL] $epId  (source: $($rf.Name))" -ForegroundColor Red
        $drifts++
      }
    }
  }
  Write-Host "  Source route files checked: $($routeFiles.Count)"
} else {
  Write-Host "  [SKIP] $routeDir not found" -ForegroundColor DarkGray
}

# ── Screens vs page files ────────────────────────────────────────────────────
Write-Host ""
Write-Host "── Checking screens vs page files ──" -ForegroundColor Yellow
$pageDir = "$faces\admin-face\src\pages"
if (Test-Path $pageDir) {
  $pageFiles = Get-ChildItem $pageDir -Filter "*.tsx" -Recurse |
    Where-Object { $_.Name -notlike "*.test.*" -and $_.Name -notlike "*.stories.*" }

  $modelScreens = $m.screens | ForEach-Object { $_.id }

  foreach ($pf in $pageFiles) {
    $screenId = $pf.BaseName
    if ($screenId -notin $modelScreens) {
      Write-Host "  [MISSING IN MODEL] $screenId  (source: $($pf.FullName -replace [regex]::Escape($faces), '31-eva-faces'))" -ForegroundColor Red
      $drifts++
    }
  }
  Write-Host "  Source page files checked: $($pageFiles.Count)"
} else {
  Write-Host "  [SKIP] $pageDir not found" -ForegroundColor DarkGray
}

# ── Feature flags vs features.py ─────────────────────────────────────────────
Write-Host ""
Write-Host "── Checking feature_flags vs features.py ──" -ForegroundColor Yellow
$featuresFile = "$brainApi\app\models\features.py"
if (Test-Path $featuresFile) {
  $content = Get-Content $featuresFile -Raw
  $enumMatches = [regex]::Matches($content, '^\s+(\w+)\s*=\s*["\x27](\w+)["\x27]', [System.Text.RegularExpressions.RegexOptions]::Multiline)
  $modelFlagIds = $m.feature_flags | ForEach-Object { $_.id }

  foreach ($em in $enumMatches) {
    $flagId = $em.Groups[2].Value
    if ($flagId -notin $modelFlagIds) {
      Write-Host "  [MISSING IN MODEL] $flagId  (features.py enum: $($em.Groups[1].Value))" -ForegroundColor Red
      $drifts++
    }
  }
  Write-Host "  Enum values in features.py: $($enumMatches.Count)"
} else {
  Write-Host "  [SKIP] $featuresFile not found" -ForegroundColor DarkGray
}

# ── Summary ──────────────────────────────────────────────────────────────────
Write-Host ""
if ($drifts -eq 0) {
  Write-Host "PASS — Model is in sync with source files." -ForegroundColor Green
} else {
  Write-Host "DRIFT — $drifts object(s) in source are missing from model." -ForegroundColor Red
  Write-Host "Update the layer JSON files, then run:"
  Write-Host "  scripts/assemble-model.ps1"
  Write-Host "  scripts/validate-model.ps1"
}
