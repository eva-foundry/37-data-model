# D³PDCA Data Model Assessment & Enhancement Specification
## Session 45 - March 13, 2026

**Status**: FINAL VALIDATED - Ready for Implementation  
**Scope**: Complete gap analysis + new Domain 13 + infrastructure separation  
**Impact**: 12 → 13 ontology domains, 115 → 123 layers, 1 → 3 Cosmos containers

---

## 1. Current State Assessment

### Live API Query (March 13, 2026)

```
Store: Cosmos DB (cloud)
Total objects: 6,890
Operational layers: 115+
Domains: 12
Partition key: /layer (single container: model_objects)
```

### 12-Domain Ontology (Current)

| # | Domain | Layers | Objects | D³PDCA Phase |
|---|--------|--------|---------|--------------|
| 1 | System Architecture | 10 | 422 | DISCOVER |
| 2 | Identity & Access | 3 | 50 | DISCOVER |
| 3 | AI Runtime | 6 | 71 | DISCOVER + DO |
| 4 | User Interface | 5 | 585 | DO |
| 5 | Control Plane | 12 | 248 | DISCOVER + DO |
| 6 | Governance & Policy | 10 | 102 | PLAN + CHECK |
| 7 | Project & PM | 9 | 3,575 | PLAN + ACT |
| 8 | DevOps & Delivery | 10 | 272 | DO + RECORD |
| 9 | Observability & Evidence | 13 | 407 | CHECK + ACT |
| 10 | Infrastructure & FinOps | 9 | 85 | ACT + CHECK |
| 11 | Execution Engine | 19 | ~17 | DO (core runtime) |
| 12 | Strategy & Portfolio | 5 | 0 | DISCOVER + PLAN |
| | **TOTAL** | **111+** | **6,890** | |

### DPDCA Lifecycle Mapping (As Documented)

```
DISCOVER  → Domains 1, 2, 3, 5    (learn what exists)
PLAN      → Domains 6, 7, 12      (read rules, backlog, strategy)
DO        → Domains 3, 4, 8, 11   (execute work)
CHECK     → Domains 6, 9          (validate gates, record evidence)
ACT       → Domains 7, 9, 10      (update backlog, costs, metrics)
```

**Observation**: This mapping treats DISCOVER as "learn what already exists in the model." It does NOT cover:
- Sensing external reality (environment scan, stakeholder input)
- Problem framing (context maps, assumptions, blind spots)
- Opportunity detection (what should change)
- Continuous re-discovery (feedback loops)

---

## 2. Gap Analysis: D³PDCA vs Current Schemas

### What D³PDCA Requires

The Senior Advisor's D³PDCA model adds three essential capabilities:

```
1. DISCOVER (Sense-Making) — "What is really going on?"
   - Environmental sensing (continuous, parallel)
   - Context mapping (stakeholders, systems, boundaries)
   - Assumption tracking (confidence levels, risk exposure)
   - Pattern detection (trends, anomalies, opportunities)
   - Risk identification (threats, blind spots, dependencies)
   
2. DEFINE (Problem Framing) — "What should we do about it?"
   - Mission formalization (grounded in discovery)
   - Success criteria (tied to evidence, not assumptions)
   - Scope boundaries (in/out, explicit)
   - Stakeholder alignment (sign-offs)

3. RE-DISCOVER (Continuous Loop) — "What changed?"
   - Assumption validation (which ones broke?)
   - Environmental drift (what shifted?)
   - New risk surfacing (what emerged?)
   - Trigger evaluation (start new mission?)
```

### Layer-by-Layer Gap Mapping

| D³PDCA Capability | Existing Layer(s) | Coverage | Gap |
|---|---|---|---|
| **Environmental sensing** | L44 azure_infrastructure, L49 infrastructure_drift | PARTIAL - Only infra | No stakeholder/market/policy sensing |
| **Context mapping** | None | MISSING | No layer for context maps, system boundaries |
| **Assumption tracking** | None | MISSING | No layer for assumptions with confidence levels |
| **Pattern detection** | L50 performance_trends | PARTIAL - Only perf | No anomaly detection, opportunity scoring |
| **Risk identification** | L30 risks | PARTIAL | Covers project risks, not discovery risks |
| **Opportunity tracking** | None | MISSING | No layer for opportunities (distinct from risks) |
| **Sensor definitions** | None | MISSING | No layer for defining automated sensors |
| **Sensor outputs** | L42 agent_execution_history | PARTIAL | Covers agent runs, not sensor data |
| **Mission definitions** | L35 project_work | PARTIAL | Covers work sessions, not grounded missions |
| **Mission phases** | L52 work_execution_units | PARTIAL | Covers work units, not mission lifecycle |
| **Discovery evidence** | L33 evidence | PARTIAL | Covers DPDCA receipts, not discovery outputs |
| **Stakeholder sign-offs** | None | MISSING | No layer for approval workflows on discovery |
| **Assumption validation** | None | MISSING | No layer for tracking assumption violations |
| **Environmental drift** | L49 infrastructure_drift | PARTIAL - Only infra | No broader environmental drift |
| **Continuous sensing** | None | MISSING | No layer for sensor scheduling/orchestration |

### Summary

| Category | Existing | Partial | Missing | Total Needed |
|----------|----------|---------|---------|-------------|
| DISCOVER | 0 | 5 | 7 | **8 new layers** |
| DEFINE | 0 | 2 | 2 | **2 layers (extend existing)** |
| RE-DISCOVER | 0 | 2 | 3 | **3 layers (2 new + 1 extend)** |
| **Total** | **0** | **9** | **12** | **8 new + 5 extend** |

**Verdict**: The current data model has **zero complete coverage** for the Discovery phase. 9 layers offer partial help, but 8 entirely new layers are needed. This is the biggest architectural gap in the model.

---

## 3. New Domain: Domain 13 — Discovery & Sense-Making

### Rationale

The 12-domain ontology maps well to PLAN→DO→CHECK→ACT but has no home for DISCOVER.

Current DISCOVER mapping (Domains 1, 2, 3, 5) means "read what's already in the model." Real discovery means **sensing external reality** — environment, stakeholders, assumptions, opportunities, threats.

**Solution**: Add **Domain 13 — Discovery & Sense-Making**

```
12 existing domains    →    13 domains
                            + Domain 13: Discovery & Sense-Making
                            
115 existing layers    →    123 layers (8 new)
                            
6,890 existing objects →    grows with sensor data (high volume)
```

### Domain 13 Layer Definitions

#### L122: discovery_contexts

**Purpose**: Context maps — stakeholders, systems, boundaries, constraints, unknowns

**Schema**:
```json
{
  "id": "ctx-{project_id}-{YYYYMMDD}",
  "layer": "discovery_contexts",
  "project_id": "string (FK → L26/projects)",
  "mission_id": "string (FK → L127/missions, optional)",
  "context_type": "enum: stakeholder_map | system_boundary | constraint_map | environment_scan",
  "title": "string",
  "description": "string",
  "stakeholders": [
    {
      "name": "string",
      "role": "string",
      "influence": "enum: HIGH | MEDIUM | LOW",
      "interest": "enum: HIGH | MEDIUM | LOW",
      "engagement_strategy": "string"
    }
  ],
  "systems_in_scope": ["string (FK → L1/services or L26/projects)"],
  "boundaries": {
    "in_scope": ["string"],
    "out_of_scope": ["string"],
    "grey_zone": ["string (needs clarification)"]
  },
  "constraints": [
    {
      "type": "enum: time | resource | technical | policy | organizational",
      "description": "string",
      "severity": "enum: HARD | SOFT | FLEXIBLE"
    }
  ],
  "unknowns": ["string"],
  "confidence_level": "number (0.0-1.0)",
  "evidence_sources": ["string (FK → L33/evidence)"],
  "created_by": "string",
  "created_at": "ISO 8601",
  "validated_by": "string (stakeholder who signed off)",
  "validated_at": "ISO 8601 (null if not validated)",
  "is_active": true
}
```

**Relationships**: 
- Parent: L26/projects, L127/missions
- Child: L123/discovery_assumptions, L125/discovery_opportunities
- Edge types: `grounds`, `identifies`, `constrains`

---

#### L123: discovery_assumptions

**Purpose**: Assumption registry — every assumption documented with confidence level, risk exposure, and validation status

**Schema**:
```json
{
  "id": "asm-{project_id}-{seq}",
  "layer": "discovery_assumptions",
  "project_id": "string (FK → L26/projects)",
  "context_id": "string (FK → L122/discovery_contexts)",
  "mission_id": "string (FK → L127/missions, optional)",
  "assumption": "string (the assumption statement)",
  "category": "enum: technical | organizational | market | resource | timeline | stakeholder",
  "confidence": "enum: HIGH | MEDIUM | LOW",
  "confidence_score": "number (0.0-1.0)",
  "risk_if_wrong": "string (what happens if this assumption is violated)",
  "risk_exposure": "enum: CRITICAL | HIGH | MEDIUM | LOW",
  "validation_method": "string (how to verify this assumption)",
  "validation_status": "enum: UNVALIDATED | VALIDATING | VALIDATED | VIOLATED | RETIRED",
  "validated_at": "ISO 8601 (null if unvalidated)",
  "validated_by": "string",
  "violation_detected_at": "ISO 8601 (null if not violated)",
  "violation_evidence": "string (FK → L33/evidence, null if not violated)",
  "mitigation_strategy": "string (what to do if violated)",
  "source": "enum: discovery | interview | data_analysis | expert_judgment | historical",
  "created_by": "string",
  "created_at": "ISO 8601",
  "is_active": true
}
```

**Relationships**:
- Parent: L122/discovery_contexts
- Child: L126/assumption_validations
- Edge types: `assumes`, `risks`, `validates`

---

#### L124: discovery_risks

**Purpose**: Discovery-phase risks — threats identified BEFORE execution, distinct from project risks (L30)

**Schema**:
```json
{
  "id": "drisk-{project_id}-{seq}",
  "layer": "discovery_risks",
  "project_id": "string (FK → L26/projects)",
  "context_id": "string (FK → L122/discovery_contexts)",
  "mission_id": "string (FK → L127/missions, optional)",
  "risk_title": "string",
  "risk_description": "string",
  "risk_type": "enum: threat | blind_spot | dependency | assumption_failure | environmental",
  "probability": "enum: HIGH | MEDIUM | LOW",
  "probability_score": "number (0.0-1.0)",
  "impact": "enum: CRITICAL | HIGH | MEDIUM | LOW",
  "impact_score": "number (0.0-1.0)",
  "risk_score": "number (probability_score * impact_score)",
  "affected_assumptions": ["string (FK → L123/discovery_assumptions)"],
  "mitigation_strategy": "string",
  "mitigation_owner": "string",
  "mitigation_status": "enum: PLANNED | IN_PROGRESS | COMPLETED | ACCEPTED",
  "detection_method": "enum: sensor | manual_analysis | expert_judgment | historical_pattern",
  "source_sensor_id": "string (FK → L128/discovery_sensors, optional)",
  "created_by": "string",
  "created_at": "ISO 8601",
  "is_active": true
}
```

**Relationships**:
- Parent: L122/discovery_contexts
- Sibling: L30/risks (project-level risks migrate here when discovered pre-execution)
- Edge types: `threatens`, `mitigates`, `detects`

**Design note**: L30 (risks) stays for project-level operational risks. L124 captures discovery-phase pre-execution risks. A risk can migrate from L124 → L30 when a mission proceeds to execution.

---

#### L125: discovery_opportunities

**Purpose**: Opportunities identified during discovery — ranked by impact and effort

**Schema**:
```json
{
  "id": "opp-{project_id}-{seq}",
  "layer": "discovery_opportunities",
  "project_id": "string (FK → L26/projects)",
  "context_id": "string (FK → L122/discovery_contexts)",
  "mission_id": "string (FK → L127/missions, optional)",
  "opportunity_title": "string",
  "opportunity_description": "string",
  "category": "enum: quick_win | strategic | optimization | innovation | compliance | debt_reduction",
  "impact": "enum: HIGH | MEDIUM | LOW",
  "impact_score": "number (0.0-1.0)",
  "effort": "enum: HIGH | MEDIUM | LOW",
  "effort_hours": "number (estimated hours)",
  "roi_estimate": "string (e.g., '10x', '$50K/year savings', '87% time reduction')",
  "priority_rank": "number (1 = highest)",
  "status": "enum: IDENTIFIED | EVALUATED | APPROVED | IN_PROGRESS | REALIZED | DEFERRED",
  "related_risks": ["string (FK → L124/discovery_risks)"],
  "related_assumptions": ["string (FK → L123/discovery_assumptions)"],
  "evidence_supporting": ["string (FK → L33/evidence)"],
  "created_by": "string",
  "created_at": "ISO 8601",
  "is_active": true
}
```

**Relationships**:
- Parent: L122/discovery_contexts
- Edge types: `enables`, `improves`, `requires`

---

#### L126: assumption_validations

**Purpose**: Immutable audit trail of assumption validation events — tracks confidence changes over time

**Schema**:
```json
{
  "id": "aval-{assumption_id}-{YYYYMMDD-HHMMSS}",
  "layer": "assumption_validations",
  "assumption_id": "string (FK → L123/discovery_assumptions)",
  "project_id": "string (FK → L26/projects)",
  "validation_type": "enum: CONFIRMED | WEAKENED | VIOLATED | RETIRED",
  "previous_confidence": "number (0.0-1.0)",
  "new_confidence": "number (0.0-1.0)",
  "evidence_id": "string (FK → L33/evidence)",
  "validation_method": "string",
  "validator": "string (agent or human)",
  "notes": "string",
  "trigger": "enum: scheduled | sensor_alert | manual_review | mission_complete",
  "created_at": "ISO 8601"
}
```

**Relationships**:
- Parent: L123/discovery_assumptions
- Edge types: `validates`, `invalidates`

**Design note**: This is an **append-only** immutable layer (like L33/evidence). Once written, records are never updated — only new records are added. This creates a confidence history for every assumption.

---

#### L127: missions

**Purpose**: Mission lifecycle tracking — from discovery grounding through execution to completion

**Schema**:
```json
{
  "id": "msn-{project_id}-{YYYYMMDD}",
  "layer": "missions",
  "project_id": "string (FK → L26/projects)",
  "mission_type": "enum: documentation | refactoring | feature | governance | multi_project",
  "mission_title": "string",
  "mission_statement": "string (one sentence, grounded in discovery)",
  "lifecycle_phase": "enum: DISCOVER | DEFINE | PLAN | DO | CHECK | ACT | RE_DISCOVER | COMPLETE | ABORTED",
  "discovery_context_id": "string (FK → L122/discovery_contexts)",
  "discovery_grounding": {
    "problem_statement": "string (from context map)",
    "assumptions_verified": ["string (FK → L123/discovery_assumptions, validated=true)"],
    "risks_mitigated": ["string (FK → L124/discovery_risks, mitigation_status=COMPLETED)"],
    "opportunities_targeted": ["string (FK → L125/discovery_opportunities)"],
    "stakeholder_signoffs": [
      {
        "stakeholder": "string",
        "role": "string",
        "signed_at": "ISO 8601",
        "grounding_valid": true
      }
    ]
  },
  "success_criteria": [
    {
      "criterion": "string",
      "measurable": true,
      "tied_to_discovery": "string (reference to discovery finding)",
      "status": "enum: NOT_EVALUATED | PASS | FAIL"
    }
  ],
  "scope": {
    "in": ["string"],
    "out": ["string"]
  },
  "quality_gates": {
    "syntax": "enum: PASS | FAIL | NOT_EVALUATED",
    "tests": "enum: PASS | FAIL | NOT_EVALUATED",
    "documentation": "enum: PASS | FAIL | NOT_EVALUATED",
    "audit_trail": "enum: PASS | FAIL | NOT_EVALUATED",
    "security": "enum: PASS | FAIL | NOT_EVALUATED"
  },
  "execution": {
    "agent_type": "enum: cloud_agent | local_agent | human | hybrid",
    "started_at": "ISO 8601",
    "completed_at": "ISO 8601",
    "duration_hours": "number",
    "phases_completed": "number",
    "phases_total": "number",
    "steering_count": "number (human corrections during execution)",
    "pr_url": "string (GitHub PR URL)",
    "branch": "string"
  },
  "evidence_ids": ["string (FK → L33/evidence)"],
  "created_by": "string",
  "created_at": "ISO 8601",
  "is_active": true
}
```

**Relationships**:
- Parent: L26/projects, L122/discovery_contexts
- Child: L33/evidence (mission evidence), L52/work_execution_units
- Edge types: `executes`, `grounds`, `produces`, `validates`

---

#### L128: discovery_sensors

**Purpose**: Sensor registry — defines automated sensing capabilities, schedules, and targets

**Schema**:
```json
{
  "id": "sensor-{domain}-{name}",
  "layer": "discovery_sensors",
  "sensor_name": "string",
  "sensor_type": "enum: governance | infrastructure | security | data_quality | stakeholder | cost | performance",
  "domain": "enum: Domain1..Domain13",
  "description": "string (what this sensor detects)",
  "target": "string (what it monitors — API endpoint, resource group, project set, etc.)",
  "schedule": {
    "frequency": "enum: continuous | hourly | every_6h | daily | weekly | on_demand",
    "cron_expression": "string (optional)",
    "last_run": "ISO 8601",
    "next_run": "ISO 8601"
  },
  "output_format": "enum: json | jsonl | markdown",
  "output_layer": "string (where results are written — typically discovery_signals)",
  "thresholds": {
    "anomaly_threshold": "number (0.0-1.0, triggers alert if exceeded)",
    "warning_threshold": "number (0.0-1.0)",
    "critical_threshold": "number (0.0-1.0)"
  },
  "dependencies": ["string (APIs, tools, MCP servers needed)"],
  "status": "enum: ACTIVE | PAUSED | DISABLED | ERROR",
  "implementation": {
    "script_path": "string (path to sensor script)",
    "runtime": "enum: powershell | python | node | github_action",
    "mcp_tool": "string (optional MCP tool name)"
  },
  "created_by": "string",
  "created_at": "ISO 8601",
  "is_active": true
}
```

**Relationships**:
- Parent: None (top-level registry)
- Child: L129/discovery_signals
- Edge types: `monitors`, `produces`, `detects`

---

#### L129: discovery_signals

**Purpose**: Sensor outputs — continuous stream of environmental signals, anomalies, trends

**Schema**:
```json
{
  "id": "sig-{sensor_id}-{YYYYMMDD-HHMMSS}",
  "layer": "discovery_signals",
  "sensor_id": "string (FK → L128/discovery_sensors)",
  "project_id": "string (FK → L26/projects, optional — null for workspace-level signals)",
  "signal_type": "enum: anomaly | trend | threshold_breach | opportunity | risk_indicator | status_change",
  "severity": "enum: CRITICAL | HIGH | MEDIUM | LOW | INFO",
  "title": "string",
  "description": "string",
  "data": {
    "metric_name": "string",
    "metric_value": "number",
    "baseline_value": "number",
    "deviation_pct": "number",
    "trend_direction": "enum: UP | DOWN | STABLE | VOLATILE"
  },
  "affected_entities": ["string (layer/id references)"],
  "recommended_action": "string (what to do about this signal)",
  "auto_triaged": true,
  "triage_result": "enum: ACTIONABLE | NOISE | NEEDS_REVIEW | ESCALATE",
  "acknowledged_by": "string (null if auto-processed)",
  "acknowledged_at": "ISO 8601",
  "created_at": "ISO 8601"
}
```

**Relationships**:
- Parent: L128/discovery_sensors
- Child: L122/discovery_contexts (signals feed context creation)
- Edge types: `detects`, `triggers`, `informs`

**Design note**: This is a **high-volume, append-only** layer. Signals are never updated — only new ones written. Retention policy: 90 days active, then archive. This is the primary candidate for infrastructure separation (see Section 5).

---

### Domain 13 Summary

| Layer | L# | Purpose | Volume | Mutability |
|-------|----|---------|--------|-----------|
| discovery_contexts | L122 | Context maps, stakeholder maps, boundaries | LOW | Mutable |
| discovery_assumptions | L123 | Assumptions with confidence + risk exposure | MEDIUM | Mutable (status changes) |
| discovery_risks | L124 | Pre-execution threats, blind spots | MEDIUM | Mutable (status changes) |
| discovery_opportunities | L125 | Ranked improvement opportunities | LOW | Mutable (status changes) |
| assumption_validations | L126 | Immutable confidence change history | HIGH | **Append-only** |
| missions | L127 | Mission lifecycle (D³PDCA phases) | LOW | Mutable (phase transitions) |
| discovery_sensors | L128 | Sensor registry and schedules | LOW | Mutable (config changes) |
| discovery_signals | L129 | Continuous sensor output stream | **VERY HIGH** | **Append-only** |

**Total: 8 new layers for Domain 13**

---

## 4. Existing Layer Enhancements

### L33 evidence — Add discovery_phase support

Current evidence layer supports phases: `D1`, `D2`, `P`, `D3`, `A` (DPDCA)

**Enhancement**: Add new phase values for D³PDCA:

```json
{
  "phase": "enum: DISCOVER | DEFINE | D1 | D2 | P | D3 | A | RE_DISCOVER",
  "mission_id": "string (FK → L127/missions, optional — new field)",
  "discovery_context_id": "string (FK → L122/discovery_contexts, optional — new field)"
}
```

**Impact**: Backward-compatible. Existing evidence records with `D1`/`D2`/`P`/`D3`/`A` keep working. New records can use `DISCOVER`, `DEFINE`, `RE_DISCOVER`.

### L30 risks — Add discovery linkage

```json
{
  "discovery_risk_id": "string (FK → L124/discovery_risks, optional — null for project-native risks)",
  "migrated_from_discovery": "boolean (default: false)"
}
```

**Impact**: Backward-compatible. Enables risks to trace back to discovery phase.

### L35 project_work — Add mission linkage

```json
{
  "mission_id": "string (FK → L127/missions, optional)",
  "lifecycle_phase": "enum: DISCOVER | DEFINE | PLAN | DO | CHECK | ACT | RE_DISCOVER"
}
```

**Impact**: Backward-compatible. Work sessions can now be tagged with D³PDCA phase.

### L52 work_execution_units — Add mission linkage

```json
{
  "mission_id": "string (FK → L127/missions, optional)"
}
```

**Impact**: Backward-compatible. Execution units can trace back to parent mission.

### L34 workspace_config — Add D³PDCA configuration

```json
{
  "dpdca_version": "D3PDCA",
  "discovery_required": true,
  "discovery_minimum_sources": 3,
  "discovery_stakeholder_signoffs_required": 2,
  "assumption_confidence_threshold": 0.6,
  "sensor_schedule_default": "every_6h",
  "re_discovery_trigger": "enum: assumption_violated | environment_changed | mission_complete | scheduled"
}
```

---

## 5. Separation of Concerns — Infrastructure Level

### Problem: Single Container is a Bottleneck

Current architecture:
```
ALL 115+ layers → 1 Cosmos container (model_objects)
                  1 partition key (/layer)
                  6,890 objects
```

**Why this was fine until now**:
- All layers have similar access patterns (CRUD)
- Volume is modest (6,890 objects)
- Single API serves all reads/writes

**Why D³PDCA changes this**:

| Data Category | Access Pattern | Volume | Retention | Security |
|---|---|---|---|---|
| **Core Model** (Domains 1-5) | Read-heavy, slow change | Stable (~1,400 objects) | Forever | Standard |
| **Governance** (Domain 6) | Read on plan, write on check | Low (~100 objects) | Forever | Elevated (policy) |
| **Project & Execution** (Domains 7, 8, 11) | Read-write, moderate churn | Medium (~4,000 objects) | Forever | Standard |
| **Evidence** (Domain 9) | **Append-only, immutable** | **High (grows daily)** | **Forever (legal)** | **Elevated (audit)** |
| **Discovery Signals** (L129) | **Append-only, very high volume** | **Very high (continuous sensors)** | **90 days active** | Standard |
| **Strategy** (Domain 12) | Read-write, low volume | Low (~0 objects) | Forever | **Elevated (strategic)** |

### Recommendation: 3-Container Architecture

```
┌─────────────────────────────────────────────────────────┐
│           COSMOS DB ACCOUNT: msub-sandbox-cosmos         │
│           DATABASE: evamodel                            │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────────────┐
        ↓           ↓                   ↓
┌──────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Container 1  │ │ Container 2      │ │ Container 3      │
│ model_objects│ │ evidence_store   │ │ signal_store     │
│              │ │                  │ │                  │
│ Domains:     │ │ Domains:         │ │ Domain:          │
│ 1-8, 10-12  │ │ 9 (partial)      │ │ 13 (partial)     │
│              │ │                  │ │                  │
│ Layers:      │ │ Layers:          │ │ Layers:          │
│ All existing │ │ L33 evidence     │ │ L126 assumption_ │
│ + L122-L125  │ │ L126 assumption_ │ │   validations    │
│ + L127-L128  │ │   validations    │ │ L129 discovery_  │
│              │ │ verification_    │ │   signals        │
│ Access:      │ │   records        │ │                  │
│ Read-write   │ │ evidence_        │ │ Access:          │
│ Standard     │ │   correlation    │ │ Append-only      │
│              │ │                  │ │ Auto-archive     │
│ Partition:   │ │ Access:          │ │ 90-day retention │
│ /layer       │ │ Append-only      │ │                  │
│              │ │ Immutable        │ │ Partition:       │
│ ~6,000 obj   │ │ Legal retention  │ │ /sensor_id       │
│              │ │                  │ │                  │
│              │ │ Partition:       │ │ Throughput:      │
│              │ │ /layer           │ │ Autoscale        │
│              │ │                  │ │ (400-4000 RU/s)  │
│              │ │ ~700+ obj        │ │                  │
│              │ │ (growing)        │ │ ~0 obj (new)     │
└──────────────┘ └──────────────────┘ └──────────────────┘
```

### Why 3 Containers (Not 2 or 5)

**Why not 2 (model + everything else)**:
- Evidence and signals have fundamentally different retention policies (forever vs 90 days)
- Mixing them in one container means no independent TTL

**Why not 5 (per-concern)**:
- Over-engineering for current scale (6,890 objects)
- API complexity increases with each container
- Single Cosmos account still serves all containers efficiently
- More containers = more cost (minimum 400 RU/s each)

**Why 3 is right**:
1. **model_objects**: Existing behavior, no disruption, handles all CRUD layers
2. **evidence_store**: Append-only, immutable, legal retention, audit compliance. Separating evidence enables independent backup, encryption at rest with separate keys, and compliance certification
3. **signal_store**: High-volume, time-series-like, auto-archiving, different throughput pattern. Can scale independently without affecting core model performance

### Migration Path (Non-Breaking)

**Phase 1: API Abstraction** (Week 1)
```python
# api/server.py — add store routing
def get_store(layer_name: str) -> CosmosStore:
    if layer_name in EVIDENCE_LAYERS:
        return evidence_store  # Container 2
    elif layer_name in SIGNAL_LAYERS:
        return signal_store    # Container 3
    else:
        return model_store     # Container 1 (existing)
```

**Phase 2: Create Containers** (Week 2)
```powershell
# Create new containers (same Cosmos account)
az cosmosdb sql container create \
  --account-name msub-sandbox-cosmos \
  --database-name evamodel \
  --name evidence_store \
  --partition-key-path /layer \
  --throughput 400

az cosmosdb sql container create \
  --account-name msub-sandbox-cosmos \
  --database-name evamodel \
  --name signal_store \
  --partition-key-path /sensor_id \
  --default-ttl 7776000  # 90 days in seconds
```

**Phase 3: Migrate Evidence** (Week 3)
```python
# Copy existing evidence records to evidence_store
# Keep originals in model_objects until verified
# Switch API routing to evidence_store
# Verify: all evidence queries work against new container
# Delete evidence records from model_objects
```

**Phase 4: Deploy Signals** (Week 4+, when sensors are ready)
```python
# Signal store starts empty
# As sensors are deployed, they write to signal_store
# No migration needed — fresh data only
```

### Cost Impact

| Container | RU/s | Monthly Cost | Justification |
|-----------|------|-------------|---------------|
| model_objects (existing) | 400 | ~$23/mo | Existing, no change |
| evidence_store (new) | 400 | ~$23/mo | Legal compliance, immutable audit |
| signal_store (new) | 400 autoscale | ~$23-100/mo | Scales with sensor volume |
| **Total** | 1200-1800 | **~$69-146/mo** | vs $23/mo today |

**ROI justification**: 
- Evidence separation enables compliance certification ($50K+ value)
- Signal separation prevents core model degradation under sensor load
- Independent scaling means each container optimizes independently

---

## 6. Updated 13-Domain Ontology

```
┌──────────────────────────────────────────────────────┐
│              D³PDCA AGENT REASONING MODEL            │
│                  13-Domain Ontology                   │
└──────────────────────────────────────────────────────┘

  CONTINUOUS SENSING (Layer 0 — runs parallel to all phases)
  └─ Domain 13: Discovery & Sense-Making
     ├─ L128 sensors (what to watch)
     └─ L129 signals (what changed)

  DISCOVER — "What is really going on?"
  └─ Domain 13: Discovery & Sense-Making
     ├─ L122 contexts (stakeholders, boundaries, constraints)
     ├─ L123 assumptions (confidence + risk exposure)
     ├─ L124 risks (pre-execution threats)
     └─ L125 opportunities (ranked improvements)

  DEFINE — "What should we do about it?"
  └─ Domain 13 + Domain 7
     ├─ L127 missions (grounded mission definition)
     ├─ L122 contexts (validated problem framing)
     └─ L26 projects (updated project record)

  PLAN — "How do we do it?"
  └─ Domain 6 + Domain 7 + Domain 12
     ├─ L27 wbs (work breakdown)
     ├─ L28 sprints (sprint assignment)
     ├─ L37 quality_gates (standards)
     └─ L71 portfolio (strategic alignment)

  DO — "Execute."
  └─ Domain 3 + Domain 4 + Domain 8 + Domain 11
     ├─ L52 work_execution_units (atomic work)
     ├─ L53 work_step_events (step tracking)
     ├─ L9 agents (agent config)
     └─ L47 deployment_records (ship it)

  CHECK — "Did it work?"
  └─ Domain 6 + Domain 9
     ├─ L33 evidence (immutable proof)
     ├─ L37 quality_gates (gate evaluation)
     ├─ verification_records (pass/fail)
     └─ L126 assumption_validations (were we right?)

  ACT — "What did we learn?"
  └─ Domain 7 + Domain 9 + Domain 10
     ├─ L35 project_work (update progress)
     ├─ L33 evidence (record learning)
     ├─ L51 resource_costs (record cost)
     └─ L57 work_learning_feedback (pattern capture)

  RE-DISCOVER — "What changed?"
  └─ Domain 13
     ├─ L126 assumption_validations (which broke?)
     ├─ L129 signals (what's new since last cycle?)
     ├─ L124 risks (any new threats?)
     └─ L125 opportunities (any new improvements?)
     → If significant changes detected → trigger new DISCOVER cycle
```

---

## 7. Updated Agent Lifecycle Mapping

### Before (DPDCA — 5 phases, 12 domains)

```
DISCOVER  → read model → Domain 1,2,3,5
PLAN      → read rules → Domain 6,7,12
DO        → execute    → Domain 3,4,8,11
CHECK     → validate   → Domain 6,9
ACT       → record     → Domain 7,9,10
```

### After (D³PDCA — 7 phases, 13 domains)

```
SENSE     → continuous → Domain 13 (sensors + signals)
DISCOVER  → investigate → Domain 13 (contexts, assumptions, risks, opportunities)
DEFINE    → formalize  → Domain 13 + 7 (missions, projects)
PLAN      → design     → Domain 6, 7, 12 (rules, backlog, strategy)
DO        → execute    → Domain 3, 4, 8, 11 (agents, UI, deploy, work)
CHECK     → validate   → Domain 6, 9, 13 (gates, evidence, assumption validation)
ACT       → learn      → Domain 7, 9, 10 (progress, evidence, costs)
RE-DISCOVER → detect   → Domain 13 (new signals, broken assumptions, new risks)
```

### Agent Bootstrap Sequence (Updated)

```python
# STEP 0: Health check
GET /health

# STEP 1: Load instructions
GET /model/agent-guide

# STEP 2: Load context (NEW: includes Domain 13 summary)
GET /model/agent-summary

# STEP 3: Load discovery context (NEW STEP)
GET /model/discovery_contexts/?project_id={project}&is_active=true
GET /model/discovery_assumptions/?project_id={project}&validation_status=VALIDATED
GET /model/discovery_risks/?project_id={project}&mitigation_status!=COMPLETED
GET /model/discovery_opportunities/?project_id={project}&status=APPROVED

# STEP 4: Check for active signals (NEW STEP)
GET /model/discovery_signals/?severity=CRITICAL&triage_result=ACTIONABLE
GET /model/discovery_signals/?severity=HIGH&acknowledged_at=null

# STEP 5: Load assignment (existing)
GET /model/missions/?project_id={project}&lifecycle_phase!=COMPLETE
GET /model/wbs/?project_id={project}&status=active
GET /model/stories/?sprint_id={sprint}&status=not_started

# STEP 6: Load rules (existing)
GET /model/agent_policies/{agent_id}
GET /model/quality_gates/?project_id={project}

# STEP 7: Execute (D³PDCA per task)
```

---

## 8. Edge Types (New)

Current edge types: 99 (per catalog)

New edge types for Domain 13:

| Edge Type | From | To | Meaning |
|-----------|------|-----|---------|
| `grounds` | discovery_contexts | missions | Mission is grounded in this context |
| `assumes` | discovery_assumptions | discovery_contexts | Context depends on this assumption |
| `threatens` | discovery_risks | discovery_contexts, missions | Risk threatens context or mission |
| `enables` | discovery_opportunities | missions, projects | Opportunity enables improvement |
| `validates` | assumption_validations | discovery_assumptions | Validation event for assumption |
| `invalidates` | assumption_validations | discovery_assumptions | Assumption was violated |
| `detects` | discovery_sensors | discovery_signals | Sensor produced this signal |
| `triggers` | discovery_signals | discovery_contexts, missions | Signal triggers re-discovery |
| `migrates_to` | discovery_risks | risks | Discovery risk promoted to project risk |
| `informs` | discovery_signals | discovery_risks, discovery_opportunities | Signal updates risk/opportunity assessment |

**Total edge types: 99 + 10 = 109**

---

## 9. Summary: Final Validated Enhancement

### What Changes

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| **Domains** | 12 | 13 | +1 (Discovery & Sense-Making) |
| **Layers** | 115+ | 123+ | +8 new layers |
| **Edge types** | 99 | 109 | +10 new types |
| **Cosmos containers** | 1 | 3 | +2 (evidence_store, signal_store) |
| **DPDCA phases** | 5 | 7+1 | +2 (Discover, Define) +1 (continuous sensing) |
| **Agent bootstrap** | 7 steps | 9 steps | +2 (load discovery, check signals) |

### New Layers (8)

| L# | Name | Domain | Volume | Mutability |
|----|------|--------|--------|-----------|
| L122 | discovery_contexts | 13 | LOW | Mutable |
| L123 | discovery_assumptions | 13 | MEDIUM | Mutable |
| L124 | discovery_risks | 13 | MEDIUM | Mutable |
| L125 | discovery_opportunities | 13 | LOW | Mutable |
| L126 | assumption_validations | 13 | HIGH | Append-only |
| L127 | missions | 13 | LOW | Mutable |
| L128 | discovery_sensors | 13 | LOW | Mutable |
| L129 | discovery_signals | 13 | VERY HIGH | Append-only |

### Existing Layers Enhanced (5)

| Layer | Enhancement | Breaking? |
|-------|------------|-----------|
| L33 evidence | Add `DISCOVER`, `DEFINE`, `RE_DISCOVER` phases + `mission_id` | No |
| L30 risks | Add `discovery_risk_id` field | No |
| L34 workspace_config | Add D³PDCA configuration block | No |
| L35 project_work | Add `mission_id` + `lifecycle_phase` | No |
| L52 work_execution_units | Add `mission_id` | No |

### Infrastructure Changes

| Change | Description | Cost Impact |
|--------|------------|-------------|
| New Cosmos container: `evidence_store` | Immutable audit trail, legal retention | +$23/mo |
| New Cosmos container: `signal_store` | High-volume sensor data, 90-day TTL | +$23-100/mo |
| API routing logic | Route layers to appropriate container | Dev effort only |

---

## 10. Implementation Roadmap

### Phase 1: Schema Registration (Day 1-2)

```powershell
# Register 8 new layers in Cosmos DB via API
$layers = @(
  @{name="discovery_contexts"; layer_id="L122"; domain="Domain 13"},
  @{name="discovery_assumptions"; layer_id="L123"; domain="Domain 13"},
  @{name="discovery_risks"; layer_id="L124"; domain="Domain 13"},
  @{name="discovery_opportunities"; layer_id="L125"; domain="Domain 13"},
  @{name="assumption_validations"; layer_id="L126"; domain="Domain 13"},
  @{name="missions"; layer_id="L127"; domain="Domain 13"},
  @{name="discovery_sensors"; layer_id="L128"; domain="Domain 13"},
  @{name="discovery_signals"; layer_id="L129"; domain="Domain 13"}
)

foreach ($layer in $layers) {
  # Register layer definition in eva_model (L48)
  $body = @{
    id = $layer.name
    layer = "eva_model"
    layer_id = $layer.layer_id
    name = $layer.name
    domain = $layer.domain
    status = "operational"
  } | ConvertTo-Json
  
  Invoke-RestMethod -Uri "$base/model/eva_model/$($layer.name)" -Method PUT -Body $body -ContentType "application/json"
}
```

### Phase 2: API Endpoints (Day 3-5)

```python
# api/server.py — add routes for new layers
# These are auto-generated from layer names (existing pattern)
# Just register layer names in KNOWN_LAYERS list
KNOWN_LAYERS.extend([
    "discovery_contexts",
    "discovery_assumptions", 
    "discovery_risks",
    "discovery_opportunities",
    "assumption_validations",
    "missions",
    "discovery_sensors",
    "discovery_signals"
])
```

### Phase 3: Existing Layer Enhancements (Day 5-7)

```python
# Update evidence schema to accept new phases
# Update risks schema to accept discovery_risk_id
# Update workspace_config with D³PDCA config
# Update project_work with mission_id
# All backward-compatible — no migration needed
```

### Phase 4: Container Separation (Week 2-3)

```powershell
# Create evidence_store and signal_store containers
# Implement API routing logic
# Migrate evidence records
# Test all existing queries still work
```

### Phase 5: Seed + Verify (Week 3-4)

```powershell
# Seed example data for each new layer
# Run validation: all CRUD operations work
# Update agent-guide endpoint with Domain 13 docs
# Update user-guide with D³PDCA category runbook
# Deploy to ACA
```

---

## 11. Validation Checklist

Before deployment, verify:

```
Schema Validation:
  ☐ All 8 new layers have valid JSON schemas
  ☐ All FK references resolve to existing layers
  ☐ All enum values are consistent across layers
  ☐ ID patterns follow workspace conventions
  ☐ Append-only layers (L126, L129) have no PUT/DELETE routes

API Validation:
  ☐ All 8 new layers accessible via GET /model/{layer_name}/
  ☐ CRUD operations work for mutable layers (L122-L125, L127-L128)
  ☐ Append-only enforced for L126, L129
  ☐ Existing layer enhancements don't break current queries
  ☐ Agent-summary includes Domain 13 counts

Integration Validation:
  ☐ Agent bootstrap sequence works with new steps 3-4
  ☐ Evidence layer accepts DISCOVER/DEFINE/RE_DISCOVER phases
  ☐ Missions link correctly to discovery contexts
  ☐ Mission template (07-foundation-layer) references new layers

Infrastructure Validation:
  ☐ evidence_store container created with /layer partition
  ☐ signal_store container created with /sensor_id partition + TTL
  ☐ API routing correctly directs layers to containers
  ☐ Existing queries against model_objects unaffected
```

---

## 12. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Breaking existing API** | LOW | HIGH | All changes backward-compatible; new fields optional |
| **Cost increase too high** | LOW | MEDIUM | Start with shared container; separate only when volume justifies |
| **Over-engineering sensors** | MEDIUM | LOW | Start with 1 sensor (governance); add more only when needed |
| **Signal volume overwhelms DB** | LOW | HIGH | TTL on signal_store (90 days); autoscale RU/s |
| **Agent confusion with 13 domains** | LOW | MEDIUM | Ontology compression still works; agents reason over domains not layers |

---

## 13. Conclusion

**The current data model has ZERO complete coverage for the Discovery phase.** This is the biggest gap in the architecture.

Adding Domain 13 (Discovery & Sense-Making) with 8 new layers transforms the 12-domain ontology into a complete D³PDCA operating system:

- **Before**: Agents plan and execute based on what's already in the model (stale, assumed)
- **After**: Agents sense reality continuously, ground problems in evidence, then plan and execute

The 3-container separation enables:
- **Core model**: Standard read-write for all operational layers
- **Evidence store**: Immutable audit trail with legal retention (compliance moat)
- **Signal store**: High-volume sensor data with auto-archiving (performance isolation)

**This is ready for immediate implementation.** Start with Phase 1 (schema registration) — the rest follows incrementally with zero breaking changes.

