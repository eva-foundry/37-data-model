<#
.SYNOPSIS
    Template field expansion for dynamic UI generation

.DESCRIPTION
    Sprint 3 - Dynamic schema-driven form generation
    
    Takes template files with mustache-style placeholders and expands them
    with real field data from the Data Model API schema endpoint.
    
    Replaces:
    - {{FIELD_NAME}} with actual field names
    - {{FIELD_LABEL}} with human-readable labels  
    - {{#FORM_FIELDS}}...{{/FORM_FIELDS}} loops with actual field markup
    - {{#FIELD_TYPE_TEXT}}...{{/FIELD_TYPE_TEXT}} conditionals
    
.EXAMPLE
    $fields = Get-LayerSchema -Layer "projects" -ApiUrl "https://..."
    $expanded = Expand-FormFields -TemplateContent $template -Fields $fields
    
.NOTES
    Author: Screens Machine v2.0.0
    Session: 45
    Date: 2026-03-11
#>

[CmdletBinding()]
param()

# ── Function: Get-LayerSchema ──────────────────────────────────────────────
function Get-LayerSchema {
    <#
    .SYNOPSIS
        Fetch field schema from Data Model API with retries
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Layer,
        
        [Parameter(Mandatory)]
        [string]$ApiUrl,
        
        [int]$MaxRetries = 3,
        
        [int]$TimeoutSeconds = 5
    )
    
    $endpoint = "$ApiUrl/model/$Layer/fields"
    
    for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
        try {
            Write-Verbose "Fetching schema for $Layer (attempt $attempt/$MaxRetries)..."
            
            $response = Invoke-RestMethod -Uri $endpoint -Method Get -TimeoutSec $TimeoutSeconds
            
            if ($response.fields) {
                Write-Verbose "Schema fetched: $($response.fields.Count) fields"
                return $response.fields
            }
            else {
                Write-Warning "Schema response missing 'fields' property for $Layer"
                return $null
            }
        }
        catch {
            $errorMsg = $_.Exception.Message
            
            if ($attempt -eq $MaxRetries) {
                Write-Warning "Schema fetch failed for $Layer after $MaxRetries retries: $errorMsg"
                return $null
            }
            
            # Exponential backoff
            $backoffSeconds = [math]::Pow(2, $attempt)
            Write-Verbose "Retry $attempt failed: $errorMsg. Retrying in $backoffSeconds seconds..."
            Start-Sleep -Seconds $backoffSeconds
        }
    }
    
    return $null
}

# ── Function: Get-FieldLabel ──────────────────────────────────────────────
function Get-FieldLabel {
    <#
    .SYNOPSIS
        Convert field_name to human-readable label (PascalCase with spaces)
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FieldName
    )
    
    # Special cases
    $specialLabels = @{
        'id' = 'ID'
        'wbs_id' = 'WBS ID'
        'ado_epic_id' = 'ADO Epic ID'
        'ado_project' = 'ADO Project'
        'pbi_total' = 'PBI Total'
        'pbi_done' = 'PBI Done'
        'slo' = 'SLO'
        'sli' = 'SLI'
        'url' = 'URL'
        'api' = 'API'
        'env_vars' = 'Environment Variables'
    }
    
    if ($specialLabels.ContainsKey($FieldName)) {
        return $specialLabels[$FieldName]
    }
    
    # Convert snake_case to Title Case with spaces
    $words = $FieldName -split '_'
    $titleCased = $words | ForEach-Object {
        (Get-Culture).TextInfo.ToTitleCase($_.ToLower())
    }
    
    return $titleCased -join ' '
}

# ── Function: Get-FieldInputType ──────────────────────────────────────────
function Get-FieldInputType {
    <#
    .SYNOPSIS
        Determine HTML input type from field_type
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FieldType,
        
        [Parameter(Mandatory)]
        [string]$FieldName
    )
    
    switch ($FieldType) {
        'string' {
            # Long text fields get textarea
            if ($FieldName -in @('goal', 'notes', 'description', 'summary', 'details', 'content', 'message', 'text')) {
                return 'textarea'
            }
            return 'text'
        }
        'number' { return 'number' }
        'boolean' { return 'checkbox' }
        'date' { return 'datetime-local' }
        'reference' { return 'text' }  # FK fields are text inputs for now
        'array' { return 'textarea' }  # JSON arrays as multiline for now
        'object' { return 'textarea' }  # JSON objects as multiline for now
        default { return 'text' }
    }
}

# ── Function: Build-FieldMarkup ──────────────────────────────────────────
function Build-FieldMarkup {
    <#
    .SYNOPSIS
        Generate React markup for a single field
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [PSCustomObject]$Field,
        
        [string]$ComponentName = "projects",
        
        [switch]$IsEditForm
    )
    
    $fieldName = $Field.field_name
    $fieldLabel = Get-FieldLabel -FieldName $fieldName
    $fieldType = $Field.field_type
    $required = if ($Field.required) { ' *' } else { '' }
    $inputType = Get-FieldInputType -FieldType $fieldType -FieldName $fieldName
    
    # Skip system fields (not user-editable)
    $systemFields = @('id', 'layer', 'created_at', 'created_by', 'modified_at', 'modified_by', 'row_version', 'source_file')
    if ($fieldName -in $systemFields) {
        return $null
    }
    
    # Build markup based on input type
    $markup = @"
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
            $fieldLabel$required
          </label>
"@
    
    if ($inputType -eq 'textarea') {
        $markup += @"

          <textarea
            id="$fieldName"
            data-testid="$ComponentName-field-$fieldName"
            value={(formData.$fieldName as string) || ''}
            onChange={(e) => handleChange('$fieldName', e.target.value)}
            aria-invalid={!!errors.$fieldName}
            aria-describedby={errors.$fieldName ? '$fieldName-error' : undefined}
            disabled={submitting}
            rows={4}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: ``1px solid `${errors.$fieldName ? GC_ERROR : GC_BORDER}``,
              borderRadius: 4,
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
"@
    }
    elseif ($inputType -eq 'checkbox') {
        $markup += @"

          <input
            type="checkbox"
            id="$fieldName"
            data-testid="$ComponentName-field-$fieldName"
            checked={(formData.$fieldName as boolean) || false}
            onChange={(e) => handleChange('$fieldName', e.target.checked)}
            aria-invalid={!!errors.$fieldName}
            aria-describedby={errors.$fieldName ? '$fieldName-error' : undefined}
            disabled={submitting}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
            }}
          />
"@
    }
    else {
        # text, number, datetime-local
        $typeAttr = if ($inputType -ne 'text') { "type=`"$inputType`"" } else { 'type="text"' }
        $valueType = if ($inputType -eq 'number') { 'number' } else { 'string' }
        $valueCast = if ($inputType -eq 'number') { 'Number(e.target.value)' } else { 'e.target.value' }
        
        $markup += @"

          <input
            $typeAttr
            id="$fieldName"
            data-testid="$ComponentName-field-$fieldName"
            value={(formData.$fieldName as $valueType) || $(if ($inputType -eq 'number') { '0' } else { "''" })}
            onChange={(e) => handleChange('$fieldName', $valueCast)}
            aria-invalid={!!errors.$fieldName}
            aria-describedby={errors.$fieldName ? '$fieldName-error' : undefined}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: ``1px solid `${errors.$fieldName ? GC_ERROR : GC_BORDER}``,
              borderRadius: 4,
              fontSize: '0.875rem',
              fontFamily: 'inherit',
            }}
          />
"@
    }
    
    # Error message
    $markup += @"

          {errors.$fieldName && (
            <div
              id="$fieldName-error"
              role="alert"
              data-testid="$ComponentName-field-$fieldName-error"
              style={{
                marginTop: 4,
                fontSize: '0.75rem',
                color: GC_ERROR,
              }}
            >
              {errors.$fieldName}
            </div>
          )}
        </div>
"@
    
    return $markup
}

# ── Function: Expand-FormFields ──────────────────────────────────────────
function Expand-FormFields {
    <#
    .SYNOPSIS
        Expand {{#FORM_FIELDS}} loop in CreateForm/EditForm templates
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$TemplateContent,
        
        [Parameter(Mandatory)]
        [array]$Fields,
        
        [string]$ComponentName = "projects"
    )
    
    # Build field markup
    $fieldMarkups = @()
    foreach ($field in $Fields) {
        $markup = Build-FieldMarkup -Field $field -ComponentName $ComponentName
        if ($markup) {
            $fieldMarkups += $markup
        }
    }
    
    $allFieldsMarkup = $fieldMarkups -join "`n`n"
    
    # Replace {{#FORM_FIELDS}}...{{/FORM_FIELDS}} with actual markup
    $pattern = '(?s){{#FORM_FIELDS}}.*?{{/FORM_FIELDS}}'
    $TemplateContent = $TemplateContent -replace $pattern, $allFieldsMarkup
    
    return $TemplateContent
}

# ── Function: Expand-ValidationRules ──────────────────────────────────────
function Expand-ValidationRules {
    <#
    .SYNOPSIS
        Expand {{#REQUIRED_FIELDS}} loop in validation logic
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$TemplateContent,
        
        [Parameter(Mandatory)]
        [array]$Fields
    )
    
    # Get required fields (excluding system fields)
    $requiredFields = $Fields | Where-Object {
        $_.required -and $_.field_name -notin @('id', 'layer', 'created_at', 'created_by', 'modified_at', 'modified_by', 'row_version', 'source_file')
    }
    
    $validationMarkup = @()
    foreach ($field in $requiredFields) {
        $fieldName = $field.field_name
        $validationMarkup += @"
    if (!formData.$fieldName) {
      newErrors.$fieldName = t('errors.required');
    }
"@
    }
    
    $allValidationMarkup = $validationMarkup -join "`n"
    
    # Replace {{#REQUIRED_FIELDS}}...{{/REQUIRED_FIELDS}}
    $pattern = '(?s){{#REQUIRED_FIELDS}}.*?{{/REQUIRED_FIELDS}}'
    $TemplateContent = $TemplateContent -replace $pattern, $allValidationMarkup
    
    return $TemplateContent
}

# ── Function: Expand-DetailFields ──────────────────────────────────────────
function Expand-DetailFields {
    <#
    .SYNOPSIS
        Expand {{#DETAIL_FIELDS}} loop in DetailDrawer templates
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$TemplateContent,
        
        [Parameter(Mandatory)]
        [array]$Fields
    )
    
    # Build detail field markup (read-only display)
    $detailMarkups = @()
    foreach ($field in $Fields) {
        $fieldName = $field.field_name
        $fieldLabel = Get-FieldLabel -FieldName $fieldName
        
        # Skip ID (already shown in header)
        if ($fieldName -eq 'id') {
            continue
        }
        
        $detailMarkups += @"
          <dl>
            <dt style={{ fontSize: '0.75rem', fontWeight: 600, color: GC_MUTED, marginBottom: 4 }}>
              $fieldLabel
            </dt>
            <dd style={{ margin: 0, color: GC_TEXT, wordBreak: 'break-word' }}>
              {String(record.$fieldName ?? 'N/A')}
            </dd>
          </dl>
"@
    }
    
    $allDetailsMarkup = $detailMarkups -join "`n`n"
    
    # Replace {{#DETAIL_FIELDS}}...{{/DETAIL_FIELDS}}
    $pattern = '(?s){{#DETAIL_FIELDS}}.*?{{/DETAIL_FIELDS}}'
    $TemplateContent = $TemplateContent -replace $pattern, $allDetailsMarkup
    
    return $TemplateContent
}

# ── Function: Expand-AllTemplateFields ──────────────────────────────────────
function Expand-AllTemplateFields {
    <#
    .SYNOPSIS
        Master function: Expand all template placeholders
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$TemplateContent,
        
        [Parameter(Mandatory)]
        [array]$Fields,
        
        [string]$ComponentName = "projects"
    )
    
    Write-Verbose "Expanding template for $ComponentName with $($Fields.Count) fields..."
    
    # Expand loops
    $TemplateContent = Expand-FormFields -TemplateContent $TemplateContent -Fields $Fields -ComponentName $ComponentName
    $TemplateContent = Expand-ValidationRules -TemplateContent $TemplateContent -Fields $Fields
    $TemplateContent = Expand-DetailFields -TemplateContent $TemplateContent -Fields $Fields
    
    Write-Verbose "Template expansion complete"
    
    return $TemplateContent
}

# Note: Functions are available when dot-sourced (.)
