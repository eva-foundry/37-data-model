# Project 37 Tool Index

**Purpose**: Comprehensive catalog of all tools in `scripts/` directory to prevent tool recreation.  
**Last Updated**: March 8, 2026 (Session 41 Part 3)  
**Total Tools**: 80+

---

## 🚀 Deployment & Infrastructure

### Primary Deployment
- **`deploy-to-msub.ps1`** - Main deployment script (ACR build + Azure Container Apps)
  - Usage: `./deploy-to-msub.ps1 -tag "session-41-pr42"`
  - Tags image, pushes to ACR, deploys to Container App
  
### Infrastructure as Code
- **`deploy-infrastructure.ps1`** - Bicep deployment orchestrator
- **`deploy-containerapp-optimize.bicep`** - Container App Bicep template
- **`deploy-redis-infrastructure.ps1`** - Redis Cache deployment
- **`deploy-redis.bicep`** - Redis Bicep template
- **`deploy-target-cosmos.bicep`** - Cosmos DB Bicep template
- **`deploy-target-keyvault.bicep`** - Key Vault Bicep template
- **`generate-infrastructure-iac.ps1`** - Generate IaC from existing resources
- **`optimize-datamodel-infra.ps1`** - Infrastructure cost optimization

### Health & Readiness
- **`health-check.ps1`** - API health monitoring
- **`readiness-probe.ps1`** - Container readiness checks

---

## 💾 Data Loading & Seeding

### Primary Seeding
- **`seed-cosmos.py`** - Bulk load all 51 layer files into Cosmos DB
  - Requires: COSMOS_URL, COSMOS_KEY in .env
  - Usage: `python scripts/seed-cosmos.py`
  - ⚠️ Critical: `_LAYER_FILES` must include all 87 layers

- **`POST /model/admin/seed`** - HTTP endpoint to seed from model/*.json
  - Reads all files in `_LAYER_FILES` registry
  - Bulk loads into Cosmos DB
  
### Targeted Seeding
- **`seed-from-plan.py`** - Seed specific layers from PLAN.md governance files
- **`seed-governance-from-files.py`** - Seed governance layers from disk files
- **`seed-missing-projects.ps1`** - Add missing projects to projects layer

### Data Assembly
- **`assemble-model.ps1`** - Merge multiple JSON sources into unified model

---

## 🔍 Validation & Audit

### Comprehensive Audits
- **`comprehensive-layer-audit.ps1`** - **MAIN AUDIT TOOL**
  - Tests all 87 layers: availability, performance, FK relationships, consistency
  - Generates detailed report with pass/fail status
  - Usage: `./scripts/comprehensive-layer-audit.ps1`
  
- **`audit-layers.ps1`** - Layer integrity checks (schema compliance)
- **`check-all-data-sources.ps1`** - Verify all data sources operational
- **`validate-model.ps1`** - Schema validation against layer definitions

### Specific Audits
- **`audit-projects-json.py`** - Projects layer validation
- **`audit_missing_projects.py`** - Find projects not in data model
- **`validate_new_projects.py`** - New project entry validation
- **`evidence_validate.ps1`** - Evidence layer FK and integrity checks
- **`coverage-gaps.ps1`** - Coverage analysis for layers

### Query Tools
- **`query-model.ps1`** - Interactive query builder for data model
- **`evidence_query.py`** - Evidence layer query utilities
- **`check-report.py`** - Generate audit reports

---

## 🔄 Sync & Migration

### Cloud ↔ Local Sync
- **`sync-cloud-to-local.ps1`** - Download Cosmos DB to local JSON files
  - Exports all layers to model/*.json for local testing
  
- **`sync-cloud-local.ps1`** - Bidirectional cloud-local sync
- **`sync-from-source.ps1`** - Sync from authoritative source
- **`validate-cloud-sync.ps1`** - Verify sync operation success

### Evidence Sync (Critical for L05)
- **`sync-evidence-all-projects.py`** - Sync evidence from all 57 projects
  - Scans workspace folders for evidence/*.json files
  - Bulk uploads to Evidence Layer (L05)
  
- **`sync-evidence-from-51-aca.py`** - Evidence sync from Project 51 (ACA reference)
- **`sync-evidence.ps1` / `.sh`** - Evidence layer sync utilities

### Infrastructure Sync
- **`sync-azure-infrastructure.py`** - Sync Azure resources to L40-L47
- **`sync-azure-costs.ps1`** - Cost data sync to Cost Tracking (L29)
- **`sync-marco-inventory-to-model.py`** - Inventory sync to Resource Inventory (L42)

### Portal & Registry Sync
- **`register-portal-full-catalog.ps1`** - Register all services in portal catalog
- **`register-uiux-agentic.ps1`** - Register UI/UX agentic workflows
- **`patch-registry-table.ps1`** - Update service registry

---

## 💫 Data Backfill & Patching

### Backfill Operations
- **`backfill-metadata.ps1`** - Add missing metadata to existing records
- **`backfill-repo-lines.py`** - Add line count metrics to repos layer
- **`restore-v1-stories.py`** - Restore stories from v1 backup

### Field Patching
- **`patch-cosmos-fields.ps1`** - Batch update Cosmos DB fields
- **`patch-endpoint-fields.py`** - Add/update endpoint layer fields
- **`patch-wbs-pm-fields.ps1`** - Update WBS project management fields

### Metadata Operations
- **`add-missing-ep.py`** - Add missing endpoints to L11
- **`add-precedence-fields.ps1`** - Add FK precedence metadata
- **`reflect-ids.py`** - Generate and reflect FK IDs across layers
- **`stamp-dft.ps1` / `stamp-tft.ps1`** - Timestamp stamping utilities

---

## 📦 Backup & Recovery

### Backup
- **`BACKUP-README.md`** - Backup procedures documentation
- **Export via `/model/admin/export`** - Export all layers to ZIP
- **`EXPORT-FOR-MIGRATION.ps1`** - Prepare data for migration
- **`EXPORT-README.md`** - Export operation guide

### Recovery
- **`restore-from-backup.ps1`** - **PRIMARY RESTORE TOOL**
  - Restores from timestamped backup ZIPs
  - Validates before restore
  - Usage: `./restore-from-backup.ps1 -BackupFile <path>`
  
- **`recover-from-export-folder.ps1`** - Recover from export directory
- **`recover-from-old-production.ps1`** - Migrate from old production instance

### Secrets Management
- **`Export-PortableSecrets.ps1`** - Export secrets for migration
- **`Import-PortableSecrets.ps1`** - Import secrets to new Key Vault
- **`KEYVAULT-MIGRATION-QUICKREF.md`** - Key Vault migration guide
- **`KEYVAULT-SECRETS-GUIDE.md`** - Secrets management documentation

---

## 🤖 Agent & Workflow Tools

### Agent Performance
- **`record-agent-performance.ps1`** - Record metrics to Agent Performance Metrics (L40)
- **`update-agent-metrics-from-appinsights.ps1`** - Sync App Insights → L40

### ADO Integration
- **`ado-generate-artifacts.ps1`** - Generate Azure DevOps artifacts from data model

---

## 🔧 Maintenance & Utilities

### Project Initialization
- **`prime-project-scaffolding.ps1`** - Bootstrap new project structure
- **`rebuild-project37-complete.py`** - Rebuild Project 37 from scratch

### Debug Tools
- **`debug-evidence.py`** - Evidence layer debugging
- **`debug-folder-matching.py`** - Folder path matching debug
- **`debug-layers-api.ps1`** - API layer debugging
- **`debug-projects.py`** - Projects layer debugging

### Configuration
- **`config_loader.py`** - Configuration loading utilities
- **`gen-sprint-manifest.py`** - Generate sprint manifests
- **`quick-fix-minreplicas.ps1`** - Container App replica quick fix

### Analysis
- **`impact-analysis.ps1`** - Change impact analysis across layers
- **`find-aca.py`** - Azure Container Apps discovery

### Brain v2 Integration
- **`update-brain-v2-reality.ps1`** - Sync Brain v2 state to reality

### Governance
- **`export-governancefiles.py`** - Export governance documents
- **`upload-wbs-evidence-to-datamodel.py`** - WBS evidence upload

### Security
- **`grant-github-actions-permissions.ps1`** - Configure GitHub Actions RBAC

### Validation Fixes
- **`fix-portal-catalog-validation.ps1`** - Fix portal catalog validation errors

### Veritas Integration
- **`veritas-audit-rebuild-37.py`** - Rebuild Project 37 from EVA Veritas audit

---

## 🔑 Critical Tools by Use Case

### "I need to deploy changes to production"
1. Make code changes
2. Commit and push to main (via PR if protected)
3. `./deploy-to-msub.ps1 -tag "session-N-description"`
4. Wait for deployment
5. `POST /model/admin/seed` to load data (if JSON changed)
6. `./scripts/comprehensive-layer-audit.ps1` to verify

### "I need to add a new layer"
1. Create `model/layer-name.json`
2. Add to `api/routers/admin.py` `_LAYER_FILES` registry
3. Add to `scripts/seed-cosmos.py` `_LAYER_FILES` registry
4. Add router in `api/routers/` (if custom endpoints needed)
5. Update `layer-metadata-index.json`
6. Deploy + seed

### "I need to backup the data model"
1. `GET /model/admin/export` → downloads ZIP with all layers
2. Or use `./scripts/sync-cloud-to-local.ps1` → JSON files in model/

### "I need to restore from backup"
1. `./scripts/restore-from-backup.ps1 -BackupFile <path-to-zip>`
2. Or manual: extract ZIP → `python scripts/seed-cosmos.py`

### "I need to test all layers"
1. `./scripts/comprehensive-layer-audit.ps1`
2. Check report for failures
3. Fix issues and re-audit

### "I need to sync evidence from projects"
1. `python scripts/sync-evidence-all-projects.py`
2. Scans all 57 projects for evidence/*.json
3. Uploads to Evidence Layer (L05)

### "I need to see what's in production"
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
Invoke-RestMethod "$base/model/agent-summary"
Invoke-RestMethod "$base/model/layer-metadata/"
```

---

## ⚠️ DON'T RECREATE THESE TOOLS

These tools have been created multiple times in past sessions. **Always check this index first**:

- ✅ Layer audit tool → `comprehensive-layer-audit.ps1`
- ✅ Backup tool → `restore-from-backup.ps1` + `/admin/export`
- ✅ Seed tool → `seed-cosmos.py` + `POST /admin/seed`
- ✅ Sync evidence → `sync-evidence-all-projects.py`
- ✅ Sync cloud→local → `sync-cloud-to-local.ps1`
- ✅ Validate schema → `validate-model.ps1`
- ✅ Health check → `health-check.ps1`

---

## 📋 Missing Tools (To Be Created)

### Layer Creation Wizard
**Purpose**: Interactive wizard to create new layer end-to-end  
**Required**: 
- Create model/layer-name.json
- Update _LAYER_FILES in admin.py and seed-cosmos.py
- Create api/routers/layer_name.py router
- Update layer-metadata-index.json with FK relationships
- Generate tests

### FK Integration Analyzer
**Purpose**: Determine FK relationships between layers automatically  
**Required**:
- Analyze JSON schemas
- Detect ID references (project_id, service_id, etc.)
- Generate FK matrix
- Update layer-metadata-index.json

### Full Cosmos DB Backup/Restore Tool
**Purpose**: Complete Cosmos DB backup including all containers, stored procedures  
**Required**:
- Export all containers to JSON
- Export stored procedures, triggers, UDFs
- Restore to new Cosmos DB account
- Validate after restore

### Consistency Testing Framework
**Purpose**: Automated FK integrity testing across all 87 layers  
**Required**:
- Verify all FK references resolve
- Check for orphaned records
- Validate schema compliance
- Generate detailed report

### User Guide Generator
**Purpose**: Auto-generate model/user-guide.md from layer-metadata-index.json  
**Required**:
- Extract layer descriptions, endpoints, schemas
- Generate usage examples
- Include FK navigation patterns
- Keep synchronized with data model changes

---

## 📚 Related Documentation

- **Scripts README**: `scripts/README.md` (⚠️ needs creation)
- **Library Docs**: `docs/library/03-DATA-MODEL-REFERENCE.md`
- **Architecture**: `docs/architecture/`
- **User Guide**: `USER-GUIDE.md` (v2.5 - bootstrap and usage)
- **Session Summaries**: `docs/SESSION-41-COMPLETE-SUMMARY.md`

---

**Maintenance**: This index must be updated whenever new tools are created or existing tools are modified.  
**Location**: Include link to this file in `.github/copilot-instructions.md`
