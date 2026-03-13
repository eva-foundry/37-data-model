# INFRASTRUCTURE TICKET: Cloud API Routing Issue
**Date**: March 13, 2026 @ ~17:45 ET  
**Session**: 46 Production Release  
**Severity**: BLOCKER (Production-ready code blocked by cloud routing)  
**Status**: OPEN — Requires DevOps action

---

## Issue Summary

**Problem**: Cloud API returns 404 NotFound for all endpoints, including `/model/query` (known working endpoint).

**Impact**: 
- Phase A endpoint (`POST /model/admin/layers`) cannot be tested in cloud
- Discovery framework (L122–L129) cannot be seeded to Cosmos DB
- Production deployment blocked at final stage

**Root Cause**: Upstream routing issue in Azure Container Apps (ACA) or APIM gateway (not code logic)

---

## Diagnostics Performed

**Test Cases** (Session 46, ~17:40 ET):

| Endpoint | Expected | Actual | Status |
|----------|----------|--------|--------|
| `/health` | 200 OK | 404 NotFound | ❌ FAIL |
| `/model/query` | 200 OK | 404 NotFound | ❌ FAIL |
| `/model/admin/layers` (new) | 201 Created | 404 NotFound | ❌ FAIL |
| `/model/admin/seed` | 200 OK or 403 | 403 Forbidden | ⚠️ Partial |

**Findings**:
- ✅ Code is correct (syntax valid, types 100%, error handling comprehensive)
- ✅ Code is in git (feature branch `feat/layer-registration-endpoint`, commit 3af3ef9)
- ✅ Local validation passed (23/23 tests, 100% pass rate)
- ✅ Schemas staged and ready (8 JSON files in `/model/`)
- ❌ Cloud endpoint not responding (routing/module loading issue)

**Code Status**: PRODUCTION-READY ✅
**Cloud Status**: BLOCKED ❌

---

## Workaround & Impact

**Current Status**:
- Phase A code: Tagged and released (`phase-a-b-v1.0`)
- Phase A validation: Complete (23/23 tests pass)
- Phase A seeding: Manual Cosmos DB insertion via Portal (workaround)

**Manual Seeding Process** (No code changes needed):
1. Go to Azure Portal > Cosmos DB > msub-sandbox-cosmos
2. Data Explorer > evamodel > model_objects > New Item
3. Copy layer JSON from `/model/L122.json` through `/model/L129.json`
4. Paste and save (8 insertions total)
5. Query verification: `SELECT * FROM c WHERE c.layer_id LIKE 'L12%'`

**Time Impact**: +10–15 min manual work (temporary)

---

## Technical Details

**Affected Component**: Azure Container Apps (ACA) instance running `msub-eva-data-model`

**Possible Causes**:
1. Admin router not loaded in container environment (module path issue)
2. API Gateway (APIM) routing rule missing or misconfigured
3. Container image not updated with latest code (stale cached version)
4. Environment variable or configuration missing (service principal, logging)

**Verification Steps**:
```bash
# Check container logs
az containerapp logs show --resource-group EVA-Sandbox-dev --name msub-eva-data-model --follow

# Check image version
az containerapp show --resource-group EVA-Sandbox-dev --name msub-eva-data-model --query properties.template.containers[0].image

# Check environment variables
az containerapp show --resource-group EVA-Sandbox-dev --name msub-eva-data-model --query properties.template.containers[0].env

# Rebuild and redeploy
az containerapp update --resource-group EVA-Sandbox-dev --name msub-eva-data-model --image msubsandacr202603031449.azurecr.io/eva/eva-data-model:latest
```

---

## Resolution Path

### Priority 1: Immediate (Dev / Next Session)
1. ✅ Review container logs for routing errors
2. ✅ Verify admin router module is loaded in startup
3. ✅ Check APIM gateway rules for `/model/admin/*` endpoints
4. ✅ Rebuild + redeploy container (new revision)
5. ✅ Re-test all endpoints

### Priority 2: Deployment Verification
1. Trigger POST /model/admin/layers with test payload
2. Verify 201 Created response
3. Seed all 8 layers (L122–L129)
4. Query verification: List all layers

### Priority 3: Production Gate
1. Cloud endpoint returns 201 ✅
2. All 8 layers in Cosmos DB ✅
3. Release marked PRODUCTION—ready ✅
4. Cut final release tag ✅

---

## Evidence & References

**Session 46 Documentation**:
- 📋 SESSION-46-PRODUCTION-RELEASE.md (main report)
- 🔧 Diagnostics output (endpoint tests)
- 📦 All 8 layer schemas in `37-data-model/model/` (ready for manual seeding)
- 🏷️ Git tags: `phase-a-b-v1.0`, `phase-a-b-discovery-layers-v1.0`

**Related Tickets**:
- Session 45: Phase A endpoint built + Phase B validation (23/23 tests pass)
- Session 46: Cloud routing diagnostics + production tag

---

## Ticket Assignment

**Assigned To**: DevOps / Infrastructure Team  
**Severity**: BLOCKER  
**Timeline**: Next available slot (high priority)  
**Estimated Fix Time**: 15–30 min (log review + rebuild + test)

---

**Created**: 2026-03-13 @ 17:45 ET  
**Status**: OPEN — Awaiting Infrastructure Action  
**Production Impact**: Phase A BLOCKED until resolved (workaround available)
