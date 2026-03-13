# Fractal DPDCA Audit: UI Components

**Date**: March 11, 2026 @ 04:00 AM ET  
**Auditor**: GitHub Copilot (AIAgentExpert mode)  
**Scope**: c:\eva-foundry\37-data-model\ui\src\  
**Purpose**: Validate architecture before deployment

---

## DISCOVER Phase: Current State Assessment

### 1. Component Structure ✅ PASS

**Finding**: Proper React component hierarchy

```
src/
├── components/          ← Reusable UI components
│   ├── projects/        ← Layer-specific (L25)
│   ├── wbs/             ← Layer-specific (L26)
│   └── sprints/         ← Layer-specific (L27)
├── pages/               ← Full page views
│   ├── projects/
│   ├── wbs/
│   └── sprints/
├── hooks/               ← Custom React hooks
│   └── useLiterals.tsx
├── context/             ← React Context providers
│   └── LangContext.tsx
├── api/                 ← API mock layer
│   ├── projectsApi.ts
│   ├── wbsApi.ts
│   └── sprintsApi.ts
├── types/               ← TypeScript types
│   ├── projects.ts
│   ├── wbs.ts
│   └── sprints.ts
└── demo/                ← Demo harness
    ├── main.tsx         ← Entry point
    └── DemoApp.tsx      ← Demo navigation
```

**Assessment**: ✅ Follows React best practices (components, pages, hooks separation)

---

### 2. GC Design System Tokens ✅ PASS

**Finding**: Consistent GC Design System colors used across all components

**Tokens Used**:
```typescript
const GC_TEXT    = '#0b0c0e';  // Text (black)
const GC_BORDER  = '#b1b4b6';  // Border (grey)
const GC_SURFACE = '#f8f8f8';  // Surface (light grey)
const GC_MUTED   = '#505a5f';  // Muted text (dark grey)
const GC_BLUE    = '#1d70b8';  // Primary blue (links, actions)
const GC_ERROR   = '#d4351c';  // Error (red)
```

**Files Using Tokens**: 50+ matches across:
- All page components (ProjectsListView, WBSListView, SprintsListView)
- Demo harness (DemoApp.tsx)
- Graph views (WBSGraphView, SprintsGraphView)

**Hard-coded colors**: 2 instances of `#505a5f` in DemoApp (should use `GC_MUTED`)

**Assessment**: ✅ GC Design System properly leveraged

---

### 3. i18n (Internationalization) ⚠️ INCONSISTENT

**Finding**: Mixed i18n implementation patterns

#### ✅ Correct Pattern (useLiterals hook):
- **ProjectsListView**: `const t = useLiterals('projects.list_view');`
- **ProjectsCreateForm**: `const t = useLiterals('projects.create_form');`
- **ProjectsEditForm**: `const t = useLiterals('projects.edit_form');`
- **WBSEditForm**: `const t = useLiterals('wbs.edit_form');`
- **SprintsEditForm**: `const t = useLiterals('sprints.edit_form');`

#### ❌ Incorrect Pattern (inline literals with useLang):
- **SprintsCreateForm**: `const { lang } = useLang(); title: lang === 'fr' ? '...' : '...'`
- **WBSCreateForm**: `const { lang } = useLang(); title: lang === 'fr' ? '...' : '...'`
- **ProjectsDetailDrawer**: `const { lang } = useLang();` (inline hardcoded strings)
- **WBSDetailDrawer**: `const { lang } = useLang();` (inline hardcoded strings)
- **SprintsDetailDrawer**: `const { lang } = useLang();` (inline hardcoded strings)

#### Missing Namespaces in useLiterals:
- `wbs.create_form` - NOT in useLiterals.tsx
- `sprints.create_form` - ✅ EXISTS
- `projects.detail_view` - NOT in useLiterals.tsx
- `wbs.detail_view` - NOT in useLiterals.tsx
- `sprints.detail_view` - NOT in useLiterals.tsx
- `projects.graph_view` - useLiterals called but namespace missing
- `wbs.graph_view` - NOT in useLiterals.tsx
- `sprints.graph_view` - NOT in useLiterals.tsx

**Current useLiterals.tsx namespaces**:
- ✅ `projects.create_form`
- ✅ `projects.edit_form`
- ✅ `wbs.create_form`
- ✅ `wbs.edit_form`
- ✅ `sprints.create_form`
- ✅ `sprints.edit_form`

**Assessment**: ⚠️ **GATE FAILURE** - Inconsistent i18n, missing namespaces, hardcoded literals

---

### 4. a11y (Accessibility) ✅ PASS (with caveats)

**Finding**: ARIA attributes present, proper semantic HTML

**Good Practices Found**:
- `role="alert"` for error messages
- `role="region"` for page sections
- `aria-label` for semantic regions
- `aria-invalid` + `aria-describedby` for form validation
- `aria-modal="true"` for drawers/modals
- Tests verify ARIA attributes (`.test.tsx` files)

**Examples**:
```tsx
<div role="region" aria-label="Page header">
<div role="alert">Error message</div>
<input aria-invalid={!!errors.field} aria-describedby="field-error" />
```

**Keyboard Navigation**: Not audited (requires runtime testing)
**Focus Management**: Not audited (requires runtime testing)
**Screen Reader Testing**: Not performed

**Assessment**: ✅ ARIA attributes correct, runtime testing needed

---

### 5. CSS Architecture ❌ FAIL (Missing foundation)

**Finding**: NO external CSS files - all styles inline via React `style` prop

**Pattern**:
```tsx
<div style={{
  border: `1px solid ${GC_BORDER}`,
  color: GC_TEXT,
  padding: '20px'
}}>
```

**Missing from Reference Pattern** (Project 31 portal-face/src/main.css):
- ❌ Global reset (`*, *::before, *::after { box-sizing: border-box }`)
- ❌ Font-family declaration (Lato, Noto Sans, Arial fallback)
- ❌ Base font-size (16px) and line-height (1.5)
- ❌ Focus-visible outline (WCAG 2.4.7: `outline: 3px solid #1d70b8`)
- ❌ Link color (GC_BLUE: #1d70b8)
- ❌ Heading line-height (1.25)

**Assessment**: ❌ **NOT Production-Ready** - Cannot replicate 104 times without foundation  
**Impact**: Inconsistent browser rendering, accessibility failures, no focus management

---

### 6. TypeScript Compilation ❌ FAIL

**Finding**: 319 TypeScript errors

**Categories**:
1. **Unused variables**: `GC_SURFACE`, `GC_SUCCESS` declared but never used (6 files)
2. **Undefined variables**: `initial` not found in ProjectsEditForm (10+ errors)
3. **Import resolution**: May be tsconfig.json path mapping issue

**Assessment**: ❌ **GATE FAILURE** - Code does not compile

---

### 7. Evidence & WBS Integration ❌ MISSING

**Finding**: NO integration with Data Model API layers for governance

**Required Integration** (from Project 48 eva-veritas patterns):
- ❌ **L31 evidence layer**: Write artifact receipt for each component generated
- ❌ **L26 wbs layer**: Update task status (not_started → in_progress → completed)
- ❌ **L46 project_work layer**: Update overall project metrics (components_completed, mti_score)
- ❌ **L45 verification_records**: Write quality gate results (compile, lint, test)
- ❌ **Cost tracking**: Write infrastructure costs to feed dashboards

**Reference Pattern** (data-model-client.js):
```javascript
// After generating component
await writeEvidence({
  id: `${layer_name}-component-${timestamp}`,
  project_id: '37-data-model',
  artifact_type: 'react_component',
  path: 'src/components/projects/ProjectsListView.tsx',
  test_count: 15,
  lines_of_code: 250,
  status: 'PASS'
});

// After completing task
await updateWBS({
  id: `37-wbs-ui-projects-listview`,
  status: 'completed',
  completion_date: new Date().toISOString()
});

// After all components in batch
await updateProjectWork({
  id: '37-data-model-2026-03-11',
  metrics: {
    components_completed: 1,
    components_total: 111,
    mti_score: 75
  }
});
```

**Why This Matters**:
- **Dashboards require data**: MTI dashboards query L46, evidence dashboards query L31
- **Cost tracking**: Without infrastructure_events, cannot calculate ROI or prevent overruns
- **Audit trail**: Without evidence layer, no proof components were generated correctly
- **Progress visibility**: Without WBS updates, PM cannot see what's done

**Assessment**: ❌ **GATE FAILURE** - Workflow incomplete, cannot deploy without observability

---

## PLAN Phase: Required Fixes

### Priority 0: CSS Foundation (BLOCKING - NEW)
**Action**: Create proper CSS architecture before replicating 104 times

**Tasks**:
1. Create `src/styles/main.css` with:
   - Global reset (box-sizing, margin: 0)
   - Font-family: Lato, Noto Sans, Arial (GC Design System)
   - Base colors from GC tokens
   - Focus-visible outline (WCAG accessibility)
   - Link styles (GC_BLUE)
   - Heading line-height

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

3. Import main.css in main.tsx: `import './styles/main.css';`

4. Refactor all components to import tokens:
   ```typescript
   import { GC_TEXT, GC_BORDER } from '@/styles/tokens';
   ```

**Exit Criteria**: 
- main.css exists with GC Design System foundation
- tokens.ts centralized (0 local const declarations)
- All components import from tokens.ts
- Focus management works (keyboard navigation)

---

### Priority 1: TypeScript Compilation (BLOCKING)
**Action**: Fix all 319 compilation errors before any deployment

**Tasks**:
1. Fix `initial` variable scope in ProjectsEditForm
2. Remove unused variables (GC_SURFACE, GC_SUCCESS) OR use them
3. Verify tsconfig.json path mappings match Vite config
4. Run `npx tsc --noEmit` until 0 errors

**Exit Criteria**: `npx tsc --noEmit` returns exit code 0

---

### Priority 2: i18n Consistency (BLOCKING)
**Action**: Standardize all components to use `useLiterals` hook

**Tasks**:
1. Add missing namespaces to useLiterals.tsx:
   - `wbs.create_form` (already exists, but components don't use it)
   - `projects.detail_view`
   - `wbs.detail_view`
   - `sprints.detail_view`
   - `projects.graph_view`
   - `wbs.graph_view`
   - `sprints.graph_view`

2. Refactor components to use useLiterals:
   - SprintsCreateForm: Remove inline literals
   - WBSCreateForm: Remove inline literals
   - *DetailDrawer components: Remove inline literals
   - *GraphView components: Verify literals exist

**Exit Criteria**: 
- Zero hardcoded strings in components
- All text via `t('key')` pattern
- All 5 languages render correctly

---

### Priority 3: Evidence & WBS Integration (BLOCKING)
**Action**: Add Data Model API write-back to workflow

**Tasks**:
1. Create `src/lib/data-model-client.ts` (port from Project 48):
   - `writeEvidence()` → L31 evidence layer
   - `updateWBS()` → L26 wbs layer
   - `updateProjectWork()` → L46 project_work layer
   - `writeVerificationRecord()` → L45 verification_records layer

2. Integrate in generation workflow:
   ```typescript
   // After component generated
   await writeEvidence({
     id: `${layerName}-component-${timestamp}`,
     project_id: '37-data-model',
     artifact_type: 'react_component',
     path: componentPath,
     test_count: testResults.total,
     status: testResults.passed ? 'PASS' : 'FAIL'
   });
   
   // After WBS task completed
   await updateWBS({
     id: wbsTaskId,
     status: 'completed',
     completion_date: new Date().toISOString(),
     metrics: { components: 1, tests: testResults.total }
   });
   ```

3. Add cost tracking:
   ```typescript
   // After GitHub Copilot Cloud agent completes
   await writeCostRecord({
     layer: 'infrastructure_events',
     cost_usd: agentRunCost,
     duration_seconds: agentRunDuration,
     agent: 'github-copilot-cloud'
   });
   ```

**Exit Criteria**:
- Every component generation writes to L31 (evidence)
- Every WBS task completion updates L26 (wbs)
- Overall progress updates L46 (project_work)
- Cost tracking writes to infrastructure_events
- Dashboard queries return real-time data

---

### Priority 4: Unused Variables (NON-BLOCKING)
**Action**: Use or remove GC_SURFACE, GC_SUCCESS

**Options**:
1. **Remove**: If truly unused after refactoring
2. **Use**: Apply to form backgrounds, success messages

**Assessment**: Low priority - doesn't block functionality

---

## DO Phase: Implementation Order

**CRITICAL**: Do NOT attempt to "make it work" without completing these gates.

### Gate 0: CSS Foundation ❌
**Status**: BLOCKED  
**Test**: main.css exists, tokens.ts centralized, focus management works  
**Target**: Professional UI foundation matching GC Design System  
**Current**: No CSS files, inline styles everywhere, no focus management

### Gate 1: TypeScript Compilation ❌
**Status**: BLOCKED  
**Command**: `cd C:\eva-foundry\37-data-model\ui; npx tsc --noEmit`  
**Target**: 0 errors  
**Current**: 319 errors

### Gate 2: i18n Completeness ❌
**Status**: BLOCKED  
**Test**: All components use useLiterals, no hardcoded strings  
**Current**: 8+ components with hardcoded literals

### Gate 3: Dev Server Loads ❌
**Status**: BLOCKED (depends on Gate 1)  
**Command**: `npm run dev` → Open http://localhost:5173/  
**Target**: Page loads without console errors

### Gate 4: Language Switching ❌
**Status**: BLOCKED (depends on Gate 2)  
**Test**: Click all 5 language buttons, verify labels change  
**Target**: All forms/drawers render in all 5 languages

### Gate 5: Visual Verification ❌
**Status**: BLOCKED (depends on Gate 3)  
**Test**: Screenshots of each component in each language  
**Target**: GC Design System colors visible, layout correct

### Gate 6: Evidence Integration ❌
**Status**: BLOCKED (depends on Gate 0-5)  
**Test**: Generate 1 component, verify evidence written to L31, WBS updated to L26  
**Target**: Dashboard shows component in evidence layer, WBS task marked completed  
**Current**: No integration, no observability

### Gate 7: Cost Tracking ❌
**Status**: BLOCKED (depends on Gate 6)  
**Test**: Generate 1 component, verify cost written to infrastructure_events  
**Target**: Cost dashboard shows agent cost, duration, resource usage  
**Current**: No cost tracking, cannot prevent bill overruns

---

## CHECK Phase: Validation Criteria

**Before Deployment** (all must be TRUE):
- [ ] CSS foundation (main.css + tokens.ts) exists
- [ ] TypeScript compiles (0 errors)
- [ ] ESLint clean (0 errors, < 10 warnings)
- [ ] Prettier formatting consistent
- [ ] All components use useLiterals (no hardcoded strings)
- [ ] Dev server loads without errors
- [ ] All 5 languages render correctly
- [ ] GC Design System tokens centralized
- [ ] ARIA attributes present
- [ ] Focus management working (keyboard nav)
- [ ] Evidence writes to L31 (evidence layer)
- [ ] WBS updates to L26 (wbs layer)
- [ ] Project metrics update to L46 (project_work layer)
- [ ] Cost tracking to infrastructure_events
- [ ] Dashboard queries return real-time data

**Current Status**: 2/15 gates passed (component structure, ARIA attributes)

**Critical Missing**:
- ❌ CSS foundation (NO main.css, NO tokens.ts)
- ❌ Evidence integration (NO L31 writes)
- ❌ WBS integration (NO L26 updates)
- ❌ Cost tracking (NO infrastructure_events)
- ❌ Dashboard observability (NO data flow)

---

## ACT Phase: Next Steps

### Immediate Action Required

**DO NOT PROCEED** with:
- ❌ Deploying 104 GitHub issues
- ❌ Creating cloud agent tasks
- ❌ Generating more components
- ❌ Running autonomous factory workflow

**MUST COMPLETE FIRST**:
0. Create CSS foundation (Priority 0) - main.css + tokens.ts
1. Fix TypeScript compilation (Priority 1) - 0 errors
2. Standardize i18n (Priority 2) - useLiterals everywhere
3. Evidence integration (Priority 3) - L31/L26/L46 writes
4. Visual verification (Gates 0-7) - ALL gates pass

**Cost Impact**:
Without proper foundation, 104 cloud agents may:
- Generate 104 components with architectural debt (10,000+ TypeScript errors)
- NO evidence trail (cannot prove components work)
- NO WBS updates (PM has zero visibility)
- NO cost tracking (bill overruns likely)
- Require 104 manual fixes (negates 315x ROI)

### Success Criteria

**Definition of "Working"**:
```
User opens http://localhost:5173/
→ Page loads (no console errors)
→ Clicks "Français" button
→ All text changes to French
→ Clicks "Projects Create Form"
→ Form renders with French labels
→ All 5 languages work
→ All 4 components work
→ GC Design System colors visible
→ ARIA attributes present
→ Keyboard navigation functional
```

**Only proceed to cloud deployment after 9/9 gates passed.**

---

## Summary: Fractal DPDCA Assessment

| Phase | Status | Details |
|-------|--------|---------|
| **DISCOVER** | ✅ Complete | Architecture audited, issues identified |
| **PLAN** | ✅ Complete | 3 priorities, 5 gates defined |
| **DO** | ❌ BLOCKED | TypeScript errors prevent execution |
| **CHECK** | ❌ BLOCKED | Cannot validate until DO completes |
| **ACT** | 🔄 Pending | Awaiting gate completion |

**Critical Findings**:
1. **Code structure is GOOD** - React component hierarchy correct
2. **Code does NOT compile** - 319 TypeScript errors block testing
3. **CSS foundation MISSING** - No main.css, no tokens.ts, no focus management
4. **Evidence integration MISSING** - No L31/L26/L46 writes, no dashboard data
5. **Cost tracking MISSING** - Cannot prevent bill overruns

**Recommendation**: **DO NOT replicate pattern 104 times until ALL gates pass. Foundation first, then scale.**

**User's Requirement**: "I don't like acceptable before repeating something 100 times... I don't want to get tomorrow with a high bill to pay and the work is just acceptable."

**Response**: Agreed. Pattern must be EXCELLENT (production-ready with observability) before autonomous deployment.

---

**Next Command**: 
```powershell
cd C:\eva-foundry\37-data-model\ui
npx tsc --noEmit 2>&1 | Out-File -FilePath "typescript-errors.txt"
code typescript-errors.txt  # Review all 319 errors
```

**Then**: Fix in batches (unused vars, undefined vars, import issues), recompile after each batch.
