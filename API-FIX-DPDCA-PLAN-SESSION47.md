# API 404 Fix - D³PDCA Plan (Session 47)

**Issue**: All Data Model API endpoints return 404
- `/health` → 404
- `/model/query` → 404  
- `/model/admin/layers` → 404

**Root Cause Classification**: Infrastructure blocker (not code quality)
**Priority**: CRITICAL (blocks Phase A+B production deployment)
**Target Resolution**: This session

---

## D³PDCA Cycle: API Fix

### **PHASE 1: DISCOVER (10 min)**
*"What's actually broken?"*

#### Discovery Tasks
1. **Container Logs** (5 min)
   - Check: Application startup errors, missing dependencies, configuration issues
   - Command: `az containerapp logs show --name msub-eva-data-model --resource-group EVA-Sandbox-dev`
   - Output: Look for [ERROR], traceback, 500s, crash loops

2. **Cloud Infrastructure Status** (3 min)
   - Check: Container running? Cosmos endpoint reachable? Secrets mounted?
   - Command: `az containerapp show --name msub-eva-data-model --resource-group EVA-Sandbox-dev --query properties.provisioningState`
   - Output: Should be "Succeeded" (not "Failed" or "InProgress")

3. **Direct Container Access** (2 min)
   - Check: Is 404 from routing layer or application?
   - Command: `curl https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/health`
   - Output: If still 404 → app issue. If error → routing issue.

#### Discovery Hypothesis
*Most likely issue based on Session 46 findings:*
- Application is running (container not crashing)
- Routes are not registered (404 at startup, routes not mounted)
- **Probable cause**: FastAPI router not initialized or routes not added to app

---

### **PHASE 2: PLAN (5 min)**
*"What's the fix strategy?"*

#### Root Cause scenarios & fixes

| Scenario | Symptom | Fix | Time |
|----------|---------|-----|------|
| **Routes not registered** | 404 on all endpoints, app running | Add router to FastAPI app, redeploy | 5 min |
| **Startup crash** | Container crash loop | Fix dependency/import error, redeploy | 10 min |
| **Cosmos connection fails** | 500 errors (not 404) | Re-inject connection string secret, redeploy | 3 min |
| **Ingress disabled** | API unreachable | Enable ingress in container config, redeploy | 2 min |
| **APIM routing broken** | 404 at APIM layer | Recreate route, redeploy APIM policy | 5 min |

#### Diagnostic Priority Tree

```
Does container logs show errors?
├─ YES: Fix root cause (startup crash, missing deps, etc.)
└─ NO: Is container running?
   ├─ NO: Check status, restart container, check logs
   └─ YES: Does HTTP 404 from container itself?
      ├─ YES (direct access = 404): Application bug (routes not registered)
      │   └─ Fix: Review routes in main.py, ensure router mounted
      └─ NO (routing works): APIM/networking issue
          └─ Fix: Review APIM policies, container ingress settings
```

#### Action Plan (If-Then)

**IF** logs show startup error → **THEN**
1. Fix error in codebase (Session 45 endoint is in `37-data-model/src/main.py`)
2. Rebuild container image
3. Push to ACR (`msubsandacr202603031449`)
4. Redeploy via Container Apps (trigger new revision)
5. Test endpoint

**ELSE IF** container running but routes not registered → **THEN**
1. Check: Is `app.include_router()` in `main.py`?
2. Check: Do routes have `@router.get()` decorators?
3. Check: Is `FastAPI()` app created correctly?
4. If missing: Add routes, rebuild, redeploy

**ELSE IF** Cosmos connection fails → **THEN**
1. Verify secret exists: `az keyvault secret show --vault-name msubsandkv202603031449 --name cosmos-url`
2. Verify container env has `COSMOS_URL`, `COSMOS_KEY`
3. If missing: Update container env variables, redeploy

**ELSE** (routing issue) → **THEN**
1. Check APIM policy (if traffic routes through APIM)
2. Verify container ingress enabled
3. Check DNS/networking (test from local machine)

---

### **PHASE 3: DO (20 min)**
*"Execute the diagnostics and fix"*

#### Step-by-Step Execution

**DO.1: Container Logs (5 min)**
```powershell
# DISCOVER: What happened on startup?
az containerapp logs show `
  --name msub-eva-data-model `
  --resource-group EVA-Sandbox-dev `
  --tail 50

# Parse output:
# - If [ERROR] or traceback → Fix application code
# - If "Listening on 0.0.0.0:8000" → App started cleanly
```

**DO.2: Check Container Status (2 min)**
```powershell
az containerapp show `
  --name msub-eva-data-model `
  --resource-group EVA-Sandbox-dev `
  --query "{provisioningState: properties.provisioningState, unhealthyReplicaCount: properties.unhealthyReplicaCount}"
```

**DO.3: Test Direct Access (2 min)**
```powershell
# Get container FQDN
$fqdn = (az containerapp show --name msub-eva-data-model --resource-group EVA-Sandbox-dev --query properties.latestRevisionFqdn -o tsv)

# Test each endpoint
$endpoints = @("/health", "/model/query", "/docs")
foreach ($ep in $endpoints) {
  Write-Host "Testing: $fqdn$ep"
  $response = curl -s -w "%{http_code}" "https://$fqdn$ep"
  Write-Host "Response: $response"
}
```

**DO.4: Inspect FastAPI App (5 min)**
```powershell
# Check main.py for route registration
cd c:\eva-foundry\37-data-model
cat src/main.py | Select-String -Pattern "@app|@router|include_router|FastAPI"

# If routes are missing → This is the bug
```

**DO.5: Fix & Rebuild (if needed) (6 min)**
```powershell
# IF SO: Edit src/main.py to add routes
# Build image
docker build -t msubsandacr202603031449.azurecr.io/eva/eva-data-model:phase-a-fix .

# Push to ACR
docker push msubsandacr202603031449.azurecr.io/eva/eva-data-model:phase-a-fix

# Redeploy
az containerapp update --name msub-eva-data-model --resource-group EVA-Sandbox-dev --image msubsandacr202603031449.azurecr.io/eva/eva-data-model:phase-a-fix
```

---

### **PHASE 4: CHECK (5 min)**
*"Did the fix work?"*

#### Verification Checklist
- [ ] Container logs show no [ERROR]
- [ ] Container status = "Succeeded"
- [ ] `/health` returns 200 (not 404)
- [ ] `/model/query` returns 200 (not 404)
- [ ] `/model/admin/layers` returns 200 (not 404)
- [ ] Cosmos connection working (can query)

#### Success Criteria
```powershell
# PASS if ALL return HTTP 200:
curl https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/health
curl https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/query
curl https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/docs
```

#### Comparison vs Baseline
- **Session 46 Status**: All endpoints return 404
- **Target Status**: All endpoints return 200 (or appropriate content)
- **Test Result**: PASS / FAIL

---

### **PHASE 5: ACT (5 min)**
*"Document & proceed to next milestone"*

#### Actions (upon success)
1. **Tag Release** 
   ```powershell
   git tag phase-a-discovery-layers-v1.1-api-fixed
   git push origin --tags
   ```

2. **Update Documentation**
   - File: [37-data-model/INFRASTRUCTURE-TICKET-CLOUD-ROUTING-404.md]
   - Status: RESOLVED (root cause + fix documented)

3. **Live Cosmos Seeding** (ready for next phase)
   - Register 8 discovery layers (L122–L129) to Cosmos
   - Validate data model API queries return data

4. **Paperless Registration** (ready for Session 47b)
   - Run: `python.exe scripts/register-project-61-govops-paperless.py`
   - Result: Project 61-GovOps in project_work layer

5. **Production Release** (final step)
   - All data synced to Cosmos
   - All API endpoints working
   - Tag: `phase-a-b-production-operational`

#### Lessons Learned
- Cloud routing bugs manifest as 404s across all routes (not selective)
- Always check container logs first (90% of issues there)
- Direct endpoint test bypasses APIM (good for root cause analysis)
- Session-to-session continuity requires prompt API fix

---

## Timeline

| Task | Est. Time | Status |
|------|-----------|--------|
| **DISCOVER** | 10 min | 🔄 In Progress |
| **PLAN** | 5 min | 🔄 In Progress |
| **DO** | 20 min | ⏳ Pending |
| **CHECK** | 5 min | ⏳ Pending |
| **ACT** | 5 min | ⏳ Pending |
| **Total** | ~45 min | - |

**Then to Production**: +20 min (seeding + paperless + release tag)

---

## Rollback Plan (if fix makes things worse)

```powershell
# Rollback to previous working revision
az containerapp revision list --name msub-eva-data-model --resource-group EVA-Sandbox-dev --query "[0:3].{name: name, active: properties.active}"

# Activate prior revision
az containerapp revision activate --name msub-eva-data-model --resource-group EVA-Sandbox-dev --revision <prior-revision-name>
```

---

**Reference**: This plan follows Fractal D³PDCA methodology from Session 43-46.
