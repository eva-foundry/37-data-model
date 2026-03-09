#!/usr/bin/env pwsh
# Install pre-commit hook for automatic quality fixes
# Session 41: Automate banal quality issue fixes

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$hookSource = Join-Path $PSScriptRoot "pre-commit-hook.py"
$hookDest = Join-Path $repoRoot ".git\hooks\pre-commit"

Write-Host "`n=== Installing Pre-Commit Hook ===" -ForegroundColor Cyan
Write-Host "This hook will automatically fix:"
Write-Host "  - F541: f-strings without placeholders"
Write-Host "  - Unicode characters (replaced with ASCII)"
Write-Host ""

# Check if hook already exists
if (Test-Path $hookDest) {
    Write-Host "Pre-commit hook already exists at: $hookDest" -ForegroundColor Yellow
    $response = Read-Host "Overwrite? (y/N)"
    if ($response -ne "y") {
        Write-Host "Installation cancelled." -ForegroundColor Red
        exit 1
    }
}

# Copy hook
try {
    Copy-Item $hookSource $hookDest -Force
    Write-Host "`n[PASS] Pre-commit hook installed: $hookDest" -ForegroundColor Green
    
    # On Unix-like systems, make executable
    if ($IsLinux -or $IsMacOS) {
        chmod +x $hookDest
        Write-Host "[PASS] Hook made executable" -ForegroundColor Green
    }
    
    Write-Host "`nThe hook will run automatically before each commit." -ForegroundColor Cyan
    Write-Host "To bypass (not recommended): git commit --no-verify" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n[ERROR] Failed to install hook: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Testing Hook ===" -ForegroundColor Cyan
Write-Host "Creating test file with F541 error..."

$testFile = Join-Path $repoRoot "test_f541_fix.py"
@"
# Test file for pre-commit hook
def test():
    print(f"No placeholder here")  # F541 error
    print(f"Has placeholder: {123}")  # OK
    print("📄 Unicode test")  # Unicode error
"@ | Out-File -FilePath $testFile -Encoding utf8

Write-Host "Running hook test..."
try {
    git add $testFile
    python $hookSource
    
    # Check if fixes were applied
    $content = Get-Content $testFile -Raw
    if ($content -match 'f"No placeholder') {
        Write-Host "[FAIL] F541 fix did not apply" -ForegroundColor Red
    } else {
        Write-Host "[PASS] F541 fix verified" -ForegroundColor Green
    }
    
    if ($content -match '📄') {
        Write-Host "[FAIL] Unicode fix did not apply" -ForegroundColor Red
    } else {
        Write-Host "[PASS] Unicode fix verified" -ForegroundColor Green
    }
    
    # Cleanup
    git reset HEAD $testFile 2>$null
    Remove-Item $testFile -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "[WARN] Hook test failed: $_" -ForegroundColor Yellow
    Remove-Item $testFile -ErrorAction SilentlyContinue
}

Write-Host "`n=== Installation Complete ===" -ForegroundColor Green
Write-Host "The pre-commit hook is now active for this repository."
