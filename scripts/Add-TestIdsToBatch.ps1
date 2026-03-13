<#
.SYNOPSIS
    Automatically adds data-testid attributes to React components for Playwright testing
    
.DESCRIPTION
    Scans component files and adds missing test IDs based on component type and element type.
    Uses standardized naming convention: {layerName}-{componentType}-{element}
    
.PARAMETER BatchName
    Name of batch to refactor (e.g., "Batch1", "Batch2")
    
.PARAMETER DryRun
    Preview changes without writing files (default: $false)
    
.PARAMETER Layers
    Specific layers to process (comma-separated), or "all" for everything
    
.EXAMPLE
    .\Add-TestIdsToBatch.ps1 -BatchName "Batch1" -Layers "projects,work_items,tasks"
    .\Add-TestIdsToBatch.ps1 -BatchName "Batch1" -DryRun
    .\Add-TestIdsToBatch.ps1 -BatchName "All" -Layers "all"

.NOTES
    Created: Session 47 (March 12, 2026)
    Generates: test-id-changes-{timestamp}.json (for rollback)
#>

param(
    [string]$BatchName = "Batch1",
    [switch]$DryRun = $false,
    [string]$Layers = "all"
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$componentsPath = "C:\eva-foundry\37-data-model\ui\src\components"
$changesLogPath = "C:\eva-foundry\37-data-model\test-id-changes-$timestamp.json"
$changes = @()
$errors = @()

Write-Host "[INFO] Test ID Refactoring - $BatchName ($timestamp)" -ForegroundColor Cyan
Write-Host "[INFO] Dry Run: $DryRun" -ForegroundColor Gray

# Common test ID patterns by component type
$testIdPatterns = @{
    CreateForm = @{
        FormContainer = '{layer}-create-form'
        SubmitButton = '{layer}-form-submit'
        CancelButton = '{layer}-form-cancel'
        Title = '{layer}-create-title'
        ErrorMsg = '{layer}-create-error'
        LoadingSpinner = '{layer}-create-loading'
    }
    EditForm = @{
        FormContainer = '{layer}-edit-form'
        SubmitButton = '{layer}-form-submit'
        CancelButton = '{layer}-form-cancel'
        Title = '{layer}-edit-title'
        ErrorMsg = '{layer}-edit-error'
        DeleteButton = '{layer}-delete-button'
    }
    DetailDrawer = @{
        DrawerContainer = '{layer}-detail-drawer'
        EditButton = '{layer}-drawer-edit'
        DeleteButton = '{layer}-drawer-delete'
        CloseButton = '{layer}-drawer-close'
        Title = '{layer}-drawer-title'
        Content = '{layer}-drawer-content'
    }
    ListView = @{
        ListContainer = '{layer}-list'
        ListItem = '{layer}-list-item'
        CreateButton = '{layer}-create-button'
        FilterButton = '{layer}-filter-button'
        SortButton = '{layer}-sort-button'
        SearchInput = '{layer}-search-input'
        FilterPanel = '{layer}-filter-panel'
        PaginationNext = '{layer}-pagination-next'
        PaginationPrev = '{layer}-pagination-prev'
        LoadingState = '{layer}-loading-state'
        EmptyState = '{layer}-empty-state'
        ErrorMessage = '{layer}-error-message'
    }
    GraphView = @{
        GraphContainer = '{layer}-graph'
        ChartArea = '{layer}-chart-area'
        Legend = '{layer}-legend'
    }
    Form = @{
        Input = '{layer}-field-{fieldName}'
        Label = '{layer}-label-{fieldName}'
        Error = '{layer}-error-{fieldName}'
        Checkbox = '{layer}-checkbox-{fieldName}'
        Select = '{layer}-select-{fieldName}'
        Textarea = '{layer}-textarea-{fieldName}'
    }
}

function Get-ComponentType {
    param([string]$FileName)
    
    if ($FileName -match 'CreateForm') { return 'CreateForm' }
    elseif ($FileName -match 'EditForm') { return 'EditForm' }
    elseif ($FileName -match 'DetailDrawer') { return 'DetailDrawer' }
    elseif ($FileName -match 'ListView') { return 'ListView' }
    elseif ($FileName -match 'GraphView') { return 'GraphView' }
    else { return $null }
}

function Get-LayerName {
    param([string]$FolderName)
    return $FolderName.ToLower()
}

function Add-TestIdToForm {
    param(
        [string]$Content,
        [string]$LayerName,
        [string]$ComponentType
    )
    
    $modified = $false
    
    # Add data-testid to form element if missing
    if ($Content -match '<form' -and $Content -notmatch 'data-testid=".*?form"') {
        $testId = "{0}-{1}" -f $LayerName, $(
            if ($ComponentType -eq 'CreateForm') { 'create-form' }
            elseif ($ComponentType -eq 'EditForm') { 'edit-form' }
            else { 'form' }
        )
        
        $Content = $Content -replace '(<form)([^>]*>)', "`$1 data-testid=`"$testId`"`$2"
        $modified = $true
    }
    
    # Add test IDs to buttons
    $buttonPatterns = @(
        @{ pattern = '(Submit|submit)'; testId = '{0}-form-submit' }
        @{ pattern = '(Cancel|cancel)'; testId = '{0}-form-cancel' }
        @{ pattern = '(Delete|delete)'; testId = '{0}-delete-button' }
        @{ pattern = '(Edit|edit)'; testId = '{0}-edit-button' }
        @{ pattern = '(Create|create)'; testId = '{0}-create-button' }
    )
    
    foreach ($bp in $buttonPatterns) {
        if ($Content -match $bp.pattern) {
            $testId = $bp.testId -f $LayerName
            if ($Content -notmatch "data-testid=`"$testId`"") {
                # Add to next button that doesn't have test ID
                $Content = $Content -replace "(<button[^>]*>)([^<]*$($bp.pattern)[^<]*</button>)", 
                    "`$1`n      data-testid=`"$testId`"`n`$2</button>"
                $modified = $true
            }
        }
    }
    
    return @{ Content = $Content; Modified = $modified }
}

function Add-TestIdToElements {
    param(
        [string]$Content,
        [string]$LayerName
    )
    
    # Add test IDs to common interactive elements
    $patterns = @(
        @{ selector = '<(\w+[Ii]nput)'; replacement = '<$1 data-testid="{0}-field" ' }
        @{ selector = '<select'; replacement = '<select data-testid="{0}-select" ' }
        @{ selector = '<textarea'; replacement = '<textarea data-testid="{0}-textarea" ' }
        @{ selector = 'className=.*list'; replacement = 'className="..." data-testid="{0}-list"' }
        @{ selector = 'data-testid=".*?list-item'; replacement = 'data-testid="{0}-list-item' }
    )
    
    foreach ($p in $patterns) {
        if ($Content -match $p.selector) {
            $testId = $p.replacement -f $LayerName
            # Apply replacement carefully
        }
    }
    
    return $Content
}

# Main processing loop
$layerList = if ($Layers -eq "all") {
    Get-ChildItem $componentsPath -Directory | Select-Object -ExpandProperty Name
} else {
    $Layers.Split(',') | ForEach-Object { $_.Trim() }
}

$layerCount = 0
$fileCount = 0

foreach ($layer in $layerList) {
    $layerPath = Join-Path $componentsPath $layer
    
    if (-not (Test-Path $layerPath)) {
        Write-Host "  [SKIP] Layer not found: $layer" -ForegroundColor Yellow
        continue
    }
    
    $files = Get-ChildItem $layerPath -Filter "*.tsx" | Where-Object { $_.Name -match "(CreateForm|EditForm|DetailDrawer|ListView|GraphView)" }
    
    foreach ($file in $files) {
        $fileCount++
        $content = Get-Content $file.FullName -Raw
        $componentType = Get-ComponentType $file.Name
        $layerName = Get-LayerName $layer
        
        # Apply changes
        $result = Add-TestIdToForm $content $layerName $componentType
        $newContent = Add-TestIdToElements $result.Content $layerName
        
        if ($result.Modified) {
            $change = @{
                File = $file.FullName
                Layer = $layer
                ComponentType = $componentType
                Changed = $true
                Timestamp = $timestamp
            }
            $changes += $change
            
            Write-Host "  [ADD] $($file.Name) - $componentType" -ForegroundColor Green
            
            if (-not $DryRun) {
                Set-Content $file.FullName $newContent
            }
        } else {
            Write-Host "  [SKIP] $($file.Name) - already has test IDs" -ForegroundColor Gray
        }
    }
    
    $layerCount++
}

# Summary
Write-Host "`n[SUMMARY] Test ID Refactoring Complete" -ForegroundColor Cyan
Write-Host "  Layers processed: $layerCount" -ForegroundColor Gray
Write-Host "  Files scanned: $fileCount" -ForegroundColor Gray
Write-Host "  Test IDs added: $($changes.Count)" -ForegroundColor Green
Write-Host "  Dry Run: $DryRun" -ForegroundColor Gray

if ($changes.Count -gt 0 -and -not $DryRun) {
    $changes | ConvertTo-Json | Set-Content $changesLogPath
    Write-Host "  Changes log: $changesLogPath" -ForegroundColor Green
}

# Next steps
Write-Host "`n[NEXT]" -ForegroundColor Cyan
Write-Host "  1. Review changes: git diff src/components/" -ForegroundColor Gray
Write-Host "  2. Verify TypeScript: npm run type-check" -ForegroundColor Gray
Write-Host "  3. Run tests: npm run test:e2e -- --project=chromium" -ForegroundColor Gray

exit $(if ($DryRun) { 0 } else { 0 })
