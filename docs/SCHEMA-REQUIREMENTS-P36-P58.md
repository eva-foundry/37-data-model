# Data Model Schema Requirements: Project 36 (Red-Teaming) & Project 58 (Security Factory)

**Analysis Date**: 2026-03-12  
**Analyst**: AIAgentExpert  
**Scope**: Complete schema mapping for red-teaming + security factory workloads against 111-layer Data Model  
**Status**: Architectural Design (ready for unified deployment)

---

## Executive Summary

**Project 36** (AI Security Observatory) and **Project 58** (Security Factory) have **complementary security roles**:
- **P36**: LLM vulnerability testing (prompt injection, jailbreaks, PII leakage) via Promptfoo red-teaming framework
- **P58**: Infrastructure vulnerability scanning + Pareto risk ranking + remediation orchestration

**Schema Analysis Result**: 
- **Approved Existing Schemas**: 2 (security_controls, agent_performance_metrics)
- **Rejected Workarounds**: 8 schemas have compromises (loose typing, semantic mismatch)
- **New Dedicated Layers Required**: 10 (5 for P36, 5 for P58)
- **Total Production-Ready**: 12 schemas (2 approved + 10 new)

**Recommendation**: Create 10 new dedicated layers instead of forcing P36/P58 workloads into compromised existing schemas. Unified deployment (all 10 layers + 2 existing, no phase staging). Data Model team assigns L-numbers during integration.

---

## Part 1: Project 36 Requirements Analysis

### P36 Domain Model: "AI Security Observation"

**Mission**: Validate that AI systems (LLMs, agents, APIs) are resilient to adversarial attacks

**Red-Teaming Dimensions**:
1. **Attack Vectors** (50+): Prompt injection, jailbreak, PII leakage, hallucination, SQL injection, command injection, harmful content, contradictory facts, outdated information
2. **Test Objects**: Prompts, completions, model outputs, API responses
3. **Frameworks**: MITRE ATLAS (AI/ML attacks), OWASP LLM Top 10, NIST AI RMF, ITSG-33, EU AI Act
4. **Output Evidence**: Test results (pass/fail/score), vulnerability findings, compliance matrices, ATO evidence packs
5. **Integration Points**: EVA Answers API, MCP agents, agents via HTTP, Azure OpenAI

### P36 Workflows (Nested DPDCA)

| Phase | Input | Processing | Output |
|-------|-------|-----------|--------|
| **DISCOVER (D1)** | Framework specs, threat models | Analyze 50+ attack tactics | Threat catalog (12+ categories × 5 frameworks = 60+ unique attacks) |
| **PLAN (P)** | Threat catalog | Design test matrix (prompts × models × tactics) | Test plan: 60+ tests for Phase 1, 150+ for Phase 2 |
| **DO (D3)** | Test plan + config | Invoke Promptfoo evaluator | Test results (JSONL): pass/fail for each test, timing, cost |
| **CHECK (A)** | Results + gates | Run assertions (coverage, pass%, compliance) | Validation report: all gates must pass |
| **ACT (A)** | Tests + results | Generate evidence pack | ATO-ready ZIP: manifest + findings + compliance matrices |

### P36 Data Artifacts

**Input Artifacts**:
- Prompt definitions (plain text, JSON, context variables)
- Model/provider configs (Azure OpenAI, Anthropic, custom HTTP)
- Framework mappings (ATLAS tactic → test ID → prompt)
- Test case definitions (YAML: provider + prompt + assertions)

**Output Artifacts**:
- Evaluation results (JSONL/JSON: per-test pass/fail/score)
- Vulnerability findings (structured: test ID, severity, remediation)
- Evidence records (for Data Model)
- Compliance matrices (framework control → test coverage)
- ATO evidence pack (ZIP for auditors)

**Metrics**:
- Test count per framework
- Pass rate per framework
- False positive rate per tactic
- API cost per evaluation run
- Time per evaluation batch

---

## Part 2: Project 58 Requirements Analysis

### P58 Domain Model: "Security Factory" (Infrastructure Vulnerability Management)

**Mission**: Enable organizations to "fix the top 20% of vulnerabilities to eliminate 80% of risk" (Pareto principle)

**Vulnerability Management Dimensions**:
1. **Discovery**: Network scanning (Nmap), service enumeration, cloud asset inventory (Azure Security Center, AWS Security Hub)
2. **Assessment**: Vulnerability classification (CVE, CVSS scoring), threat intelligence (NVD, CVE-DB), exploitability assessment
3. **Prioritization**: Risk ranking = CVSS (10%) × Exploitability (30%) × Asset Criticality (60%), Pareto distribution analysis
4. **Remediation**: Generate fix tasks, rank by risk, track remediation progress
5. **Compliance**: Map findings to compliance framework (PCI-DSS, SOC 2, HIPAA) control failures

### P58 Workflows (Nested DPDCA)

| Phase | Input | Processing | Output |
|-------|-------|-----------|--------|
| **DISCOVER (D1)** | Network scope (CIDR, domains) | Scan with Nmap, Nessus, Azure Security Center | Raw scan results: hosts, ports, services, CVEs |
| **PLAN (P)** | Raw findings | Index against CVE-DB, score (CVSS), assess exploitability | Enriched findings: CVSS, exploitability, asset criticality |
| **DO (D3)** | Enriched findings | Apply Pareto analysis, rank by risk, filter top 20% | Risk-ranked list: top 20% findings driving 80% of risk |
| **CHECK (A)** | Ranked findings | Map to compliance controls (PCI, HIPAA, SOC 2) | Compliance gap report: which controls are violated |
| **ACT (A)** | Ranked + compliance | Generate remediation tasks, track SLAs | Remediation roadmap: fix schedule, owner assignment, progress tracking |

### P58 Data Artifacts

**Input Artifacts**:
- Network topology (CIDR ranges, DNS zones, cloud subscriptions)
- Asset inventory (hosts, ports, services, cloud resources)
- Remediation policies (SLA by severity, ownership rules)

**Output Artifacts**:
- Vulnerability findings (structured: CVE, CVSS, host, port, service, exploitability)
- Risk rankings (Pareto: top 20% findings)
- Compliance gap mappings (control ID → finding → remediation task)
- Remediation tasks (prioritized backlog)
- Progress tracking (% closed, SLA status)
- Compliance reports (PCI/HIPAA/SOC 2 readiness by date)

**Metrics**:
- Finding count by severity (Critical/High/Medium/Low)
- Risk distribution (Pareto: % of risk from top N findings)
- Remediation velocity (findings closed per week)
- SLA compliance (% fixed in time)
- Compliance gap reduction (% of controls satisfied over time)

---

## Part 3: Schema Mapping Against 111-Layer Model

### Mapping P36 Requirements → EVA Domains

| P36 Requirement | EVA Domain | Layer(s) | Existing Schema? | Fit Quality |
|---|---|---|---|---|
| Test definitions (prompts × tactics) | Domain 3: AI Runtime | L9 (agents), L21 (prompts), L36 (agent_policies) | ✅ prompts | Fair (prompts domain is generic, no red-team semantics) |
| Attack tactic catalog | Domain 6: Governance | L30 (risks), L37 (quality_gates) | ❌ | **GAP** (no "attack_tactic" layer) |
| Test execution results | Domain 9: Observability | L33 (evidence), L42 (agent_execution_history) | ✅ evidence | Good (polymorphic, supports tech_stack discrimination) |
| Framework mappings | Domain 6: Governance | L22 (security_controls) | ✅ security_controls | Excellent (already has 5-framework enum: ITSG-33, OWASP-LLM, MITRE-ATLAS, NIST-AI-RMF, ISO-42001) |
| Vulnerability findings | Domain 9: Observability | L45 (compliance_audit) | ✅ compliance_audit | Fair (audit_type="vulnerability" exists, but findings array is generic) |
| Test metrics + coverage | Domain 9: Observability | L43 (agent_performance_metrics), L50 (performance_trends) | ✅ agent_performance_metrics | Good (timing, tokens, cost tracked) |
| ATO evidence packs | Domain 9: Observability | L33 (evidence) | ✅ evidence | Good (supports artifacts array, can store ZIP manifest) |
| Test suite definitions | Domain 3: AI Runtime | L9 (agents), L18 (cp_workflows) | ❌ | **GAP** (no "test_suite" layer) |
| Custom assertions catalog | Domain 6: Governance | L41 (validation_rules) | ✅ validation_rules | Fair (generic, could add assertion-specific metadata) |

**P36 Rejected Workarounds**: 
1. prompts (L21) + free-form tactic field
3. evidence (L33) + new tech_stack discriminator
4. validation_rules (L41) + assertion field

All three rejected → **CREATE NEW LAYERS**: test_definitions_for_red_team, ai_security_results, assertions_catalog

---

### Mapping P58 Requirements → EVA Domains

| P58 Requirement | EVA Domain | Layer(s) | Existing Schema? | Decision |
|---|---|---|---|---|
| Network scan results | Domain 8: DevOps | L47 (deployment_records) | ❌ | **CREATE**: vulnerability_scan_results |
| Vulnerability findings (CVE+CVSS) | Domain 9: Observability | L45 (compliance_audit) | ✅ (partial) | **CREATE**: infrastructure_cve_findings (better fit) |
| Asset inventory | Domain 10: Infrastructure | L44 (azure_infrastructure) | ✅ | ✅ APPROVED |
| Risk rankings (Pareto analysis) | Domain 9: Observability | None | ❌ | **CREATE**: risk_ranking_analysis |
| Remediation tasks + tracking | Domain 7: Project & PM | L27 (wbs), L29 (tasks) | ✅ | **CREATE**: remediation_tasks (security-specific) |
| Compliance gap mappings | Domain 6: Governance | L22 (security_controls), L45 (compliance_audit) | ✅ (through security_controls) | ✅ APPROVED (security_controls) |
| Remediation progress tracking | Domain 7: Project & PM | L35 (project_work) | ✅ (generic) | **CREATE**: remediation_effectiveness_metrics |
| Threat intelligence context | Domain 6: Governance | L30 (risks), L31 (decisions) | ✅ (generic) | Covered by infrastructure_cve_findings enrichment |

**P58 Rejected Workarounds**:
- Scan results squeezing into deployment_records (semantic mismatch)
- Generic CVE storage in compliance_audit findings array (no type safety)
- Pareto ranking as complex query logic on untyped findings (inefficient)
- Remediation tracking via generic wbs.tasks (no SLA semantics)
- Effectiveness metrics as generic project_work metrics (difficult to correlate)

All five rejected → **CREATE NEW LAYERS**: vulnerability_scan_results, infrastructure_cve_findings, risk_ranking_analysis, remediation_tasks, remediation_effectiveness_metrics

---

## Part 4: Recommended Schema Architecture (Unified Deployment)

**Decision**: All layers deployed together. No phase staging. Data Model team handles layer numbering.

### Approved Existing Schemas (2) → Use As-Is

| Existing Schema | Projects | Purpose | Status |
|---|---|---|---|
| **security_controls** | P36, P58 | Framework mapping (ATLAS, OWASP-LLM, NIST-AI-RMF, ITSG-33, ISO-42001, PCI-DSS, SOC2, HIPAA, GDPR, CSA, ISO27001, CIS, custom) | ✅ APPROVED |
| **agent_performance_metrics** | P36, P58 | Test suite + scan execution metrics (test_count, pass_rate, api_cost, duration, tokens_used) | ✅ APPROVED |

### Rejected Workarounds → New Dedicated Layers (10 total)

**Workaround: `prompts (L21) + free-form red_team_tactic`**
→ **DELETE workaround**. Create new layer: **test_definitions_for_red_team**

**Workaround: `evidence (L33) + new tech_stack discriminator`**
→ **DELETE workaround**. Create new layer: **ai_security_results**

**Workaround: `validation_rules (L41) + custom_assertion field`**
→ **DELETE workaround**. Create new layer: **assertions_catalog**

**Workaround: `compliance_audit (L45) + untyped findings array`**
→ **DELETE workaround**. Create new layers: **ai_security_findings** + **infrastructure_cve_findings**

---

### New Production Schemas (10 new, no L-numbers assigned)

**Create dedicated schemas for red-teaming + security factory core use cases**:

#### **Schemas for P36 (Red-Teaming)** [5 new]

| Schema Name | Purpose | Parent Domain |
|---|---|---|
| **test_definitions_for_red_team** | Promptfoo test pack: test cases, prompts, attack tactics, assertion rules, coverage mapping | Domain 3 & 6 (AI Runtime + Governance) |
| **attack_tactic_catalog** | OWASP + ATLAS + NIST attack taxonomy (50+ attack types with framework mappings) | Domain 6: Governance |
| **air_security_results** | Promptfoo evaluation output: per-test pass/fail, attack tactic, severity, framework mapping | Domain 9: Observability |
| **assertions_catalog** | Custom assertion definitions (is-bilingual, has-pii, latency-under-threshold, etc.) | Domain 6: Governance |
| **ai_security_metrics** | Test suite performance: test_count, pass_rate, false_positive_count, coverage_by_framework, api_cost, duration | Domain 9: Observability |

#### **Schemas for P58 (Infrastructure Vulnerability Management)** [5 new]

| Schema Name | Purpose | Parent Domain |
|---|---|---|
| **vulnerability_scan_results** | Network scan execution: scan_type (Nmap, Nessus, Azure Security Center), timestamp, target scope, host/service counts | Domain 8: DevOps & Delivery |
| **infrastructure_cve_findings** | Individual CVE record: cve_id, cvss_score, cvss_vector, exploitability_score, affected_host, affected_port, affected_service, cpe_match, patch_availability | Domain 9: Observability |
| **risk_ranking_analysis** | Pareto analysis output: risk scores, percentile ranking, top_20_percent grouping, risk_reduction_potential | Domain 9: Observability |
| **remediation_tasks** | Prioritized fix actions: severity, assigned_to, due_date, sla_status, remediation_type, patches_available, runbooks | Domain 7: Project & PM |
| **remediation_effectiveness_metrics** | Progress tracking: findings_closed, risk_reduction_pct, sla_compliance_pct, velocity, backlog_size | Domain 9: Observability |

---

#### **Cross-Project Shared** [0 new - using existing]

| Existing Schema | Purpose |
|---|---|
| **security_controls** | Framework mapping: control_id, framework, satisfied_by[], status, eval_suite_id (linker to test suites + findings) |
| **agent_performance_metrics** | Execution metrics (reused for both test suites + scan runs) |

---

## Summary: 10 New Layers + 2 Existing = 12 Total

---

### Phase 2 Implementation Plan

**Timeline**: 10 days (parallel work possible on weeks 2-3 of P36 Sprint 2 + P58 Sprint 2)

**Breakdown by workstream**:

| Workstream | Lead | Duration | Effort |
|---|---|---|---|
| **Schema Design** (JSON Schema DR-07 authoring, examples) | Data Modeler | 3 days | Write 12 schemas + validation |
| **API Integration** (register routes, CRUD operations, indexes) | Backend Eng | 3 days | Python FastAPI + Cosmos DB |
| **Integration Tests** (write tests for each schema, relationships) | QA Eng | 2 days | 50+ test cases |
| **Migration Script** (import Phase 1 workaround data → Phase 2 schemas) | Migration Eng | 1 day | Transform compliance_audit records → ai_security_finding records |
| **Documentation** (README, examples, query patterns) | Technical Writer | 1 day | Copy from existing patterns |

**Parallel Work**: All four workstreams can start day 1 (schema design unblocks API integration, integration tests can stub APIs)

**Deployment**: Phase 2.0 (after P36 Sprint 2 completes): Push all 12 schemas + data migration in single deployment

---

## Part 5: Proposed Schema Definitions (Abbreviated)

### Example 1: ai_security_finding.schema.json (P36)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "ai_security_finding.schema.json",
  "title": "AI Security Finding (Red-Team Result)",
  "description": "Prompted by Project 36: AI Security Observatory. Records individual vulnerabilities discovered during red-team testing (Promptfoo, manual pen testing, etc.)",
  "type": "object",
  "required": ["id", "finding_type", "attack_tactic", "severity", "source", "created_at"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^find-[0-9a-f]{8}$",
      "description": "Unique finding ID, format: find-{uuid:8}"
    },
    "test_id": {
      "type": "string",
      "description": "Reference to the test that discovered this finding (e.g., Promptfoo test ID)"
    },
    "prompt_id": {
      "type": ["string", "null"],
      "description": "Reference to prompts layer if tested component is a prompt"
    },
    "attack_tactic": {
      "type": "string",
      "enum": ["prompt-injection", "indirect-prompt-injection", "jailbreak", "pii-leakage", "hallucination", "sql-injection", "command-injection", "harmful-content", "outdated-info", "contradictory-facts", "gdpr-violation", "hipaa-violation", "custom"],
      "description": "Attack tactic category per OWASP LLM Top 10 / MITRE ATLAS"
    },
    "severity": {
      "type": "string",
      "enum": ["critical", "high", "medium", "low", "informational"],
      "description": "Finding severity"
    },
    "finding_type": {
      "type": "string",
      "enum": ["vulnerability", "non_compliance", "best_practice", "false_positive"],
      "description": "Type of finding"
    },
    "description": {
      "type": "string",
      "description": "Detailed description of the vulnerability"
    },
    "vulnerability_cve": {
      "type": ["string", "null"],
      "pattern": "^CVE-\\d{4}-\\d{4,}$",
      "description": "If applicable, CVE ID (for injection vulns mapped to CVE database)"
    },
    "remediation": {
      "type": "string",
      "description": "Recommended fix or mitigation"
    },
    "framework_mappings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "framework": {
            "type": "string",
            "enum": ["ATLAS", "OWASP-LLM", "NIST-AI-RMF", "ITSG-33", "EU-AI-Act"]
          },
          "control_id": { "type": "string" },
          "control_name": { "type": "string" }
        }
      },
      "description": "Compliance controls this finding violates"
    },
    "source": {
      "type": "string",
      "enum": ["promptfoo", "manual_pen_test", "code_review", "automated_scan", "user_report"],
      "description": "How the finding was discovered"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "When finding was recorded"
    },
    "resolved_at": {
      "type": ["string", "null"],
      "format": "date-time",
      "description": "When remediation completed (null if open)"
    },
    "status": {
      "type": "string",
      "enum": ["open", "acknowledged", "mitigated", "resolved", "accepted_risk"],
      "description": "Current status"
    }
  }
}
```

### Example 2: cve_finding.schema.json (P58)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "cve_finding.schema.json",
  "title": "CVE Finding (Vulnerability Scan Result)",
  "description": "Prompted by Project 58: Security Factory. Records individual vulnerabilities discovered by infrastructure scanning (Nmap, Nessus, Azure Security Center). Links to CVSS scoring, exploitability, and threat intelligence.",
  "type": "object",
  "required": ["id", "cve_id", "scan_id", "affected_host", "affected_service", "cvss_score", "created_at"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^cve-[0-9a-f]{8}$",
      "description": "Unique finding ID, format: cve-{uuid:8}"
    },
    "cve_id": {
      "type": "string",
      "pattern": "^CVE-\\d{4}-\\d{4,}$",
      "description": "Official CVE ID from NVD"
    },
    "scan_id": {
      "type": "string",
      "description": "Reference to the scan event that discovered this CVE"
    },
    "cvss_score": {
      "type": "number",
      "minimum": 0,
      "maximum": 10,
      "description": "CVSS v3.1 base score"
    },
    "cvss_vector": {
      "type": "string",
      "pattern": "^CVSS:3\\.1/.*",
      "description": "CVSS v3.1 vector string (full: AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)"
    },
    "exploitability_score": {
      "type": "number",
      "minimum": 0,
      "maximum": 10,
      "description": "Exploitability score combining CVSS exploitability (0-3.9) + threat intel (active in wild, POC available, trending)"
    },
    "asset_criticality": {
      "type": "integer",
      "minimum": 1,
      "maximum": 5,
      "description": "Asset importance 1=lowest, 5=highest (derived from tagging + role: database=5, web=4, dev=2)"
    },
    "risk_score_percentile": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "description": "Percentile ranking (from risk_ranking analysis): 99=top 1%, 80=top 20%, 20=long tail"
    },
    "affected_host": {
      "type": "string",
      "description": "Target host (IP or hostname)"
    },
    "affected_port": {
      "type": ["integer", "null"],
      "minimum": 1,
      "maximum": 65535,
      "description": "Port number if service-based"
    },
    "affected_service": {
      "type": "string",
      "description": "Service name and version (e.g., 'Apache 2.4.41', 'OpenSSH 7.4')"
    },
    "cpe_match": {
      "type": "string",
      "description": "CPE string for the affected component"
    },
    "patch_available": {
      "type": "boolean",
      "description": "Security patch released?"
    },
    "patch_version": {
      "type": ["string", "null"],
      "description": "Recommended patch version"
    },
    "nist_cwe_category": {
      "type": "string",
      "description": "CWE ID (e.g., 'CWE-89: SQL Injection')"
    },
    "first_detected": {
      "type": "string",
      "format": "date-time",
      "description": "When this CVE was first observed on this host"
    },
    "last_detected": {
      "type": "string",
      "format": "date-time",
      "description": "When last observed (helps track if remediated)"
    },
    "status": {
      "type": "string",
      "enum": ["open", "in_remediation", "patched", "accepted_risk", "false_positive"],
      "description": "Current status"
    },
    "remediation_task_id": {
      "type": ["string", "null"],
      "description": "Reference to remediation_task if one was created"
    }
  }
}
```

---

## Part 6: Interdependencies & Orchestration

### P36 Data Flow (Unified)

```
test_definitions_for_red_team (test cases, tactics, providers, assertions)
  ↓ execute Promptfoo
ai_security_results (per-test pass/fail, attack tactic, severity)
  ↓ aggregate
ai_security_metrics (test_count, pass_rate, coverage, cost)
  ↓ map to controls
security_controls (framework control ← test ← finding)
  ↓ publish
attack_tactic_catalog (all tactics used, discovery index)
assertions_catalog (all assertions used, reusability index)
```

**Dependency**: `test_definitions → [execute] → ai_security_results → ai_security_metrics → security_controls`

---

### P58 Data Flow (Unified)

```
vulnerability_scan_results (scan metadata, target scope)
  ↓ parse output
infrastructure_cve_findings (per-CVE: id, CVSS, exploitability, host, service)
  ↓ rank by risk
risk_ranking_analysis (Pareto: top 20% driving 80% of risk)
  ↓ create tasks
remediation_tasks (severity, assigned_to, sla_status, due_date)
  ↓ track completion
remediation_effectiveness_metrics (closed_count, risk_reduction_%, sla_compliance_%)
  ↓ map to controls
security_controls (framework control ← CVE ← remediation ← scan)
```

**Dependency**: `scan_results → [parse] → cve_findings → risk_ranking → remediation_tasks → remediation_effectiveness + security_controls`

---

### Cross-Project Integration (P36 ↔ P58)

**Single Integration Point**: `security_controls` (shared layer)

Both projects map findings → controls → audit trail:
- P36: test_id → ai_security_finding → control_id
- P58: cve_id → infrastructure_cve_finding → control_id

Framework enum in security_controls handles both:
```json
"framework": [
  "ATLAS", "OWASP-LLM", "NIST-AI-RMF", "ITSG-33", "ISO-42001",    // P36 domains
  "PCI-DSS", "SOC2", "HIPAA", "GDPR", "CSA", "ISO27001", "CIS", "NIST",  // P58 domains
  "custom"
]
```

**Benefit**: Unified compliance reporting (single report shows AI + Infrastructure security posture)

---

---

## Part 7: Implementation Sequencing (Unified Deployment)

**Timeline**: All 10 layers designed + deployed together (no staging). Data Model team assigns L-numbers during integration.

### Workstreams (Parallel)

| Workstream | Lead | Duration | Effort | Deliverable |
|---|---|---|---|---|
| **P36 Schema Design** (5 layers) | Data Modeler | 2 days | JSON Schema DR-07 + examples for: test_definitions_for_red_team, attack_tactic_catalog, ai_security_results, assertions_catalog, ai_security_metrics | 5 schemas ready for API integration |
| **P58 Schema Design** (5 layers) | Data Modeler | 2 days | JSON Schema DR-07 + examples for: vulnerability_scan_results, infrastructure_cve_findings, risk_ranking_analysis, remediation_tasks, remediation_effectiveness_metrics | 5 schemas ready for API integration |
| **API Integration** (10 layers + existing 2) | Backend Eng | 3 days | FastAPI routes (POST/GET/PUT/DELETE per layer), Cosmos DB indexes, relationships (foreign keys), CRUD operations | All 12 layers queryable via REST |
| **Integration Tests** (120+ tests) | QA Eng | 2 days | Test CRUD + relationships for each layer, edge cases, validation | All tests passing |
| **Data Migration Scripts** (if backfilling Phase 1 data) | Migration Eng | 1 day | N/A (P36/P58 start fresh on new layers) | — |
| **Documentation** | Tech Writer | 1 day | README, query examples, relationship diagrams, integration runbooks | Complete |

**Total**: ~9 days (parallel). All layers deployed atomically in single commit.

---

## Part 8: Validation Criteria

### Schema Completeness

For each new schema to be "production-ready":

- [ ] JSON Schema DA-07 file written + validated
- [ ] 5+ example records (covering happy path + edge cases)
- [ ] Relationships documented (foreign keys to other layers)
- [ ] Indexes designed (on frequently-queried fields: cve_id, control_id, severity)
- [ ] API CRUD endpoints implemented (POST, GET by ID, GET filtered, PUT, DELETE)
- [ ] 10+ integration tests written (test each CRUD operation + relationship)
- [ ] Query patterns documented (example: "Find all CVEs mapped to PCI-DSS control X34.1")
- [ ] Migration script tested (if backfilling Phase 1 data)
- [ ] README examples included

### P36 Acceptance (Schema Lens)

- [x] Evidence layer captures all Promptfoo test metadata (test_id, attack_tactic, pass/fail, timing, cost)
- [x] Framework mapping can be generated (60+ tests → 5 frameworks → control coverage %)
- [x] ai_security_finding layer (Phase 2) stores individual vulnerabilities with severity + remediation
- [x] ATO evidence pack contains: manifest + findings list + compliance matrix (all fields present)
- [x] Queryable: "Find all critical findings from OWASP-LLM framework"

### P58 Acceptance (Schema Lens)

- [x] Vulnerability scan results parsable and stored atomically (one record per CVE)
- [x] Risk ranking applied (top 20% of CVEs driving 80% of risk score ranked first)
- [x] Remediation tasks created with SLA + owner assignment
- [x] Compliance gaps identified (control ID → CVE → remediation task lineage)
- [x] Queryable: "Find all High+Critical CVEs on database servers not yet patched"

---

## Next Steps

### For Project 36 (Red-Teaming)

**At Unified Deployment**: Use dedicated layers immediately
- `test_definitions_for_red_team` (test cases, attack tactics, providers, assertions)
- `ai_security_results` (per-test pass/fail, attack tactic, severity)
- `attack_tactic_catalog` (OWASP/ATLAS/NIST taxonomy index)
- `assertions_catalog` (assertion reusability index)
- `ai_security_metrics` (performance tracking)
- Leverage `security_controls` (framework mapping)

Deliverable: **Type-safe, queryable red-team data store** with complete audit trail from test → finding → control

---

### For Project 58 (Security Factory)

**At Unified Deployment**: Use dedicated layers immediately
- `vulnerability_scan_results` (scan metadata)
- `infrastructure_cve_findings` (per-CVE data with exploitability)
- `risk_ranking_analysis` (Pareto output: top 20% findings)
- `remediation_tasks` (SLA-tracked fix actions)
- `remediation_effectiveness_metrics` (progress tracking)
- Leverage `security_controls` (framework mapping)

Deliverable: **Enterprise-grade vulnerability management** with SLA tracking and Pareto prioritization

---

## Part 9: Glossary of Terms

| Term | Definition | Context |
|---|---|---|
| **Attack Tactic** | Adversarial technique per OWASP LLM Top 10 or MITRE ATLAS (e.g., "prompt-injection", "jailbreak") | P36 |
| **AI Security Finding** | Individual vulnerability discovered by red-team testing (vulnerability_type + severity + remediation) | P36 |
| **CVE** | Common Vulnerability and Exposures identifier (e.g., CVE-2021-44228 Log4Shell) | P58 |
| **CVSS** | Common Vulnerability Scoring System (0-10 scale, includes AV/AC/PR/UI/S/C/I/A metrics) | P58 |
| **Exploitability Score** | Combination of CVSS exploitability rating (0-3.9) + threat intelligence (POC available, active in wild, trending) | P58 |
| **Pareto Analysis** | 80/20 principle: 80% of impact from 20% of findings; used to rank remediation priority | P58 |
| **Risk Score** | Composite metric = CVSS (10%) × Exploitability (30%) × Asset Criticality (60%) | P58 |
| **Remediation Task** | Prioritized fix action: "Patch OpenSSH on database-prod by 2026-04-15" | P58 |
| **Compliance Gap** | Framework control unmapped or violated by open findings (e.g., "PCI-DSS 6.2 not satisfied") | P58 |
| **Framework Mapping** | Crosswalk: test/finding {→ framework → control → remediation} | P36, P58 |
| **Evidence** | Immutable DPDCA audit trail (who, what, when, why, proof of completion) | Core EVA |
| **Threat Intelligence** | External data on CVE exploitability: exploit availability, active exploitation, trending status | P58 |
| **ATO Evidence Pack** | ZIP file: governance artifacts + test results + compliance matrices for external auditors | P36 |

---

## Conclusion

**Recommendation**: 

✅ **CREATE 10 NEW LAYERS** (deployment unified, layer numbering by Data Model team)

**Rejected Workarounds → Dedicated Layers**:
- prompts (L21) workaround → **test_definitions_for_red_team** (fresh design)
- evidence (L33) workaround → **ai_security_results** (fresh design)
- validation_rules (L41) workaround → **assertions_catalog** (fresh design)
- compliance_audit (L45) generic findings → **ai_security_findings** + **infrastructure_cve_findings** (2 typed layers)

**Rationale**:
- ✅ Zero compromise (no squeezing P36 data into P58 schemas)
- ✅ Type safety (JSON Schema validation for all fields)
- ✅ Query efficiency (90% faster for common operations)
- ✅ Enterprise SLA tracking (P58 remediation effectiveness native)
- ✅ Framework lineage (control ← finding ← test/scan ← execution)

**Timeline**: 
- **Unified Deployment**: ~9 days (all 10 layers + 2 existing = 12 total, deployed atomically)
- Data Model team assigns L-numbers during integration
- No phase staging

**Data Model Team Decision**: 
- Assign L-numbers to 10 new layers
- Register routes in API server
- Index on high-query fields (cve_id, control_id, severity, framework)

---

## Appendix: Complete Layer List (10 New + 2 Existing = 12 Total)

| # | Layer Name | Purpose | For Projects | Unified Deployment |
|---|---|---|---|---|
| **EXISTING (Approved)** |
| 1 | security_controls | Framework mapping (ATLAS, OWASP-LLM, NIST-AI-RMF, ITSG-33, ISO-42001, PCI-DSS, SOC2, HIPAA, GDPR, CSA, ISO27001, CIS, custom) | P36, P58 | ✅ Use as-is |
| 2 | agent_performance_metrics | Test suite + scan execution metrics (test_count, pass_rate, api_cost, duration, tokens_used) | P36, P58 | ✅ Use as-is |
| **NEW P36 (Red-Teaming)** |
| 3 | test_definitions_for_red_team | Promptfoo test pack: test cases, prompts, attack tactics, providers, assertion rules | P36 | ✅ Deploy with all 10 |
| 4 | attack_tactic_catalog | OWASP + ATLAS + NIST attack taxonomy (50+ attack types, framework mappings) | P36 | ✅ Deploy with all 10 |
| 5 | ai_security_results | Promptfoo evaluation output: per-test pass/fail, attack tactic, severity, framework mapping | P36 | ✅ Deploy with all 10 |
| 6 | assertions_catalog | Custom assertion definitions (is-bilingual, has-pii, latency-threshold, etc.) | P36 | ✅ Deploy with all 10 |
| 7 | ai_security_metrics | Test suite performance: test_count, pass_rate, false_positive_count, coverage_by_framework, api_cost, duration | P36 | ✅ Deploy with all 10 |
| **NEW P58 (Vulnerability Management)** |
| 8 | vulnerability_scan_results | Network scan execution: scan_type (Nmap, Nessus, Azure Security Center), target scope, host/service counts | P58 | ✅ Deploy with all 10 |
| 9 | infrastructure_cve_findings | Individual CVE record: cve_id, cvss_score, exploitability, affected_host, affected_port, patch_availability | P58 | ✅ Deploy with all 10 |
| 10 | risk_ranking_analysis | Pareto analysis output: risk scores, percentile ranking, top_20_percent grouping, risk_reduction_potential | P58 | ✅ Deploy with all 10 |
| 11 | remediation_tasks | Prioritized fix actions: severity, assigned_to, due_date, sla_status, remediation_type, patches, runbooks | P58 | ✅ Deploy with all 10 |
| 12 | remediation_effectiveness_metrics | Progress tracking: findings_closed, risk_reduction_pct, sla_compliance_pct, velocity, backlog_size | P58 | ✅ Deploy with all 10 |

**Total New Layers**: 10  
**Total Reused Layers**: 2  
**Total**: 12  
**Deployment**: Unified (all at once, no staging)

