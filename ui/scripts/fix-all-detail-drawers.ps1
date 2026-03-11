#!/usr/bin/env pwsh
# fix-all-detail-drawers.ps1
# Batch fix for all DetailDrawer components - replace Mustache placeholders with working React code
# Session 45 Part 9 - Gate 0 CSS Foundation
# Generated: 2026-03-11 09:40 ET

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$base = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

# Define the template placeholder to find
$oldPattern = @"
          {{#DETAIL_FIELDS}}
          {{/DETAIL_FIELDS}}
"@

# Define the working React code to replace with
$newPattern = @"
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px 16px', fontSize: '0.875rem' }}>
            {Object.entries(record)
              .filter(([key]) => !['layer', 'partition_key', '_attachments', '_etag', '_rid', '_self', '_ts', 'id'].includes(key))
              .map(([key, value]) => {
                // Format field name: snake_case -> Title Case
                const label = key
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');

                // Format value by type
                let displayValue: string;
                if (value === null || value === undefined) {
                  displayValue = '—';
                } else if (typeof value === 'boolean') {
                  displayValue = value ? 'Yes' : 'No';
                } else if (Array.isArray(value)) {
                  displayValue = value.length === 0 ? '(none)' : value.join(', ');
                } else if (typeof value === 'object') {
                  displayValue = JSON.stringify(value, null, 2);
                } else {
                  displayValue = String(value);
                }

                return (
                  <React.Fragment key={key}>
                    <dt style={{ color: GC_MUTED, fontWeight: 600 }}>{label}:</dt>
                    <dd style={{ margin: 0, color: GC_TEXT, wordBreak: 'break-word' }}>
                      {displayValue}
                    </dd>
                  </React.Fragment>
                );
              })}
          </dl>
"@

Write-Host "`n=== BATCH FIX: DetailDrawer Components ===" -ForegroundColor Cyan
Write-Host "Working directory: $base" -ForegroundColor Gray
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN' } else { 'LIVE' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })

# Find all DetailDrawer files
$detailDrawers = Get-ChildItem -Path "$base/src\components" -Recurse -Filter "*DetailDrawer.tsx"
Write-Host "`nFound $($detailDrawers.Count) DetailDrawer files" -ForegroundColor White

$fixed = 0
$skipped = 0
$errors = 0

foreach ($file in $detailDrawers) {
    try {
        $content = Get-Content $file.FullName -Raw
        
        if ($content -match [regex]::Escape($oldPattern)) {
            Write-Host "  [FIX] $($file.Directory.Name)/$($file.Name)" -ForegroundColor Yellow
            
            if (-not $DryRun) {
                $newContent = $content -replace [regex]::Escape($oldPattern), $newPattern
                Set-Content -Path $file.FullName -Value $newContent -NoNewline
            }
            
            $fixed++
        } else {
            Write-Host "  [SKIP] $($file.Directory.Name)/$($file.Name) - no placeholders found" -ForegroundColor Gray
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
    Write-Host "`n[COMPLETE] All DetailDrawer components fixed" -ForegroundColor Green
}

exit $(if ($errors -gt 0) { 1 } else { 0 })
