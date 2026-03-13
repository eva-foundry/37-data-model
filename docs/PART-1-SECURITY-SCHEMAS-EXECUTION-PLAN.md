# PART 1: Security Schemas Execution Plan (L112-L121)

**Session**: 45 Part 9 (March 12, 2026)  
**Objective**: Operationalize 10 P36-P58 security schemas (111 existing + 10 new = 121 total layers)  
**Methodology**: Nested DPDCA (DISCOVER ✅ → PLAN ✅ → DO → CHECK → ACT)

---

## PART 1.DISCOVER (COMPLETE ✅)

**Status**: 10 schemas identified from SCHEMA-REQUIREMENTS-P36-P58.md

---

## PART 1.PLAN (THIS DOCUMENT)

### 10 New Schemas → L112-L121 Mapping

**P36 (Red-Teaming) - 5 schemas, Domain 3 (AI Runtime) + Domain 6 (Governance) + Domain 9 (Observability)**:

| L# | Schema File | Layer Name | Purpose | Parent Domain |
|----|-------------|-----------|---------|---|
| L112 | red_team_test_suite.schema.json | red_team_test_suites | Promptfoo test pack: test cases, prompts, attack tactics, assertions | Domain 3 & 6 |
| L113 | attack_tactic_catalog.schema.json | attack_tactic_catalog | OWASP + ATLAS + NIST attack taxonomy (50+ tactics) | Domain 6 |
| L114 | ai_security_finding.schema.json | ai_security_findings | Promptfoo results: per-test pass/fail, tactic, severity, framework | Domain 9 |
| L115 | assertions_catalog.schema.json | assertions_catalog | Custom assertions (is-bilingual, has-pii, latency-threshold) | Domain 6 |
| L116 | ai_security_metrics.schema.json | ai_security_metrics | Test suite KPIs: test_count, pass_rate, false_positives, coverage | Domain 9 |

**P58 (Infrastructure Vulnerability) - 5 schemas, Domain 8 (DevOps) + Domain 9 (Observability) + Domain 7 (Project & PM)**:

| L# | Schema File | Layer Name | Purpose | Parent Domain |
|----|-------------|-----------|---------|---|
| L117 | vulnerability_scan_result.schema.json | vulnerability_scan_results | Network scan execution: scan_type, timestamp, scope, counts | Domain 8 |
| L118 | cve_finding.schema.json | infrastructure_cve_findings | CVE record: cve_id, cvss, exploitability, affected_host/port/service | Domain 9 |
| L119 | risk_ranking.schema.json | risk_ranking_analysis | Pareto output: risk scores, percentile, top_20%, risk_reduction | Domain 9 |
| L120 | remediation_task.schema.json | remediation_tasks | Fix actions: severity, assigned_to, due_date, sla_status, runbooks | Domain 7 |
| L121 | remediation_effectiveness.schema.json | remediation_effectiveness_metrics | Progress: closed_count, risk_reduction%, sla%, velocity, backlog | Domain 9 |

---

### Execution Sequence (Nested DPDCA)

#### Phase 1: Schema Validation (DISCOVER.DO)

**Task**: Verify 10 schema files exist and are valid JSON Schema Draft-7

```powershell
# Check files exist
$schemaDir = "c:\eva-foundry\37-data-model\schema"
$schemas = @(
    "red_team_test_suite.schema.json",
    "attack_tactic_catalog.schema.json",
    "ai_security_finding.schema.json",
    "assertions_catalog.schema.json",
    "ai_security_metrics.schema.json",
    "vulnerability_scan_result.schema.json",
    "cve_finding.schema.json",
    "risk_ranking.schema.json",
    "remediation_task.schema.json",
    "remediation_effectiveness.schema.json"
)

$missing = @()
foreach ($schema in $schemas) {
    $path = Join-Path $schemaDir $schema
    if (-not (Test-Path $path)) {
        $missing += $schema
    }
}

if ($missing.Count -gt 0) {
    Write-Error "[FAIL] Missing schemas: $($missing -join ', ')"
    exit 1
} else {
    Write-Host "[PASS] All 10 schemas exist"
}

# Validate JSON syntax
foreach ($schema in $schemas) {
    $path = Join-Path $schemaDir $schema
    try {
        $content = Get-Content -Raw $path
        $json = $content | ConvertFrom-Json -ErrorAction Stop
        Write-Host "[PASS] $schema - valid JSON"
    } catch {
        Write-Error "[FAIL] $schema - invalid JSON: $_"
        exit 1
    }
}
```

**Success Criteria**:
- ✅ All 10 schema files exist
- ✅ All JSON is valid (parseable)
- ✅ All contain `$id` + `title` + `properties`

**Output**: evidence/PART-1-SCHEMA-VALIDATION-{timestamp}.json

---

#### Phase 2: Layer Registration (PLAN.DO)

**Task**: Create layer objects in LAYER-DEFINITIONS.json for L112-L121

**File**: `docs/library/LAYER-DEFINITIONS-L112-L121.md`

**Content Structure**:
```yaml
layer_id: L112
name: red_team_test_suites
schema_file: red_team_test_suite.schema.json
domain: 3, 6 (AI Runtime + Governance)
parent_layers: [L9/agents, L21/prompts, L36/agent_policies, L22/security_controls]
child_layers: [L114/ai_security_findings]
queries:
  - "GET /model/red_team_test_suites" (list all test suites)
  - "GET /model/red_team_test_suites?framework=OWASP-LLM" (filter by framework)
  - "GET /model/red_team_test_suites/{suite_id}/results" (get results)
startup_seed:
  count: 2 (example test suites for P36 demo)
  source: "docs/examples/red-team-test-suites-seed.json"
```

---

#### Phase 3: Cosmos DB Seeding (DO.DO)

**Task**: Register all 10 layer objects in Cosmos DB

**Approach**: API-first (use POST /model/admin/layer to register each layer)

**Payload per layer**:
```json
{
  "id": "L112",  // or UUID - data model handles
  "name": "red_team_test_suites",
  "schema": {...},  // full JSON Schema
  "description": "Promptfoo test pack",
  "domain": ["Domain-3", "Domain-6"],
  "status": "operational",
  "startup_seed_count": 2,
  "created_at": "2026-03-12T{timestamp}Z",
  "created_by": "agent-framework"
}
```

**Steps**:
1. Call `POST https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/admin/layer` for each of 10 layers
2. Include admin token in Authorization header (from Key Vault)
3. Verify 201/200 response for each
4. Save response IDs (may differ from L112-L121 if data model auto-assigns)

**Error Handling**:
- If any layer fails → STOP, log error, roll back (or mark as "PARTIAL")
- Retry failed layer (up to 3 times) before escalation

---

#### Phase 4: Seed Data Loading (DO.VERIFY)

**Task**: Load startup examples into each layer

**Required**: Seed files in `docs/examples/`:
- `red-team-test-suites-seed.json` (2 test suites)
- `attack-tactics-master.json` (10 OWASP tactics)
- `ai-security-findings-examples.json` (1 sample finding)
- `assertions-examples.json` (3 custom assertions)
- `ai-metrics-sample.json` (1 metric record)
- `vulnerability-scan-sample.json` (1 scan result)
- `cve-findings-sample.json` (5 CVE records)
- `risk-ranking-sample.json` (1 Pareto analysis)
- `remediation-tasks-sample.json` (3 tasks)
- `remediation-metrics-sample.json` (1 metric)

**Approach**: 
```powershell
# For each seed file
$seedFile = "docs/examples/red-team-test-suites-seed.json"
$data = Get-Content -Raw $seedFile | ConvertFrom-Json

# POST to /model/{layer_name}/
$uri = "https://msub-eva-data-model.../model/red_team_test_suites"
$headers = @{Authorization = "Bearer $adminToken"}

foreach ($record in $data) {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Body ($record | ConvertTo-Json) -Headers $headers
    Write-Host "[SEED] $($record.id) → $($response.id)"
}
```

**Success Criteria**:
- ✅ All seed files exist and are valid JSON
- ✅ All POST requests succeed (201/200)
- ✅ Total seed records: at least 30 (minimum viable for layer verification)

**Output**: evidence/PART-1-SEED-LOADING-{timestamp}.json

---

#### Phase 5: Query Validation (CHECK.VERIFY)

**Task**: Query each layer, verify objects are readable

```powershell
# Query each layer
$layers = @(
    "red_team_test_suites",
    "attack_tactic_catalog",
    "ai_security_findings",
    "assertions_catalog",
    "ai_security_metrics",
    "vulnerability_scan_results",
    "infrastructure_cve_findings",
    "risk_ranking_analysis",
    "remediation_tasks",
    "remediation_effectiveness_metrics"
)

$results = @{}
foreach ($layer in $layers) {
    $uri = "https://msub-eva-data-model.../model/$layer"
    $response = Invoke-RestMethod -Uri $uri -Headers @{Authorization = "Bearer $adminToken"}
    $results[$layer] = @{
        count = $response.value.Count
        sample_id = $response.value[0].id
        status = "operational"
    }
    Write-Host "[CHECK] $layer → $($results[$layer].count) objects"
}

# Write verification report
$results | ConvertTo-Json | Out-File "evidence/PART-1-LAYER-QUERY-CHECK-{timestamp}.json"
```

**Success Criteria**:
- ✅ All 10 layers return HTTP 200
- ✅ Each layer has ≥1 object
- ✅ Objects contain required fields from schema

**Checkpoint**: If any layer fails, STOP and diagnose.

---

#### Phase 6: Final Commit & Sync (ACT.FINALIZE)

**Task**: Commit changes and sync data model metadata

**Git Commit**:
```bash
git add -A
git commit -m "feat: Operationalize 10 P36-P58 security schemas (L112-L121)

- L112: red_team_test_suites (Promptfoo test pack)
- L113: attack_tactic_catalog (OWASP + ATLAS)
- L114: ai_security_findings (Red-team results)
- L115: assertions_catalog (Custom assertions)
- L116: ai_security_metrics (Test KPIs)
- L117: vulnerability_scan_results (Network scans)
- L118: infrastructure_cve_findings (CVE records)
- L119: risk_ranking_analysis (Pareto analysis)
- L120: remediation_tasks (Fix actions)
- L121: remediation_effectiveness_metrics (Progress tracking)

Total: 121 operational layers (111 existing + 10 new)"
```

**Data Model Sync**:
```powershell
# Update COMPLETE-LAYER-CATALOG.md with new layer counts
# Update docs/library/99-layers-design-20260309-0935.md
# Add new domain relationships (Domain 3/6/7/8/9 additions)
```

**Output**: 
- evidence/PART-1-FINAL-INVENTORY-{timestamp}.json (121 layers confirmed)
- PART-1-COMPLETION-SUMMARY.md (exit code 0, all checks passed)

---

## Success Criteria (PART 1 COMPLETE)

✅ **DISCOVER**: Identified 10 P36-P58 security schemas  
✅ **PLAN**: Mapped to L112-L121, designed execution sequence  
⏳ **DO**: (Next phase) Create layer objects, seed data, verify queries  
⏳ **CHECK**: Validate all 121 layers in Cosmos DB  
⏳ **ACT**: Commit changes, update documentation

---

## Rollback Plan

**If Phase 3 (Seeding) fails**:
```powershell
# Delete all registers layers L112-L121
for ($i = 112; $i -le 121; $i++) {
    curl -X DELETE "https://msub-eva-data-model.../model/admin/layer/L$i" `
        -H "Authorization: Bearer $adminToken"
}
```

**If Phase 4 (Seed Loading) fails**:
```powershell
# Restore from backup (if available) OR re-run Phase 3
```

**Failure Threshold**: Any single layer operation fails → STOP, diagnose, fix, retry

---

## Next: PART 1.DO Execution

Required before proceeding: User approval to execute seeding operations
