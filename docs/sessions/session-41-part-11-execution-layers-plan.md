# Execution Layers Phases 2-6: Implementation Plan

**Session**: 41 Part 11  
**Date**: 2026-03-09  
**Branch**: feat/execution-layers-phase2-6  
**Baseline**: 91 operational layers (4 Phase 1 execution layers deployed)  
**Target**: 111 operational layers (add 20 more execution layers)  

---

## DISCOVER Phase — Summary

**Context**: Phase 1 (L52-L56) successfully deployed. Schemas operational, API endpoints live, 0 records (awaiting operational usage).

**Remaining Work**: 20 layers across Phases 2-6:
- **Phase 2** (3 layers): L55, L57, L58 — Obligations + Learning
- **Phase 3** (2 layers): L59, L60 — Pattern Performance  
- **Phase 4** (6 layers): L61-L66 — Factory Services
- **Phase 5** (4 layers): L67-L70 — Remediation & Lifecycle
- **Phase 6** (5 layers): L71-L75 — Portfolio & Strategy

**Source Documents**:
- docs/architecture/EXECUTION-LAYERS-ASSESSMENT.md (design authority)
- docs/library/13-EXECUTION-LAYERS.md (Phase 1 implementation reference)
- docs/library/99-layers-design-20260309-0935.md (canonical numbering)

---

## PLAN Phase — Layer-by-Layer Breakdown

### Phase 2: Obligations + Learning (3 layers)

#### L55: work_obligations
- **Purpose**: Follow-up/obligation tracking from decisions and policies
- **Parent**: None (references work_decision_records and cp_policies)
- **FKs**: 
  - decision_id → L54 work_decision_records
  - policy_id → L16 cp_policies (optional)
  - assigned_to (polymorphic: agent/cp_agent/human)
  - work_unit_id → L52 (context reference)
- **Key Fields**: obligation_id, decision_id, policy_id, obligation_text, due_date, status, priority, assigned_to_type, assigned_to_id, completion_evidence_id
- **Cascade**: SET_NULL on decision delete (obligations survive decisions)

#### L57: work_learning_feedback
- **Purpose**: Adaptive learning — lessons, tuning signals, improvement insights
- **Parent**: None (aggregates from multiple work units)
- **FKs**:
  - work_unit_ids[] → L52 (sources)
  - Pattern_ids[] → L58 (future reference)
- **Key Fields**: learning_id, work_unit_ids[], learning_type, observation, recommendation, confidence_score, validation_status, author_type, author_id
- **Cascade**: SET_NULL on work unit delete

#### L58: work_reusable_patterns
- **Purpose**: Pattern catalog — approved execution templates
- **Parent**: None (catalog layer)
- **FKs**:
  - derived_from_learning_ids[] → L57
  - example_work_units[] → L52
- **Key Fields**: pattern_id, pattern_name, pattern_type, description, applicability_conditions[], steps[], expected_outcomes[], approval_status, approval_date, version
- **Cascade**: SET_NULL on learning delete

### Phase 3: Pattern Performance (2 layers)

#### L59: work_pattern_applications
- **Purpose**: Pattern usage tracking per work unit
- **Parent**: work_execution_units (via work_unit_id FK)
- **FKs**:
  - work_unit_id → L52 (CASCADE)
  - pattern_id → L58 (RESTRICT)
- **Key Fields**: application_id, work_unit_id, pattern_id, applied_at, adaptations_made[], success_score, feedback
- **Cascade**: CASCADE on work unit delete, RESTRICT on pattern delete

#### L60: work_pattern_performance_profiles
- **Purpose**: Aggregate pattern performance metrics
- **Parent**: None (aggregate/view layer)
- **FKs**:
  - pattern_id → L58 (RESTRICT)
  - source_application_ids[] → L59
- **Key Fields**: profile_id, pattern_id, total_applications, success_rate, avg_duration, common_adaptations[], last_updated
- **Cascade**: RESTRICT on pattern delete

### Phase 4: Factory Services (6 layers)

#### L61: work_factory_capabilities
- **Purpose**: Capability catalog backed by patterns
- **Parent**: None (catalog layer)
- **FKs**:
  - backed_by_pattern_ids[] → L58
- **Key Fields**: capability_id, capability_name, description, maturity_level, required_patterns[], optional_patterns[], prerequisites[]
- **Cascade**: SET_NULL on pattern delete

#### L62: work_factory_services
- **Purpose**: Service packaging of capabilities
- **Parent**: None (catalog layer)
- **FKs**:
  - required_capability_ids[] → L61
  - optional_capability_ids[] → L61
- **Key Fields**: service_id, service_name, description, service_type, input_schema, output_schema, capability_ids[], status
- **Cascade**: RESTRICT on capability delete

#### L63: work_service_requests
- **Purpose**: Demand intake for services
- **Parent**: None (request tracking)
- **FKs**:
  - service_id → L62
  - requester (polymorphic)
  - project_id → L25
- **Key Fields**: request_id, service_id, requester_type, requester_id, project_id, input_payload, requested_at, priority, status
- **Cascade**: RESTRICT on service delete

#### L64: work_service_runs
- **Purpose**: Service runtime execution instances
- **Parent**: work_service_requests (via request_id FK)
- **FKs**:
  - request_id → L63 (CASCADE)
  - work_unit_id → L52 (SET_NULL)
- **Key Fields**: run_id, request_id, work_unit_id, started_at, completed_at, status, output_payload, error_details
- **Cascade**: CASCADE on request delete

#### L65: work_service_performance_profiles
- **Purpose**: Aggregate service performance
- **Parent**: None (aggregate/view layer)
- **FKs**:
  - service_id → L62 (RESTRICT)
  - source_run_ids[] → L64
- **Key Fields**: profile_id, service_id, total_runs, success_rate, avg_duration, p50_duration, p95_duration, last_updated
- **Cascade**: RESTRICT on service delete

#### L66: work_service_level_objectives
- **Purpose**: SLO definitions and thresholds
- **Parent**: work_factory_services (via service_id FK)
- **FKs**:
  - service_id → L62 (CASCADE)
- **Key Fields**: slo_id, service_id, metric_name, target_value, threshold_warning, threshold_critical, measurement_window
- **Cascade**: CASCADE on service delete

### Phase 5: Remediation & Lifecycle (4 layers)

#### L67: work_service_breaches
- **Purpose**: SLO breach incidents
- **Parent**: work_service_level_objectives (via slo_id FK)
- **FKs**:
  - slo_id → L66 (CASCADE)
  - detecting_run_id → L64 (SET_NULL)
- **Key Fields**: breach_id, slo_id, detected_at, actual_value, threshold_exceeded, severity, status
- **Cascade**: CASCADE on SLO delete

#### L68: work_service_remediation_plans
- **Purpose**: Recovery plans for breaches
- **Parent**: work_service_breaches (via breach_id FK)
- **FKs**:
  - breach_id → L67 (CASCADE)
  - assigned_to (polymorphic)
- **Key Fields**: plan_id, breach_id, created_at, assigned_to_type, assigned_to_id, remediation_steps[], expected_resolution_time, status
- **Cascade**: CASCADE on breach delete

#### L69: work_service_revalidation_results
- **Purpose**: Post-remediation proof
- **Parent**: work_service_remediation_plans (via plan_id FK)
- **FKs**:
  - plan_id → L68 (CASCADE)
  - revalidation_run_id → L64 (SET_NULL)
- **Key Fields**: revalidation_id, plan_id, revalidation_run_id, revalidated_at, metric_value, passed, notes
- **Cascade**: CASCADE on plan delete

#### L70: work_service_lifecycle_transitions
- **Purpose**: Formal service state changes
- **Parent**: work_factory_services (via service_id FK)
- **FKs**:
  - service_id → L62 (CASCADE)
  - transition_approved_by (polymorphic)
- **Key Fields**: transition_id, service_id, from_status, to_status, transition_date, reason, approved_by_type, approved_by_id, evidence_ids[]
- **Cascade**: CASCADE on service delete

### Phase 6: Portfolio & Strategy (5 layers)

#### L71: work_factory_portfolio_views
- **Purpose**: Portfolio-level management view
- **Parent**: None (aggregate/view layer)
- **FKs**:
  - included_service_ids[] → L62
  - included_capability_ids[] → L61
- **Key Fields**: view_id, view_name, description, included_service_ids[], included_capability_ids[], filters{}, created_at, owner_type, owner_id
- **Cascade**: SET_NULL on service/capability delete

#### L72: work_factory_strategic_roadmaps
- **Purpose**: Forward-planning layer
- **Parent**: None (strategic planning)
- **FKs**:
  - portfolio_view_id → L71 (SET_NULL)
  - milestone_ids[] → L28 (SET_NULL)
- **Key Fields**: roadmap_id, roadmap_name, description, time_horizon, portfolio_view_id, planned_initiatives[], milestone_ids[], status
- **Cascade**: SET_NULL on portfolio view delete

#### L73: work_factory_investment_cases
- **Purpose**: Business justification artifacts
- **Parent**: work_factory_strategic_roadmaps (via roadmap_id FK)
- **FKs**:
  - roadmap_id → L72 (CASCADE)
  - related_capability_ids[] → L61
- **Key Fields**: case_id, roadmap_id, case_title, business_problem, proposed_solution, estimated_cost, expected_roi, related_capability_ids[], approval_status
- **Cascade**: CASCADE on roadmap delete

#### L74: work_factory_decision_packets
- **Purpose**: Formal governance decision artifacts
- **Parent**: work_factory_investment_cases (via case_id FK)
- **FKs**:
  - case_id → L73 (CASCADE)
  - decision_maker (polymorphic)
- **Key Fields**: packet_id, case_id, decision_question, options[], recommended_option, decision_maker_type, decision_maker_id, decision_date, rationale
- **Cascade**: CASCADE on case delete

#### L75: work_factory_execution_authorizations
- **Purpose**: Green-light authorization layer
- **Parent**: work_factory_decision_packets (via packet_id FK)
- **FKs**:
  - packet_id → L74 (CASCADE)
  - authorized_by (polymorphic)
- **Key Fields**: authorization_id, packet_id, authorized_at, authorized_by_type, authorized_by_id, authorization_scope, conditions[], expiration_date
- **Cascade**: CASCADE on decision packet delete

---

## DO Phase — Execution Plan

### Implementation Strategy: Fractal DPDCA Per Phase

For EACH phase (2, 3, 4, 5, 6):
1. **DISCOVER**: Review phase design, understand FK dependencies
2. **PLAN**: List all files to create/modify for this phase
3. **DO**: Implement all layers in phase (schemas, models, API, graph, docs)
4. **CHECK**: Validate schemas, test endpoints, verify FKs
5. **ACT**: Document results, commit with evidence

### File Creation Checklist (Per Layer)

For each layer LXX:
- [ ] schema/work_*.schema.json (JSON Schema definition)
- [ ] model/work_*.json (Seed data with empty objects array)
- [ ] Update api/layers.py LAYERS list (if needed)
- [ ] Update api/routers/base_layer.py (auto-handled by layers system)
- [ ] Update api/graph.py EDGE_TYPES (new edge definitions)
- [ ] Update docs/library/13-EXECUTION-LAYERS.md (layer documentation)
- [ ] Update docs/library/03-DATA-MODEL-REFERENCE.md (layer count + entry)
- [ ] Update README.md (layer catalog)

---

## CHECK Phase — Validation

Per phase after implementation:
1. Run validate-model.ps1 (0 violations required)
2. Query GET /model/layers (verify new layers present)
3. Query GET /model/work_*/fields (verify schemas match design)
4. Query GET /model/graph/edge-types (verify new edges)
5. Run pytest tests/ (all tests passing)
6. Run emoji policy test (pytest tests/test_no_emojis.py)

---

## ACT Phase — Evidence & Documentation

1. Commit per phase with detailed commit message
2. Update session notes (this file)
3. Record implementation evidence 
4. Push branch and create PR
5. Document lessons learned

---

## Implementation Order

**Phases 2-6 in sequence** (respect FK dependencies):

1. Phase 2 (L55, L57, L58) — Obligations depend on L54; patterns depend on L57
2. Phase 3 (L59, L60) — Pattern tracking depends on L58
3. Phase 4 (L61-L66) — Services depend on L61; SLOs depend on L62
4. Phase 5 (L67-L70) — Remediation depends on L66 breaches
5. Phase 6 (L71-L75) — Strategic layers depend on L62 services

---

## Next Immediate Action

Start Phase 2 implementation (L55, L57, L58):
1. Create schema/work_obligations.schema.json
2. Create schema/work_learning_feedback.schema.json
3. Create schema/work_reusable_patterns.schema.json
4. Create corresponding model/*.json files
5. Register in API (layers.py, graph.py)
6. Update documentation
7. Validate and test

---

**Status**: PLAN phase complete. Ready to proceed to DO phase (Phase 2 first).
