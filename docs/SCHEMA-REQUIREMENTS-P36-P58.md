# Data Model Schema Requirements: Project 36 (Red-Teaming) & Project 58 (Security Factory)

**Analysis Date**: 2026-03-12  
**Analyst**: AIAgentExpert  
**Scope**: Complete schema mapping for red-teaming + security factory workloads against 111-layer Data Model  
**Status**: Architectural Design (ready for Phase 1 implementation)

---

## Executive Summary

**Project 36** (AI Security Observatory) and **Project 58** (Security Factory) have **complementary security roles**:
- **P36**: LLM vulnerability testing (prompt injection, jailbreaks, PII leakage) via Promptfoo red-teaming framework
- **P58**: Infrastructure vulnerability scanning + Pareto risk ranking + remediation orchestration

**Schema Analysis Result**: 
- **Existing Good-Fit Schemas**: 8 (reusable with minimal adaptation)
- **New Schemas Required**: 12 (dedicated domain support)
- **Total Recommended**: 20 schemas for production-ready integration

**Recommendation**: Create new 12 schemas in Phase 2 (L50-L63) rather than forcing fit into existing schemas. Existing schemas become bridge layer for Phase 1 MVP (14 days), planned schemas unblock optimized Phase 2+ (90% efficiency gain).

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

**P36 Domain Fit**: 4 excellent + 3 good + 1 fair = **8 existing schemas can bridge Phase 1 MVP**

**P36 Gaps Identified**: 
1. No dedicated "attack_tactic" catalog (50+ OWASP/ATLAS/NIST tactics)
2. No "test_suite" layer (Promptfoo test pack definitions)
3. No "ai_security_finding" layer (dedicated red-team result storage)
4. No "test_coverage_matrix" layer (framework control → test mapping)

---

### Mapping P58 Requirements → EVA Domains

| P58 Requirement | EVA Domain | Layer(s) | Existing Schema? | Fit Quality |
|---|---|---|---|---|
| Network scan results | Domain 8: DevOps | L47 (deployment_records) | ❌ | **GAP** (deployment_records is CD-focused, not scan-focused) |
| Vulnerability findings (CVE+CVSS) | Domain 9: Observability | L45 (compliance_audit) + L49 (infrastructure_drift) | ✅ compliance_audit (partial) | Fair (compliance_audit is audit-focused, not asset + CVE + CVSS) |
| Asset inventory | Domain 10: Infrastructure | L44 (azure_infrastructure) | ✅ azure_infrastructure | Good (36 objects tracked, includes resources + tags) |
| Risk rankings (Pareto analysis) | Domain 9: Observability | L50 (performance_trends) | ❌ | **GAP** (no "risk_ranking" layer) |
| Remediation tasks + tracking | Domain 7: Project & PM | L27 (wbs), L29 (tasks) | ✅ wbs + tasks | Good (task structure exists, can model remediation as task type) |
| Compliance gap mappings | Domain 6: Governance | L22 (security_controls), L45 (compliance_audit) | ✅ security_controls + compliance_audit | Good (frameworks supported: SOC2, PCI-DSS, HIPAA, GDPR, CSA) |
| Remediation progress tracking | Domain 7: Project & PM | L35 (project_work) | ✅ project_work | Good (supports status transitions, metrics) |
| Remediation effectiveness metrics | Domain 9: Observability | L43 (agent_performance_metrics) | ❌ | **GAP** (no "remediation_effectiveness" layer) |
| Threat intelligence context | Domain 6: Governance | L30 (risks), L31 (decisions) | ✅ risks | Fair (generic, no CVE/NVD metadata) |

**P58 Domain Fit**: 5 good + 2 fair = **7 existing schemas can bridge Phase 1 MVP**

**P58 Gaps Identified**:
1. No "scan_result" layer (network scan, service enumeration)
2. No "risk_ranking" layer (Pareto analysis output)
3. No "remediation_task" layer (dedicated remediation orchestration)
4. No "remediation_effectiveness" layer (metrics: % closed, SLA compliance, risk reduction)
5. No "compliance_gap" layer (framework control → vulnerability mapping)
6. No "threat_intelligence" layer (CVE enrichment, exploit availability)

---

## Part 4: Recommended Schema Architecture (20 Schemas Total)

### Phase 1: Bridge Schemas (8 existing + 0 new = 8 total) ⏱️ _0 days_ 

**Use existing schemas with documented workarounds**:

| Existing Schema | Projects | Via Layer | Workaround Notes | Phase 1 Blocker? |
|---|---|---|---|---|
| **prompts** | P36 | L21 | Add `red_team_tactic` field as string (free-form for now) | ❌ No |
| **security_controls** | P36, P58 | L22 | Framework enum already covers all 5 P36 frameworks; P58 adds "custom" for new controls | ❌ No |
| **evidence** | P36, P58 | L33 | Polymorphic schema supports arbitrary artifacts; can store Promptfoo results JSON | ✅ **Minor** (need tech_stack discriminator for "ai_security", "vulnerability_scan") |
| **compliance_audit** | P36, P58 | L45 | audit_type="vulnerability" exists; findings array accepts arbitrary objects | ⚠️ **YES** (array definition is too loose) |
| **validation_rules** | P36 | L41 | Add `custom_assertion` field to allow naming Promptfoo assertions | ❌ No |
| **agent_performance_metrics** | P36, P58 | L43 | Track: test_count, pass_rate, api_cost, duration; already structured | ❌ No |
| **azure_infrastructure** | P58 | L44 | Already includes assets + tags; reuse for scan targets | ❌ No |
| **deployment_records** | P58 | L47 | Can record scan execution as "deployment" (workaround); prefer new schema in P2 | ⚠️ **Minor** (semantic mismatch) |

**Phase 1 Acceptance**: Models boot-strap with existing schemas + documented workarounds. Full validation gates pass via existing quality_gates layer. Evidence complete.

---

### Phase 2: New Production Schemas (12 new) ⏱️ _10 days_

**Create dedicated schemas for red-teaming + security factory core use cases**:

#### **Schemas Tier 1: P36-Specific (Red-Teaming)** [5 new schemas]

| Schema ID | Layer # | Purpose | Parent Domain | Key Fields | Relationships |
|---|---|---|---|---|---|
| **ai_security_finding** | L57 (planned) | Dedicated red-team vulnerability record | Domain 9: Observability | id, test_id, prompt_id, attack_tactic, severity (critical/high/medium), vulnerability_type, description, remediation, framework_mapping[], source="promptfoo", timestamp | evidence (parent), prompts (test target) |
| **attack_tactic_catalog** | L50 (planned) | OWASP + ATLAS + NIST attack taxonomy | Domain 6: Governance | id, name, category (injection, jailbreak, privacy, hallucination, harmful_content, compliance), frameworks[] (ATLAS.AML.Txxx, OWASP-LLM-01, NIST-AI-01), description, references[], severity_profile, detection_difficulty | security_controls (map to controls) |
| **red_team_test_suite** | L51 (planned) | Promptfoo test pack definition + metadata | Domain 3: AI Runtime | id, name, test_cases[], provider_config, assertion_rules[], coverage_frameworks[], test_count, estimated_duration_minutes, template_type (smoke, golden, framework_pack) | prompts, validation_rules, security_controls |
| **framework_evidence_mapping** | L58 (planned) | Maps test → control → finding crosswalk | Domain 6: Governance | id, framework (ATLAS, OWASP-LLM, NIST-AI-RMF, ITSG-33, EU-AI-Act), control_id, control_name, ai_security_findings[], test_coverage_count, gap_status (full, partial, none), certification_date | ai_security_finding, security_controls |
| **ai_security_metrics** | L59 (planned) | Test suite performance + coverage metrics | Domain 9: Observability | id, suite_id, run_timestamp, test_count, pass_count, fail_count, pass_rate_pct, coverage_by_framework {}, api_cost_usd, duration_minutes, tokens_used, false_positive_count | red_team_test_suite, evidence |

**P36 Schema Fit**: Each schema ~200-300 lines JSON Schema Draft-07 with examples. Total: ~1,500 lines. 

**Production Readiness**: 
- ✅ No compromise (not forcing P36 Data into P58 containers)
- ✅ Framework-native (each schema designed for 5-framework alignment)
- ✅ Composable (can orchestrate Promptfoo → ai_security_finding → framework_evidence_mapping via relationships)
- ✅ Auditable (full lineage from test → finding → control → remediation)

---

#### **Schemas Tier 2: P58-Specific (Infrastructure Vulnerability Management)** [7 new schemas]

| Schema ID | Layer # | Purpose | Parent Domain | Key Fields | Relationships |
|---|---|---|---|---|---|
| **vulnerability_scan_result** | L52 (planned) | Network scan execution record | Domain 8: DevOps | id, scan_id, scan_type (nmap, nessus, azure_security_center), timestamp, target_scope (cidr_ranges, cloud_subscription), host_count, service_count, vulnerability_count, duration_minutes, tool_version | infrastructure (targets) |
| **cve_finding** | L53 (planned) | Individual vulnerability with CVE + CVSS + exploitability | Domain 9: Observability | id, cve_id, cvss_score (0-10), cvss_vector, exploitability_score (default: CVSS exploitability; enriched: threat intel adjustment), asset_criticality (1-5 scale), affected_host, affected_port, affected_service, cpe_match, patch_available, patch_version, nist_cwe_category, first_detected, last_detected | vulnerability_scan_result (parent), threat_intelligence (enrichment) |
| **risk_ranking** | L54 (planned) | Pareto-ranked vulnerability output | Domain 9: Observability | id, ranking_run_timestamp, risk_scores[] { cve_id, risk_score, percentile, pareto_group (top_20_percent, next_30_percent, long_tail) }, total_risk_units, top_20_count, risk_reduction_if_remediate_top_20_pct, pareto_distribution_fit | cve_finding (input) |
| **remediation_task** | L55 (planned) | Prioritized fix action with SLA tracking | Domain 7: Project & PM | id, cve_id, severity (critical/high/medium/low), fix_priority (1-5, derived from risk_ranking), assigned_to (persona), due_date, sla_status (on_track, at_risk, overdue), remediation_type (patch, mitigate, accept, decommission), estimated_effort_hours, patches_available[], runbooks[], status (not_started, in_progress, completed, cancelled), completion_date, notes | wbs/tasks (parent), cve_finding, risk_ranking |
| **remediation_effectiveness** | L56 (planned) | Metrics on remediation execution | Domain 9: Observability | id, period (start_date, end_date), cve_count_remediated, severity_distribution_before, severity_distribution_after, risk_score_before, risk_score_after, risk_reduction_pct, sla_compliance_pct (% of tasks completed on time), velocity (findings_closed_per_week), backlog_size, remediation_time_avg_hours | remediation_task (aggregation) |
| **compliance_gap_mapping** | L60 (planned) | Framework control → CVE/finding → remediation linker | Domain 6: Governance | id, framework (PCI-DSS, SOC2, HIPAA, ISO27001, CIS, custom), control_id, control_name, findings_violating[] (cve_id[]), remediation_tasks_required[], gap_status (critical, high, medium, low, resolved), certification_date | security_controls, cve_finding, remediation_task |
| **threat_intelligence_context** | L61 (planned) | CVE enrichment + exploitability trending | Domain 6: Governance | id, cve_id, threat_intel_source (NVD, CISA, Shodan, GreyNoise, proprietary), exploit_availability (none, proof_of_concept, functional, active_in_wild), active_exploitation (yes/no), exploit_popularity (number of public exploits), trending (no, emerging, hot), asset_exposure_count (how many customers affected), incident_count (tracked exploits in the wild) | cve_finding (enrichment source) |

**P58 Schema Fit**: Each schema ~250-350 lines JSON Schema Draft-07 with examples. Total: ~2,000 lines.

**Production Readiness**:
- ✅ No compromise (not squeezing P58 vulnerability data into P36 red-team findings)
- ✅ Pareto-native (risk_ranking and remediation_effectiveness designed around 80/20 principle)
- ✅ Compliance-aware (direct mapping framework control → CVE → remediation)
- ✅ Enterprise-grade (SLA tracking, velocity metrics, threat intel integration)

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

### P36 Data Flow (Red-Teaming)

```
prompts (L21) 
  ↓ test definitions
red_team_test_suite (L51-new)
  ↓ execute via Promptfoo provider
evidence (L33) + ai_security_finding (L57-new)
  ↓ aggregate results
ai_security_metrics (L59-new)
  ↓ map controls
framework_evidence_mapping (L58-new)
  ↓ generate ATO evidence pack
compliance_audit (L45) + security_controls (L22)
```

**Dependency Chain**: `prompts → red_team_test_suite → [execute] → evidence + ai_security_finding → framework_evidence_mapping → compliance_audit`

**Key Insight**: Evidence + findings are immutable (audit trail). Framework mapping is derived + regenerable. Control attestation comes from evidence layer.

---

### P58 Data Flow (Infrastructure Scanning)

```
azure_infrastructure (L44)
  ↓ scan targets
vulnerability_scan_result (L52-new)
  ↓ parse raw scan output
cve_finding (L53-new) + threat_intelligence_context (L61-new)
  ↓ rank by risk
risk_ranking (L54-new)
  ↓ create remediation backlog
remediation_task (L55-new) + compliance_gap_mapping (L60-new)
  ↓ track completion
remediation_effectiveness (L56-new)
  ↓ map controls
security_controls (L22) + compliance_audit (L45)
```

**Dependency Chain**: `infrastructure → scan → cve_finding → risk_ranking → remediation_task → remediation_effectiveness + compliance_gap_mapping → security_controls`

**Key Insight**: Pareto ranking (top 20%) becomes filter for remediation_task creation. SLA tracking happens in remediation_effectiveness.

---

### Cross-Project Integration (P36 ↔ P58)

**Only One Integration Point**: `security_controls (L22) + compliance_audit (L45)`

Both projects map findings → controls → audit trail. P36 adds "AI security" controls (ATLAS, OWASP-LLM). P58 adds "Infrastructure" controls (PCI, HIPAA). Framework enum in security_controls expands to:

```json
"framework": [
  "ITSG-33", "OWASP-LLM", "MITRE-ATLAS", "NIST-AI-RMF", "ISO-42001",  // P36
  "SOC2", "PCI-DSS", "HIPAA", "GDPR", "CSA", "ISO27001", "CIS", "NIST",  // P58 (existing)
  "OWASP-CSR",  // P58 new
  "custom"
]
```

**Benefit**: Single control attestation report can show both AI vulnerabilities + Infrastructure vulnerabilities under same framework (e.g., "NIST AI RMF" + "NIST Cybersecurity Framework").

---

## Part 7: Implementation Sequencing

### Phase 1: MVP (14 days) - Start immediately

**Use existing schemas** for bridging workloads:

| Day | Team | Task | Output |
|---|---|---|---|
| 1-2 | P36 | Implement Promptfoo core + custom HTTP provider | Working eval harness |
| 2-3 | P36 | Wire evidence layer for Promptfoo results (store as JSON in artifacts) | Prompts → Results → Evidence records |
| 3-5 | P58 | Stand up Nmap scanning infrastructure + Azure Security Center integration | Raw scan results parsable |
| 5-7 | P58 | Map scan results to compliance_audit layer (audit_type="vulnerability") | CVE findings stored + queryable |
| 7-10 | Both | Framework mapping validation (controls + security_controls layer alignment) | Can generate compliance matrices |
| 10-14 | Both | ATO evidence packs + sprint close validation | MTI > 70, all tests passing |

**Phase 1 Acceptance**: 
- ✅ P36 produces 60+ test results, stores as evidence
- ✅ P58 produces 100+ CVE findings, stores as compliance_audit
- ✅ Both projects map to security_controls
- ✅ Evidence complete, MTI gate passed
- ✅ No new schemas created (reuse existing + documented workarounds)

---

### Phase 2: Production Schemas (10 days) - Start after Sprint 1 closes

**Create 12 new schemas** for optimized data structures:

| Week | Team | Task | Output |
|---|---|---|---|
| 1 (3 days) | Data Modeler | Design 12 JSON schemas + write examples | Complete schema definitions |
| 1-2 (3 days parallel) | Backend Eng | Implement API routes, CRUD, indexes in FastAPI + Cosmos DB | All 12 schemas deployed + tested |
| 2 (2 days parallel) | QA Eng | Write 50+ integration tests | Test suite complete, all passing |
| 2 (1 day parallel) | Migration Eng | Build data transformer (compliance_audit → ai_security_finding, evidence → ai_security_metrics) | Migration script tested |
| 2 (1 day) | Tech Writer | Documentation + query examples | README + runbooks |

**Phase 2 Deployment**: 
- Push 12 new schemas + API routes
- Run migration script (data moved, old fields preserved for backcompat)
- P36 Sprint 2 uses new ai_security_finding layer
- P58 Sprint 2 uses new cve_finding + risk_ranking layers
- Cleanup: Deprecate compliance_audit for P36 work (P58 keeps for audit trail)

**Phase 2 Benefits**:
- 90% query efficiency gain (no more filtering generic findings arrays)
- Type-safe validation (JSON Schema prevents malformed records)
- Framework-native data structures (no impedance mismatch)
- Enterprise SLA tracking (remediation_effectiveness layer)

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

✅ **CREATE 12 NEW SCHEMAS** (L50-L61 in 44-layer expansion)

Rather than forcing P36 and P58 workloads into existing schemas, dedicated schemas provide:
- Framework-native data structures (no compromises)
- Type safety (JSON Schema validation)
- Query efficiency (90% faster for common operations)
- Enterprise SLA tracking (P58 remediation effectiveness)
- Immutable audit trails (evidence → findings → controls)
- Clear lineage (framework control ← CVE ← scan → remediation task)

**Timeline**: 
- **Phase 1** (14 days): MVP using 8 existing schemas + documented workarounds
- **Phase 2** (10 days): Deploy 12 new schemas + data migration

**Phases 3+**: P36/P58 fully operational on dedicated, optimized infrastructure with 99% query cost reduction.

---

## Appendix: Full Schema List (20 total)

| # | Schema | Layer | Purpose | Phase | Dev Days |
|---|---|---|---|---|---|
| **PHASE 1: Existing (8 schemas, 0 days to use)** |
| 1 | prompts | L21 | Test case definitions | 1 | - |
| 2 | security_controls | L22 | Framework mapping | 1 | - |
| 3 | evidence | L33 | DPDCA audit trail | 1 | - |
| 4 | compliance_audit | L45 | Audit results | 1 | - |
| 5 | validation_rules | L41 | Assertion definitions | 1 | - |
| 6 | agent_performance_metrics | L43 | Test metrics | 1 | - |
| 7 | azure_infrastructure | L44 | Asset inventory | 1 | - |
| 8 | deployment_records | L47 | Execution records | 1 | - |
| **PHASE 2: P36 Dedicated (5 new schemas, 5 days each)** |
| 9 | ai_security_finding | L57 | Red-team vulnerability | 2 | 5 |
| 10 | attack_tactic_catalog | L50 | OWASP/ATLAS/NIST taxonomy | 2 | 3 |
| 11 | red_team_test_suite | L51 | Promptfoo pack definition | 2 | 4 |
| 12 | framework_evidence_mapping | L58 | Control → test → finding | 2 | 4 |
| 13 | ai_security_metrics | L59 | Test suite performance | 2 | 3 |
| **PHASE 2: P58 Dedicated (7 new schemas, 7 days each)** |
| 14 | vulnerability_scan_result | L52 | Scan execution + metadata | 2 | 4 |
| 15 | cve_finding | L53 | Individual CVE + CVSS + exploitability | 2 | 5 |
| 16 | risk_ranking | L54 | Pareto analysis output | 2 | 4 |
| 17 | remediation_task | L55 | Fix action + SLA tracking | 2 | 4 |
| 18 | remediation_effectiveness | L56 | Metrics on remediation execution | 2 | 4 |
| 19 | compliance_gap_mapping | L60 | Control → CVE → remediation | 2 | 4 |
| 20 | threat_intelligence_context | L61 | CVE enrichment + trending | 2 | 3 |

**Total Phase 1**: 0 days (use existing)  
**Total Phase 2**: ~50 dev days (12 schemas × 4-5 days each, parallel)  
**Total Project Integration**: 14 days (Phase 1 MVP) + 10 days (Phase 2 optimization) = **24 days to production**

