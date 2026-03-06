# DPDCA: Agent Data Model API Readiness

**Session**: 30 Post-Completion  
**Date**: March 6, 2026  
**Objective**: Ensure all agent needs are fulfilled by the Data Model API  
**Status**: DISCOVER PHASE  

---

## DPDCA CYCLE OVERVIEW

```
DISCOVER → PLAN → DO → CHECK → ACT
   ↓
Current Phase: Discovering complete agent requirements
```

---

## PHASE 1: DISCOVER 🔍

### Discovery Method: Fresh Agent Testing

**Test Approach**: Act as a fresh agent following [USER-GUIDE.md](../USER-GUIDE.md) with zero prior knowledge.

**Test Execution Date**: March 6, 2026 11:45 AM ET  
**Test Duration**: 15 minutes  
**Cloud API**: https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io

---

### FINDINGS

#### ✅ What Works (Strengths)

1. **Self-Documenting API** - `/model/agent-guide` endpoint provides complete documentation
   - 14 sections returned
   - 5-step discovery journey
   - 9 common mistakes with fixes
   - 16 query patterns
   
2. **Fast Response Times** - All queries <1 second

3. **USER-GUIDE.md Design** - Minimal, actionable "One Instruction" approach

4. **Copy-Paste Examples Added** - Session 30 improvements added 3 working examples

5. **PowerShell Workaround Documented** - Nested object counting tip added

6. **Introspection Endpoints**:
   - ✅ `/model/layers` works (returns layer list)
   - ✅ `/model/{layer}/example` works (returns sample object)

---

#### ❌ What's Broken (Blockers)

**ISSUE 1: Examples Return Empty Tables** ⚠️ **CRITICAL**

**What happened:**
```powershell
# Example 1 from USER-GUIDE.md:
$endpoints = Invoke-RestMethod "$base/model/endpoints/?service=eva-brain-api&limit=10"
$endpoints | Select-Object id, method, path, status | Format-Table
# Result: Empty table (headers shown, no data rows)
```

**Root cause discovered:**
- API returns `{data: [...], metadata: {...}}` wrapper structure
- Examples fetch the wrapper but don't access `.data` property
- PowerShell tries to format the wrapper object → empty table

**Evidence:**
```powershell
$response = Invoke-RestMethod "$base/model/projects/"
$response.GetType()  # Result: PSCustomObject
$response -is [Array]  # Result: False
$response.PSObject.Properties.Name  # Result: ["data"]
$response.data -is [Array]  # Result: True
$response.data.Count  # Result: 56
$response.data | Select-Object id, label, maturity | Format-Table -First 3
# NOW IT WORKS! ✅
```

**Impact**: All 3 copy-paste examples in USER-GUIDE.md fail → agents see empty tables

**Affected Examples**:
- Example 1: Get endpoints for service
- Example 2: Count projects by maturity
- Example 3: Discover layer schema (partially - `/fields` endpoint also broken)

---

**ISSUE 2: Fields Endpoint Returns 404** ⚠️ **HIGH PRIORITY**

**What happened:**
```powershell
Invoke-RestMethod "$base/model/projects/fields"
# Response: {"detail": "Schema not found for layer: projects"}
```

**Expected behavior:** Should return field list with types and descriptions

**Workaround exists:** `/model/projects/example` works (returns full sample object)

**Impact**: Agents can't programmatically discover schema, must inspect example object manually

---

**ISSUE 3: Layer Count Mismatch** ⚠️ **MEDIUM PRIORITY**

**What happened:**
```powershell
$layers = Invoke-RestMethod "$base/model/layers"
$layers.Count  # Result: 34
```

**Expected:** 41 layers (Session 30 added L36-L38: agent_policies, quality_gates, github_rules, deployment_policies, testing_policies, validation_rules)

**Root cause:** Code fix committed locally (commit b14c63c) but not deployed to cloud

**Impact**: Agents see incomplete layer list (missing 7 layers)

---

#### 🔧 What Needs Improvement (Technical Debt)

**IMPROVEMENT 1: Response Structure Documentation**

**Gap:** USER-GUIDE.md doesn't explain the `{data: [...]}` wrapper pattern

**Impact:** Agents discover this through trial-error (wastes 5+ minutes)

**Recommendation:** Add "Response Structure" section to USER-GUIDE.md:
```markdown
## Response Structure

All layer endpoints return data wrapped in a standard structure:

{
  "data": [...],        // Your actual data (array)
  "metadata": {         // Query information
    "total": 56,
    "limit": null,
    "offset": 0,
    "_query_warnings": []
  }
}

Always access `.data` property:
$projects = (Invoke-RestMethod "$base/model/projects/").data
```

---

**IMPROVEMENT 2: Layer Count in Documentation**

**Gap:** Multiple docs reference "34 layers" but codebase has 41

**Affected files (already fixed in commit 04a931c):**
- ✅ LAYER-ARCHITECTURE.md
- ✅ README.md
- ✅ USER-GUIDE.md
- ✅ docs/library/*.md (12 files)

**Status:** Fixed locally, needs push + cloud deployment

---

**IMPROVEMENT 3: Schema Discovery Reliability**

**Gap:** `/model/{layer}/fields` endpoint fails for most layers

**Current workaround:** Use `/model/{layer}/example` and inspect object

**Better solution:**
1. Fix `/fields` endpoint to work for all 41 layers
2. OR document that `/example` is preferred method
3. OR return field list from example object automatically

---

### DISCOVERY METRICS

**Test Coverage:**
- ✅ USER-GUIDE.md read (2 sections tested)
- ✅ Copy-paste examples tested (3/3 attempted)
- ✅ Agent-guide endpoint tested (14 sections validated)
- ✅ Introspection endpoints tested (/layers, /fields, /example)
- ✅ Real-world exploration (services, evidence, screens queried)
- ✅ PowerShell workaround validated (nested object counting)

**Issues Found:**
- 🔴 Critical: 3 (Examples broken, fields endpoint broken, wrapper pattern undocumented)
- 🟡 Medium: 1 (Layer count mismatch in production)
- 🟢 Low: 1 (PowerShell display quirk - not API bug)

**Time to Productivity (Fresh Agent):**
- ❌ Current state: 10+ minutes (examples fail, must debug)
- ✅ With fixes: <2 minutes (copy-paste works immediately)

---

## PHASE 2: PLAN 📋

### Planning Criteria

To exit DISCOVER and enter PLAN, we must answer:

**Q1: What are ALL agent requirements?**

**Agent Requirements (Discovered):**

1. **Bootstrap Speed** ✅ ACHIEVED
   - Target: <5 seconds to load workspace context
   - Current: <1 second for `/model/agent-guide`
   - Status: COMPLETE

2. **Working Examples** ❌ NOT ACHIEVED
   - Target: Copy-paste examples work immediately
   - Current: Examples show empty tables (missing `.data`)
   - Blocker: ISSUE 1 above

3. **Schema Discovery** ⚠️ PARTIAL
   - Target: Agents can introspect any layer programmatically
   - Current: `/example` works, `/fields` fails
   - Blocker: ISSUE 2 above

4. **Complete Layer Coverage** ❌ NOT ACHIEVED
   - Target: All 41 layers visible in production
   - Current: Only 34 layers visible (7 missing)
   - Blocker: ISSUE 3 above

5. **Clear Documentation** ⚠️ PARTIAL
   - Target: Agents understand response patterns
   - Current: Wrapper pattern not documented
   - Blocker: IMPROVEMENT 1 above

6. **Error Prevention** ✅ ACHIEVED
   - Target: Common mistakes documented with fixes
   - Current: 9 mistakes in agent-guide
   - Status: COMPLETE

---

**Q2: What's the gap between current and required?**

**Gap Analysis:**

| Requirement | Target | Current | Gap | Priority |
|-------------|--------|---------|-----|----------|
| Bootstrap Speed | <5s | <1s | ✅ NONE | - |
| Working Examples | 3/3 work | 0/3 work | ❌ 3 fixes needed | 🔴 CRITICAL |
| Schema Discovery | 41/41 layers | Partial | ⚠️ `/fields` broken | 🟡 HIGH |
| Layer Coverage | 41 layers | 34 layers | ❌ 7 missing | 🟡 MEDIUM |
| Documentation | Complete | 80% | ⚠️ Wrapper pattern missing | 🟡 MEDIUM |
| Error Prevention | Documented | 9 tips | ✅ NONE | - |

**Total Gaps: 4 (3 critical, 1 high priority)**

---

**Q3: What must be fixed before agents can work effectively?**

**Minimum Viable Fix (Blocker Resolution):**

1. **Fix Example 1-3 in USER-GUIDE.md** (5 minutes)
   - Add `.data` property access to all examples
   - Test each example works
   
2. **Document response structure** (5 minutes)
   - Add "Response Structure" section to USER-GUIDE.md
   - Explain `{data: [...]}` wrapper pattern

3. **Deploy 41-layer fix to cloud** (10 minutes)
   - Push commits (04a931c + b14c63c + new fixes)
   - Redeploy API to Azure Container Apps
   - Verify `/model/layers` returns 41 layers

4. **Fix or document `/fields` endpoint** (decision needed)
   - Option A: Fix endpoint to return schemas (engineering effort: unknown)
   - Option B: Document that `/example` is preferred (5 minutes)
   - Recommendation: Option B for MVP (unblocks agents immediately)

**Total time to MVP: ~25 minutes**

---

### PLAN OUTPUT

**Epic**: Agent API Readiness - Session 30 Post-Completion  
**Goal**: All agents can bootstrap and explore data model in <2 minutes

**Stories:**

#### Story 1: Fix USER-GUIDE.md Examples ⚠️ CRITICAL
**Acceptance Criteria:**
- [ ] Example 1 uses `.data` property
- [ ] Example 2 uses `.data` property  
- [ ] Example 3 updated or removed (if `/fields` not fixable)
- [ ] All 3 examples tested in clean PowerShell session
- [ ] Examples return visible data (not empty tables)

**Estimate:** 5 function points  
**Time:** 10 minutes

---

#### Story 2: Document Response Structure ⚠️ CRITICAL
**Acceptance Criteria:**
- [ ] New section "Response Structure" added to USER-GUIDE.md
- [ ] Explains `{data: [...], metadata: {...}}` pattern
- [ ] Shows correct access pattern: `(Invoke-RestMethod ...).data`
- [ ] Example shows both wrapper and unwrapped access

**Estimate:** 3 function points  
**Time:** 5 minutes

---

#### Story 3: Deploy 41-Layer Fix ⚠️ HIGH
**Acceptance Criteria:**
- [ ] Commits 04a931c + b14c63c pushed to origin/main
- [ ] API redeployed to Azure Container Apps
- [ ] `/model/layers` returns 41 layers in production
- [ ] All 7 new layers visible (agent_policies, quality_gates, github_rules, deployment_policies, testing_policies, validation_rules, schemas)

**Estimate:** 5 function points  
**Time:** 15 minutes (includes deployment wait time)

---

#### Story 4: Fix or Document Schema Discovery ⚠️ HIGH
**Acceptance Criteria:**
- [ ] Decision made: Fix `/fields` OR document `/example` as primary method
- [ ] If documenting: Update agent-guide with schema discovery pattern
- [ ] If documenting: Update USER-GUIDE.md Example 3
- [ ] Agent can discover schema for any of 41 layers

**Estimate:** 3 function points  
**Time:** 10 minutes (documentation) OR unknown (engineering fix)

**Recommendation:** Document `/example` pattern as MVP solution

---

#### Story 5: Re-test Agent Experience ⚠️ CRITICAL
**Acceptance Criteria:**
- [ ] Fresh agent test following USER-GUIDE.md
- [ ] All 3 examples work (show data in tables)
- [ ] Schema discovery works (via `/example`)
- [ ] `/model/layers` shows 41 layers
- [ ] Time to productivity <2 minutes
- [ ] Update AGENT-EXPERIENCE-AUDIT-SESSION30.md with results

**Estimate:** 5 function points  
**Time:** 15 minutes

---

### PLAN SUMMARY

**Total Stories**: 5  
**Total Function Points**: 21  
**Estimated Time**: 55 minutes  
**Blockers**: None (all dependencies resolved)

**Sprint Goal**: Agent-ready Data Model API in <1 hour

**Ready to proceed to DO phase?** ⏸️ AWAITING USER APPROVAL

---

## PHASE 3: DO ⚙️

**Status**: NOT STARTED (awaiting plan approval)

---

## PHASE 4: CHECK ✅

**Status**: NOT STARTED (awaiting completion of DO phase)

---

## PHASE 5: ACT 📊

**Status**: NOT STARTED (awaiting completion of CHECK phase)

---

## APPENDIX: TEST EVIDENCE

### Test Execution Log

**Test 1: Example 1 (Get endpoints)**
```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$endpoints = Invoke-RestMethod "$base/model/endpoints/?service=eva-brain-api&limit=10"
$endpoints | Select-Object id, method, path, status | Format-Table

# Result: Empty table (headers: id, method, path, status but no rows)
```

**Test 2: Example 2 (Count projects)**
```powershell
$projects = Invoke-RestMethod "$base/model/projects/"
$projects | Group-Object maturity | Select-Object Name, Count | Format-Table

# Result: Single row "Name: (blank), Count: 1"
```

**Test 3: Debugging wrapper structure**
```powershell
$response = Invoke-RestMethod "$base/model/projects/"
$response.PSObject.Properties.Name  # Result: "data"
$response.data.Count  # Result: 56
$response.data | Select-Object id, label, maturity | Format-Table -First 3

# Result: SUCCESS! Shows 3 projects correctly:
# id                      label                maturity
# 07-foundation-layer     Foundation Layer     active
# 16-engineered-case-law  Engineered Case Law  poc
# 03-poc-enhanced-docs    Enhanced Docs POC    poc
```

**Test 4: Fields endpoint**
```powershell
Invoke-RestMethod "$base/model/projects/fields"

# Result:
# Invoke-RestMethod: {"detail":"Schema not found for layer: projects. 
# Try GET /model/layers for available layers."}
```

**Test 5: Example endpoint (workaround)**
```powershell
$example = Invoke-RestMethod "$base/model/projects/example"
$example | Format-List | Out-String -Width 200

# Result: SUCCESS! Returns full 07-foundation-layer object with 31 properties
```

---

## DECISION LOG

**Decision 1**: Should we fix USER-GUIDE.md examples now or wait?  
**Status**: ⏸️ AWAITING USER DECISION

**Decision 2**: Should we fix `/fields` endpoint or document `/example` as primary?  
**Status**: ⏸️ AWAITING USER DECISION  
**Recommendation**: Document `/example` pattern (faster MVP)

**Decision 3**: Should we deploy immediately after fixes or batch with other changes?  
**Status**: ⏸️ AWAITING USER DECISION

---

**END OF DISCOVERY PHASE**

**Next Step**: User approves PLAN → Begin DO phase with Story 1
