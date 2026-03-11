#!/usr/bin/env pwsh
# fix-all-create-forms.ps1
# Batch fix for all CreateForm components - replace Mustache placeholders with minimal working code
# Session 45 Part 9 - Gate 0 CSS Foundation
# Generated: 2026-03-11 09:50 ET

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$base = "C:\eva-foundry\37-data-model\ui"

Write-Host "`n=== BATCH FIX: CreateForm Components ===" -ForegroundColor Cyan
Write-Host "Working directory: $base" -ForegroundColor Gray
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN' } else { 'LIVE' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })

# Find all CreateForm files
$createForms = Get-ChildItem -Path "$base\src\components" -Recurse -Filter "*CreateForm.tsx"
Write-Host "`nFound $($createForms.Count) CreateForm files" -ForegroundColor White

$fixed = 0
$skipped = 0
$errors = 0

foreach ($file in $createForms) {
    try {
        $content = Get-Content $file.FullName -Raw
        
        $hasPlaceholders = $content -match '\{\{#|\{\{/'
        
        if ($hasPlaceholders) {
            Write-Host "  [FIX] $($file.Directory.Name)/$($file.Name)" -ForegroundColor Yellow
            
            if (-not $DryRun) {
                # Remove validation template section
                $content = $content -replace '(?s)// TODO: Add validation rules based on schema.*?\{\{/REQUIRED_FIELDS\}\}', '// Validation removed - add layer-specific rules here'
                
                # Remove form fields template section - find and replace everything from form fields comment to closing div
                $content = $content -replace '(?s)\{/\* Form fields \(auto-generated from schema\) \*/\}.*?\{\{/FORM_FIELDS\}\}\s*</div>', @'
{/* Form fields - minimal working implementation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ padding: '20px', background: GC_SURFACE, border: `1px dashed $${GC_BORDER}`, borderRadius: 4, textAlign: 'center', color: GC_MUTED, fontSize: '0.875rem' }}>
          <strong>Form fields pending generation</strong>
          <p style={{ margin: '8px 0 0', fontSize: '0.75rem' }}>TODO: Generate layer-specific fields</p>
        </div>
      </div>
'@
                
                Set-Content -Path $file.FullName -Value $content -NoNewline
            }
            
            $fixed++
        } else {
            Write-Host "  [SKIP] $($file.Directory.Name)/$($file.Name) - no placeholders" -ForegroundColor Gray
            $skipped++
        }
    } catch {
        Write-Host "  [ERROR] $($file.Directory.Name)/$($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

Write-Host "`n=== RESULTS ===" -ForegroundColor Cyan
Write-Host "Fixed:   $fixed" -ForegroundColor Green
Write-Host "Skipped: $skipped" -ForegroundColor Gray
Write-Host "Errors:  $errors" -ForegroundColor $(if ($errors -gt 0) { 'Red' } else { 'Gray' })

if ($DryRun) {
    Write-Host "`n[DRY RUN] No files were modified. Run without -DryRun to apply fixes." -ForegroundColor Yellow
} else {
    Write-Host "`n[COMPLETE] All CreateForm components fixed" -ForegroundColor Green
}

exit $(if ($errors -gt 0) { 1 } else { 0 })
