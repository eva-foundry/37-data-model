# Generate Screens from Templates - Factory v2 with Schema Generation
# Session 45 Part 6 - Schema-Based Field Generation
# Date: 2026-03-11 00:45 ET

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
    [string]$EvidenceDir = "c:\eva-foundry\37-data-model\evidence"
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date

Write-Host "[INFO] Screens Machine v2 - Generate UI for $LayerId ($LayerName)" -ForegroundColor Cyan
Write-Host "[INFO] Start: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ET"
Write-Host ""

#region Schema Functions

function Get-LayerSchema {
    param(
        [string]$LayerName,
        [string]$EvidenceDir
    )
    
    # Look for sample data file
    $samplePattern = Join-Path $EvidenceDir "L*-$LayerName-sample-*.json"
    $sampleFiles = Get-ChildItem $samplePattern -ErrorAction SilentlyContinue
    
    if ($sampleFiles.Count -eq 0) {
        Write-Host "[WARN] No sample data found for layer '$LayerName'" -ForegroundColor Yellow
        return @()
    }
    
    $samplePath = $sampleFiles[0].FullName
    Write-Host "[INFO] Loading schema from: $(Split-Path $samplePath -Leaf)" -ForegroundColor Yellow
    
    $sample = Get-Content $samplePath -Raw -Encoding UTF8 | ConvertFrom-Json
    $firstRecord = $sample.data[0]
    
    # System fields (exclude from user forms)
    $systemFields = @('obj_id', 'layer', 'row_version', 'created_at', 'created_by', 
                      'modified_at', 'modified_by', 'source_file', 'is_active')
    
    $schema = $firstRecord.PSObject.Properties | Where-Object { 
        $_.Name -notin $systemFields 
    } | ForEach-Object {
        $name = $_.Name
        $value = $_.Value
        
        # Determine JSON type
        $type = if ($null -eq $value) { "string" }
                elseif ($value -is [string]) { "string" }
                elseif ($value -is [int] -or $value -is [double]) { "number" }
                elseif ($value -is [bool]) { "boolean" }
                elseif ($value -is [array]) { "array" }
                else { "string" }
        
        # Map to input type
        $inputType = if ($type -eq "array") { "textarea" }
                     elseif ($type -eq "number") { "number" }
                     elseif ($type -eq "boolean") { "checkbox" }
                     elseif ($name -in @('notes', 'goal', 'description', 'phase')) { "textarea" }
                     else { "text" }
        
        # Generate human-readable label
        $label = ($name -replace '_', ' ').Trim()
        $parts = $label -split ' '
        $label = ($parts | ForEach-Object { 
            $_.Substring(0,1).ToUpper() + $_.Substring(1).ToLower()
        }) -join ' '
        
        # Determine required fields (common patterns)
        $required = $name -in @('id', 'label', 'label_fr', 'category', 'maturity', 
                                'status', 'goal', 'folder', 'name', 'title')
        
        [PSCustomObject]@{
            Name = $name
            Label = $label
            Type = $type
            InputType = $inputType
            Required = $required
        }
    }
    
    Write-Host "[PASS] Extracted schema: $($schema.Count) fields" -ForegroundColor Green
    return $schema
}

function New-FormField {
    param(
        [Parameter(Mandatory=$true)]
        [object]$Field,
        
        [Parameter(Mandatory=$true)]
        [string]$LayerName
    )
    
    $fieldName = $Field.Name
    $fieldLabel = $Field.Label
    $inputType = $Field.InputType
    $required = $Field.Required
    
    $requiredMarker = if ($required) { " *" } else { "" }
    
    # Build input component
    $inputComponent = switch ($inputType) {
        "text" {
            @"
          <input
            type="text"
            id="$fieldName"
            data-testid="$LayerName-field-$fieldName"
            value={(formData.$fieldName as string) || ''}
            onChange={(e) => handleChange('$fieldName', e.target.value)}
            aria-invalid={!!errors.$fieldName}
            aria-describedby={errors.$fieldName ? '$fieldName-error' : undefined}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid `$`{errors.$fieldName ? GC_ERROR : GC_BORDER}`,
              borderRadius: 4,
              fontSize: '0.875rem',
              fontFamily: 'inherit',
            }}
          />
"@
        }
        "number" {
            @"
          <input
            type="number"
            id="$fieldName"
            data-testid="$LayerName-field-$fieldName"
            value={(formData.$fieldName as number) || ''}
            onChange={(e) => handleChange('$fieldName', Number(e.target.value))}
            aria-invalid={!!errors.$fieldName}
            aria-describedby={errors.$fieldName ? '$fieldName-error' : undefined}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid `$`{errors.$fieldName ? GC_ERROR : GC_BORDER}`,
              borderRadius: 4,
              fontSize: '0.875rem',
              fontFamily: 'inherit',
            }}
          />
"@
        }
        "textarea" {
            @"
          <textarea
            id="$fieldName"
            data-testid="$LayerName-field-$fieldName"
            value={(formData.$fieldName as string) || ''}
            onChange={(e) => handleChange('$fieldName', e.target.value)}
            aria-invalid={!!errors.$fieldName}
            aria-describedby={errors.$fieldName ? '$fieldName-error' : undefined}
            disabled={submitting}
            rows={4}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid `$`{errors.$fieldName ? GC_ERROR : GC_BORDER}`,
              borderRadius: 4,
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
"@
        }
        "checkbox" {
            @"
          <input
            type="checkbox"
            id="$fieldName"
            data-testid="$LayerName-field-$fieldName"
            checked={!!formData.$fieldName}
            onChange={(e) => handleChange('$fieldName', e.target.checked)}
            disabled={submitting}
            style={{
              width: 16,
              height: 16,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          />
"@
        }
    }
    
    # Build complete field section
    return @"
        <div>
          <label
            htmlFor="$fieldName"
            style={{
              display: 'block',
              marginBottom: 4,
              fontSize: '0.875rem',
              fontWeight: 600,
              color: GC_TEXT,
            }}
          >
            $fieldLabel$requiredMarker
          </label>
$inputComponent
          {errors.$fieldName && (
            <p
              id="$fieldName-error"
              data-testid="$LayerName-error-$fieldName"
              role="alert"
              style={{
                margin: '4px 0 0',
                fontSize: '0.75rem',
                color: GC_ERROR,
              }}
            >
              {errors.$fieldName}
            </p>
          )}
        </div>
"@
}

function Expand-FormFields {
    param(
        [Parameter(Mandatory=$true)]
        [string]$TemplateContent,
        
        [Parameter(Mandatory=$true)]
        [object[]]$Schema,
        
        [Parameter(Mandatory=$true)]
        [string]$LayerName
    )
    
    # Check if template has {{#FORM_FIELDS}} block
    if ($TemplateContent -notmatch '(?s){{#FORM_FIELDS}}.*?{{/FORM_FIELDS}}') {
        return $TemplateContent
    }
    
    Write-Host "    [*] Expanding {{#FORM_FIELDS}} with $($Schema.Count) fields"
    
    # Generate all field components
    $allFields = $Schema | ForEach-Object {
        New-FormField -Field $_ -LayerName $LayerName
    }
    
    # Build fields section
    $fieldsSection = @"
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
$($allFields -join "`n")
      </div>
"@
    
    # Replace the entire {{#FORM_FIELDS}} ... {{/FORM_FIELDS}} block
    $pattern = '(?s){{#FORM_FIELDS}}.*?{{/FORM_FIELDS}}'
    $expanded = $TemplateContent -replace $pattern, $fieldsSection
    
    Write-Host "    [PASS] Form fields expanded" -ForegroundColor Green
    
    return $expanded
}

function Expand-DetailFields {
    param(
        [Parameter(Mandatory=$true)]
        [string]$TemplateContent,
        
        [Parameter(Mandatory=$true)]
        [object[]]$Schema,
        
        [Parameter(Mandatory=$true)]
        [string]$LayerName
    )
    
    # Check if template has {{#DETAIL_FIELDS}} block
    if ($TemplateContent -notmatch '(?s){{#DETAIL_FIELDS}}.*?{{/DETAIL_FIELDS}}') {
        return $TemplateContent
    }
    
    Write-Host "    [*] Expanding {{#DETAIL_FIELDS}} with $($Schema.Count) fields"
    
    # Generate detail field rows
    $allFields = $Schema | ForEach-Object {
        $fieldName = $_.Name
        $fieldLabel = $_.Label
        
        @"
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, padding: '8px 0' }}>
                  <dt style={{ fontSize: '0.875rem', fontWeight: 600, color: GC_TEXT }}>
                    ${fieldLabel}:
                  </dt>
                  <dd style={{ fontSize: '0.875rem', color: GC_TEXT, margin: 0 }}>
                    {record.${fieldName} !== null && record.${fieldName} !== undefined 
                      ? String(record.${fieldName}) 
                      : '—'}
                  </dd>
                </div>
"@
    }
    
    # Build detail section
    $detailSection = @"
            <dl style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
$($allFields -join "`n")
            </dl>
"@
    
    # Replace the entire {{#DETAIL_FIELDS}} ... {{/DETAIL_FIELDS}} block
    $pattern = '(?s){{#DETAIL_FIELDS}}.*?{{/DETAIL_FIELDS}}'
    $expanded = $TemplateContent -replace $pattern, $detailSection
    
    Write-Host "    [PASS] Detail fields expanded" -ForegroundColor Green
    
    return $expanded
}

function Expand-RequiredFields {
    param(
        [Parameter(Mandatory=$true)]
        [string]$TemplateContent,
        
        [Parameter(Mandatory=$true)]
        [object[]]$Schema
    )
    
    # Check if template has {{#REQUIRED_FIELDS}} block
    if ($TemplateContent -notmatch '(?s){{#REQUIRED_FIELDS}}.*?{{/REQUIRED_FIELDS}}') {
        return $TemplateContent
    }
    
    Write-Host "    [*] Expanding {{#REQUIRED_FIELDS}}"
    
    # Get required fields
    $requiredFields = $Schema | Where-Object { $_.Required }
    
    if ($requiredFields.Count -eq 0) {
        # No required fields, remove the block
        $pattern = '(?s){{#REQUIRED_FIELDS}}.*?{{/REQUIRED_FIELDS}}'
        $expanded = $TemplateContent -replace $pattern, '    // No required fields'
    } else {
        # Generate validation checks
        $validationChecks = $requiredFields | ForEach-Object {
            $fieldName = $_.Name
            @"
    if (!formData.${fieldName}) {
      newErrors.${fieldName} = t.required;
    }
"@
        }
        
        $validationSection = $validationChecks -join "`n"
        
        # Replace the block
        $pattern = '(?s){{#REQUIRED_FIELDS}}.*?{{/REQUIRED_FIELDS}}'
        $expanded = $TemplateContent -replace $pattern, $validationSection
    }
    
    Write-Host "    [PASS] Required fields validation expanded" -ForegroundColor Green
    
    return $expanded
}

function Expand-EditableFields {
    param(
        [Parameter(Mandatory=$true)]
        [string]$TemplateContent,
        
        [Parameter(Mandatory=$true)]
        [object[]]$Schema
    )
    
    # Check if template has {{#EDITABLE_FIELDS}} block
    if ($TemplateContent -notmatch '(?s){{#EDITABLE_FIELDS}}.*?{{/EDITABLE_FIELDS}}') {
        return $TemplateContent
    }
    
    Write-Host "    [*] Expanding {{#EDITABLE_FIELDS}}"
    
    # Generate field initialization / change detection lines
    $fieldLines = $Schema | ForEach-Object {
        $fieldName = $_.Name
        # Determine context from template
        if ($TemplateContent -match 'initial\.{{FIELD_NAME}}') {
            "    initial.${fieldName} = record.${fieldName};"
        } elseif ($TemplateContent -match 'if \(formData\.{{FIELD_NAME}}') {
            "    if (formData.${fieldName} !== record.${fieldName}) return true;"
        } else {
            "    // ${fieldName}"
        }
    }
    
    $fieldsSection = $fieldLines -join "`n"
    
    # Replace the block
    $pattern = '(?s){{#EDITABLE_FIELDS}}.*?{{/EDITABLE_FIELDS}}'
    $expanded = $TemplateContent -replace $pattern, $fieldsSection
    
    Write-Host "    [PASS] Editable fields expanded" -ForegroundColor Green
    
    return $expanded
}

#endregion

#region Main Script

# Load schema from sample data
$schema = Get-LayerSchema -LayerName $LayerName -EvidenceDir $EvidenceDir
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
    "{{GENERATOR}}" = "screens-machine-v2.0.0"
    "{{TEST_COVERAGE}}" = "100"
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
    
    # Expand schema-based sections (before variable substitution)
    if ($schema.Count -gt 0) {
        $content = Expand-FormFields -TemplateContent $content -Schema $schema -LayerName $LayerName
        $content = Expand-DetailFields -TemplateContent $content -Schema $schema -LayerName $LayerName
        $content = Expand-RequiredFields -TemplateContent $content -Schema $schema
        $content = Expand-EditableFields -TemplateContent $content -Schema $schema
    }
    
    # Apply variable substitutions
    foreach ($key in $vars.Keys) {
        $content = $content -replace [regex]::Escape($key), $vars[$key]
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
Write-Host "  Schema fields: $($schema.Count)"
Write-Host "  Files generated: $($filesGenerated.Count)"
Write-Host "  Total LOC: $totalLOC"
Write-Host "  Duration: $($duration.TotalSeconds) seconds"
Write-Host ""

# Generate evidence
$evidence = @{
    operation = "screen_generation_v2"
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    generator = "screens-machine-v2.0.0"
    layer = @{
        id = $LayerId
        name = $LayerName
        title = $LayerTitle
        title_fr = $LayerTitleFr
    }
    schema = @{
        fields_count = $schema.Count
        fields = $schema | ForEach-Object {
            @{
                name = $_.Name
                label = $_.Label
                type = $_.Type
                input_type = $_.InputType
                required = $_.Required
            }
        }
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
        no_placeholders = "PENDING"
    }
    session = "45-part6-schema-generation"
    next_steps = @(
        "npm run type-check"
        "npm run lint"
        "npm test -- --coverage"
        "git add ui/src/"
        "git commit -m 'feat(ui): Add $LayerTitle screens v2 (schema-generated)'"
    )
}

$evidencePath = Join-Path $EvidenceDir "screen-generation-v2-$LayerName-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$evidence | ConvertTo-Json -Depth 10 | Set-Content $evidencePath -Encoding UTF8

Write-Host "[PASS] Evidence saved: $(Split-Path $evidencePath -Leaf)" -ForegroundColor Green
Write-Host ""

# Output for next steps
Write-Host "[NEXT STEPS]" -ForegroundColor Yellow
Write-Host "  1. Verify no placeholders: grep -r '{{' ui/src/components/$LayerName/"
Write-Host "  2. Run quality gates: npm run type-check && npm run lint"
Write-Host "  3. Review generated forms for field accuracy"
Write-Host "  4. Commit generated code"
Write-Host ""

#endregion

exit 0
