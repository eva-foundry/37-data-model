#!/usr/bin/env pwsh
<#
.SYNOPSIS
PART 5b: Schema Roadmap & Design Plan
Map all 111-layer target architecture and design the 26 missing schemas

.DESCRIPTION
Framework: DPDCA v2.0
Status: PLAN phase (designs schemas without yet creating files)
Date: 2026-03-13

The 111-layer target has:
- 85 existing schemas (currently in flat structure)
- 26 schemas needed to complete the architecture
#>

# ────────────────────────────────────────────────────────────────────────
# The 26 Missing Schemas (Planned Layers L52-L75 + L76-L87)
# ────────────────────────────────────────────────────────────────────────

$missingSchemas = @{
    "Execution Engine Phase 1 (L52-L56)" = @{
        layer = "L52"
        schemas = @(
            @{ name = "work_execution_units.schema.json"; status = "EXISTS"; note = "Parent work ledger" },
            @{ name = "work_step_events.schema.json"; status = "MISSING"; note = "Timeline of events in work unit" },
            @{ name = "work_decision_records.schema.json"; status = "MISSING"; note = "Decisions made during execution" },
            @{ name = "work_outcomes.schema.json"; status = "MISSING"; note = "Deliverables from work unit" }
        )
    }
    
    "Execution Engine Phase 2 (L57-L62)" = @{
        layer = "L57-L62"
        description = "Work quality gates, validation, rollback handling"
        schemas = @(
            @{ name = "work_quality_gates.schema.json"; status = "MISSING"; note = "DPDCA CHECK phase gates" },
            @{ name = "work_validation_results.schema.json"; status = "MISSING"; note = "Test execution results" },
            @{ name = "work_rollback_procedures.schema.json"; status = "MISSING"; note = "Rollback & recovery" },
            @{ name = "work_failure_analysis.schema.json"; status = "MISSING"; note = "Post-mortem incident records" },
            @{ name = "work_remediation_plans.schema.json"; status = "EXISTS"; note = "Auto-generated remediation" },
            @{ name = "work_approval_records.schema.json"; status = "MISSING"; note = "ACT phase approvals" }
        )
    }
    
    "Execution Engine Phase 3 (L63-L65)" = @{
        layer = "L63-L65"
        description = "Workflow orchestration and state machine"
        schemas = @(
            @{ name = "execution_state_machines.schema.json"; status = "MISSING"; note = "FSM definitions" },
            @{ name = "execution_workflow_templates.schema.json"; status = "MISSING"; note = "Reusable workflow patterns" },
            @{ name = "execution_workflow_instances.schema.json"; status = "MISSING"; note = "Runtime workflow executions" }
        )
    }
    
    "Execution Engine Phase 4 (L66-L70)" = @{
        layer = "L66-L70"
        description = "Resource allocation, cost tracking, performance metrics"
        schemas = @(
            @{ name = "work_resource_allocations.schema.json"; status = "MISSING"; note = "CPU, memory, token budgets" },
            @{ name = "work_cost_tracking.schema.json"; status = "MISSING"; note = "API call costs, inference costs" },
            @{ name = "work_performance_profiling.schema.json"; status = "MISSING"; note = "Latency, throughput metrics" },
            @{ name = "work_dependency_graph.schema.json"; status = "MISSING"; note = "Task dependency resolution" },
            @{ name = "work_parallel_execution_records.schema.json"; status = "MISSING"; note = "Concurrent task tracking" }
        )
    }
    
    "Strategy & Portfolio (L71-L75)" = @{
        layer = "L71-L75"
        description = "Planning, prioritization, capacity management"
        schemas = @(
            @{ name = "portfolio_optimization.schema.json"; status = "MISSING"; note = "Prioritization algorithms" },
            @{ name = "capacity_planning.schema.json"; status = "MISSING"; note = "Resource capacity models" },
            @{ name = "strategic_initiatives.schema.json"; status = "MISSING"; note = "Multi-year roadmap items" },
            @{ name = "goal_tracking.schema.json"; status = "MISSING"; note = "OKR/goal hierarchy" },
            @{ name = "dependency_management.schema.json"; status = "MISSING"; note = "Cross-project dependencies" }
        )
    }
    
    "Security Framework Phase 1 (L76-L81)" = @{
        layer = "L76-L81"
        description = "Red-teaming, threat modeling, vulnerability tracking"
        schemas = @(
            @{ name = "red_team_campaigns.schema.json"; status = "MISSING"; note = "Project 36: Attack scenarios" },
            @{ name = "threat_models.schema.json"; status = "MISSING"; note = "STRIDE threat catalog" },
            @{ name = "vulnerability_findings.schema.json"; status = "MISSING"; note = "CVE mapping, severity" },
            @{ name = "security_mitigations.schema.json"; status = "MISSING"; note = "Control implementations" },
            @{ name = "compliance_requirements.schema.json"; status = "MISSING"; note = "Regulatory mapping" },
            @{ name = "security_audit_records.schema.json"; status = "MISSING"; note = "Audit trail for security" }
        )
    }
    
    "Security Framework Phase 2 (L82-L87)" = @{
        layer = "L82-L87"
        description = "Infrastructure security, supply chain, incident management"
        schemas = @(
            @{ name = "infrastructure_security_policies.schema.json"; status = "MISSING"; note = "Cloud security rules" },
            @{ name = "supply_chain_inventory.schema.json"; status = "MISSING"; note = "Dependency tracking" },
            @{ name = "incident_management_procedures.schema.json"; status = "MISSING"; note = "Incident response playbooks" },
            @{ name = "incident_tracking.schema.json"; status = "MISSING"; note = "Incident tickets" },
            @{ name = "security_metrics_dashboard.schema.json"; status = "MISSING"; note = "KRI/KSI tracking" },
            @{ name = "security_evidence_audit_log.schema.json"; status = "MISSING"; note = "Immutable evidence for compliance" }
        )
    }
}

Write-Host "PART 5b: SCHEMA ROADMAP & DESIGN PLAN" -ForegroundColor Cyan
Write-Host "=" * 80
Write-Host ""

$totalExpected = 0
$totalExists = 0
$totalMissing = 0

foreach ($category in $missingSchemas.Keys) {
    $item = $missingSchemas[$category]
    Write-Host "$category ($($item.layer))" -ForegroundColor Yellow
    
    if ($item.description) {
        Write-Host "  Description: $($item.description)"
    }
    
    foreach ($schema in $item.schemas) {
        $totalExpected++
        
        if ($schema.status -eq "EXISTS") {
            $totalExists++
            Write-Host "  ✓ $($schema.name) (EXISTS) - $($schema.note)" -ForegroundColor Green
        } else {
            $totalMissing++
            Write-Host "  ✗ $($schema.name) (MISSING) - $($schema.note)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

Write-Host "=" * 80
Write-Host "SUMMARY:" -ForegroundColor Cyan
Write-Host "  Total Schemas in 111-target:   $totalExpected"
Write-Host "  Already exist:                 $totalExists" -ForegroundColor Green
Write-Host "  Need to create:                $totalMissing" -ForegroundColor Red
Write-Host ""

# ────────────────────────────────────────────────────────────────────────
# Gap Analysis with DPDCA v2.0
# ────────────────────────────────────────────────────────────────────────

Write-Host "DPDCA v2.0 GAP ANALYSIS:" -ForegroundColor Magenta
Write-Host ""
Write-Host "PLAN Promise #1: Organize 85 existing schemas into 12 domains"
Write-Host "  Delivered: YES (infrastructure created in PART 5 initial)"
Write-Host "  Status: 40% complete (directories exist, schemas not moved yet)"
Write-Host ""
Write-Host "PLAN Promise #2: Design 26 missing schemas for 111-layer target"
Write-Host "  Delivered: YES (this document)"
Write-Host "  Status: READY (detailed specifications below)"
Write-Host ""
Write-Host "PLAN Promise #3: Move 85 existing + create 26 new = 111 total ready"
Write-Host "  Delivered: PENDING (DO phase)"
Write-Host "  Status: PLAN → DO transition ready"
Write-Host ""

# ────────────────────────────────────────────────────────────────────────
# Detailed Schema Specifications for the 26 Missing
# ────────────────────────────────────────────────────────────────────────

Write-Host "DETAILED SPECIFICATIONS FOR 26 MISSING SCHEMAS" -ForegroundColor Cyan
Write-Host "=" * 80
Write-Host ""

$detailedSpecs = @"
▌ EXECUTION ENGINE PHASE 1 (L53-L56)
──────────────────────────────────────────────────────────────────────────────

[L53] work_step_events.schema.json
  Purpose: Timeline record of every significant step/event in a work_execution_unit
  Parent: work_execution_units (L52)
  PK: step_event_id
  FK: work_unit_id
  Key Fields:
    - event_type: "progress_update" | "decision" | "gate_check" | "error" | "completion"
    - timestamp: ISO8601 when event occurred
    - actor_type: "agent" | "agent_agent" | "human"
    - actor_id: polymorphic reference
    - message: what happened
    - artifacts: array of evidence_ids
    - metrics: perf data (latency, tokens, cost)
  Cascade: DELETE work_unit_id → destroys all step_events
  Usage: Timeline view, audit trail, root cause analysis
  Domain: Execution Engine (L11)

[L54] work_decision_records.schema.json
  Purpose: Every decision made during execution (mapping to DPDCA PLAN/DO phases)
  Parent: work_execution_units (L52)
  PK: decision_id
  FK: work_unit_id
  Key Fields:
    - decision_type: "technical" | "process" | "trade-off" | "risk-mitigation"
    - decision_statement: what was decided
    - rationale: why (links to risk_register, policies)
    - alternatives_considered: array of rejected options
    - decision_maker_type: "agent" | "cp_agent" | "human"
    - decision_maker_id: polymorphic FK
    - approved_by: human approver (for critical decisions)
    - reversible: boolean (can this be undone?)
    - reversal_plan: if reversible, how to undo
  Cascade: DELETE work_unit_id → destroys all decision_records
  Usage: ADR equivalent, compliance reporting, change traceability
  Domain: Execution Engine (L11)

[L55] work_outcomes.schema.json (NEW - distinct from work_step_events)
  Purpose: Final deliverable artifacts from a work unit (DPDCA ACT phase records)
  Parent: work_execution_units (L52)
  PK: outcome_id
  FK: work_unit_id
  Key Fields:
    - outcome_type: "code_change" | "documentation" | "configuration" | "data_migration"
    - deliverable_summary: what was delivered
    - file_paths: array of modified files
    - diff_summary: lines added/removed/modified
    - tests_passing_count: number of passing tests
    - tests_failing_count: number of failing tests
    - code_review_status: "pending" | "approved" | "rejected"
    - deployment_status: "staged" | "deployed" | "rolled_back"
    - deployed_at: ISO8601 timestamp
    - rollback_triggered: boolean
    - rollback_reason: if true, why
  Cascade: DELETE work_unit_id → destroys all outcomes
  Usage: Release notes generation, deployment audit, rollback management
  Domain: Execution Engine (L11)

▌ EXECUTION ENGINE PHASE 2 (L57-L62)
──────────────────────────────────────────────────────────────────────────────

[L57] work_quality_gates.schema.json
  Purpose: DPDCA CHECK phase validation gates and pass/fail criteria
  FK: work_execution_units (L52)
  PK: gate_id
  Key Fields:
    - gate_name: "unit_tests" | "integration_tests" | "code_coverage" | "performance" | "security"
    - required: boolean (must pass before ACT?)
    - passing_criteria: object with thresholds (e.g., {coverage: ">80%", latency: "<500ms"})
    - status: "pending" | "passed" | "failed" | "waived"
    - failure_action: "block_deployment" | "log_warning" | "require_override"
  Usage: Automated quality enforcement, compliance gates, deployment readiness
  Domain: Execution Engine (L11)

[L58] work_validation_results.schema.json
  Purpose: Test execution details (unit tests, integration tests, E2E)
  FK: work_execution_units (L52)
  PK: validation_id
  Key Fields:
    - test_framework: "pytest" | "jest" | "go test" | "cargo test"
    - test_suite_name: name of test run
    - total_tests: count
    - passed: count
    - failed: count
    - skipped: count
    - error_details: array of failures with stack traces
    - execution_time_ms: how long tests took
    - code_coverage_percent: aggregate coverage
  Usage: Test reporting, CI/CD integration, coverage tracking
  Domain: Execution Engine (L11)

[L59] work_rollback_procedures.schema.json
  Purpose: How to undo changes if deployment fails
  FK: work_execution_units (L52)
  PK: rollback_id
  Key Fields:
    - rollback_type: "code" | "database" | "configuration" | "infrastructure"
    - rollback_steps: array of procedures (shell scripts, SQL, terraform destroy)
    - estimated_rollback_time_minutes: RTO estimate
    - rollback_tested: boolean (was rollback procedure validated in staging?)
    - last_tested_date: ISO8601
    - rollback_status: "armed" | "in-progress" | "completed" | "failed"
  Usage: Disaster recovery, deployment safety, incident response
  Domain: Execution Engine (L11)

[L60] work_failure_analysis.schema.json
  Purpose: Post-mortem when work_execution_units fails (RCA records)
  FK: work_execution_units (L52)
  PK: failure_id
  Key Fields:
    - failure_type: "pre-check" | "execution" | "validation" | "deployment"
    - root_cause: what went wrong
    - contributing_factors: array of secondary issues
    - timeline: when did it happen
    - impact: what was affected
    - preventive_measures: what to do differently next time
    - corrective_action: immediate fix applied
    - follow_up_work_units: array of IDs tracking remediation
  Usage: Learning, pattern detection, systemic improvement
  Domain: Execution Engine (L11)

[L62] work_approval_records.schema.json
  Purpose: Human/system sign-off for ACT phase (before deployment)
  FK: work_execution_units (L52)
  PK: approval_id
  Key Fields:
    - approval_type: "technical_review" | "security_review" | "business_approval" | "deployable_sign_off"
    - approver_type: "persona" (human) | "agent" (automated)
    - approver_id: polymorphic FK
    - approved: boolean
    - approval_timestamp: ISO8601
    - approval_comment: why approved/rejected
    - conditions_for_approval: what was required
    - override_reason: if normal process was bypassed
  Usage: Governance compliance, deployment audit trail, accountability
  Domain: Execution Engine (L11)

▌ EXECUTION ENGINE PHASE 3 (L63-L65)
──────────────────────────────────────────────────────────────────────────────

[L63] execution_state_machines.schema.json
  Purpose: Finite state machine definitions (workflow orchestration)
  PK: state_machine_id
  Key Fields:
    - machine_name: "dpdca_workflow" | "deployment_pipeline" | "incident_response"
    - states: array of allowed statuses
    - transitions: array of {from, to, condition, action}
    - start_state: initial state
    - terminal_states: array of end states
    - timeout_rules: time-based transitions (e.g., auto-rollback after 30min)
  Usage: Workflow engine, orchestration control, state validation
  Domain: Execution Engine (L11)

[L64] execution_workflow_templates.schema.json
  Purpose: Reusable workflow patterns (templates for work_execution_units)
  PK: template_id
  Key Fields:
    - template_name: "dpdca_sprint_delivery" | "hotfix_pipeline" | "migration_workflow"
    - description: what this template automates
    - steps: array of execution steps
    - gates: array of DPDCA CHECK gates
    - estimated_duration_minutes: typical time
    - resource_requirements: CPU, memory, token budget
    - owners: who maintains this template
  Usage: Workflow reuse, consistency, knowledge capture
  Domain: Execution Engine (L11)

[L65] execution_workflow_instances.schema.json
  Purpose: Runtime instantiation of workflow templates
  FK: execution_workflow_templates (L64)
  PK: instance_id
  Key Fields:
    - template_id: which template was instantiated
    - parameter_overrides: runtime customizations
    - status: "queued" | "running" | "completed" | "failed"
    - created_at, started_at, completed_at: timestamps
    - error_log: if failed, what went wrong
    - output_artifacts: array of produced files/evidence
  Usage: Workflow execution tracking, audit trail
  Domain: Execution Engine (L11)

▌ EXECUTION ENGINE PHASE 4 (L66-L70)
──────────────────────────────────────────────────────────────────────────────

[L66] work_resource_allocations.schema.json
  Purpose: Budget allocations (CPU, memory, tokens, money)
  FK: work_execution_units (L52)
  PK: allocation_id
  Key Fields:
    - resource_type: "cpu_hours" | "memory_gb" | "inference_tokens" | "usd"
    - allocated_amount: numeric budget
    - consumed_amount: actual usage
    - unit: "hours" | "GB" | "tokens" | "dollars"
    - warning_threshold_percent: when to alert
    - overbudget_action: "log" | "throttle" | "halt"
  Usage: Cost control, quota enforcement, billing
  Domain: Execution Engine (L11)

[L67] work_cost_tracking.schema.json
  Purpose: Detailed cost breakdown by resource (API calls, inference, compute)
  FK: work_execution_units (L52)
  PK: cost_id
  Key Fields:
    - cost_category: "inference" | "api_calls" | "compute" | "storage"
    - provider: "azure_openai" | "openai.com" | "github_models"
    - amount_usd: cost in dollars
    - quantity: number of units
    - unit_cost: cost per unit
    - date: when cost was incurred
    - tags: project_id, team, cost_center
  Usage: Cost allocation, budget reporting, optimization
  Domain: Execution Engine (L11)

[L68] work_performance_profiling.schema.json
  Purpose: Latency, throughput, and resource utilization metrics
  FK: work_execution_units (L52)
  PK: profile_id
  Key Fields:
    - metric_type: "latency_ms" | "throughput_ops_per_sec" | "memory_peak_mb" | "cpu_percent"
    - value: numeric measurement
    - timespan: duration of measurement
    - percentile: "p50" | "p95" | "p99" | "max"
    - component: which part of system
    - baseline: expected value
    - anomaly_detected: boolean
  Usage: Performance optimization, bottleneck identification
  Domain: Execution Engine (L11)

[L69] work_dependency_graph.schema.json
  Purpose: Dependency resolution for complex workflows
  FK: work_execution_units (L52)
  PK: dependency_id
  Key Fields:
    - depends_on_unit_ids: array of work_unit_ids this depends on
    - blocking_condition: what must be true before this can start
    - critical_path_flag: boolean (is this on the critical path?)
    - cycle_detected: boolean (would create circular dependency?)
    - earliest_start_time: earliest time this can start (all deps satisfied)
    - latest_start_time: latest time this can start without delaying final ACT
  Usage: Schedule optimization, parallel execution planning
  Domain: Execution Engine (L11)

[L70] work_parallel_execution_records.schema.json
  Purpose: Track concurrent execution of work units / parallel tasks
  FK: work_execution_units (L52)
  PK: parallel_id
  Key Fields:
    - parallel_group_id: which group of tasks ran in parallel
    - unit_ids: array of work_unit_ids that ran together
    - total_wall_clock_time_s: elapsed time
    - total_cpu_hours: sum of all CPU (would be higher than wall clock)
    - synchronization_points: array of when tasks waited for each other
    - speedup_factor: (sum CPU hours) / (wall clock time)
  Usage: Parallelism metrics, scheduling optimization
  Domain: Execution Engine (L11)

▌ STRATEGY & PORTFOLIO (L71-L75)
──────────────────────────────────────────────────────────────────────────────

[L71] portfolio_optimization.schema.json
  Purpose: Prioritization algorithms and scoring for work_execution_units
  PK: portfolio_id
  Key Fields:
    - optimization_model: "money_maximizer" | "time_minimizer" | "risk_balance"
    - weights: object with scoring factors (business_value: 0.4, risk: 0.3, effort: 0.3)
    - ranking: array of work_unit_ids in priority order
    - score_justification: why ranked this way
  Usage: Roadmap prioritization, resource allocation
  Domain: Strategy & Portfolio (L12)

[L72] capacity_planning.schema.json
  Purpose: Resource availability and capacity models
  PK: capacity_id
  Key Fields:
    - resource_type: "agent_capacity" | "human_capacity" | "infrastructure"
    - total_capacity: scalar (hours/month, API calls/day, etc.)
    - committed_capacity: already allocated
    - available_capacity: remaining
    - forecast_next_quarter: projected demand
    - bottleneck_resource: which resource is limiting
  Usage: Resource planning, bottleneck identification, scaling decisions
  Domain: Strategy & Portfolio (L12)

[L73] strategic_initiatives.schema.json
  Purpose: Multi-quarter/year strategic goals and roadmap items
  PK: initiative_id
  Key Fields:
    - initiative_name: "launch_agentic_workforce" | "achieve_soc2_compliance"
    - start_quarter: "2026-Q2"
    - target_completion_quarter: "2026-Q4"
    - business_outcomes: array of success criteria
    - investment_level: "high" | "medium" | "low"
    - dependencies: array of initiatives this depends on
    - pmo_owner: persona_id
  Usage: Executive alignment, roadmap communication
  Domain: Strategy & Portfolio (L12)

[L74] goal_tracking.schema.json
  Purpose: OKR (Objectives & Key Results) hierarchy
  PK: goal_id
  Key Fields:
    - period: "2026-Q1" | "2026-H1" | "2026-FY"
    - objective: what we want to achieve
    - key_results: array of measurable outcomes
    - owner: persona_id
    - current_progress_percent: 0-100
    - on_track: boolean
    - risks_to_achieving: array of risks
    - supporting_projects: array of project IDs contributing to this goal
  Usage: Executive dashboards, alignment tracking
  Domain: Strategy & Portfolio (L12)

[L75] dependency_management.schema.json
  Purpose: Cross-project dependencies and blockers
  PK: dependency_id
  Key Fields:
    - depending_project: project_id that blocks
    - blocking_project: project_id that is blocked
    - dependency_type: "technical" | "resource" | "schedule" | "data"
    - criticality: "critical" | "high" | "medium" | "low"
    - target_unblock_date: when dependency should be resolved
    - mitigation_plan: workaround if can't resolve
  Usage: Portfolio risk management, scheduling
  Domain: Strategy & Portfolio (L12)

▌ SECURITY FRAMEWORK PHASE 1 (L76-L81)
──────────────────────────────────────────────────────────────────────────────

[L76] red_team_campaigns.schema.json
  Purpose: Project 36 red-teaming attack scenarios and results (MITRE ATLAS)
  PK: campaign_id
  Key Fields:
    - campaign_name: "defense_evasion_tactics" | "prompt_injection_discovery"
    - atlas_tactic: array of MITRE ATLAS tactics covered
    - scenarios: array of attack scenarios
    - test_results: pass/fail for each attack
    - unmitigated_findings: count of exploitable issues
    - mitigations_needed: array of recommended controls
  Usage: Red-teaming results, security posture assessment
  Domain: Security Framework (L8, L11)

[L77] threat_models.schema.json
  Purpose: STRIDE threat modeling (Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation)
  PK: threat_model_id
  Key Fields:
    - system_component: which component is being modeled
    - threat_type: "spoofing" | "tampering" | "repudiation" | "info_disclosure" | "dos" | "elevation"
    - threat_scenario: what the attack looks like
    - likelihood: "high" | "medium" | "low"
    - impact: "critical" | "high" | "medium" | "low"
    - mitigation: how to prevent
  Usage: Risk assessment, security architecture reviews
  Domain: Security Framework (L8, L11)

[L78] vulnerability_findings.schema.json
  Purpose: Discovered vulnerabilities with CVE mapping
  PK: vuln_id
  Key Fields:
    - vuln_type: "code_injection" | "auth_bypass" | "data_leak" | "third_party_dependency"
    - severity: "critical" | "high" | "medium" | "low"
    - cve_id: CVE-XXXX-XXXXX if applicable
    - affected_component: which layer/service
    - discovery_date: when found
    - remediation_status: "open" | "in-progress" | "remediated"
    - sla_deadline: when must be fixed
  Usage: Vulnerability tracking, CVSS scoring, remediation tracking
  Domain: Security Framework (L8, L11)

[L79] security_mitigations.schema.json
  Purpose: Control implementations (how threats are mitigated)
  FK: threat_models (L77)
  PK: mitigation_id
  Key Fields:
    - threat_id: which threat this mitigates
    - control_type: "preventive" | "detective" | "corrective" | "compensating"
    - control_description: what the control does
    - implementation_status: "design" | "implemented" | "tested" | "operational"
    - effectiveness_percent: 0-100 estimate
    - cost_to_implement: USD
    - residual_risk_after: remaining risk after control
  Usage: Risk reduction tracking, control effectiveness measurement
  Domain: Security Framework (L8, L11)

[L80] compliance_requirements.schema.json
  Purpose: Mapping security requirements to regulations (SOC 2, ISO 27001, GDPR)
  PK: compliance_id
  Key Fields:
    - framework: "SOC2" | "ISO27001" | "GDPR" | "HIPAA" | "PCI-DSS"
    - requirement_id: identifier in the framework
    - requirement_text: what must be done
    - control_mapping: array of control_ids implementing this requirement
    - evidence_collected: boolean (is evidence provided?)
    - audit_status: "not_audited" | "pending" | "passed" | "failed"
  Usage: Compliance audits, regulatory reporting
  Domain: Security Framework (L8, L11)

[L81] security_audit_records.schema.json
  Purpose: Immutable audit trail for security activities
  PK: audit_id
  Key Fields:
    - action_type: "policy_change" | "access_grant" | "vulnerability_remediation" | "control_test"
    - actor_type: "human" | "agent" | "system"
    - actor_id: who did it
    - affected_resource: what was changed
    - before_state: previous value
    - after_state: new value
    - timestamp: ISO8601
    - justification: why was this done
    - approval: who approved it
  Usage: Security compliance tracking, incident investigation
  Domain: Security Framework (L8, L11)

▌ SECURITY FRAMEWORK PHASE 2 (L82-L87)
──────────────────────────────────────────────────────────────────────────────

[L82] infrastructure_security_policies.schema.json
  Purpose: Cloud security rules (Network ACLs, firewall, encryption policies)
  PK: policy_id
  Key Fields:
    - policy_name: "network_isolation" | "encryption_in_transit" | "encryption_at_rest"
    - target_layer: "network" | "compute" | "storage" | "database"
    - policy_statement: what is required
    - enforcement_method: "azure_policy" | "firewall_rule" | "iam_role"
    - applies_to_environments: array of prod/staging/dev
    - exemptions: if any, documented
  Usage: Infrastructure as Code compliance, security policy enforcement
  Domain: Security Framework (L8, L11)

[L83] supply_chain_inventory.schema.json
  Purpose: Dependency tracking (npm, PyPI, NuGet packages) and known vulnerabilities
  PK: dependency_id
  Key Fields:
    - package_name: npm/nuget identifier
    - version: current version
    - outdated_versions: count of available updates
    - vulnerabilities_known: array of CVE IDs
    - license_type: "MIT" | "Apache 2.0" | "GPL" | "Proprietary"
    - last_updated: when package was last updated
    - update_available: boolean
  Usage: Dependency scanning, vulnerability management
  Domain: Security Framework (L8, L11)

[L84] incident_management_procedures.schema.json
  Purpose: Playbooks for security incident response
  PK: playbook_id
  Key Fields:
    - incident_type: "data_breach" | "account_compromise" | "ddos" | "ransomware"
    - escalation_criteria: when to escalate to incident response team
    - response_steps: array of procedures
    - stakeholders_to_notify: array of email/Teams channels
    - communication_template: initial message
    - expected_resolution_time: SLA in hours
  Usage: Incident response automation, crisis management
  Domain: Security Framework (L8, L11)

[L85] incident_tracking.schema.json
  Purpose: Active and historical security incidents
  PK: incident_id
  Key Fields:
    - incident_type: type of security incident
    - discovery_date: when detected
    - severity: "critical" | "high" | "medium" | "low"
    - affected_systems: array of components
    - root_cause: what happened
    - remediation_steps: what was done
    - closed_date: when resolved
    - post_incident_review: lessons learned
  Usage: Incident metrics, pattern detection, regulatory reporting
  Domain: Security Framework (L8, L11)

[L86] security_metrics_dashboard.schema.json
  Purpose: Key Risk Indicators (KRI) and Key Security Indicators (KSI)
  PK: metric_id
  Key Fields:
    - metric_name: "mttr_critical_vuln" | "unpatched_systems_percent" | "phishing_click_rate"
    - current_value: latest measurement
    - threshold_acceptable: target value
    - trend: improving/stable/degrading
    - data_source: where metric comes from
    - collection_frequency: daily/weekly/monthly
  Usage: Security posture dashboards, board reporting
  Domain: Security Framework (L8, L11)

[L87] security_evidence_audit_log.schema.json
  Purpose: Immutable evidence for FDA CFR 21 Part 11 compliance
  PK: log_id
  Key Fields:
    - event_type: "configuration_change" | "asset_creation" | "access_log" | "test_result"
    - timestamp: ISO8601 (server-generated, not user-settable)
    - actor: who made the change
    - change_details: what changed
    - before_image: previous state
    - after_image: new state
    - digital_signature: cryptographic proof
    - immutable: cannot be edited (can only append)
  Usage: Regulatory compliance, legal evidence
  Domain: Security Framework (L8, L11)
"@

Write-Host $detailedSpecs
Write-Host ""
Write-Host "=" * 80
Write-Host "NEXT STEPS:" -ForegroundColor Green
Write-Host "1. PART 5b.DO:    Create all 26 schema files"
Write-Host "2. PART 5b.CHECK: Validate 85 moved + 26 created = 111 total"
Write-Host "3. PART 5b.ACT:   Commit 111 schemas to GitHub"
Write-Host ""
