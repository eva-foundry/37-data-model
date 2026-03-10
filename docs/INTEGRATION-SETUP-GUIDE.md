# EVA Infrastructure Monitoring - Integration Setup Guide

**Session 39 - Operational Data Ingestion**  
**Date**: March 8, 2026  
**Status**: Ready for deployment

---

## Overview

This guide documents the setup and deployment of automated data ingestion for infrastructure monitoring layers (L40-L49). Three integration scripts continuously populate the data model with operational intelligence from Azure.

### Integration Components

| Layer | Script | Source | Schedule | Purpose |
|-------|--------|--------|----------|---------|
| **L42** | `sync-azure-infrastructure.py` | Azure Resource Graph | Every 4 hours | Infrastructure inventory |
| **L49** | `sync-azure-costs.ps1` | Azure Cost Management | Daily 6 AM ET | Cost tracking & budgets |
| **L41** | `update-agent-metrics-from-appinsights.ps1` | Application Insights | Hourly | Agent performance metrics |

---

## Prerequisites

### 1. Azure Authentication

All scripts require Azure CLI authentication:

```powershell
# Login to Azure
az login

# Verify subscription
az account show --query "{Name:name, SubscriptionId:id}" -o table

# Set default subscription if needed
az account set --subscription c59ee575-eb2a-4b51-a865-4b618f9add0a
```

### 2. Azure Permissions

Required RBAC roles:

- **Reader** on subscription (for Resource Graph queries)
- **Cost Management Reader** on subscription (for Cost Management API)
- **Monitoring Reader** on Application Insights (for telemetry queries)

Verify access:

```powershell
# Check Resource Graph access
az graph query -q "Resources | take 1"

# Check Cost Management access
az costmanagement query --type Usage --timeframe MonthToDate --scope "/subscriptions/c59ee575-eb2a-4b51-a865-4b618f9add0a"

# Check Application Insights access
az monitor app-insights component show --app msub-sandbox-appinsights --resource-group EVA-Sandbox-dev
```

### 3. Python Environment (for L42 script)

Python 3.10+ with `requests` library:

```powershell
# Check Python version
python --version  # Should be 3.10+

# Install dependencies
pip install requests
```

---

## Local Testing

Before enabling scheduled automation, test each script locally.

### Test L42: Infrastructure Sync

```powershell
cd C:\eva-foundry\37-data-model\scripts

# Dry run (preview without uploading)
python sync-azure-infrastructure.py --dry-run

# Real sync (uploads to data model)
python sync-azure-infrastructure.py
```

**Expected output:**
```
================================================================================
  EVA INFRASTRUCTURE SYNC - Azure Resource Graph → L42
================================================================================

[2026-03-08 12:00:00] [INFO] Configuration:
[2026-03-08 12:00:00] [INFO]   Subscription: c59ee575-eb2a-4b51-a865-4b618f9add0a
[2026-03-08 12:00:00] [INFO]   Data Model: https://msub-eva-data-model...
[2026-03-08 12:00:00] [SUCCESS] ✓ Retrieved 30 resources from Azure

[2026-03-08 12:00:05] [SUCCESS] SYNC COMPLETE
[2026-03-08 12:00:05] [SUCCESS]   Total: 30
[2026-03-08 12:00:05] [SUCCESS]   Success: 30
[2026-03-08 12:00:05] [SUCCESS]   Failed: 0
```

### Test L49: Cost Sync

```powershell
cd C:\eva-foundry\37-data-model\scripts

# Dry run
.\sync-azure-costs.ps1 -DryRun

# Real sync
.\sync-azure-costs.ps1
```

**Expected output:**
```
================================================================================
  EVA COST SYNC - Azure Cost Management → L49
================================================================================

[2026-03-08 12:00:00] [INFO] Configuration:
[2026-03-08 12:00:00] [INFO]   Subscription: c59ee575-eb2a-4b51-a865-4b618f9add0a
[2026-03-08 12:00:00] [SUCCESS] ✓ Retrieved cost data for 15 service groups

[2026-03-08 12:00:05] [SUCCESS] SYNC COMPLETE
[2026-03-08 12:00:05] [SUCCESS]   Total Cost: 250.45 USD
[2026-03-08 12:00:05] [SUCCESS]   Services: 15
[2026-03-08 12:00:05] [SUCCESS]   Optimization Opportunities: 3
```

### Test L41: Agent Metrics Sync

```powershell
cd C:\eva-foundry\37-data-model\scripts

# Dry run (last hour)
.\update-agent-metrics-from-appinsights.ps1 -LookbackHours 1 -DryRun

# Real sync
.\update-agent-metrics-from-appinsights.ps1 -LookbackHours 1
```

**Expected output:**
```
================================================================================
  EVA METRICS SYNC - Application Insights → L41
================================================================================

[2026-03-08 12:00:00] [INFO] Configuration:
[2026-03-08 12:00:00] [INFO]   App Insights: msub-sandbox-appinsights
[2026-03-08 12:00:00] [SUCCESS] ✓ Found: msub-sandbox-appinsights

[2026-03-08 12:00:05] [SUCCESS] SYNC COMPLETE
[2026-03-08 12:00:05] [SUCCESS]   Total Agents: 5
[2026-03-08 12:00:05] [SUCCESS]   Success: 5
```

---

## Automated Deployment (GitHub Actions)

### Setup GitHub Secrets

The workflow requires Azure credentials stored as a GitHub secret.

**Create service principal:**

```powershell
# Create SP with Contributor role (adjust role as needed)
az ad sp create-for-rbac --name "eva-github-actions" `
  --role "Reader" `
  --scopes "/subscriptions/c59ee575-eb2a-4b51-a865-4b618f9add0a" `
  --sdk-auth

# Output format (save entire JSON):
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "c59ee575-eb2a-4b51-a865-4b618f9add0a",
  "tenantId": "...",
  "activeDirectoryEndpointUrl": "...",
  ...
}
```

**Add additional role assignments:**

```powershell
# Get SP object ID
$spObjectId = az ad sp list --display-name "eva-github-actions" --query "[0].id" -o tsv

# Assign Cost Management Reader
az role assignment create `
  --assignee $spObjectId `
  --role "Cost Management Reader" `
  --scope "/subscriptions/c59ee575-eb2a-4b51-a865-4b618f9add0a"

# Assign Monitoring Reader for Application Insights
az role assignment create `
  --assignee $spObjectId `
  --role "Monitoring Reader" `
  --scope "/subscriptions/c59ee575-eb2a-4b51-a865-4b618f9add0a/resourceGroups/EVA-Sandbox-dev/providers/microsoft.insights/components/msub-sandbox-appinsights"
```

**Add secret to GitHub:**

1. Go to: `https://github.com/<your-org>/eva-foundry/settings/secrets/actions`
2. Click **New repository secret**
3. Name: `AZURE_CREDENTIALS`
4. Value: Paste entire JSON from service principal creation
5. Click **Add secret**

### Enable Workflow

The workflow is already committed in `.github/workflows/infrastructure-monitoring-sync.yml`.

**Verify workflow file:**

```powershell
# Check workflow exists
ls C:\eva-foundry\.github\workflows\infrastructure-monitoring-sync.yml
```

**Push to GitHub (if not already pushed):**

```powershell
cd C:\eva-foundry\eva-foundry

git add .github/workflows/infrastructure-monitoring-sync.yml
git add 37-data-model/scripts/sync-azure-infrastructure.py
git add 37-data-model/scripts/sync-azure-costs.ps1
git add 37-data-model/scripts/update-agent-metrics-from-appinsights.ps1
git commit -m "Session 39: Add infrastructure monitoring automation"
git push
```

**Manually trigger workflow:**

1. Go to: `https://github.com/<your-org>/eva-foundry/actions`
2. Select **EVA Infrastructure Monitoring - Scheduled Data Sync**
3. Click **Run workflow**
4. Select sync target: `all`, `infrastructure`, `costs`, or `metrics`
5. Check **Dry run** for preview
6. Click **Run workflow**

---

## Schedule Details

### Automatic Schedules (after deployment)

| Schedule | Time (UTC) | Time (ET) | Target | Frequency |
|----------|-----------|-----------|--------|-----------|
| `0 * * * *` | Every hour at :00 | Varies | L41 (metrics) | Hourly |
| `15 */4 * * *` | :15 of every 4th hour | Varies | L42 (infrastructure) | Every 4 hours |
| `0 11 * * *` | 11:00 UTC | 6:00 AM ET | L49 (costs) | Daily |

### Manual Triggers

Use GitHub Actions UI or CLI:

```powershell
# Trigger via GitHub CLI (install: https://cli.github.com/)
gh workflow run infrastructure-monitoring-sync.yml -f sync_target=all -f dry_run=false
```

---

## Validation

After first sync runs, validate data population:

### L42: Azure Infrastructure

```powershell
# Query endpoint
curl "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/azure_infrastructure/?limit=5" | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

**Expected:** Array of resources with `subscription_id`, `resource_name`, `resource_type`, etc.

### L49: Resource Costs

```powershell
# Query endpoint (current month)
$month = Get-Date -Format "yyyy-MM"
curl "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/resource_costs/c59ee575-eb2a-4b51-a865-4b618f9add0a-$month" | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

**Expected:** Cost record with `total_cost`, `cost_by_service[]`, `optimization_opportunities[]`.

### L41: Agent Performance Metrics

```powershell
# Query endpoint
curl "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/agent_performance_metrics/?limit=5" | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

**Expected:** Array of agent metrics with `reliability_score`, `speed_percentile`, `cost_efficiency_percentile`.

---

## Troubleshooting

### Script Failures

**Check logs:**

- **Local**: Terminal output shows errors with color coding
- **GitHub Actions**: Go to Actions tab → Select run → View job logs

**Common issues:**

| Error | Cause | Solution |
|-------|-------|----------|
| `az: command not found` | Azure CLI not installed | Install: https://aka.ms/azure-cli |
| `Authentication failed` | Not logged in | Run `az login` |
| `QuotaExceeded` | Resource Graph throttling | Reduce query frequency or add delay |
| `403 Forbidden` | Insufficient permissions | Verify RBAC roles (see Prerequisites) |
| `Connection timeout` | Network or API issue | Retry after delay |

### Data Not Populating

**Check data model layer:**

```powershell
# Get layer summary
curl "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/layer-summary/L42" | ConvertFrom-Json

# Expected: record_count > 0
```

**If record_count = 0:**
1. Check script ran successfully (exit code 0)
2. Check Data Model URL is correct in script
3. Check Azure authentication during script execution
4. Run script with verbose logging

---

## Monitoring

### GitHub Actions Monitoring

- **Workflow Status**: https://github.com/<your-org>/eva-foundry/actions
- **Email Notifications**: Configure in GitHub Settings → Notifications
- **Slack Alerts**: Add GitHub app to Slack workspace

### Script Metrics

Each script logs to terminal with:
- Timestamp
- Success/failure status
- Record counts
- Error messages

Consider sending logs to Application Insights for centralized monitoring.

---

## Next Steps

After successful deployment and validation:

1. **Enable all schedules** (already in workflow file)
2. **Monitor first 24 hours** for errors
3. **Validate data freshness** via layer queries
4. **Set up alerting** for sync failures
5. **Document operational procedures** in runbooks

---

## Support

For issues or questions:

- **Session Notes**: See `37-data-model/SESSION-39-FINAL-COMPLETION.md`
- **Script Documentation**: See inline comments in scripts
- **Data Model Docs**: See `37-data-model/docs/`
- **EVA Foundation**: Contact AIC OE team

---

**Document Version:** 1.0  
**Last Updated:** March 8, 2026 (Session 39)  
**Maintained by:** EVA Foundation / Project 37
