# Endpoint Discovery & Monitoring

Comprehensive endpoint inventory system for tracking API surface area across deployments.

## Overview

**Purpose**: Capture complete API endpoint inventory with response examples as deployment evidence. Detect endpoint additions, removals, and behavioral changes.

**Key Features**:
- [PASS] Auto-discover all endpoints from OpenAPI spec
- [PASS] Test GET endpoints with response sampling
- [PASS] Before/after deployment snapshots
- [PASS] Automatic change detection and reporting
- [PASS] Evidence files uploaded as artifacts
- [PASS] Integrated into CI/CD pipeline

---

## Scripts

### 1. `discover-endpoints.py`

Discovers and tests all API endpoints, generating comprehensive inventory evidence.

**Usage**:
```bash
# Production API (default)
python scripts/discover-endpoints.py --stage before

# Local development
python scripts/discover-endpoints.py --local --stage before

# Custom endpoint
python scripts/discover-endpoints.py --url http://custom-api.example.com --stage after
```

**Arguments**:
- `--local`: Use localhost:8010 instead of production
- `--url <url>`: Custom API URL
- `--stage <before|after>`: Deployment stage (default: before)

**Output**:
- `evidence/endpoint-discovery_{stage}_{timestamp}.json`: Complete endpoint inventory
- `logs/discover-endpoints_run_{timestamp}.log`: Execution log

**Evidence Structure**:
```json
{
  "timestamp": "2026-03-10T21:30:00Z",
  "api_url": "https://...",
  "stage": "before",
  "endpoints_discovered": 42,
  "endpoints_tested": 38,
  "endpoints_skipped": 4,
  "success_count": 36,
  "failed_count": 2,
  "error_count": 0,
  "endpoints": [
    {
      "path": "/model/projects",
      "method": "GET",
      "status": "success",
      "response_code": 200,
      "response_time_ms": 123,
      "response_size_bytes": 4567,
      "response_sample": {"total": 57, "layers": [...]},
      "error": null
    },
    {
      "path": "/admin/seed",
      "method": "POST",
      "status": "skipped",
      "reason": "write_operation"
    }
  ]
}
```

**Skip Logic**:
- Endpoints with path parameters (`/model/layer/{name}`)
- Write operations (POST, PUT, DELETE, PATCH)
- Endpoints requiring authentication (admin routes)

---

### 2. `compare-endpoint-snapshots.py`

Compares two endpoint discovery snapshots to detect API changes.

**Usage**:
```bash
# Auto-find latest before/after snapshots
python scripts/compare-endpoint-snapshots.py --latest

# Compare specific snapshots
python scripts/compare-endpoint-snapshots.py \
  evidence/endpoint-discovery_before_20260310_210000.json \
  evidence/endpoint-discovery_after_20260310_220000.json
```

**Arguments**:
- `--latest`: Auto-detect latest before/after snapshots
- `<before_file>`: Path to before snapshot
- `<after_file>`: Path to after snapshot

**Output**:
- `evidence/endpoint-comparison_{timestamp}.json`: Detailed comparison
- `logs/compare-endpoint-snapshots_run_{timestamp}.log`: Execution log
- Console: Human-readable summary

**Evidence Structure**:
```json
{
  "timestamp": "2026-03-10T22:30:00Z",
  "before_file": "evidence/endpoint-discovery_before_20260310_210000.json",
  "after_file": "evidence/endpoint-discovery_after_20260310_220000.json",
  "endpoints_added": 2,
  "endpoints_removed": 0,
  "endpoints_changed": 3,
  "endpoints_unchanged": 35,
  "details": {
    "added": [
      {"path": "/model/execution-phases", "method": "GET"}
    ],
    "removed": [],
    "changed": [
      {
        "path": "/model/projects",
        "method": "GET",
        "changes": [
          "response_size: 4567b -> 5123b (12.2% change)"
        ]
      }
    ]
  }
}
```

**Exit Codes**:
- `0`: Success, no endpoints removed
- `1`: Endpoints removed (requires review)
- `2`: Technical error (file not found, API unreachable)

**Change Detection**:
- **Added**: Endpoint exists in `after` but not `before`
- **Removed**: Endpoint exists in `before` but not `after`
- **Changed**: Status change, response code change, or >10% size change
- **Unchanged**: No significant differences

---

## CI/CD Integration

### GitHub Actions Workflow

The endpoint discovery system is integrated into `.github/workflows/deploy-production.yml`:

**Deployment Flow**:
```
1. Collect pre-deployment metrics
2. ➡️ Discover endpoints (BEFORE)
3. Build Docker image
4. Deploy to Azure Container Apps (zero-downtime)
5. Wait for readiness
6. Verify deployment
7. Collect post-deployment metrics
8. ➡️ Discover endpoints (AFTER)
9. ➡️ Compare endpoint snapshots
10. Upload evidence artifacts
11. Deployment summary
```

**Workflow Steps**:

```yaml
- name: Discover endpoints (BEFORE deployment)
  run: |
    python3 -m pip install requests --quiet
    python3 scripts/discover-endpoints.py --stage before

- name: Discover endpoints (AFTER deployment)
  run: |
    python3 scripts/discover-endpoints.py --stage after

- name: Compare endpoint snapshots
  run: |
    python3 scripts/compare-endpoint-snapshots.py --latest

- name: Upload endpoint evidence
  uses: actions/upload-artifact@v4
  with:
    name: endpoint-evidence
    path: |
      evidence/endpoint-discovery_*.json
      evidence/endpoint-comparison_*.json
      logs/*.log
```

**Artifacts**:
- All endpoint evidence files uploaded to GitHub Actions artifacts
- Retained for 30 days
- Accessible via GitHub Actions UI
- Committed to git for traceability

---

## Evidence Files in Git

All endpoint evidence is committed to `evidence/` directory:

```
evidence/
├── endpoint-discovery_before_20260310_210000.json
├── endpoint-discovery_after_20260310_220000.json
└── endpoint-comparison_20260310_223000.json
```

**Visibility**: Evidence files appear in git commits alongside deployment changes, providing deployment-time API surface area documentation.

**Example Commit Message**:
```
feat: Deploy Session 45 automation

- Generated layer-metadata-index.json from Cosmos DB
- 87 operational layers confirmed
- Endpoint evidence: 42 endpoints, 0 removed, 2 added
```

---

## Professional Standards

All scripts follow **EVA Script Infrastructure** standards:

### Logging
- **Console**: ASCII-only status messages (`[PASS]`, `[FAIL]`, `[INFO]`, `[ERROR]`)
- **File**: `logs/{script}_run_{timestamp}.log` with detailed execution trace
- Both handlers active simultaneously

### Evidence
- **Format**: Timestamped JSON with operation name, status, metrics
- **Location**: `evidence/{operation}_{context}_{timestamp}.json`
- **Immutable**: Never overwrite, always create new timestamped file

### Exit Codes
- `0`: Success
- `1`: Business/validation failure (e.g., endpoints removed)
- `2`: Technical error (file not found, API unreachable)

### Dependencies
- **Runtime**: Python 3.10+, requests library
- **EVA Infrastructure**: `eva_script_infra.py` (setup_logging, save_evidence, etc.)

---

## Manual Testing

### Local Development

```bash
# 1. Start local API (if testing locally)
cd 37-data-model
uvicorn api.server:app --reload --port 8010

# 2. Discover endpoints (before)
python scripts/discover-endpoints.py --local --stage before

# 3. Make changes to API

# 4. Discover endpoints (after)
python scripts/discover-endpoints.py --local --stage after

# 5. Compare
python scripts/compare-endpoint-snapshots.py --latest

# 6. Review evidence
cat evidence/endpoint-comparison_*.json | jq
```

### Production API

```bash
# Discover production endpoints (after deployment snapshot)
python scripts/discover-endpoints.py --stage after

# Review evidence
cat evidence/endpoint-discovery_after_*.json | jq '.endpoints[] | select(.status == "success") | .path'
```

---

## Troubleshooting

### Issue: "No endpoints discovered"

**Cause**: OpenAPI spec not accessible or malformed  
**Fix**: Check API `/openapi.json` endpoint manually

```bash
curl https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/openapi.json | jq
```

### Issue: "requests library not installed"

**Cause**: Missing Python dependency  
**Fix**: Install requests

```bash
pip install requests
```

### Issue: "Comparison detected changes" (exit 1)

**Cause**: Endpoints removed during deployment  
**Fix**: Review comparison evidence to determine if removal is intentional

```bash
python scripts/compare-endpoint-snapshots.py --latest
cat evidence/endpoint-comparison_*.json | jq '.details.removed'
```

### Issue: Timeout during endpoint testing

**Cause**: API slow or unresponsive  
**Fix**: Scripts use 30-second timeout, check API health

```bash
curl https://msub-eva-data-model.../health
```

---

## Future Enhancements

- [ ] **Response Schema Validation**: Compare actual responses against OpenAPI schema
- [ ] **Performance Regression Detection**: Detect endpoints >20% slower
- [ ] **Authentication Support**: Test admin endpoints with bearer tokens
- [ ] **Path Parameter Testing**: Generate test values for parametrized endpoints
- [ ] **Parallel Execution**: Test endpoints concurrently for speed
- [ ] **Historical Trending**: Track endpoint count/performance over time

---

## Related Documentation

- **EVA Script Infrastructure**: `scripts/eva_script_infra.py`
- **Deployment Metrics**: `scripts/collect-deployment-metrics.ps1`
- **Deployment Verification**: `scripts/verify-deployment.py`
- **GitHub Actions Workflow**: `.github/workflows/deploy-production.yml`
- **Session 45 Completion Report**: `SESSION-45-COMPLETION-REPORT-20260310-2025.md`

---

*Last Updated: 2026-03-10 (Session 45 - Endpoint Discovery System)*
