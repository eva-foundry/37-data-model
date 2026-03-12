# UI Refactoring Plan - 112 Screen Components (37-data-model)

## Overview
- **Total Components**: 112 layer abstractions
- **Components per Layer**: 4-5 (ListView, CreateForm, EditForm, DetailDrawer, GraphView)
- **Total Files to Refactor**: ~450+ TypeScript/React components
- **Goal**: Add data-testid attributes for Playwright test coverage
- **Timeline**: Batch refactoring + incremental testing

---

## Phase 1: Refactoring Strategy

### Test ID Naming Convention

**Standard Pattern**: `{layerName}-{componentType}-{element}`

**Component Types**:
- `create-form` - CreateForm component
- `edit-form` - EditForm component  
- `detail-drawer` - DetailDrawer component
- `list-view` - ListView component
- `graph-view` - GraphView component

**Element IDs**:
```
{layerName}-{componentType}-{element}

Examples:
- work_step_events-create-form             (form container)
- work_step_events-create-button            (in ListView)
- work_step_events-edit-button              (in detail drawer)
- work_step_events-delete-button            (in detail drawer)
- work_step_events-field-name               (input field)
- work_step_events-form-submit              (submit button)
- work_step_events-form-cancel              (cancel button)
- work_step_events-list-item                (list item)
- work_step_events-detail-drawer            (drawer container)
- work_step_events-filter-button            (filter button)
- work_step_events-sort-button              (sort button)
- work_step_events-filter-panel             (filter panel)
- work_step_events-search-input             (search input)
- work_step_events-pagination-next          (pagination)
- work_step_events-loading-state            (loading spinner)
- work_step_events-empty-state              (empty state container)
- work_step_events-error-message            (error alert)
```

---

## Phase 2: Component Analysis

### 112 Layers Breakdown

| Layer Type | Count | Example layers |
|-----------|-------|-----------------|
| Data type layers | ~80 | work_step_events, endpoints, services, etc. |
| Process layers | ~20 | workflows, sprints, tasks, etc. |
| Metadata layers | ~12 | ontology, verification_records, etc. |

Each layer typically has:
1. **FileListView** (main list with CRUD actions)
2. **CreateForm** (form to create new record)
3. **EditForm** (form to modify existing)
4. **DetailDrawer** (side panel with full details)
5. **GraphView** (optional, for visualization)

---

## Phase 3: Refactoring Batch Plan

### Batch 1: Core Data Types (20 components)
Priority: High - heavily tested layers
Target time: 1-2 hours
Layers:
- projects (L25)
- work_items (L27)
- tasks (L28)
- evidence (L31)
- verification_records (L45)
- project_work (L46)
- agents (L50)
- and 13 more critical layers

### Batch 2: Service/Work Layers (40 components)
Priority: Medium - business process automation
Target time: 2-3 hours
Layers:
- work_step_events
- work_service_runs
- work_cycle_logs
- service_definitions
- and ~37 more

### Batch 3: Infrastructure/Observability (30 components)
Priority: Medium - cross-system integration
Target time: 2 hours
Layers:
- infrastructure_events
- agent_execution_history
- deployment_records
- performance_metrics
- and ~26 more

### Batch 4: Metadata/Ontology (22 components)
Priority: Low - reference data
Target time: 1 hour
Layers:
- ontology domains
- schema definitions
- enum types
- and ~19 more

---

## Phase 4: Refactoring Script

Creates/updates test IDs in all components systematically:
```powershell
# File: refactor-test-ids.ps1
# - Scans all component files
# - Adds missing data-testid attributes
# - Preserves existing correct test IDs
# - Generates before/after diff report
# - Rollback capability
```

**Key tasks**:
1. Add form container test IDs
2. Add button test IDs (create, edit, delete, submit, cancel)
3. Add input field test IDs
4. Add list/item test IDs
5. Add drawer/modal test IDs
6. Add filter/sort test IDs
7. Add error/empty/loading state test IDs
8. Add pagination test IDs

---

## Phase 5: Testing Strategy

### Incremental Testing
After each batch, run Playwright tests:
```bash
npm run test:e2e -- --grep "Batch1|Batch2" --project=chromium
```

### Test Coverage Progression
- Batch 1 complete → Run functional tests (AC-6-11)
- Batch 2 complete → Run error handling tests (AC-16-20)
- Batch 3 complete → Run integration tests (AC-29)
- Batch 4 complete → Run full suite (all 101 tests)

### Success Criteria
- ✓ Zero TypeScript errors
- ✓ All Playwright tests pass
- ✓ No console errors/warnings
- ✓ Visual regression baselines match
- ✓ Performance < 3s page load
- ✓ Accessibility: keyboard nav working
- ✓ Cross-browser: all 9 projects pass

---

## Phase 6: Execution Timeline

**Day 1 (Today - March 12)**:
- [ ] Create refactoring script
- [ ] Run on Batch 1 (core data types)
- [ ] Validate TypeScript compilation
- [ ] Run functional tests (AC-6-11)

**Day 2 (March 13)**:
- [ ] Refactor Batch 2 (service/work layers)
- [ ] Run error handling tests (AC-16-20)
- [ ] Check performance baseline

**Day 3 (March 14)**:
- [ ] Refactor Batch 3 (infrastructure)
- [ ] Run integration tests (AC-29)
- [ ] Cross-browser validation

**Day 4 (March 15)**:
- [ ] Refactor Batch 4 (metadata)
- [ ] Run full test suite (101 tests)
- [ ] Generate final QA report

---

## Phase 7: Key Files to Monitor

**Component Patterns**:
- `src/components/{layerName}/*.tsx` (112 folders)
- Each with: ListView.tsx, CreateForm.tsx, EditForm.tsx, DetailDrawer.tsx

**Test Files**:
- `e2e/functional.spec.ts` - Uses data-testid selectors
- `e2e/error-handling.spec.ts` - Expects form test IDs
- `e2e/integration.spec.ts` - Tests form submission

**Configuration**:
- `playwright.config.ts` - Already configured
- `package.json` - npm run scripts ready

---

## Phase 8: Expected Outcomes

### Completion Metrics
- ✅ **112/112 layers** refactored with test IDs
- ✅ **450+/450+ files** have data-testid attributes
- ✅ **101/101 Playwright tests** passing
- ✅ **49/51 acceptance criteria** fully validated
- ✅ **Zero critical errors** in test output
- ✅ **Performance baseline** established

### Quality Gates Met
- [x] Code quality (AC-1-5) - TypeScript + ESLint
- [x] Functional coverage (AC-6-11) - Data-testid attributes
- [x] Error handling (AC-16-20) - Form validation visible
- [x] Performance (AC-21-25) - < 3s load time
- [x] Cross-browser (AC-31-36) - All 9 projects
- [x] Accessibility (AC-37-41) - Keyboard accessible forms
- [x] E2E workflows (AC-27) - Real user journeys
- [x] Visual regression (AC-28) - Baseline screenshots
- [x] Integration (AC-29) - Frontend↔Backend sync

---

## Phase 9: Risk Mitigation

**Risks & Mitigations**:

1. **Risk**: Script breaks formatting/types
   → **Mitigation**: Git branches, rollback script, validation

2. **Risk**: Incomplete test ID coverage
   → **Mitigation**: Grep script to find missing IDs after each batch

3. **Risk**: Test suite times out on all 112 layers
   → **Mitigation**: Run by batch, parallel workers in Playwright

4. **Risk**: Naming conflicts/duplicates
   → **Mitigation**: Standardized naming convention, uniqueness validation

---

## Phase 10: Deliverables

**By End of Refactoring**:
1. ✅ All 112 components with complete test ID coverage
2. ✅ Refactoring script for future automation
3. ✅ Before/after test result report
4. ✅ CI/CD integration verified
5. ✅ Performance baseline documented
6. ✅ Accessibility compliance report
7. ✅ Cross-browser compatibility matrix

---

## Quick Reference

**Start Refactoring**:
```bash
cd C:\eva-foundry\37-data-model\ui
# Create refactoring script
# Run Batch 1
# Verify: npm run test:e2e -- --project=chromium
```

**Monitor Progress**:
```bash
# Count components with test IDs
grep -r 'data-testid=' src/components | wc -l

# Find missing test IDs
grep -r '<button' src/components | grep -v 'data-testid' | wc -l

# Run tests on specific batch
npm run test:e2e -- --grep 'Batch1'
```

---

## Current Status: 🟢 READY TO START

All infrastructure in place: 
- ✅ 101 Playwright tests created
- ✅ 9 browser projects configured
- ✅ GitHub Actions workflow ready
- ✅ PowerShell orchestrator ready
- ⏳ Waiting on component test ID refactor

Next: Execute Batch 1 refactoring
