# Import Portable Secrets (ADO + GitHub) to Target Key Vault
# Reads exported secrets and imports them to new environment vault
# Usage: pwsh -File Import-PortableSecrets.ps1 -InputFile "portable-secrets-export-20260303-1430.json" -TargetVault "my-new-keyvault"

param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile,
    
    [Parameter(Mandatory=$true)]
    [string]$TargetVault,
    
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "EVA Portable Secrets Import Tool" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Validate input file
Write-Host "[CHECK] Input file: $InputFile" -ForegroundColor Yellow
if (-not (Test-Path $InputFile)) {
    Write-Host "[FAIL] File not found: $InputFile" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] File exists" -ForegroundColor Green
Write-Host ""

# Load export data
Write-Host "[STEP 1] Load exported secrets" -ForegroundColor Cyan
try {
    $exportData = Get-Content $InputFile | ConvertFrom-Json
    Write-Host "[OK] Loaded export file" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Could not parse JSON: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Export Date: $($exportData.export_date)"
Write-Host "Source Vault: $($exportData.vault_source)"
Write-Host "Portable Secrets: $($exportData.portable_secrets | Measure-Object | Select-Object -ExpandProperty Count)"
Write-Host ""

# Check Azure CLI authentication
Write-Host "[STEP 2] Verify target vault access" -ForegroundColor Cyan
try {
    $vaultInfo = az keyvault show --name $TargetVault --query "name" -o tsv -ErrorAction Stop
    Write-Host "[OK] Target vault accessible: $vaultInfo" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Cannot access target vault '$TargetVault'" -ForegroundColor Red
    Write-Host "Create the vault first: az keyvault create -g <RG> -n $TargetVault" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[STEP 3] Review secrets to import" -ForegroundColor Cyan

$importData = $exportData.portable_secrets
if (-not $importData) {
    Write-Host "[FAIL] No portable secrets found in export file" -ForegroundColor Red
    exit 1
}

Write-Host "Secrets to import ($($importData | Measure-Object | Select-Object -ExpandProperty Count)):" -ForegroundColor Yellow
$importData | ForEach-Object {
    "  - $($_.name) (from: $($_.exported_at))"
}

Write-Host ""

# DRY RUN
if ($DryRun) {
    Write-Host "[DRY-RUN MODE] No changes will be made" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Secrets that WOULD be imported:"
    $importData | ForEach-Object {
        Write-Host "  SET: az keyvault secret set --vault-name $TargetVault --name $($_.name) --value ****"
    }
    Write-Host ""
    Write-Host "Re-run without -DryRun to actually import:"
    Write-Host "  pwsh -File Import-PortableSecrets.ps1 -InputFile $InputFile -TargetVault $TargetVault"
    exit 0
}

# CONFIRM before import
Write-Host "[CONFIRM] Ready to import $($importData | Measure-Object | Select-Object -ExpandProperty Count) secrets to '$TargetVault'" -ForegroundColor Yellow
$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "[ABORT] User cancelled import" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[STEP 4] Import secrets to target vault" -ForegroundColor Cyan

$successCount = 0
$failCount = 0

foreach ($secret in $importData) {
    try {
        az keyvault secret set `
            --vault-name $TargetVault `
            --name $secret.name `
            --value $secret.value `
            --output none

        Write-Host "[OK] Imported: $($secret.name)" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "[FAIL] Could not import $($secret.name): $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "IMPORT RESULT" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Success: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✓ All portable secrets imported successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "NEXT STEPS:"
    Write-Host "  1. Verify in target vault: az keyvault secret list --vault-name $TargetVault"
    Write-Host "  2. Update API/services to use new vault: $TargetVault"
    Write-Host "  3. Delete export file: $InputFile (contains secrets!)"
    Write-Host "  4. Update documentation with new vault name"
    Write-Host ""
} else {
    Write-Host "⚠️  Some secrets failed to import. Review errors above." -ForegroundColor Yellow
    Write-Host "You may need to manually import failed secrets." -ForegroundColor Yellow
    Write-Host ""
}
