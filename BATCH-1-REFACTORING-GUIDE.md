# Batch 1 Component Refactoring Guide

**Target**: 20 critical data type layers  
**Est. Time**: 1-2 hours  
**Start**: Layer 25 (projects)  
**End**: Layer 46 (project_work)  

## Batch 1 Layers

| Layer # | Layer Name | Component Files | Est. Changes | Priority |
|---------|-----------|-----------------|--------------|----------|
| L25 | projects | ListView, CreateForm, EditForm, DetailDrawer | 8-10 | 🔴 Critical |
| L26 | wbs | ListView, CreateForm, EditForm, DetailDrawer | 8-10 | 🔴 Critical |
| L27 | sprints | ListView, CreateForm, EditForm, DetailDrawer | 8-10 | 🔴 Critical |
| L28 | stories | ListView, CreateForm, EditForm, DetailDrawer | 8-10 | 🔴 Critical |
| L29 | tasks | ListView, CreateForm, EditForm, DetailDrawer | 8-10 | 🔴 Critical |
| L31 | evidence | ListView, CreateForm, EditForm, DetailDrawer | 12-15 | 🔴 Critical |
| L34 | quality_gates | ListView, CreateForm, EditForm, DetailDrawer | 10-12 | 🔵 High |
| L38 | work_step_events | ListView, CreateForm, EditForm, DetailDrawer | 8-10 | 🔵 High |
| L40 | relationships | DetailDrawer, GraphView | 6-8 | 🔵 High |
| L41 | ontology_mapping | ListView, DetailDrawer | 6-8 | 🟡 Medium |
| L42 | system_metrics | GraphView, ListView | 8-10 | 🟡 Medium |
| L43 | adoption_metrics | GraphView, ListView | 8-10 | 🟡 Medium |
| L45 | verification_records | ListView, DetailDrawer | 8-10 | 🔵 High |
| L46 | project_work | ListView, CreateForm, EditForm, DetailDrawer | 10-12 | 🔴 Critical |
| L03 | agents | ListView, CreateForm, DetailDrawer | 6-8 | 🟡 Medium |
| L04 | agent_tools | ListView, DetailDrawer | 6-8 | 🟡 Medium |
| L12 | deployment_targets | ListView, CreateForm, EditForm | 8-10 | 🟡 Medium |
| L13 | deployments | ListView, DetailDrawer, GraphView | 8-10 | 🟡 Medium |
| L14 | execution_logs | ListView, DetailDrawer | 6-8 | 🟡 Medium |
| L15 | execution_traces | ListView, DetailDrawer, GraphView | 8-10 | 🟡 Medium |

**Total Files**: ~180-220 component instances  
**Estimated component objects**: 50-60 unique components

## Test ID Naming Convention

For each component, apply this naming schema:

### ListView
```typescript
interface ListViewTestIds {
  listContainer: `${layer}-list`
  createButton: `${layer}-create-button`
  filterButton: `${layer}-filter-button`
  sortButton: `${layer}-sort-button`
  searchInput: `${layer}-search-input`
  filterPanel: `${layer}-filter-panel`
  listItem: `${layer}-list-item` // Used with data attribute: data-id
  itemField: `${layer}-list-item-{fieldName}`
  paginationNext: `${layer}-pagination-next`
  paginationPrev: `${layer}-pagination-prev`
  loadingState: `${layer}-loading-state`
  emptyState: `${layer}-empty-state`
  errorMessage: `${layer}-error-message`
}
```

**Example for projects layer**:
```tsx
<div data-testid="projects-list">
  <button data-testid="projects-create-button">Create Project</button>
  <input data-testid="projects-search-input" placeholder="Search..." />
  <div data-testid="projects-list-item" data-id={item.id}>
    <span data-testid="projects-list-item-name">{item.name}</span>
  </div>
  <button data-testid="projects-pagination-next">Next</button>
</div>
```

### CreateForm
```typescript
interface CreateFormTestIds {
  formContainer: `${layer}-create-form`
  title: `${layer}-create-title`
  submitButton: `${layer}-form-submit`
  cancelButton: `${layer}-form-cancel`
  errorMessage: `${layer}-create-error`
  loadingSpinner: `${layer}-create-loading`
  fieldInput: `${layer}-field-{fieldName}`
  fieldLabel: `${layer}-label-{fieldName}`
  fieldError: `${layer}-error-{fieldName}`
}
```

**Example for projects layer**:
```tsx
<form data-testid="projects-create-form">
  <h2 data-testid="projects-create-title">Create New Project</h2>
  <label data-testid="projects-label-name">Name</label>
  <input data-testid="projects-field-name" type="text" />
  <span data-testid="projects-error-name" className="error" />
  
  <label data-testid="projects-label-description">Description</label>
  <textarea data-testid="projects-field-description" />
  
  <button type="submit" data-testid="projects-form-submit">Create</button>
  <button type="button" data-testid="projects-form-cancel">Cancel</button>
</form>
```

### EditForm
```typescript
interface EditFormTestIds {
  formContainer: `${layer}-edit-form`
  title: `${layer}-edit-title`
  submitButton: `${layer}-form-submit`
  cancelButton: `${layer}-form-cancel`
  deleteButton: `${layer}-delete-button`
  errorMessage: `${layer}-edit-error`
  fieldInput: `${layer}-field-{fieldName}`
  fieldLabel: `${layer}-label-{fieldName}`
  fieldError: `${layer}-error-{fieldName}`
}
```

### DetailDrawer
```typescript
interface DetailDrawerTestIds {
  drawerContainer: `${layer}-detail-drawer`
  title: `${layer}-drawer-title`
  closeButton: `${layer}-drawer-close`
  editButton: `${layer}-drawer-edit`
  deleteButton: `${layer}-drawer-delete`
  content: `${layer}-drawer-content`
  field: `${layer}-drawer-field-{fieldName}`
  fieldLabel: `${layer}-drawer-label-{fieldName}`
  fieldValue: `${layer}-drawer-value-{fieldName}`
}
```

**Example for projects layer**:
```tsx
<Drawer open={open} data-testid="projects-detail-drawer">
  <Drawer.Header>
    <h2 data-testid="projects-drawer-title">{project.name}</h2>
    <button data-testid="projects-drawer-close" onClick={onClose}>×</button>
  </Drawer.Header>
  <Drawer.Body data-testid="projects-drawer-content">
    <div data-testid="projects-drawer-field-name">
      <label data-testid="projects-drawer-label-name">Name</label>
      <span data-testid="projects-drawer-value-name">{project.name}</span>
    </div>
  </Drawer.Body>
  <Drawer.Footer>
    <button data-testid="projects-drawer-edit">Edit</button>
    <button data-testid="projects-drawer-delete">Delete</button>
  </Drawer.Footer>
</Drawer>
```

### GraphView
```typescript
interface GraphViewTestIds {
  graphContainer: `${layer}-graph`
  chartArea: `${layer}-chart-area`
  legend: `${layer}-legend`
  legendItem: `${layer}-legend-{itemName}`
  node: `${layer}-node-{nodeId}`
  edge: `${layer}-edge-{sourceId}-{targetId}`
}
```

## Component Refactoring Steps

### Step 1: Preview Changes (Dry Run)
```bash
# Run in PowerShell
cd C:\eva-foundry\37-data-model
.\scripts\Add-TestIdsToBatch.ps1 -BatchName "Batch1" -DryRun
```

**Expected Output**:
```
[INFO] Test ID Refactoring - Batch1 (20260312_HHMMSS)
[INFO] Dry Run: True
[INFO] Processing Layer 25 (projects)...
  [ADD] ListView.tsx
  [ADD] CreateForm.tsx
  [ADD] EditForm.tsx
  [ADD] DetailDrawer.tsx
[SUMMARY] Layers processed: 1
  Files scanned: 4
  Test IDs added (preview): 12
```

### Step 2: Apply Changes
```bash
cd C:\eva-foundry\37-data-model
.\scripts\Add-TestIdsToBatch.ps1 -BatchName "Batch1" -Layers "projects,wbs,sprints,stories,tasks"
```

### Step 3: Verify Changes
```bash
# Check for syntax errors
npm run type-check

# Check for linting issues
npm run lint -- src/components/*/

# Check for format issues
npm run format:check
```

### Step 4: Rollback if Needed
```bash
# View changes before committing
git diff src/components/

# Rollback specific file
git restore src/components/projects/ListView.tsx

# Rollback all changes
git restore src/components/
```

### Step 5: Run Tests
```bash
# Run functional tests only on our layer
npm run test:e2e -- --grep "Functional" --project=chromium

# Run all tests on specific files
npm run test:e2e -- --grep "projects|wbs|sprints"

# Full test run (optional, slower)
npm run test:e2e -- --project=chromium
```

## Expected Results

**Before Refactoring**:
```typescript
// BAD: Test selectors won't find elements
<button>Create</button>
<div>Item 1</div>
```

**After Refactoring**:
```typescript
// GOOD: Test selectors work
<button data-testid="projects-create-button">Create</button>
<div data-testid="projects-list-item">Item 1</div>
```

## Execution Order

**Recommended**: Process in dependency order (parent → child)

1. **Phase 1 (L25-L29)**: Core project layers
   - projects → wbs → sprints → stories → tasks
   - Time: 30 minutes
   
2. **Phase 2 (L31, L34, L45-46)**: Evidence & governance
   - evidence → quality_gates → verification_records → project_work
   - Time: 30 minutes
   
3. **Phase 3 (L38, L40-43)**: Work execution & metrics
   - work_step_events → relationships → ontology_mapping → metrics
   - Time: 20 minutes
   
4. **Phase 4 (L03-04, L12-15)**: Agent & infrastructure
   - agents → agent_tools → deployment_targets → deployments → logs → traces
   - Time: 20 minutes

**Total Estimated Time**: 100 minutes (including validation)

## Troubleshooting

### Issue: TypeScript compilation fails
```bash
# Check what errors
npm run type-check 2>&1 | head -20

# Common fixes:
# - Missing data-testid attribute declaration in component props interface
# - JSX attribute syntax error (should be data-testid, not testId)
# - String interpolation in test ID
```

### Issue: Tests still fail to find elements
```bash
# Verify test IDs match naming convention
grep -r "data-testid=" src/components/projects/ | head -10

# Update test if naming doesn't match
# Example: test expects "projects-create-button" but component has "project-action-create"
```

### Issue: Files won't save
```bash
# Check file permissions
Get-Item src/components/projects/*.tsx | Select-Object { $_.FullName, $_.Mode }

# Fix permissions if needed
icacls "src/components" /grant:r $env:USERNAME:F /t
```

## Success Criteria

✅ All 20 Batch 1 layers updated with test IDs  
✅ TypeScript compilation succeeds (`npm run type-check`)  
✅ No linting errors (`npm run lint`)  
✅ Functional tests pass for Batch 1 layers (`npm run test:e2e -- --grep "Functional"`)  
✅ No new console errors or warnings  
✅ Visual regression baselines unchanged (screenshots match)  

## Next Phase

Once Batch 1 succeeds:
1. Commit changes: `git commit -m "feat(batch1): add test IDs to core data layers (L25-L46)"`
2. Create PR for code review (optional)
3. **Proceed to Batch 2** (40 service/infrastructure layers)

---

**Session 47 - March 12, 2026**  
**Prepared by**: Agent Framework  
**Status**: Ready to execute ✅
