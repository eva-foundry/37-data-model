# ============================================================================
# Add Sprint to Data Model
# ============================================================================
# This script takes a sprint manifest JSON and POSTs it to the data model
# sprints layer. This enables sprint-agent.py to pull manifests directly
# from the data model instead of parsing GitHub issue comments.
#
# Benefits over GitHub Issue manifest embedding:
# 1. Single source of truth (data model, not scattered across issues)
# 2. Queryable via API: GET /model/sprints/{sprint_id}
# 3. Audit trail: row_version tracks manifest changes
# 4. No GitHub issue parsing needed
# 5. Cross-project reference capability
# ============================================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$ManifestJsonPath,
    
    [Parameter(Mandatory = $false)]
    [string]$DataModelUrl = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io",
    
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

# Read manifest
if (-not (Test-Path $ManifestJsonPath)) {
    Write-Error "Manifest not found: $ManifestJsonPath"
    exit 1
}

$manifest = Get-Content $ManifestJsonPath | ConvertFrom-Json
$sprintId = $manifest.sprint_id

if (-not $sprintId) {
    Write-Error "Manifest missing sprint_id field"
    exit 1
}

# Build sprint object
$sprintObject = @{
    "id"           = "$sprintId"
    "label"        = $manifest.sprint_title
    "project_id"   = "37-data-model"
    "start_date"   = (Get-Date -Format "yyyy-MM-dd")
    "end_date"     = (Get-Date -Format "yyyy-MM-dd")
    "status"       = "planned"
    "goal"         = "Automated bug-fix automation testing via DPDCA (Discover RCA -> Do Fix -> Act Prevent)"
    "velocity_planned" = $manifest.stories.Count * 3  # 3 FP per bug (A+B+C phases)
    "velocity_actual"  = $null
    "story_count"      = $manifest.stories.Count * 3  # 9 substories (3 bugs x 3 phases)
    "stories_completed" = 0
    "ado_iteration_path" = $null
    "mti_at_close"     = $null
    "notes"        = "Sprint 0.5: Bug-fix automation framework validation. Uses bug_fix_agent.py with 3-phase DPDCA."
    "manifest"     = $manifest
}

$body = $sprintObject | ConvertTo-Json -Depth 10 -Compress

Write-Host "[INFO] Preparing to POST sprint to data model..." -ForegroundColor Green
Write-Host "[INFO] Sprint ID: $sprintId" -ForegroundColor Cyan
Write-Host "[INFO] Sprint Title: $($manifest.sprint_title)" -ForegroundColor Cyan
Write-Host "[INFO] Stories: $($manifest.stories.Count)" -ForegroundColor Cyan
Write-Host "[INFO] Data Model URL: $DataModelUrl" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY-RUN] Manifest object (truncated):" -ForegroundColor Yellow
    Write-Host ($sprintObject | ConvertTo-Json -Depth 3 | Select-Object -First 30)
    Write-Host ""
    Write-Host "[DRY-RUN] Would POST to: $DataModelUrl/model/sprints/" -ForegroundColor Yellow
    Write-Host "[DRY-RUN] No actual POST performed" -ForegroundColor Yellow
    exit 0
}

# PUT to data model (data model uses PUT for layer updates, not POST)
try {
    Write-Host "[INFO] Putting sprint to data model..." -ForegroundColor Green
    $response = Invoke-RestMethod `
        -Uri "$DataModelUrl/model/sprints/$sprintId" `
        -Method PUT `
        -ContentType "application/json" `
        -Body $body `
        -Headers @{ "X-Actor" = "agent:copilot" } `
        -SkipCertificateCheck `
        -ErrorAction Stop
    
    if ($response) {
        Write-Host "[PASS] Sprint added to data model!" -ForegroundColor Green
        Write-Host "[INFO] Sprint ID: $($response.id)" -ForegroundColor Cyan
        Write-Host "[INFO] Row version: $($response.row_version)" -ForegroundColor Cyan
        Write-Host "[INFO] Modified at: $($response.modified_at)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "[INFO] Verify with:" -ForegroundColor Gray
        Write-Host "  pwsh -Command `"\`$base='$DataModelUrl'; Invoke-RestMethod `\"`$base/model/sprints/$sprintId`\" -SkipCertificateCheck | ConvertTo-Json -Depth 3`"" -ForegroundColor Gray
        exit 0
    }
} catch {
    Write-Error "Failed to PUT sprint: $_"
    exit 1
}
