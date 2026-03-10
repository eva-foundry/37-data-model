# FK Enhancement Benefits for 51-ACA Sprint Automation

**Date**: 2026-02-28 17:53 ET  
**Version**: 1.1.0  
**Status**: Design Phase -- revised per Opus 4.6 review  
**Scope**: 31 data model layers (endpoints, containers, screens, hooks, projects, sprints, connections, wbs, etc.)  
**Full Research**: [FK-ENHANCEMENT-RESEARCH-2026-02-28.md](FK-ENHANCEMENT-RESEARCH-2026-02-28.md)  
**Opus Findings**: [FK-ENHANCEMENT-OPUS-FINDINGS-2026-02-28.md](FK-ENHANCEMENT-OPUS-FINDINGS-2026-02-28.md)

---

## What Are "Layers"?

The EVA Data Model API manages **31 distinct entity types (layers)**, not source code repositories:

- **Technical**: endpoints, containers, services, schemas, hooks, components, agents
- **UI**: screens, literals, prompts
- **Governance**: **projects** (53 numbered EVA projects), **wbs** (work breakdown), **sprints** (execution records), milestones, risks
- **Integration**: **connections** (ADO/GitHub/Azure APIs), planes, environments
- **Security**: personas, feature_flags, requirements, security_controls

This FK enhancement connects these 31 layers relationally. Example: sprint -> wbs -> endpoints -> containers -> projects (5-layer FK chain).

---

## TL;DR: What This Means for 51-ACA

The proposed FK enhancement transforms the Data Model API from **loose string arrays** into **explicit PK/FK relationships with versioning**. This directly enables your stated goals:

> "i plan using IaC from UI, build pipelines, workflows, schedule submit jobs"  
> -- User, 2026-02-28

### What You Get

1. **IaC from UI** ✅
   - Click "Export Infrastructure" in admin UI -> Auto-generates Bicep/Terraform
   - Walk FK graph, emit deployment scripts
   - Validate with PSRule before deploying

2. **Build Pipelines** ✅
   - Auto-generate Azure Pipelines YAML from FK graph
   - Topological sort ensures correct deployment order (containers before endpoints)
   - FK violations block pipeline (shift-left testing)

3. **Workflows** ✅
   - Schedule Cosmos sync jobs with FK-driven dependency resolution
   - Example: "Sync jobs container, then job_history (depends on jobs)"
   - Retry failed steps with FK integrity validation

4. **Scenarios** ✅
   - Test branch deployments before merging to main
   - "What if I add this new endpoint?" -> FK graph shows full impact
   - Rollback if deployment fails (version snapshots)

---

## Use Case: 51-ACA Sprint Automation Enhanced

### Today (Port 8055 Local Instance)

```powershell
# Query sprint data
$sprint = Invoke-RestMethod "http://localhost:8055/model/sprints/51-ACA-sprint-02"
# Returns: velocity, MTI, story IDs (loose coupling)

# To deploy sprint changes:
# 1. Manually read PLAN.md to understand dependencies
# 2. Manually write Bicep files
# 3. Manually order deployment steps
# 4. Manually validate FK integrity
# 5. Cross fingers and deploy
```

### Tomorrow (FK Enhanced + Versioning)

```powershell
# Step 1: Create scenario for sprint 02
$scenario = Invoke-RestMethod "$base/model/scenarios/create" -Method POST -Body @{
    name = "51-ACA-sprint-02"
    base_version = "main@v676"  # Current port 8055 state
    description = "Sprint 02 stories: 15 features, velocity 15"
} | ConvertFrom-Json

# Step 2: Add new features to scenario (mutates FK graph in isolated branch)
Invoke-RestMethod "$base/model/endpoints/POST /v1/51aca/submit?scenario=$($scenario.id)" `
    -Method PUT -Body @{
        id = "POST /v1/51aca/submit"
        service = "51aca-api"
        cosmos_writes = ["51aca_jobs"]  # FK to container
        status = "implemented"
    }

# Step 3: Validate scenario (impact analysis)
$validation = Invoke-RestMethod "$base/model/scenarios/$($scenario.id)/validate" -Method POST
# Returns:
# - new_objects: ["POST /v1/51aca/submit"]
# - affected_objects: ["51ACADashboard", "useJobSubmit"]
# - breaking_changes: []  # No blockers
# - deployment_order: ["1. Create container: 51aca_jobs", "2. Deploy endpoint", "3. Update UI"]

# Step 4: Auto-generate IaC from scenario
$bicep = Invoke-RestMethod "$base/model/iac/generate?layer=containers&scenario=$($scenario.id)&format=bicep"
$bicep | Out-File "deploy/sprint-02-infrastructure.bicep"

# Step 5: Auto-generate pipeline
$pipeline = Invoke-RestMethod "$base/model/pipelines/generate?scenario=$($scenario.id)&format=azure-pipelines"
$pipeline | Out-File ".azure-pipelines/sprint-02-deploy.yml"

# Step 6: Merge scenario to main (atomic)
Invoke-RestMethod "$base/model/scenarios/$($scenario.id)/merge" -Method POST
# All FK graph changes committed together (no partial state)

# Step 7: Deploy via auto-generated pipeline
az pipelines run --name "sprint-02-deploy"
```

**What Changed:**
- ❌ BEFORE: 5 manual steps, 30 minutes, error-prone
- ✅ AFTER: 7 API calls, 2 minutes, FK-validated

---

## Timeline Impact on 51-ACA (Revised per Opus 4.6 -- 403h, 12 sprints)

### Immediate (Sprint 1-2, March-April 2026) -- Phase 0 NEW

- **Phase 0 delivers FK validation on existing string arrays** -- zero migration risk
- Port 8055 objects automatically validated on upsert
- Orphan scan identifies cleanup targets before FK seeding
- No schema changes needed

### Phase 1A (May-June 2026, Sprints 3-4)

- Base FK schema deployed to ACA Cosmos instance
- 51-ACA objects get `_relationships` field (empty initially)
- **No migration needed** -- opt-in per object

### Phase 1B-Scenarios (July 2026, Sprints 5-6)

- Scenario API available: Test sprint deployments in isolation
- **Saga-based merge** (not atomic -- Cosmos NoSQL limitation)
- Compensation log for rollback on partial failure

### Phase 3 (August 2026, Sprint 7)

- Relationship indexes deployed
- O(1) navigation: `GET /model/sprints/51-ACA-sprint-02/descendants`
- Returns full WBS tree in 1 API call (< 100ms)
- **BFS cycle detection** prevents infinite loops on self-referential layers

### Phase 1C-IaC (September 2026, Sprint 8) + Phase 1D-Pipelines (October 2026, Sprint 9)

- **IaC generation**: Auto-generate Bicep/Terraform from FK graph
- **Pipeline generation**: Auto-generate Azure Pipelines YAML / GitHub Actions

### Phase 4 (November 2026, Sprint 10)

- Cascade rules enforced
- Delete confirmation shows full impact: "This will affect 12 downstream objects"

### Phase 5 (January-February 2027, Sprint 12)

- Migration script backfills all 676+ objects in port 8055
- All loose string arrays converted to explicit FK relationships
- **Production-ready FK graph**

---

## Recommended 51-ACA Actions

### Short-Term (Sprint 2)

1. **Read FK enhancement research**: [FK-ENHANCEMENT-RESEARCH-2026-02-28.md](FK-ENHANCEMENT-RESEARCH-2026-02-28.md)
2. **Document current dependencies**: Which WBS items depend on which endpoints/containers?
3. **Identify IaC needs**: What infrastructure do you deploy manually today?

### Medium-Term (Sprint 3-5)

1. **Test scenario API** (Phase 1B, June 2026)
   - Create test scenario: "What if I add submit_job endpoint?"
   - Validate impact before implementing
2. **Adopt IaC generation** (Phase 1B)
   - Replace manual Bicep files with auto-generated IaC
   - Store generated IaC in git: `deploy/sprint-XX-infra.bicep`
3. **Migrate 1 sprint to FK-enhanced workflow** (pilot)
   - Sprint 3: Traditional workflow
   - Sprint 4: FK-enhanced workflow (scenario -> validate -> merge -> deploy)
   - Compare: Time saved, errors caught, rollback ease

### Long-Term (Sprint 6+)

1. **Full FK adoption** (Phase 5, September 2026)
   - All 676 objects migrated to explicit FK relationships
   - Port 8055 instance syncs FK graph to ACA Cosmos
   - Sprint automation fully FK-driven:
     * Story -> WBS -> Endpoints -> Containers (explicit FKs)
     * Auto-detect dependencies from FK graph
     * Generate deployment order automatically

2. **Workflow orchestration**
   - Schedule nightly Cosmos sync: `sync-51aca-data`
   - FK-driven dependency order: Sync base containers before derived views
   - FK integrity validation after each sync step

3. **UI enhancements in 31-eva-faces**
   - Dependency graph visualizer: See full WBS tree
   - Delete impact preview: "This will break 3 sprint stories"
   - Relationship navigation: Click endpoint -> see all screens that call it

---

## Risk Mitigation for 51-ACA

### Risk 1: Port 8055 Isolation

**Concern**: 51-ACA uses isolated port 8055 instance, not shared ACA Cosmos.

**Mitigation**:
- FK enhancement supports multi-instance architecture (MODEL_DIR env var)
- Port 8055 can opt-in to FK relationships independently
- No forced migration to ACA Cosmos
- **Your isolation is preserved**

### Risk 2: Sprint Automation Disruption

**Concern**: FK migration might break existing sprint automation.

**Mitigation**:
- Phase 1-4: FK relationships are **optional** (opt-in per object)
- Existing string arrays continue working until Phase 5 (September 2026)
- 6-month transition period (May-September 2026)
- Backward compatibility: Both string arrays AND FKs supported during transition

### Risk 3: Learning Curve

**Concern**: Team must learn new FK API routes.

**Mitigation**:
- Phase 1B includes comprehensive documentation
- Auto-generated code examples for common scenarios
- Pilot sprint (Sprint 4) with full support from data model team
- Fallback: Keep using port 8055 local instance if FK adoption blocked

---

## Example: Sprint 02 Deploy Workflow (FK-Enhanced)

**User Request:**
> "Deploy Sprint 02 features (15 stories) to staging environment"

**Traditional Workflow (Manual, 30 mins):**
1. Read PLAN.md, identify new endpoints
2. Write Bicep files for new Cosmos containers
3. Manually order deployment steps
4. Deploy Bicep
5. Deploy API code
6. Update frontend
7. Run smoke tests
8. Hope nothing broke

**FK-Enhanced Workflow (Automated, 5 mins):**
```powershell
# 1. Create scenario (branch FK graph)
$scenario = Invoke-RestMethod "$base/model/scenarios/create" -Method POST -Body '{"name":"sprint-02","base_version":"main@v676"}'

# 2. Auto-populate scenario from PLAN.md (new script)
pwsh -File "C:\eva-foundry\51-ACA\scripts\sync-sprint-to-scenario.ps1" -SprintId "51-ACA-sprint-02" -ScenarioId $scenario.id

# 3. Validate (impact analysis)
$validation = Invoke-RestMethod "$base/model/scenarios/$($scenario.id)/validate" -Method POST
if ($validation.breaking_changes.Count -gt 0) {
    Write-Error "Blocked: $($validation.breaking_changes -join ', ')"
    exit 1
}

# 4. Generate IaC + Pipeline
Invoke-RestMethod "$base/model/iac/generate?scenario=$($scenario.id)&format=bicep" | Out-File "deploy/sprint-02.bicep"
Invoke-RestMethod "$base/model/pipelines/generate?scenario=$($scenario.id)&format=azure-pipelines" | Out-File ".azure-pipelines/sprint-02.yml"

# 5. Deploy via Azure Pipelines (FK-aware deployment order)
az pipelines run --name "sprint-02" --branch "feature/sprint-02"

# 6. If success -> Merge scenario to main (atomic)
Invoke-RestMethod "$base/model/scenarios/$($scenario.id)/merge" -Method POST

# 7. If failure -> Rollback (restore snapshot)
$snapshot = Invoke-RestMethod "$base/model/snapshots/create" -Method POST -Body '{"name":"pre-sprint-02"}'
Invoke-RestMethod "$base/model/snapshots/$($snapshot.id)/restore" -Method POST
```

**Comparison:**
- Traditional: 30 minutes, manual steps, no rollback
- FK-Enhanced: 5 minutes, fully automated, one-click rollback

---

## Next Steps

1. **Read full research**: [FK-ENHANCEMENT-RESEARCH-2026-02-28.md](FK-ENHANCEMENT-RESEARCH-2026-02-28.md)
2. **Provide feedback**: Does this address your IaC/pipeline/workflow needs?
3. **Pilot planning**: Can we pilot FK-enhanced workflow in Sprint 4?
4. **Document dependencies**: Start documenting WBS -> endpoint -> container dependencies for FK migration

---

**END OF DOCUMENT**
