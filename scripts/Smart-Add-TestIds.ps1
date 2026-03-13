<#
.SYNOPSIS
    Smart component refactoring - Analyzes component structure and adds data-testid attributes
    
.DESCRIPTION
    Reads React component files and intelligently adds test ID attributes based on:
    1. Element types (button, input, form, etc.)
    2. Component structure (ListView, CreateForm, etc.)
    3. Existing test ID presence (skips if already present)
    4. Text content heuristics (Create --> create-button, Delete --> delete-button)
    
.PARAMETER BatchNumber
    Batch to process (1-4), or "all" for everything
    
.PARAMETER LayerNames
    Specific layer names to process (comma-separated), or "all"
    
.PARAMETER DryRun
    Preview changes without writing files
    
.PARAMETER Verbose
    Show detailed change information
    
.EXAMPLE
    .\Smart-Add-TestIds.ps1 -BatchNumber 1 -DryRun -Verbose
    .\Smart-Add-TestIds.ps1 -BatchNumber 1 -LayerNames "projects,wbs,sprints"
    .\Smart-Add-TestIds.ps1 -BatchNumber "all"

#>

param(
    [int]$BatchNumber = 1,
    [string]$LayerNames = "all",
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$basePath = "C:\eva-foundry\37-data-model\ui\src\components"
$logFile = "C:\eva-foundry\37-data-model\test-id-refactor-$timestamp.log"
$changesFile = "C:\eva-foundry\37-data-model\test-id-changes-$timestamp.json"

$stats = @{
    FilesProcessed = 0
    FilesModified = 0
    TestIdsAdded = 0
    ElementsAnalyzed = 0
    Errors = @()
}

# Initialize log
Add-Content $logFile "[START] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Content $logFile "Batch: $BatchNumber | Layers: $LayerNames | DryRun: $DryRun"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logMsg = "[$Level] $Message"
    Write-Host $logMsg -ForegroundColor $(
        if ($Level -eq "ERROR") { "Red" }
        elseif ($Level -eq "WARN") { "Yellow" }
        elseif ($Level -eq "SUCCESS") { "Green" }
        else { "Gray" }
    )
    Add-Content $logFile $logMsg
}

function Get-ComponentTypeFromFile {
    param([string]$FilePath)
    
    $content = Get-Content $FilePath -Raw
    
    if ($content -match 'export.*ListView|function.*ListView') { return 'ListView' }
    elseif ($content -match 'export.*CreateForm|function.*CreateForm') { return 'CreateForm' }
    elseif ($content -match 'export.*EditForm|function.*EditForm') { return 'EditForm' }
    elseif ($content -match 'export.*DetailDrawer|function.*DetailDrawer') { return 'DetailDrawer' }
    elseif ($content -match 'export.*GraphView|function.*GraphView') { return 'GraphView' }
    return $null
}

function Extract-LayerName {
    param([string]$FolderPath)
    return (Split-Path $FolderPath -Leaf).ToLower()
}

function Test-HasTestId {
    param([string]$Line)
    return $Line -match 'data-testid\s*='
}

function Generate-TestId {
    param(
        [string]$Layer,
        [string]$ElementType,
        [string]$TextContent = "",
        [string]$ComponentType = ""
    )
    
    # Determine suffix based on text and element type
    $suffix = ""
    
    switch -Regex ($TextContent) {
        'Create|create' { $suffix = 'create-button' }
        'Delete|delete' { $suffix = 'delete-button' }
        'Edit|edit' { $suffix = 'edit-button' }
        'Cancel|cancel' { $suffix = 'form-cancel' }
        'Submit|submit|Save|save' { $suffix = 'form-submit' }
        'Filter|filter' { $suffix = 'filter-button' }
        'Search|search' { $suffix = 'search-input' }
        'Sort|sort' { $suffix = 'sort-button' }
        'Next|next' { $suffix = 'pagination-next' }
        'Previous|prev|previous' { $suffix = 'pagination-prev' }
        default {
            # Fallback based on element type
            switch ($ElementType) {
                'button' { $suffix = 'action-button' }
                'input' { $suffix = 'input-field' }
                'form' { $suffix = 'form' }
                'div' { $suffix = 'container' }
                default { $suffix = 'element' }
            }
        }
    }
    
    return "$Layer-$suffix"
}

function Add-TestIdToLine {
    param(
        [string]$Line,
        [string]$TestId
    )
    
    # Already has testId?
    if ($Line -match 'data-testid') { return $Line }
    
    # Add test ID appropriately based on tag
    if ($Line -match '<(\w+)([^>]*)(>)') {
        $tagName = $Matches[1]
        $attributes = $Matches[2]
        
        # Insert data-testid after opening tag
        return $Line -replace "(<$tagName)(\s+)", "`$1 data-testid=`"$TestId`"`$2"
    }
    
    return $Line
}

function Process-ComponentFile {
    param(
        [string]$FilePath,
        [string]$LayerName,
        [string]$ComponentType
    )
    
    if ($Verbose) { Write-Log "Processing: $FilePath" "DEBUG" }
    
    $content = Get-Content $FilePath -Raw
    $lines = $content -split "`n"
    $modified = $false
    $addedIds = 0
    $newLines = @()
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $newLine = $line
        
        $stats.ElementsAnalyzed++
        
        # Skip if already has test ID
        if (Test-HasTestId $line) {
            $newLines += $newLine
            continue
        }
        
        # Analyze line for elements that need test IDs
        if ($line -match '<(form|button|input|div|select|textarea)') {
            $elementType = $Matches[1]
            $textContent = if ($i + 1 -lt $lines.Count) { $lines[$i + 1] } else { "" }
            
            $testId = Generate-TestId $LayerName $elementType $textContent $ComponentType
            $newLine = Add-TestIdToLine $line $testId
            
            if ($newLine -ne $line) {
                $modified = $true
                $addedIds++
                if ($Verbose) { Write-Log "  Added: $testId" "DEBUG" }
            }
        }
        
        $newLines += $newLine
    }
    
    if ($modified) {
        $stats.FilesModified++
        $stats.TestIdsAdded += $addedIds
        
        if (-not $DryRun) {
            $newLines -join "`n" | Set-Content $FilePath -Encoding UTF8
        }
        
        return @{ ModifiedCount = $addedIds; Success = $true }
    }
    
    return @{ ModifiedCount = 0; Success = $false }
}

# Map batch numbers to layers
$batchMap = @{
    1 = @("projects", "wbs", "sprints", "stories", "tasks", "evidence", "quality_gates", "work_step_events", "verification_records", "project_work", "agents", "agent_tools", "deployment_targets", "deployments", "execution_logs", "execution_traces", "relationships", "ontology_mapping", "system_metrics", "adoption_metrics")
    2 = @("model_objects", "model_layers", "model_edges", "model_schema", "model_queries", "model_mutations", "model_subscriptions", "model_validation", "model_security", "model_performance", "api_endpoints", "api_versions", "api_documentation", "api_testing", "api_monitoring")
    3 = @("infrastructure_events", "agent_execution_history", "deployment_records", "audit_logs", "performance_metrics", "cost_analytics", "compliance_records", "security_events")
    4 = @("strategy_goals", "strategy_milestones", "strategy_roadmap", "strategy_decisions")
}

# Determine which layers to process
$layersToProcess = if ($LayerNames -eq "all") {
    $batchMap[$BatchNumber]
} else {
    $LayerNames.Split(',') | ForEach-Object { $_.Trim() }
}

Write-Log "Processing Batch $BatchNumber with layers: $($layersToProcess -join ', ')"

# Main loop
foreach ($layer in $layersToProcess) {
    $layerPath = Join-Path $basePath $layer
    
    if (-not (Test-Path $layerPath)) {
        Write-Log "Layer directory not found: $layerPath" "WARN"
        continue
    }
    
    Write-Log "Processing layer: $layer" "INFO"
    
    $componentFiles = Get-ChildItem $layerPath -Filter "*.tsx" -ErrorAction SilentlyContinue
    
    foreach ($file in $componentFiles) {
        $stats.FilesProcessed++
        
        $componentType = Get-ComponentTypeFromFile $file.FullName
        if ($null -eq $componentType) {
            if ($Verbose) { Write-Log "Skipping $($file.Name) - not a recognized component type" "DEBUG" }
            continue
        }
        
        $result = Process-ComponentFile $file.FullName $layer $componentType
        
        if ($result.Success) {
            Write-Log "  ✓ $($file.Name) ($componentType): +$($result.ModifiedCount) test IDs" "SUCCESS"
        }
    }
}

# Summary
Write-Log "[SUMMARY]"
Write-Log "Files processed: $($stats.FilesProcessed)"
Write-Log "Files modified: $($stats.FilesModified)"
Write-Log "Test IDs added: $($stats.TestIdsAdded)"
Write-Log "Elements analyzed: $($stats.ElementsAnalyzed)"

if ($stats.Errors.Count -gt 0) {
    Write-Log "Errors: $($stats.Errors.Count)" "WARN"
    foreach ($err in $stats.Errors) {
        Write-Log "  - $err" "ERROR"
    }
}

# Save changes metadata
$stats | ConvertTo-Json | Set-Content $changesFile

Write-Log "[END] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "INFO"
Write-Log "Log file: $logFile"
Write-Log "Changes: $changesFile"

# Next steps
if ($stats.FilesModified -gt 0) {
    Write-Host "`n[NEXT STEPS]" -ForegroundColor Cyan
    Write-Host "  1. Review changes: git diff src/components/" -ForegroundColor Gray
    Write-Host "  2. Type check: npm run type-check" -ForegroundColor Gray
    Write-Host "  3. Lint: npm run lint" -ForegroundColor Gray
    Write-Host "  4. Test: npm run test:e2e -- --project=chromium" -ForegroundColor Gray
    Write-Host "  5. Commit: git add . && git commit -m 'feat: add test IDs to batch $BatchNumber'" -ForegroundColor Gray
}

exit 0
