#Requires -Version 7.0
<#
.SYNOPSIS
    FKTE Sprint 2 - Batch Screen Generation for All 111 Layers
.DESCRIPTION
    Generates UI components for all 111 layers using live schema from Data Model API.
    Orchestrates 111 calls to generate-screens.ps1 with evidence aggregation.
.PARAMETER OutputDir
    Base output directory for all generated files (default: ui/src)
.PARAMETER SchemaEndpoint
    Data Model API base URL (default: production ACA endpoint)
.PARAMETER MaxParallel
    Maximum parallel generation jobs (default: 5)
.PARAMETER DryRun
    If set, only shows what would be generated without creating files
#>

param(
    [string]$OutputDir = "batch-output",
    [string]$SchemaEndpoint = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",
    [int]$MaxParallel = 5,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Banner
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FKTE Sprint 2 - Batch Screen Generation" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

$startTime = Get-Date
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Ensure evidence directory exists
$evidenceDir = Join-Path $PSScriptRoot "evidence"
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null

# Fetch all layers from API
Write-Host "[INFO] Fetching layer list from API..." -ForegroundColor Cyan
try {
    $guide = Invoke-RestMethod "$SchemaEndpoint/model/agent-guide" -TimeoutSec 10
    $allLayers = $guide.layers_available
    Write-Host "[PASS] Fetched $($allLayers.Count) layers" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Could not fetch layer list: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Layer metadata lookup (common titles/translations)
# FIXED: Use plural forms to match layer names (Session 45 - March 12, 2026)
$layerMetadata = @{
    "projects" = @{title="Projects"; title_fr="Projets"}
    "sprints" = @{title="Sprints"; title_fr="Sprints"}
    "stories" = @{title="Stories"; title_fr="Histoires"}
    "tasks" = @{title="Tasks"; title_fr="Tâches"}
    "evidence" = @{title="Evidence"; title_fr="Preuves"}
    "endpoints" = @{title="Endpoints"; title_fr="PointsDeTerminaison"}
    "wbs" = @{title="Wbs"; title_fr="WBS"}  # Preserve as-is, WBS is acronym
}

# Batch processing
$results = @()
$successCount = 0
$failureCount = 0
$totalLOC = 0
$totalFiles = 0

Write-Host "[INFO] Starting batch generation..." -ForegroundColor Cyan
Write-Host "  Output directory: $OutputDir" -ForegroundColor Gray
Write-Host "  Schema endpoint: $SchemaEndpoint" -ForegroundColor Gray
Write-Host "  Dry run: $DryRun`n" -ForegroundColor Gray

foreach ($layerName in $allLayers) {
    $layerIndex = $allLayers.IndexOf($layerName) + 1
    $layerId = "L$layerIndex"
    
    # Get metadata or generate defaults
    $meta = $layerMetadata[$layerName]
    if (-not $meta) {
        # Convert layer_name to PascalCase (no spaces) for valid file/class names
        $title = (Get-Culture).TextInfo.ToTitleCase($layerName.Replace("_", " ")).Replace(" ", "")
        $meta = @{
            title = $title
            title_fr = $title  # Same as English if no translation
        }
    }
    
    Write-Host "[$layerIndex/$($allLayers.Count)] $layerId ($layerName)..." -NoNewline
    
    if ($DryRun) {
        Write-Host " [DRY RUN]" -ForegroundColor Yellow
        continue
    }
    
    try {
        # Call generate-screens.ps1
        $generateStart = Get-Date
        $output = & "$PSScriptRoot\generate-screens.ps1" `
            -LayerId $layerId `
            -LayerName $layerName `
            -LayerTitle $meta.title `
            -LayerTitleFr $meta.title_fr `
            -OutputDir $OutputDir `
            -SchemaEndpoint $SchemaEndpoint `
            2>&1
        
        $duration = (Get-Date) - $generateStart
        
        # Parse output for metrics (looking for LOC count)
        $locMatch = $output | Select-String "Total LOC: (\d+)"
        $loc = if ($locMatch) { [int]$locMatch.Matches.Groups[1].Value } else { 0 }
        
        $filesMatch = $output | Select-String "Files generated: (\d+)"
        $files = if ($filesMatch) { [int]$filesMatch.Matches.Groups[1].Value } else { 6 }
        
        $totalLOC += $loc
        $totalFiles += $files
        $successCount++
        
        Write-Host " OK ($files files, $loc LOC, $([math]::Round($duration.TotalSeconds, 2))s)" -ForegroundColor Green
        
        $results += @{
            layer_id = $layerId
            layer_name = $layerName
            status = "success"
            files = $files
            loc = $loc
            duration_seconds = [math]::Round($duration.TotalSeconds, 3)
        }
        
    } catch {
        $failureCount++
        Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
        
        $results += @{
            layer_id = $layerId
            layer_name = $layerName
            status = "failed"
            error = $_.Exception.Message
            duration_seconds = 0
        }
    }
}

$endTime = Get-Date
$totalDuration = ($endTime - $startTime).TotalSeconds

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "BATCH GENERATION COMPLETE" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "RESULTS:" -ForegroundColor White
Write-Host "  Success: $successCount / $($allLayers.Count)" -ForegroundColor $(if ($successCount -eq $allLayers.Count) { 'Green' } else { 'Yellow' })
Write-Host "  Failed: $failureCount" -ForegroundColor $(if ($failureCount -eq 0) { 'Green' } else { 'Red' })
Write-Host "  Total files: $totalFiles" -ForegroundColor Gray
Write-Host "  Total LOC: $totalLOC" -ForegroundColor Gray
Write-Host "  Duration: $([math]::Round($totalDuration, 2)) seconds`n" -ForegroundColor Gray

Write-Host "PERFORMANCE:" -ForegroundColor White
Write-Host "  LOC/second: $([math]::Round($totalLOC / $totalDuration, 0))" -ForegroundColor Cyan
Write-Host "  Files/second: $([math]::Round($totalFiles / $totalDuration, 2))" -ForegroundColor Cyan
Write-Host "  Average time/layer: $([math]::Round($totalDuration / $allLayers.Count, 2))s`n" -ForegroundColor Gray

# ROI calculation
$manualTimePerLayer = 150  # 2.5 hours = 150 minutes
$manualTotalMinutes = $manualTimePerLayer * $allLayers.Count
$automatedMinutes = $totalDuration / 60
$speedup = [math]::Round($manualTotalMinutes / $automatedMinutes, 0)

Write-Host "ROI:" -ForegroundColor White
Write-Host "  Manual estimate: $manualTotalMinutes minutes ($([math]::Round($manualTotalMinutes / 60, 1)) hours)" -ForegroundColor Gray
Write-Host "  Automated actual: $([math]::Round($automatedMinutes, 2)) minutes" -ForegroundColor Gray
Write-Host "  Speedup: ${speedup}x" -ForegroundColor Cyan
Write-Host "  Time saved: $([math]::Round(($manualTotalMinutes - $automatedMinutes) / 60, 1)) hours`n" -ForegroundColor Green

# Save evidence
$evidence = @{
    batch_id = "fkte-sprint2-batch-generation"
    timestamp = $timestamp
    started_at = $startTime.ToString("yyyy-MM-ddTHH:mm:ssK")
    completed_at = $endTime.ToString("yyyy-MM-ddTHH:mm:ssK")
    
    inputs = @{
        schema_endpoint = $SchemaEndpoint
        output_dir = $OutputDir
        target_layers = $allLayers.Count
        dry_run = $DryRun.IsPresent
    }
    
    results = @{
        success_count = $successCount
        failure_count = $failureCount
        total_files = $totalFiles
        total_loc = $totalLOC
        duration_seconds = [math]::Round($totalDuration, 3)
    }
    
    performance = @{
        loc_per_second = [math]::Round($totalLOC / $totalDuration, 0)
        files_per_second = [math]::Round($totalFiles / $totalDuration, 2)
        average_seconds_per_layer = [math]::Round($totalDuration / $allLayers.Count, 3)
    }
    
    roi = @{
        manual_estimate_minutes = $manualTotalMinutes
        automated_actual_minutes = [math]::Round($automatedMinutes, 2)
        speedup_factor = $speedup
        time_saved_hours = [math]::Round(($manualTotalMinutes - $automatedMinutes) / 60, 1)
    }
    
    layer_results = $results
}

$evidencePath = Join-Path $evidenceDir "batch-generation-all-layers-$timestamp.json"
$evidence | ConvertTo-Json -Depth 10 | Set-Content $evidencePath -Encoding UTF8
Write-Host "[PASS] Evidence saved: $evidencePath" -ForegroundColor Green

Write-Host "`n========================================`n" -ForegroundColor Cyan

# Exit code
if ($failureCount -eq 0) {
    exit 0
} else {
    exit 1
}
