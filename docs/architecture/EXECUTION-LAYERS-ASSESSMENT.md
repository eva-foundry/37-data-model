# Execution Layers Assessment — DISCOVER Phase

**Session:** 40  
**Date:** March 8, 2026 6:48 AM ET  
**Assessor:** agent:copilot  
**Source:** docs/ADO/idea/01-27 (ChatGPT proposals, 26 files + README)  
**Phase:** DISCOVER → PLAN  

---

## 1. EXECUTIVE SUMMARY

ChatGPT proposed **24 new execution layers** (L52-L75) that transform EVA from a
structured metadata repository into a **governed software production runtime**.

**Verdict: CONDITIONAL GO — Phased Rollout**

- **Phase 1 (Immediate)**: 4 core execution layers (L52-L54, L56) — high value, low risk
- **Phase 2 (Near-term)**: 3 learning/obligation layers (L55, L57-L58) — moderate value
- **Phase 3-6 (Deferred)**: 17 remaining layers — pending Phase 1 operational validation

**Rationale**: 27-whats-next.txt itself warns: "don't add more layers now; focus on
execution workflows, evidence loops, governance automation." This assessment respects
that guidance while still capturing the core execution engine.

---

## 2. CURRENT STATE: 51 OPERATIONAL LAYERS

```
L0-L10    Application Model (services, personas, flags, containers, endpoints, schemas, screens, literals, agents, infra, requirements)
L12-L18   Control Plane (planes, connections, environments, cp_agents, cp_policies, cp_skills, cp_workflows)
L19-L21   Frontend Structural (components, hooks, ts_types)
L22-L25   Catalog Additions (mcp_servers, prompts, security_controls, runbooks) + Projects
L26-L30   Project & DPDCA (wbs, sprints, milestones, risks, decisions)
L31-L32   Observability (evidence, traces)
L33-L34   Governance Plane (workspace_config, project_work)
L35-L38   Agent Automation (github_rules, deployment_policies, testing_policies, validation_rules)
L42-L51   Infrastructure Monitoring (agent_execution_history, agent_performance_metrics, azure_infra, compliance_checks, cost_tracking, drift_detection, health_monitoring, incident_records, sla_tracking, capacity_planning)
```

**Gap**: L39-L41 unassigned. L11 renumbered to L31 (Evidence).

---

## 3. PROPOSED LAYERS: FULL CATALOG

### Group A — Core Execution Engine (L52-L56)

| Layer | Name | Purpose | Value | Risk |
|-------|------|---------|-------|------|
| L52 | `work_execution_units` | Operational work ledger — smallest governed unit of agent work | **Critical** | Low |
| L53 | `work_step_events` | Execution event stream — step-by-step timeline of L52 | **Critical** | Low |
| L54 | `work_decision_records` | Runtime decision ledger — decisions made during execution | **High** | Medium |
| L55 | `work_obligations` | Follow-up/obligation tracking from decisions and policies | Medium | Low |
| L56 | `work_outcomes` | Result ledger — realized outcomes vs expected | **High** | Low |

### Group B — Learning & Patterns (L57-L60)

| Layer | Name | Purpose | Value | Risk |
|-------|------|---------|-------|------|
| L57 | `work_learning_feedback` | Adaptive learning — lessons, tuning signals | **High** | Low |
| L58 | `work_reusable_patterns` | Pattern catalog — approved execution templates | **High** | Medium |
| L59 | `work_pattern_applications` | Pattern usage tracking per work unit | Medium | Low |
| L60 | `work_pattern_performance_profiles` | Aggregate pattern performance | Medium | Low |

### Group C — Factory Services (L61-L66)

| Layer | Name | Purpose | Value | Risk |
|-------|------|---------|-------|------|
| L61 | `work_factory_capabilities` | Capability catalog backed by patterns | Medium | Medium |
| L62 | `work_factory_services` | Service packaging of capabilities | Medium | High |
| L63 | `work_service_requests` | Demand intake for services | Medium | Medium |
| L64 | `work_service_runs` | Service runtime execution instances | Medium | Medium |
| L65 | `work_service_performance_profiles` | Aggregate service performance | Low | Low |
| L66 | `work_service_level_objectives` | SLO definitions and thresholds | Medium | Medium |

### Group D — Remediation & Lifecycle (L67-L70)

| Layer | Name | Purpose | Value | Risk |
|-------|------|---------|-------|------|
| L67 | `work_service_breaches` | SLO breach incidents | Low | Low |
| L68 | `work_service_remediation_plans` | Recovery plans for breaches | Low | Medium |
| L69 | `work_service_revalidation_results` | Post-remediation proof | Low | Low |
| L70 | `work_service_lifecycle_transitions` | Formal service state changes | Low | Low |

### Group E — Portfolio & Strategy (L71-L75)

| Layer | Name | Purpose | Value | Risk |
|-------|------|---------|-------|------|
| L71 | `work_factory_portfolio_views` | Portfolio-level management view | Low | Low |
| L72 | `work_factory_strategic_roadmaps` | Forward-planning layer | Low | Medium |
| L73 | `work_factory_investment_cases` | Business justification artifacts | Low | Medium |
| L74 | `work_factory_decision_packets` | Formal governance decision artifacts | Low | Low |
| L75 | `work_factory_execution_authorizations` | Green-light authorization layer | Medium | Medium |

---

## 4. OVERLAP ANALYSIS

Three critical overlaps must be resolved before implementation:

### 4.1 L54 work_decision_records vs L30 decisions

| Dimension | L30 decisions (existing) | L54 work_decision_records (proposed) |
|-----------|------------------------|--------------------------------------|
| Scope | Architecture Decision Records (ADRs) | Runtime execution decisions |
| Lifetime | Long-lived (months/years) | Short-lived (per work unit) |
| Author | Human architects | Agents + humans during execution |
| Examples | "Use Cosmos DB", "Adopt DPDCA" | "Retry failed test", "Skip optional gate" |
| FK target | Project-level | Work unit-level (L52) |

**Resolution**: Keep both. L30 = strategic/architectural. L54 = tactical/runtime.
Add `decision_scope` field to L54 with values: `execution`, `governance`, `quality`, `deployment`, `exception`.

### 4.2 L52 work_execution_units vs L34 project_work

| Dimension | L34 project_work (existing) | L52 work_execution_units (proposed) |
|-----------|---------------------------|-------------------------------------|
| Scope | Per-session work record | Per-task work record |
| Granularity | 1 record per coding session | 1+ records per session |
| Content | Summary, tasks[], blockers[], metrics{} | Full execution context, gates, evidence |
| FK | project_id → L25 | project_id + wbs_id + sprint_id + agent_id |

**Resolution**: L34 remains the session-level container. L52 is the task-level execution record.
L52 gets `project_work_id` FK to L34.

### 4.3 L53 work_step_events vs L32 traces

| Dimension | L32 traces (existing) | L53 work_step_events (proposed) |
|-----------|-----------------------|---------------------------------|
| Scope | LM call telemetry | Workflow step progression |
| Content | model, tokens, cost, latency | State transitions, actions, gate results |
| Granularity | Per LLM API call | Per workflow step |

**Resolution**: Keep both. L32 = LLM-specific telemetry. L53 = workflow-level events.
L53 events MAY reference L32 trace_ids when an LLM call occurs during a step.

---

## 5. PHASED IMPLEMENTATION PLAN

### Phase 1: Core Execution Engine (4 layers — L52, L53, L54, L56)

**Goal**: Establish the governed execution loop: work → steps → decisions → outcomes.

Layers:
- L52 `work_execution_units` — The foundational work ledger
- L53 `work_step_events` — Ordered event stream for each work unit
- L54 `work_decision_records` — Runtime decision capture
- L56 `work_outcomes` — Result and outcome tracking

**Why L55 (obligations) is deferred**: Obligations require a decision framework that
needs L54 to be operational first. Add in Phase 2 after decisions are flowing.

### Phase 2: Obligations + Learning (3 layers — L55, L57, L58)

**Goal**: Close the feedback loop. Decisions create obligations; outcomes create lessons.

Layers:
- L55 `work_obligations` — Enforceable follow-ups from decisions/policies
- L57 `work_learning_feedback` — Lessons learned, tuning signals
- L58 `work_reusable_patterns` — Approved execution templates

### Phase 3: Pattern Performance (2 layers — L59, L60)

**Goal**: Measure pattern effectiveness across applications.

### Phase 4: Factory Services (6 layers — L61-L66)

**Goal**: Package capabilities into consumable services with SLOs.

### Phase 5: Remediation & Lifecycle (4 layers — L67-L70)

**Goal**: SLO breach handling and governed recovery.

### Phase 6: Portfolio & Strategy (5 layers — L71-L75)

**Goal**: Portfolio management, strategic planning, investment justification, authorization.

---

## 6. FK DESIGN — Phase 1

### L52 work_execution_units — Foreign Keys

```
L52.project_id           → L25 projects.id            RESTRICT
L52.wbs_id               → L26 wbs.id                 RESTRICT
L52.sprint_id            → L27 sprints.sprint_id       SET_NULL
L52.milestone_id         → L28 milestones.milestone_id SET_NULL
L52.assigned_to_id       → L8  agents.id | L15 cp_agents.id  RESTRICT (polymorphic)
L52.workflow_id          → L18 cp_workflows.id         SET_NULL
L52.project_work_id      → L34 project_work.id         SET_NULL
L52.parent_work_unit_id  → L52 (self-ref)              SET_NULL
L52.depends_on[]         → L52 (self-ref array)        RESTRICT
L52.policy_refs[]        → L16 cp_policies.id          SET_NULL
L52.evidence_ids[]       → L31 evidence.id             SET_NULL
```

### L53 work_step_events — Foreign Keys

```
L53.work_unit_id         → L52 work_execution_units.work_unit_id  CASCADE
L53.evidence_ids[]       → L31 evidence.id             SET_NULL
L53.trace_ids[]          → L32 traces.id               SET_NULL
L53.decision_ids[]       → L54 work_decision_records.id SET_NULL
```

### L54 work_decision_records — Foreign Keys

```
L54.work_unit_id         → L52 work_execution_units.work_unit_id  CASCADE
L54.policy_refs[]        → L16 cp_policies.id          SET_NULL
L54.evidence_refs[]      → L31 evidence.id             SET_NULL
L54.obligation_ids[]     → L55 work_obligations.id     SET_NULL (Phase 2 FK)
```

### L56 work_outcomes — Foreign Keys

```
L56.work_unit_id         → L52 work_execution_units.work_unit_id  CASCADE
L56.evidence_ids[]       → L31 evidence.id             SET_NULL
L56.decision_ids[]       → L54 work_decision_records.id SET_NULL
L56.learning_ids[]       → L57 work_learning_feedback.id SET_NULL (Phase 2 FK)
```

### New Edge Types for Graph (extending graph.py EDGE_TYPES)

```
Edge Type               From Layer              To Layer                Cascade
----------------------  ----------------------  ----------------------  -------
executes_for            work_execution_units    projects                RESTRICT
executes_wbs            work_execution_units    wbs                     RESTRICT
executes_in_sprint      work_execution_units    sprints                 SET_NULL
assigned_to_agent       work_execution_units    agents/cp_agents        RESTRICT
governed_by_workflow    work_execution_units    cp_workflows            SET_NULL
governed_by_policy      work_execution_units    cp_policies             SET_NULL
produces_evidence       work_execution_units    evidence                SET_NULL
step_of                 work_step_events        work_execution_units    CASCADE
decided_during          work_decision_records   work_execution_units    CASCADE
outcome_of              work_outcomes           work_execution_units    CASCADE
step_references_trace   work_step_events        traces                  SET_NULL
```

---

## 7. NAMING CONVENTION VALIDATION

All proposed layers follow `work_` prefix convention. This is consistent with:
- `project_work` (L34) — already uses `work` namespace
- `cp_` prefix for control-plane layers (L15-L18) — established pattern

The `work_` prefix cleanly separates execution layers from catalog layers.

**Names approved as-is**: All 24 layer names are consistent, descriptive, and
follow the EVA naming convention (lowercase, underscores, no abbreviations).

---

## 8. SCHEMA REQUIREMENTS (Phase 1)

Each Phase 1 layer needs:
1. JSON Schema (schema/work_execution_units.schema.json, etc.)
2. Model JSON seed file (model/work_execution_units.json)
3. API router registration in server.py
4. Graph edge type registration in graph.py
5. Library documentation (docs/library/13-EXECUTION-LAYERS.md)

---

## 9. RISKS

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| R1 | Schema complexity slows adoption | Medium | High | Start with minimal required fields; expand iteratively |
| R2 | Agent overhead per work unit | Medium | Medium | Make evidence emission optional outside DPDCA D3 phase |
| R3 | Cosmos RU cost increase | Low | Medium | L53 events are write-heavy; use TTL for old events |
| R4 | Overlap confusion (L30/L54, L34/L52) | Medium | High | Document scope boundaries clearly in library |
| R5 | 24 layers overwhelm team | High | High | Phased rollout; only Phase 1 in this sprint |

---

## 10. FILES TO UPDATE

### New Files (Phase 1 — DO phase)
- `schema/work_execution_units.schema.json`
- `schema/work_step_events.schema.json`
- `schema/work_decision_records.schema.json`
- `schema/work_outcomes.schema.json`
- `model/work_execution_units.json`
- `model/work_step_events.json`
- `model/work_decision_records.json`
- `model/work_outcomes.json`
- `docs/library/13-EXECUTION-LAYERS.md`

### Updated Files (Phase 1 — DO phase)
- `README.md` — Add L52-L56 to layer catalog, update layer count
- `docs/library/README.md` — Add 13-EXECUTION-LAYERS.md to index
- `docs/library/03-DATA-MODEL-REFERENCE.md` — Add 4 new layer entries, update count from 51 to 55
- `docs/library/10-FK-ENHANCEMENT.md` — Add 11 new edge types to FK design
- `api/graph.py` — Register new edge types in EDGE_TYPES
- `api/server.py` — Register 4 new layer routers

### Architecture Documentation Updates
- `docs/architecture/EXECUTION-LAYERS-ASSESSMENT.md` — This file (created)
- `docs/architecture/EXECUTION-LAYERS-FK-DESIGN.md` — Detailed FK specification (to create)

---

## 11. DO/CHECK/ACT IMPLEMENTATION PLAN

### DO Phase: Implementation (11 tasks)

#### Schema & Data Creation (Tasks 8-11)
- [ ] **DO-1**: Create L52 schema + seed JSON
  - File: `schema/work_execution_units.schema.json`
  - File: `model/work_execution_units.json`
  - Required fields: work_unit_id, project_id, wbs_id, sprint_id, title, status, assigned_to_type, assigned_to_id, workflow_id, instruction_type, instruction_payload

- [ ] **DO-2**: Create L53 schema + seed JSON
  - File: `schema/work_step_events.schema.json`
  - File: `model/work_step_events.json`
  - Required fields: event_id, work_unit_id, sequence_no, event_type, timestamp, actor_type, actor_id, state_before, state_after

- [ ] **DO-3**: Create L54 schema + seed JSON
  - File: `schema/work_decision_records.schema.json`
  - File: `model/work_decision_records.json`
  - Required fields: decision_id, work_unit_id, decision_question, options_considered, selected_option_id, decision_scope, basis, rationale

- [ ] **DO-4**: Create L56 schema + seed JSON
  - File: `schema/work_outcomes.schema.json`
  - File: `model/work_outcomes.json`
  - Required fields: outcome_id, work_unit_id, result (technical, governance, quality, operational, business), expected_vs_actual, delivered_changes

#### API & Graph Registration (Tasks 12-13)
- [ ] **DO-5**: Register routers in server.py
  - Add router registration for: work_execution_units, work_step_events, work_decision_records, work_outcomes
  - Location: `api/server.py` app.include_router() calls

- [ ] **DO-6**: Register edges in graph.py
  - Add 11 new edge types to EDGE_TYPES dict:
    - executes_for, executes_wbs, executes_in_sprint, assigned_to_agent
    - governed_by_workflow, governed_by_policy, produces_evidence
    - step_of, decided_during, outcome_of, step_references_trace
  - Location: `api/graph.py` EDGE_TYPES constant

#### Documentation Updates (Tasks 14-18)
- [ ] **DO-7**: Create library doc 13-EXECUTION-LAYERS.md
  - File: `docs/library/13-EXECUTION-LAYERS.md`
  - Content: Full specification of L52-L56, usage patterns, DPDCA integration, FK diagram

- [ ] **DO-8**: Update README layer catalog
  - File: `README.md`
  - Update: Layer 52-56 descriptions in model layers section
  - Update: Layer count from 51 to 55

- [ ] **DO-9**: Update 03-DATA-MODEL-REFERENCE.md
  - File: `docs/library/03-DATA-MODEL-REFERENCE.md`
  - Add: 4 new layer entries with counts, schema refs, key fields
  - Update: Header layer count from 51 to 55

- [ ] **DO-10**: Update library README index
  - File: `docs/library/README.md`
  - Add: Entry for 13-EXECUTION-LAYERS.md in file index table

- [ ] **DO-11**: Update 10-FK-ENHANCEMENT.md
  - File: `docs/library/10-FK-ENHANCEMENT.md`
  - Add: 11 new edge types to 27-edge type table
  - Update: Edge type count from 27 to 38

### CHECK Phase: Validation (4 tasks)

- [ ] **CHECK-1**: Run validate-model
  - Command: `.\scripts\validate-model.ps1`
  - Expected: 0 violations (PASS status)
  - Verify: All FK references resolve (no orphans)

- [ ] **CHECK-2**: Query API for new layers
  - Test: `GET /model/layers` returns 55 layers
  - Test: `GET /model/work_execution_units/` returns empty array (seed data)
  - Test: `GET /model/work_execution_units/fields` returns schema
  - Test: Same for L53, L54, L56

- [ ] **CHECK-3**: Verify FK edge types
  - Test: `GET /model/graph/edge-types` includes all 11 new edge types
  - Verify: from_layer and to_layer match FK design
  - Verify: cascade policies match specification

- [ ] **CHECK-4**: Verify layer count = 55
  - Confirm: `GET /model/agent-summary` shows 55 layers
  - Confirm: `GET /health` shows updated layer_count
  - Confirm: README, library docs all show 55

### ACT Phase: Evidence & Closure (3 tasks)

- [ ] **ACT-1**: Record evidence receipt
  - Use: `.github/scripts/evidence_generator.py`
  - Create: Evidence record for this session (Session 40)
  - Fields: sprint_id=DATA-MODEL-S8, story_id=DM-EXEC-LAYERS-001, phase=D3
  - Validation: test_result=PASS (validate-model), lint_result=PASS
  - Artifacts: 4 schemas, 4 model JSONs, 6 docs updated, 2 API files updated

- [ ] **ACT-2**: Update project_work session
  - Layer: L34 project_work
  - Update: Current 37-data-model session record
  - Add: Task completion for "Add execution layers L52-L56"
  - Metrics: files_modified=16, duration_minutes=~90, mti_score=100

- [ ] **ACT-3**: Commit + push to cloud
  - Branch: Create `feature/execution-layers-phase1`
  - Commit: "feat: Add execution layers L52-L56 (Phase 1) - work units, events, decisions, outcomes"
  - Push: Push to remote
  - Deploy: Run deployment to update cloud API (ACA revision)
  - Verify: Cloud API returns 55 layers after deployment

---

## 12. SUCCESS CRITERIA

Phase 1 complete when:
- ✅ `validate-model.ps1` exits 0 (zero violations)
- ✅ Cloud API `/model/layers` returns 55 layers
- ✅ All 4 new layers queryable via API
- ✅ Graph includes 11 new edge types
- ✅ Documentation updated (README, library, FK docs)
- ✅ Evidence receipt recorded in L31
- ✅ Session updated in L34 project_work

---

## 13. NEXT SESSION: Phase 2 Preview

Phase 2 (3 layers — L55, L57, L58) proposed for Session 41:
- L55 `work_obligations` — Follow-up tracking from decisions
- L57 `work_learning_feedback` — Adaptive learning layer
- L58 `work_reusable_patterns` — Pattern catalog

Phase 2 deferred until Phase 1 is operationally validated with real work units flowing through the system.

**Recommendation**: Run 2-3 sprints with Phase 1 layers before expanding to Phase 2.
