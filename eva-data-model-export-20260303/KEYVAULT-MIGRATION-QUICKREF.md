# Key Vault Secrets Migration -- Quick Reference

**Scenario**: Migrate EVA ecosystem to new Azure subscription/RG with a new Key Vault

**Challenge**: Some secrets are portable (GitHub, ADO), others are environment-specific (Cosmos keys, APIM keys)

**Solution**: Export portable secrets, recreate environment-specific ones

---

## 3-Minute Summary

| Phase | Tool | Action |
|-------|------|--------|
| **1. Current Env** | Export-PortableSecrets.ps1 | Read GitHub/ADO/OpenAI secrets from marco-sandbox-keyvault |
| **2. Target Setup** | deploy-target-keyvault.bicep | Create new Key Vault in target RG |
| **3. Target Import** | Import-PortableSecrets.ps1 | Write portable secrets to new vault |
| **4. New Resources** | az keyvault secret set | Create environment-specific secrets from new Cosmos, APIM, etc. |

---

## What's Portable? What's Not?

### ✅ PORTABLE (Export & Import)
```
github-personal-access-token    ← Same PAT works in any env
github-app-id                   ← Same GitHub App works anywhere
github-app-private-key          ← Same key works anywhere

ado-personal-access-token       ← Same PAT works in any env
ado-organization-name           ← Same org name in any env

openai-api-key                  ← Same API key works anywhere
```

### ❌ NOT PORTABLE (Recreate in Target)
```
cosmos-key                      ← Unique to cosmos account
cosmos-url                      ← Unique to cosmos account

apim-key                        ← Unique to APIM instance
apim-gateway-url                ← Unique to APIM instance

storage-account-key             ← Unique to storage account
storage-connection-string       ← Unique to storage account

redis-url                       ← Unique to redis instance
redis-key                       ← Unique to redis instance
```

---

## Step-by-Step

### 1️⃣ Export Portable Secrets (Current Environment)

```powershell
cd C:\AICOE\eva-foundry\37-data-model\scripts

# This reads from marco-sandbox-keyvault
pwsh -File Export-PortableSecrets.ps1

# Output: portable-secrets-export-20260303-1430.json
# ⚠️  KEEP SECURE - contains secret values!
```

**What it does:**
- Connects to marco-sandbox-keyvault
- Identifies portable secrets (github-*, ado-*, openai-*)
- Exports with secret values to JSON file
- Lists environment-specific secrets that won't be exported

**Example Output:**
```
[OK] Found 24 total secrets
  [PORTABLE] github-personal-access-token
  [PORTABLE] ado-personal-access-token
  [PORTABLE] openai-api-key
  [ENV-SPECIFIC] cosmos-key
  [ENV-SPECIFIC] apim-key
  ... (21 more env-specific)

[OK] Exported to: portable-secrets-export-20260303-1430.json
```

---

### 2️⃣ Create Target Key Vault

```powershell
# Option A: Bicep (recommended)
az deployment group create \
  -g my-target-rg \
  -f scripts/deploy-target-keyvault.bicep \
  --parameters vaultName=my-new-vault location=canadacentral

# Option B: Manual Azure CLI
az keyvault create --resource-group my-target-rg --name my-new-vault
```

**What gets created:**
- New Key Vault: `my-new-vault`
- RBAC enabled (use roles, not vault policies)
- Soft delete: 90 days (configurable)
- Purge protection: enabled
- Ready to import secrets

---

### 3️⃣ Import Portable Secrets (Target Environment)

```powershell
# Dry run first (see what will happen, no changes)
pwsh -File Import-PortableSecrets.ps1 \
  -InputFile "portable-secrets-export-20260303-1430.json" \
  -TargetVault "my-new-vault" \
  -DryRun

# Then execute (for real)
pwsh -File Import-PortableSecrets.ps1 \
  -InputFile "portable-secrets-export-20260303-1430.json" \
  -TargetVault "my-new-vault"

# When prompted: type "yes" to confirm
```

**What it does:**
- Connects to target vault: `my-new-vault`
- Imports 3 portable secrets (github, ado, openai)
- Skips environment-specific secrets
- Reports success/failure

**Example Output:**
```
[OK] Imported: github-personal-access-token
[OK] Imported: ado-personal-access-token
[OK] Imported: openai-api-key

Success: 3
Failed: 0
```

---

### 4️⃣ Create Environment-Specific Secrets (Target)

For each NEW resource, create a corresponding secret:

```powershell
# NEW Cosmos DB → create cosmos-key and cosmos-url
$cosmosKey = az cosmosdb keys list -g my-target-rg -n my-new-cosmos --query primaryMasterKey -o tsv
az keyvault secret set --vault-name my-new-vault --name cosmos-key --value $cosmosKey
az keyvault secret set --vault-name my-new-vault --name cosmos-url --value "https://my-new-cosmos.documents.azure.com:443/"

# NEW APIM instance → create apim-key
# (Get from APIM properties in Azure Portal, or use az)
az keyvault secret set --vault-name my-new-vault --name apim-key --value "<apim-subscription-key>"

# NEW Storage account → create storage-account-key
$storageKey = az storage account keys list -g my-target-rg -n mystorageacct --query [0].value -o tsv
az keyvault secret set --vault-name my-new-vault --name storage-account-key --value $storageKey

# NEW Redis cache → create redis-url and redis-key
$redisUrl = az redis show -g my-target-rg -n my-redis --query "hostName" -o tsv
$redisKey = az redis list-keys -g my-target-rg -n my-redis --query "primaryKey" -o tsv
az keyvault secret set --vault-name my-new-vault --name redis-url --value "https://$redisUrl:6379"
az keyvault secret set --vault-name my-new-vault --name redis-key --value $redisKey
```

---

### 5️⃣ Update Applications

Update all applications/services to use the NEW Key Vault:

```powershell
# Example: Update Azure Container App
az containerapp update \
  --resource-group my-target-rg \
  --name my-api \
  --set-env-vars \
    KEYVAULT_NAME=my-new-vault \
    COSMOS_URL=@keyvault(my-new-vault, cosmos-url) \
    COSMOS_KEY=@keyvault(my-new-vault, cosmos-key)

# Example: Update App Service
az webapp config appsettings set \
  --resource-group my-target-rg \
  --name my-app-service \
  --settings \
    KEYVAULT_NAME=my-new-vault \
    KEYVAULT_TENANT_ID=<your-tenant-id>
```

---

### 6️⃣ Cleanup

After successful import and verification:

```powershell
# 1. Delete export file (contains secret values!)
Remove-Item "portable-secrets-export-20260303-1430.json" -Force

# 2. Verify target vault has all secrets
az keyvault secret list --vault-name my-new-vault --query "[].name"

# 3. Test import by querying a secret
az keyvault secret show --vault-name my-new-vault --name github-personal-access-token
```

---

## Files in This Package

### Scripts

- **Export-PortableSecrets.ps1**
  - Reads from source vault (marco-sandbox-keyvault)
  - Outputs: `portable-secrets-export-*.json`
  - Usage: `pwsh -File Export-PortableSecrets.ps1`

- **Import-PortableSecrets.ps1**
  - Reads from export JSON file
  - Writes to target vault
  - Usage: `pwsh -File Import-PortableSecrets.ps1 -InputFile "..." -TargetVault "..."`
  - Supports: `-DryRun` mode

- **deploy-target-keyvault.bicep**
  - Creates target Key Vault with RBAC, soft delete, purge protection
  - Usage: `az deployment group create -g <RG> -f deploy-target-keyvault.bicep --parameters vaultName=<name>`

### Documentation

- **KEYVAULT-SECRETS-GUIDE.md** (detailed)
  - Full secret classification
  - Migration workflow
  - Troubleshooting guide

- **KEYVAULT-MIGRATION-QUICKREF.md** (this file)
  - 3-minute overview
  - Step-by-step commands
  - Quick reference

---

## Timing

| Phase | Duration | Notes |
|-------|----------|-------|
| Export portable secrets | 2-3 min | Reads from source vault |
| Create target vault | 2-3 min | Bicep deployment |
| Import secrets | 1-2 min | Writes to target vault |
| Create env-specific secrets | 5-10 min | One per resource (Cosmos, APIM, etc.) |
| Update applications | 10-30 min | Depends on # of apps |
| Verify | 3-5 min | Test health endpoints |
| **TOTAL** | **~30-60 min** | Full Key Vault migration |

---

## Security Checklist

- [ ] Export file stored on encrypted drive
- [ ] Export file never emailed or committed to git
- [ ] Export transferred via secure channel (VPN, encrypted USB)
- [ ] Target vault has RBAC enabled
- [ ] Target vault has soft delete enabled (90 days)
- [ ] Target vault has purge protection enabled
- [ ] Azure Monitor logging enabled (optional, recommended)
- [ ] Export file deleted after success verification
- [ ] Applications updated to new vault
- [ ] Old vault credentials rotated/revoked (if applicable)

---

## Troubleshooting

**Q: "Vault not found" error when importing?**
A: Target vault not created. Run Bicep template first.
```bash
az deployment group create -g my-target-rg -f deploy-target-keyvault.bicep --parameters vaultName=my-new-vault
```

**Q: "Not authenticated" when exporting?**
A: Azure CLI session expired. Re-login.
```bash
az login
```

**Q: "Unauthorized" when accessing vault?**
A: RBAC permission denied. Ensure you have KeyVaultSecretsOfficer role.
```bash
az role assignment create --role "Key Vault Secrets Officer" --assignee <your-email>
```

**Q: How do I verify import was successful?**
A: Query the vault for imported secrets.
```bash
az keyvault secret show --vault-name my-new-vault --name github-personal-access-token --query value -o tsv
```

**Q: Can I re-run import if it fails?**
A: Yes! Re-run with same export file. It will skip existing secrets and retry failed ones.

---

## Next Steps

1. **Export**: `pwsh -File Export-PortableSecrets.ps1`
2. **Create**: `az deployment group create -g <RG> -f deploy-target-keyvault.bicep --parameters vaultName=<name>`
3. **Import**: `pwsh -File Import-PortableSecrets.ps1 -InputFile "..." -TargetVault "..."`
4. **Create env-specific secrets**: Use `az keyvault secret set` for each new resource
5. **Update apps**: Point to new vault
6. **Cleanup**: Delete export file

See **KEYVAULT-SECRETS-GUIDE.md** for detailed documentation.
