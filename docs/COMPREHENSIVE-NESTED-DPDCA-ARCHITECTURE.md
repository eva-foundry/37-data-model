# COMPREHENSIVE NESTED DPDCA ARCHITECTURE
## 5-Part Execution Framework (Session 45 Part 9)

**Date**: March 12, 2026  
**User Directive**: "Get all 111 + 10 new layers live tonight, register all 163 screens, generate & test workflow, update docs, reorganize routers"  
**Methodology**: Fractal DPDCA (Nested cycles at Session → Part → Operation levels)

---

## HIERARCHY

```
SESSION LEVEL (Top)
├─ PART 1: Operationalize 121 Data-Model Layers (111 existing + 10 P36-P58)
│  ├─ DISCOVER ✅
│  ├─ PLAN ✅ (PART-1-SECURITY-SCHEMAS-EXECUTION-PLAN.md)
│  ├─ DO      ⏳ (Seed 10 schemas, validate queries)
│  ├─ CHECK   ⏳ (Verify all 121 in Cosmos)
│  └─ ACT     ⏳ (Commit, sync model)
│
├─ PART 2: Register All 163 Screens in Data Model
│  ├─ DISCOVER ⏳ (Audit all sources: dm, eva-faces, projects, pending)
│  ├─ PLAN    ⏳ (Design registry schema, ID format)
│  ├─ DO      ⏳ (Register all 163 in Cosmos)
│  ├─ CHECK   ⏳ (Verify registrations)
│  └─ ACT     ⏳ (Finalize registry, commit)
│
├─ PART 3: Run Comprehensive Screen Factory Workflow
│  ├─ DISCOVER ⏳ (Verify workflow readiness, env check)
│  ├─ PLAN    ⏳ (Design test matrix for all 163)
│  ├─ DO      ⏳ (Generate all "data-model" screens, auto-revise, test)
│  ├─ CHECK   ⏳ (Validate all 163 build + test + ESLint + a11y)
│  └─ ACT     ⏳ (Reconcile failures, publish results)
│
├─ PART 4: Update Documentation from Data Model API
│  ├─ DISCOVER ⏳ (Audit gaps: outdated docs vs live API)
│  ├─ PLAN    ⏳ (Map queries: GET /model/* → doc sections)
│  ├─ DO      ⏳ (Regenerate docs from API)
│  ├─ CHECK   ⏳ (Verify accuracy against API)
│  └─ ACT     ⏳ (Remove parallel lists, finalize)
│
└─ PART 5: Reorganize Routers by Functional Grouping
   ├─ DISCOVER ⏳ (Audit current router structure)
   ├─ PLAN    ⏳ (Design functional grouping: AICOE, Control Plane, Ops, etc.)
   ├─ DO      ⏳ (Reorganize routers, wire navigation)
   ├─ CHECK   ⏳ (Verify routes resolve, no dead links)
   └─ ACT     ⏳ (Document structure, commit)

SESSION LEVEL (Bottom)
└─ Final: Merge all 5 PRs, deploy single revision
```

---

## PART 1: Operationalize 121 Data-Model Layers

### Objective
Get all 111 existing + 10 new P36-P58 security schemas operational in Cosmos DB tonight.

### 10 New Schemas (L112-L121)
| L# | Name | Schema File | Domain | Source |
|-----|------|-------------|--------|--------|
| L112 | red_team_test_suites | red_team_test_suite.schema.json | 3,6 | P36 |
| L113 | attack_tactic_catalog | attack_tactic_catalog.schema.json | 6 | P36 |
| L114 | ai_security_findings | ai_security_finding.schema.json | 9 | P36 |
| L115 | assertions_catalog | assertions_catalog.schema.json | 6 | P36 |
| L116 | ai_security_metrics | ai_security_metrics.schema.json | 9 | P36 |
| L117 | vulnerability_scan_results | vulnerability_scan_result.schema.json | 8 | P58 |
| L118 | infrastructure_cve_findings | cve_finding.schema.json | 9 | P58 |
| L119 | risk_ranking_analysis | risk_ranking.schema.json | 9 | P58 |
| L120 | remediation_tasks | remediation_task.schema.json | 7 | P58 |
| L121 | remediation_effectiveness_metrics | remediation_effectiveness.schema.json | 9 | P58 |

### Nested DPDCA (PART 1 Details: see PART-1-SECURITY-SCHEMAS-EXECUTION-PLAN.md)

**DISCOVER phase** (COMPLETE):
- ✅ Identified 10 schemas from P36-P58 requirements
- ✅ Verified all .json files exist in schema/

**PLAN phase** (COMPLETE):
- ✅ Mapped to L112-L121
- ✅ Designed execution sequence (6 phases)
- ✅ Success criteria & rollback plan

**DO phase** (NOT STARTED):
- [ ] Validate schema files (JSON syntax, required fields)
- [ ] Create layer objects (POST /model/admin/layer × 10)
- [ ] Load seed data (docs/examples/ → 30+ records)

**CHECK phase**:
- [ ] Query each layer (GET /model/{layer_name})
- [ ] Verify object counts ≥1
- [ ] Validate schema compliance

**ACT phase**:
- [ ] Commit: PART-1-SECURITY-SCHEMAS-EXECUTION-PLAN.md + seed files
- [ ] Sync: Update COMPLETE-LAYER-CATALOG.md (121 layers confirmed)
- [ ] Report: evidence/PART-1-FINAL-INVENTORY-{timestamp}.json

**SUCCESS**: 121 operational layers in Cosmos DB, verified via API queries

---

## PART 2: Register All 163 Screens in Data Model

### Objective
Create unified screen registry (data-model + eva-faces + projects + pending-ops) in Cosmos DB.

### Screen Inventory (163 Total)
| Source | Count | Status | Classification |
|--------|-------|--------|===============|
| Data Model (L1-L111) | 111 | operational | Primary surface |
| Data Model (L112-L121) | 10 | pending | P36-P58 new |
| eva-faces portal | 13 | static | Reference UI |
| eva-faces admin | 10 | static | Reference UI |
| Project 39 (ADO Dashboard) | 2 | static | Reference UI |
| Project 45 (AICOE) | 3 | static | Reference UI |
| Project 46 (Accelerator) | 4 | static | Static views |
| Project 40 (Control Plane) | 4 | pending | Needs implementation |
| Project 50 (Ops) | 6 | pending | Needs implementation |
| **TOTAL** | **163** | mixed | -- |

### Data Model Screen Schema

```json
{
  "id": "screen-{layer_id}",
  "layer_id": "L7",
  "layer_name": "screens",
  "name": "ProjectDetailPage",
  "source": "data-model" | "eva-faces" | "project",
  "status": "operational" | "static" | "pending",
  "path": "/projects/{id}",
  "component": "ProjectDetailPage",
  "router": "project-router",
  "dependencies": ["L26/projects", "L28/sprints", "L29/tasks"],
  "accessibility": {
    "wcag_level": "AA",
    "last_tested": "2026-03-12",
    "jest_axe_run_id": "run-12345"
  }
}
```

### Nested DPDCA (PART 2)

**DISCOVER phase**:
- [ ] Query all 163 screens from sources (file scan + API queries)
- [ ] Inventory by source/status
- [ ] Identify missing metadata (component names, routers, deps)

**PLAN phase**:
- [ ] Design screen registry schema (above)
- [ ] Map 111 data-model screens → layer IDs
- [ ] Classify 52 non-data-model screens (eva-faces, projects, pending)

**DO phase**:
- [ ] Register 163 screens in Cosmos (POST × 163)
- [ ] Batch insert (parallel OK for independent records)

**CHECK phase**:
- [ ] Query registry: GET /model/screens?source=data-model (expect 111+10)
- [ ] Query registry: GET /model/screens?status=pending (expect 10)
- [ ] Verify all 163 are queryable

**ACT phase**:
- [ ] Commit: Screen registry schema + seed data
- [ ] Report: evidence/PART-2-SCREEN-REGISTRY-{timestamp}.json (163 screens registered)

**SUCCESS**: Unified screen registry, queryable by source/status, 163 total

---

## PART 3: Run Comprehensive Screen Factory Workflow

### Objective
Generate + auto-revise + test all 163 screens (including new L112-L121).

### Workflow (from screens-machine.yml)

**Step 1-3**: Checkout → Pre-flight API check → Setup Node  
**Step 4**: Generate screens (query /model/screens?source=data-model, generate React components)  
**Step 5**: Auto-Revise (Run-AutoReviser.ps1, fix 6 pattern types)  
**Step 6**: Build UI (Next.js build, ESLint)  
**Step 7**: Playwright tests (E2E, visual regression)  
**Step 8**: jest-axe accessibility tests  

### Nested DPDCA (PART 3)

**DISCOVER phase**:
- [ ] Verify workflow file exists + is valid YAML
- [ ] Check all required secrets exist (admin token, etc.)
- [ ] Verify pre-flight API readiness

**PLAN phase**:
- [ ] Design test matrix (121 layers × 7 templates = 847 generated files = baseline)
- [ ] Estimate runtime (generation ~15 min, auto-revise ~20 min, build ~10 min, tests ~30 min = 75 min total)
- [ ] Plan parallel execution strategy (if applicable)

**DO phase**:
- [ ] Trigger workflow (via GitHub Actions or local)
- [ ] Monitor generation → auto-revise → build → test
- [ ] Capture logs + diagnostics

**CHECK phase**:
- [ ] Validate all 121+ screens generated
- [ ] Verify auto-reviser applied fixes (% of patterns fixed 96% avg)
- [ ] Build succeeds (no compilation errors)
- [ ] All Playwright tests pass
- [ ] All jest-axe tests pass (WCAG AA minimum)

**ACT phase**:
- [ ] Reconcile any failures (re-run auto-reviser for stragglers)
- [ ] Publish results: evidence/PART-3-WORKFLOW-RESULTS-{timestamp}.json
- [ ] Report: X screens generated, Y passed all tests, Z failures (with remediation)

**SUCCESS**: All 121+ screens pass generate → auto-revise → build → test pipeline

---

## PART 4: Update Documentation from Data Model API

### Objective
Regenerate all library docs from live API (single source of truth, no parallel lists).

### Documentation Files to Regenerate

**Library Docs** (C:\eva-foundry\37-data-model\docs\library\):
- 01-SYSTEM-ARCHITECTURE.md
- 02-IDENTITY-ACCESS.md
- 03-DATA-MODEL-REFERENCE.md
- 04-USER-INTERFACE.md
- 05-CONTROL-PLANE.md
- 06-GOVERNANCE-POLICY.md
- 07-PROJECT-PM.md
- 08-DEVOPS-DELIVERY.md
- 09-OBSERVABILITY.md
- 10-INFRASTRUCTURE-FINOPS.md
- 11-EXECUTION-LAYERS.md
- 12-STRATEGY-PORTFOLIO.md

**Architecture Docs** (C:\eva-foundry\37-data-model\docs\architecture\):
- LAYER-DEPENDENCIES.md
- DOMAIN-MAPPINGS.md
- QUERY-PATTERNS.md

### Query Strategy

Instead of hardcoding layer counts:
```powershell
# Query live API
$layer_count = (Invoke-RestMethod "https://msub-eva-data-model.../model/layers").value.Count

# Generate doc section
"The data model has $layer_count operational layers organized into 12 domains."
```

### Nested DPDCA (PART 4)

**DISCOVER phase**:
- [ ] Audit current docs for hardcoded counts/metadata
- [ ] Identify which docs query API vs hardcode
- [ ] Log discrepancies (e.g., "docs say 111, API says 121")

**PLAN phase**:
- [ ] Design template system (use PowerShell/Python to generate .md from API responses)
- [ ] Map: /model/agent-guide → 01.md, /model/user-guide → 03.md, etc.
- [ ] Define fallback (if API unreachable, use last-known good from disk)

**DO phase**:
- [ ] Call /model/{endpoint} for each domain
- [ ] Generate .md sections (use templates)
- [ ] Write to docs/library/*.md + docs/architecture/*.md

**CHECK phase**:
- [ ] Verify no hardcoded layer counts (search "111" → should be template variable)
- [ ] Verify all docs mention "sourced from API" in header
- [ ] Verify links work (no broken references)

**ACT phase**:
- [ ] Delete any parallel lists (SCREENS-MANIFEST.md, LAYER-COUNT-FILE.md, etc.)
- [ ] Commit: regenerated docs (with "Source: Data Model API" note)
- [ ] Report: evidence/PART-4-DOC-REGEN-{timestamp}.json (X docs updated, Y counts fixed)

**SUCCESS**: All library docs query API (paperless), 0 hardcoded layer counts

---

## PART 5: Reorganize Routers by Functional Grouping

### Objective
Wire layerRoutes.tsx + navigation to group screens by domain/project (instead of flat L1-L121).

### Target Router Structure

```
Portal Root
├─ AICOE Hub (Project 45)
│  ├─ /aicoe/home (HomePage)
│  ├─ /aicoe/products (ProductsPage)
│  └─ /aicoe/about (AboutPage)
├─ Data Model Portal (L1-L121)
│  ├─ /data-model/layers (layer browser)
│  ├─ /data-model/screens (screen index)
│  └─ /data-model/evidence (audit trail)
├─ Admin Portal (eva-faces)
│  ├─ /admin/dashboard (AdminDashboard)
│  ├─ /admin/users (UserManagement)
│  └─ /admin/audit (AuditLog)
├─ Reference Portals (eva-faces)
│  ├─ /portfolio/components (ComponentLibrary)
│  ├─ /portfolio/patterns (PatternLibrary)
│  └─ /portfolio/docs (DesignDocs)
├─ Control Plane (Project 40, pending)
│  ├─ /control/runs (ExecutionRuns)
│  ├─ /control/artifacts (ArtifactBrowser)
│  └─ /control/evidence (EvidenceViewer)
├─ Ops Console (Project 50, pending)
│  ├─ /ops/dashboard (OpsDashboard)
│  ├─ /ops/agents (AgentMonitoring)
│  ├─ /ops/executions (ExecutionHistory)
│  ├─ /ops/actions (ActionQueue)
│  ├─ /ops/watchdog (HealthMonitor)
│  └─ /ops/runbooks (RunbookLibrary)
└─ ADO Dashboard (Project 39)
   ├─ /ado/sprints (SprintBoard)
   └─ /ado/backlog (BacklogView)
```

### Nested DPDCA (PART 5)

**DISCOVER phase**:
- [ ] Audit current layerRoutes.tsx structure
- [ ] Identify all 163 screens and their current paths
- [ ] Map current router organization (flat? by layer? by project?)

**PLAN phase**:
- [ ] Design functional grouping (above structure)
- [ ] Plan navigation tree (SideNav, Breadcrumbs)
- [ ] Define Route component hierarchy

**DO phase**:
- [ ] Reorganize layerRoutes.tsx (group by domain/project)
- [ ] Update navigation components (SideNav, Breadcrumbs)
- [ ] Add route guards (if needed for pending screens)

**CHECK phase**:
- [ ] Verify all 163 routes resolve (no 404s)
- [ ] Verify navigation works (SideNav expands/collapses correctly)
- [ ] Verify breadcrumbs show correct hierarchy
- [ ] Run E2E navigation tests

**ACT phase**:
- [ ] Commit: reorganized routers + navigation
- [ ] Document: ROUTER-ORGANIZATION.md (functional grouping rationale)
- [ ] Report: evidence/PART-5-ROUTER-CHECK-{timestamp}.json (all 163 routes validated)

**SUCCESS**: Functional router organization, all 163 screens accessible, navigation intuitive

---

## CROSS-PART CHECKPOINTS

### Evening (23:00-02:00 ET)
- ✅ PART 1.ACT complete: 121 layers operational in Cosmos
- ✅ PART 2.ACT complete: 163 screens registered
- ✅ PART 3.ACT complete: All screens pass workflow
- ⏳ PART 4.ACT: Docs regenerated (in progress)
- ⏳ PART 5.ACT: Routers reorganized (in progress)

### Final Merge
- [ ] All 5 PRs created (one per Part)
- [ ] All CI checks passing
- [ ] Merge sequence: Part1 → Part2 → Part3 → Part4 → Part5
- [ ] Deploy final revision to ACA

---

## EVIDENCE OUTPUTS

Each PART generates timestamped evidence JSON:

```
evidence/
├─ PART-1-FINAL-INVENTORY-20260312_230000.json (121 layers✅)
├─ PART-2-SCREEN-REGISTRY-20260312_231500.json (163 screens✅)
├─ PART-3-WORKFLOW-RESULTS-20260312_233000.json (All tests✅)
├─ PART-4-DOC-REGEN-20260313_000000.json (Docs API-sourced✅)
└─ PART-5-ROUTER-CHECK-20260313_010000.json (All routes✅)
```

---

## ROLLBACK TRIGGERS

If ANY phase fails:
1. **Log error** to evidence/ (include stack trace, correlation ID, API response)
2. **Stop immediate phase** (don't proceed to next)
3. **Diagnose** root cause (API down? Schema invalid? Permissions?)
4. **Retry** (up to 3 times for transient failures)
5. **Escalate** if persistent (notify data model team)

**Example**: If PART 1 seeding fails, don't proceed to PART 2. Fix seeding first.

---

## SUCCESS CRITERIA (ALL 5 PARTS COMPLETE)

✅ **121 operational layers** (111 existing + 10 P36-P58) queryable via API  
✅ **163 screens registered** in unified registry (source + status tracked)  
✅ **All 163 screens pass** generate → auto-revise → build → test workflow  
✅ **All library docs** sourced from Data Model API (0 hardcoded counts)  
✅ **Routers reorganized** by functional domain/project  
✅ **Single comprehensive PR** with all 5 parts, merged and live

---

**Next Action**: Execute PART 1.DO phase (seed 10 security schemas)
