# Batch 1 Refactoring Execution Guide

**Location**: C:\eva-foundry\37-data-model  
**Status**: Ready to execute  
**Estimated Duration**: 1-2 hours  
**Layers**: 20 critical data types (L25-L46)  

---

## Quick Start

```bash
cd C:\eva-foundry\37-data-model

# Option A: Interactive orchestration (recommended)
PowerShell .\scripts\Batch1-Refactoring-Orchestrator.ps1

# Option B: Skip preview and go direct (faster)
PowerShell .\scripts\Batch1-Refactoring-Orchestrator.ps1 -SkipPreview

# Option C: Manual control (for troubleshooting)
PowerShell .\scripts\Smart-Add-TestIds.ps1 -BatchNumber 1 -DryRun -Verbose
PowerShell .\scripts\Smart-Add-TestIds.ps1 -BatchNumber 1
npm run type-check
npm run lint
npm run test:e2e -- --grep "Functional" --project=chromium
```

---

## Phases Explained

### Phase 1: Preview (Dry Run)

**Purpose**: Show what changes will be made WITHOUT modifying files

**What happens**:
- Scans all Batch 1 component files
- Analyzes each element (button, input, form, div, etc.)
- Shows which test IDs will be added
- Estimates total number of changes

**Expected output**:
```
[INFO] Test ID Refactoring - Batch 1
[INFO] Preview mode enabled

Processing layer: projects
  ✓ ListView.tsx - Identified 12 elements needing test IDs
  ✓ CreateForm.tsx - Identified 8 form elements
  ✓ EditForm.tsx - Identified 8 form elements
  ✓ DetailDrawer.tsx - Identified 6 drawer elements

[SUMMARY]
  Files to modify: 80
  Test IDs to add: 210-250
  Estimated time: 2-3 minutes
```

**Decision point**: "Ready to apply changes? (Y/N)"

---

### Phase 2: Apply Refactoring

**Purpose**: Add test IDs to all component files

**What happens**:
- Modifies each file in src/components/
- Adds data-testid attributes in smart locations
- Preserves existing code formatting
- Logs each change for rollback capability

**Expected output**:
```
Processing layer: projects
  ✓ ListView.tsx (+12 test IDs)
  ✓ CreateForm.tsx (+8 test IDs)
  ✓ EditForm.tsx (+8 test IDs)
  ✓ DetailDrawer.tsx (+6 test IDs)

[SUCCESS] Batch 1 refactoring applied
  Files modified: 80
  Test IDs added: 238
```

**Result**: All component files now have data-testid attributes

---

### Phase 3: Validation

**Purpose**: Ensure code is syntactically correct and follows standards

**Step 3a: TypeScript Compilation**
```bash
npm run type-check
```
- ✅ **Expected**: "Successfully compiled TypeScript"
- ❌ **If fails**: Usually missing interface definitions for data-testid
- **Fix**: Add data-testid? to component prop interfaces

**Step 3b: ESLint**
```bash
npm run lint -- src/components
```
- ✅ **Expected**: "0 errors"
- ⚠️ **If warnings**: Usually about unused imports or inconsistent naming
- **Action**: Auto-fixable with `npm run lint -- --fix`

**Step 3c: Prettier**
```bash
npm run format:check
```
- ✅ **Expected**: "All files formatted"
- ⚠️ **If not**: Auto-fixes with `npm run format`

---

### Phase 4: Testing

**Purpose**: Verify test IDs work with Playwright tests

**Command**:
```bash
npm run test:e2e -- --grep "Functional" --project=chromium
```

**What runs**:
- AC-6: CRUD operations
- AC-7-11: Filtering, sorting, validation, drawer, empty state
- 19 total functional tests

**Expected outcomes**:

**Scenario A: Tests fail (most likely)**
```
FAIL functional.spec.ts
  ✗ AC-6: CRUD - Create operation works
  Expected to find element [data-testid="projects-create-button"] but didn't find it

✓ Passed: 5/19
✗ Failed: 14/19
✗ Skipped: 0/19
```
**Why**: Component test IDs don't match test expectations  
**Next**: Review BATCH-1-REFACTORING-GUIDE.md for test ID naming convention

**Scenario B: Tests pass (best case)**
```
PASS functional.spec.ts
  ✓ AC-6: CRUD - Create operation works (1.2s)
  ✓ AC-7: Filtering - Filter control visible (0.8s)
  ✓ AC-8: Sorting - Sort button works (1.1s)
  ... [and 16 more]

✓ Passed: 19/19
✓ Skipped: 0
Duration: 45s
```
**Next**: Proceed to Batch 2

---

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | ✅ Success | Proceed to commit phase |
| 1 | ❌ Validation failed | Rollback available, fix issues, retry |
| 2 | ⚠️ Tests failed | Scripts work, tests need adjustment |
| 3 | 🔴 Fatal error | Manual investigation required |

---

## Rollback Procedure

If something goes wrong:

```bash
# Simple rollback (current branch only)
git restore src/components/

# More aggressive rollback (undo all uncommitted changes)
git reset --hard HEAD

# If changes were committed, revert
git revert HEAD --no-edit

# Check what was changed
git status
git diff --cached
```

---

## Troubleshooting

### Issue 1: TypeScript fails with "data-testid property missing"

**Error**:
```
TS2339: Property 'data-testid' does not exist on type 'HTMLDivElement'
```

**Fix**: Add to component props interface
```typescript
interface MyComponentProps {
  'data-testid'?: string;  // Add this line
  // ... other props
}
```

### Issue 2: Tests can't find elements

**Symptom**: Tests fail with "Expected to find element [data-testid=...] but didn't find it"

**Diagnosis**:
```bash
# Check if test ID is actually in component
grep -r "projects-create-button" src/components/projects/

# If no output, the test ID wasn't added
```

**Fix**: Manually add to component or re-run refactoring script

### Issue 3: Files have formatting issues

**Symptom**: ESLint or Prettier complains

**Fix**:
```bash
# Auto-fix linting issues
npm run lint -- --fix

# Auto-format all files
npm run format
```

### Issue 4: "npm run" commands not found

**Solution**:
```bash
# Ensure dependencies installed
npm install

# Check Node/npm versions
node --version
npm --version

# Update npm if old
npm install -g npm@latest
```

---

## Commit Workflow

After successful refactoring:

```bash
# 1. Review changes (optional but recommended)
git diff src/components/ | head -50

# 2. Stage files
git add src/components/

# 3. Create commit
git commit -m "feat(batch1): add test IDs to core data layers

- Added data-testid attributes to 80 component files
- Covers 20 core data model layers (L25-L29, L31, L34, L38, L40-46)
- Naming convention: {layer}-{component-type}-{element}
- All TypeScript checks passing
- Supports Playwright E2E test infrastructure"

# 4. (Optional) Push to remote
git push origin feature/batch1-test-ids

# 5. (Optional) Create PR
gh pr create --title "Batch 1: Add Test IDs to Core Layers" \
  --body "Adds Playwright test ID attributes to 20 critical data model layers"
```

---

## Performance Notes

**Expected timing**:
- Phase 1 (Preview): 30 seconds
- Phase 2 (Refactoring): 1-2 minutes
- Phase 3 (Validation): 3-5 minutes
- Phase 4 (Testing): 8-10 minutes
- **Total**: 15-20 minutes (with tests)

**System requirements**:
- Node.js 18+ (check with `node --version`)
- npm 9+ (check with `npm --version`)
- 4GB+ free disk space
- Terminal with PowerShell 5.1+

---

## Success Criteria

✅ **Phase 1**: Dry run completes without errors  
✅ **Phase 2**: All files modified with test IDs added  
✅ **Phase 3**: TypeScript compilation succeeds, no critical linting errors  
✅ **Phase 4**: At minimum, tests start (may fail without deployed components)  
✅ **Commit**: Changes committed to branch with clear message  

---

## Next Phase: Batch 2

Once Batch 1 succeeds:

```bash
# Create similar orchestrator for Batch 2
PowerShell .\scripts\Batch2-Refactoring-Orchestrator.ps1

# Or manually run for Batch 2 (40 layers)
PowerShell .\scripts\Smart-Add-TestIds.ps1 -BatchNumber 2 -Verbose
```

**Batch 2 layers**: model_objects, model_layers, model_edges, model_schema, etc. (40 total)  
**Batch 3 layers**: Infrastructure/deployment/audit (30 total)  
**Batch 4 layers**: Strategy/roadmap (22 total)  

**Total remaining**: 112 - 20 = 92 layers

---

## Additional Resources

- **Naming Convention**: See BATCH-1-REFACTORING-GUIDE.md
- **Test Spec Details**: See E2E_TEST_INFRASTRUCTURE.md
- **Playwright Docs**: https://playwright.dev/docs/locators
- **Data Model Layers**: See 37-data-model/docs/COMPLETE-LAYER-CATALOG.md

---

## Questions & Support

- **Script fails?** Check error output above, see Troubleshooting
- **Not sure about naming?** Review BATCH-1-REFACTORING-GUIDE.md test ID examples
- **Tests still failing?** Expected without deployed components - check test assertion logic
- **Want to investigate?** Use `--Verbose` flag for detailed logging

---

**Ready to start?** Run:
```bash
cd C:\eva-foundry\37-data-model
PowerShell .\scripts\Batch1-Refactoring-Orchestrator.ps1
```

**Session 47 - March 12, 2026**
