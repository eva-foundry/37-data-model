# Session 41 - Next Steps Guide

**Created**: March 8, 2026 @ 1:05 AM  
**Status**: Organization complete, deployment pending  
**Objective**: Complete Session 41 data deployment to Cosmos DB

---

## ✅ What's Been Completed (Session 41 Part 3 - Organization Phase)

### Documentation Organized
1. ✅ **SESSION-41-COMPLETE-SUMMARY.md** - Complete architecture understanding (local vs production)
2. ✅ **TOOL-INDEX.md** - Comprehensive catalog of 80+ scripts (prevents tool recreation)
3. ✅ **DOCUMENTATION-STRUCTURE.md** - Documentation maintenance guide
4. ✅ Updated `.github/copilot-instructions.md` - Added tool index reference
5. ✅ Moved 12+ old session documents to `docs/sessions/`
6. ✅ Moved 6+ FK enhancement docs to `docs/architecture/`
7. ✅ Moved 3+ phase reports to `docs/sessions/`

### Code Fixed Locally (Not Yet Deployed)
1. ✅ Fixed `api/routers/admin.py` - `_LAYER_FILES` now includes all 51 layers (was 47)
2. ✅ Fixed `scripts/seed-cosmos.py` - Synced with admin.py
3. ✅ Committed locally: `329ce33` - "fix(admin): add all 51 layers to _LAYER_FILES..."
4. ❌ **Cannot push to main** - branch protected, requires PR

---

## 🔴 Critical Issue: Data Not in Cosmos DB

### Current State

| Component | Status | Data Count |
|-----------|--------|------------|
| **Git (model/*.json)** | ✅ Complete | 1,135 records (51 layers) |
| **Container App** | 🔄 Deploying | session-41-pr42 image |
| **Cosmos DB** | ❌ Old data | ~1,272 records (pre-Session 41) |
| **_LAYER_FILES** | ⚠️ Incomplete in deployed code | Only 47 layers registered |

### The Problem

1. **PR #42 merged** (12:54 AM) → JSON files in Git ✅
2. **Deployment started** (12:55 AM) → Building container ✅  
3. **BUT**: Deployed code has OLD `_LAYER_FILES` (47 layers) ❌
4. **AND**: Data never loaded into Cosmos DB ❌

### Why It Matters

The msub API serves **all 57 EVA projects**. If Cosmos DB has incomplete data:
- ❌ Agents query for stories, tasks, repos, etc. → get empty results
- ❌ FK relationships break (project_id references fail)
- ❌ Evidence Layer missing 30+ new records
- ❌ Quality gates fail (missing verification_records)

---

## 📋 Next Steps (In Order)

### Step 1: Wait for Current Deployment ⏳

**Action**: Let `session-41-pr42` deployment complete  
**Why**: Sunk cost, will finish in ~5-10 minutes  
**Verify**:
```powershell
# Check deployment status (replace with correct resource group if different)
az containerapp revision list `
  --name msub-eva-data-model `
  --resource-group rg-eva-data-model `
  --query "[0].{Name:name, Active:properties.active, ProvisioningState:properties.provisioningState}" `
  --output table

# Or check via API
Invoke-RestMethod "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/health"
```

**Expected**: `ProvisioningState: Succeeded`, `Active: true`

---

### Step 2: Create PR #43 for _LAYER_FILES Fix 📝

**Action**: Create pull request with the local commit (329ce33)

**Commands**:
```powershell
cd C:\eva-foundry\37-data-model

# Create feature branch for PR
git checkout -b fix/layer-files-registry-51-layers

# Cherry-pick the local commit to feature branch
git cherry-pick 329ce33

# Push feature branch
git push origin fix/layer-files-registry-51-layers

# Create PR (or use GitHub web UI)
gh pr create `
  --title "fix(admin): Add all 51 layers to _LAYER_FILES registry" `
  --body "## Purpose
Complete the _LAYER_FILES registry to include all 51 operational layers.

## Problem
- Only 47/51 layers were registered in api/routers/admin.py
- Missing 32 layers populated in Session 41 (stories, tasks, repos, etc.)
- POST /model/admin/seed would skip these layers

## Solution
- Updated _LAYER_FILES in api/routers/admin.py (51 layers, organized by L01-L51)
- Updated _LAYER_FILES in scripts/seed-cosmos.py (synced)
- All new layers from Session 41 now included

## Impact
- Enables seeding of all 1,135 records to Cosmos DB
- All 57 EVA projects can query complete data model
- FK relationships work correctly (no missing references)

## Testing
- Verified all 51 layer names match model/*.json files
- Organized by operational categories (L01-L05, L06-L10, etc.)
- No duplicates or stale entries

Closes #<issue-number-if-exists>
" `
  --base main
```

**Alternative**: Use GitHub web UI
1. Go to https://github.com/<org>/37-data-model
2. Click "Compare & pull request" for branch `fix/layer-files-registry-51-layers`
3. Fill in title and description
4. Create PR

---

### Step 3: Merge PR #43 ✅

**Action**: Review and merge the PR

**Review Checklist**:
- [ ] All 51 layers present in `_LAYER_FILES`
- [ ] No duplicate entries
- [ ] Organized by L01-L51 categories
- [ ] Both `admin.py` and `seed-cosmos.py` updated
- [ ] Commit message clear and descriptive

**Merge**:
```powershell
# If using gh CLI
gh pr merge --squash --delete-branch

# Or use GitHub web UI "Squash and merge"
```

---

### Step 4: Deploy Fixed Code 🚀

**Action**: Deploy with updated `_LAYER_FILES` registry

**Commands**:
```powershell
cd C:\eva-foundry\37-data-model

# Pull latest main (includes PR #43)
git checkout main
git pull origin main

# Deploy with descriptive tag
.\deploy-to-msub.ps1 -tag "session-41-data-fix"
```

**Expected Output**:
```
[INFO] Building Docker image: mcr.microsoft.com/msub-eva-data-model:session-41-data-fix
[INFO] Pushing to Azure Container Registry...
[INFO] Deploying to Azure Container Apps...
[SUCCESS] Deployment complete
```

**Verify Deployment**:
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

# Check health
Invoke-RestMethod "$base/health"

# Check version (should show new revision)
Invoke-RestMethod "$base/model/agent-guide" | Select version
```

---

### Step 5: Seed Cosmos DB with All 1,135 Records 📊

**Action**: Load all 51 layers into Cosmos DB

**Command**:
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

# Trigger seed operation
Invoke-RestMethod `
  -Uri "$base/model/admin/seed" `
  -Method POST `
  -ContentType "application/json"
```

**Expected Output**:
```json
{
  "status": "success",
  "layers_seeded": 51,
  "total_records": 1135,
  "duration_seconds": 12.4,
  "layers": [
    {"layer": "projects", "count": 57},
    {"layer": "sprints", "count": 43},
    {"layer": "stories", "count": 152},
    {"layer": "tasks", "count": 381},
    // ... all 51 layers ...
  ]
}
```

**If Seed Fails**:
```powershell
# Check logs
az containerapp logs show `
  --name msub-eva-data-model `
  --resource-group rg-eva-data-model `
  --follow

# Or check API errors
Invoke-RestMethod "$base/model/admin/seed" -Method POST -Verbose
```

---

### Step 6: Verify All 51 Layers Operational ✅

**Action**: Comprehensive verification that all data is in Cosmos DB

**Verification Script**:
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

# Check agent summary (all layer counts)
$summary = Invoke-RestMethod "$base/model/agent-summary"
Write-Host "`n=== AGENT SUMMARY ===" -ForegroundColor Cyan
$summary | Format-List

# Verify session_41_reload_marker exists
if (-not $summary.session_41_reload_marker) {
    Write-Warning "❌ session_41_reload_marker missing - data may not be loaded"
} else {
    Write-Host "✅ Session 41 marker present: $($summary.session_41_reload_marker)" -ForegroundColor Green
}

# Check total objects
$expected = 1135
$actual = $summary.layers_available.Count  # This is layer count, not object count
Write-Host "`n✅ Layers available: $actual / 51" -ForegroundColor $(if ($actual -eq 51) { "Green" } else { "Red" })

# Spot check key layers
$checks = @(
    @{name="projects"; expected=57},
    @{name="sprints"; expected=43},
    @{name="stories"; expected=152},
    @{name="tasks"; expected=381},
    @{name="repos"; expected=24},
    @{name="evidence"; expected=30}
)

Write-Host "`n=== LAYER COUNTS ===" -ForegroundColor Cyan
foreach ($check in $checks) {
    $layer = Invoke-RestMethod "$base/model/$($check.name)/"
    $count = $layer.Count
    $status = if ($count -ge $check.expected) { "✅" } else { "❌" }
    Write-Host "$status $($check.name): $count (expected: $($check.expected))"
}

# Run comprehensive audit
Write-Host "`n=== RUNNING COMPREHENSIVE AUDIT ===" -ForegroundColor Cyan
.\scripts\comprehensive-layer-audit.ps1
```

**Expected Results**:
- ✅ 51/51 layers available
- ✅ session_41_reload_marker present
- ✅ All layer counts >= expected
- ✅ Comprehensive audit: All layers pass

---

### Step 7: Update STATUS.md 📝

**Action**: Document Session 41 completion

**Updates**:
```markdown
## Current Session Status

**Session**: 41 (March 8, 2026)  
**Phase**: Deployment Complete  
**Status**: ✅ All 1,135 records loaded to Cosmos DB

### Accomplishments
- ✅ Populated 32 stub layers with comprehensive data
- ✅ Fixed CI/CD pipeline (pytest + flake8)
- ✅ Fixed _LAYER_FILES registry (51 layers)
- ✅ Deployed to production (session-41-data-fix)
- ✅ Seeded Cosmos DB with all 1,135 records
- ✅ Organized documentation structure
- ✅ Created comprehensive tool index

### Data Model Status
- **Layers**: 51/51 operational
- **Records**: 1,135 (all layers populated)
- **Storage**: Cosmos DB (production)
- **Endpoint**: https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io

### Quality Gates
- ✅ All 51 layers accessible via API
- ✅ FK relationships validated
- ✅ Schema compliance verified
- ✅ Comprehensive audit passed

### Next Session (42)
- Update library/03-DATA-MODEL-REFERENCE.md with 51 layers
- Build missing infrastructure tools (layer creation wizard, FK analyzer, etc.)
- Create model/user-guide.md for agent consumers
```

---

## 🎯 Success Criteria

Session 41 is complete when:

- [x] PR #42 merged (51-layer catalog) ✅
- [ ] PR #43 merged (_LAYER_FILES fix)
- [ ] Deployment complete (session-41-data-fix)
- [ ] POST /admin/seed executed successfully
- [ ] All 51 layers return data via API
- [ ] session_41_reload_marker present in /agent-summary
- [ ] Comprehensive audit passes (all layers operational)
- [ ] STATUS.md updated with completion status

---

## 📞 If Something Goes Wrong

### "Seed operation failed"
**Check**:
1. COSMOS_URL and COSMOS_KEY in Container App secrets
2. Cosmos DB firewall allows Container App IP
3. _LAYER_FILES includes the failing layer
4. JSON file exists in model/ directory

**Fix**:
```powershell
# Check Container App environment variables
az containerapp show --name msub-eva-data-model --resource-group rg-eva-data-model `
  --query "properties.configuration.secrets" -o table

# Check Cosmos DB firewall
az cosmosdb show --name <cosmos-account> --resource-group <rg> `
  --query "properties.ipRules" -o table
```

### "Layer returns empty array"
**Possible causes**:
1. Layer not in _LAYER_FILES → seed skipped it
2. JSON file empty or malformed
3. Cosmos DB write failed silently

**Fix**:
```powershell
# Check JSON file
cat model/<layer-name>.json | ConvertFrom-Json | Measure-Object

# Check if layer in _LAYER_FILES
cat api/routers/admin.py | Select-String "<layer-name>"

# Re-seed specific layer (if seed endpoint supports it)
# Or re-seed all layers
Invoke-RestMethod "$base/model/admin/seed" -Method POST
```

### "FK references broken"
**Possible causes**:
1. Referenced layer not seeded yet
2. ID mismatch (project_id references non-existent project)

**Fix**:
```powershell
# Run FK validation
.\scripts\comprehensive-layer-audit.ps1 -TestFK

# Check specific FK
Invoke-RestMethod "$base/model/stories/ACA-14-001" | Select project_id
Invoke-RestMethod "$base/model/projects/51-ACA" | Select id  # Should exist
```

---

## 📚 Reference Documents

- **Architecture Understanding**: `docs/SESSION-41-COMPLETE-SUMMARY.md`
- **Tool Catalog**: `docs/TOOL-INDEX.md` (check BEFORE creating tools!)
- **Documentation Structure**: `docs/DOCUMENTATION-STRUCTURE.md`
- **User Guide**: `USER-GUIDE.md` (v2.5 - agent bootstrap patterns)
- **Library Reference**: `docs/library/03-DATA-MODEL-REFERENCE.md` (needs update)

---

**Last Updated**: March 8, 2026 @ 1:05 AM  
**Next Review**: After PR #43 merge and deployment
