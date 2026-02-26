#Requires -Version 5.1
<#
.SYNOPSIS
  Patches all 13 WBS nodes with full PM/Gantt/EVM/Agile fields.
  Run AFTER the WBS schema (id=WBS) has been PUT to /model/schemas/WBS.

.USAGE
  & 'C:\AICOE\eva-foundation\37-data-model\scripts\patch-wbs-pm-fields.ps1'
#>

$base    = "http://localhost:8010/model/wbs"
$headers = @{ "X-Actor" = "agent:copilot" }
$errors  = @()
$updated = @()

function Strip-Audit($obj) {
    $obj | Select-Object * -ExcludeProperty `
        obj_id, layer, modified_by, modified_at, created_by, created_at, row_version, source_file
}

# -----------------------------------------------------------------------
# PM defaults to merge into every WBS node
# (sprint_start/sprint_end are already present; copy to planned/baseline)
# -----------------------------------------------------------------------
function Get-PMDefaults($node) {
    $ps = $node.sprint_start
    $pe = $node.sprint_end

    # risk level: in_progress/active = medium, planned = low, else low
    $risk = switch ($node.status) {
        "in_progress" { "medium" }
        "active"      { "medium" }
        "planned"     { "low"    }
        default       { "low"    }
    }

    # milestone flag: stream and program level = true (they are phase gates)
    $isMilestone = ($node.level -eq "program" -or $node.level -eq "stream")

    # owner: all current nodes under marco
    $owner = "marco.presta"

    # team: derive from stream field
    $team = if ($node.stream) { $node.stream } else { "core" }

    return @{
        planned_start            = $ps
        planned_end              = $pe
        actual_start             = $null
        actual_end               = $null
        baseline_start           = $ps
        baseline_end             = $pe
        milestone                = $isMilestone
        percent_complete         = 0.0
        stories_total            = $null
        stories_done             = 0
        points_total             = $null
        points_done              = 0
        sprints_planned          = $null
        sprints_done             = 0
        sprint_count             = 0
        velocity                 = $null
        cycle_time_days          = $null
        defect_rate              = $null
        budget_at_completion     = $null
        planned_value            = $null
        earned_value             = $null
        actual_cost              = $null
        spi                      = $null
        cpi                      = $null
        estimate_at_completion   = $null
        variance_at_completion   = $null
        risk_level               = $risk
        risk_notes               = $null
        owner                    = $owner
        team                     = $team
    }
}

# -----------------------------------------------------------------------
# Per-node overrides: known sprint counts, points, percent from context
# -----------------------------------------------------------------------
$overrides = @{
    "WBS-000" = @{ percent_complete = 35.0; milestone = $false; team = "program" }
    "WBS-S-delivery"   = @{ team = "delivery";   milestone = $true }
    "WBS-S-infra"      = @{ team = "infra";      milestone = $true }
    "WBS-S-govai"      = @{ team = "govai";      milestone = $true }
    "WBS-S-ux"         = @{ team = "ux";         milestone = $true }
    # Projects
    "WBS-017"  = @{ sprints_planned = 4; percent_complete = 60.0; risk_level = "medium" }
    "WBS-029"  = @{ sprints_planned = 6; percent_complete = 50.0 }
    "WBS-033"  = @{ sprints_planned = 8; percent_complete = 45.0; risk_level = "medium" }
    # Deliverables
    "WBS-031"  = @{ percent_complete = 30.0 }
    "WBS-037"  = @{ percent_complete = 20.0 }
    "WBS-038"  = @{ percent_complete = 10.0 }
    "WBS-039"  = @{ percent_complete = 10.0 }
    "WBS-044"  = @{ percent_complete = 0.0; risk_level = "high"; risk_notes = "ado_epic_id missing -- ADO readback script not yet built in 38-ado-poc" }
}

# -----------------------------------------------------------------------
# FETCH all WBS nodes
# -----------------------------------------------------------------------
Write-Host "[INFO] Fetching all WBS nodes from $base/" -ForegroundColor Cyan
$allNodes = Invoke-RestMethod "$base/" -ErrorAction Stop
Write-Host "[INFO] Got $($allNodes.Count) nodes." -ForegroundColor Cyan

foreach ($node in $allNodes) {
    $id = $node.id
    Write-Host "[INFO] Processing $id (level=$($node.level), status=$($node.status))..." -NoNewline

    $prevRV = $node.row_version

    # Build the defaults
    $pmFields = Get-PMDefaults $node

    # Apply per-node overrides
    if ($overrides.ContainsKey($id)) {
        foreach ($k in $overrides[$id].Keys) {
            $pmFields[$k] = $overrides[$id][$k]
        }
    }

    # Merge PM fields onto the existing node object (as PSObject properties)
    $stripped = Strip-Audit $node
    $body = $stripped | ConvertFrom-Json -ErrorAction SilentlyContinue
    if (-not $body) {
        # ConvertFrom-Json doesn't roundtrip PSCustomObject -- use hashtable merge instead
        $hash = @{}
        $stripped.PSObject.Properties | ForEach-Object { $hash[$_.Name] = $_.Value }
        foreach ($k in $pmFields.Keys) { $hash[$k] = $pmFields[$k] }
        $jsonBody = $hash | ConvertTo-Json -Depth 10
    } else {
        foreach ($k in $pmFields.Keys) {
            $body | Add-Member -NotePropertyName $k -NotePropertyValue $pmFields[$k] -Force
        }
        $jsonBody = $body | ConvertTo-Json -Depth 10
    }

    # Re-strip from the hash to be safe
    $hash = @{}
    $stripped.PSObject.Properties | ForEach-Object { $hash[$_.Name] = $_.Value }
    foreach ($k in $pmFields.Keys) { $hash[$k] = $pmFields[$k] }
    $jsonBody = $hash | ConvertTo-Json -Depth 10

    try {
        $result = Invoke-RestMethod "$base/$id" -Method PUT -ContentType "application/json" -Body $jsonBody -Headers $headers -ErrorAction Stop
        $newRV   = $result.row_version
        if ($newRV -eq ($prevRV + 1)) {
            Write-Host " [PASS] rv $prevRV -> $newRV" -ForegroundColor Green
            $updated += $id
        } else {
            Write-Host " [WARN] rv $prevRV -> $newRV (expected $($prevRV + 1))" -ForegroundColor Yellow
            $updated += $id
        }
    } catch {
        Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
        $errors += "$id : $($_.Exception.Message)"
    }
}

# -----------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[PASS] Updated : $($updated.Count) / $($allNodes.Count) nodes" -ForegroundColor $(if ($updated.Count -eq $allNodes.Count) {"Green"} else {"Yellow"})
if ($errors.Count -gt 0) {
    Write-Host "[FAIL] Errors  : $($errors.Count)" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
} else {
    Write-Host "[INFO] No errors." -ForegroundColor Green
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run next: Invoke-RestMethod http://localhost:8010/model/admin/commit -Method POST -Headers @{Authorization='Bearer dev-admin'} | Select-Object status, violation_count"
