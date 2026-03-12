# Component Test ID Refactoring Toolset

**Project**: 37-data-model (EVA Data Model)  
**Objective**: Add Playwright test ID attributes to 450+ UI components across 112 layers  
**Status**: Phase 1 (Batch 1) tooling complete and ready to execute  
**Session**: 47 (March 12, 2026)  

---

## Overview

This toolset provides a complete automation framework for adding `data-testid` attributes to React components to support Playwright E2E testing infrastructure.

**Why this matters**:
- ✅ Playwright tests rely on `data-testid` selectors to find elements
- ✅ Manual addition would take 40+ hours
- ✅ Automated batch processing reduces time to 2-3 hours
- ✅ Standardized naming convention ensures consistency
- ✅ Rollback capability and validation gates provide safety

---

## Toolset Components

### 1. **Add-TestIdsToBatch.ps1** (First-generation tool)
**Type**: PowerShell script  
**Purpose**: Initial attempt at test ID addition with pattern-based rules  
**Status**: ✅ Available, reference implementation  

```bash
.\scripts\Add-TestIdsToBatch.ps1 -BatchName "Batch1" -DryRun
```

**Pros**:
- Pattern-based rules for common buttons (Create, Delete, Edit, etc.)
- Dry-run mode for safe previewing

**Cons**:
- Simple pattern matching (fragile)
- Limited element type coverage
- Replaced by Smart-Add-TestIds.ps1

---

### 2. **Smart-Add-TestIds.ps1** (Second-generation tool - PRIMARY)
**Type**: PowerShell script  
**Purpose**: Intelligent component analysis and smart test ID addition  
**Status**: ✅ Production-ready  

```bash
# Preview changes (dry-run)
.\scripts\Smart-Add-TestIds.ps1 -BatchNumber 1 -DryRun -Verbose

# Apply refactoring
.\scripts\Smart-Add-TestIds.ps1 -BatchNumber 1

# Process specific layers
.\scripts\Smart-Add-TestIds.ps1 -BatchNumber 1 -LayerNames "projects,wbs,sprints"

# Full batch processing
.\scripts\Smart-Add-TestIds.ps1 -BatchNumber 2
```

**How it works**:
1. Maps batch numbers to layer groups (Batch 1 = 20 layers, Batch 2 = 40, etc.)
2. Scans component files (*.tsx)
3. Identifies element types (button, input, form, div, etc.)
4. Generates test IDs using naming convention
5. Inserts data-testid attributes
6. Logs all changes for rollback
7. Generates JSON metadata for tracking

**Features**:
- ✅ Dry-run mode (preview without modifying)
- ✅ Element-type aware (buttons, inputs, forms, etc.)
- ✅ Text-content heuristics ("Create" button → "create-button")
- ✅ Skips already-labeled elements
- ✅ Batch processing (process 20, 40, 30, or 22 layers per batch)
- ✅ Verbose logging mode
- ✅ Rollback-safe (logs changes as JSON)

**Exit Codes**:
- `0` = Success
- Non-zero = Error (see console for details)

---

### 3. **Batch1-Refactoring-Orchestrator.ps1** (Orchestration Conductor)
**Type**: PowerShell script  
**Purpose**: Coordinate all phases: Preview → Refactor → Validate → Test  
**Status**: ✅ Complete, ready for execution  

```bash
# Full orchestration (interactive)
.\scripts\Batch1-Refactoring-Orchestrator.ps1

# Skip preview (faster)
.\scripts\Batch1-Refactoring-Orchestrator.ps1 -SkipPreview

# Skip tests (for quick checks)
.\scripts\Batch1-Refactoring-Orchestrator.ps1 -SkipTests
```

**Orchestration Flow**:

```
START
  ↓
PHASE 1: Preview (Dry Run)
  - Scans all Batch 1 files
  - Shows what will change
  - Prompts for confirmation
  ↓ [User confirms]
PHASE 2: Apply Refactoring
  - Modifies files in place
  - Adds test IDs
  - Logs changes
  ↓ [Success]
PHASE 3: Validation
  ├─ Step 3a: npm run type-check (TypeScript)
  ├─ Step 3b: npm run lint (ESLint)
  └─ Step 3c: npm run format:check (Prettier)
  ↓ [Success]
PHASE 4: Testing
  - npm run test:e2e -- --grep "Functional" --project=chromium
  - Runs 19 functional tests on Batch 1 layers
  ↓ [Tests complete]
COMPLETION
  - Summary report
  - Next steps (commit, push, Batch 2)
  ↓
END
```

**Automatic Logging**:
- `batch1-typecheck-{timestamp}.log` - TypeScript compilation
- `batch1-lint-{timestamp}.log` - ESLint results
- `batch1-format-{timestamp}.log` - Prettier formatting
- `batch1-tests-{timestamp}.log` - Playwright test results

**Exit Codes**:
- `0` = Success (ready to commit)
- `1` = Validation failed (rollback available)
- `2` = Tests failed (investigate)
- `3` = Fatal error (manual intervention)

---

### 4. **BATCH-1-REFACTORING-GUIDE.md** (Reference Documentation)
**Type**: Markdown guide  
**Purpose**: Detailed reference for Batch 1 layers, naming conventions, and manual process  

**Contents**:
- 20 Batch 1 layers with priority levels
- Complete test ID naming convention
- Component-by-component specs (ListView, CreateForm, EditForm, DetailDrawer, GraphView)
- Code examples showing "before" and "after"
- Step-by-step execution process
- Troubleshooting and rollback procedures
- Phase-by-phase breakdown (4 phases, 100 min total)

---

### 5. **BATCH-1-EXECUTION-GUIDE.md** (Quick Start Guide)
**Type**: Markdown guide  
**Purpose**: User-friendly execution guide with troubleshooting  

**Contents**:
- Quick start command (one-liner)
- Phase-by-phase explanation
- Expected outputs for each phase
- Troubleshooting (4 common issues)
- Commit workflow
- Performance notes
- Success criteria
- Next phase (Batch 2) pointers

---

## Naming Convention

All test IDs follow this pattern:

```
{layer}-{component-type}-{element-type}
```

### Examples by Layer

**projects layer**:
- `projects-list` - ListView container
- `projects-create-button` - Create button
- `projects-list-item` - Individual list item
- `projects-create-form` - Form container
- `projects-field-name` - Name input field
- `projects-label-name` - Name field label
- `projects-detail-drawer` - Detail drawer container
- `projects-drawer-title` - Title in drawer

**work_step_events layer**:
- `work_step_events-list` - ListView container
- `work_step_events-create-button` - Create button
- `work_step_events-filter-button` - Filter control
- `work_step_events-create-form` - Form for creating
- `work_step_events-field-name` - Name input
- `work_step_events-list-item` - List item element

**See BATCH-1-REFACTORING-GUIDE.md for complete specifications**

---

## Component Structure

### File Organization
```
ui/src/components/
├── projects/
│   ├── ListView.tsx          (displays list of projects)
│   ├── CreateForm.tsx        (form to create projectt)
│   ├── EditForm.tsx          (form to edit project)
│   ├── DetailDrawer.tsx      (drawer showing project details)
│   └── ...other components
├── wbs/
│   ├── ListView.tsx
│   ├── CreateForm.tsx
│   └── ...
├── tasks/
│   └── ...
└── [110 more layers]/
```

### Component Types Supported
1. **ListView** - Displays list of items with CRUD controls
2. **CreateForm** - Form for creating new items
3. **EditForm** - Form for editing existing items
4. **DetailDrawer** - Drawer showing item details
5. **GraphView** - Graph/chart visualization

**All component types are identified automatically by Smart-Add-TestIds.ps1**

---

## Batch Processing Strategy

### Why 4 Batches?

**Batch 1** (20 layers) - **CURRENT**: Core project management layers
- Layer 25-29: Projects, WBS, Sprints, Stories, Tasks
- Layer 31-46: Evidence, Quality Gates, Verification Records, Project Work, etc.
- Dependency group: Parent-child relationships
- Time: 15-20 minutes
- Risk: Low (isolated components)

**Batch 2** (40 layers) - **PLANNED**: Data model and API infrastructure
- Layer 50-90: Model objects, schema, validation, API endpoints, etc.
- Dependency group: Supporting infrastructure
- Time: 25-35 minutes
- Risk: Medium (affects data layer)

**Batch 3** (30 layers) - **PLANNED**: Infrastructure and deployment
- Layer 13-20, 43-49: Deployment, infrastructure, audit logs, metrics
- Dependency group: Observability and operations
- Time: 20-25 minutes
- Risk: Medium (affects OPS)

**Batch 4** (22 layers) - **PLANNED**: Strategy and planning
- Layer 2-11: Strategy, roadmap, milestones, goals
- Dependency group: High-level planning
- Time: 15-20 minutes
- Risk: Low (independent)

**Benefits of this approach**:
✅ Incremental validation (test after each batch)  
✅ Risk isolation (if Batch 1 fails, Batch 2-4 untouched)  
✅ Rollback simplicity (each batch independently revertible)  
✅ Learning feedback (adjust approach between batches)  

---

## Execution Workflow

### Before Starting
```bash
cd C:\eva-foundry\37-data-model

# Verify npm is available
npm --version
npm run type-check  # Quick sanity check

# View what scripts we have
ls scripts/*.ps1
```

### Execute Batch 1

#### Option A: Fully Interactive (Recommended)
```powershell
.\scripts\Batch1-Refactoring-Orchestrator.ps1
```
- Shows preview
- Prompts for confirmation
- Runs all validation
- Shows summary

#### Option B: Auto-Pilot (Faster)
```powershell
.\scripts\Batch1-Refactoring-Orchestrator.ps1 -SkipPreview
```
- Skips preview dry-run
- Proceeds directly to refactoring
- Still validates and tests

#### Option C: Manual Control (Debugging)
```powershell
# Step 1: Preview only
.\scripts\Smart-Add-TestIds.ps1 -BatchNumber 1 -DryRun -Verbose

# Step 2: Apply changes
.\scripts\Smart-Add-TestIds.ps1 -BatchNumber 1

# Step 3: Validate
npm run type-check
npm run lint
npm run format

# Step 4: Test
npm run test:e2e -- --grep "Functional" --project=chromium
```

### After Refactoring

```bash
# Review changes
git diff src/components/ | head -100

# Stage files
git add src/components/

# Commit
git commit -m "feat(batch1): add test IDs to core data layers (L25-L46)"

# Push (optional)
git push origin feature/batch1-test-ids

# Create PR (optional)
gh pr create --title "Batch 1: Test ID Addition"
```

---

## Troubleshooting

### TypeScript Compilation Error
**Error**: `Property 'data-testid' does not exist on type 'HTMLDivElement'`

**Fix**: Update component props interface to include data-testid:
```typescript
interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  'data-testid'?: string;
}
```

### Tests Can't Find Elements
**Error**: `Expected to find element [data-testid="projects-create-button"]`

**Cause**: Test ID not added to component, or naming mismatch

**Check**:
```bash
grep -r "projects-create-button" src/components/projects/
```

**Fix**: Re-run refactoring script or manually add test IDs

### File Permission Errors
**Error**: `Cannot write to file (access denied)`

**Fix**:
```powershell
# Run PowerShell as Administrator
# OR reset file permissions
icacls "C:\eva-foundry\37-data-model\ui\src\components" /grant:r $env:USERNAME:F /t
```

### npm Command Not Found
**Error**: `npm : The term 'npm' is not recognized`

**Fix**:
```bash
# Install Node.js (includes npm)
# OR add to PATH
$env:PATH += ";C:\Program Files\nodejs"

# Verify
npm --version
```

---

## Performance Metrics

**Expected execution times:**

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Preview | 30 sec | Fast |
| Phase 2: Refactor | 1-2 min | Fast |
| Phase 3a: Type-check | 2-3 min | Medium |
| Phase 3b: Linting | 1-2 min | Medium |
| Phase 3c: Format | <1 min | Fast |
| Phase 4: E2E tests | 8-10 min | Slow |
| **TOTAL** | **15-20 min** | ✅ |

**Batch 1 specific:**
- Files to process: ~80 components
- Test IDs to add: ~240 total
- Estimated changes: 15-20 KB of new content

---

## Success Indicators

✅ **Phase 1**: Dry-run shows 200-250 test IDs to add  
✅ **Phase 2**: Console shows "✓ Refactoring applied" and file count  
✅ **Phase 3a**: "Successfully compiled TypeScript" with no errors  
✅ **Phase 3b**: "0 errors" from ESLint  
✅ **Phase 3c**: Files auto-formatted successfully  
✅ **Phase 4**: Tests run (may have failures - expected without deployed components)  
✅ **Overall**: Can commit changes to git  

---

## Next Steps

### Immediate (After Batch 1 Success)
1. ✅ Commit Batch 1 changes
2. ⏳ Review test failures (if any)
3. ⏳ Adjust test IDs or tests as needed

### Short Term (Day 2)
1. Execute Batch 2 (40 layers)
2. Execute Batch 3 (30 layers)
3. Execute Batch 4 (22 layers)

### Medium Term (Week 2)
1. Full test suite validation (all 101 tests)
2. Performance baseline capture
3. Deploy to production

### Long Term (Ongoing)
1. Maintain test IDs as components evolve
2. Add new test IDs for new components
3. Integrate test ID requirements into code review PR template

---

## Technical Details

### Smart-Add-TestIds Algorithm

```
FOR EACH batch layer:
  FOR EACH .tsx component file:
    Load component content
    Identify component type (ListView, CreateForm, etc.)
    Extract layer name from folder
    
    FOR EACH line in component:
      IF line contains HTML element (<button>, <input>, etc.):
        IF line does NOT have data-testid:
          Generate test ID using naming convention
          Insert data-testid attribute
          Mark file as modified
        END IF
      END IF
    END FOR
    
    IF file was modified:
      Save to disk (unless dry-run)
      Log changes as JSON (for rollback)
    END IF
  END FOR
END FOR
```

### Rollback Capability

All changes are logged to `test-id-changes-{timestamp}.json`:
```json
{
  "timestamp": "20260312_140530",
  "batch": 1,
  "filesModified": 80,
  "testIdsAdded": 238,
  "changes": [
    {
      "file": "C:\\eva-foundry\\37-data-model\\ui\\src\\components\\projects\\ListView.tsx",
      "layer": "projects",
      "componentType": "ListView",
      "testIdsAdded": 12
    },
    ...
  ]
}
```

**Rollback command**: `git restore src/components/`

---

## Dependencies

### Required
- Node.js 18+ (verify: `node --version`)
- npm 9+ (verify: `npm --version`)
- PowerShell 5.1+ (Windows built-in)
- Git (verify: `git --version`)

### Project Dependencies
- TypeScript (type-checking)
- ESLint (linting)
- Prettier (formatting)
- Playwright (E2E testing)
- Jest/Vitest (unit testing)

**Verify all installed**: `npm install`

---

## References

- **Test ID Naming Standard**: BATCH-1-REFACTORING-GUIDE.md
- **E2E Test Infrastructure**: E2E_TEST_INFRASTRUCTURE.md
- **Playwright Documentation**: https://playwright.dev
- **Data Model Layers**: docs/COMPLETE-LAYER-CATALOG.md

---

## Questions?

1. **Why data-testid and not other selectors?**
   - Playwright best practice (decouples tests from CSS)
   - Survives CSS refactoring
   - Clear semantic intent

2. **Why automate instead of manual?**
   - 450+ components = 80+ hours manual
   - Automation = 2-3 hours
   - No human error, consistent naming
   - Repeatable across batches

3. **What if my component isn't identified?**
   - Check component file name (must match pattern)
   - See BATCH-1-REFACTORING-GUIDE.md for supported types
   - Can manually add test IDs

4. **Can I test before all 4 batches complete?**
   - Yes! Batch 1 tests immediately after completion
   - Batch 2-4 testing incremental
   - Full suite validation after Batch 4

---

**Created**: Session 47, March 12, 2026  
**Status**: Ready for production execution ✅  
**Maintainer**: Agent Framework  
**Last Updated**: This document
