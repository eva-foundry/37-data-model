# Session 27 Part 4: PR Merge & Deployment Completion

**Date:** March 5, 2026 7:15 PM ET  
**Duration:** Est. 20-30 minutes  
**Method:** DPDCA (rapid completion cycle)  
**Objective:** Merge feature branch, redeploy from main, verify production

---

## Discovered Context

### Feature Branch Ready for Merge
- **Branch:** `feat/session-26-agent-experience`
- **Commits:** 6 total (Session 26 + Session 27 work)
- **Changes:** 19 files, 4,680 lines added, 51 lines deleted
- **Status:** All code committed and pushed (commit `db3c175`)

### Key Changes in PR
1. **Session 26 (commit 7cdc787):**
   - Enhanced agent-guide (5 sections)
   - Schema introspection (5 endpoints)
   - Universal query operators
   - Aggregation endpoints
   - 9 new router endpoints

2. **Session 27 Part 2 (commit 6e5d6c4):**
   - Evidence polymorphism (tech_stack + oneOf validation)
   - WBS schema (programme hierarchy)
   - Test scripts

3. **Session 27 Part 3 (commits 72faa63, ee6e5ad):**
   - Completion documentation
   - Timeline fix
   - STATUS.md update

4. **Library docs (commit db3c175):**
   - 03-DATA-MODEL-REFERENCE.md updated
   - 11-EVIDENCE-LAYER.md updated
   - 12-AGENT-EXPERIENCE.md created
   - README.md updated

### Current Git State
- **37-data-model:** On `feat/session-26-agent-experience`
  - Uncommitted: Line ending changes (CRLF normalization, non-critical)
  - Untracked: model/*.json files (Cosmos exports, should not commit)
- **39-ado-dashboard:** On `main`, 1 commit pushed (evidence velocity integration)
- **Cloud deployment:** Running from feature branch (agent-experience-20260305-180559)

### What Needs Doing
1. Add model/*.json to .gitignore (prevent accidental commit)
2. Merge PR to main (GitHub web UI)
3. Rebuild container from main branch
4. Push new revision to Azure Container Apps
5. Verify 10/11 endpoints still operational

---

## Implementation Plan

### Phase 1: Pre-Merge Cleanup (5 minutes)

**Task 1.1: Update .gitignore**
```bash
echo "# Cosmos DB exports (transient data)" >> .gitignore
echo "model/*.json" >> .gitignore
echo "!model/.gitkeep" >> .gitignore  # Keep the directory
git add .gitignore
git commit -m "Add model/*.json to .gitignore (Cosmos exports)"
git push origin feat/session-26-agent-experience
```

**Why:** Prevent 34 model/*.json files from being accidentally committed in future sessions

### Phase 2: Merge PR (5 minutes)

**Task 2.1: Create PR via GitHub CLI or web**
- Option A (CLI):
  ```bash
  gh pr create \
    --title "Session 26 & 27: Agent Experience + Evidence Polymorphism" \
    --body "See SESSION-26-COMPLETION-SUMMARY.md and SESSION-27-COMPLETION-SUMMARY.md" \
    --base main \
    --head feat/session-26-agent-experience
  ```

- Option B (Web): https://github.com/eva-foundry/37-data-model/compare/main...feat/session-26-agent-experience

**Task 2.2: Merge PR**
- If no PR approval required: Merge via GitHub web UI (Squash or Merge commit)
- If approval required: Note for tomorrow

### Phase 3: Rebuild & Deploy from Main (10 minutes)

**Task 3.1: Switch to main and rebuild**
```bash
cd C:\eva-foundry\37-data-model
git checkout main
git pull origin main

# Build new container image from main
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$imageName = "eva-data-model:main-$timestamp"

az acr build `
  --registry msubsandacr202603031449 `
  --image $imageName `
  --file Dockerfile `
  .
```

**Task 3.2: Deploy to Container Apps**
```bash
az containerapp update `
  --name msub-eva-data-model `
  --resource-group rg-msub-sandbox-eva-data-model-20260303-1449 `
  --image msubsandacr202603031449.azurecr.io/$imageName
```

### Phase 4: Verification (5 minutes)

**Task 4.1: Smoke test endpoints**
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

# Core endpoints
Invoke-RestMethod "$base/health"
Invoke-RestMethod "$base/model/agent-guide" | Select-Object -First 1

# Session 26 features
Invoke-RestMethod "$base/model/layers" | Measure-Object
Invoke-RestMethod "$base/model/evidence/fields" | Select-Object -First 5
Invoke-RestMethod "$base/model/evidence/?limit=5"
Invoke-RestMethod "$base/model/evidence/aggregate?group_by=phase&metrics=count"

# Session 27 features (polymorphism)
$evidence = Invoke-RestMethod "$base/model/evidence/?limit=1"
$evidence.data[0].tech_stack  # Should show "python", "react", etc.
```

**Expected:** 10/11 endpoints operational (schema-def still 404, known issue)

### Phase 5: Documentation Update (5 minutes)

**Task 5.1: Update STATUS.md**
- Add "Session 27 Part 4: PR merged, deployed from main" entry
- Update deployment info (new image tag, timestamp)

**Task 5.2: Create completion banner**
- SESSION-27-PART-4-COMPLETE.md (brief summary)

---

## Risk Mitigation

### Risk 1: Protected Branch Blocks Direct Merge
**Likelihood:** Medium (main branch may require PR approval)  
**Impact:** High (blocks deployment)  
**Mitigation:** 
- Check branch protection rules first
- If blocked, note for tomorrow (cloud already running from feature branch)
- Current production is operational (acceptable stopping point)

### Risk 2: Container Build Fails
**Likelihood:** Low (Dockerfile hasn't changed)  
**Impact:** Medium (can't redeploy)  
**Mitigation:**
- Use exact same Dockerfile that worked in Session 27 Part 1
- If fails, production stays on feature branch image (operational)

### Risk 3: New Image Regresses
**Likelihood:** Very Low (same code as feature branch)  
**Impact:** Medium (deployment downtime)  
**Mitigation:**
- Quick rollback available (previous revision: agent-experience-20260305-180559)
- Keep feature branch image available for 24 hours

---

## Success Criteria

- [ ] .gitignore updated (model/*.json excluded)
- [ ] PR created and visible on GitHub
- [ ] PR merged to main (or noted for tomorrow if approval required)
- [ ] New container image built from main branch
- [ ] Container deployed to Azure Container Apps
- [ ] 10/11 endpoints verified operational
- [ ] STATUS.md updated with Part 4 completion
- [ ] Git state clean (no uncommitted changes)

---

## Contingency: If PR Approval Required

Main branch may be protected. If PR cannot be merged tonight:

**Alternative Plan:**
1. Stop here - production is operational from feature branch
2. Note PR for review tomorrow
3. Update SESSION-27-COMPLETION-SUMMARY.md with current state
4. Session 27 is 95% complete (only main branch deployment pending)

**Why This Is Acceptable:**
- All code committed and pushed (feat/session-26-agent-experience)
- Production cloud API operational (10/11 endpoints)
- Dashboard deployed and functional
- Library docs updated and committed
- No loose ends or uncommitted work

---

*Created: March 5, 2026 7:15 PM ET*
