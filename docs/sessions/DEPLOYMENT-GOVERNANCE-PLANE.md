# Governance Plane (L33-L34) Deployment Guide

**Created**: March 5, 2026  
**Feature Branch**: `feature/governance-plane-l33-l34`  
**PR URL**: https://github.com/eva-foundry/37-data-model/pull/new/feature/governance-plane-l33-l34  
**Status**: Ready for PR merge → ACA deployment

---

## Overview

This deployment adds the Governance Plane (L33-L34) to the EVA Data Model, enabling data-model-first architecture where bootstrap queries the API instead of reading 236 files.

**Changes**:
- Layer 33 (workspace_config): Workspace-level best practices, bootstrap rules
- Layer 34 (project_work): Queryable DPDCA session tracking
- Enhanced Layer 25 (projects): Added governance{} + acceptance_criteria[] fields
- Migration scripts for bidirectional governance data sync

**Impact**: Bootstrap eliminates 236 file reads (59 projects × 4 files) → 2 API calls

---

## Pre-Deployment Checklist

- [x] Code complete: 3 schemas, 2 routers, migration scripts
- [x] Documentation updated: README, PLAN, STATUS, ACCEPTANCE, library docs
- [x] Pilot seed data prepared: docs/governance-seed-pilot.json
- [x] Git commit: Comprehensive commit message (147 files, 135K+ lines)
- [x] Feature branch pushed: `feature/governance-plane-l33-l34`
- [ ] Pull request created (manual step)
- [ ] PR reviewed and merged to main (manual step)
- [ ] ACA deployment triggered (automatic or manual)

---

## Deployment Steps

### Step 1: Create Pull Request (Manual - 2 min)

1. Navigate to: https://github.com/eva-foundry/37-data-model/pull/new/feature/governance-plane-l33-l34
2. Title: "Governance Plane (L33-L34): Data-model-first architecture"
3. Description: Use commit message content (comprehensive changes documented)
4. Reviewers: (optional, or auto-merge if policy allows)
5. Create pull request

### Step 2: Merge Pull Request (Manual - 1 min)

1. Review changes (147 files, +135K lines)
2. Approve and merge to `main` branch
3. Delete feature branch after merge (cleanup)

### Step 3: Trigger ACA Deployment (Automatic or Manual - 5-10 min)

**Option A: Automatic (if CI/CD configured)**
- GitHub Actions workflow triggers on merge to main
- Builds container image with latest code
- Deploys to Azure Container Apps
- Monitor workflow for completion

**Option B: Manual (if no CI/CD)**
```powershell
# Authenticate to Azure
az login

# Set subscription context
az account set --subscription <subscription-id>

# Get ACA app name and resource group
$appName = "marco-eva-data-model"  # Verify actual name
$resourceGroup = "eva-foundry-rg"   # Verify actual RG

# Trigger revision deployment (pulls latest from ACR)
az containerapp update `
  --name $appName `
  --resource-group $resourceGroup `
  --revision-suffix governance-plane-$(Get-Date -Format "yyyyMMdd-HHmmss")

# Monitor deployment
az containerapp revision list `
  --name $appName `
  --resource-group $resourceGroup `
  --query "[].{name:name,active:properties.active,created:properties.createdTime}" `
  --output table
```

**Option C: Cloud Portal (if Azure CLI unavailable)**
1. Navigate to Azure Portal → Container Apps → marco-eva-data-model
2. Click "Revision Management"
3. Click "Create new revision"
4. Ensure "Pull from registry" is selected
5. Save and deploy

### Step 4: Verify Deployment (2-3 min)

Wait 2-3 minutes for ACA rollout, then test endpoints:

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

# Test 1: Health check
Invoke-RestMethod -Uri "$base/health" -Method Get

# Test 2: workspace_config endpoint exists (should return empty array, not 404)
Invoke-RestMethod -Uri "$base/model/workspace_config/" -Method Get

# Test 3: project_work endpoint exists (should return empty array, not 404)
Invoke-RestMethod -Uri "$base/model/project_work/" -Method Get

# Test 4: projects endpoint structure (check for new fields - will be empty until seeded)
$proj = Invoke-RestMethod -Uri "$base/model/projects/07-foundation-layer" -Method Get
$proj.PSObject.Properties.Name  # Should NOT include 'governance' yet (not seeded)
```

**Expected Results**:
- Health: `{"status": "ok", "store_type": "cosmos", ...}`
- workspace_config: `[]` (empty array, not 404)
- project_work: `[]` (empty array, not 404)
- projects: Existing fields only (governance fields exist in schema but not yet populated)

---

## Post-Deployment: Execute Pilot Deployment

Once endpoints are verified (Step 4 passes), execute pilot seed data deployment:

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
$pilotData = Get-Content "C:\eva-foundry\37-data-model\docs\governance-seed-pilot.json" -Raw | ConvertFrom-Json

# Step 1: PUT workspace_config
$workspaceConfig = $pilotData.workspace_config[0] | ConvertTo-Json -Depth 10
$result1 = Invoke-RestMethod `
  -Uri "$base/model/workspace_config/eva-foundry" `
  -Method Put `
  -Body $workspaceConfig `
  -ContentType "application/json" `
  -Headers @{'X-Actor'='agent:copilot'}
"[STEP 1] Workspace config deployed: $($result1.id)"

# Step 2: GET existing project, merge governance, PUT back
$existing = Invoke-RestMethod -Uri "$base/model/projects/07-foundation-layer" -Method Get
$governanceUpdate = $pilotData.project_governance_update

# Merge governance fields (PowerShell object merge)
$existing | Add-Member -NotePropertyName governance -NotePropertyValue $governanceUpdate.governance -Force
$existing | Add-Member -NotePropertyName acceptance_criteria -NotePropertyValue $governanceUpdate.acceptance_criteria -Force

$projectJson = $existing | ConvertTo-Json -Depth 10
$result2 = Invoke-RestMethod `
  -Uri "$base/model/projects/07-foundation-layer" `
  -Method Put `
  -Body $projectJson `
  -ContentType "application/json" `
  -Headers @{'X-Actor'='agent:copilot'}
"[STEP 2] Project governance deployed: $($result2.id)"

# Step 3: PUT project_work
$projectWork = $pilotData.project_work[0] | ConvertTo-Json -Depth 10
$result3 = Invoke-RestMethod `
  -Uri "$base/model/project_work/07-foundation-layer-2026-03-03" `
  -Method Put `
  -Body $projectWork `
  -ContentType "application/json" `
  -Headers @{'X-Actor'='agent:copilot'}
"[STEP 3] Project work deployed: $($result3.id)"
```

---

## Verification Queries

After pilot deployment, verify data-model-first architecture works:

```powershell
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

# Query 1: Workspace config (should return eva-foundry with best_practices{})
$workspace = Invoke-RestMethod -Uri "$base/model/workspace_config/eva-foundry" -Method Get
"Workspace: $($workspace.label), Projects: $($workspace.project_count)"
"Best practices: $($workspace.best_practices.encoding_safety)"

# Query 2: Project governance (should return governance{} + acceptance_criteria[])
$project = Invoke-RestMethod -Uri "$base/model/projects/07-foundation-layer" -Method Get
"Project: $($project.label)"
"Purpose: $($project.governance.purpose)"
"Key artifacts: $($project.governance.key_artifacts.Count) items"
"Acceptance gates: $($project.acceptance_criteria.Count) criteria"

# Query 3: Project work (should return session data with tasks[])
$work = Invoke-RestMethod -Uri "$base/model/project_work/?project_id=07-foundation-layer" -Method Get
"Active sessions: $($work.Count)"
"Latest session: $($work[0].session_summary.objective)"
"Tasks: $($work[0].tasks.Count) ($($work[0].tasks | Where-Object {$_.status -eq 'complete'}).Count completed)"
```

**Expected Output**:
```
Workspace: EVA Foundry Workspace, Projects: 56
Best practices: ASCII-only, no Unicode characters in production code
Project: 07-foundation-layer
Purpose: Core Responsibilities: 1) Project Scaffolding...
Key artifacts: 5 items
Acceptance gates: 3 criteria
Active sessions: 1
Latest session: Transform EVA Factory into fully portable, configuration-driven product
Tasks: 4 (4 completed)
```

---

## Rollback Plan (If Deployment Fails)

If ACA deployment fails or breaks existing functionality:

**Option 1: Revert to Previous Revision (Fastest - 2 min)**
```powershell
az containerapp revision list `
  --name marco-eva-data-model `
  --resource-group eva-foundry-rg `
  --query "[?properties.active==true].name" `
  --output tsv

# Activate previous revision
az containerapp revision activate `
  --name marco-eva-data-model `
  --resource-group eva-foundry-rg `
  --revision <previous-revision-name>
```

**Option 2: Revert Git Commit (If PR merged - 5 min)**
```powershell
cd C:\eva-foundry\37-data-model
git checkout main
git pull origin main
git revert HEAD~2..HEAD  # Revert governance plane commits
git push origin main
# Then re-deploy ACA
```

**Option 3: Manual Hotfix (If specific issue - 10 min)**
- Identify failing component (schema, router, etc.)
- Create hotfix branch
- Fix issue
- Fast-track PR and deploy

---

## Success Criteria

Deployment is successful when:

- [PASS] Health endpoint returns 200 OK with store_type=cosmos
- [PASS] `/model/workspace_config/` returns empty array (not 404)
- [PASS] `/model/project_work/` returns empty array (not 404)
- [PASS] Pilot deployment completes (3-step PUT sequence succeeds)
- [PASS] Governance queries return expected data structure
- [PASS] Existing functionality unchanged (projects, endpoints, screens queries work)
- [PASS] No errors in ACA logs

---

## Timeline

| Step | Duration | Cumulative |
|------|----------|------------|
| Create PR | 2 min | 2 min |
| Merge PR | 1 min | 3 min |
| ACA deployment | 5-10 min | 8-13 min |
| Verify endpoints | 2 min | 10-15 min |
| Execute pilot | 3 min | 13-18 min |
| Test queries | 2 min | 15-20 min |
| **Total** | **15-20 min** | **Production ready** |

---

## Next Steps After Deployment

1. Update workspace copilot-instructions.md to reference data-model-first query patterns
2. Migrate remaining 58 projects (seed-governance-from-files.py --all-projects)
3. Configure infrastructure optimizations (minReplicas=1, Application Insights, Redis cache)
4. Document bootstrap flow changes for all EVA agents

---

**Deployment Owner**: Marco / EVA AI COE  
**Support**: Review PLAN.md Feature F37-11 for full implementation details  
**Rollback Contact**: (Specify on-call engineer or escalation path)
