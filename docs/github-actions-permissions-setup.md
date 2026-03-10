# GitHub Actions Permissions Setup - Quick Reference

## Issue
L41 (Agent Metrics) sync fails with `MissingApiVersionParameter` error because the service principal lacks permissions to read Application Insights resources.

## Solution
Grant "Monitoring Reader" role to the GitHub Actions service principal.

## Steps

### 1. Get Service Principal Client ID

**Option A: From GitHub Secrets (Recommended)**
1. Go to: https://github.com/eva-foundry/37-data-model/settings/secrets/actions
2. Find `AZURE_CREDENTIALS` secret
3. Click "Update"
4. Copy the `clientId` value from the JSON:
   ```json
   {
     "clientId": "<THIS-VALUE>",
     "clientSecret": "...",
     "subscriptionId": "c59ee575-eb2a-4b51-a865-4b618f9add0a",
     "tenantId": "..."
   }
   ```

**Option B: From Azure Portal**
1. Go to Azure Portal → Microsoft Entra ID → App registrations
2. Look for an app named "GitHub-Actions-*" or similar
3. Copy the "Application (client) ID"

### 2. Run Permission Script

```powershell
cd c:\eva-foundry\37-data-model\scripts

# Replace <client-id> with the value from step 1
.\grant-github-actions-permissions.ps1 -ServicePrincipalAppId "<client-id>"
```

### 3. Verify

After granting permissions, trigger the workflow:
```powershell
gh workflow run infrastructure-monitoring-sync.yml --ref main -f sync_target=metrics -f dry_run=false
```

Check that L41 job succeeds (green checkmark).

## What This Grants

- **Role**: Monitoring Reader
- **Scope**: EVA-Sandbox-dev resource group
- **Permissions**: Read App Insights resource metadata and query telemetry
- **Security**: Read-only, aligns with least privilege

## Verification

```powershell
# After running the script, verify the role assignment:
az role assignment list \
  --assignee <client-id> \
  --resource-group EVA-Sandbox-dev \
  --query "[?roleDefinitionName=='Monitoring Reader']" \
  -o table
```

## Troubleshooting

- **Error: "Service principal not found"** → Check the client ID is correct
- **Error: "Insufficient permissions"** → You need "Owner" or "User Access Administrator" role on the resource group
- **L41 still fails** → Wait 1-2 minutes for permissions to propagate, then retry workflow
