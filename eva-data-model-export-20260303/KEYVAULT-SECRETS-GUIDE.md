# Key Vault Secrets -- Portable vs Environment-Specific

## Overview

When migrating to a new subscription/resource group, some secrets should be **re-created** (environment-specific), while others are **portable** across environments.

| Category | Action | Examples | Why |
|----------|--------|----------|-----|
| **Portable** | EXPORT & IMPORT | GitHub PAT, ADO PAT, OpenAI API Key | Same credentials work in any environment |
| **Environment-Specific** | RE-CREATE | COSMOS_KEY, APIM_KEY, Storage connection string | Tied to resources in that env |

---

## Portable Secrets (Export These)

These are credentials for external services that don't change between environments.

### GitHub Secrets

| Secret Name | Pattern | Example | Use Case |
|-------------|---------|---------|----------|
| `github-app-id` | Numeric string | `123456` | GitHub App registration |
| `github-app-private-key` | RSA private key | `-----BEGIN RSA PRIVATE KEY-----...` | GitHub App authentication |
| `github-personal-access-token` | `ghp_*` or `github_pat_*` | `ghp_abcd1234...` | GitHub CLI/API access |
| `github-webhook-secret` | Random string | `whsec_...` | Webhook signature verification |

**How to identify in marco-sandbox-keyvault:**
```powershell
az keyvault secret list --vault-name marco-sandbox-keyvault --query "[].name" \
  | grep -i github
```

### Azure DevOps Secrets

| Secret Name | Pattern | Example | Use Case |
|-------------|---------|---------|----------|
| `ado-personal-access-token` | Base64 string | `<redacted>` | ADO REST API / Pipelines |
| `ado-organization-name` | Organization name | `my-org` | ADO tenant identifier |
| `ado-project-name` | Project name | `eva-poc` | ADO project name |
| `ado-service-principal-id` | GUID | `12345678-...` | Service principal (optional) |
| `ado-service-principal-secret` | GUID | `12345678-...` | Service principal secret (optional) |

**How to identify:**
```powershell
az keyvault secret list --vault-name marco-sandbox-keyvault --query "[].name" \
  | grep -i ado
```

### OpenAI Secrets

| Secret Name | Pattern | Example | Use Case |
|-------------|---------|---------|----------|
| `openai-api-key` | `sk-*` | `sk-proj-abc...` | OpenAI.com API access |
| `azure-openai-endpoint` | URL | `https://my-oai.openai.azure.com/` | Azure OpenAI endpoint |
| `azure-openai-api-key` | UUID-like | `12345678-...` | Azure OpenAI API key |
| `azure-openai-deployed-model` | Model name | `gpt-4-turbo` | Deployed model identifier |

**How to identify:**
```powershell
az keyvault secret list --vault-name marco-sandbox-keyvault --query "[].name" \
  | grep -i "openai\|gpt\|oai"
```

---

## Environment-Specific Secrets (Do NOT Export)

These are tied to resources in a specific Azure environment. Re-create them in the target environment.

### Cosmos DB Secrets

| Secret Name | Maps To | Why Environment-Specific |
|-------------|---------|--------------------------|
| `cosmos-url` | COSMOS_URL | Each Cosmos account has unique endpoint |
| `cosmos-key` | COSMOS_KEY | Keys are unique per account |
| `cosmos-connection-string` | — | Contains account-specific connection string |

**During migration:** Create new COSMOS_URL and COSMOS_KEY in target vault from the new Cosmos instance.

### API Management (APIM) Secrets

| Secret Name | Maps To | Why Environment-Specific |
|-------------|---------|--------------------------|
| `apim-key` | APIM_SUBSCRIPTION_KEY | Each APIM instance has unique keys |
| `apim-gateway-url` | — | Each APIM gateway has unique domain |

**During migration:** Create new APIM credentials in target vault from the new APIM instance.

### Azure Storage Secrets

| Secret Name | Maps To | Why Environment-Specific |
|-------------|---------|--------------------------|
| `storage-account-name` | — | Storage account name is unique per env |
| `storage-account-key` | — | Keys are unique per account |
| `storage-connection-string` | — | Contains account-specific endpoint |

**During migration:** Create new storage credentials in target vault from the new storage account.

### Redis Cache Secrets

| Secret Name | Maps To | Why Environment-Specific |
|-------------|---------|--------------------------|
| `redis-url` | REDIS_URL | Each Redis instance has unique endpoint |
| `redis-key` | REDIS_KEY | Keys are unique per instance |

**During migration:** Create new Redis credentials from the new cache instance.

---

## Migration Workflow

### Phase 1: Export Portable Secrets (Current Environment)

```powershell
cd C:\AICOE\eva-foundry\37-data-model\scripts

# Run export
pwsh -File Export-PortableSecrets.ps1

# Output: portable-secrets-export-YYYYMMDD-HHMM.json
# ⚠️  Keep this file secure! Contains secret values.
```

**What gets exported:**
- ✅ GitHub PAT / GitHub App credentials
- ✅ ADO PAT
- ✅ OpenAI API key
- ❌ COSMOS_KEY (environment-specific, will be recreated)
- ❌ APIM_KEY (environment-specific, will be recreated)

### Phase 2: Create Target Key Vault (New Environment)

```powershell
# Option A: Use Bicep template
az deployment group create \
  -g <TARGET_RG> \
  -f deploy-target-keyvault.bicep \
  --parameters vaultName=<my-new-vault> location=<region>

# Option B: Manual creation
az keyvault create --resource-group <TARGET_RG> --name <my-new-vault>
```

### Phase 3: Import Portable Secrets (Target Environment)

```powershell
# Dry run first (no changes)
pwsh -File Import-PortableSecrets.ps1 \
  -InputFile "portable-secrets-export-YYYYMMDD-HHMM.json" \
  -TargetVault "my-new-vault" \
  -DryRun

# Then execute for real
pwsh -File Import-PortableSecrets.ps1 \
  -InputFile "portable-secrets-export-YYYYMMDD-HHMM.json" \
  -TargetVault "my-new-vault"
```

### Phase 4: Create Environment-Specific Secrets in Target

```powershell
# For each new resource, create a corresponding secret in target vault

# Example: New Cosmos DB
az keyvault secret set \
  --vault-name my-new-vault \
  --name cosmos-url \
  --value "https://my-new-cosmos.documents.azure.com:443/"

az keyvault secret set \
  --vault-name my-new-vault \
  --name cosmos-key \
  --value "$(az cosmosdb keys list -g <RG> -n <COSMOS> --query primaryMasterKey -o tsv)"

# Example: New APIM instance
az keyvault secret set \
  --vault-name my-new-vault \
  --name apim-key \
  --value "$(az apim show -g <RG> -n <APIM> | jq -r '.properties.publisherEmail')"
```

### Phase 5: Cleanup

```powershell
# After import is verified:

# 1. Delete export file (contains secrets!)
Remove-Item "portable-secrets-export-YYYYMMDD-HHMM.json" -Force

# 2. Verify target vault has all portable secrets
az keyvault secret list --vault-name my-new-vault --query "[].name"

# 3. Update application configs to reference new vault
# (API, workflows, etc.)
```

---

## Example: Export/Import Walkthrough

### Step 1: Export from marco-sandbox-keyvault

```powershell
pwsh -File Export-PortableSecrets.ps1

# Output:
# [OK] Found 24 total secrets
# [OK] Exported to: portable-secrets-export-20260303-1500.json
#
# File contains:
#   - github-personal-access-token
#   - ado-personal-access-token
#   - openai-api-key
#   ... (3 portable secrets)
#
# NOT included (environment-specific):
#   - cosmos-key
#   - apim-key
#   - storage-key
#   ... (21 environment-specific secrets)
```

### Step 2: Create Target Key Vault

```powershell
az deployment group create \
  -g my-target-rg \
  -f deploy-target-keyvault.bicep \
  --parameters vaultName=my-new-vault

# Output: New Key Vault created in my-target-rg
```

### Step 3: Import Portable Secrets

```powershell
# Dry run
pwsh -File Import-PortableSecrets.ps1 \
  -InputFile "portable-secrets-export-20260303-1500.json" \
  -TargetVault "my-new-vault" \
  -DryRun

# Output:
# [DRY-RUN MODE] No changes will be made
# Secrets that WOULD be imported:
#   - github-personal-access-token
#   - ado-personal-access-token
#   - openai-api-key

# Execute real import
pwsh -File Import-PortableSecrets.ps1 \
  -InputFile "portable-secrets-export-20260303-1500.json" \
  -TargetVault "my-new-vault"

# Output:
# [OK] Imported: github-personal-access-token
# [OK] Imported: ado-personal-access-token
# [OK] Imported: openai-api-key
# Success: 3
```

### Step 4: Create Environment-Specific Secrets

```powershell
# Get new Cosmos primary key
$cosmosKey = az cosmosdb keys list -g my-target-rg -n my-cosmos --query primaryMasterKey -o tsv

# Store in target vault
az keyvault secret set --vault-name my-new-vault --name cosmos-key --value $cosmosKey
az keyvault secret set --vault-name my-new-vault --name cosmos-url --value "https://my-cosmos.documents.azure.com:443/"

# Similar for APIM, storage, etc.
```

---

## Security Best Practices

### For Export File

- [ ] Store on encrypted drive
- [ ] Do not email or commit to git
- [ ] Delete after successful import and verification
- [ ] Never share unencrypted
- [ ] Transfer via secure channel (VPN, encrypted USB, etc.)

### For Key Vault (Target)

- [ ] Enable soft delete (retention: 90 days)
- [ ] Enable purge protection (prevent permanent deletion)
- [ ] Use RBAC (not vault access policies)
- [ ] Enable audit logging (Azure Monitor)
- [ ] Rotate secrets periodically (especially GitHub/ADO PATs every 90 days)
- [ ] Use managed identity for application access (not connection strings)

### For Applications

- [ ] Read secrets from Key Vault at runtime (not embedded)
- [ ] Use managed identity for access (no passwords)
- [ ] Cache secrets briefly if needed (not indefinitely)
- [ ] Log secret access for audit

---

## Troubleshooting

### Export Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| "Not authenticated" | `az login` expired | Re-run: `az login` |
| "Vault not accessible" | RBAC denied | Check you have KeyVaultSecretsOfficer or Contributor role |
| "Empty secret list" | Vault is empty | Verify vault name is correct: `az keyvault list -g EsDAICoE-Sandbox` |

### Import Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| "Vault not found" | Target vault doesn't exist | Create first: `az keyvault create -g <RG> -n <vault>` |
| "Import failed" | Target vault RBAC | Check credentials, ensure you have KeyVaultSecretsOfficer role |
| "Confirmation timeout" | Script waiting for input | Re-run without `-DryRun` and answer "yes" at prompt |

---

## Files Generated

### Export Script
- **Export-PortableSecrets.ps1** - Reads from marco-sandbox-keyvault, outputs JSON with secret values
- Output: `portable-secrets-export-YYYYMMDD-HHMM.json` (secure, contains values)

### Import Script
- **Import-PortableSecrets.ps1** - Reads from export JSON, imports to target vault
- Requires `-InputFile` and `-TargetVault` parameters
- Supports `-DryRun` mode for safe preview

### Bicep Template
- **deploy-target-keyvault.bicep** - Creates new Key Vault in target environment
- Parameters: `vaultName`, `location`
- Output: Vault details for reference

---

## Next Steps

1. **Export portable secrets**: Run Export-PortableSecrets.ps1 in current environment
2. **Create target Key Vault**: Use Bicep template or manual Azure CLI
3. **Import portable secrets**: Run Import-PortableSecrets.ps1 with export file
4. **Recreate environment-specific secrets**: Manually create from new resources
5. **Update application configs**: Point to target Key Vault
6. **Cleanup:** Delete export file after verification

See MIGRATION-RUNBOOK.md for complete migration workflow.
