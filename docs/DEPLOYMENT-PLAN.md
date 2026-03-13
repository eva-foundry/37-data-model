# PART 5 - Router Reorganization Deployment Plan

**Prepared**: 2026-03-12 23:44:45  
**Status**: Ready for Deployment  
**Estimated Duration**: 30 minutes (ACA deployment + validation)

## Pre-Deployment Checklist

- [x] Schema reorganization mapping complete
- [x] Domain directory structure created
- [x] Overlap conflicts resolved
- [x] Documentation updated
- [x] All evidence generated and committed

## Deployment Steps

### 1. Build New Container Image

\\\powershell
# From 37-data-model directory
az acr build --registry msubsandacr202603031449 \
  --image eva/eva-data-model:party5-20260312-234445 \
  --file Dockerfile .
\\\

**Expected**: Image built and pushed to msubsandacr202603031449

### 2. Update Container App Revision

\\\powershell
az containerapp update \
  --name msub-eva-data-model \
  --resource-group EVA-Sandbox-dev \
  --image msubsandacr202603031449.azurecr.io/eva/eva-data-model:party5-latest \
  --region canadacentral
\\\

**Expected**: New revision deployed, old revision retained for rollback

### 3. Validate API Endpoints

\\\powershell
\https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io = 'https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io'

# Check health
Invoke-RestMethod "\https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/health"

# Check model endpoints
Invoke-RestMethod "\https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/agent-guide"
Invoke-RestMethod "\https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/user-guide"
Invoke-RestMethod "\https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/ontology"
\\\

**Expected**: All endpoints respond with 200 OK

### 4. Monitor Logs

\\\powershell
az containerapp logs show \
  --name msub-eva-data-model \
  --resource-group EVA-Sandbox-dev \
  --type console \
  --tail 100
\\\

**Expected**: No errors in logs

### 5. Rollback (If Needed)

If any step fails:

\\\powershell
# List revisions
az containerapp revision list \
  --name msub-eva-data-model \
  --resource-group EVA-Sandbox-dev

# Activate previous revision
az containerapp revision activate \
  --name msub-eva-data-model \
  --resource-group EVA-Sandbox-dev \
  --revision <previous-revision-id>
\\\

---

## Post-Deployment Validation

1. **Endpoint Health**: All 5 API endpoints respond
2. **Schema Availability**: All 85 schemas accessible via domain paths
3. **Evidence Integrity**: No data loss or corruption
4. **Performance**: Response times < 500ms (p95)
5. **Monitoring**: Alerts configured for endpoint failures

---

## Deployment Artifacts in Git

- ✅ 8 security schemas (L112-L119): schema/*.schema.json
- ✅ API endpoints documentation: docs/API-ENDPOINTS.md
- ✅ Schema reorganization mapping: docs/SCHEMA-REORGANIZATION-MAPPING.md
- ✅ 4 PART-5 evidence files: vidence/PART-5-*.json

**Branch**: \eat/security-schemas-p36-p58-20260312\  
**Latest Commit**: \8e2e112\ (PART 4 documentation)

---

## Success Criteria

- ✅ All endpoints responding
- ✅ No data loss
- ✅ Response times > baseline
- ✅ Zero errors in first 1 hour
- ✅ Monitoring alerts active

---

## Contact for Support

- **Platform Team**: msubsandacr@example.com
- **On-Call Engineer**: See deployment notification
- **Escalation**: Eva Project Leadership

