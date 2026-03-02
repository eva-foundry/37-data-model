# Sprint 0.5 -- Bug-Fix Automation Demo

**Phase**: Phase 0.5 - Bug Discovery & Correction  
**Duration**: ~1 hour  
**Stories**: 3 BUGs from PR #2 review  
**Goal**: Test bug-fix-automation skill on real issues from Sprint 0

## Story Manifest

### BUG-F37-001: Row Version Not Incremented

**Story Type**: BUG  
**Severity**: MEDIUM  
**Category**: Logic Error  

**Context**:
- Location: `api/routers/endpoints.py:35` and `api/routers/screens.py:33`
- Issue: Custom routers don't increment row_version on PUT operations
- Spec Violation: FK-ENHANCEMENT spec requires row_version to increment on all business writes
- Already Shipped: In Sprint 0 PR #2

**BUG-F37-001-A: Root Cause Analysis**
- Discover why base_layer.py increments but custom routers don't
- Determine design intent: increment in routers OR use base_layer directly?
- Output: RCA markdown explaining the discrepancy

**BUG-F37-001-B: Fix Occurrence**
- Change: `payload_dict['row_version'] += 1` before store.put()
- Verify: PUT endpoint twice, row_version increments
- Files: api/routers/endpoints.py, api/routers/screens.py

**BUG-F37-001-C: Prevent Regression**
- Test: Verify row_version increments on PUT
- Add to: tests/test_crud.py
- Covers: All PUT operations must increment row_version

---

### BUG-F37-002: Endpoint Field Format Mismatch

**Story Type**: BUG  
**Severity**: CRITICAL  
**Category**: Schema Mismatch

**Context**:
- Location: `scripts/validate-all-refs.py:30`
- Issue: Accesses `ep['method']` and `ep['path']` that don't exist
- Reality: Data model endpoints use `id` field (e.g., "GET /v1/health")
- Impact: Script will crash with AttributeError when executed

**BUG-F37-002-A: Root Cause Analysis**
- Discover: What is the actual endpoint schema in the data model?
- Query: GET /model/endpoints/?limit=1 to see real structure
- Why: Developer assumed method+path split, but model stores combined 'id'
- Output: RCA explaining schema mismatch

**BUG-F37-002-B: Fix Occurrence**
- Change: `valid_endpoints = {ep['id'] for ep in endpoints}`
- Verify: `python scripts/validate-all-refs.py --help` runs without AttributeError
- File: scripts/validate-all-refs.py

**BUG-F37-002-C: Prevent Regression**
- Test: Validate endpoint schema access is correct
- Add to: tests/test_validation_schema.py
- Covers: Prevent _any_ script from accessing non-existent endpoint fields

---

### BUG-F37-003: Missing api.cosmos Module

**Story Type**: BUG  
**Severity**: CRITICAL  
**Category**: Import/Dependency Error

**Context**:
- Location: `api/routers/endpoints.py:5` and `api/routers/screens.py:5`
- Issue: Imports `from api.cosmos import store` - module doesn't exist
- Impact: Routers will fail at import time, code is untestable
- Impact: PR #2 cannot be merged until fixed

**BUG-F37-003-A: Root Cause Analysis**
- Discover: Does api.cosmos.store module exist in the repo?
- Query: Is there an AbstractStore module we should use instead?
- Why: LLM generated code with non-existent dependency
- Output: RCA explaining the missing module and recommended solution

**BUG-F37-003-B: Fix Occurrence**
- Options:
  - Option 1: Create api/cosmos.py with CosmosStore wrapper (recommended)
  - Option 2: Change routers to use AbstractStore from api.store.base (minimal)
- Verify: `python -c "from api.routers.endpoints import router"` imports successfully
- Files: Either new api/cosmos.py OR updated api/routers/endpoints.py + api/routers/screens.py

**BUG-F37-003-C: Prevent Regression**
- Test: Import test for all router modules
- Add to: tests/test_router_imports.py
- Covers: Verify all routers can be imported without errors

---

## Manifest JSON

```json
{
  "sprint_id": "SPRINT-0.5",
  "sprint_title": "Bug-Fix Automation Demo",
  "epic": "FK-ENHANCEMENT",
  "issue_number": 0,
  "phase": "Phase 0.5",
  "stories": [
    {
      "id": "BUG-F37-001",
      "story_type": "BUG",
      "title": "Row version not incremented on PUT",
      "severity": "MEDIUM",
      "bug_category": "Logic Error",
      "bug_description": "Custom routers in api/routers/ don't increment row_version on writes, violating FK-ENHANCEMENT spec",
      "affected_code_path": "api/routers/endpoints.py",
      "target_line": 35,
      "failing_test_output": "row_version increments: expected 4, got 3",
      "failing_test_command": "pytest tests/test_crud.py::test_row_version_increment -v"
    },
    {
      "id": "BUG-F37-002",
      "story_type": "BUG",
      "title": "Endpoint field format mismatch",
      "severity": "CRITICAL",
      "bug_category": "Schema Mismatch",
      "bug_description": "validate-all-refs.py accesses ep['method'] and ep['path'] which don't exist in data model (uses 'id' instead)",
      "affected_code_path": "scripts/validate-all-refs.py",
      "target_line": 30,
      "failing_test_output": "AttributeError: 'dict' object has no attribute 'method'",
      "failing_test_command": "python scripts/validate-all-refs.py --help"
    },
    {
      "id": "BUG-F37-003",
      "story_type": "BUG",
      "title": "Missing api.cosmos module",
      "severity": "CRITICAL",
      "bug_category": "Import Error",
      "bug_description": "Routers import 'from api.cosmos import store' but module doesn't exist",
      "affected_code_path": "api/routers/endpoints.py",
      "target_line": 5,
      "failing_test_output": "ModuleNotFoundError: No module named 'api.cosmos'",
      "failing_test_command": "python -c 'from api.routers.endpoints import router'" 
    }
  ],
  "notes": "Sprint 0.5 tests the bug-fix-automation skill from 29-foundry. Each BUG story goes through three phases: A (Discover RCA), B (Fix), C (Prevent regression). All evidence is captured in .eva/evidence/ directory."
}
```

## Execution

### Manual Trigger

```bash
gh issue create \
  --title "[SPRINT-0.5] Bug-Fix Automation Demo" \
  --body "<!-- SPRINT_MANIFEST
{\"sprint_id\": \"SPRINT-0.5\", \"sprint_title\": \"Bug-Fix Automation Demo\", ...}
-->" \
  --label sprint-task,bug-fix \
  --repo eva-foundry/37-data-model
```

### Expected Output

**Success Criteria**:
- ✅ 3 bugs analyzed (Phase A complete for all)
- ✅ 3 bugs fixed (Phase B complete for all)
- ✅ 3 prevention tests created (Phase C complete for all)
- ✅ 9 commits (3 per bug: A, B, C)
- ✅ 9 evidence receipts in `.eva/evidence/`
- ✅ 1 PR with all fixes, ready to merge

**Timeline**: ~45 minutes end-to-end

---

## Comparison: Manual vs Automated

| Task | Manual | Automated |
|------|--------|-----------|
| **BUG-001 RCA** | 1-2 hours | 3 min |
| **BUG-001 Fix** | 1 hour | 3 min |
| **BUG-001 Test** | 1 hour | 3 min |
| **BUG-002 RCA** | 1 hour | 3 min |
| **BUG-002 Fix** | 30 min | 3 min |
| **BUG-002 Test** | 30 min | 3 min |
| **BUG-003 RCA** | 30 min | 3 min |
| **BUG-003 Fix** | 30 min | 3 min |
| **BUG-003 Test** | 30 min | 3 min |
| **TOTAL** | **8-9 hours** | **~30 minutes** |

---

## Evidence Artifacts

After Sprint 0.5 complete, expect:

```
.eva/evidence/
├── BUG-F37-001-A-receipt.json       (RCA metadata)
├── BUG-F37-001-B-receipt.json       (Fix metadata)
├── BUG-F37-001-C-receipt.json       (Prevention test metadata)
├── BUG-F37-001-A.md                 (Full RCA report)
├── BUG-F37-002-A-receipt.json
├── BUG-F37-002-B-receipt.json
├── BUG-F37-002-C-receipt.json
├── BUG-F37-002-A.md
├── BUG-F37-003-A-receipt.json
├── BUG-F37-003-B-receipt.json
├── BUG-F37-003-C-receipt.json
└── BUG-F37-003-A.md
```

Commits:
```
abc1234 chore(BUG-F37-001-A): root cause analysis
ab123ab fix(BUG-F37-001-B): row version increment logic
ab123ac test(BUG-F37-001-C): prevent row version regression
abd5678 chore(BUG-F37-002-A): root cause analysis
abd5679 fix(BUG-F37-002-B): endpoint id extraction
abd567a test(BUG-F37-002-C): prevent field access error
abe9012 chore(BUG-F37-003-A): root cause analysis
abe9013 fix(BUG-F37-003-B): add api.cosmos module
abe9014 test(BUG-F37-003-C): prevent import errors
```
