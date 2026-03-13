# Unified Screen Manifest: 139-161 Screens (Data Model + EVA Faces)

**Created**: Session 47, March 12, 2026  
**Status**: Ready for integration  
**Total Screens**: 128 (37-data-model) + 33 (31-eva-faces) = **161 screens**  
**Scope**: All UI surfaces across EVA ecosystem

---

## Screen Inventory Summary

```
┌─────────────────────────────────────────────────────────┐
│                 EVA UNIFIED SCREEN MANIFEST               │
├─────────────────────────────────────────────────────────┤
│ Source: 37-data-model                                    │
├─────────────────────────────────────────────────────────┤
│  Portal Pages:                                    7      │
│  Admin Pages:                                    10      │
│  Data Model Layer Pages (L1-L111):              111      │
│  Subtotal from 37-data-model:                   128      │
├─────────────────────────────────────────────────────────┤
│ Source: 31-eva-faces                                     │
├─────────────────────────────────────────────────────────┤
│  admin-face Pages:                               20      │
│  portal-face Pages:                              13      │
│  Subtotal from 31-eva-faces:                     33      │
├─────────────────────────────────────────────────────────┤
│  TOTAL SCREENS:                                 161      │
└─────────────────────────────────────────────────────────┘
```

---

## Detailed Screen Breakdown

### Category 1: Portal Pages (7 + 13 = 20 screens)

#### From 37-data-model/ui/src/pages/portal/
```
1. EVAHomePage                   - Landing/dashboard
2. ModelBrowserPage              - Data model explorer
3. ModelGraphPage                - 111 layers as graph
4. ModelReportPage               - Analytics/metrics
5. ProjectPortfolioPage          - Project management dashboard
6. SprintBoardPage               - Agile sprint tracker
7. WBSTreePage                   - Work breakdown structure
```

**Routes**: /eva-home, /model-browser, /model-graph, /model-report, /project-portfolio, /sprint-board, /wbs-tree

#### From 31-eva-faces/portal-face/src/
```
8. Dashboard                     - Eva Faces main dashboard
9. UserProfile                   - User management
10. Settings                     - Configuration
11. Analytics                    - Portal analytics
12. NotificationCenter           - Notifications
13. Search                       - Global search
14-20. [Various portal screens]  - Additional portal screens (13 total)
```

**Integration**: Will be imported and added to portalRoutes

**Total Portal**: 20 screens

---

### Category 2: Admin Pages (10 + 20 = 30 screens)

#### From 37-data-model/ui/src/pages/admin/
```
1. AppsPage                      - Application management
2. AuditLogsPage                 - Audit trail viewer
3. FeatureFlagsPage              - Feature flag configuration
4. IngestionRunsPage             - Data ingestion monitoring
5. RbacPage                      - Role-based access control
6. RbacRolesPage                 - Role definitions
7. SearchHealthPage              - Search infrastructure health
8. SettingsPage                  - Admin settings
9. SupportTicketsPage            - Support ticket management
10. TranslationsPage             - Multi-language management
```

**Routes**: /admin/*, prefix-based routing

#### From 31-eva-faces/admin-face/src/
```
11. TeamManagement               - Team/org structure
12. RoleConfiguration            - Advanced RBAC
13. PermissionMatrix             - Permission management
14. SecurityPolicies             - Security configuration
15. ComplianceReporting          - Compliance dashboard
16. AuditTrail                   - Detailed audit logs
17. SystemHealth                 - System monitoring
18. AlertConfiguration           - Alert management
19-30. [Various admin screens]   - Additional admin functions (20 total)
```

**Integration**: Add as adminRoutes from evafaces

**Total Admin**: 30 screens

---

### Category 3: Data Model Layer Pages (111 screens)

#### Core Project Layers (L25-L29) - 5 screens
```
1. ProjectsListView              - L25: projects
2. WBSListView                   - L26: wbs
3. SprintsListView               - L27: sprints
4. StoriesListView               - L28: stories
5. TasksListView                 - L29: tasks
```

#### Evidence & Quality (L31, L34, L45) - 3 screens
```
6. EvidenceListView              - L31: evidence
7. QualityGatesListView          - L34: quality_gates
8. VerificationRecordsListView   - L45: verification_records
```

#### Work Execution (L38, L40-46) - 9 screens
```
9. WorkStepEventsListView        - L38: work_step_events
10. RelationshipsListView        - L40: relationships
...
```

#### Infrastructure & Ops (L12-15, L43-49) - 20+ screens
```
Deployment, Infrastructure, CI/CD, Monitoring...
```

#### Agent & ML (L03-04, L08-11) - 8 screens
```
Agents, Agent Tools, Workflows, ML Models...
```

#### Plus 66 more layer pages across all domains

**Total Layer Pages**: 111 screens

---

## Route Structure (New Unified Router)

```typescript
// New integrated router structure

// 1. Portal Routes (20 screens)
export const portalRoutes = [
  // 7 from 37-data-model
  { path: '/eva-home', element: <EVAHomePage /> },
  ...
  // 13 from 31-eva-faces
  { path: '/portal/dashboard', element: <DashboardPage /> },
  ...
]

// 2. Admin Routes (30 screens)  
export const adminRoutes = [
  // 10 from 37-data-model
  { path: '/admin/apps', element: <AppsPage /> },
  ...
  // 20 from 31-eva-faces
  { path: '/admin/team', element: <TeamManagementPage /> },
  ...
]

// 3. Layer Routes (111 screens)
export const layerRoutes = [
  { path: '/projects', element: <ProjectsListView /> },
  { path: '/wbs', element: <WBSListView /> },
  { path: '/sprints', element: <SprintsListView /> },
  ...
  // All 111 layers
]

// 4. Unified export
export const allRoutes = {
  portal: portalRoutes,
  admin: adminRoutes,
  layers: layerRoutes,
  total: 161
}
```

---

## Component Refactoring Scope

### Batch Refactoring Strategy

**Current Focus**: Batch 1 (20 core data layers with test IDs)

**Extended Scope for 161 Screens**:

```
Batch 1 (20 layers)
├─ Core project layers (L25-29): projects, wbs, sprints, stories, tasks
├─ Evidence/Quality (L31, L34, L45): evidence, quality_gates, verification_records
├─ Work Execution (L38, L40, L41, L42, L43, L46): events, relationships, metrics, work
└─ Operations (L03, L04, L12, L13, L14, L15): agents, deployment, infrastructure

Batch 2 (40 layers) - Model & API Infrastructure
├─ Data Model layers (L50-89): model_objects, schema, validation, API endpoints
├─ Services & Infrastructure (L16-24): services, containers, environments
└─ Supporting infrastructure

Batch 3 (30 layers) - Deployment & Observability
├─ Deployment records & targets
├─ Infrastructure drift & events
├─ Audit logs & compliance
└─ Monitoring & observability

Batch 4 (22 layers + Portals + Admin) - Strategy & UI Surfaces
├─ Strategy & planning (L02-11): goals, milestones, roadmap
├─ Portal pages (20 screens): From 37 + eva-faces
├─ Admin pages (30 screens): From 37 + eva-faces
└─ Unified integration & testing
```

**New Totals for Full Refactoring**:
- Batch 1: 20 layer pages (current)
- Batch 2: 40 layer pages
- Batch 3: 30 layer pages  
- Batch 4: 21 layer pages + 50 portal/admin screens
- **Total**: 161 screen pages

---

## Test ID Refactoring Impact

### Current Test IDs (Batch 1): 240-280 test IDs

For 161 total screens, estimate:
- **Layer pages**: 111 screens × 2-3 test IDs per page = ~250-330 test IDs
- **Portal pages**: 20 screens × 1-2 test IDs per page = ~20-40 test IDs
- **Admin pages**: 30 screens × 1-2 test IDs per page = ~30-60 test IDs
- **Shared components**: ~50-100 shared test IDs (navigation, menus, dialogs)

**Total Estimated Test IDs**: 350-530 test IDs across 161 screens

### Naming Convention Extended

For portal/admin screens (not tied to data model layers):

```typescript
// Portal screens
portal-browser-list          // ModelBrowserPage list
portal-graph-container       // ModelGraphPage container
portal-report-chart          // ModelReportPage chart

// Admin screens
admin-apps-table             // AppsPage table
admin-audit-logs-filter      // AuditLogsPage filter
admin-rbac-matrix            // RbacPage matrix

// Shared components (all screens)
nav-main-menu                // Primary navigation
dialog-confirm               // Confirmation dialog
toast-message                // Toast notifications
modal-settings               // Settings modal
```

---

## Autonomous Factory Integration

### Machine 1: Screens Machine (Now with 161 Target Screens)

**Input**: 161 screen definitions (111 layers + portal + admin)  
**Process**: Generate React components with test IDs  
**Output**: 161 production-ready screens with:
- ✅ Data-testid attributes for Playwright
- ✅ Accessibility features (keyboard nav, ARIA labels)
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design

**Timeline**: 555 PRs across all machines (111 × 5), but adjusted for 161 screens

### Auto-Reviser/Fixer Pipeline Application

The AUTO-REVISER-FIXER-PIPELINE pattern applies to all 161 screens:

```
[1. GENERATE] (161 screens)
    ↓
[2. VALIDATE] (TypeScript, ESLint, Prettier on all 161)
    ↓
[3. FIX] (Auto-repair CSS backticks, missing types, imports)
    ↓
[4. REVALIDATE] (Verify fixes)
    ↓
[5. TEST] (E2E tests for all 161 screens - 101 Playwright tests)
    ↓
[6. VERIFY] (Coverage >80%, MTI >70)
    ↓
[7. EVIDENCE] (Track costs, metrics, audit trail)
    ↓
[8. SUBMIT] (PR only if all gates pass)
```

---

## Implementation Roadmap

### Phase 1: Router Integration (This Week)
- [ ] Create unified layerRoutes.tsx consolidating both projects
- [ ] Import 31-eva-faces pages into 37-data-model routing
- [ ] Validate all 161 routes resolve correctly
- [ ] Test navigation between all screens

### Phase 2: Test ID Refactoring (Batch 1-4)
- [ ] Execute Batch 1 (20 core layers) - **IN PROGRESS**
- [ ] Execute Batch 2 (40 model layers)
- [ ] Execute Batch 3 (30 deployment layers)
- [ ] Execute Batch 4 (21 strategy + 50 portal/admin)

### Phase 3: E2E Test Coverage
- [ ] Extend Playwright tests from 19 (functional) to 50+ (all screen types)
- [ ] Add visual regression baselines for all 161 screens
- [ ] Create performance benchmarks for each screen category
- [ ] Implement accessibility audit for all screens

### Phase 4: Autonomous Factory Integration
- [ ] Deploy Screens Machine (generate all 161 screens with test IDs)
- [ ] Apply Auto-Reviser/Fixer pipeline to all generated code
- [ ] Run full E2E test suite (5+ hour validation)
- [ ] Deploy to production

---

## File Structure (Updated)

```
37-data-model/ui/src/
├── layerRoutes.tsx (CURRENTLY: 128 routes)
│   ├── portalRoutes (7)
│   ├── adminRoutes (10)
│   ├── layerRoutes (111)
│   └── acceleratorRoutes (0) → Will add evafaces routes here
├── pages/
│   ├── portal/ (7 pages)
│   ├── admin/ (10 pages)
│   ├── [111 layer folders]/
│   └── eva-faces/ ← NEW: Import from 31-eva-faces
└── components/ (112 + shared folders)

31-eva-faces/
├── admin-face/src/ (20 pages) ← To be imported to 37
├── portal-face/src/ (13 pages) ← To be imported to 37
└── agent-fleet/src/ (0 pages - agents only)
```

---

## Key Metrics

| Metric | Current | With Integration | Impact |
|--------|---------|-------------------|--------|
| **Total Screens** | 128 | 161 | +33 (+26%) |
| **Test IDs needed** | ~265 | ~450 | +185 (+70%) |
| **Playwright tests** | 101 | 200+ | +99 (+98%) |
| **Component files** | 80-90 | 150+ | +70 (+80%) |
| **Refactoring time** | 1 hr (Batch 1) | 4-5 hrs (all batches) | +300% |
| **Router complexity** | 128 routes | 161 routes | +26% |

---

## Next Steps

### Immediate (Today)
1. ✅ Create unified screen manifest (THIS DOCUMENT)
2. ⏳ Update router to import evafaces pages
3. ⏳ Validate all 161 routes compile

### Short Term (This Week)
1. Execute Batch 1 refactoring (20 layers + test IDs)
2. Create extended Batch 2-4 scripts for remaining 91 layers
3. Extend Playwright tests to cover portal/admin screens

### Medium Term (Next 2 weeks)
1. Complete all batches (Batch 1-4 = 161 screens)
2. Deploy unified router to production
3. Run full E2E validation (200+ tests)

### Long Term (Month 1+)
1. Apply Autonomous Factory to all 161 screens
2. Generate complete UI with test IDs in one sweep
3. Drive 0-production-ready AI system

---

## Architecture Alignment

This unified manifest aligns with:
- **EVA-AUTONOMOUS-FACTORY.md**: All 161 screens as inputs to 5 machines
- **AUTO-REVISER-FIXER-PIPELINE.md**: Quality gates apply to all 161 screens
- **BATCH-1-REFACTORING-GUIDE.md**: Extended to encompass entire screen portfolio
- **Component Test ID Infrastructure**: 350-530 test IDs across unified screen portfolio

---

## Success Criteria

✅ Unified router compiles with all 161 routes  
✅ All routes resolve without 404  
✅ Navigation works between portal/admin/layer screens  
✅ Test IDs added to 80%+ of screen components  
✅ All batches complete (1-4)  
✅ 200+ Playwright tests passing  
✅ MTI score >70 for all 161 screens  
✅ Zero console errors across all screens  

---

**Session 47 - March 12, 2026**  
**Ready for router integration and extended refactoring**
