# Extended Component Refactoring Roadmap: 161 Screens

**Scope**: Scale Batch 1-4 refactoring from 112 layers to 161 total screens  
**Status**: Ready for implementation  
**Session**: 47, March 12, 2026  

---

## Current State → Target State

```
CURRENT (Session 47 Part A):
├─ Batch 1 Scripts Created: ✅ Ready
├─ Test ID Naming: ✅ Defined
├─ E2E Infrastructure: ✅ Complete (101 Playwright tests)
├─ Router: 128 routes (37-data-model only)
└─ Screens: 128 (7 portal + 10 admin + 111 layers)

TARGET (With Integration):
├─ Batch 1-4 Scripts: ✅ Will create extended versions
├─ Test ID Coverage: ✅ Extended to 350-500 total
├─ E2E Infrastructure: ✅ Extended to 200+ tests
├─ Router: 161 routes (37-data-model + 31-eva-faces)
└─ Screens: 161 (20 portal + 30 admin + 111 layers)
```

---

## Batch Strategy Breakdown

### The 4 Batches (Extended for 161 Screens)

```
BATCH 1 (20 LAYERS, ~60-80 SCREENS)
├─ Priority: 🔴 CRITICAL
├─ Layers: L25-29, L31, L34, L38, L40-46 (20 layers)
├─ Each layer has: ListView + CreateForm + EditForm + DetailDrawer
├─ Test IDs per batch: ~40-50
├─ Time estimate: 15-20 min (current: 20 min) ← IN PROGRESS
├─ Implementation: Current scripts (Add-TestIdsToBatch.ps1, Smart-Add-TestIds.ps1)
└─ + Portal screens (5-10 early portal pages)

BATCH 2 (40 LAYERS, ~120-160 SCREENS)
├─ Priority: 🔵 HIGH
├─ Layers: L50-89 (40 layers - model/API infrastructure)
├─ Each layer has: ListView + CreateForm + EditForm + DetailDrawer
├─ Test IDs: ~80-120
├─ Time estimate: 25-35 min
├─ Implementation: Extend Smart-Add-TestIds.ps1
└─ + Admin pages (first batch of admin-face pages)

BATCH 3 (30 LAYERS, ~90-120 SCREENS)
├─ Priority: 🟡 MEDIUM-HIGH  
├─ Layers: L16-24, L43-49 (30 layers - deployment/ops)
├─ Each layer has: ListView + DetailDrawer + GraphView
├─ Test IDs: ~60-90
├─ Time estimate: 20-30 min
├─ Implementation: Extend Smart-Add-TestIds.ps1
└─ + Admin pages (remaining admin-face pages)

BATCH 4 (21 LAYERS + 50 UI SCREENS, ~71-121 SCREENS)
├─ Priority: 🟡 MEDIUM
├─ Layers: L2-11, L18 (21 strategy/planning layers)
├─ UI Screens: 20 portal + 30 admin (from eva-faces integration)
├─ Test IDs: ~50-80
├─ Time estimate: 20-30 min
├─ Implementation: New Batch4-Unified-Orchestrator.ps1
└─ Focus: Strategy layers + unified portal/admin refactoring

TOTAL: 111 layers + 50 UI screens = 161 screens
TOTAL TEST IDs: ~230-340 (significant E2E coverage)
TOTAL TIME: ~90-130 minutes (~2-2.5 hours)
```

---

## Batch 1 (CURRENT - 20 Layers)

### Target Layers

| Layer # | Name | Component Files | Test IDs |
|---------|------|-----------------|----------|
| L25 | projects | ListView, CreateForm, EditForm, DetailDrawer | 8-10 |
| L26 | wbs | ListView, CreateForm, EditForm, DetailDrawer | 8-10 |
| L27 | sprints | ListView, CreateForm, EditForm, DetailDrawer | 8-10 |
| L28 | stories | ListView, CreateForm, EditForm, DetailDrawer | 8-10 |
| L29 | tasks | ListView, CreateForm, EditForm, DetailDrawer | 8-10 |
| L31 | evidence | ListView, CreateForm, EditForm, DetailDrawer | 12-15 |
| L34 | quality_gates | ListView, CreateForm, EditForm, DetailDrawer | 10-12 |
| L38 | work_step_events | ListView, CreateForm, EditForm, DetailDrawer | 8-10 |
| L40 | relationships | DetailDrawer, GraphView | 6-8 |
| L41 | ontology_mapping | ListView, DetailDrawer | 6-8 |
| L42 | system_metrics | GraphView, ListView | 8-10 |
| L43 | adoption_metrics | GraphView, ListView | 8-10 |
| L45 | verification_records | ListView, DetailDrawer | 8-10 |
| L46 | project_work | ListView, CreateForm, EditForm, DetailDrawer | 10-12 |
| L03 | agents | ListView, CreateForm, DetailDrawer | 6-8 |
| L04 | agent_tools | ListView, DetailDrawer | 6-8 |
| L12 | deployment_targets | ListView, CreateForm, EditForm | 8-10 |
| L13 | deployments | ListView, DetailDrawer, GraphView | 8-10 |
| L14 | execution_logs | ListView, DetailDrawer | 6-8 |
| L15 | execution_traces | ListView, DetailDrawer, GraphView | 8-10 |

**Total**: 20 layers, ~80 component instances, 160-200 test IDs  
**Execution**: Ready now with current scripts  
**Status**: ✅ Scripts created, ready to run

---

## Batch 2 (40 Layers)

### Target Layers (Model/API Infrastructure)

```
L50-L89: API, Data Model, Validation, Schema, Documentation
├─ API Endpoints (L50-60): 10 layers
├─ Data Model Layers (L61-70): 10 layers
├─ Validation Rules (L71-75): 5 layers
├─ Schema Management (L76-80): 5 layers
├─ Configuration & Docs (L81-89): 9 layers
└─ Plus: First batch of captured admin-face pages (10-15)
```

### Component Files per Layer

- ListView: List of items (all 40)
- CreateForm: Add new item (20 layers)
- EditForm: Modify item (20 layers)
- DetailDrawer: View details (all 40)
- GraphView: Relationships (8 layers)

**Total**: 40 layers, ~160 component instances, 240-320 test IDs  
**Estimated Time**: 25-35 minutes  
**Scripts**: Extend Smart-Add-TestIds.ps1 with batch 2 layer list

### Script Modification

```powershell
# Batch 2
$batch2Layers = @(
    'api_endpoints', 'api_versions', 'api_documentation',
    'api_testing', 'api_monitoring', 'api_contracts',
    'model_schema', 'model_queries', 'model_mutations',
    'model_subscriptions', 'model_validation', 'model_security',
    'model_performance', 'model_caching', 'model_telemetry',
    'config_defs', 'env_vars', 'secrets_catalog',
    'runtime_config', 'workspace_config', 'hooks',
    'instructions', 'literals', 'prompts', 'runbooks',
    'tech_stack', 'connections', 'schemas', 'services',
    'containers', 'environments', 'mcp_servers',
    'ci_cd_pipelines', 'error_catalog', 'request_response_samples',
    'testing_policies', 'test_cases', 'synthetic_tests',
    'validation_rules', 'ts_types', 'components'
)

# Usage
.\Smart-Add-TestIds.ps1 -BatchNumber 2 -Verbose
```

---

## Batch 3 (30 Layers)

### Target Layers (Deployment/Observability)

```
L16-24, L43-49: Deployment, Infrastructure, Observability
├─ Deployment (L16-18): 3 layers
├─ Infrastructure (L19-21): 3 layers  
├─ Monitoring & Events (L43-49): 7 layers
├─ Compliance & Audit (L22-24): 3 layers
├─ Remediation (L50-53): 4 layers
├─ Metrics & Reports (L54-60): 7 layers
├─ Costs & Resources (L61-65): 5 layers
└─ Plus: Remaining admin-face pages (5-10)
```

### Component Types

- ListView (all 30 layers)
- DetailDrawer (all 30)
- GraphView (8 layers - relationships/timelines)
- FilterPanel (10 layers - complex queries)

**Total**: 30 layers, ~120 component instances, 180-240 test IDs  
**Estimated Time**: 20-30 minutes  
**Key**: Infrastructure/observability screens often have charts and complex filters

### Test ID Patterns for Batch 3

```typescript
// Infrastructure screens
"infrastructure-list"              // List of resources
"infrastructure-filter-region"     // Filter by region
"infrastructure-chart-costs"       // Cost chart
"deployment-timeline"              // Timeline visualization

// Audit logs
"audit-logs-table"                 // Log table
"audit-logs-filter-severity"       // Severity filter
"audit-logs-export-button"         // Export data
```

---

## Batch 4 (21 Layers + 50 UI Screens)

### Batch 4A: Strategy Layers (21 Layers)

```
L02-L11, L18: Strategy, Planning, Goals, Roadmap
├─ Goals (L02-03): 2 layers
├─ Milestones (L04-05): 2 layers
├─ Roadmap (L06-07): 2 layers
├─ Planning (L08-10): 3 layers
├─ Personas (L11): 1 layer
├─ Decision Records (L18): 1 layer
└─ Plus supporting strategy layers
```

**Total Layers**: 21  
**Test IDs**: ~60-80

### Batch 4B: Portal Pages (13 pages from eva-faces)

```
Portal screens to add test IDs:
├─ dashboard (data-testid="portal-dashboard-*")
├─ profile (data-testid="portal-profile-*")
├─ settings (data-testid="portal-settings-*")
├─ notifications (data-testid="portal-notifications-*")
├─ search (data-testid="portal-search-*")
├─ analytics (data-testid="portal-analytics-*")
└─ 7 more portal screens
```

**Total Pages**: 13  
**Test IDs per page**: 2-4  
**Total Portal Test IDs**: 26-52

### Batch 4C: Admin Pages (20 pages from eva-faces)

```
Admin screens to add test IDs:
├─ team-management (data-testid="admin-team-*")
├─ role-configuration (data-testid="admin-roles-*")
├─ permission-matrix (data-testid="admin-perms-*")
├─ security-policies (data-testid="admin-security-*")
├─ compliance-reporting (data-testid="admin-compliance-*")
└─ 15 more admin screens
```

**Total Pages**: 20  
**Test IDs per page**: 2-4  
**Total Admin Test IDs**: 40-80

### Batch 4 Total

**Layers**: 21  
**UI Screens**: 50 (13 portal + 20 admin)  
**Total Test IDs**: 126-212  
**Time**: 30-45 min  

---

## New Orchestrator Scripts

### Batch4-Unified-Orchestrator.ps1

For Batch 4, create new orchestrator that handles both layers and UI screens:

```powershell
# New script: Batch4-Unified-Orchestrator.ps1
# Purpose: Handle refactoring of 21 strategy layers + 50 UI screen pages

function Refactor-StrategyLayers {
    param([string]$BatchPath)
    .\Smart-Add-TestIds.ps1 -BatchNumber 4 -Verbose
}

function Refactor-PortalPages {
    param([string]$PagesPath)
    # Add test IDs to portal page components
}

function Refactor-AdminPages {
    param([string]$PagesPath)
    # Add test IDs to admin page components
}

# Phase 1: Strategy layers
Refactor-StrategyLayers

# Phase 2: Portal pages
Refactor-PortalPages

# Phase 3: Admin pages
Refactor-AdminPages

# Phase 4: Validate all 161 screens
npm run type-check
npm run lint
npm run test:e2e -- --project=chromium
```

---

## Testing Impact

### Current Playwright Tests (Session 47 Part A)

```
101 tests across 7 spec files:
├─ functional.spec.ts (19 tests)
├─ error-handling.spec.ts (15 tests)
├─ performance.spec.ts (12 tests)
├─ cross-browser.spec.ts (16 tests)
├─ accessibility.spec.ts (18 tests)
├─ e2e.spec.ts (15 tests - workflows)
└─ integration.spec.ts (6 tests)
```

### Extended Test Coverage (Post-Batch 1-4)

```
Extend to 200+ tests:
├─ Layer pages (111): 111-150 tests (1-2 per layer)
├─ Portal pages (20): 20-40 tests (1-2 per page)
├─ Admin pages (30): 30-60 tests (1-2 per page)
├─ Cross-browser matrix: All tests × 9 projects
├─ Accessibility audit: All 161 screens
└─ Performance baseline: All screen loads
```

### New Test Spec Files Needed

1. **portal-pages.spec.ts** (20-40 tests for portal screens)
2. **admin-pages.spec.ts** (30-60 tests for admin screens)
3. **unified-navigation.spec.ts** (20 tests for router/navigation)
4. **unified-accessibility.spec.ts** (161 accessibility checks)
5. **unified-performance.spec.ts** (161 load time benchmarks)

---

## Execution Timeline

### Week 1
- **Mon**: Batch 1 refactoring (20 layers, 20 min)
- **Tue**: Router integration (161 routes, 1 hour)
- **Wed**: Extended test coverage for portal/admin pages
- **Thu**: Batch 2 refactoring (40 layers, 30 min)
- **Fri**: Batch 2 validation + tests

### Week 2
- **Mon**: Batch 3 refactoring (30 layers, 30 min)
- **Tue**: Batch 3 validation + infrastructure tests
- **Wed**: Batch 4 refactoring (21 layers + 50 UIs, 40 min)
- **Thu**: Full validation (161 screens, all tests)
- **Fri**: Documentation + lessons learned

**Total Active Time**: ~3-4 hours  
**Total Calendar Time**: 2 weeks  

---

## Success Criteria (Extended)

### Per Batch
- ✅ All layers/screens refactored with test IDs
- ✅ TypeScript compilation succeeds
- ✅ ESLint clean
- ✅ Prettier formatted

### Cross-Batch
- ✅ All 161 routes in unified router
- ✅ Navigation works across all screens
- ✅ No import/loading errors
- ✅ All shared providers work

### Testing
- ✅ 200+ Playwright tests running
- ✅ 80%+ test pass rate (post-integration)
- ✅ All 161 screens load without errors
- ✅ Performance baseline <3s per screen

### Integration
- ✅ Autonomous Factory ready (5 machines can process)
- ✅ Auto-Reviser/Fixer pipeline functional
- ✅ Evidence tracking enabled (L31, L26, L46)
- ✅ MTI score >70 for all 161 screens

---

## Risk Mitigation

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Batch 2-4 fail due to layer changes | Low | Use same Smart-Add-TestIds.ps1 engine |
| Router becomes too complex (161 routes) | Low | Use modular route arrays |
| Test IDs conflict between eva-faces and 37 | Medium | Namespace prefixes (portal-, admin-, eva-faces-) |
| Authentication/context fails on eva-faces pages | Medium | Ensure unified provider setup |
| Performance degradation with 161 screens | Low | Lazy loading + code splitting already implemented |

---

## Automation Opportunity

**Mega-Orchestrator**: Single script that runs all 4 batches

```powershell
# Mega-Orchestrator.ps1
# Runs all batches + router integration + full validation

.\Batch1-Refactoring-Orchestrator.ps1
.\Router-Integration.ps1
.\Batch2-Refactoring-Orchestrator.ps1
.\Batch3-Refactoring-Orchestrator.ps1
.\Batch4-Unified-Orchestrator.ps1
.\Full-Validation-Suite.ps1

# Result: All 161 screens refactored + tested in <5 hours
```

---

## Alignment with Architecture Documents

### EVA-AUTONOMOUS-FACTORY.md Impact

```
5 Machines × 161 Screens = 805 total PRs (vs. 555 for 111 layers)

Machine Expansion:
1. Screens Machine: 111 → 161 target screens
2. API Machine: 111 → 161 endpoint support
3. Infrastructure Machine: Add 50 UI infrastructure
4. Security Machine: Add 50 UI security policies
5. Data Machine: 111 → 161 data models
```

### AUTO-REVISER-FIXER-PIPELINE.md Impact

```
Pipeline scale: 111 layers → 161 screens
Components to validate: 300+ (from 80-90)
Test IDs to verify: 400-500 (from 265)
Validation time: 2-3 min/layer → ~15-20 min total
```

---

## Next Phase: Autonomous Factory Deployment

After all 4 batches complete:

1. Trigger 5-machine deployment
2. Generate 805 PRs (161 × 5 machines)
3. Apply Auto-Reviser/Fixer pipeline
4. Run comprehensive validation
5. Deploy all 161 screens to production

**Estimated time**: 4-6 hours unattended

---

**Session 47 - March 12, 2026**  
**Extended refactoring roadmap for 161 unified screens**  
**Ready for router integration and batch execution**
