# Field Generation Design - Schema-Based Forms

**Date**: March 11, 2026 00:45 AM ET  
**Session**: 45 Part 6 - Schema Generation Implementation  
**Status**: PLAN Phase

---

## Problem Statement

Current templates have un-substituted field placeholders:
- `{{FIELD_NAME}}`, `{{FIELD_LABEL}}` - Field-specific variables
- `{{#FIELD_TYPE_TEXT}}`, `{{#FIELD_TYPE_NUMBER}}` - Type conditionals
- `{{#FORM_FIELDS}}...{{/FORM_FIELDS}}` - Loop markers

**PowerShell `-replace` limitation**: Cannot handle nested loops/conditionals (Mustache syntax).

---

## Solution Design

### Approach: PowerShell Native Field Generation

**No external dependencies** - Pure PowerShell loops replacing Mustache patterns.

### Architecture

```
Sample JSON → Extract Schema → PowerShell Loop → Generate Fields → Replace {{#FORM_FIELDS}} → Output
```

### Field Schema Structure

```powershell
@{
    name = "id"
    label = "Project ID"
    type = "string"
    inputType = "text"
    required = $true
    readonly = $false
    validation = "required,max:50"
}
```

### Field Type Mapping

| JSON Type | Input Type | React Component | Notes |
|-----------|------------|-----------------|-------|
| `string` (short) | `text` | `<input type="text">` | Default for strings |
| `string` (long) | `textarea` | `<textarea>` | If field is `notes`, `description`, `goal` |
| `number` | `number` | `<input type="number">` | For integers, doubles |
| `boolean` | `checkbox` | `<input type="checkbox">` | For true/false |
| `array` | `textarea` | `<textarea>` | JSON array, comma-separated |
| `object` | `hidden` | Not rendered | Skip complex objects |

### System Fields (Read-Only)

These fields should NOT be in CreateForm, should be read-only in EditForm:
- `obj_id`, `layer`, `row_version`
- `created_at`, `created_by`
- `modified_at`, `modified_by`
- `source_file`, `is_active`

### User-Editable Fields (L25 Projects Example)

| Field | Label | Type | Input | Required | Notes |
|-------|-------|------|-------|----------|-------|
| `id` | Project ID | string | text | Yes | Primary key |
| `label` | Project Name | string | text | Yes | Display name (EN) |
| `label_fr` | Project Name (FR) | string | text | Yes | Display name (FR) |
| `folder` | Folder | string | text | Yes | Workspace folder |
| `category` | Category | string | text | Yes | Platform, AI, etc. |
| `maturity` | Maturity | string | select | Yes | active, poc, planned |
| `phase` | Phase | string | text | No | Current phase |
| `goal` | Goal | string | textarea | Yes | Project objective |
| `status` | Status | string | select | Yes | active, blocked, complete |
| `pbi_total` | PBI Total | number | number | No | Total backlog items |
| `pbi_done` | PBI Done | number | number | No | Completed items |
| `depends_on` | Dependencies | array | textarea | No | JSON array of project IDs |
| `blocked_by` | Blocked By | array | textarea | No | JSON array of project IDs |
| `services` | Services | array | textarea | No | JSON array of service names |
| `ado_epic_id` | ADO Epic ID | number | number | No | Azure DevOps epic |
| `ado_project` | ADO Project | string | text | No | Azure DevOps project |
| `github_repo` | GitHub Repo | string | text | No | Repository name |
| `wbs_id` | WBS ID | string | text | No | Work breakdown structure |
| `sprint_context` | Sprint Context | string | text | No | Current sprint |
| `notes` | Notes | string | textarea | No | Additional notes |

---

## Implementation Strategy

### Phase 1: Extract Schema from Sample JSON

```powershell
function Get-LayerSchema {
    param([string]$LayerName, [string]$SamplePath)
    
    $sample = Get-Content $SamplePath -Raw | ConvertFrom-Json
    $firstRecord = $sample.data[0]
    
    $systemFields = @('obj_id', 'layer', 'row_version', 'created_at', 'created_by', 
                      'modified_at', 'modified_by', 'source_file', 'is_active')
    
    $schema = $firstRecord.PSObject.Properties | Where-Object { 
        $_.Name -notin $systemFields 
    } | ForEach-Object {
        $name = $_.Name
        $value = $_.Value
        
        # Determine type
        $type = if ($null -eq $value) { "string" }
                elseif ($value -is [string]) { "string" }
                elseif ($value -is [int] -or $value -is [double]) { "number" }
                elseif ($value -is [bool]) { "boolean" }
                elseif ($value -is [array]) { "array" }
                else { "string" }
        
        # Determine input type
        $inputType = if ($type -eq "array") { "textarea" }
                     elseif ($type -eq "number") { "number" }
                     elseif ($name -in @('notes', 'goal', 'description')) { "textarea" }
                     else { "text" }
        
        # Generate label from field name
        $label = ($name -replace '_', ' ' -replace '([a-z])([A-Z])', '$1 $2').Trim()
        $label = (Get-Culture).TextInfo.ToTitleCase($label)
        
        # Required fields
        $required = $name -in @('id', 'label', 'label_fr', 'category', 'maturity', 'status', 'goal', 'folder')
        
        [PSCustomObject]@{
            name = $name
            label = $label
            type = $type
            inputType = $inputType
            required = $required
        }
    }
    
    return $schema
}
```

### Phase 2: Generate Field HTML/TSX

```powershell
function New-FormField {
    param(
        [object]$Field,
        [string]$LayerName
    )
    
    $fieldName = $Field.name
    $fieldLabel = $Field.label
    $inputType = $Field.inputType
    $required = $Field.required
    
    $requiredMarker = if ($required) { " *" } else { "" }
    
    # Build input element based on type
    $inputElement = switch ($inputType) {
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
              border: `1px solid ${'${errors.' + $fieldName + ' ? GC_ERROR : GC_BORDER}'}`,
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
              border: `1px solid ${'${errors.' + $fieldName + ' ? GC_ERROR : GC_BORDER}'}`,
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
              border: `1px solid ${'${errors.' + $fieldName + ' ? GC_ERROR : GC_BORDER}'}`,
              borderRadius: 4,
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
"@
        }
    }
    
    # Build complete field block
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
$inputElement
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
```

### Phase 3: Replace {{#FORM_FIELDS}} Block

```powershell
function Expand-FormFields {
    param(
        [string]$TemplateContent,
        [object[]]$Schema,
        [string]$LayerName
    )
    
    # Find the {{#FORM_FIELDS}} ... {{/FORM_FIELDS}} block
    $pattern = '(?s){{#FORM_FIELDS}}.*?{{/FORM_FIELDS}}'
    
    # Generate all fields
    $allFields = $Schema | ForEach-Object {
        New-FormField -Field $_ -LayerName $LayerName
    }
    
    $fieldsSection = @"
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
$($allFields -join "`n")
      </div>
"@
    
    # Replace the entire block
    $expanded = $TemplateContent -replace $pattern, $fieldsSection
    
    return $expanded
}
```

### Phase 4: Integration into generate-screens.ps1

Add after variable definitions:

```powershell
# Load schema from sample data
$samplePath = "evidence/L$LayerId-$LayerName-sample-*.json"
if (Test-Path $samplePath) {
    $schema = Get-LayerSchema -LayerName $LayerName -SamplePath $samplePath
    Write-Host "[INFO] Loaded schema: $($schema.Count) fields" -ForegroundColor Green
} else {
    Write-Host "[WARN] No sample data found, using empty schema" -ForegroundColor Yellow
    $schema = @()
}

# Process each template
foreach ($tmpl in $templates) {
    # ... existing code ...
    
    # Expand form fields if template has {{#FORM_FIELDS}}
    if ($content -match '{{#FORM_FIELDS}}') {
        $content = Expand-FormFields -TemplateContent $content -Schema $schema -LayerName $LayerName
    }
    
    # ... rest of processing ...
}
```

---

## Testing Strategy

### Test 1: Regenerate L25 (projects)
```powershell
.\scripts\generate-screens.ps1 -LayerId "L25" -LayerName "projects" -LayerTitle "Projects" -LayerTitleFr "Projets"
```
**Expected**: No `{{FIELD_NAME}}` placeholders in CreateForm, EditForm, DetailDrawer

### Test 2: Validate Field Count
```powershell
$generated = Get-Content "ui\src\components\projects\ProjectsCreateForm.tsx" -Raw
$fieldCount = ([regex]::Matches($generated, 'id="(\w+)"')).Count
# Expected: ~20 fields (user-editable only, no system fields)
```

### Test 3: TypeScript Compilation
```powershell
cd ui
npm run type-check
# Expected: 0 errors
```

---

## Success Criteria

- ✅ No `{{FIELD_NAME}}` placeholders in generated code
- ✅ All user-editable fields present (no system fields)
- ✅ Field types match schema (text inputs for strings, number inputs for numbers)
- ✅ Required fields have asterisk (*)
- ✅ Error messages work ({{FIELD_NAME}}-error IDs)
- ✅ TypeScript compiles without errors
- ✅ Forms are functional (can type, validate, submit)

---

## Next Steps (After Implementation)

1. Generate L26 (WBS) to validate pattern consistency
2. Generate L27 (sprints) to validate across multiple layers
3. Create GitHub workflow for autonomous generation
4. Document field generation patterns for future layers

---

**Status**: ✅ PLAN Complete - Ready for DO phase  
**Next**: Implement field generation functions in generate-screens.ps1
