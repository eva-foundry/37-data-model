# Fix All marco-eva-data-model URLs to msub-eva-data-model
# Updates all documentation files with new production endpoint

$oldUrl = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$newUrl = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  FIXING ALL MARCO URLs → MSUB URLs                           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Old URL: $oldUrl" -ForegroundColor Red
Write-Host "New URL: $newUrl" -ForegroundColor Green
Write-Host ""

# Find all affected files
$files = Get-ChildItem -Recurse -Include *.md,*.ps1,*.py -File | 
    Where-Object { (Get-Content $_.FullName -Raw) -match "marco-eva-data-model\.livelyflower" }

Write-Host "Found $($files.Count) files with old URLs:`n" -ForegroundColor Yellow

$updateCount = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $matches = ([regex]::Matches($content, "marco-eva-data-model\.livelyflower")).Count
    
    if ($matches -gt 0) {
        Write-Host "  $($file.Name): $matches matches" -ForegroundColor Gray
        
        # Replace URLs
        $newContent = $content -replace [regex]::Escape($oldUrl), $newUrl
        
        # Write back to file
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        $updateCount++
    }
}

Write-Host "`n✅ Updated $updateCount files" -ForegroundColor Green

# Verify no marco URLs remain
Write-Host "`nVerifying..." -ForegroundColor Yellow
$remaining = Get-ChildItem -Recurse -Include *.md,*.ps1,*.py -File | 
    Where-Object { (Get-Content $_.FullName -Raw) -match "marco-eva-data-model\.livelyflower" }

if ($remaining.Count -eq 0) {
    Write-Host "✅ All marco URLs successfully replaced!" -ForegroundColor Green
} else {
    Write-Host "⚠️  $($remaining.Count) files still contain marco URLs" -ForegroundColor Yellow
    $remaining | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Red }
}

Write-Host ""
