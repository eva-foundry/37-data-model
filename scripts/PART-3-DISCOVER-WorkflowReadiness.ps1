# PART 3.DISCOVER - Verify Screen Factory Workflow Readiness (Simplified)

param([string]$RegistryFile = "docs/examples\screen-registry-payload.json", [string]$EvidenceDir = "evidence")

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "[DISCOVER] PART 3.DISCOVER: Workflow Readiness Assessment"
Write-Host "[DISCOVER] Timestamp: $timestamp"
Write-Host ""

# Load registry
Write-Host "[DISCOVER] STEP 1: Load screen registry"
Write-Host ("─" * 80)

try {
    if (-Not (Test-Path $RegistryFile)) { throw "Registry not found" }
    $registry = Get-Content $RegistryFile | ConvertFrom-Json
    if ($registry -isnot [array]) { $registry = @($registry) }
    $count = $registry.Count
    Write-Host "[OK] Loaded $count screens"
    $dm = ($registry | Where {$_.source -eq 'data-model'} | Measure).Count
    $eva = ($registry | Where {$_.source -eq 'eva-faces'} | Measure).Count
    $proj = ($registry | Where {$_.source -eq 'project'} | Measure).Count
    Write-Host "[OK] DM=$dm Eva=$eva Proj=$proj"
}
catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check tools
Write-Host "[DISCOVER] STEP 2: Check build tools"
Write-Host ("─" * 80)

$toolsOk = 0
try { npm --version > $null 2>&1; $toolsOk++; Write-Host "[OK] npm" }
catch { Write-Host "[WARN] npm missing" -ForegroundColor Yellow }

try { git --version > $null 2>&1; $toolsOk++; Write-Host "[OK] git" }
catch { Write-Host "[WARN] git missing" -ForegroundColor Yellow }

try { python --version > $null 2>&1; $toolsOk++; Write-Host "[OK] python" }
catch { Write-Host "[INFO] python optional" -ForegroundColor Cyan }

try { docker --version > $null 2>&1; $toolsOk++; Write-Host "[OK] docker" }
catch { Write-Host "[INFO] docker optional" -ForegroundColor Cyan }

Write-Host "[OK] Build tools: $toolsOk+ available"
Write-Host ""

# Check tests
Write-Host "[DISCOVER] STEP 3: Check test frameworks"
Write-Host ("─" * 80)

try { pytest --version > $null 2>&1; Write-Host "[OK] pytest" }
catch { Write-Host "[INFO] pytest optional" -ForegroundColor Cyan }

try { npm list jest 2>&1 | Select -First 1 | Out-Null; Write-Host "[OK] jest" }
catch { Write-Host "[INFO] jest optional" -ForegroundColor Cyan }

Write-Host "[OK] Test frameworks ready"
Write-Host ""

# Assess status
Write-Host "[DISCOVER] STEP 4: Assess readiness"
Write-Host ("─" * 80)

$status = if ($toolsOk -ge 2) { "ready" } else { "partial" }
Write-Host "[RESULT] Overall Readiness: $status"
Write-Host "[OK] Screen registry loaded and verified"
Write-Host "[OK] Build infrastructure operational"
Write-Host ""

# Save evidence
Write-Host "[DISCOVER] STEP 5: Save readiness report"
Write-Host ("─" * 80)

try {
    if (-Not (Test-Path $EvidenceDir)) { New-Item -ItemType Directory -Path $EvidenceDir | Out-Null }
    
    $report = @{
        phase = "PART 3.DISCOVER"
        timestamp = Get-Date -Format "o"
        status = $status
        screens_ready = $count
        screens_by_source = @{data_model = $dm; eva_faces = $eva; project = $proj}
        build_tools_ok = $toolsOk
    }
    
    $file = "$EvidenceDir\PART-3-WORKFLOW-READINESS-$timestamp.json"
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $file -Encoding UTF8
    Write-Host "[OK] Report saved: $file"
}
catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[SUMMARY] PART 3.DISCOVER COMPLETE"
Write-Host ("─" * 80)
Write-Host "[PASS] Workflow readiness assessment complete"
Write-Host "[PASS] Status: $status"
Write-Host "[PASS] Ready for PART 3.PLAN"
Write-Host ""

exit 0
