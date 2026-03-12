# Sprint 3 Plan: Dynamic Schema-Driven UI Generation

**Date**: March 11, 2026 @ 09:17 AM ET  
**Session**: 45 (continued)  
**Goal**: Replace template placeholders with real field data from schema endpoint  
**ROI Target**: 6,342× speedup (74 hours → 42 seconds)

---

## Current State (Sprint 2 Output)

**What We Have**:
- ✅ 666 template files with mustache variables
- ✅ Schema extraction endpoint at `/model/{layer}/fields` (already complete!)
- ✅ PowerShell orchestration script (generate-all-screens.ps1)

**What's Missing**:
- ❌ Template substitution logic (replace `{{FIELD_NAME}}` with real data)
- ❌ Field loop expansion (replace `{{#FORM_FIELDS}}...{{/FORM_FIELDS}}` with actual fields)
- ❌ Valid TypeScript files that compile

---

## Sprint 3 Scope

### Issue #62: Schema Extraction Endpoint (Backend)
**Status**: ✅ **ALREADY COMPLETE**  
**Endpoint**: GET `/model/{layer}/fields`  
**Returns**:
```json
{
  "layer": "projects",
  "sample_count": 56,
  "fields": [
    {
      "field_name": "id",
      "field_type": "string",
      "required": true,
      "example_value": "07-foundation-layer"
    },
    {
      "field_name": "goal",
      "field_type": "string",
      "required": true,
      "example_value": "Build the machine..."
    }
    // ... 26 more fields
  ]
}
```

**Field Types Supported**:
- `string` - text fields
- `number` - integers/floats
- `boolean` - true/false
- `date` - ISO timestamps
- `reference` - foreign keys (ends with _id)
- `array` - lists
- `object` - nested structures

**No Work Needed**: Endpoint operational, tested on projects layer (28 fields returned).

---

### Issue #2: Dynamic Form Templates (Frontend)
**Status**: ⏳ **TO DO**  
**Effort**: 2-3 hours  
**Owner**: This session  

**Problem**: Generated components have template placeholders:
```typescript
// ProjectCreateForm.tsx line 173-199 (BEFORE)
{{#FORM_FIELDS}}
<div>
  <label htmlFor="edit-{{FIELD_NAME}}">
    {{FIELD_LABEL}}{{#REQUIRED}} *{{/REQUIRED}}
  </label>
  {{#FIELD_TYPE_TEXT}}
  <input
    id="edit-{{FIELD_NAME}}"
    value={(formData.{{FIELD_NAME}} as string) || ''}
    onChange={(e) => handleChange('{{FIELD_NAME}}', e.target.value)}
  />
  {{/FIELD_TYPE_TEXT}}
</div>
{{/FORM_FIELDS}}
```

**Solution**: PowerShell expands loops and substitutes variables:
```typescript
// ProjectCreateForm.tsx (AFTER - real TypeScript)
<div>
  <label htmlFor="edit-goal">
    Goal *
  </label>
  <input
    id="edit-goal"
    value={(formData.goal as string) || ''}
    onChange={(e) => handleChange('goal', e.target.value)}
  />
</div>

<div>
  <label htmlFor="edit-status">
    Status *
  </label>
  <input
    id="edit-status"
    value={(formData.status as string) || ''}
    onChange={(e) => handleChange('status', e.target.value)}
  />
</div>

// ... 26 more fields
```

**Template Variables to Replace**:
1. `{{FIELD_NAME}}` → actual field name (goal, status, etc.)
2. `{{FIELD_LABEL}}` → capitalized label (Goal, Status, etc.)
3. `{{FIELD_TYPE}}` → actual type (string, number, boolean, date)
4. `{{#FORM_FIELDS}}...{{/FORM_FIELDS}}` → loop over all fields
5. `{{#DETAIL_FIELDS}}...{{/DETAIL_FIELDS}}` → loop for read-only fields
6. `{{#EDITABLE_FIELDS}}...{{/EDITABLE_FIELDS}}` → loop for editable fields
7. `{{#REQUIRED}}...{{/REQUIRED}}` → conditional for required fields
8. `{{#FIELD_TYPE_TEXT}}...{{/FIELD_TYPE_TEXT}}` → conditional for string fields
9. `{{#FIELD_TYPE_NUMBER}}...{{/FIELD_TYPE_NUMBER}}` → conditional for number fields
10. `{{#FIELD_TYPE_BOOLEAN}}...{{/FIELD_TYPE_BOOLEAN}}` → conditional for boolean fields

**File Locations**:
- `ui/src/components/{layer}/{Layer}CreateForm.tsx`
- `ui/src/components/{layer}/{Layer}EditForm.tsx`
- `ui/src/components/{layer}/{Layer}DetailDrawer.tsx`

**Work**:
1. Create PowerShell function `Expand-FieldLoops`
2. Parse schema JSON into field data structures
3. Replace loops with actual field markup
4. Replace variables with field values
5. Write valid TypeScript to final location

---

### Issue #63: Orchestration Integration (PowerShell)
**Status**: ⏳ **TO DO**  
**Effort**: 1-2 hours  
**Owner**: This session  

**Problem**: `generate-all-screens.ps1` doesn't fetch schema before generation.

**Solution**: Enhance orchestration to:
1. Fetch schema from API before generating each layer
2. Parse schema JSON into PowerShell objects
3. Pass schema to template expansion functions
4. Handle API timeouts gracefully (3 retries + exponential backoff)
5. Graceful degradation if API unavailable (skip layer, log warning)

**Pseudo-code**:
```powershell
# Fetch schema with retries
function Get-LayerSchema {
    param([string]$Layer, [string]$ApiUrl)
    
    for ($i = 1; $i -le 3; $i++) {
        try {
            $response = Invoke-RestMethod -Uri "$ApiUrl/model/$Layer/fields" -TimeoutSec 5
            return $response.fields
        }
        catch {
            if ($i -eq 3) {
                Write-Warning "Schema fetch failed for $Layer after 3 retries. Skipping."
                return $null
            }
            $backoff = [math]::Pow(2, $i)
            Start-Sleep -Seconds $backoff
        }
    }
}

# Expand field loops in template
function Expand-FieldLoops {
    param([string]$TemplateContent, [array]$Fields)
    
    # Build form fields HTML
    $formFieldsHtml = $Fields | Where-Object { $_.field_name -notin @('id', 'layer', 'created_at', 'created_by', 'modified_at', 'modified_by', 'row_version', 'source_file') } | ForEach-Object {
        $fieldName = $_.field_name
        $fieldLabel = (Get-Culture).TextInfo.ToTitleCase($fieldName.Replace('_', ' ')).Replace(' ', '')  # PascalCase
        $required = if ($_.required) { ' *' } else { '' }
        
        if ($_.field_type -eq 'string') {
            @"
<div>
  <label htmlFor="edit-$fieldName">
    $fieldLabel$required
  </label>
  <input
    id="edit-$fieldName"
    value={(formData.$fieldName as string) || ''}
    onChange={(e) => handleChange('$fieldName', e.target.value)}
  />
</div>
"@
        }
        elseif ($_.field_type -eq 'number') {
            @"
<div>
  <label htmlFor="edit-$fieldName">
    $fieldLabel$required
  </label>
  <input
    type="number"
    id="edit-$fieldName"
    value={(formData.$fieldName as number) || 0}
    onChange={(e) => handleChange('$fieldName', parseFloat(e.target.value))}
  />
</div>
"@
        }
        # ... other field types
    }
    
    # Replace template loops
    $TemplateContent = $TemplateContent -replace '{{#FORM_FIELDS}}.*?{{/FORM_FIELDS}}', ($formFieldsHtml -join "`n")
    
    return $TemplateContent
}

# Main orchestration
$schema = Get-LayerSchema -Layer $layerName -ApiUrl $ApiBaseUrl
if ($schema) {
    $expandedContent = Expand-FieldLoops -TemplateContent $templateContent -Fields $schema
    Set-Content -Path $outputFile -Value $expandedContent
}
else {
    Write-Warning "Skipping $layerName (schema unavailable)"
}
```

**Integration Points**:
- Modify `generate-all-screens.ps1` lines 80-120 (batch loop)
- Add schema fetch before each layer generation
- Pass schema to template expansion
- Update evidence to include schema metadata

---

## Dependency Graph

```
Issue #62 (Schema Endpoint)
    ✅ DONE (already exists, tested)
    ↓
Issue #2 (Dynamic Templates) + Issue #63 (Orchestration)
    ⏳ Can work in parallel (templates are static PowerShell functions)
    ⏳ Integration required: Issue #63 calls functions from Issue #2
    ↓
L3 Integration Test
    ⏳ Generate 10 layers end-to-end with schema
    ↓
L3 Validation
    ⏳ TypeScript compiles, no template placeholders remain
    ↓
L4 Production Run
    ⏳ Generate all 111 layers with real schema
```

---

## Success Criteria

### L2 CHECK (Per-Issue Validation)
- **Issue #2**: PowerShell functions expand loops correctly (unit test on 1 field)
- **Issue #63**: Schema fetch works with retries (integration test on projects layer)

### L3 CHECK (Integration Validation)
- ✅ Generate 10 diverse layers (L25-L34) with real schema
- ✅ All TypeScript files compile without errors
- ✅ No template placeholders (`{{...}}`) remain in generated files
- ✅ Forms render in browser (test 3 layers: projects, wbs, sprints)
- ✅ Vitest tests pass for generated components

### L4 CHECK (Production Validation)
- ✅ Generate all 111 layers in < 2 minutes
- ✅ All 666 files have valid TypeScript (no compilation errors)
- ✅ Dev server starts without errors (`npm run dev`)
- ✅ Can navigate to 5+ layer screens in browser
- ✅ Evidence files include schema metadata

---

## ROI Calculation

**Manual Form Development**:
- 222 forms (111 CreateForm + 111 EditForm)
- Average fields per form: 15-25 fields
- Time per field: 2 minutes (label + input + validation + styling)
- Total: 222 forms × 20 fields × 2 min = **8,880 minutes = 148 hours**

**With Static Templates** (Sprint 2):
- Time: 71 seconds (but not runnable, needs schema)
- Forms are incomplete (placeholders, not fields)

**With Dynamic Templates** (Sprint 3 Target):
- Schema fetch: 111 layers × 0.2s = 22 seconds
- Template expansion: 111 layers × 0.2s = 22 seconds
- Total: **44 seconds** (vs. 148 hours manual)

**Speed Improvement**: 148 hours → 44 seconds = **12,109× faster**  
**Time Saved**: 147.99 hours = **18.5 work days**  
**Cost Saved** (@ $150/hr): $22,198

**Note**: This is in addition to Sprint 2 savings ($41,625), bringing total savings to **$63,823**.

---

## Risk Mitigation

### Risk 1: Schema Fetch Timeout
**Probability**: Medium (Cosmos cold starts can be slow)  
**Impact**: High (blocks generation for that layer)  
**Mitigation**: 
- 3 retries with exponential backoff
- Graceful degradation (skip layer, continue batch)
- Evidence logs schema_fetch_failed for troubleshooting

### Risk 2: Complex Field Types (arrays, objects, references)
**Probability**: High (28% of fields are non-string types)  
**Impact**: Medium (forms render but may lack UX polish)  
**Mitigation**:
- Start with string/number/boolean (40 minutes work)
- Add date picker UI (15 minutes)
- Add array/object/reference handling in Sprint 4 (future work)

### Risk 3: PowerShell Regex Escaping
**Probability**: Medium (field names with special chars like `$`)  
**Impact**: Low (breaks 1-2 layers, not entire batch)  
**Mitigation**:
- Use `-replace` with literal strings (not regex) where possible
- Test on edge cases: `project_id`, `$schema`, `__meta__`

---

## Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| L1 DISCOVER | ✅ 17 min | 17 min |
| L1 PLAN | 🔄 10 min | 27 min |
| L2 Issue #2 (Templates) | ⏳ 40 min | 67 min |
| L2 Issue #63 (Orchestration) | ⏳ 30 min | 97 min |
| L3 Integration Test (10 layers) | ⏳ 10 min | 107 min |
| L3 Full Regeneration (111 layers) | ⏳ 2 min | 109 min |
| L3 Validation (TypeScript compile) | ⏳ 5 min | 114 min |
| L4 Browser Test (3 layers) | ⏳ 10 min | 124 min |
| L4 Documentation | ⏳ 20 min | 144 min |
| L5 Celebration | ⏳ 5 min | 149 min |

**Total Estimated Time**: 2.5 hours (vs. 148 hours manual = 59× time savings on implementation itself)

---

## Next Actions

1. ✅ Complete L1 PLAN (this document)
2. ⏳ Start L2: Implement Issue #2 (Dynamic Templates PowerShell functions)
3. ⏳ Continue L2: Implement Issue #63 (Orchestration integration)
4. ⏳ L3 Integration: Generate 10 test layers with real schema
5. ⏳ L3 Validate: TypeScript compile, Vite dev server, browser test
6. ⏳ L4 Production: Generate 111 layers, create case study
7. ⏳ L5 Celebrate: Working UI demo with real data

---

**Plan Created**: March 11, 2026 @ 09:30 AM ET  
**Ready to Execute**: Yes (backend complete, frontend/orchestration planned)  
**Blocking Issues**: None
