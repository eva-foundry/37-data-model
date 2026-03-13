# Layer Definitions L112-L121
## P36 (Red-Teaming) + P58 (Infrastructure Vulnerability) Security Schemas

Generated: 2026-03-12 22:27:48

This document defines the 10 new security layers for Projects 36 and 58.
All layers are deployed together as a unified Phase 1 deployment.

---
## L112: red_team_test_suites

**Domain**: Domain 3 (AI Runtime) + Domain 6 (Governance)  
**Status**: operational  
**Purpose**: Promptfoo test pack: test cases, prompts, attack tactics, assertion rules, coverage mapping

### Schema
- **File**: red_team_test_suite.schema.json
- **Title**: Red Team Test Suite (L77)
- **Description**: Promptfoo test pack definition with template metadata, assertion rules, and framework coverage settings.

### Relationships
- **Parent Layers**: L9/agents, L21/prompts, L36/agent_policies, L22/security_controls
- **Child Layers**: L114/ai_security_findings
- **Startup Seed Count**: 2

### Query Endpoints
- \GET /model/red_team_test_suites\ - List all objects
- \GET /model/red_team_test_suites/{id}\ - Get specific object
- \POST /model/red_team_test_suites\ - Create new object
- \PUT /model/red_team_test_suites/{id}\ - Update object
- \DELETE /model/red_team_test_suites/{id}\ - Delete object

### Cosmos DB Payload (Template)
\\\json
{
  "layer_id": "L112",
  "name": "red_team_test_suites",
  "status": "operational",
  "schema": {...},
  "created_at": "2026-03-12T{timestamp}Z"
}
\\\

---
## L113: attack_tactic_catalog

**Domain**: Domain 6 (Governance)  
**Status**: operational  
**Purpose**: OWASP + ATLAS + NIST attack taxonomy (50+ attack types with framework mappings)

### Schema
- **File**: attack_tactic_catalog.schema.json
- **Title**: Attack Tactic Catalog (L76)
- **Description**: OWASP + ATLAS + NIST attack taxonomy for red-teaming and LLM vulnerability testing. Maps attack tactics across security frameworks.

### Relationships
- **Parent Layers**: L22/security_controls
- **Child Layers**: 
- **Startup Seed Count**: 3

### Query Endpoints
- \GET /model/attack_tactic_catalog\ - List all objects
- \GET /model/attack_tactic_catalog/{id}\ - Get specific object
- \POST /model/attack_tactic_catalog\ - Create new object
- \PUT /model/attack_tactic_catalog/{id}\ - Update object
- \DELETE /model/attack_tactic_catalog/{id}\ - Delete object

### Cosmos DB Payload (Template)
\\\json
{
  "layer_id": "L113",
  "name": "attack_tactic_catalog",
  "status": "operational",
  "schema": {...},
  "created_at": "2026-03-12T{timestamp}Z"
}
\\\

---
## L114: ai_security_findings

**Domain**: Domain 9 (Observability)  
**Status**: operational  
**Purpose**: Promptfoo evaluation output: per-test pass/fail, attack tactic, severity, framework mapping

### Schema
- **File**: ai_security_finding.schema.json
- **Title**: AI Security Finding (L78)
- **Description**: Red-team vulnerability record from Promptfoo tests. Maps to attack tactics, frameworks, and remediation guidance.

### Relationships
- **Parent Layers**: L33/evidence, L112/red_team_test_suites
- **Child Layers**: 
- **Startup Seed Count**: 1

### Query Endpoints
- \GET /model/ai_security_findings\ - List all objects
- \GET /model/ai_security_findings/{id}\ - Get specific object
- \POST /model/ai_security_findings\ - Create new object
- \PUT /model/ai_security_findings/{id}\ - Update object
- \DELETE /model/ai_security_findings/{id}\ - Delete object

### Cosmos DB Payload (Template)
\\\json
{
  "layer_id": "L114",
  "name": "ai_security_findings",
  "status": "operational",
  "schema": {...},
  "created_at": "2026-03-12T{timestamp}Z"
}
\\\

---
## L115: assertions_catalog

**Domain**: Domain 6 (Governance)  
**Status**: operational  
**Purpose**: Custom assertion definitions (is-bilingual, has-pii, latency-under-threshold, etc.)

### Schema
- **File**: assertions_catalog.schema.json
- **Title**: Assertions Catalog (L115)
- **Description**: Library of custom assertion definitions for red-team testing (Project 36). Assertions are reusable validation rules that can be applied to LLM outputs, API responses, and generated artifacts. Supports polymorphic assertion types (bilingual, pii-presence, latency-threshold, etc.).

### Relationships
- **Parent Layers**: L41/validation_rules
- **Child Layers**: 
- **Startup Seed Count**: 3

### Query Endpoints
- \GET /model/assertions_catalog\ - List all objects
- \GET /model/assertions_catalog/{id}\ - Get specific object
- \POST /model/assertions_catalog\ - Create new object
- \PUT /model/assertions_catalog/{id}\ - Update object
- \DELETE /model/assertions_catalog/{id}\ - Delete object

### Cosmos DB Payload (Template)
\\\json
{
  "layer_id": "L115",
  "name": "assertions_catalog",
  "status": "operational",
  "schema": {...},
  "created_at": "2026-03-12T{timestamp}Z"
}
\\\

---
## L116: ai_security_metrics

**Domain**: Domain 9 (Observability)  
**Status**: operational  
**Purpose**: Test suite KPIs: test_count, pass_rate, false_positive_count, coverage_by_framework, api_cost, duration

### Schema
- **File**: ai_security_metrics.schema.json
- **Title**: AI Security Metrics (L80)
- **Description**: Test suite performance metrics: pass/fail rates, coverage by framework, API costs, execution time.

### Relationships
- **Parent Layers**: L43/agent_performance_metrics
- **Child Layers**: 
- **Startup Seed Count**: 1

### Query Endpoints
- \GET /model/ai_security_metrics\ - List all objects
- \GET /model/ai_security_metrics/{id}\ - Get specific object
- \POST /model/ai_security_metrics\ - Create new object
- \PUT /model/ai_security_metrics/{id}\ - Update object
- \DELETE /model/ai_security_metrics/{id}\ - Delete object

### Cosmos DB Payload (Template)
\\\json
{
  "layer_id": "L116",
  "name": "ai_security_metrics",
  "status": "operational",
  "schema": {...},
  "created_at": "2026-03-12T{timestamp}Z"
}
\\\

---
## L117: vulnerability_scan_results

**Domain**: Domain 8 (DevOps & Delivery)  
**Status**: operational  
**Purpose**: Network scan execution: scan_type (Nmap, Nessus, Azure Security Center), timestamp, target scope, host/service counts

### Schema
- **File**: vulnerability_scan_result.schema.json
- **Title**: Vulnerability Scan Result (L81)
- **Description**: Network/infrastructure scan execution record. Captures scan metadata, scope, timing, and result summary.

### Relationships
- **Parent Layers**: 
- **Child Layers**: L118/infrastructure_cve_findings
- **Startup Seed Count**: 1

### Query Endpoints
- \GET /model/vulnerability_scan_results\ - List all objects
- \GET /model/vulnerability_scan_results/{id}\ - Get specific object
- \POST /model/vulnerability_scan_results\ - Create new object
- \PUT /model/vulnerability_scan_results/{id}\ - Update object
- \DELETE /model/vulnerability_scan_results/{id}\ - Delete object

### Cosmos DB Payload (Template)
\\\json
{
  "layer_id": "L117",
  "name": "vulnerability_scan_results",
  "status": "operational",
  "schema": {...},
  "created_at": "2026-03-12T{timestamp}Z"
}
\\\

---
## L118: infrastructure_cve_findings

**Domain**: Domain 9 (Observability)  
**Status**: operational  
**Purpose**: CVE record: cve_id, cvss_score, cvss_vector, exploitability_score, affected_host, affected_port, affected_service, cpe_match, patch_availability

### Schema
- **File**: cve_finding.schema.json
- **Title**: CVE Finding (L82)
- **Description**: Individual CVE with CVSS score, affected assets, exploitability, and threat intel. Links to vulnerability scans.

### Relationships
- **Parent Layers**: L117/vulnerability_scan_results
- **Child Layers**: 
- **Startup Seed Count**: 5

### Query Endpoints
- \GET /model/infrastructure_cve_findings\ - List all objects
- \GET /model/infrastructure_cve_findings/{id}\ - Get specific object
- \POST /model/infrastructure_cve_findings\ - Create new object
- \PUT /model/infrastructure_cve_findings/{id}\ - Update object
- \DELETE /model/infrastructure_cve_findings/{id}\ - Delete object

### Cosmos DB Payload (Template)
\\\json
{
  "layer_id": "L118",
  "name": "infrastructure_cve_findings",
  "status": "operational",
  "schema": {...},
  "created_at": "2026-03-12T{timestamp}Z"
}
\\\

---
## L119: risk_ranking_analysis

**Domain**: Domain 9 (Observability)  
**Status**: operational  
**Purpose**: Pareto analysis output: risk scores, percentile ranking, top_20_percent grouping, risk_reduction_potential

### Schema
- **File**: risk_ranking.schema.json
- **Title**: Risk Ranking (L83)
- **Description**: Pareto-ranked vulnerabilities using 80/20 principle. Top 20% of CVEs account for ~80% of exploitability risk.

### Relationships
- **Parent Layers**: L118/infrastructure_cve_findings
- **Child Layers**: 
- **Startup Seed Count**: 1

### Query Endpoints
- \GET /model/risk_ranking_analysis\ - List all objects
- \GET /model/risk_ranking_analysis/{id}\ - Get specific object
- \POST /model/risk_ranking_analysis\ - Create new object
- \PUT /model/risk_ranking_analysis/{id}\ - Update object
- \DELETE /model/risk_ranking_analysis/{id}\ - Delete object

### Cosmos DB Payload (Template)
\\\json
{
  "layer_id": "L119",
  "name": "risk_ranking_analysis",
  "status": "operational",
  "schema": {...},
  "created_at": "2026-03-12T{timestamp}Z"
}
\\\

---
## L120: remediation_tasks

**Domain**: Domain 7 (Project & PM)  
**Status**: operational  
**Purpose**: Fix actions: severity, assigned_to, due_date, sla_status, remediation_type, patches_available, runbooks

### Schema
- **File**: remediation_task.schema.json
- **Title**: Remediation Task (L84)
- **Description**: Prioritized fix action with SLA tracking, status, and effort estimation. Links CVE findings to remediation work.

### Relationships
- **Parent Layers**: L27/wbs, L29/tasks
- **Child Layers**: 
- **Startup Seed Count**: 3

### Query Endpoints
- \GET /model/remediation_tasks\ - List all objects
- \GET /model/remediation_tasks/{id}\ - Get specific object
- \POST /model/remediation_tasks\ - Create new object
- \PUT /model/remediation_tasks/{id}\ - Update object
- \DELETE /model/remediation_tasks/{id}\ - Delete object

### Cosmos DB Payload (Template)
\\\json
{
  "layer_id": "L120",
  "name": "remediation_tasks",
  "status": "operational",
  "schema": {...},
  "created_at": "2026-03-12T{timestamp}Z"
}
\\\

---
## L121: remediation_effectiveness_metrics

**Domain**: Domain 9 (Observability)  
**Status**: operational  
**Purpose**: Progress tracking: findings_closed, risk_reduction_pct, sla_compliance_pct, velocity, backlog_size

### Schema
- **File**: remediation_effectiveness.schema.json
- **Title**: Remediation Effectiveness
- **Description**: Aggregate system-wide effectiveness metrics and continuous improvement insights

### Relationships
- **Parent Layers**: L120/remediation_tasks
- **Child Layers**: 
- **Startup Seed Count**: 1

### Query Endpoints
- \GET /model/remediation_effectiveness_metrics\ - List all objects
- \GET /model/remediation_effectiveness_metrics/{id}\ - Get specific object
- \POST /model/remediation_effectiveness_metrics\ - Create new object
- \PUT /model/remediation_effectiveness_metrics/{id}\ - Update object
- \DELETE /model/remediation_effectiveness_metrics/{id}\ - Delete object

### Cosmos DB Payload (Template)
\\\json
{
  "layer_id": "L121",
  "name": "remediation_effectiveness_metrics",
  "status": "operational",
  "schema": {...},
  "created_at": "2026-03-12T{timestamp}Z"
}
\\\

---

