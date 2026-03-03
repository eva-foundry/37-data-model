# Export Portable Secrets (ADO + GitHub) from marco-sandbox-keyvault
# These secrets are NOT environment-specific and should migrate to new environment
# Usage: pwsh -File Export-PortableSecrets.ps1

param(
    [string]$VaultName = "marco-sandbox-keyvault",
    [string]$OutputFile = "portable-secrets-export-$(Get-Date -Format 'yyyyMMdd-HHmm').json"
)

$ErrorActionPreference = "Stop"

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "EVA Portable Secrets Export Tool" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check Azure CLI authentication
Write-Host "[CHECK] Azure CLI authentication..." -ForegroundColor Yellow
try {
    $account = az account show --query "name" -o tsv -ErrorAction Stop
    Write-Host "[OK] Authenticated as: $account" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Not authenticated. Run: az login" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[STEP 1] Query all secrets in $VaultName" -ForegroundColor Cyan
$allSecrets = az keyvault secret list --vault-name $VaultName --query "[].name" -o tsv

if (-not $allSecrets) {
    Write-Host "[FAIL] No secrets found or vault not accessible" -ForegroundColor Red
    exit 1
}

$secretList = @($allSecrets -split "`n" | Where-Object { $_.Trim() })
Write-Host "[OK] Found $($secretList.Count) total secrets" -ForegroundColor Green
Write-Host ""

# Categorize secrets
Write-Host "[STEP 2] Categorize secrets" -ForegroundColor Cyan

$portable = @()
$envSpecific = @()

foreach ($secret in $secretList) {
    $secret = $secret.Trim()
    if (-not $secret) { continue }
    
    # Portable: ADO, GitHub, OpenAI (not environment-specific)
    if ($secret -match "(ADO|AZURE.*DEVOPS|GITHUB|OPENAI)" -or 
        $secret -match "PAT|TOKEN|API" -and $secret -notmatch "COSMOS|APIM|REDIS") {
        $portable += $secret
        Write-Host "  [PORTABLE] $secret"
    } else {
        $envSpecific += $secret
        Write-Host "  [ENV-SPECIFIC] $secret"
    }
}

Write-Host ""
Write-Host "[SUMMARY]"
Write-Host "  Portable (to export): $($portable.Count) secrets"
Write-Host "  Environment-specific (skip): $($envSpecific.Count) secrets"
Write-Host ""

if ($portable.Count -eq 0) {
    Write-Host "[WARN] No portable secrets detected. Check categorization rules." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "All secrets found:"
    $secretList | ForEach-Object { "  - $_" }
    Write-Host ""
    Write-Host "Please manually review and specify which to export."
    exit 1
}

Write-Host "[STEP 3] Export portable secrets (VALUES HIDDEN)" -ForegroundColor Cyan

$exportData = @{
    export_date = (Get-Date -Format "u")
    vault_source = $VaultName
    note = "These secrets are portable and NOT environment-specific. Safe to migrate."
    portable_secrets = @()
    environment_specific = $envSpecific
}

foreach ($secret in $portable) {
    try {
        $value = az keyvault secret show --vault-name $VaultName --name $secret --query "value" -o tsv
        
        if ($value) {
            $exportData.portable_secrets += @{
                name = $secret
                value = $value
                exported_at = (Get-Date -Format "u")
            }
            Write-Host "[OK] Exported: $secret (length: $($value.Length) chars)"
        } else {
            Write-Host "[WARN] $secret returned empty value" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[FAIL] Could not read $secret : $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[STEP 4] Save to file (WITH VALUES)" -ForegroundColor Cyan

$exportData | ConvertTo-Json -Depth 10 | Out-File $OutputFile -Encoding UTF8 -Force
Write-Host "[OK] Exported to: $OutputFile" -ForegroundColor Green
Write-Host ""

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "EXPORT COMPLETE" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "File: $OutputFile" -ForegroundColor Cyan
Write-Host "Secrets: $($portable.Count) portable + $($envSpecific.Count) environment-specific" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  SECURITY REMINDERS:" -ForegroundColor Yellow
Write-Host "  - This file contains SECRET VALUES. Store securely (encrypted drive/vault)."
Write-Host "  - Do not commit to git or share via email."
Write-Host "  - Move to target environment vault (IMPORT-PortableSecrets.ps1)."
Write-Host "  - Delete after import is verified."
Write-Host ""
Write-Host "NEXT STEPS:"
Write-Host "  1. Review $OutputFile content"
Write-Host "  2. Transfer securely to target environment"
Write-Host "  3. Run: pwsh -File IMPORT-PortableSecrets.ps1 -InputFile $OutputFile"
Write-Host ""
