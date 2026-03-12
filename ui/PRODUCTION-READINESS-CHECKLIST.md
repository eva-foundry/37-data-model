# Production Readiness Checklist

**Project**: EVA Data Model UI (37-data-model/ui)  
**Target**: 111 components (autonomous generation)  
**Status**: 🔴 NOT READY - 2/15 gates passed  
**Last Updated**: March 11, 2026 @ 04:15 AM

---

## User Requirement

> "I don't like acceptable before repeating something 100 times... I don't want to get tomorrow with a high bill to pay and the work is just acceptable."

**Translation**: Pattern must be EXCELLENT (production-ready) before autonomous deployment.

---

## Critical Gates (BLOCKING)

### ❌ Gate 0: CSS Foundation
**Status**: NOT STARTED  
**Requirement**: Professional UI foundation matching GC Design System

**Missing**:
- ❌ `src/styles/main.css` - Global resets, font-family, base colors
- ❌ `src/styles/tokens.ts` - Centralized GC Design tokens
- ❌ Focus management (WCAG 2.4.7: keyboard navigation)

**Reference**: Project 31 (eva-faces/portal-face/src/main.css)

**Action Items**:
1. Create `src/styles/main.css` with:
   - `*, *::before, *::after { box-sizing: border-box; }`
   - `font-family: "Lato", "Noto Sans", Arial, sans-serif;`
   - `:focus-visible { outline: 3px solid #1d70b8; outline-offset: 2px; }`
   - Base colors (GC_TEXT, GC_BLUE, GC_BORDER)

2. Create `src/styles/tokens.ts`:
   ```typescript
   export const GC_TEXT    = '#0b0c0e';
   export const GC_BORDER  = '#b1b4b6';
   export const GC_SURFACE = '#f8f8f8';
   export const GC_MUTED   = '#505a5f';
   export const GC_BLUE    = '#1d70b8';
   export const GC_ERROR   = '#d4351c';
   export const GC_SUCCESS = '#00703c';
   ```

3. Import in main.tsx: `import './styles/main.css';`

4. Refactor all components: `import { GC_TEXT, GC_BORDER } from '@/styles/tokens';`

**Cost Impact**: Without foundation, 111 components will have inconsistent rendering, no focus management, accessibility failures.

---

### ❌ Gate 1: TypeScript Compilation
**Status**: FAILED - 319 errors  
**Command**: `cd C:\eva-foundry\37-data-model\ui; npx tsc --noEmit`

**Error Categories**:
- 10 errors: `initial` variable undefined in ProjectsEditForm
- 12 errors: Unused GC_SURFACE, GC_SUCCESS constants
- 297 errors: Unknown (needs diagnosis)

**Action Items**:
1. Fix ProjectsEditForm.tsx line 107-116 (undefined `initial`)
2. Remove or use unused GC token constants
3. Run `npx tsc --noEmit 2>&1 | Out-File typescript-errors.txt`
4. Diagnose remaining 297 errors by category

**Cost Impact**: Cannot test in browser until compilation succeeds. Cannot deploy components that don't compile.

---

### ❌ Gate 2: i18n Consistency
**Status**: PARTIAL - 3/12 files fixed  
**Test**: All components use `useLiterals`, no hardcoded strings

**Violations** (8+ files):
- SprintsCreateForm: Inline `lang === 'fr' ? '...' : '...'`
- WBSCreateForm: Inline `lang === 'fr' ? '...' : '...'`
- ProjectsDetailDrawer: Inline literals
- WBSDetailDrawer: Inline literals
- SprintsDetailDrawer: Inline literals
- ProjectsGraphView: Mixed approach
- WBSGraphView: Mixed approach
- SprintsGraphView: Mixed approach

**Missing Namespaces** (6 needed):
- `wbs.create_form` (exists but not used)
- `projects.detail_view`
- `wbs.detail_view`
- `sprints.detail_view`
- `projects.graph_view`
- `wbs.graph_view`
- `sprints.graph_view`

**Action Items**:
1. Add missing namespaces to useLiterals.tsx (all 5 languages)
2. Refactor 8 components to use `const t = useLiterals('namespace');`
3. Replace all `lang === 'fr' ? '...' : '...'` with `t('key')`

**Cost Impact**: Multiplying hardcoded literals by 111 = 888+ hardcoded violations (unmaintainable).

---

### ❌ Gate 6: Evidence Integration
**Status**: NOT STARTED  
**Requirement**: Write to L31/L26/L46 for dashboard visibility

**Missing Integration** (Data Model API layers):
- ❌ **L31 (evidence)**: Component generation receipts
- ❌ **L26 (wbs)**: Task status updates
- ❌ **L46 (project_work)**: Overall project metrics
- ❌ **L45 (verification_records)**: Quality gate results

**Action Items**:
1. Create `src/lib/data-model-client.ts` (port from Project 48):
   - `writeEvidence()` → L31
   - `updateWBS()` → L26
   - `updateProjectWork()` → L46
   - `writeVerificationRecord()` → L45

2. Integrate in workflow:
   ```typescript
   // After component generated
   await writeEvidence({
     id: `${layerName}-component-${timestamp}`,
     project_id: '37-data-model',
     artifact_type: 'react_component',
     path: componentPath,
     test_count: 24,
     status: 'PASS'
   });
   
   // After task completed
   await updateWBS({
     id: wbsTaskId,
     status: 'completed'
   });
   ```

**Cost Impact**: Without evidence layer:
- ❌ NO audit trail (cannot prove components work)
- ❌ NO dashboard data (PM has zero visibility)
- ❌ NO progress tracking (cannot measure velocity)

---

### ❌ Gate 7: Cost Tracking
**Status**: NOT STARTED  
**Requirement**: Track agent costs to prevent bill overruns

**Action Items**:
1. Add cost tracking to workflow:
   ```typescript
   await writeCostRecord({
     layer: 'infrastructure_events',
     event_type: 'cloud_agent_execution',
     agent_name: 'github-copilot-cloud',
     duration_seconds: 180,
     cost_usd: 0.15, // estimated
     layer: 'L25',
     components_generated: 4
   });
   ```

2. Add budget alert:
   ```typescript
   const dailyCost = await getTotalCost(today);
   if (dailyCost > BUDGET_LIMIT_USD) {
     throw new Error(`Daily cost limit exceeded: $${dailyCost}`);
   }
   ```

3. Dashboard queries:
   - Total cost: `GET /model/infrastructure_events/aggregate?metrics=sum_cost_usd`
   - Cost per layer: `GET /model/infrastructure_events/aggregate?group_by=layer`

**Cost Impact**: Without tracking:
- ❌ Cannot prevent overruns (user's explicit concern)
- ❌ NO visibility into agent costs
- ❌ Cannot calculate ROI (cost vs time saved)

---

## Passing Gates (2/15)

### ✅ Gate 3: Component Structure
**Status**: PASS  
**Finding**: Proper React hierarchy (pages, components, hooks, context)

### ✅ Gate 4: Accessibility Attributes
**Status**: PASS  
**Finding**: ARIA attributes present (aria-label, role, aria-invalid)

---

## Overall Status

**Gates Passed**: 2/15 (13%)  
**Gates Failed**: 5/15 (33%)  
**Not Started**: 8/15 (54%)

**BLOCKING ISSUES**:
1. NO CSS foundation (inline styles everywhere, no focus management)
2. Code does NOT compile (319 TypeScript errors)
3. Inconsistent i18n (hardcoded literals in 8+ files)
4. NO evidence integration (cannot feed dashboards)
5. NO cost tracking (cannot prevent bills)

**DECISION**: ❌ **DO NOT deploy 111 components until ALL 15 gates pass.**

**Cost of Proceeding Now**:
- 111 components × 319 errors = 35,409 TypeScript errors
- 111 components × 8 hardcoded files = 888+ i18n violations
- 111 components × 0 evidence = NO audit trail, NO dashboard data
- 111 agents × unknown cost = Bill overrun risk
- Technical debt >> 315x ROI benefit

---

## Next Steps (Sequential)

**Step 1**: Fix Gate 0 (CSS Foundation)
- Create main.css + tokens.ts
- Refactor all components to import tokens
- Verify focus management works

**Step 2**: Fix Gate 1 (TypeScript)
- Diagnose all 319 errors
- Fix by category (unused vars, undefined vars, imports)
- Recompile until 0 errors

**Step 3**: Fix Gate 2 (i18n)
- Add missing namespaces to useLiterals.tsx
- Refactor 8 components
- Verify all 5 languages render

**Step 4**: Add Gate 6 (Evidence)
- Create data-model-client.ts
- Integrate L31/L26/L46 writes
- Verify dashboard queries work

**Step 5**: Add Gate 7 (Cost Tracking)
- Add infrastructure_events writes
- Add budget alert
- Verify cost dashboard

**Step 6**: Visual Demo
- Start dev server
- Test all 4 components
- Test all 5 languages
- Capture screenshots

**Step 7**: Deploy 111 Components
- ONLY after all 15 gates pass
- 104 GitHub issues (111 - 7 already designed)
- Cloud agents generate PRs
- Auto-reviser/fixer pipeline active
- Evidence written for every component

---

**Timeline Estimate** (assuming no parallel work):
- Gates 0-2: 4 hours (foundation + compilation + i18n)
- Gates 6-7: 2 hours (evidence + cost integration)
- Visual demo: 1 hour (testing + screenshots)
- Deploy 111: 7 days (autonomous, 10 PRs/day with review)

**Total**: ~1 day human work + 7 days autonomous operation

---

**Status**: 🔴 NOT READY - Foundation must be EXCELLENT before scaling to 111 components.
