# EVA Data Model Migration Checklist

## Pre-Migration Planning

### Target Environment

- [ ] Target Azure subscription identified and accessible
- [ ] Target resource group created
- [ ] Target location approved (e.g., canadacentral, canadaeast)
- [ ] Quota increase request submitted (if needed for Cosmos autoscale-4000-400000)
- [ ] Budget owner approved for new Cosmos instance

### Export Package

- [ ] Export package downloaded and verified
- [ ] ZIP integrity checked (all files present)
- [ ] Read MIGRATION-RUNBOOK.md completely
- [ ] Understand all 32 layers being migrated
- [ ] Understand seeding process (seed-cosmos.py + validate-model.ps1)

### Credentials & Permissions

- [ ] Azure CLI authenticated to target subscription: `az account show`
- [ ] Permissions verified: 
  - [ ] Can create Cosmos DB account
  - [ ] Can create database/container
  - [ ] Can list keys
- [ ] Service principal or managed identity created (if not using personal login)

---

## Phase 1: Deploy Target Infrastructure

### Option A: Use Bicep Template (Recommended)

```powershell
# 1. Deploy target Cosmos infrastructure
az deployment group create \
  --resource-group <TARGET_RG> \
  --template-file deploy-target-cosmos.bicep \
  --parameters \
    cosmosAccountName=<target-cosmos-name> \
    location=<region> \
    environment=production

# 2. Verify deployment succeeded
az cosmosdb show --resource-group <TARGET_RG> --name <target-cosmos-name>

# 3. Get endpoint URL
$endpoint = az cosmosdb show \
  --resource-group <TARGET_RG> \
  --name <target-cosmos-name> \
  --query documentEndpoint -o tsv
Write-Host "Endpoint: $endpoint"
```

**Deployment Checklist:**
- [ ] Bicep template created and validated
- [ ] Deployment command executed
- [ ] Deployment status: Succeeded
- [ ] Cosmos account accessible in Azure Portal
- [ ] Database `evamodel` created
- [ ] Container `model_objects` created
- [ ] Partition key is `/layer`
- [ ] Autoscale throughput configured (4,000 - 400,000 RU/s)

### Option B: Manual Azure CLI Commands

```powershell
# 1. Create Cosmos Account
az cosmosdb create \
  --name <target-cosmos-name> \
  --resource-group <TARGET_RG> \
  --locations regionName=<REGION> failoverPriority=0 \
  --default-consistency-level Strong

# 2. Create Database
az cosmosdb sql database create \
  --resource-group <TARGET_RG> \
  --account-name <target-cosmos-name> \
  --name evamodel

# 3. Create Container
az cosmosdb sql container create \
  --resource-group <TARGET_RG> \
  --account-name <target-cosmos-name> \
  --database-name evamodel \
  --name model_objects \
  --partition-key-path /layer \
  --max-throughput 400000 \
  --indexing-policy '{\"indexingMode\":\"consistent\",\"automatic\":true}'
```

**Manual Deployment Checklist:**
- [ ] Cosmos account created
- [ ] evamodel database created
- [ ] model_objects container created
- [ ] Partition key = /layer (verified)
- [ ] Autoscale throughput = max 400,000 RU/s
- [ ] Indexing policy = automatic/consistent

---

## Phase 2: Retrieve Connection Credentials

```powershell
# Get connection credentials
$rg = "<TARGET_RG>"
$accountName = "<target-cosmos-name>"

$endpoint = az cosmosdb show --resource-group $rg --name $accountName --query documentEndpoint -o tsv
$primaryKey = az cosmosdb keys list --resource-group $rg --name $accountName --query primaryMasterKey -o tsv

Write-Host "COSMOS_URL=$endpoint"
Write-Host "COSMOS_KEY=$primaryKey" -ForegroundColor Yellow
Write-Host "MODEL_DB_NAME=evamodel"
Write-Host "MODEL_CONTAINER_NAME=model_objects"
```

**Credentials Checklist:**
- [ ] COSMOS_URL retrieved and verified
- [ ] COSMOS_KEY retrieved (copy safely, do not share)
- [ ] Connection string tested (optional): `https://<cosmos-name>:<key>@<cosmos-name>.documents.azure.com:443/`
- [ ] Credentials stored securely (Key Vault, environment file, etc.)

---

## Phase 3: Validate Schemas

```powershell
# Navigate to export directory
cd "\path\to\eva-data-model-export-20260303"

# Check all 22 schemas present
$schemaCount = (Get-ChildItem "schemas\*.schema.json").Count
Write-Host "Schema files: $schemaCount / 22"

# Validate JSON syntax (optional)
Get-ChildItem "schemas\*.schema.json" | ForEach-Object {
    try {
        Get-Content $_.FullName | ConvertFrom-Json | Out-Null
        Write-Host "[OK] $($_.Name)"
    } catch {
        Write-Host "[FAIL] $($_.Name): $_" -ForegroundColor Red
    }
}
```

**Schema Validation Checklist:**
- [ ] All 22 schema files present
- [ ] All JSON files valid syntax
- [ ] Schema folder not modified

---

## Phase 4: Seed Target Cosmos

### Step 1: Set Environment Variables

```powershell
$env:COSMOS_URL = "https://<target-cosmos>.documents.azure.com:443/"
$env:COSMOS_KEY = "<your-primary-key>"
$env:MODEL_DB_NAME = "evamodel"
$env:MODEL_CONTAINER_NAME = "model_objects"

# Verify
Write-Host "COSMOS_URL: $env:COSMOS_URL"
Write-Host "COSMOS_KEY: $(if($env:COSMOS_KEY) {'SET'} else {'NOT SET'})"
```

**Environment Setup Checklist:**
- [ ] COSMOS_URL set
- [ ] COSMOS_KEY set
- [ ] MODEL_DB_NAME set (default: evamodel)
- [ ] MODEL_CONTAINER_NAME set (default: model_objects)

### Step 2: Run Seed Script

```powershell
# Navigate to scripts folder
cd "\path\to\eva-data-model-export-20260303\scripts"

# Run Python seed script
python seed-cosmos.py

# Expected output:
#   Seeding layer: services (36 total)
#   Seeding layer: containers (13 total)
#   ... (all 32 layers)
#   Total: 4339 objects seeded
```

**Seed Execution Checklist:**
- [ ] Script executed without errors
- [ ] All 32 layers seeded
- [ ] Total objects = 4,339
- [ ] No "Unauthorized" errors (COSMOS_KEY is valid)
- [ ] No "Container not found" errors (container name correct)
- [ ] Seed completed in < 5 minutes (indicates healthy RU throughput)

**Troubleshooting Seed Errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `Unauthorized` | Invalid/expired COSMOS_KEY | Re-run `az cosmosdb keys list`, update env var |
| `ContainerNotFound` | Wrong container name or not created | Verify container exists + name is `model_objects` |
| `PartitionKeyMismatch` | Container created with wrong partition key | Delete container, recreate with `/layer` |
| `Timeout` | Throughput too low | Increase autoscale to 400,000 RU/s |
| `Forbidden` | Key Vault access denied | Use secondary key or check access policies |

---

## Phase 5: Validate Data Integrity

### Step 1: Run Model Validation

```powershell
cd "\path\to\eva-data-model-export-20260303\scripts"

# Run validation script
. .\validate-model.ps1

# Expected output:
#   [OK] All 32 layers present
#   [OK] All cross-references valid
#   [OK] No orphaned objects
#   Result: PASS 0 violations
```

**Validation Checklist:**
- [ ] validate-model.ps1 executed
- [ ] Result: PASS (0 violations)
- [ ] All 32 layers found
- [ ] All cross-references valid
- [ ] No missing required fields

### Step 2: Run Assembly Check

```powershell
# Run assembly check
. .\assemble-model.ps1

# Expected output:
#   Assembling layers...
#   services: 36
#   personas: 10
#   ... (all layers)
#   Total: 4339
#   Assembly: OK
```

**Assembly Checklist:**
- [ ] assemble-model.ps1 executed
- [ ] Result: OK
- [ ] Total object count matches (4,339)
- [ ] All layers accounted for
- [ ] No assembly errors

---

## Phase 6: Deploy/Update API

### Update API Configuration

```bash
# Update .env or environment variables
export COSMOS_URL="https://<target-cosmos>.documents.azure.com:443/"
export COSMOS_KEY="<primary-key>"
export MODEL_DB_NAME="evamodel"
export MODEL_CONTAINER_NAME="model_objects"
export DEV_MODE="false"  # Production mode
```

### Deploy API (Container / Docker / ACA)

```bash
# Example: Azure Container Apps
az containerapp update \
  --resource-group <RG> \
  --name <aca-name> \
  --set-env-vars \
    COSMOS_URL="https://<target-cosmos>.documents.azure.com:443/" \
    COSMOS_KEY="<primary-key>" \
    MODEL_DB_NAME="evamodel" \
    MODEL_CONTAINER_NAME="model_objects" \
    DEV_MODE="false"

# Wait for revision deployment
az containerapp app wait --resource-group <RG> --name <aca-name>
```

**Deployment Checklist:**
- [ ] Environment variables updated
- [ ] API redeployed / restarted
- [ ] Deployment succeeded
- [ ] Container revision updated
- [ ] 100% traffic on new revision

---

## Phase 7: Health Check

### Test API Connectivity

```powershell
$apiUrl = "https://<target-api-url>"

# 1. Health check
$health = Invoke-RestMethod "$apiUrl/health"
Write-Host "[HEALTH] Status: $($health.status), Store: $($health.store)"

# Expected: status=ok, store=cosmos

# 2. Ready check
$ready = Invoke-RestMethod "$apiUrl/ready"
Write-Host "[READY] Cosmos reachable: $($ready.store_reachable)"

# Expected: store_reachable=true

# 3. Agent summary
$summary = Invoke-RestMethod "$apiUrl/model/agent-summary"
Write-Host "[SUMMARY] Total objects: $($summary.total)"
Write-Host "[SUMMARY] Layers: $($summary.by_layer | Get-Member -Type NoteProperty | Measure-Object).Count"

# Expected: total=4339, layers >= 30
```

**Health Check Checklist:**
- [ ] Health endpoint reachable
- [ ] Status = 'ok'
- [ ] Store = 'cosmos'
- [ ] Ready endpoint returns store_reachable = true
- [ ] Agent-summary returns total = 4,339
- [ ] All 32 layers present in response

### Test Layer Queries

```powershell
$apiUrl = "https://<target-api-url>"

# Query each layer to verify data
$layers = @("services", "personas", "containers", "endpoints", "screens", "literals")

foreach ($layer in $layers) {
    $data = Invoke-RestMethod "$apiUrl/model/$layer/" -ErrorAction Continue
    $count = if ($data -is [array]) { $data.Count } else { 1 }
    Write-Host "[$layer] $count objects"
}

# Expected: All layers return expected counts (see original export summary)
```

**Layer Query Checklist:**
- [ ] services: 36 objects
- [ ] personas: 10 objects
- [ ] containers: 13 objects
- [ ] endpoints: 187 objects
- [ ] screens: 50 objects
- [ ] literals: 458 objects
- [ ] (All other layers also queryable)

---

## Phase 8: Final Verification

### Data Completeness

- [ ] Total objects in target = 4,339
- [ ] All 32 layers present
- [ ] Random sample of objects checked (5 from each layer)
- [ ] Cross-references verified (e.g., endpoints reference containers)
- [ ] No data loss detected

### API Functionality

- [ ] GET /health works
- [ ] GET /ready works
- [ ] GET /model/agent-summary works
- [ ] GET /model/{layer}/ works for all layers
- [ ] PUT /model/{layer}/{id} works (test with one object)
- [ ] Filter endpoints work (e.g., GET /model/endpoints/filter?status=implemented)

### Production Readiness

- [ ] API running in production mode (DEV_MODE=false)
- [ ] Authentication tokens configured
- [ ] Monitoring/alerting set up (Application Insights, Azure Monitor)
- [ ] Backup strategy in place
- [ ] Key Vault reference configured (if using vault for COSMOS_KEY)

---

## Post-Migration

### Documentation Updates

- [ ] README.md updated with target Cosmos URL
- [ ] STATUS.md updated: migration date, new endpoint
- [ ] ACCEPTANCE.md: add migration evidence
- [ ] Runbooks updated (RB-001: Key Vault reference for auto-rotation)

### Decommission Source (if applicable)

- [ ] Backup source Cosmos data (export JSON)
- [ ] Verify all services cut over to target
- [ ] Set retention policy (e.g., keep source 30 days for rollback)
- [ ] Eventually delete source Cosmos account

### Knowledge Transfer

- [ ] Migration process documented
- [ ] Team trained on new target infrastructure
- [ ] Disaster recovery plan updated
- [ ] On-call runbook updated

---

## Rollback Plan (if needed)

If migration fails or issues arise:

1. **Identify Issue**: Check API health, layer counts, specific failed queries
2. **Assess Severity**: Can it be fixed (rerun seed, fix environment), or rollback needed?
3. **Rollback Steps**:
   - [ ] Update API to point back to source Cosmos
   - [ ] Verify API health against source
   - [ ] Test layer queries against source
   - [ ] Investigate failure root cause
4. **Post-Rollback**:
   - [ ] Document what went wrong
   - [ ] Fix issues in target Cosmos
   - [ ] Re-test before retry
   - [ ] Schedule retry migration window

---

## Support & Escalation

### If You Encounter Issues

1. **Check logs**: Review API startup logs, seed script output, validation results
2. **Query data**: Manually verify Cosmos has data (`GET /model/agent-summary`)
3. **Check credentials**: Verify COSMOS_URL and COSMOS_KEY are correct
4. **Review runbook**: Check MIGRATION-RUNBOOK.md section "Troubleshooting"
5. **Escalate**: Contact EVA Data Model team with export date, target Cosmos name, error message

### Key Contact Information

- **Data Model Owners**: [project 37 team]
- **Cosmos DBA**: [Azure team]
- **API Deployment**: [DevOps team]

---

## Sign-Off

**Migration Date**: _______________  
**Completed By**: _______________  
**Verified By**: _______________  
**Approved By**: _______________  

**Notes**:  
___________________________________________________________________  
___________________________________________________________________  
