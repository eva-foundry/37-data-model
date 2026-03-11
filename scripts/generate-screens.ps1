#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Generates screen component files for a given data model layer.

.DESCRIPTION
  Reads layer metadata, fetches the layer schema from the EVA Data Model API,
  processes component templates with variable substitution, writes output files,
  and records an evidence.json artifact for audit traceability.

  Schema fetch uses retry logic (3 attempts, exponential backoff: 1s, 2s, 4s).
  If the schema endpoint is unreachable, generation continues with an empty
  schema and logs a warning -- it does NOT abort.

.PARAMETER LayerId
  Layer identifier (e.g. L25, L31, L11). Mandatory.

.PARAMETER LayerName
  Layer name used in generated code (e.g. projects, evidence, endpoints). Mandatory.

.PARAMETER LayerTitle
  Human-readable English title (default: derived from LayerName).

.PARAMETER LayerTitleFr
  Human-readable French title (default: empty string).

.PARAMETER SchemaEndpoint
  Base URL of the EVA Data Model API used to fetch layer schema.
  Default: https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io

.PARAMETER OutputDir
  Directory where generated files are written (default: ./generated-screens).

.PARAMETER TemplateDir
  Directory containing *.template files (default: ./templates/screens).

.EXAMPLE
  .\generate-screens.ps1 -LayerId L25 -LayerName projects

.EXAMPLE
  .\generate-screens.ps1 -LayerId L25 -LayerName projects -OutputDir test-output

.EXAMPLE
  .\generate-screens.ps1 -LayerId L25 -LayerName projects -SchemaEndpoint "https://invalid.example.com" -OutputDir test-output
#>

param(
  [Parameter(Mandatory)]
  [string]$LayerId,

  [Parameter(Mandatory)]
  [string]$LayerName,

  [string]$LayerTitle = "",

  [string]$LayerTitleFr = "",

  [string]$SchemaEndpoint = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",

  [string]$OutputDir = "./generated-screens",

  [string]$TemplateDir = "./templates/screens"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$startTime = Get-Date

# ---------------------------------------------------------------------------
# Parameter validation
# ---------------------------------------------------------------------------
if (-not $LayerTitle) {
  $LayerTitle = (Get-Culture).TextInfo.ToTitleCase($LayerName.Replace("-", " ").Replace("_", " "))
}

Write-Host "[INFO] generate-screens.ps1 starting" -ForegroundColor Cyan
Write-Host "[INFO] LayerId      : $LayerId" -ForegroundColor Gray
Write-Host "[INFO] LayerName    : $LayerName" -ForegroundColor Gray
Write-Host "[INFO] LayerTitle   : $LayerTitle" -ForegroundColor Gray
Write-Host "[INFO] OutputDir    : $OutputDir" -ForegroundColor Gray
Write-Host "[INFO] TemplateDir  : $TemplateDir" -ForegroundColor Gray
Write-Host "[INFO] SchemaEndpoint: $SchemaEndpoint" -ForegroundColor Gray

# ---------------------------------------------------------------------------
# Schema fetch with retry (exponential backoff: 1s, 2s, 4s)
# ---------------------------------------------------------------------------
$schemaUrl = "$SchemaEndpoint/model/$LayerName/fields"
Write-Host "[INFO] Fetching schema from: $schemaUrl" -ForegroundColor Cyan

$layerSchema = $null
$maxAttempts = 3
$backoffSeconds = @(1, 2, 4)

for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
  try {
    $layerSchema = Invoke-RestMethod -Uri $schemaUrl -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[PASS] Schema fetched: $($layerSchema.fields.Count) fields" -ForegroundColor Green
    break
  } catch {
    $errorMessage = $_.Exception.Message
    if ($attempt -lt $maxAttempts) {
      $waitSec = $backoffSeconds[$attempt - 1]
      Write-Host "[WARN] Schema fetch attempt $attempt failed: $errorMessage" -ForegroundColor Yellow
      Write-Host "[INFO] Retrying in ${waitSec}s (attempt $($attempt + 1) of $maxAttempts)..." -ForegroundColor Gray
      Start-Sleep -Seconds $waitSec
    } else {
      Write-Host "[WARN] Schema fetch failed after $maxAttempts attempts: $errorMessage" -ForegroundColor Yellow
      Write-Host "[WARN] Continuing with empty schema (graceful degradation)" -ForegroundColor Yellow
      $layerSchema = $null
    }
  }
}

if ($null -eq $layerSchema) {
  $layerSchema = [PSCustomObject]@{
    layer        = $LayerName
    fields       = @()
    sample_count = 0
  }
}

# Ensure fields is always an array (guard against unexpected API shapes)
if ($null -eq $layerSchema.fields) {
  $layerSchema | Add-Member -NotePropertyName "fields" -NotePropertyValue @() -Force
}
if ($null -eq $layerSchema.sample_count) {
  $layerSchema | Add-Member -NotePropertyName "sample_count" -NotePropertyValue 0 -Force
}

# ---------------------------------------------------------------------------
# Output directory
# ---------------------------------------------------------------------------
$layerOutputDir = Join-Path $OutputDir $LayerName
if (-not (Test-Path $layerOutputDir)) {
  New-Item -ItemType Directory -Path $layerOutputDir -Force | Out-Null
  Write-Host "[INFO] Created output directory: $layerOutputDir" -ForegroundColor Gray
}

# ---------------------------------------------------------------------------
# Template variable substitution table
# ---------------------------------------------------------------------------
$templateVariables = @{
  'LAYER_ID'         = $LayerId
  'LAYER_NAME'       = $LayerName
  'LAYER_TITLE'      = $LayerTitle
  'LAYER_TITLE_FR'   = $LayerTitleFr
  'TIMESTAMP'        = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  'GENERATOR'        = "Screens Machine v1.0.0"
  'SCHEMA_ENDPOINT'  = $SchemaEndpoint
  'LAYER_FIELDS_JSON' = ($layerSchema | ConvertTo-Json -Depth 10 -Compress)
  'FIELD_COUNT'      = [string]$layerSchema.fields.Count
}

# ---------------------------------------------------------------------------
# Template processing
# ---------------------------------------------------------------------------
$templatesProcessed = 0
$totalLOC = 0

if (Test-Path $TemplateDir) {
  $templateFiles = @(Get-ChildItem -Path $TemplateDir -Filter "*.template" -File)
  Write-Host "[INFO] Found $($templateFiles.Count) template(s) in $TemplateDir" -ForegroundColor Gray

  foreach ($templateFile in $templateFiles) {
    $outputFileName = $templateFile.BaseName -replace '\.template$', ''
    $outputFileName = $outputFileName -replace 'LAYER_NAME', $LayerName
    $outputPath = Join-Path $layerOutputDir $outputFileName

    $content = Get-Content -Path $templateFile.FullName -Raw -Encoding UTF8

    foreach ($key in $templateVariables.Keys) {
      $content = $content -replace [regex]::Escape("{{$key}}"), $templateVariables[$key]
    }

    Set-Content -Path $outputPath -Value $content -Encoding UTF8 -NoNewline
    $lineCount = ($content -split "`n").Count
    $totalLOC += $lineCount
    $templatesProcessed++
    Write-Host "[PASS] Generated: $outputPath ($lineCount lines)" -ForegroundColor Green
  }
} else {
  Write-Host "[WARN] Template directory not found: $TemplateDir -- skipping template processing" -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# Duration
# ---------------------------------------------------------------------------
$duration = (Get-Date) - $startTime

# ---------------------------------------------------------------------------
# Evidence output
# ---------------------------------------------------------------------------
$evidence = @{
  operation          = "screen_generation"
  layer_id           = $LayerId
  layer_name         = $LayerName
  timestamp          = Get-Date -Format "o"
  generator          = "Screens Machine v1.0.0"
  templates_processed = $templatesProcessed
  lines_of_code      = $totalLOC
  duration_seconds   = [math]::Round($duration.TotalSeconds, 3)
  schema_metadata    = @{
    endpoint      = $SchemaEndpoint
    fetched       = ($layerSchema.fields.Count -gt 0)
    field_count   = $layerSchema.fields.Count
    sample_count  = $layerSchema.sample_count
  }
  output_directory   = $layerOutputDir
  status             = "success"
}

$evidencePath = Join-Path $layerOutputDir "evidence.json"
$evidence | ConvertTo-Json -Depth 10 | Set-Content -Path $evidencePath -Encoding UTF8
Write-Host "[PASS] Evidence written: $evidencePath" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
Write-Host "" -ForegroundColor White
Write-Host "[INFO] Generation complete" -ForegroundColor Cyan
Write-Host "[INFO]   Templates processed : $templatesProcessed" -ForegroundColor Gray
Write-Host "[INFO]   Lines of code       : $totalLOC" -ForegroundColor Gray
Write-Host "[INFO]   Schema fields       : $($layerSchema.fields.Count)" -ForegroundColor Gray
Write-Host "[INFO]   Duration            : $([math]::Round($duration.TotalSeconds, 3))s" -ForegroundColor Gray
Write-Host "[INFO]   Output directory    : $layerOutputDir" -ForegroundColor Gray

exit 0
