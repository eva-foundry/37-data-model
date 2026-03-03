# EVA Data Model -- Complete Export for Migration
# Exports all 32 layers + schemas + container metadata to a migration package
# Usage: .\EXPORT-FOR-MIGRATION.ps1 -OutputPath "C:\exports\eva-data-model-20260303"
# Version: 1.0.0
# Created: March 3, 2026

param(
    [string]$OutputPath = "C:\eva-data-model-export-$(Get-Date -Format 'yyyyMMdd-HHmm')",
    [string]$DataModelUrl = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
)

$ErrorActionPreference = "Stop"

Write-Host "[EXPORT] EVA Data Model Migration Package" -ForegroundColor Cyan
Write-Host "[EXPORT] Target folder: $OutputPath" -ForegroundColor Cyan
Write-Host ""

# Create output structure
$dirs = @(
    "$OutputPath\schemas",
    "$OutputPath\model-data",
    "$OutputPath\metadata",
    "$OutputPath\scripts",
    "$OutputPath\api-snippets"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "[OK] Created $dir"
}

Write-Host ""
Write-Host "[STEP 1] Export all 32 layer schemas" -ForegroundColor Cyan

try {
    $schemaDir = "C:\AICOE\eva-foundry\37-data-model\schema"
    Copy-Item "$schemaDir\*.schema.json" "$OutputPath\schemas\" -Force
    $schemaCount = (Get-ChildItem "$OutputPath\schemas\*.schema.json").Count
    Write-Host "[OK] Exported $schemaCount schema files"
} catch {
    Write-Host "[FAIL] Schema export failed: $_" -ForegroundColor Red
    throw
}

Write-Host ""
Write-Host "[STEP 2] Export all model data from API (32 layers)" -ForegroundColor Cyan

$layers = @(
    "services", "personas", "feature_flags", "containers", "endpoints", "schemas",
    "screens", "literals", "agents", "infrastructure", "requirements", "planes",
    "connections", "environments", "cp_skills", "cp_agents", "runbooks",
    "cp_workflows", "cp_policies", "components", "hooks", "ts_types", "mcp_servers",
    "prompts", "security_controls", "sprints", "wbs", "decisions", "risks", "milestones",
    "traces", "evidence"
)

$exportedLayers = 0
$failedLayers = @()

foreach ($layer in $layers) {
    try {
        $url = "$DataModelUrl/model/$layer/"
        $data = Invoke-RestMethod $url -ErrorAction Stop
        
        if ($data -is [array]) {
            $count = $data.Count
        } elseif ($data -is [object]) {
            $count = 1
        } else {
            $count = 0
        }
        
        $data | ConvertTo-Json -Depth 20 | Out-File "$OutputPath\model-data\${layer}.json" -Encoding UTF8
        Write-Host "[OK] Layer '$layer': $count objects"
        $exportedLayers++
    } catch {
        Write-Host "[WARN] Layer '$layer' export failed: $_" -ForegroundColor Yellow
        $failedLayers += $layer
    }
    
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "[RESULT] Exported $exportedLayers of $($layers.Count) layers" -ForegroundColor Cyan
if ($failedLayers.Count -gt 0) {
    Write-Host "[WARN] Failed layers: $($failedLayers -join ', ')" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[STEP 3] Export Cosmos container metadata" -ForegroundColor Cyan

try {
    # Query health to get store info
    $health = Invoke-RestMethod "$DataModelUrl/health" -ErrorAction Stop
    $ready = Invoke-RestMethod "$DataModelUrl/ready" -ErrorAction Stop
    $summary = Invoke-RestMethod "$DataModelUrl/model/agent-summary" -ErrorAction Stop
    
    $metadata = @{
        export_date = (Get-Date -Format 'u')
        source_endpoint = $DataModelUrl
        store_type = $health.store
        store_version = $health.version
        total_objects = $summary.total
        layer_counts = $summary.by_layer
        cosmos_info = @{
            database_name = "evamodel"
            container_name = "model_objects"
            partition_key = "layer"
            indexing_policy = "automatic (Cosmos DB default)"
            ttl = -1 # Disabled
            throughput = "autoscale (recommended for production)"
        }
        configuration = @{
            cosmos_url_env = "COSMOS_URL"
            cosmos_key_env = "COSMOS_KEY"
            model_db_name_env = "MODEL_DB_NAME"
            model_container_name_env = "MODEL_CONTAINER_NAME"
            default_values = @{
                model_db_name = "evamodel"
                model_container_name = "model_objects"
            }
        }
    }
    
    $metadata | ConvertTo-Json -Depth 10 | Out-File "$OutputPath\metadata\cosmos-metadata.json" -Encoding UTF8
    Write-Host "[OK] Exported Cosmos metadata"
    Write-Host "     Database: evamodel"
    Write-Host "     Container: model_objects"
    Write-Host "     Total objects: $($summary.total)"
    Write-Host "     Layers: $($summary.by_layer.Count)"
} catch {
    Write-Host "[FAIL] Metadata export failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "[STEP 4] Export deployment scripts" -ForegroundColor Cyan

$scripts = @(
    "seed-cosmos.py",
    "validate-model.ps1",
    "assemble-model.ps1",
    "seed-from-plan.py"
)

$copiedScripts = 0
foreach ($script in $scripts) {
    $srcPath = "C:\AICOE\eva-foundry\37-data-model\scripts\$script"
    if (Test-Path $srcPath) {
        Copy-Item $srcPath "$OutputPath\scripts\" -Force
        Write-Host "[OK] Copied $script"
        $copiedScripts++
    } else {
        Write-Host "[WARN] Script not found: $script" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[STEP 5] Export API configuration reference" -ForegroundColor Cyan

try {
    Copy-Item "C:\AICOE\eva-foundry\37-data-model\api\config.py" "$OutputPath\api-snippets\config.py" -Force
    Write-Host "[OK] Copied api/config.py (reference)"
} catch {
    Write-Host "[WARN] Could not copy config.py" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[STEP 6] Create migration runbook" -ForegroundColor Cyan

$runbook = @"
# EVA Data Model -- Migration Runbook

## Export Information
- Export Date: $(Get-Date -Format 'u')
- Source: $DataModelUrl
- Exported Layers: $exportedLayers / $($layers.Count)
- Total Objects: $($summary.total)

## Directory Structure

\`\`\`
export-package/
  schemas/              - All 23 schema files (*.schema.json)
  model-data/           - All layer JSON exports (32 files)
  metadata/             - Cosmos metadata + configuration
  scripts/              - Deployment scripts (seed-cosmos.py, validate-model.ps1, etc.)
  api-snippets/         - API configuration reference
  MIGRATION-RUNBOOK.md  - This file
\`\`\`

## Prerequisites for Target Cosmos

Before running the import, ensure you have:

1. **Target Subscription**: Access to target Azure subscription
2. **Target Resource Group**: Created RG in target subscription
3. **Target Cosmos DB Account**: 
   - Database name: \`evamodel\`
   - Container name: \`model_objects\`
   - Partition key: \`/layer\`
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

\`\`\`powershell
# 1. Create Cosmos DB Account (if not exists)
az cosmosdb create \`
  --name <target-cosmos-name> \`
  --resource-group <target-rg> \`
  --locations regionName=<region> failoverPriority=0 \`
  --default-consistency-level Strong

# 2. Create database
az cosmosdb sql database create \`
  --resource-group <target-rg> \`
  --account-name <target-cosmos-name> \`
  --name evamodel

# 3. Create container
az cosmosdb sql container create \`
  --resource-group <target-rg> \`
  --account-name <target-cosmos-name> \`
  --database-name evamodel \`
  --name model_objects \`
  --partition-key-path /layer \`
  --throughput 400000 \`
  --indexing-policy '{\"indexingMode\":\"consistent\",\"automatic\":true}'

# 4. Get connection details
az cosmosdb keys list --resource-group <target-rg> --name <target-cosmos-name>
az cosmosdb show --resource-group <target-rg> --name <target-cosmos-name> --query documentEndpoint -o tsv
\`\`\`

### Phase 2: Validate Schemas

\`\`\`powershell
# Copy schemas to target environment
# Validate that all 23 schemas are present:
Get-ChildItem "schemas\" -Filter "*.schema.json" | Measure-Object
# Expected: 23 items
\`\`\`

### Phase 3: Seed Target Cosmos

\`\`\`powershell
# Set environment variables
\$env:COSMOS_URL = "https://<target-cosmos>.documents.azure.com:443/"
\$env:COSMOS_KEY = "<your-primary-key>"
\$env:MODEL_DB_NAME = "evamodel"
\$env:MODEL_CONTAINER_NAME = "model_objects"

# Activate Python venv (if applicable)
# & "C:\path\to\.venv\Scripts\Activate.ps1"

# Run seed script
python scripts/seed-cosmos.py --cosmos-url \$env:COSMOS_URL --cosmos-key \$env:COSMOS_KEY

# Expected output: Seeding complete, N objects inserted (N = total objects from metadata)
\`\`\`

### Phase 4: Validate Data Integrity

\`\`\`powershell
# Run validation scripts
.\scripts\validate-model.ps1

# Run assembly check
.\scripts\assemble-model.ps1

# Expected: All scripts exit with 0 (success)
\`\`\`

### Phase 5: Deploy API to New Cosmos

Update your API environment variables:

\`\`\`
COSMOS_URL=https://<target-cosmos>.documents.azure.com:443/
COSMOS_KEY=<target-primary-key>
MODEL_DB_NAME=evamodel
MODEL_CONTAINER_NAME=model_objects
DEV_MODE=false
\`\`\`

Then redeploy API container (ACA, Docker, etc.)

### Phase 6: Health Check

\`\`\`powershell
# Test health endpoint
Invoke-RestMethod "https://<target-api-url>/health" | Select-Object status, store

# Expected: \`\`\`{ status: 'ok', store: 'cosmos' }\`\`\`

# Test agent-summary (should return all 32 layers with counts)
Invoke-RestMethod "https://<target-api-url>/model/agent-summary"

# Expected: total=$($summary.total), all layers populated
\`\`\`

## Verification Checklist

- [ ] All 23 schemas copied
- [ ] All $exportedLayers model JSON files exported
- [ ] Cosmos metadata reviewed and understood
- [ ] Target Cosmos account created with correct settings
- [ ] Target database (evamodel) created
- [ ] Target container (model_objects) created with partition key /layer
- [ ] Connection credentials verified (COSMOS_URL, COSMOS_KEY)
- [ ] Seed script executed successfully
- [ ] validate-model.ps1 exits with 0
- [ ] assemble-model.ps1 exits with 0
- [ ] API health check returns { status: 'ok', store: 'cosmos' }
- [ ] agent-summary returns total=$($summary.total) with all 32 layers

## Troubleshooting

### Issue: "Unauthorized" errors during seed
**Cause**: COSMOS_KEY is invalid or rotated
**Fix**: Verify key with \`az cosmosdb keys list\`

### Issue: "Container not found"
**Cause**: Container name mismatch (case-sensitive)
**Fix**: Ensure container is exactly named \`model_objects\` (lowercase)

### Issue: "Partition key mismatch"
**Cause**: Created container with wrong partition key path
**Fix**: Delete container and recreate with \`/layer\` as partition key

### Issue: "Timeout during seed"
**Cause**: Throughput too low (under 400 RU/s)
**Fix**: Increase autoscale to 4,000-400,000 RU/s

## Support

For questions or issues:

1. Check STATUS.md for recent incident reports
2. Review USER-GUIDE.md section 3 (API bootstrap)
3. Query health endpoint: \`GET /health\`
4. Query summary: \`GET /model/agent-summary\`

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

### Model Data ($exportedLayers files exported from API)
All layer data exported as individual JSON files:
agents.json, components.json, containers.json, decisions.json, endpoints.json, etc.

### Scripts
- seed-cosmos.py - Primary seeding tool
- validate-model.ps1 - Schema validation
- assemble-model.ps1 - Model assembly check
- seed-from-plan.py - Optional: seed from PLAN.md

### Metadata
- cosmos-metadata.json - Configuration reference
"@

$runbook | Out-File "$OutputPath\MIGRATION-RUNBOOK.md" -Encoding UTF8
Write-Host "[OK] Created MIGRATION-RUNBOOK.md"

Write-Host ""
Write-Host "[STEP 7] Create summary report" -ForegroundColor Cyan

$summary_report = @"
# EVA Data Model Export Summary

**Export Date**: $(Get-Date -Format 'u')
**Export Location**: $OutputPath
**Source**: $DataModelUrl

## Statistics

- **Total Objects**: $($summary.total)
- **Layers Exported**: $exportedLayers / $($layers.Count)
- **Schema Files**: $schemaCount
- **Scripts Included**: $copiedScripts

## Export Manifest

$($dirs | ForEach-Object {
    $itemCount = @(Get-ChildItem $_ -File -Recurse).Count
    "- {0}: $itemCount files" -f (Split-Path $_ -Leaf)
})

## Next Steps

1. Review MIGRATION-RUNBOOK.md for detailed migration steps
2. Prepare target Cosmos DB account in new subscription/RG
3. Run seed-cosmos.py against target Cosmos
4. Validate with validate-model.ps1 and assemble-model.ps1
5. Deploy API pointing to new Cosmos instance

---
Export generated by EXPORT-FOR-MIGRATION.ps1
EVA Data Model v1.0.0
"@

$summary_report | Out-File "$OutputPath\EXPORT-SUMMARY.md" -Encoding UTF8
Write-Host "[OK] Created EXPORT-SUMMARY.md"

Write-Host ""
Write-Host "[STEP 8] Package for distribution" -ForegroundColor Cyan

$zipPath = "$OutputPath.zip"
Compress-Archive -Path $OutputPath -DestinationPath $zipPath -Force
$zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "[OK] Created $zipPath ($zipSize MB)"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "EXPORT COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Location:     $OutputPath" -ForegroundColor Cyan
Write-Host "ZIP Package:  $zipPath" -ForegroundColor Cyan
Write-Host "Size:         $zipSize MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Read MIGRATION-RUNBOOK.md for migration steps" -ForegroundColor Yellow
Write-Host ""
