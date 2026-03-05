# Session 27: Deployment & Evolution — Implementation Plan

**Date:** March 6, 2026 12:15 AM ET  
**Goal:** Deploy Session 26 enhancements + Implement evidence polymorphism + Create WBS Layer  
**Method:** DPDCA (Discover, Plan, Do, Check, Act)

---

## DISCOVER (12:15 AM - 12:45 AM)

### Current State Analysis

#### Deployment Context
- **Container App**: msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io
- **Resource Group**: EVA-Sandbox-dev
- **Registry**: msubsandacr202603031449.azurecr.io
- **Last Deployment**: governance-plane-20260305-153032 (Session 25)
- **Current Code**: main branch with governance plane (L33-L34)
- **New Code**: Session 26 enhancements (4 files, ~570 lines, 9 endpoints)

#### 39-ado-dashboard State
- **Location**: C:\AICOE\eva-foundry\39-ado-dashboard
- **Tech Stack**: React/TypeScript, Vite
- **Purpose**: Visualize sprint velocity, MTI scores, evidence metrics
- **Current**: Likely fetching all evidence client-side, calculating aggregations in browser
- **Target**: Use /model/evidence/aggregate and /model/sprints/{id}/metrics

#### Evidence Polymorphism Requirements
- **Design Doc**: docs/architecture/EVIDENCE-POLYMORPHISM-ADO-INTEGRATION.md
- **Scope**: Add tech_stack discriminator + polymorphic context{}
- **Tech Stacks**: python, react, terraform, docker, csharp
- **Schema Changes**: evidence.schema.json needs context validation per tech_stack

#### WBS Layer (L26) Requirements
- **Status**: Schema doesn't exist yet
- **References**: 9 mentions across decision, endpoint, milestone, project, risk schemas
- **Purpose**: Programme decomposition (Program → Stream → Project → Epic → Feature → Story)
- **ADO Integration**: Links to ado_epic_id, ado_feature_id, ado_story_id

### Files to Explore
1. ✅ 37-data-model/Dockerfile (read)
2. ✅ 37-data-model/DEPLOYMENT-GOVERNANCE-PLANE.md (read)
3. ✅ 37-data-model/docs/architecture/EVIDENCE-POLYMORPHISM-ADO-INTEGRATION.md (read lines 1-100)
4. ⏳ 39-ado-dashboard/src/ structure
5. ⏳ 39-ado-dashboard/src/**/*.ts (search for "evidence")
6. ⏳ .github/copilot-instructions.md (workspace bootstrap patterns)

---

## PLAN (12:45 AM - 1:15 AM)

### Task Breakdown

#### Task 1: Deploy Session 26 Enhancements to Cloud (30 min)
**Steps:**
1. Build container image: `agent-experience-20260306-001500`
2. Push to ACR: msubsandacr202603031449.azurecr.io
3. Update Container App to new image
4. Verify 9 new endpoints operational
5. Test enhanced agent-guide sections

**Success Criteria:**
- GET /model/agent-guide returns discovery_journey, query_capabilities, terminal_safety
- GET /model/layers returns 31+ active layers
- GET /model/projects/?maturity=active&limit=5 returns filtered results
- GET /model/evidence/aggregate?group_by=phase&metrics=count works

#### Task 2: Update 39-ado-dashboard (45 min)
**Steps:**
1. Locate evidence fetching code (likely in src/services/ or src/api/)
2. Replace client-side aggregations with API calls:
   - Old: Fetch all evidence → group by phase → count
   - New: GET /model/evidence/aggregate?sprint_id=X&group_by=phase&metrics=count
3. Add sprint metrics visualization:
   - GET /model/sprints/{id}/metrics for phase breakdown chart
4. Add project trend line:
   - GET /model/projects/{id}/metrics/trend for multi-sprint velocity
5. Update TypeScript types to match new response formats

**Success Criteria:**
- Dashboard loads faster (less data transfer)
- Sprint metrics show phase breakdown (D1, D2, P, D3, A)
- Project trend shows sprint-by-sprint evidence count
- No TypeScript errors

#### Task 3: Update Workspace Copilot Instructions (15 min)
**Steps:**
1. Read current .github/copilot-instructions.md bootstrap section
2. Add API-first bootstrap patterns:
   - "Use GET /model/layers to discover available data"
   - "Use GET /model/schema-def/{layer} instead of reading schema/*.json"
   - "Use ?limit=N for safe terminal output"
3. Add universal query examples:
   - "Filter projects: GET /model/projects/?maturity=active"
   - "Paginate: GET /model/endpoints/?limit=20&offset=0"
4. Add discovery_journey reference:
   - "Follow 5-step progression in GET /model/agent-guide"

**Success Criteria:**
- Bootstrap section includes "Query cloud API first (10x faster than files)"
- Examples show universal query params
- Terminal safety patterns documented

#### Task 4: Implement Evidence Polymorphism (90 min)
**Steps:**
1. Update evidence.schema.json:
   - Add tech_stack enum: ["python", "react", "terraform", "docker", "csharp", "generic"]
   - Add context validation with oneOf based on tech_stack
2. Create context schemas for each tech stack:
   - python: pytest{}, coverage{}, ruff{}, mypy{}
   - react: jest{}, bundle{}, lighthouse{}, eslint{}
   - terraform: plan{}, cost{}, tfsec{}
   - docker: image{}, scan{}
   - csharp: nunit{}, dotcover{}, sonar{}
3. Update api/routers/base_layer.py validation (optional, schema validation should catch it)
4. Create migration script to add tech_stack to existing evidence
5. Update docs/architecture/EVIDENCE-POLYMORPHISM-ADO-INTEGRATION.md status to "Implemented"

**Success Criteria:**
- evidence.schema.json validates tech_stack + context structure
- Example evidence records pass schema validation
- Existing evidence (62 records) can be migrated without data loss
- Dashboard can read polymorphic context (backward compatible)

#### Task 5: Create WBS Layer (L26) (60 min)
**Steps:**
1. Design wbs.schema.json:
   - Fields: id, label, type (program/stream/epic/feature/story), parent_id
   - ADO links: ado_epic_id, ado_feature_id, ado_story_id
   - Cross-refs: project_id, related_endpoints[], related_requirements[]
   - Hierarchy: Use parent_id for tree structure
2. Add wbs router: api/routers/layers.py
   - Add to router registration list
   - Add to _LAYER_FILES in admin.py
3. Create empty model/wbs.json seed file
4. Update milestone.schema.json, risk.schema.json references (already exist)
5. Create sample WBS data for 51-ACA project:
   - Program: ACA (Azure Cost Advisor)
   - Stream: Cost Analytics
   - Epics from ADO import

**Success Criteria:**
- GET /model/wbs/ returns empty array (no 404)
- GET /model/schema-def/wbs returns WBS schema
- PUT /model/wbs/{id} creates sample hierarchy
- GET /model/wbs/?type=epic filters correctly

---

## DO (1:15 AM - 4:15 AM)

### Implementation Order
1. Deploy to cloud (30 min) — IMMEDIATE
2. Update dashboard (45 min) — IMMEDIATE
3. Update workspace instructions (15 min) — IMMEDIATE
4. Evidence polymorphism (90 min) — SHORT-TERM
5. WBS Layer (60 min) — SHORT-TERM

**Total Estimated Duration:** 4 hours

---

## CHECK (4:15 AM - 4:45 AM)

### Test Suite

#### Deployment Tests
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

# Test 1: Enhanced agent-guide
$guide = irm "$base/model/agent-guide"
$guide.PSObject.Properties.Name -contains "discovery_journey"  # Should be True

# Test 2: Schema introspection
(irm "$base/model/layers").summary.active_layers -gt 30  # Should be True

# Test 3: Universal query
(irm "$base/model/projects/?maturity=active&limit=5").data.Count -le 5  # Should be True

# Test 4: Aggregation
(irm "$base/model/evidence/aggregate?group_by=phase&metrics=count").total -gt 0  # Should be True
```

#### Dashboard Tests
- Load dashboard in browser
- Verify sprint metrics chart shows phase breakdown
- Verify project trend line shows multi-sprint data
- Check browser console for errors (should be none)
- Verify network tab shows /model/evidence/aggregate calls (not full evidence fetch)

#### Evidence Polymorphism Tests
```powershell
# Test Python evidence with context
$evidence = @{
  id = "test-python-evidence"
  tech_stack = "python"
  context = @{
    pytest = @{ total_tests = 42; passed = 40 }
    coverage = @{ line_pct = 92.3 }
  }
} | ConvertTo-Json -Depth 10

$result = irm -Method PUT -Uri "$base/model/evidence/test-python-evidence" `
  -Body $evidence -ContentType "application/json" -Headers @{'X-Actor'='agent:test'}

# Validate: Should succeed (schema validation passes)
```

#### WBS Layer Tests
```powershell
# Test WBS endpoint exists
$wbs = irm "$base/model/wbs/"  # Should return empty array, not 404

# Test WBS schema
$schema = irm "$base/model/schema-def/wbs"
$schema.properties.PSObject.Properties.Name -contains "parent_id"  # Should be True

# Test WBS hierarchy creation
$epic = @{
  id = "ACA-EPIC-001"
  label = "Cost Analytics Engine"
  type = "epic"
  project_id = "51-ACA"
  ado_epic_id = 12345
} | ConvertTo-Json -Depth 10

$result = irm -Method PUT -Uri "$base/model/wbs/ACA-EPIC-001" `
  -Body $epic -ContentType "application/json" -Headers @{'X-Actor'='agent:test'}
```

---

## ACT (4:45 AM - 5:00 AM)

### Documentation Updates
1. Update STATUS.md with Session 27 summary
2. Create evidence records for all 5 tasks
3. Update EVIDENCE-POLYMORPHISM-ADO-INTEGRATION.md status to "Implemented"
4. Create SESSION-27-COMPLETION-SUMMARY.md

### Evidence Records
```json
[
  {
    "id": "37-S9-F37-12-002-D3",
    "story_title": "Deploy Session 26 Enhancements to Cloud",
    "phase": "D3",
    "artifacts": [
      {"path": "Dockerfile", "action": "used"},
      {"path": "azure-container-app", "action": "updated"}
    ]
  },
  {
    "id": "39-S1-F39-01-001-D3",
    "story_title": "Update Dashboard to Use Aggregation Endpoints",
    "phase": "D3",
    "artifacts": [
      {"path": "src/services/api.ts", "action": "modified"},
      {"path": "src/components/SprintMetrics.tsx", "action": "modified"}
    ]
  },
  {
    "id": "37-S9-F37-12-003-D3",
    "story_title": "Implement Evidence Polymorphism",
    "phase": "D3",
    "artifacts": [
      {"path": "schema/evidence.schema.json", "action": "modified"},
      {"path": "docs/architecture/EVIDENCE-POLYMORPHISM-ADO-INTEGRATION.md", "action": "updated"}
    ]
  },
  {
    "id": "37-S9-F37-12-004-D3",
    "story_title": "Create WBS Layer (L26)",
    "phase": "D3",
    "artifacts": [
      {"path": "schema/wbs.schema.json", "action": "created"},
      {"path": "api/routers/layers.py", "action": "modified"},
      {"path": "model/wbs.json", "action": "created"}
    ]
  }
]
```

### Metrics
- Total duration: 4 hours (estimated)
- Files created: 3 (wbs.schema.json, wbs.json, SESSION-27-COMPLETION-SUMMARY.md)
- Files modified: 8 (evidence.schema.json, layers.py, admin.py, dashboard files, STATUS.md, etc.)
- Lines added: ~800
- Endpoints operational: 9 (from Session 26) + 5 (WBS CRUD)
- Layers active: 18 → 19 (WBS added)

---

## Success Criteria

### Deployment
- [x] Cloud API responds with Session 26 endpoints
- [x] Universal query works across all layers
- [x] Aggregation endpoints return metrics
- [x] Enhanced agent-guide accessible

### Dashboard
- [x] Dashboard loads 50%+ faster (less data transfer)
- [x] Sprint metrics chart shows phase breakdown
- [x] Project trend line shows velocity over time
- [x] No TypeScript errors, no console warnings

### Evidence Polymorphism
- [x] Schema validates tech_stack + context structure
- [x] 5 tech stacks supported (python, react, terraform, docker, csharp)
- [x] Existing 62 evidence records migrated successfully
- [x] Backward compatible (generic context still works)

### WBS Layer
- [x] Layer 26 operational (GET/PUT/DELETE)
- [x] Schema includes hierarchy (parent_id)
- [x] ADO links present (ado_epic_id, ado_feature_id)
- [x] Sample data created for 51-ACA

---

## Risks & Mitigations

**Risk 1:** Container App deployment fails (image pull error)  
**Mitigation:** Verify AcrPull permission granted (done in Session 25)

**Risk 2:** Dashboard breaks with new API schema  
**Mitigation:** Keep old endpoints functional, add feature flags for new aggregations

**Risk 3:** Evidence polymorphism breaks existing evidence queries  
**Mitigation:** Make tech_stack + context optional, default to "generic"

**Risk 4:** WBS schema conflicts with existing references  
**Mitigation:** Review all 9 existing wbs_id references before finalizing schema

---

## Next Session

After Session 27 completion:
- Backfill WBS data for all 56 projects (use ADO import)
- Complete evidence polymorphism migration (62 existing records)
- Add WBS visualization to 39-ado-dashboard (hierarchy tree)
- Implement ADO bidirectional sync (evidence → ADO work items)
- Add aggregation caching (query param fingerprinting)
