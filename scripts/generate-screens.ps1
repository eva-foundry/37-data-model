# Generate Screens from Templates - Factory POC
# Session 45 Part 5 - Screens Machine POC
# Date: 2026-03-11 00:28 ET

param(
    [Parameter(Mandatory=$true)]
    [string]$LayerId,
    
    [Parameter(Mandatory=$true)]
    [string]$LayerName,
    
    [Parameter(Mandatory=$true)]
    [string]$LayerTitle,
    
    [Parameter(Mandatory=$true)]
    [string]$LayerTitleFr,
    
    [Parameter(Mandatory=$false)]
    [string]$TemplateDir = "c:\eva-foundry\07-foundation-layer\templates\screens-machine",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "c:\eva-foundry\37-data-model\ui\src",
    
    [Parameter(Mandatory=$false)]
    [string]$SchemaEndpoint = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date

# Import template expansion functions
$expandModulePath = Join-Path $PSScriptRoot "Expand-TemplateFields.ps1"
if (Test-Path $expandModulePath) {
    . $expandModulePath 2>$null  # Suppress Export-ModuleMember warning
    Write-Host "[INFO] Template expansion module loaded" -ForegroundColor Green
} else {
    Write-Host "[WARN] Template expansion module not found: $expandModulePath" -ForegroundColor Yellow
    Write-Host "[WARN] Will generate templates with placeholders (Sprint 2 mode)" -ForegroundColor Yellow
}

Write-Host "[INFO] Screens Machine - Generate UI for $LayerId ($LayerName)" -ForegroundColor Cyan
Write-Host "[INFO] Start: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ET"
Write-Host ""

# Fetch schema from API with retry logic
Write-Host "[INFO] Fetching schema from $SchemaEndpoint/model/$LayerName/fields" -ForegroundColor Cyan
$layerSchema = $null
$maxRetries = 3
$retryDelay = 1

for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
    try {
        $schemaUrl = "$SchemaEndpoint/model/$LayerName/fields"
        $layerSchema = Invoke-RestMethod -Uri $schemaUrl -Method GET -TimeoutSec 10 -ErrorAction Stop
        Write-Host "[PASS] Schema fetched: $($layerSchema.fields.Count) fields from $($layerSchema.sample_count) objects" -ForegroundColor Green
        break
    } catch {
        Write-Host "[WARN] Schema fetch attempt $attempt/$maxRetries failed: $_" -ForegroundColor Yellow
        if ($attempt -lt $maxRetries) {
            Write-Host "[INFO] Retrying in $retryDelay seconds..." -ForegroundColor Cyan
            Start-Sleep -Seconds $retryDelay
            $retryDelay *= 2  # Exponential backoff
        } else {
            Write-Host "[WARN] All schema fetch attempts failed. Continuing with empty schema (graceful degradation)" -ForegroundColor Yellow
            $layerSchema = @{
                layer = $LayerName
                fields = @()
                sample_count = 0
                generated_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
            }
        }
    }
}
Write-Host ""

# Template variables
$vars = @{
    "{{LAYER_ID}}" = $LayerId
    "{{LAYER_NAME}}" = $LayerName
    "{{LAYER_TITLE}}" = $LayerTitle
    "{{LAYER_TITLE_FR}}" = $LayerTitleFr
    "{{ENTITY_TYPE}}" = "${LayerTitle}Record"
    "{{PK_FIELD}}" = "id"
    "{{TIMESTAMP}}" = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    "{{GENERATOR}}" = "screens-machine-v1.0.0"
    "{{TEST_COVERAGE}}" = "100"
    "{{SCHEMA_ENDPOINT}}" = $SchemaEndpoint
    "{{LAYER_FIELDS_JSON}}" = ($layerSchema | ConvertTo-Json -Depth 10 -Compress)
    "{{FIELD_COUNT}}" = $layerSchema.fields.Count
}

Write-Host "[INFO] Template variables:" -ForegroundColor Yellow
$vars.GetEnumerator() | Sort-Object Name | ForEach-Object {
    Write-Host "  $($_.Key) = $($_.Value)"
}
Write-Host ""

# Ensure output directories exist
$pagesDir = Join-Path $OutputDir "pages\$LayerName"
$componentsDir = Join-Path $OutputDir "components\$LayerName"
$testsDir = Join-Path $pagesDir "__tests__"

Write-Host "[INFO] Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $pagesDir -Force | Out-Null
New-Item -ItemType Directory -Path $componentsDir -Force | Out-Null
New-Item -ItemType Directory -Path $testsDir -Force | Out-Null
Write-Host "[PASS] Directories created" -ForegroundColor Green
Write-Host ""

# Template files to process
$templates = @(
    @{ Template = "ListView.template.tsx"; Output = "${LayerTitle}ListView.tsx"; Dir = $pagesDir }
    @{ Template = "DetailView.template.tsx"; Output = "${LayerTitle}DetailDrawer.tsx"; Dir = $componentsDir }
    @{ Template = "CreateForm.template.tsx"; Output = "${LayerTitle}CreateForm.tsx"; Dir = $componentsDir }
    @{ Template = "EditForm.template.tsx"; Output = "${LayerTitle}EditForm.tsx"; Dir = $componentsDir }
    @{ Template = "GraphView.template.tsx"; Output = "${LayerTitle}GraphView.tsx"; Dir = $componentsDir }
    @{ Template = "test.spec.tsx.template"; Output = "${LayerTitle}ListView.test.tsx"; Dir = $testsDir }
)

$filesGenerated = @()
$totalLOC = 0

Write-Host "[INFO] Processing templates..." -ForegroundColor Yellow
foreach ($tmpl in $templates) {
    $templatePath = Join-Path $TemplateDir $tmpl.Template
    $outputPath = Join-Path $tmpl.Dir $tmpl.Output
    
    Write-Host "  [*] $($tmpl.Template) -> $($tmpl.Output)"
    
    if (-not (Test-Path $templatePath)) {
        Write-Host "    [ERROR] Template not found: $templatePath" -ForegroundColor Red
        continue
    }
    
    # Read template
    $content = Get-Content $templatePath -Raw -Encoding UTF8
    
    # Apply basic substitutions (layer name, ID, timestamps)
    foreach ($key in $vars.Keys) {
        $content = $content -replace [regex]::Escape($key), $vars[$key]
    }
    
    # Expand field loops if schema available and expansion module loaded
    if ($layerSchema.fields.Count -gt 0 -and (Get-Command -Name Expand-AllTemplateFields -ErrorAction SilentlyContinue)) {
        try {
            Write-Host "    [INFO] Expanding field loops ($($layerSchema.fields.Count) fields)..." -ForegroundColor Cyan
            $content = Expand-AllTemplateFields -TemplateContent $content -Fields $layerSchema.fields -ComponentName $LayerName
            Write-Host "    [PASS] Field loops expanded" -ForegroundColor Green
        } catch {
            Write-Host "    [WARN] Field expansion failed: $_" -ForegroundColor Yellow
            Write-Host "    [WARN] Continuing with template placeholders" -ForegroundColor Yellow
        }
    } else {
        if ($layerSchema.fields.Count -eq 0) {
            Write-Host "    [WARN] No schema fields available - template placeholders will remain" -ForegroundColor Yellow
        }
    }
    
    # Write output
    Set-Content -Path $outputPath -Value $content -Encoding UTF8
    
    # Count LOC
    $loc = (Get-Content $outputPath | Measure-Object -Line).Lines
    $totalLOC += $loc
    
    $filesGenerated += @{
        Template = $tmpl.Template
        Output = $tmpl.Output
        Path = $outputPath
        LOC = $loc
    }
    
    Write-Host "    [PASS] $loc lines" -ForegroundColor Green
}

Write-Host ""
Write-Host "[INFO] Generation complete!" -ForegroundColor Cyan
Write-Host ""

# Summary
$duration = (Get-Date) - $startTime
Write-Host "[SUMMARY]" -ForegroundColor Cyan
Write-Host "  Layer: $LayerId ($LayerName)"
Write-Host "  Files generated: $($filesGenerated.Count)"
Write-Host "  Total LOC: $totalLOC"
Write-Host "  Duration: $($duration.TotalSeconds) seconds"
Write-Host ""

# Generate evidence
$evidence = @{
    operation = "screen_generation"
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    generator = "screens-machine-v1.0.0"
    layer = @{
        id = $LayerId
        name = $LayerName
        title = $LayerTitle
        title_fr = $LayerTitleFr
    }
    schema_metadata = @{
        endpoint = $SchemaEndpoint
        fetched = ($layerSchema.fields.Count -gt 0)
        field_count = $layerSchema.fields.Count
        sample_count = $layerSchema.sample_count
        generated_at = $layerSchema.generated_at
    }
    components_generated = $filesGenerated | ForEach-Object {
        @{
            type = $_.Template -replace "\.template\.tsx", "" -replace "\.tsx\.template", ""
            file = $_.Output
            path = $_.Path
            lines_of_code = $_.LOC
        }
    }
    metrics = @{
        files_count = $filesGenerated.Count
        total_loc = $totalLOC
        duration_seconds = [math]::Round($duration.TotalSeconds, 2)
        avg_loc_per_file = [math]::Round($totalLOC / $filesGenerated.Count, 0)
    }
    quality_gates = @{
        typescript_compilation = "PENDING"
        eslint = "PENDING"
        jest_coverage = "PENDING"
        accessibility = "PENDING"
        i18n = "PENDING"
    }
    session = "45-fkte-sprint1"
    next_steps = @(
        "npm run type-check"
        "npm run lint"
        "npm test -- --coverage"
        "git add ui/src/"
        "git commit -m 'feat(ui): Add $LayerTitle screens (auto-generated)'"
    )
}

$evidencePath = "evidence/screen-generation-$LayerName-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$evidence | ConvertTo-Json -Depth 10 | Set-Content $evidencePath -Encoding UTF8
$evidence = @{
    operation = "screen_generation"
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    generator = "screens-machine-v1.0.0"
    layer = @{
        id = $LayerId
        name = $LayerName
        title = $LayerTitle
        title_fr = $LayerTitleFr
    }
    components_generated = $filesGenerated | ForEach-Object {
        @{
            type = $_.Template -replace "\.template\.tsx", "" -replace "\.tsx\.template", ""
            file = $_.Output
            path = $_.Path
            lines_of_code = $_.LOC
        }
    }
    metrics = @{
        files_count = $filesGenerated.Count
        total_loc = $totalLOC
        duration_seconds = [math]::Round($duration.TotalSeconds, 2)
        avg_loc_per_file = [math]::Round($totalLOC / $filesGenerated.Count, 0)
    }
    quality_gates = @{
        typescript_compilation = "PENDING"
        eslint = "PENDING"
        jest_coverage = "PENDING"
        accessibility = "PENDING"
        i18n = "PENDING"
    }
    session = "45-part5-factory-poc"
    next_steps = @(
        "npm run type-check"
        "npm run lint"
        "npm test -- --coverage"
        "git add ui/src/"
        "git commit -m 'feat(ui): Add $LayerTitle screens (auto-generated)'"
    )
}

$evidencePath = "evidence/screen-generation-$LayerName-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$evidence | ConvertTo-Json -Depth 10 | Set-Content $evidencePath -Encoding UTF8

Write-Host "[PASS] Evidence saved: $evidencePath" -ForegroundColor Green
Write-Host ""

# Output for next steps
Write-Host "[NEXT STEPS]" -ForegroundColor Yellow
Write-Host "  1. Review generated files in: $pagesDir"
Write-Host "  2. Run quality gates: npm run type-check && npm run lint && npm test"
Write-Host "  3. Commit generated code"
Write-Host ""

exit 0
