# EVA Data Model -- Migration Runbook

## Export Information
- Export Date: 2026-03-03 09:15:14Z
- Source: https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io
- Exported Layers: 32 / 32
- Total Objects: 4339

## Directory Structure

\\\
export-package/
  schemas/              - All 23 schema files (*.schema.json)
  model-data/           - All layer JSON exports (32 files)
  metadata/             - Cosmos metadata + configuration
  scripts/              - Deployment scripts (seed-cosmos.py, validate-model.ps1, etc.)
  api-snippets/         - API configuration reference
  MIGRATION-RUNBOOK.md  - This file
\\\

## Prerequisites for Target Cosmos

Before running the import, ensure you have:

1. **Target Subscription**: Access to target Azure subscription
2. **Target Resource Group**: Created RG in target subscription
3. **Target Cosmos DB Account**: 
   - Database name: \vamodel\
   - Container name: \model_objects\
   - Partition key: \/layer\
   - Autoscale throughput: 4,000-400,000 RU/s (1/hour autoscale)
   - Indexing policy: Automatic (default)
   - TTL: Disabled (-1)

4. **Connection Details**:
   - Cosmos endpoint URL
   - Cosmos primary key (or secondary key)
   - Connection string (if using legacy SDKs)

5. **Environment Variables Ready**:
   - COSMOS_URL=https://<your-cosmos-name>.documents.azure.com:443/
   - COSMOS_KEY=<your-primary-or-secondary-key>
   - MODEL_DB_NAME=evamodel
   - MODEL_CONTAINER_NAME=model_objects

## Migration Steps

### Phase 1: Prepare Target Cosmos

\\\powershell
# 1. Create Cosmos DB Account (if not exists)
az cosmosdb create \
  --name <target-cosmos-name> \
  --resource-group <target-rg> \
  --locations regionName=<region> failoverPriority=0 \
  --default-consistency-level Strong

# 2. Create database
az cosmosdb sql database create \
  --resource-group <target-rg> \
  --account-name <target-cosmos-name> \
  --name evamodel

# 3. Create container
az cosmosdb sql container create \
  --resource-group <target-rg> \
  --account-name <target-cosmos-name> \
  --database-name evamodel \
  --name model_objects \
  --partition-key-path /layer \
  --throughput 400000 \
  --indexing-policy '{\"indexingMode\":\"consistent\",\"automatic\":true}'

# 4. Get connection details
az cosmosdb keys list --resource-group <target-rg> --name <target-cosmos-name>
az cosmosdb show --resource-group <target-rg> --name <target-cosmos-name> --query documentEndpoint -o tsv
\\\

### Phase 2: Validate Schemas

\\\powershell
# Copy schemas to target environment
# Validate that all 23 schemas are present:
Get-ChildItem "schemas\" -Filter "*.schema.json" | Measure-Object
# Expected: 23 items
\\\

### Phase 3: Seed Target Cosmos

\\\powershell
# Set environment variables
\ = "https://<target-cosmos>.documents.azure.com:443/"
\ = "<your-primary-key>"
\ = "evamodel"
\ = "model_objects"

# Activate Python venv (if applicable)
# & "C:\path\to\.venv\Scripts\Activate.ps1"

# Run seed script
python scripts/seed-cosmos.py --cosmos-url \ --cosmos-key \

# Expected output: Seeding complete, N objects inserted (N = total objects from metadata)
\\\

### Phase 4: Validate Data Integrity

\\\powershell
# Run validation scripts
.\scripts\validate-model.ps1

# Run assembly check
.\scripts\assemble-model.ps1

# Expected: All scripts exit with 0 (success)
\\\

### Phase 5: Deploy API to New Cosmos

Update your API environment variables:

\\\
COSMOS_URL=https://<target-cosmos>.documents.azure.com:443/
COSMOS_KEY=<target-primary-key>
MODEL_DB_NAME=evamodel
MODEL_CONTAINER_NAME=model_objects
DEV_MODE=false
\\\

Then redeploy API container (ACA, Docker, etc.)

### Phase 6: Health Check

\\\powershell
# Test health endpoint
Invoke-RestMethod "https://<target-api-url>/health" | Select-Object status, store

# Expected: \\\{ status: 'ok', store: 'cosmos' }\\\

# Test agent-summary (should return all 32 layers with counts)
Invoke-RestMethod "https://<target-api-url>/model/agent-summary"

# Expected: total=4339, all layers populated
\\\

## Verification Checklist

- [ ] All 23 schemas copied
- [ ] All 32 model JSON files exported
- [ ] Cosmos metadata reviewed and understood
- [ ] Target Cosmos account created with correct settings
- [ ] Target database (evamodel) created
- [ ] Target container (model_objects) created with partition key /layer
- [ ] Connection credentials verified (COSMOS_URL, COSMOS_KEY)
- [ ] Seed script executed successfully
- [ ] validate-model.ps1 exits with 0
- [ ] assemble-model.ps1 exits with 0
- [ ] API health check returns { status: 'ok', store: 'cosmos' }
- [ ] agent-summary returns total=4339 with all 32 layers

## Troubleshooting

### Issue: "Unauthorized" errors during seed
**Cause**: COSMOS_KEY is invalid or rotated
**Fix**: Verify key with \z cosmosdb keys list\

### Issue: "Container not found"
**Cause**: Container name mismatch (case-sensitive)
**Fix**: Ensure container is exactly named \model_objects\ (lowercase)

### Issue: "Partition key mismatch"
**Cause**: Created container with wrong partition key path
**Fix**: Delete container and recreate with \/layer\ as partition key

### Issue: "Timeout during seed"
**Cause**: Throughput too low (under 400 RU/s)
**Fix**: Increase autoscale to 4,000-400,000 RU/s

## Support

For questions or issues:

1. Check STATUS.md for recent incident reports
2. Review USER-GUIDE.md section 3 (API bootstrap)
3. Query health endpoint: \GET /health\
4. Query summary: \GET /model/agent-summary\

## Files Included

### Schemas (23 files)
- agent.schema.json
- component.schema.json
- container.schema.json
- decision.schema.json
- endpoint.schema.json
- evidence.schema.json
- feature_flag.schema.json
- hook.schema.json
- infrastructure.schema.json
- literal.schema.json
- mcp_server.schema.json
- milestone.schema.json
- persona.schema.json
- prompt.schema.json
- requirement.schema.json
- risk.schema.json
- screen.schema.json
- security_control.schema.json
- service.schema.json
- sprint.schema.json
- trace.schema.json
- ts_type.schema.json

### Model Data (32 files exported from API)
All layer data exported as individual JSON files:
agents.json, components.json, containers.json, decisions.json, endpoints.json, etc.

### Scripts
- seed-cosmos.py - Primary seeding tool
- validate-model.ps1 - Schema validation
- assemble-model.ps1 - Model assembly check
- seed-from-plan.py - Optional: seed from PLAN.md

### Metadata
- cosmos-metadata.json - Configuration reference
