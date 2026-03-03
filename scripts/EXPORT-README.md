# EVA Data Model -- Complete Migration Package

**Export Date**: March 3, 2026  
**Source**: https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io  
**Total Objects**: 4,339 across 32 layers  
**Export Status**: COMPLETE - All necessary artifacts included  

---

## Quick Start

This package contains **everything needed** to migrate the entire EVA Data Model to a new Azure Cosmos DB instance in a different subscription/resource group.

### What's Included

```
eva-data-model-export-20260303/
├── schemas/                      - All 22 JSON schema definitions
├── model-data/                   - All 32 layer data files (4,339 objects)
├── metadata/                     - Cosmos configuration reference
├── scripts/                      - Deployment and validation scripts
├── api-snippets/                 - API configuration reference
├── MIGRATION-RUNBOOK.md          - Detailed step-by-step migration guide
├── MIGRATION-CHECKLIST.md        - Complete operations checklist
├── EXPORT-SUMMARY.md             - Summary statistics
└── README.md                      - This file
```

### 3-Minute Overview

1. **Prepare Target** (10 min):
   - Create Cosmos DB account in target subscription/RG
   - Use included Bicep template: `deploy-target-cosmos.bicep`
   - Get connection credentials (COSMOS_URL, COSMOS_KEY)

2. **Seed Data** (5-10 min):
   - Run: `python scripts/seed-cosmos.py`
   - Monitor: 4,339 objects imported

3. **Validate** (2 min):
   - Run: `.\scripts\validate-model.ps1`
   - Confirm: All 32 layers, 0 violations

4. **Deploy API** (varies):
   - Update environment: COSMOS_URL, COSMOS_KEY
   - Redeploy API container
   - Test: `GET /health` → status=ok

---

## Files Overview

### 1. Schemas (22 files)

Complete schema definitions for all 32 layers in JSON Schema format.

```
agent.schema.json                   - Agent definitions
component.schema.json               - React components
container.schema.json               - Cosmos DB containers
decision.schema.json                - Architecture decisions
endpoint.schema.json                - HTTP API endpoints
evidence.schema.json                - DPDCA phase completion receipts
feature_flag.schema.json            - Feature flags
hook.schema.json                    - React custom hooks
infrastructure.schema.json          - Azure infrastructure resources
literal.schema.json                 - UI text strings (i18n keys)
mcp_server.schema.json              - MCP server definitions
milestone.schema.json               - Project milestones
persona.schema.json                 - User personas/roles
prompt.schema.json                  - LLM system prompts
requirement.schema.json             - Business requirements
risk.schema.json                    - Risk register
screen.schema.json                  - UI screens
security_control.schema.json        - ITSG-33 security controls
service.schema.json                 - Microservices
sprint.schema.json                  - Sprint definitions
trace.schema.json                   - Execution traces
ts_type.schema.json                 - TypeScript types
```

### 2. Model Data (32 files)

Exported layer data from the source Cosmos DB. Each file contains all objects for that layer.

| Layer | Count | Purpose |
|-------|-------|---------|
| services | 36 | Microservices + metadata |
| personas | 10 | User roles (admin, translator, viewer, etc.) |
| feature_flags | 15 | Feature gates |
| containers | 13 | Cosmos DB container definitions |
| endpoints | 187 | HTTP API routes |
| schemas | 39 | TypeScript/JSON schemas |
| screens | 50 | React UI screens |
| literals | 458 | UI text strings (i18n) |
| agents | 10 | AI agents |
| infrastructure | 46 | Azure resources (ACA, APIM, etc.) |
| requirements | 29 | Business requirements |
| planes | 3 | Control plane taxonomy |
| connections | 4 | OAuth2, GitHub App, Managed Identity |
| environments | 3 | DEV, STG, PROD |
| cp_skills | 7 | Control plane skills |
| cp_agents | 4 | Control plane agents |
| runbooks | 4 | Operational runbooks |
| cp_workflows | 2 | Control plane workflows |
| cp_policies | 3 | Guardrails + approval gates |
| components | 32 | Fluent UI v9 components |
| hooks | 19 | Custom React hooks |
| ts_types | 26 | TypeScript type definitions |
| mcp_servers | 4 | MCP server definitions |
| prompts | 5 | Prompty templates |
| security_controls | 10 | OWASP LLM Top 10 + ITSG-33 |
| sprints | 20 | Sprint planning data |
| wbs | 3,212 | Work breakdown structure (stories/tasks) |
| decisions | 4 | Architecture decision records |
| risks | 5 | Risk register |
| milestones | 4 | Project milestones |
| traces | 1 | Execution trace samples |
| evidence | 1 | DPDCA phase completion sample |
| **TOTAL** | **4,339** | **All objects** |

### 3. Metadata

- **cosmos-metadata.json**: Cosmos configuration reference
  - Database name: evamodel
  - Container name: model_objects
  - Partition key: /layer
  - Throughput: 400,000 RU/s autoscale
  - TTL: disabled (-1)

### 4. Scripts

Essential operational scripts:

- **seed-cosmos.py** - Primary seeding tool
  - Imports all layers into target Cosmos
  - Usage: `python seed-cosmos.py`
  - Requires: COSMOS_URL, COSMOS_KEY env vars

- **validate-model.ps1** - Schema validation
  - Checks all 32 layers present
  - Validates cross-references
  - Ensures no orphaned objects

- **assemble-model.ps1** - Assembly check
  - Counts objects per layer
  - Verifies total count (4,339)
  - Checks integrity

- **seed-from-plan.py** - Optional: seed from PLAN.md
  - Used when refreshing from source PLAN.md
  - Useful for partial updates

- **deploy-target-cosmos.bicep** - Infrastructure as Code
  - Creates complete Cosmos infrastructure
  - Usage: `az deployment group create -g <rg> -f deploy-target-cosmos.bicep --parameters cosmosAccountName=<name> location=<region>`
  - Output: Cosmos endpoint, database ID, environment variables

### 5. API Reference

- **config.py** - API configuration documentation
  - Environment variables
  - Default values
  - Mode selection (Cosmos vs MemoryStore)

---

## Migration Path

### Prerequisites

1. **Azure Subscription Access**
   - Target subscription (different from source)
   - Permissions: Create Cosmos DB account, manage keys
   - Budget approval for autoscale Cosmos (estimated $200-400/month)

2. **Tools**
   - Azure CLI: `az --version` (v2.52+)
   - PowerShell: `pwsh --version` (v7+)
   - Python: `python --version` (3.10+)

3. **Network/Connectivity**
   - Access to target Cosmos endpoint (public or via VPN)
   - API deployment mechanism ready (Docker, ACA, App Service, etc.)

### Step-by-Step Migration

#### Phase 1: Prepare Target Cosmos (30 min)

```bash
# Option A: Use Bicep (recommended)
az deployment group create \
  -g <TARGET_RG> \
  -f scripts/deploy-target-cosmos.bicep \
  --parameters \
    cosmosAccountName=<my-cosmos-name> \
    location=canadacentral

# Option B: Manual CLI commands (see MIGRATION-RUNBOOK.md)
```

**Expected Output**: Cosmos account created, database seeded, container ready

#### Phase 2: Get Credentials (5 min)

```bash
COSMOS_URL=$(az cosmosdb show -g <RG> --name <COSMOS_NAME> --query documentEndpoint -o tsv)
COSMOS_KEY=$(az cosmosdb keys list -g <RG> --name <COSMOS_NAME> --query primaryMasterKey -o tsv)

echo "COSMOS_URL=$COSMOS_URL"
echo "COSMOS_KEY=$COSMOS_KEY"
```

**Expected Output**: Two connection credentials ready to use

#### Phase 3: Seed Data (10-15 min)

```bash
cd scripts

# Set environment
export COSMOS_URL="https://<your-cosmos>.documents.azure.com:443/"
export COSMOS_KEY="<your-primary-key>"
export MODEL_DB_NAME="evamodel"
export MODEL_CONTAINER_NAME="model_objects"

# Seed
python seed-cosmos.py

# Expected: "Seeding complete. 4339 objects imported."
```

**Expected Output**: All layers seeded, no errors

#### Phase 4: Validate (5 min)

```bash
.\validate-model.ps1
# Expected: PASS 0 violations

.\assemble-model.ps1
# Expected: Total 4339, all layers OK
```

**Expected Output**: All checks pass

#### Phase 5: Deploy API (varies: 10-60 min)

Update API environment and redeploy:

```bash
# Environment variables
COSMOS_URL=https://<target-cosmos>.documents.azure.com:443/
COSMOS_KEY=<target-primary-key>
MODEL_DB_NAME=evamodel
MODEL_CONTAINER_NAME=model_objects
DEV_MODE=false

# Redeploy (Docker/ACA/App Service/etc.)
# ... (your deployment mechanism)
```

**Expected Output**: API healthy, responding to requests

#### Phase 6: Verify (5 min)

```bash
curl https://<target-api>/health
# Expected: {"status":"ok","store":"cosmos"}

curl https://<target-api>/model/agent-summary
# Expected: total=4339, store=cosmos
```

**Expected Output**: All health checks green

---

## Documentation Files

### MIGRATION-RUNBOOK.md
Detailed, step-by-step guide with:
- Infrastructure setup options
- Seed execution and troubleshooting
- Validation procedures
- API deployment guidance
- Rollback procedures

**Read This First** for comprehensive migration instructions.

### MIGRATION-CHECKLIST.md
Complete operational checklist with:
- Pre-migration planning
- Phase-by-phase tasks
- Health check procedures
- Troubleshooting matrix
- Sign-off section

**Use This During Migration** to track progress and verify each phase.

### EXPORT-SUMMARY.md
Summary statistics and manifest.

---

## Important Notes

### Cosmos Configuration

- **Database Name**: `evamodel` (configurable, but use default)
- **Container Name**: `model_objects` (required, exact match)
- **Partition Key**: `/layer` (MUST be this exact value)
- **Throughput**: 400,000 RU/s autoscale recommended
- **TTL**: Disabled (-1)
- **Indexing**: Automatic (Cosmos default)

### Data Integrity

- All 4,339 objects are self-contained (no external references)
- Row versions are reinitialized on import (OK, expected)
- Modified_at timestamps are preserved
- Layer information is critical (partition key) — do not modify

### Security

- COSMOS_KEY is sensitive — store in Key Vault in production
- Do not commit credentials to git
- Use managed identity if deploying to ACA/App Service
- Rotate credentials after migration

### Performance

- Initial seed: ~2-5 RU per object (total ~8,000-20,000 RU)
- After seed: Read-heavy queries (reports, admin portal) use 10-50 RU/query
- Write operations (7 skills in control plane) use 10-20 RU/write
- Autoscale 4,000-400,000 handles all normal + spike loads

---

## Troubleshooting

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `Unauthorized` | Invalid COSMOS_KEY | Verify key with `az cosmosdb keys list` |
| `ContainerNotFound` | Wrong container name | Use exactly `model_objects` |
| `PartitionKeyMismatch` | Wrong partition key | Recreate container with `/layer` |
| `RequestTimeout` | Throughput too low | Increase autoscale max to 400,000 |
| `Forbidden` | Stale credential | Get new key, update env vars |
| Health check fails | API can't reach Cosmos | Verify COSMOS_URL, COSMOS_KEY, network |

### Verification Commands

```bash
# Test Cosmos connectivity
curl -X GET \
  -H "Authorization: Bearer <token>" \
  https://<cosmos>.documents.azure.com/dbs/evamodel/colls/model_objects

# Test API health
curl https://<api>/health

# Test data import
curl https://<api>/model/services | jq '.[] | select(.id == "eva-brain-api")'
```

---

## Support

### Issues During Migration?

1. **Check MIGRATION-RUNBOOK.md** - Section "Troubleshooting"
2. **Review logs** - seed-cosmos.py stdout, API startup logs
3. **Verify credentials** - COSMOS_URL, COSMOS_KEY correct?
4. **Test connectivity** - `az cosmosdb show`, `curl /health`
5. **Escalate** - Contact EVA team with:
   - Export date (20260303)
   - Target Cosmos name
   - Error message
   - Step where it failed

### Documentation References

- EVA Data Model User Guide: `C:\AICOE\eva-foundry\37-data-model\USER-GUIDE.md`
- API Bootstrap Guide: `C:\AICOE\eva-foundry\37-data-model\copilot-instructions.md#3-eva-data-model-api`
- Cosmos Best Practices: `C:\AICOE\eva-foundry\18-azure-best\02-well-architected\reliability.md`

---

## Post-Migration Tasks

- [ ] Update API documentation with new endpoint
- [ ] Update runbooks (RB-001: auto-key-rotation via Key Vault)
- [ ] Set up Azure Monitor alerts (Cosmos throttling, API errors)
- [ ] Configure backup/restore procedures for target
- [ ] Train team on new infrastructure
- [ ] Update disaster recovery plan

---

## Size & Timing Reference

| Phase | Duration | Size |
|-------|----------|------|
| Download export | 2-5 min | 2-3 MB zip |
| Prepare target Cosmos | 10-15 min | — |
| Get credentials | 2-3 min | — |
| Seed data | 5-10 min | ~4,339 objects, ~20-50 MB written |
| Validate | 2-3 min | — |
| Deploy API | 5-60 min | (depends on deployment mechanism) |
| Verify | 2-3 min | — |
| **Total** | **30-90 min** | **Data: ~50 MB + Cosmos storage** |

---

## License & Attribution

EVA Data Model v1.0.0  
Part of EVA Foundation (37-data-model)  
Copyright 2024-2026 - All rights reserved  

Export generated March 3, 2026  
Migration Package v1.0  

---

**Ready to migrate? Start with MIGRATION-RUNBOOK.md**
