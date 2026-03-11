# Deterministic Deployment Pattern

**Purpose**: Establish repeatable, evidence-based deployment workflow for cloud services with automated verification and rollback capabilities.

**Status**: Template (established 2026-03-10 from Project 37 Session 45)

---

## Core Principles

### 1. **Predictable Execution**
Every deployment follows identical steps with deterministic outcomes:
- Fixed sequence (no optional steps by default)
- Timestamped evidence at each stage
- Exit codes: 0=success, 1=business fail, 2=technical error

### 2. **Observable Progress**
Real-time visibility without information overload:
- Console: Minimal (dots, summaries, failures only)
- Log files: Verbose (every action timestamped)
- Evidence files: Structured JSON for auditing

### 3. **Fail-Safe Operations**
Early detection and graceful degradation:
- Pre-flight checks (API reachable, dependencies available)
- Before/after snapshots (detect unintended changes)
- Zero-downtime deployment (gradual traffic shift)
- Automatic rollback triggers

---

## Standard Deployment Flow

```
┌─────────────────────────────────────────────────────────┐
│ PRE-DEPLOYMENT (Baseline Capture)                      │
├─────────────────────────────────────────────────────────┤
│ 1. Collect deployment metrics                          │
│    - /health, /ready, /model/agent-summary             │
│    - Evidence: metrics-before_{timestamp}.json         │
│                                                         │
│ 2. Discover API endpoints (BEFORE)                     │
│    - Query OpenAPI spec                                │
│    - Test GET endpoints                                │
│    - Evidence: endpoint-discovery_before_{ts}.json     │
│                                                         │
│ 3. Generate metadata index                             │
│    - Query source of truth (Cosmos DB)                 │
│    - Generate layer-metadata-index.json                │
│    - Commit to repo                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ BUILD & DEPLOY                                          │
├─────────────────────────────────────────────────────────┤
│ 4. Build Docker image in ACR                           │
│    - Tag: {YYYYMMDD-HHMM}                              │
│    - Verify image exists after build                   │
│                                                         │
│ 5. Deploy to Container Apps (Zero-Downtime)            │
│    - Create new revision                               │
│    - Traffic: 0% → 50% → 100%                          │
│    - Wait 30s between shifts                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ POST-DEPLOYMENT (Verification)                         │
├─────────────────────────────────────────────────────────┤
│ 6. Wait for readiness                                  │
│    - Poll /ready endpoint                              │
│    - Timeout: 120s                                     │
│                                                         │
│ 7. Verify deployment                                   │
│    - Health checks                                     │
│    - Expected layer counts                             │
│    - Uptime validation                                 │
│                                                         │
│ 8. Collect deployment metrics (AFTER)                  │
│    - Evidence: metrics-after_{timestamp}.json          │
│                                                         │
│ 9. Discover API endpoints (AFTER)                      │
│    - Evidence: endpoint-discovery_after_{ts}.json      │
│                                                         │
│ 10. Compare endpoint snapshots                         │
│     - Detect: added, removed, changed endpoints        │
│     - Evidence: endpoint-comparison_{ts}.json          │
│     - Exit 1 if endpoints removed                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ EVIDENCE & ARTIFACTS                                    │
├─────────────────────────────────────────────────────────┤
│ 11. Upload evidence artifacts                          │
│     - Retention: 30 days                               │
│     - All JSON + log files                             │
│                                                         │
│ 12. Display deployment summary                         │
│     - Image tag, revision, URL                         │
│     - Endpoint changes                                 │
│     - Metrics delta                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Making It Deterministic

### Template Variables (Fixed Names)

**Timestamps**:
- Format: `YYYYMMDD_HHMMSS` (sortable, no collisions)
- Usage: evidence files, log files, image tags

**Evidence Files**:
- Pattern: `{operation}_{stage}_{timestamp}.json`
- Examples:
  - `endpoint-discovery_before_20260310_213141.json`
  - `endpoint-discovery_after_20260310_220512.json`
  - `endpoint-comparison_20260310_220530.json`

**Log Files**:
- Pattern: `{script}_run_{timestamp}.log`
- Location: `logs/` directory
- Encoding: UTF-8 with ASCII-only output (cross-platform)

### Exit Code Contract

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | Continue to next step |
| 1 | Business/validation failure | Stop deployment, notify, review required |
| 2 | Technical error | Stop deployment, retry once, escalate if fails |

### Evidence Schema (JSON)

**Minimum Required Fields**:
```json
{
  "timestamp": "2026-03-10T21:31:41Z",
  "operation": "discover-endpoints",
  "status": "success|failed|error",
  "api_url": "https://...",
  "stage": "before|after",
  "metrics": {
    // Operation-specific metrics
  }
}
```

**Extended Fields** (operation-specific):
- `endpoints_discovered`, `success_count`, `failed_count`
- `layers_count`, `objects_count`, `uptime_seconds`
- `response_time_ms`, `response_size_bytes`

---

## Rollback Triggers (Automatic)

**Immediate Rollback** (exit 2):
- Health check fails after deployment
- Readiness timeout (120s exceeded)
- Critical endpoints return 5xx errors

**Review Required** (exit 1):
- Endpoints removed (comparison detects deletions)
- Layer count decreased unexpectedly
- Response time >2x baseline

**Safe to Proceed** (exit 0):
- All health checks pass
- No endpoints removed
- Metrics within expected range

---

## Workflow File Structure

**Location**: `.github/workflows/deploy-production.yml`

**Key Sections**:
```yaml
env:
  TARGET_SUBSCRIPTION: # Azure subscription ID
  TARGET_ACR: # Azure Container Registry
  IMAGE_NAME: # Docker image name
  CONTAINER_APP: # Container App name
  RESOURCE_GROUP: # Resource group
  CLOUD_URL: # Production API URL

jobs:
  deploy:
    steps:
      - name: Collect pre-deployment metrics
      - name: Discover endpoints (BEFORE)
      - name: Build Docker image
      - name: Deploy to Container Apps
      - name: Wait for readiness
      - name: Verify deployment
      - name: Collect post-deployment metrics
      - name: Discover endpoints (AFTER)
      - name: Compare endpoint snapshots
      - name: Upload evidence artifacts
      - name: Deployment summary
```

---

## Local Testing Pattern

**Before pushing to cloud**:

```powershell
# 1. Test scripts locally
cd c:\eva-foundry\37-data-model

# 2. Run endpoint discovery (local)
python scripts/discover-endpoints.py --local --stage before

# 3. Check evidence file
Get-Content evidence\endpoint-discovery_before_*.json -Raw | ConvertFrom-Json | Select-Object timestamp, endpoints_discovered, success_count

# 4. Check log file
Get-Content logs\discover-endpoints_run_*.log | Select-Object -Last 20

# 5. Verify exit code
if ($LASTEXITCODE -eq 0) { Write-Host "PASS" -ForegroundColor Green }
```

---

## Making Changes to the Pattern

### Adding New Verification Step

**1. Create script** (following EVA Script Infrastructure):
```python
from eva_script_infra import setup_logging, save_evidence, ensure_directories

def main():
    logger = setup_logging('my-verification')
    ensure_directories()
    
    # Your verification logic
    
    save_evidence(
        operation='my-verification',
        status='success',
        metrics={'key': 'value'}
    )
```

**2. Add to workflow**:
```yaml
- name: My verification step
  run: |
    python scripts/my-verification.py
    if [ $? -ne 0 ]; then
      echo "❌ Verification failed"
      exit 1
    fi
```

**3. Test locally first**:
```powershell
python scripts/my-verification.py
# Verify: evidence file created, log file created, exit code correct
```

**4. Add to documentation**:
- Update this file with new step
- Update deployment flow diagram
- Document evidence file schema

### Adding New Evidence Type

**1. Define schema**:
```json
{
  "timestamp": "2026-03-10T...",
  "operation": "new-check",
  "status": "success",
  "my_metric": 123,
  "details": {...}
}
```

**2. Implement in script**:
```python
evidence = {
    "timestamp": datetime.utcnow().isoformat(),
    "operation": "new-check",
    "status": "success",
    "my_metric": 123
}

evidence_file = Path("evidence") / f"new-check_{timestamp}.json"
with open(evidence_file, 'w') as f:
    json.dump(evidence, f, indent=2)
```

**3. Add to artifact upload**:
```yaml
- name: Upload evidence artifacts
  uses: actions/upload-artifact@v4
  with:
    path: |
      evidence/new-check_*.json
```

---

## Key Success Metrics

**Deployment Reliability**:
- Target: 95% deployments succeed without intervention
- Measure: Success rate over last 30 deployments

**Evidence Completeness**:
- Target: 100% deployments have before/after evidence
- Measure: Evidence files present in artifacts

**Detection Rate**:
- Target: 100% breaking changes detected before production impact
- Measure: Comparison catches all endpoint removals

**Rollback Speed**:
- Target: <5 minutes from detection to rollback complete
- Measure: Time from failure detection to previous revision at 100% traffic

---

## Common Patterns

### Pattern: Before/After Snapshot
**Use**: Detect unintended changes during deployment
**Implementation**:
1. Capture state before deployment (baseline)
2. Execute deployment
3. Capture state after deployment (current)
4. Compare states, flag differences
5. Exit 1 if critical differences detected

### Pattern: Gradual Traffic Shift
**Use**: Zero-downtime deployment with canary testing
**Implementation**:
1. Deploy new revision with 0% traffic
2. Shift to 50% traffic, observe 30s
3. Shift to 100% traffic if no issues
4. Keep old revision available for instant rollback

### Pattern: Progressive Evidence
**Use**: Build evidence trail throughout deployment
**Implementation**:
1. Each step saves timestamped evidence file
2. Files never overwrite (timestamps prevent collisions)
3. Artifacts uploaded at end (success or failure)
4. Evidence enables post-mortem analysis

### Pattern: Fail-Fast with Context
**Use**: Detect issues early with detailed diagnostics
**Implementation**:
1. Pre-flight checks before expensive operations
2. Early exit with clear error message
3. Evidence file saved even on failure
4. Logs contain full context for debugging

---

## Troubleshooting

### Issue: Evidence files not generated
**Cause**: Script error before evidence.save()
**Fix**: Move save_evidence('started') to top of try block

### Issue: Timestamps cause file conflicts
**Cause**: Multiple runs in same second
**Fix**: Already handled (timestamp includes seconds), no action needed

### Issue: Exit code not propagating
**Cause**: Workflow continues after failure
**Fix**: Add `if [ $? -ne 0 ]; then exit 1; fi` after critical steps

### Issue: Log files too large
**Cause**: Verbose logging for every endpoint
**Fix**: Use logger.debug() for details, logger.info() for summaries

---

## Next Steps (Improving Determinism)

### Priority 1: Response Schema Validation
Add OpenAPI schema validation to endpoint discovery:
- Compare actual responses against schema definitions
- Detect missing fields, wrong types
- Exit 1 if schema violations found

### Priority 2: Performance Baseline
Track response time trends:
- Store baseline metrics in database
- Compare deployment metrics to baseline
- Alert if >20% slower

### Priority 3: Automated Rollback
Implement automatic rollback on critical failures:
- Traffic shift immediately to previous revision
- No human intervention required
- Alert ops team after rollback

### Priority 4: Cross-Project Template
Generalize this pattern for all EVA projects:
- Create deployment template in Project 07 (Foundation)
- Include: workflow template, script templates, documentation
- Projects 38-56: adopt template

---

## Related Documentation

- **EVA Script Infrastructure**: `scripts/eva_script_infra.py`
- **Endpoint Discovery**: `docs/ENDPOINT-DISCOVERY.md`
- **Deployment Workflow**: `.github/workflows/deploy-production.yml`
- **Session 45 Report**: `SESSION-45-PART2-ENDPOINT-DISCOVERY-20260310-2130.md`

---

*Established: 2026-03-10 | Project: 37-data-model | Pattern: Deterministic Deployment*
