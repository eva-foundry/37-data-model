================================================================================
 EVA DATA MODEL -- EXECUTION ENGINE (PHASES 1-6: L52-L75, 24 LAYERS)
 File: docs/library/13-EXECUTION-LAYERS.md
 Version: v1.1 | Created: 2026-03-09 (Session 41) | Updated: 2026-03-12 19:46 ET (Session 46A)
 Status: 24 layers DEFINED, validated, and SEEDED -- PENDING ACA DEPLOYMENT after PR merge
 Session: 46A (Stub layer preparation) | Domain: Work Execution
 Source: https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io
 Design: docs/architecture/EXECUTION-LAYERS-ASSESSMENT.md | docs/library/99-layers-design-20260309-0935.md (canonical numbering)
 ⚠️  IMPORTANT: These 24 layers will NOT be queryable until after PR merge and ACA deployment (estimated March 12 PM ET).
================================================================================

  PURPOSE
  -------
  The Execution Engine domain provides governed work execution tracking for
  AI agents, control plane agents, and human actors. Every significant unit
  of work gets a work_unit record (L52), with child records tracking the
  step-by-step timeline (L53), decisions made (L54), and outcomes delivered (L56).

  This is the OPERATIONAL counterpart to the Project & PM domain (L25-L28).
  - Project & PM layers = PLANNING (what should be done)
  - Execution Engine layers = DOING (what was actually done)

  Relationship: work_execution_units (L52) points to wbs (L26), sprints (L27),
  and project_work (L34) to tie operational execution back to governance.

  COMPETITIVE ADVANTAGE
  ---------------------
  This is the audit trail that GitHub Copilot, Cursor, Replit Agent, and
  Devin do NOT have. Every AI action is recorded with:
  - Who did it (agent/human polymorphic actor)
  - What was decided (decision records with rationale)
  - What was delivered (outcomes with file-level diffs)
  - How it unfolded (event timeline with timestamps)
  
  Insurance carriers will require this. FDA auditors will require this.
  Banks will require this. They will pay $199-$500K/year for provably
  correct AI with full provenance.

  PARENT-CHILD CASCADE ARCHITECTURE
  ----------------------------------
  L52 work_execution_units is the PARENT. All other Phase 1 layers are CHILDREN.
  
  Deleting a work_unit_id triggers CASCADE delete on:
    - L53 work_step_events (all timeline events)
    - L54 work_decision_records (all decisions)
    - L56 work_outcomes (all outcome records)
  
  This ensures atomic cleanup. No orphaned records. Delete the parent,
  children follow automatically.

  POLYMORPHIC ACTORS
  ------------------
  Three actor types supported:
  - agent: L9 agents layer (MCP tools, custom skills)
  - cp_agent: L15 cp_agents layer (control plane orchestrators)
  - human: L2 personas layer (developers, admins, citizens)
  
  Fields: assigned_to_type (enum), assigned_to_id (polymorphic FK)
  Pattern: Check type first, then resolve ID in appropriate layer

  DPDCA INTEGRATION
  -----------------
  Work execution units map to DPDCA phases via evidence layer (L31):
  
  1. DISCOVER phase → work_step_events with action_taken = "context gathering"
  2. PLAN phase → work_decision_records capturing planning decisions
  3. DO phase → work_execution_units status = "in-progress"
  4. CHECK phase → work_step_events with event_type = "gate_check"
  5. ACT phase → work_outcomes recording what was delivered
  
  Evidence IDs tie work units to test results, artifacts, and verification.

================================================================================
 PHASE 1 LAYERS (SESSION 41 PART 10) -- 4 LAYERS OPERATIONAL
================================================================================

--------------------------------------------------------------------------------
 L52 -- work_execution_units (PARENT LAYER)
--------------------------------------------------------------------------------

  PURPOSE: Operational work ledger tracking every governed unit of work
  STATUS: Deployed March 9, 2026 (Session 41 Part 10)
  SCHEMA: schema/work_execution_units.schema.json
  PRIMARY KEY: work_unit_id (format: {project-id}-wu-{YYYYMMDD}-{seq})
  CASCADE: Deletes cascade to L53, L54, L56 (children)

  FIELD CATALOG
  -------------
  work_unit_id               PK, string, pattern: ^[a-z0-9-]+-wu-[0-9]{8}-[0-9]{3,}$
                             Examples: "51-ACA-wu-20260309-001", "37-data-model-wu-20260309-001"
  
  project_id                 FK to L25 projects, required
                             Which project this work belongs to
  
  wbs_id                     FK to L26 wbs, nullable
                             Work breakdown structure element (story/task)
  
  sprint_id                  FK to L27 sprints, nullable
                             Sprint this work is scheduled in
  
  title                      string, required, 3-200 chars
                             Brief description of the work unit
  
  description                string, nullable
                             Detailed description (markdown supported)
  
  status                     enum, required
                             queued | in-progress | paused | succeeded | failed | cancelled
  
  assigned_to_type           enum, required
                             agent | cp_agent | human
  
  assigned_to_id             string, required, polymorphic FK
                             Resolves to: agent_id (L9), cp_agent_id (L15), or persona_id (L2)
  
  milestone_id               FK to L28 milestones, nullable
                             Target milestone for completion
  
  workflow_id                FK to L18 cp_workflows, nullable
                             Governing workflow (if automated)
  
  project_work_id            FK to L34 project_work, nullable
                             Session-level work container (daily session tracking)
  
  parent_work_unit_id        Self-referencing FK, nullable
                             Parent work unit if this is a sub-task (tree structure)
  
  depends_on                 Array of work_unit_ids, nullable
                             Dependency graph (blocked by these work units)
  
  instruction_type           enum, nullable
                             manual | automation | agent_workflow | github_action
  
  instruction_payload        object, nullable, freeform
                             Execution instructions parsed by agent/automation
  
  policy_refs                Array of policy_ids (L16 cp_policies), nullable
                             Governing policies that apply to this work
  
  evidence_ids               Array of evidence_ids (L31 evidence), nullable
                             Proof-of-completion artifacts
  
  created_at                 ISO8601 datetime, required
                             When this work unit was created
  
  updated_at                 ISO8601 datetime, required
                             Last modification timestamp
  
  completed_at               ISO8601 datetime, nullable
                             When status changed to succeeded/failed/cancelled

  USAGE PATTERNS
  --------------
  Create work unit:
    PUT /model/work_execution_units/{work_unit_id}
    Headers: X-Actor: agent:copilot
    Body: JSON object with all required fields
  
  Query active work:
    GET /model/work_execution_units/?project_id={id}&status=in-progress
  
  Query by sprint:
    GET /model/work_execution_units/?sprint_id={sprint_id}&limit=100
  
  Cascade delete test (admin only):
    DELETE /model/work_execution_units/{work_unit_id}
    Result: Auto-deletes all child records in L53, L54, L56

  JSON EXAMPLE
  ------------
  {
    "work_unit_id": "37-data-model-wu-20260309-001",
    "project_id": "37-data-model",
    "wbs_id": "WBS-037-S41P10-EXEC",
    "sprint_id": "37-data-model-sprint-2026-03-09",
    "title": "Deploy Phase 1 execution layers (L52-L56)",
    "description": "Add 4 operational layers with parent-child cascade architecture",
    "status": "succeeded",
    "assigned_to_type": "agent",
    "assigned_to_id": "copilot",
    "milestone_id": "M-037-EXEC-P1",
    "workflow_id": null,
    "project_work_id": "37-data-model-2026-03-09",
    "parent_work_unit_id": null,
    "depends_on": [],
    "instruction_type": "agent_workflow",
    "instruction_payload": {
      "phases": ["schema", "api", "docs"],
      "gates": ["schema_valid", "api_deployed", "docs_updated"]
    },
    "policy_refs": ["POL-037-EXEC"],
    "evidence_ids": ["37-data-model-2026-03-09-S41P10-EXEC-D3"],
    "created_at": "2026-03-09T18:00:00Z",
    "updated_at": "2026-03-09T20:00:00Z",
    "completed_at": "2026-03-09T20:00:00Z"
  }

--------------------------------------------------------------------------------
 L53 -- work_step_events (CHILD OF L52, CASCADE DELETE)
--------------------------------------------------------------------------------

  PURPOSE: Execution event stream tracking step-by-step timeline of work units
  STATUS: Deployed March 9, 2026 (Session 41 Part 10)
  SCHEMA: schema/work_step_events.schema.json
  PRIMARY KEY: event_id (format: {work_unit_id}-evt-{seq})
  PARENT: L52 work_execution_units (CASCADE on parent delete)

  FIELD CATALOG
  -------------
  event_id                   PK, string, pattern: ^.+-wu-.+-evt-[0-9]{3,}$
                             Example: "51-ACA-wu-20260309-001-evt-001"
  
  work_unit_id               FK to L52 work_execution_units, required, CASCADE
                             Parent work unit this event belongs to
  
  sequence_no                integer, required, >= 1
                             Event order within work unit (monotonic sequence)
  
  event_type                 enum, required
                             state_change | gate_check | action_execution | error_occurred | retry_attempt
  
  timestamp                  ISO8601 datetime, required
                             When this event occurred
  
  actor_type                 enum, required
                             agent | cp_agent | human | system
  
  actor_id                   string, required
                             Identifier of actor (or "system" for automated events)
  
  state_before               string, nullable
                             Status before event (for state_change events)
  
  state_after                string, nullable
                             Status after event (for state_change events)
  
  action_taken               string, nullable
                             Description of action performed
  
  gate_name                  string, nullable
                             Quality gate identifier (for gate_check events)
  
  gate_result                enum, nullable
                             PASS | FAIL | WARN | SKIP
  
  evidence_ids               Array of evidence_ids (L31), nullable
                             Proof artifacts for this event
  
  trace_ids                  Array of trace_ids (L32 traces), nullable
                             LLM call traces for this event
  
  decision_ids               Array of decision_ids (L54), nullable
                             Decisions made during this event
  
  error_details              string, nullable
                             Error details (for error_occurred events)
  
  metadata                   object, nullable, freeform
                             Event-specific context (phase, metrics, etc.)

  USAGE PATTERNS
  --------------
  Log state change:
    PUT /model/work_step_events/{event_id}
    Body: {event_type: "state_change", state_before: "queued", state_after: "in-progress"}
  
  Record gate check:
    PUT /model/work_step_events/{event_id}
    Body: {event_type: "gate_check", gate_name: "schema_valid", gate_result: "PASS"}
  
  Query timeline:
    GET /model/work_step_events/?work_unit_id={wu_id}&limit=1000
    Sort by sequence_no to see chronological order
  
  Query failures:
    GET /model/work_step_events/?event_type=error_occurred
    Analyze error_details for patterns

  JSON EXAMPLE
  ------------
  {
    "event_id": "37-data-model-wu-20260309-001-evt-003",
    "work_unit_id": "37-data-model-wu-20260309-001",
    "sequence_no": 3,
    "event_type": "gate_check",
    "timestamp": "2026-03-09T18:15:00Z",
    "actor_type": "agent",
    "actor_id": "copilot",
    "state_before": null,
    "state_after": null,
    "action_taken": null,
    "gate_name": "schema_valid",
    "gate_result": "PASS",
    "evidence_ids": ["37-data-model-2026-03-09-schema-validation"],
    "trace_ids": [],
    "decision_ids": [],
    "error_details": null,
    "metadata": {
      "phase": "CHECK",
      "validation_tool": "jsonschema",
      "schemas_validated": 4
    }
  }

--------------------------------------------------------------------------------
 L54 -- work_decision_records (CHILD OF L52, CASCADE DELETE)
--------------------------------------------------------------------------------

  PURPOSE: Runtime decision ledger capturing decisions made during execution
  STATUS: Deployed March 9, 2026 (Session 41 Part 10)
  SCHEMA: schema/work_decision_records.schema.json
  PRIMARY KEY: decision_id (format: {work_unit_id}-dec-{seq})
  PARENT: L52 work_execution_units (CASCADE on parent delete)
  CONTRAST: L30 decisions = architectural ADRs, L54 = runtime execution decisions

  FIELD CATALOG
  -------------
  decision_id                PK, string, pattern: ^.+-wu-.+-dec-[0-9]{3,}$
                             Example: "51-ACA-wu-20260309-001-dec-001"
  
  work_unit_id               FK to L52 work_execution_units, required, CASCADE
                             Parent work unit this decision belongs to
  
  decision_question          string, required, >= 5 chars
                             What decision was being made
  
  options_considered         Array of strings, required, >= 1 item
                             Alternative options that were evaluated
  
  selected_option_id         string, required
                             The option that was chosen (should match options_considered)
  
  decision_scope             enum, required
                             execution | governance | quality | deployment | exception
  
  basis                      enum, required
                             policy | evidence | heuristic | human_judgment
  
  decided_by_type            enum, required
                             agent | human
  
  decided_by_id              string, required
                             Identifier of decision maker (agent_id or persona_id)
  
  decided_at                 ISO8601 datetime, required
                             When decision was made
  
  rationale                  string, nullable
                             Explanation of why this option was chosen
  
  policy_refs                Array of policy_ids (L16), nullable
                             Policies that influenced this decision
  
  evidence_refs              Array of evidence_ids or document refs, nullable
                             Supporting evidence for the decision
  
  obligation_ids             Array of obligation_ids (L55), nullable
                             Phase 2 FK - compliance obligations triggered
  
  reversible                 boolean, nullable, default: true
                             Can this decision be undone without significant cost?
  
  risk_level                 enum, nullable
                             low | medium | high
  
  notes                      string, nullable
                             Additional context or observations

  USAGE PATTERNS
  --------------
  Record runtime decision:
    PUT /model/work_decision_records/{decision_id}
    Body: {decision_question, options_considered, selected_option_id, rationale}
  
  Query decisions by basis:
    GET /model/work_decision_records/?basis=policy
    Find all policy-driven decisions
  
  Query high-risk decisions:
    GET /model/work_decision_records/?risk_level=high
    Audit decisions that carried significant risk
  
  Query by decider:
    GET /model/work_decision_records/?decided_by_id=copilot
    All decisions made by specific agent

  JSON EXAMPLE
  ------------
  {
    "decision_id": "37-data-model-wu-20260309-001-dec-001",
    "work_unit_id": "37-data-model-wu-20260309-001",
    "decision_question": "Deploy all 4 layers together or incrementally?",
    "options_considered": [
      "all-at-once",
      "incremental-L52-first",
      "incremental-with-feature-flags"
    ],
    "selected_option_id": "all-at-once",
    "decision_scope": "execution",
    "basis": "heuristic",
    "decided_by_type": "agent",
    "decided_by_id": "copilot",
    "decided_at": "2026-03-09T18:05:00Z",
    "rationale": "Parent-child cascade requires atomic deployment. Feature flagging adds complexity without value at Phase 1.",
    "policy_refs": [],
    "evidence_refs": ["docs/architecture/EXECUTION-LAYERS-ASSESSMENT.md"],
    "obligation_ids": [],
    "reversible": true,
    "risk_level": "low",
    "notes": "Can roll back entire deployment if issues arise"
  }

--------------------------------------------------------------------------------
 L56 -- work_outcomes (CHILD OF L52, CASCADE DELETE)
--------------------------------------------------------------------------------

  PURPOSE: Result ledger recording what was delivered vs what was expected
  STATUS: Deployed March 9, 2026 (Session 41 Part 10)
  SCHEMA: schema/work_outcomes.schema.json
  PRIMARY KEY: outcome_id (format: {work_unit_id}-out-{seq})
  PARENT: L52 work_execution_units (CASCADE on parent delete)

  FIELD CATALOG
  -------------
  outcome_id                 PK, string, pattern: ^.+-wu-.+-out-[0-9]{3,}$
                             Example: "51-ACA-wu-20260309-001-out-001"
  
  work_unit_id               FK to L52 work_execution_units, required, CASCADE
                             Parent work unit this outcome belongs to
  
  result                     enum, required
                             delivered | not_delivered | partially_delivered
  
  outcome_type               enum, required
                             technical | governance | quality | operational | business
  
  recorded_at                ISO8601 datetime, required
                             When outcome was recorded
  
  expected_vs_actual         string, nullable
                             Narrative comparison of expectations vs reality
  
  delivered_changes          object, nullable
                             Structured summary of changes:
    - files_created: []      Array of file paths created
    - files_modified: []     Array of file paths modified
    - files_deleted: []      Array of file paths deleted
    - commits: []            Array of commit SHAs
    - deployments: []        Array of deployment IDs
    - metrics: {}            Quantitative measures
  
  evidence_ids               Array of evidence_ids (L31), nullable
                             Proof artifacts proving the outcome
  
  decision_ids               Array of decision_ids (L54), nullable
                             Decisions that influenced this outcome
  
  learning_ids               Array of learning_ids (L57), nullable
                             Phase 2 FK - lessons learned from this outcome
  
  metrics                    object, nullable, freeform
                             Time, cost, quality scores, etc.
  
  notes                      string, nullable
                             Additional observations or context

  USAGE PATTERNS
  --------------
  Record successful delivery:
    PUT /model/work_outcomes/{outcome_id}
    Body: {result: "delivered", delivered_changes: {files_created: [...]}}
  
  Record partial delivery:
    PUT /model/work_outcomes/{outcome_id}
    Body: {result: "partially_delivered", expected_vs_actual: "..."}
  
  Query by result:
    GET /model/work_outcomes/?result=delivered
    Find all successfully delivered outcomes
  
  Variance analysis:
    GET /model/work_outcomes/?result=not_delivered
    Analyze what wasn't delivered and why

  JSON EXAMPLE
  ------------
  {
    "outcome_id": "37-data-model-wu-20260309-001-out-001",
    "work_unit_id": "37-data-model-wu-20260309-001",
    "result": "delivered",
    "outcome_type": "technical",
    "recorded_at": "2026-03-09T20:00:00Z",
    "expected_vs_actual": "All 4 schemas deployed as planned. Documentation updated. Layer count increased 87→91.",
    "delivered_changes": {
      "files_created": [
        "schema/work_execution_units.schema.json",
        "schema/work_step_events.schema.json",
        "schema/work_decision_records.schema.json",
        "schema/work_outcomes.schema.json",
        "docs/library/13-EXECUTION-LAYERS.md"
      ],
      "files_modified": [
        "README.md",
        "STATUS.md",
        "docs/COMPLETE-LAYER-CATALOG.md",
        "docs/library/03-DATA-MODEL-REFERENCE.md",
        "docs/library/10-FK-ENHANCEMENT.md",
        "USER-GUIDE.md"
      ],
      "files_deleted": [],
      "commits": ["abc123def456"],
      "deployments": [],
      "metrics": {
        "layer_count_before": 87,
        "layer_count_after": 91,
        "edge_types_before": 27,
        "edge_types_after": 38
      }
    },
    "evidence_ids": ["37-data-model-2026-03-09-S41P10-EXEC-D3"],
    "decision_ids": ["37-data-model-wu-20260309-001-dec-001"],
    "learning_ids": [],
    "metrics": {
      "duration_hours": 2.0,
      "files_touched": 12,
      "lines_added": 950
    },
    "notes": "Phase 1 complete. 15 more layers (L55, L57-L70) planned for Phase 2-6."
  }

================================================================================
 FK DESIGN -- 11 NEW EDGE TYPES (27 → 38 TOTAL)
================================================================================

  Phase 1 execution layers add 11 new foreign key relationships to the model.
  See docs/library/10-FK-ENHANCEMENT.md for complete 38-edge catalog.

  FROM LAYER            EDGE TYPE                 TO LAYER              CASCADE
  --------------------  ------------------------  --------------------  --------
  work_execution_units  work_unit_to_project      projects (L25)        RESTRICT
  work_execution_units  work_unit_to_wbs          wbs (L26)             RESTRICT
  work_execution_units  work_unit_to_sprint       sprints (L27)         RESTRICT
  work_execution_units  work_unit_to_milestone    milestones (L28)      SET_NULL
  work_execution_units  work_unit_to_workflow     cp_workflows (L18)    RESTRICT
  work_execution_units  work_unit_to_project_work project_work (L34)    RESTRICT
  work_execution_units  work_unit_parent          work_execution_units  RESTRICT
  work_step_events      work_step_to_work_unit    work_execution_units  CASCADE
  work_decision_records work_decision_to_work_unit work_execution_units CASCADE
  work_outcomes         work_outcome_to_work_unit work_execution_units  CASCADE
  work_step_events      work_step_to_decisions    work_decision_records RESTRICT

  KEY BEHAVIORS
  -------------
  1. CASCADE DELETE (L52 → L53/L54/L56):
     Delete work_unit_id → Auto-deletes all child records
     Ensures atomic cleanup, no orphaned events/decisions/outcomes
  
  2. RESTRICT ON PARENT (L52 parent_work_unit_id):
     Cannot delete parent work unit if child work units exist
     Must delete children first, then parent
  
  3. SET_NULL ON MILESTONES (L52 milestone_id):
     Deleting milestone sets milestone_id to null in work units
     Soft degradation - work units not orphaned
  
  4. RESTRICT ON PROJECT/WBS/SPRINT:
     Cannot delete project/WBS/sprint if work units reference them
     Forces cleanup of work units before removing parent entities

  VALIDATION RULES (Phase 0 FK Enhancement)
  ------------------------------------------
  Phase 0 FK validation (March 2026) will enforce:
  
  1. work_unit_id references in L53/L54/L56 must resolve to existing L52 records
  2. project_id must resolve to existing L25 projects record
  3. wbs_id (if not null) must resolve to existing L26 wbs record
  4. sprint_id (if not null) must resolve to existing L27 sprints record
  5. milestone_id (if not null) must resolve to existing L28 milestones record
  6. workflow_id (if not null) must resolve to existing L18 cp_workflows record
  7. project_work_id (if not null) must resolve to existing L34 project_work record
  8. parent_work_unit_id (if not null) must resolve to existing L52 record
  9. decision_ids[] in work_step_events must resolve to existing L54 records
  10. Array FKs (policy_refs, evidence_ids) validate every item exists
  11. Polymorphic FKs (assigned_to_id) validate against type-specific layer

  Orphan scan endpoint: GET /model/relationships/orphans
  Returns all dangling references across all 11 edge types

================================================================================
 AGENT USAGE PATTERNS
================================================================================

  PATTERN 1: CREATE WORK UNIT WITH TIMELINE
  ------------------------------------------
  1. Create L52 work_execution_units record (parent)
  2. Create L53 work_step_events for state transitions
  3. Create L54 work_decision_records for decisions made
  4. Update L52 status as work progresses
  5. Create L56 work_outcomes when complete
  6. Link to L31 evidence for proof-of-completion

  PATTERN 2: QUERY ACTIVE WORK FOR PROJECT
  -----------------------------------------
  GET /model/work_execution_units/?project_id=37-data-model&status=in-progress
  Returns all active work units for project
  Use for: dashboards, burndown charts, capacity planning

  PATTERN 3: RECONSTRUCT WORK TIMELINE
  -------------------------------------
  1. GET /model/work_step_events/?work_unit_id={wu_id}&limit=1000
  2. Sort by sequence_no
  3. Render timeline: state changes, actions, gates, errors
  4. Include decision_ids to show decisions at each step

  PATTERN 4: CASCADE DELETE TEST (ADMIN)
  ---------------------------------------
  1. Create test work unit in L52
  2. Create child records in L53, L54, L56
  3. DELETE /model/work_execution_units/{test_wu_id}
  4. Verify all children auto-deleted (L53/L54/L56)
  5. Validates cascade behavior working correctly

  PATTERN 5: GATE VALIDATION TRAIL
  ---------------------------------
  1. Query all gate_check events: GET /model/work_step_events/?event_type=gate_check
  2. Filter by gate_result=FAIL to find gate failures
  3. Group by gate_name to identify problematic gates
  4. Link to evidence_ids for gate validation artifacts

  PATTERN 6: DECISION AUDIT
  --------------------------
  1. Query all decisions: GET /model/work_decision_records/
  2. Filter by decided_by_id to audit specific agent
  3. Analyze basis distribution (policy vs heuristic vs evidence)
  4. Check risk_level for high-risk decisions
  5. Verify rationale completeness

  PATTERN 7: OUTCOME VARIANCE ANALYSIS
  -------------------------------------
  1. Query all outcomes: GET /model/work_outcomes/
  2. Filter by result=not_delivered or partially_delivered
  3. Analyze expected_vs_actual narratives
  4. Extract metrics for deviation trends
  5. Feed into learning layer (L57, Phase 2)

================================================================================
 PHASE 2 LAYERS (SESSION 41 PART 11) -- 3 LAYERS OPERATIONAL
================================================================================

--------------------------------------------------------------------------------
 L55 -- work_obligations (CHILD OF L54 DECISIONS)
--------------------------------------------------------------------------------

  PURPOSE: Follow-up obligations from work decisions and policy enforcement
  STATUS: Deployed March 9, 2026 (Session 41 Part 11)
  SCHEMA: schema/work_obligations.schema.json
  PRIMARY KEY: id (format: {project-id}-obl-{YYYYMMDD}-{seq})
  PARENT: Inverse FK from L54 work_decision_records

  FIELD CATALOG
  -------------
  id                         PK, string, pattern: ^[a-z0-9-]+-obl-[0-9]{8}-[0-9]{3,}$
  
  decision_id                FK to L54 work_decision_records, required
                             Which decision created this obligation
  
  work_unit_id               FK to L52 work_execution_units, nullable
                             Optional context (which work unit triggered this)
  
  policy_id                  FK to L16 cp_policies, nullable
                             If policy-mandated obligation
  
  obligation_text            string, required, 10-2000 chars
                             Actionable description of what must be done
  
  status                     enum, required: open | in_progress | blocked | completed | cancelled
                             Lifecycle tracking
  
  priority                   enum, required: critical | high | medium | low
                             Urgency level
  
  assigned_to_type           enum, required: agent | cp_agent | human
                             Polymorphic actor type
  
  assigned_to_id             string, required
                             Polymorphic FK (resolve via assigned_to_type)
  
  due_date                   date, nullable
                             Optional deadline
  
  blocked_reason             string, nullable, 10-1000 chars
                             Why this obligation is blocked (if status=blocked)
  
  completion_evidence_id     FK to L31 evidence, nullable
                             Proof of completion
  
  notes                      string, nullable
                             Additional context
  
  created_at                 datetime, auto-generated
  updated_at                 datetime, auto-updated
  created_by                 string, required
  updated_by                 string, nullable

  GRAPH EDGES
  -----------
  obligates: work_decision_records (L54) → work_obligations (L55) via decision_id (inverse)
  obligation_evidence: work_obligations (L55) → evidence (L31) via completion_evidence_id

  USE CASES
  ---------
  1. Decision creates remediation obligation (security vulnerability → patch required)
  2. Policy violation triggers compliance obligation (license check failed → resolve before merge)
  3. WBS task generates follow-up (deploy to staging → verify in prod)
  4. Agent query: "What open obligations am I assigned to?"
  5. Dashboard: Overdue obligations by priority

--------------------------------------------------------------------------------
 L57 -- work_learning_feedback (ADAPTIVE LEARNING)
--------------------------------------------------------------------------------

  PURPOSE: Lessons learned, tuning signals, improvement insights from execution
  STATUS: Deployed March 9, 2026 (Session 41 Part 11)
  SCHEMA: schema/work_learning_feedback.schema.json
  PRIMARY KEY: id (format: learning-{YYYYMMDD}-{seq})
  PARENT: None (learning aggregates across work units)

  FIELD CATALOG
  -------------
  id                         PK, string, pattern: ^learning-[0-9]{8}-[0-9]{3,}$
  
  work_unit_ids              Array of FK to L52 work_execution_units, required
                             Source work units this learning was extracted from
  
  learning_type              enum, required: success_factor | failure_cause | optimization |
                             anti_pattern | best_practice | edge_case | tuning_signal
  
  observation                string, required, 20-2000 chars
                             What was observed (factual description)
  
  recommendation             string, required, 10-2000 chars
                             Actionable advice based on observation
  
  confidence_score           number, required, 0.0-1.0
                             Quality indicator (higher = more reliable, based on sample size)
  
  validation_status          enum, required: draft | under_review | validated | rejected | archived
                             Review lifecycle
  
  author_type                enum, required: agent | cp_agent | human
                             Who created this learning
  
  author_id                  string, required
                             Polymorphic FK
  
  pattern_ids                Array of FK to L58 work_reusable_patterns, nullable
                             Backfill: patterns derived from this learning
  
  tags                       Array of strings, nullable
                             Searchable categorization
  
  notes                      string, nullable
  
  created_at                 datetime, auto-generated
  validated_at               datetime, nullable
  validated_by               string, nullable

  GRAPH EDGES
  -----------
  learns_from: work_learning_feedback (L57) → work_execution_units (L52) via work_unit_ids[]
  learning_references_pattern: work_learning_feedback (L57) → work_reusable_patterns (L58) via pattern_ids[]

  USE CASES
  ---------
  1. Capture what worked: "success_factor: Incremental schema changes prevented migration failures"
  2. Capture what failed: "failure_cause: Missing validation caused corrupt records"
  3. Tuning signal: "optimization: API response time improved 40% after caching"
  4. Anti-pattern detection: "anti_pattern: Bulk operations without checkpoints led to data loss"
  5. Agent query: "Show validated learnings with confidence > 0.8 tagged 'deployment'"
  6. Feed into pattern creation (L58)

  CONFIDENCE SCORING GUIDANCE
  ---------------------------
  1.0 = Validated across 20+ executions, no exceptions observed
  0.8 = Consistent across 10+ executions, rare exceptions acceptable
  0.6 = Observed in 5+ executions, some contradictory evidence
  0.4 = Observed in 2-4 executions, limited sample size
  0.2 = Single observation, hypothesis only

--------------------------------------------------------------------------------
 L58 -- work_reusable_patterns (PATTERN LIBRARY)
--------------------------------------------------------------------------------

  PURPOSE: Approved execution templates derived from learning feedback
  STATUS: Deployed March 9, 2026 (Session 41 Part 11)
  SCHEMA: schema/work_reusable_patterns.schema.json
  PRIMARY KEY: id (format: pattern-{kebab-case-name})
  PARENT: None (library entity)

  FIELD CATALOG
  -------------
  id                         PK, string, pattern: ^pattern-[a-z0-9-]+$
                             Example: "pattern-incremental-schema-migration"
  
  pattern_name               string, required, 3-100 chars
                             Human-readable name
  
  pattern_type               enum, required: workflow | quality_gate | deployment |
                             testing | refactoring | analysis | remediation
  
  description                string, required, 20-2000 chars
                             Detailed guidance on when to apply this pattern
  
  applicability_conditions   Array of objects, nullable
                             [{ condition_type, condition_text }]
                             condition_type: project_type | tech_stack | complexity | risk_level | team_size | custom
  
  steps                      Array of objects, required
                             [{ step_number, step_name, step_description, required, validation_criteria[] }]
                             Executable steps with validation criteria
  
  expected_outcomes          Array of strings, nullable
                             What should be achieved if pattern followed correctly
  
  derived_from_learning_ids  Array of FK to L57 work_learning_feedback, nullable
                             Source learnings that informed this pattern
  
  example_work_units         Array of FK to L52 work_execution_units, nullable
                             Examples where this pattern was successfully applied
  
  approval_status            enum, required: draft | under_review | approved | deprecated
                             Governance lifecycle
  
  approval_date              datetime, nullable
  approver                   string, nullable
  
  version                    string, required, pattern: ^[0-9]+\.[0-9]+\.[0-9]+$
                             Semantic versioning (major.minor.patch)
  
  deprecation_reason         string, nullable
                             Why this pattern was deprecated (if status=deprecated)
  
  notes                      string, nullable
  
  created_at                 datetime, auto-generated
  updated_at                 datetime, auto-updated
  created_by                 string, required

  GRAPH EDGES
  -----------
  derives_pattern: work_reusable_patterns (L58) → work_learning_feedback (L57) via derived_from_learning_ids[]
  pattern_examples: work_reusable_patterns (L58) → work_execution_units (L52) via example_work_units[]

  USE CASES
  ---------
  1. Agent query: "Show approved workflow patterns for deployment work_type"
  2. Pattern application: Before starting work, query relevant patterns
  3. Pattern versioning: Update pattern based on new learnings, increment version
  4. Factory service registration (Phase 4): Services declare which patterns they implement
  5. Performance tracking (Phase 3): Measure pattern effectiveness via L59, L60

  EXAMPLE PATTERN: INCREMENTAL SCHEMA MIGRATION
  ----------------------------------------------
  ```json
  {
    "id": "pattern-incremental-schema-migration",
    "pattern_name": "Incremental Schema Migration (Zero-Downtime)",
    "pattern_type": "deployment",
    "description": "Migrate database schema incrementally to avoid production downtime",
    "applicability_conditions": [
      {
        "condition_type": "tech_stack",
        "condition_text": "Azure Cosmos DB, PostgreSQL, or other online-migration-capable DB"
      },
      {
        "condition_type": "risk_level",
        "condition_text": "High-risk schema changes affecting production data"
      }
    ],
    "steps": [
      {
        "step_number": 1,
        "step_name": "Add new nullable field",
        "step_description": "Add new field as nullable to avoid breaking existing writes",
        "required": true,
        "validation_criteria": ["Field exists in schema", "No write errors logged"]
      },
      {
        "step_number": 2,
        "step_name": "Backfill existing records",
        "step_description": "Script to populate new field for existing records",
        "required": true,
        "validation_criteria": ["100% records backfilled", "No null values for active records"]
      },
      {
        "step_number": 3,
        "step_name": "Deploy code using new field",
        "step_description": "Application code now reads/writes new field",
        "required": true,
        "validation_criteria": ["Deployment successful", "No rollback triggered"]
      },
      {
        "step_number": 4,
        "step_name": "Make field required (if needed)",
        "step_description": "Update schema validation to mark field as required",
        "required": false,
        "validation_criteria": ["Schema validation passes", "No validation errors"]
      }
    ],
    "expected_outcomes": [
      "Zero downtime during migration",
      "No data loss",
      "Rollback possible at any step"
    ],
    "approval_status": "approved",
    "version": "1.0.0"
  }
  ```

================================================================================
 PHASE 3 LAYERS (SESSION 41 PART 11) -- 2 LAYERS OPERATIONAL
================================================================================

--------------------------------------------------------------------------------
 L59 -- work_pattern_applications (CHILD OF L52 WORK UNITS)
--------------------------------------------------------------------------------

  PURPOSE: Pattern usage tracking for continuous improvement
  STATUS: Deployed March 9, 2026 (Session 41 Part 11)
  SCHEMA: schema/work_pattern_applications.schema.json
  PRIMARY KEY: id (format: application-{work_unit_id}-{seq})
  PARENT: work_execution_units (CASCADE on delete)

  FIELD CATALOG
  -------------
  id                         PK, string, pattern: ^application-[a-z0-9-]+-[0-9]{3,}$
  
  work_unit_id               FK to L52 work_execution_units, required (CASCADE)
                             Which work unit applied this pattern
  
  pattern_id                 FK to L58 work_reusable_patterns, required (RESTRICT)
                             Which pattern was applied
  
  applied_at                 datetime, required
                             When pattern was applied to the work unit
  
  adaptations_made           Array of objects, nullable
                             Adaptations or deviations from pattern template
                             [{ step_number, adaptation_description, adaptation_type }]
                             adaptation_type: skip | modify | add_step | reorder
  
  success_score              number, required, 0.0-1.0
                             Success rating (0.0 = failed, 1.0 = perfect execution)
  
  feedback                   string, nullable, 10-2000 chars
                             Freeform effectiveness feedback
  
  outcome_id                 FK to L56 work_outcomes, nullable
                             Link to outcome produced by applying this pattern
  
  notes                      string, nullable
  
  created_at                 datetime, auto-generated
  updated_at                 datetime, auto-updated
  created_by                 string, required
  updated_by                 string, nullable

  GRAPH EDGES
  -----------
  applies_pattern: work_pattern_applications (L59) → work_reusable_patterns (L58) via pattern_id
  pattern_applied_to: work_pattern_applications (L59) → work_execution_units (L52) via work_unit_id (CASCADE)

  USE CASES
  ---------
  1. Agent applies pattern: Create application record when pattern used
  2. Track adaptations: Record why pattern was modified for this context
  3. Measure effectiveness: success_score feeds into L60 performance profiles
  4. Query: "Show all applications of pattern-incremental-schema-migration with success_score < 0.5"
  5. Feedback loop: Identify patterns that frequently require adaptations (signal for pattern refinement)

--------------------------------------------------------------------------------
 L60 -- work_pattern_performance_profiles (AGGREGATE LAYER)
--------------------------------------------------------------------------------

  PURPOSE: Aggregate pattern effectiveness metrics for selection guidance
  STATUS: Deployed March 9, 2026 (Session 41 Part 11)
  SCHEMA: schema/work_pattern_performance_profiles.schema.json
  PRIMARY KEY: id (format: profile-{pattern_id})
  PARENT: None (computed/view layer)

  FIELD CATALOG
  -------------
  id                         PK, string, pattern: ^profile-pattern-[a-z0-9-]+$
  
  pattern_id                 FK to L58 work_reusable_patterns, required (RESTRICT)
                             Which pattern this profile tracks
  
  total_applications         integer, required, minimum 0
                             Count of L59 records for this pattern
  
  success_rate               number, required, 0.0-1.0
                             Aggregate success rate (avg of all success_score from L59)
  
  successful_applications    integer, required, minimum 0
                             Count with success_score >= 0.8
  
  failed_applications        integer, required, minimum 0
                             Count with success_score < 0.4
  
  avg_duration_seconds       number, nullable, minimum 0
                             Average work unit duration when pattern applied
  
  p50_duration_seconds       number, nullable, minimum 0
                             Median duration
  
  p95_duration_seconds       number, nullable, minimum 0
                             95th percentile (high-water mark)
  
  common_adaptations         Array of objects, nullable, max 5 items
                             Top 5 most frequent adaptations across all applications
                             [{ adaptation_description, frequency, step_numbers[], adaptation_type }]
  
  source_application_ids     Array of strings (FK to L59), nullable
                             All application IDs used to compute this profile
  
  last_updated               datetime, required
                             When profile was re-computed
  
  computation_method         enum: manual | scheduled_batch | on_demand | real_time
                             How profile was computed (transparency)
  
  notes                      string, nullable
  
  created_at                 datetime, auto-generated
  updated_at                 datetime, auto-updated
  created_by                 string, required
  updated_by                 string, nullable

  GRAPH EDGES
  -----------
  profiles_pattern: work_pattern_performance_profiles (L60) → work_reusable_patterns (L58) via pattern_id
  profile_sourced_from: work_pattern_performance_profiles (L60) → work_pattern_applications (L59) via source_application_ids[]

  USE CASES
  ---------
  1. Pattern selection: Agent queries "Which approved deployment patterns have success_rate > 0.9?"
  2. Performance comparison: Compare avg_duration across alternative patterns for same task
  3. Tuning signals: common_adaptations array reveals where patterns need refinement
  4. Pattern validation: Low success_rate triggers pattern review/deprecation workflow
  5. Dashboard: Display pattern effectiveness leaderboard for factory optimization

  COMPUTATION STRATEGY
  --------------------
  Profiles are computed periodically (nightly batch or on-demand trigger):
  1. Query all L59 records for pattern_id
  2. Calculate aggregate metrics (count, avg, percentiles)
  3. Extract top 5 common adaptations by frequency
  4. Update L60 record with computed values
  5. Set last_updated timestamp

  Profiles enable data-driven pattern selection without re-scanning all applications.

================================================================================
 PHASE 4 LAYERS (SESSION 41 PART 11) -- 6 LAYERS OPERATIONAL
================================================================================

  Status: L61-L66 deployed (March 2026)
  
  PURPOSE: Work Factory Services with SLAs
  
  Agents register as executable services with defined capabilities, performance
  profiles, and service level objectives. Service requests track demand. Service
  runs track execution attempts with resource consumption and error details.
  
  This enables:
  - Service-oriented architecture for AI agents
  - Demand-based work routing
  - SLA-driven quality assurance
  - Performance-based service selection
  - Automated breach detection (feeds Phase 5 remediation)

--------------------------------------------------------------------------------
 L61 -- work_factory_capabilities
--------------------------------------------------------------------------------

  Purpose: Capability catalog backed by patterns (L58)
  
  Abstract, compositional capabilities that can be assembled into services.
  Each capability is backed by one or more proven patterns from L58.
  
  PRIMARY KEY: capability-{kebab-case-name}
  Examples: capability-schema-migration, capability-api-deployment
  
  SCHEMA:
  {
    "id": "capability-schema-migration",
    "capability_name": "Schema Migration",
    "description": "Migrate database schemas safely with rollback support",
    "maturity_level": "stable",  # experimental|beta|stable|deprecated
    "backed_by_pattern_ids": ["pattern-blue-green-migration", "pattern-rollback-script"],
    "required_patterns": ["pattern-blue-green-migration"],
    "optional_patterns": ["pattern-rollback-script"],
    "prerequisites": [
      {
        "prerequisite_type": "infrastructure",
        "prerequisite_description": "Database with migration support"
      }
    ],
    "input_schema_ref": "schema-migration-input",  # FK to L21 schemas (optional)
    "output_schema_ref": "schema-migration-output",
    "owner_type": "agent",
    "owner_id": "agent-database-expert",
    "created_at": "2026-03-09T18:00:00Z",
    "created_by": "platform-admin"
  }
  
  FK relationships:
  - backed_by_pattern_ids[] → L58 work_reusable_patterns (SET_NULL on pattern delete)
  - input_schema_ref/output_schema_ref → L21 schemas (optional validation)
  - Polymorphic: owner_type/owner_id (agent/cp_agent/persona)
  
  Graph edges:
  - backs_capability: L61 → L58 (capabilities backed by patterns)
  
  Use cases:
  - Catalog available automation capabilities
  - Track capability maturity lifecycle
  - Define prerequisites for service deployment
  - Compose capabilities into services (L62)

--------------------------------------------------------------------------------
 L62 -- work_factory_services
--------------------------------------------------------------------------------

  Purpose: Service packaging of capabilities - concrete invocable implementations
  
  Services are deployed, versioned, invocable units that provide one or more
  capabilities. Each service has a provider (agent/external API/human), endpoint,
  authentication method, and links to performance profile (L65) and SLAs (L66).
  
  PRIMARY KEY: service-{kebab-case-name}
  Examples: service-schema-migrator, service-api-deployer
  
  SCHEMA:
  {
    "id": "service-schema-migrator",
    "service_name": "Schema Migration Service",
    "description": "Automated database schema migration with rollback",
    "service_type": "asynchronous",  # synchronous|asynchronous|streaming|batch
    "required_capability_ids": ["capability-schema-migration"],
    "optional_capability_ids": ["capability-health-check"],
    "input_schema": { "type": "object", "properties": {...} },  # Embedded JSON schema
    "output_schema": { "type": "object", "properties": {...} },
    "provider_type": "agent",  # agent|cp_agent|external_api|human
    "provider_id": "agent-database-expert",
    "endpoint_url": "https://eva-services.internal/schema-migrator",
    "authentication_method": "managed_identity",  # none|api_key|oauth2|managed_identity|custom
    "status": "production",  # planned|development|testing|production|maintenance|deprecated
    "availability_sla_ref": "slo-service-schema-migrator-success_rate",  # FK to L66
    "performance_profile_ref": "profile-service-schema-migrator",  # FK to L65
    "version": "2.1.0",
    "deployment_target": "Azure Container App",
    "created_at": "2026-03-09T18:00:00Z",
    "created_by": "platform-admin"
  }
  
  FK relationships:
  - required_capability_ids[] → L61 (RESTRICT on capability delete)
  - optional_capability_ids[] → L61 (RESTRICT)
  - availability_sla_ref → L66 (primary SLA)
  - performance_profile_ref → L65 (current performance)
  - Polymorphic: provider_type/provider_id
  
  Graph edges:
  - requires_capability: L62 → L61 (service requires capability)
  - provides_optional_capability: L62 → L61 (service provides optional capability)
  
  Use cases:
  - Register agent capabilities as invocable services
  - Track service lifecycle (development → production → deprecated)
  - Link services to SLAs for breach monitoring
  - Route requests based on service availability

--------------------------------------------------------------------------------
 L63 -- work_service_requests
--------------------------------------------------------------------------------

  Purpose: Service invocation requests - demand intake
  
  Each request represents a demand for a service (L62). Requests track priority,
  lifecycle status (queued → completed/failed), and optional project/work context.
  
  PRIMARY KEY: request-{YYYYMMDD}-{seq}
  Examples: request-20260309-001, request-20260309-042
  
  SCHEMA:
  {
    "id": "request-20260309-001",
    "service_id": "service-schema-migrator",  # FK to L62 (RESTRICT)
    "requester_type": "agent",  # agent|cp_agent|persona|external_system
    "requester_id": "agent-project-manager",
    "project_id": "project-eva-foundry",  # FK to L25 (optional context)
    "work_unit_id": "workunit-20260309-schema-updates",  # FK to L52 (optional trigger)
    "input_payload": { "migration_script": "...", "target_db": "..." },
    "priority": "high",  # critical|high|medium|low
    "status": "in_progress",  # queued|assigned|in_progress|completed|failed|cancelled
    "requested_at": "2026-03-09T18:00:00Z",
    "assigned_at": "2026-03-09T18:00:30Z",
    "completed_at": null
  }
  
  FK relationships:
  - service_id → L62 (RESTRICT - cannot delete service with pending requests)
  - Polymorphic: requester_type/requester_id
  - project_id → L25 (optional context)
  - work_unit_id → L52 (optional trigger)
  
  Graph edges:
  - requests_service: L63 → L62 (request for service)
  - request_context_project: L63 → L25 (project context)
  - request_triggered_by: L63 → L52 (work unit trigger)
  
  Use cases:
  - Track service demand and backlog
  - Priority-based work scheduling
  - Tie service requests to projects (L25) and work units (L52)
  - Cancel pending requests when project priorities change

--------------------------------------------------------------------------------
 L64 -- work_service_runs
--------------------------------------------------------------------------------

  Purpose: Service runtime execution instances - child of requests (L63)
  
  Each run is an execution attempt for a service request. Tracks timing, status,
  output, errors, retry attempts, and resource consumption. Feeds performance
  profiles (L65) and SLO breach detection (L67).
  
  PRIMARY KEY: run-{request_id}-{attempt}
  Examples: run-request-20260309-001-01, run-request-20260309-001-02 (retry)
  
  SCHEMA:
  {
    "id": "run-request-20260309-001-01",
    "request_id": "request-20260309-001",  # FK to L63 (CASCADE on request delete)
    "work_unit_id": "workunit-20260309-schema-updates",  # FK to L52 (SET_NULL, optional provenance)
    "started_at": "2026-03-09T18:00:35Z",
    "completed_at": "2026-03-09T18:02:10Z",
    "duration_seconds": 95,
    "status": "succeeded",  # running|succeeded|failed|timeout|cancelled
    "output_payload": { "migration_status": "success", "rows_affected": 1523 },
    "error_details": null,
    "retry_attempt": 1,  # 1 = first attempt, 2+ = retries
    "resource_consumption": {
      "cpu_seconds": 45.2,
      "memory_mb": 512,
      "tokens_consumed": 0,
      "cost_usd": 0.012
    },
    "trace_ids": ["trace-llm-20260309-001"],  # FK to L32 traces (LLM observability)
    "evidence_ids": ["evidence-migration-diff-001"]  # FK to L31 evidence (artifacts)
  }
  
  FK relationships:
  - request_id → L63 (CASCADE - runs deleted with request)
  - work_unit_id → L52 (SET_NULL, optional provenance)
  - trace_ids[] → L32 traces
  - evidence_ids[] → L31 evidence
  
  Graph edges:
  - fulfills_request: L64 → L63 (run fulfills request, CASCADE)
  - run_creates_work: L64 → L52 (run creates work unit, SET_NULL)
  
  Use cases:
  - Track execution attempts with retry logic
  - Measure resource consumption for cost analysis
  - Link LLM traces (L32) to specific service runs
  - Feed performance profiles (L65) with timing/success data

--------------------------------------------------------------------------------
 L65 -- work_service_perf_profiles
--------------------------------------------------------------------------------

  Purpose: Aggregate service performance metrics (computed view)
  
  Per-service performance profile computed from service runs (L64). Tracks
  success rate, timing percentiles, cost, and common errors. Used for
  service selection, capacity planning, and SLO compliance checking.
  
  PRIMARY KEY: profile-{service_id}
  Examples: profile-service-schema-migrator
  
  SCHEMA:
  {
    "id": "profile-service-schema-migrator",
    "service_id": "service-schema-migrator",  # FK to L62 (RESTRICT)
    "total_runs": 1523,
    "success_rate": 0.987,
    "successful_runs": 1503,
    "failed_runs": 18,
    "timeout_runs": 2,
    "avg_duration_seconds": 94.3,
    "p50_duration_seconds": 87.0,
    "p95_duration_seconds": 142.0,
    "p99_duration_seconds": 201.5,
    "avg_cost_usd": 0.011,
    "total_cost_usd": 16.75,
    "common_errors": [
      {
        "error_code": "DB_CONNECTION_TIMEOUT",
        "frequency": 12,
        "sample_message": "Connection to database timed out after 30s",
        "retryable": true
      }
    ],
    "source_run_ids": ["run-request-20260309-001-01", "..."],  # FK to L64 (audit trail)
    "last_updated": "2026-03-09T18:30:00Z",
    "computation_method": "scheduled_batch",  # manual|scheduled_batch|on_demand|real_time
    "time_window_hours": 168,  # 7 days
    "notes": "Service performing well. 98.7% success rate exceeds SLA (95%)."
  }
  
  FK relationships:
  - service_id → L62 (RESTRICT)
  - source_run_ids[] → L64 (audit trail)
  
  Graph edges:
  - profiles_service: L65 → L62 (performance profile for service)
  - profile_based_on_runs: L65 → L64 (computed from runs)
  
  Use cases:
  - Monitor service health and performance trends
  - Detect degradation before SLO breach
  - Compare services for demand routing
  - Capacity planning (cost per run, timing percentiles)

--------------------------------------------------------------------------------
 L66 -- work_service_level_objectives
--------------------------------------------------------------------------------

  Purpose: SLA definitions and thresholds per service
  
  Service Level Objectives (SLOs) define expected performance, availability,
  and quality metrics. Breaches create L67 breach records for auto-remediation.
  
  PRIMARY KEY: slo-{service_id}-{metric_name}
  Examples: slo-service-schema-migrator-success_rate
  
  SCHEMA:
  {
    "id": "slo-service-schema-migrator-success_rate",
    "service_id": "service-schema-migrator",  # FK to L62 (CASCADE on service delete)
    "metric_name": "success_rate",  # success_rate|p95_duration_seconds|avg_cost_usd|...
    "target_value": 0.99,  # Target: 99% success rate
    "threshold_warning": 0.95,  # Warning at 95%
    "threshold_critical": 0.90,  # Critical (breach) at 90%
    "measurement_window_hours": 24,
    "evaluation_frequency_minutes": 15,
    "comparison_operator": ">=",  # >=|<=|==|>|<
    "status": "active",  # active|paused|archived
    "priority": "high",  # critical|high|medium|low
    "description": "Service must maintain 99% success rate over 24-hour window",
    "remediation_runbook_url": "https://wiki.internal/runbooks/schema-migrator-breach",
    "notification_channels": [
      {
        "channel_type": "slack",
        "channel_address": "#eva-alerts",
        "severity_levels": ["critical"]
      }
    ],
    "last_breach_at": "2026-02-15T14:30:00Z",
    "last_evaluation_at": "2026-03-09T18:30:00Z",
    "last_evaluation_result": {
      "actual_value": 0.987,
      "target_value": 0.99,
      "status": "ok",
      "evaluated_at": "2026-03-09T18:30:00Z"
    },
    "breach_count_24h": 0,
    "breach_count_7d": 2
  }
  
  FK relationships:
  - service_id → L62 (CASCADE - SLOs deleted with service)
  
  Graph edges:
  - defines_slo: L66 → L62 (SLO for service)
  
  Use cases:
  - Define quality expectations for services
  - Automated SLO breach detection (feeds L67 in Phase 5)
  - Alert routing based on severity
  - Track breach trends over time

================================================================================
 PHASE 5 LAYERS (SESSION 41 PART 11) -- 4 LAYERS OPERATIONAL
================================================================================

  Status: L67-L70 deployed (March 2026 6:37 PM ET)
  
  PURPOSE: Breach Remediation & Lifecycle Management
  
  Complete self-healing loop for service quality violations. When SLOs (L66) are
  breached, automated breach detection creates incidents (L67), generates remediation
  plans (L68), executes recovery, validates success (L69), and captures lessons (L57).
  Lifecycle tracking (L70) provides audit trail for all service transitions.
  
  This enables:
  - Automated SLO breach detection and alerting
  - Runbook-driven remediation with approval workflows
  - Post-remediation verification with pre/post comparison
  - Learning capture for continuous improvement
  - Service lifecycle audit trail (deploy, upgrade, scale, retire)

--------------------------------------------------------------------------------
 L67 -- work_service_breaches
--------------------------------------------------------------------------------

  Purpose: SLA breach incident records
  
  Triggered automatically when service performance (L65) violates SLO thresholds (L66).
  Tracks severity, impact, affected requests, and links to remediation plan (L68).
  
  PRIMARY KEY: breach-{slo_id}-{YYYYMMDD}-{seq}
  Examples: breach-slo-service-schema-migrator-success_rate-20260309-01
  
  SCHEMA:
  {
    "id": "breach-slo-service-schema-migrator-success_rate-20260309-01",
    "slo_id": "slo-service-schema-migrator-success_rate",  # FK to L66 (RESTRICT)
    "service_id": "service-schema-migrator",  # FK to L62 (RESTRICT)
    "breach_detected_at": "2026-03-09T18:15:00Z",
    "breach_resolved_at": "2026-03-09T18:37:00Z",
    "duration_minutes": 22,
    "severity": "critical",  # warning|critical
    "status": "resolved",  # active|remediating|resolved|acknowledged|false_positive
    "metric_name": "success_rate",
    "target_value": 0.99,
    "actual_value": 0.89,
    "threshold_breached": 0.90,  # Critical threshold
    "measurement_window_hours": 24,
    "impact_assessment": "Service success rate dropped to 89%, 150 requests failed",
    "root_cause_hypothesis": "Database connection pool exhausted",
    "affected_requests": ["request-20260309-042", "..."],  # FK to L63
    "failed_runs": ["run-request-20260309-042-01", "..."],  # FK to L64
    "notification_sent": true,
    "acknowledged_by": "agent-sre-oncall",
    "remediation_plan_id": "remediation-breach-slo-service-schema-migrator-success_rate-20260309-01",  # FK to L68
    "revalidation_result_id": "revalidation-breach-slo-service-schema-migrator-success_rate-20260309-01"  # FK to L69
  }
  
  FK relationships:
  - slo_id → L66 (RESTRICT - cannot delete SLO with active breaches)
  - service_id → L62 (RESTRICT)
  - affected_requests[] → L63 (impact tracking)
  - failed_runs[] → L64 (root cause analysis)
  - remediation_plan_id → L68 (SET_NULL)
  - revalidation_result_id → L69 (SET_NULL)
  
  Graph edges:
  - breaches_slo: L67 → L66 (breach of SLO)
  - breach_for_service: L67 → L62 (breach for service)
  - breach_affects_requests: L67 → L63 (affected requests)
  - breach_failed_runs: L67 → L64 (failed runs)
  
  Use cases:
  - Automated SLO breach detection
  - Impact assessment (how many requests failed)
  - Root cause hypothesis tracking
  - Breach lifecycle management (active → remediating → resolved)

--------------------------------------------------------------------------------
 L68 -- work_service_remediation_plans
--------------------------------------------------------------------------------

  Purpose: Step-by-step remediation plans for breaches
  
  Generated automatically from runbooks or created manually by operators. Includes
  step-by-step procedures, resource requirements, risks, and approval workflow.
  
  PRIMARY KEY: remediation-{breach_id}
  Examples: remediation-breach-slo-service-schema-migrator-success_rate-20260309-01
  
  SCHEMA:
  {
    "id": "remediation-breach-slo-service-schema-migrator-success_rate-20260309-01",
    "breach_id": "breach-slo-service-schema-migrator-success_rate-20260309-01",  # FK to L67 (CASCADE)
    "service_id": "service-schema-migrator",  # FK to L62 (RESTRICT)
    "plan_type": "semi_automated",  # automated|semi_automated|manual|escalation
    "status": "completed",  # draft|approved|executing|completed|failed|cancelled
    "priority": "critical",
    "title": "Scale database connection pool and restart service",
    "description": "Increase connection pool from 20 to 50, restart service instances",
    "remediation_steps": [
      {
        "step_number": 1,
        "step_name": "Increase connection pool size",
        "step_description": "Update database.connection_pool_size from 20 to 50",
        "required": true,
        "estimated_duration_minutes": 5,
        "automation_available": true,
        "validation_criteria": ["Config deployed", "No errors in logs"],
        "rollback_instructions": "Revert config to 20"
      }
    ],
    "estimated_duration_minutes": 20,
    "resource_requirements": {
      "agent_type": "agent-infrastructure-manager",
      "infrastructure_changes": ["Database connection pool scaling"],
      "estimated_cost_usd": 0.05
    },
    "risks": [
      {"risk_description": "Restart causes brief downtime", "likelihood": "medium", "mitigation": "Rolling restart"}
    ],
    "approved_by": "agent-sre-oncall",
    "work_unit_id": "workunit-20260309-remediation-001",  # FK to L52 (SET_NULL)
    "success": true,
    "lessons_learned": "Connection pool was undersized for peak load"
  }
  
  FK relationships:
  - breach_id → L67 (CASCADE - remediation deleted with breach)
  - service_id → L62 (RESTRICT)
  - work_unit_id → L52 (SET_NULL, execution tracking)
  
  Graph edges:
  - remediates_breach: L68 → L67 (remediation for breach, CASCADE)
  - remediation_for_service: L68 → L62 (remediation for service)
  - remediation_work: L68 → L52 (work unit executing remediation)
  
  Use cases:
  - Codify runbook procedures as structured steps
  - Require approval for high-risk remediations
  - Track resource requirements and costs
  - Feed lessons learned to L57 for pattern creation

--------------------------------------------------------------------------------
 L69 -- work_service_revalidation_results
--------------------------------------------------------------------------------

  Purpose: Post-remediation verification
  
  Validates whether remediation successfully resolved the breach. Compares pre/post
  metrics, determines SLO compliance, and feeds learning feedback (L57).
  
  PRIMARY KEY: revalidation-{breach_id}
  Examples: revalidation-breach-slo-service-schema-migrator-success_rate-20260309-01
  
  SCHEMA:
  {
    "id": "revalidation-breach-slo-service-schema-migrator-success_rate-20260309-01",
    "breach_id": "breach-slo-service-schema-migrator-success_rate-20260309-01",  # FK to L67 (CASCADE)
    "remediation_plan_id": "remediation-breach-slo-service-schema-migrator-success_rate-20260309-01",  # FK to L68 (CASCADE)
    "service_id": "service-schema-migrator",  # FK to L62 (RESTRICT)
    "slo_id": "slo-service-schema-migrator-success_rate",  # FK to L66 (RESTRICT)
    "revalidation_performed_at": "2026-03-09T18:37:00Z",
    "measurement_window_hours": 24,
    "metric_name": "success_rate",
    "target_value": 0.99,
    "pre_remediation_value": 0.89,
    "post_remediation_value": 0.991,
    "threshold_critical": 0.90,
    "passed": true,
    "improvement_percentage": 11.3,
    "result_status": "fully_resolved",  # fully_resolved|partially_resolved|no_improvement|degraded
    "sample_size": 237,
    "sample_run_ids": ["run-request-20260309-180-01", "..."],  # FK to L64
    "comparison_data": {
      "pre_remediation": {"total_runs": 1000, "success_count": 890, "failure_count": 110},
      "post_remediation": {"total_runs": 237, "success_count": 235, "failure_count": 2}
    },
    "next_steps": "Continue monitoring for 48 hours. Apply connection pool pattern to similar services.",
    "learning_feedback_id": "learning-20260309-042"  # FK to L57 (SET_NULL)
  }
  
  FK relationships:
  - breach_id → L67 (CASCADE - revalidation deleted with breach)
  - remediation_plan_id → L68 (CASCADE)
  - service_id → L62 (RESTRICT)
  - slo_id → L66 (RESTRICT)
  - sample_run_ids[] → L64 (measurement sample)
  - learning_feedback_id → L57 (SET_NULL, continuous improvement)
  
  Graph edges:
  - revalidates_breach: L69 → L67 (revalidation for breach, CASCADE)
  - revalidates_remediation: L69 → L68 (revalidation of plan, CASCADE)
  - revalidation_samples: L69 → L64 (runs sampled for measurement)
  - revalidation_learning: L69 → L57 (learning captured)
  
  Use cases:
  - Verify remediation effectiveness
  - Compare pre/post metrics objectively
  - Determine if breach truly resolved or requires escalation
  - Feed success/failure patterns to learning layer (L57)

--------------------------------------------------------------------------------
 L70 -- work_service_lifecycle
--------------------------------------------------------------------------------

  Purpose: Service lifecycle event audit trail
  
  Tracks all major service transitions: deployment, upgrades, scaling, maintenance,
  deprecation, retirement. Provides operational history and links to work units (L52)
  and breach-driven changes (L67, L68).
  
  PRIMARY KEY: lifecycle-{service_id}-{YYYYMMDD}-{seq}
  Examples: lifecycle-service-schema-migrator-20260309-01
  
  SCHEMA:
  {
    "id": "lifecycle-service-schema-migrator-20260309-01",
    "service_id": "service-schema-migrator",  # FK to L62 (CASCADE)
    "event_type": "upgraded",  # deployed|upgraded|downgraded|scaled_up|scaled_down|maintenance_started|maintenance_completed|deprecated|retired|restored|configuration_changed|endpoint_migrated
    "event_timestamp": "2026-03-09T18:30:00Z",
    "triggered_by_type": "agent",  # agent|cp_agent|human|automated_system|scheduled_job
    "triggered_by_id": "agent-infrastructure-manager",
    "reason": "Remediation plan for SLO breach (connection pool scaling)",
    "previous_state": {
      "version": "2.1.0",
      "status": "production",
      "deployment_target": "Azure Container App"
    },
    "new_state": {
      "version": "2.1.1",
      "status": "production",
      "deployment_target": "Azure Container App"
    },
    "change_details": {
      "version_from": "2.1.0",
      "version_to": "2.1.1",
      "configuration_diff": "{\"database.connection_pool_size\": {\"old\": 20, \"new\": 50}}",
      "infrastructure_changes": ["Database connection pool scaled"],
      "breaking_changes": false
    },
    "duration_minutes": 12,
    "downtime_minutes": 0,  # Zero-downtime rolling restart
    "success": true,
    "work_unit_id": "workunit-20260309-remediation-001",  # FK to L52 (SET_NULL)
    "breach_id": "breach-slo-service-schema-migrator-success_rate-20260309-01",  # FK to L67 (SET_NULL)
    "remediation_plan_id": "remediation-breach-slo-service-schema-migrator-success_rate-20260309-01"  # FK to L68 (SET_NULL)
  }
  
  FK relationships:
  - service_id → L62 (CASCADE - lifecycle events deleted with service)
  - work_unit_id → L52 (SET_NULL, execution provenance)
  - breach_id → L67 (SET_NULL, breach-driven changes)
  - remediation_plan_id → L68 (SET_NULL, remediation-driven changes)
  - evidence_ids[] → L31 (deployment artifacts, logs)
  
  Graph edges:
  - lifecycle_for_service: L70 → L62 (lifecycle event for service, CASCADE)
  - lifecycle_work: L70 → L52 (work unit executing event)
  - lifecycle_breach_driven: L70 → L67 (triggered by breach)
  - lifecycle_remediation_driven: L70 → L68 (part of remediation)
  
  Use cases:
  - Audit trail for service changes
  - Track upgrade/downgrade history
  - Link operational events to breaches (root cause)
  - Zero-downtime deployment verification
  - Compliance reporting (who changed what, when, why)

================================================================================
 PHASE 6 LAYERS (SESSION 41 PART 11) -- 5 LAYERS OPERATIONAL
================================================================================

 Status: ALL 24 execution layers operational (L52-L75)

 Phase 6 deploys 5 layers (L71-L75) for Strategy & Portfolio Management.
 This completes the EVA Execution Engine with full portfolio governance,
 strategic roadmaps, investment tracking, KPI monitoring, and policy enforcement.

 Updated: March 9, 2026 6:37 PM ET

─────────────────────────────────────────────────────────────────────────────
 L71 work_factory_portfolio
─────────────────────────────────────────────────────────────────────────────

  PURPOSE:
    Portfolio management view of all work services. Executive-level oversight
    with service inventory, health rollups, capacity tracking, and strategic
    prioritization. Enables portfolio-level reporting and resource allocation.

  PRIMARY KEY:
    portfolio-{name-slug}
    Examples: portfolio-core-services, portfolio-ai-automation

  FOREIGN KEYS:
    service_ids[]           → L62 work_factory_services (many-to-many)
    roadmap_ids[]           → L72 work_factory_roadmaps (many-to-many)
    active_investment_ids[] → L73 work_factory_investments (many-to-many)
    governance_policy_ids[] → L75 work_factory_governance (many-to-many)

  KEY FIELDS:
    - portfolio_name: Human-readable name
    - description: Portfolio purpose and scope
    - owner_type/owner_id: Polymorphic owner (cp_agent, human, team, department)
    - status: active, planning, maintenance, deprecated, retired
    - service_ids[]: Services in portfolio
    - service_count: Total services (calculated)
    - health_summary: {
        healthy_services: Count meeting SLOs,
        degraded_services: Count with warnings,
        critical_services: Count with active breaches,
        offline_services: Count unavailable,
        overall_health_score: 0-100 weighted score,
        last_updated_at: Refresh timestamp
      }
    - capacity_summary: {
        total_requests_24h: Request volume,
        total_runs_24h: Execution volume,
        average_success_rate: 0-1,
        total_active_breaches: Breach count,
        peak_load_services[]: Services at capacity
      }
    - strategic_priority: critical, high, medium, low
    - investment_level: flagship, growth, maintenance, harvest, divest
    - cost_summary: {
        total_cost_usd_mtd: Month-to-date cost,
        budget_allocation_usd: Budget for period,
        burn_rate_percentage: Budget burn rate,
        projected_end_of_month_usd: Projected cost
      }
    - tags[]: Classification tags

  GRAPH EDGES (4):
    portfolio_services: L71 → L62 (many-to-many via service_ids)
    portfolio_roadmaps: L71 → L72 (many-to-many via roadmap_ids)
    portfolio_investments: L71 → L73 (many-to-many via active_investment_ids)
    portfolio_governance: L71 → L75 (many-to-many via governance_policy_ids)

  USE CASES:
    1. Portfolio Dashboard: Aggregate health/capacity/cost metrics across services
    2. Strategic Planning: Identify investment priorities based on health + priority
    3. Resource Allocation: Balance budgets across portfolio based on burn rates
    4. Executive Reporting: High-level status for leadership with drill-down to services

  SAMPLE SCHEMA:
    {
      "id": "portfolio-ai-automation",
      "portfolio_name": "AI Automation Suite",
      "description": "Portfolio of AI-driven automation services for SDLC",
      "owner_type": "cp_agent",
      "owner_id": "cp-agent-eva-foundation",
      "status": "active",
      "service_ids": ["service-code-generation", "service-documentation"],
      "service_count": 2,
      "health_summary": {
        "healthy_services": 1,
        "degraded_services": 1,
        "critical_services": 0,
        "overall_health_score": 85.5
      },
      "strategic_priority": "critical",
      "investment_level": "flagship"
    }

─────────────────────────────────────────────────────────────────────────────
 L72 work_factory_roadmaps
─────────────────────────────────────────────────────────────────────────────

  PURPOSE:
    Strategic roadmaps for capability and service evolution. Forward-looking
    initiatives with milestones, dependencies, timelines. Enables strategic
    planning and capability gap analysis.

  PRIMARY KEY:
    roadmap-{name-slug}
    Examples: roadmap-ai-automation-q2-2026, roadmap-service-reliability

  FOREIGN KEYS:
    portfolio_id                    → L71 work_factory_portfolio (RESTRICT)
    initiatives[].target_capability_ids[] → L61 work_factory_capabilities
    initiatives[].target_service_ids[]    → L62 work_factory_services
    initiatives[].investment_id           → L73 work_factory_investments (SET_NULL)
    initiatives[].milestone_ids[]         → L28 milestones

  KEY FIELDS:
    - roadmap_name: Human-readable name
    - description: Strategic vision and objectives
    - portfolio_id: FK to portfolio (RESTRICT)
    - owner_type/owner_id: Polymorphic owner
    - status: draft, proposed, approved, active, on_hold, completed, cancelled
    - planning_horizon: short_term_3mo, medium_term_6mo, long_term_12mo, multi_year
    - start_date/target_end_date/actual_completion_date: Timeline tracking
    - initiatives[]: Array of strategic initiatives with:
      - initiative_id/initiative_name/description
      - status: planned, in_progress, blocked, completed, cancelled
      - priority: critical, high, medium, low
      - target_capability_ids[]/target_service_ids[]: FKs to targets
      - investment_id: FK to business case
      - milestone_ids[]: FK to milestones
      - dependencies[]: {dependency_type, dependency_id, blocking}
      - estimated_effort_person_days/actual_effort_person_days
    - strategic_themes[]: High-level themes
    - success_criteria[]: Measurable success metrics
    - risks[]: {risk_description, likelihood, impact, mitigation_plan}
    - progress_percentage: 0-100 (calculated from initiatives)

  GRAPH EDGES (4):
    roadmap_for_portfolio: L72 → L71 (many-to-one via portfolio_id, RESTRICT)
    roadmap_target_capabilities: L72 → L61 (many-to-many via initiatives)
    roadmap_target_services: L72 → L62 (many-to-many via initiatives)
    roadmap_milestones: L72 → L28 (many-to-many via initiatives)

  USE CASES:
    1. Strategic Planning: Define forward-looking capability development
    2. Dependency Management: Track initiative dependencies and blockers
    3. Progress Tracking: Monitor roadmap execution vs plan
    4. Investment Prioritization: Link initiatives to business cases (L73)

  SAMPLE SCHEMA:
    {
      "id": "roadmap-ai-auto-scaling-2026",
      "roadmap_name": "AI Service Auto-scaling Initiative 2026",
      "portfolio_id": "portfolio-ai-automation",
      "status": "active",
      "planning_horizon": "medium_term_6mo",
      "initiatives": [
        {
          "initiative_id": "init-autoscale-codegen",
          "initiative_name": "Auto-scale code generation service",
          "status": "in_progress",
          "priority": "high",
          "target_service_ids": ["service-code-generation"],
          "investment_id": "investment-ai-auto-scaling-20260309"
        }
      ],
      "progress_percentage": 35
    }

─────────────────────────────────────────────────────────────────────────────
 L73 work_factory_investments
─────────────────────────────────────────────────────────────────────────────

  PURPOSE:
    Investment decisions and business justification. ROI tracking, approval
    workflows, funding allocation, actual returns. Enables investment portfolio
    management and budget planning.

  PRIMARY KEY:
    investment-{name-slug}-{YYYYMMDD}
    Examples: investment-ai-auto-scaling-20260309

  FOREIGN KEYS:
    portfolio_id             → L71 work_factory_portfolio (RESTRICT)
    roadmap_id               → L72 work_factory_roadmaps (SET_NULL)
    target_capability_ids[]  → L61 work_factory_capabilities
    target_service_ids[]     → L62 work_factory_services
    work_unit_ids[]          → L52 work_execution_units
    evidence_ids[]           → L31 evidence

  KEY FIELDS:
    - investment_name: Human-readable name
    - description: Business case summary and strategic rationale
    - portfolio_id: FK to portfolio (RESTRICT)
    - roadmap_id: FK to roadmap (SET_NULL)
    - investment_type: new_capability, service_enhancement, infrastructure_upgrade,
      reliability_improvement, cost_optimization, technical_debt_reduction,
      security_hardening, compliance_requirement
    - status: draft, submitted, under_review, approved, rejected, funded,
      in_progress, completed, cancelled, deferred
    - requested_by: Polymorphic FK to requester
    - requested_at/approved_at: Timeline
    - requested_amount_usd/approved_amount_usd/actual_spent_usd: Financial tracking
    - financial_breakdown: {infrastructure, development, operational, training costs}
    - roi_analysis: {
        expected_annual_savings_usd/revenue_usd,
        payback_period_months,
        net_present_value_usd,
        internal_rate_of_return_percentage,
        actual_annual_savings_usd/revenue_usd (post-completion)
      }
    - benefits[]: {benefit_category, description, quantified_value}
    - risks[]: {risk_description, likelihood, impact, mitigation_plan}
    - approval_workflow: {approvals_received[], rejections[]}
    - success_metrics[]: Post-implementation results

  GRAPH EDGES (6):
    investment_for_portfolio: L73 → L71 (many-to-one via portfolio_id, RESTRICT)
    investment_for_roadmap: L73 → L72 (many-to-one via roadmap_id, SET_NULL)
    investment_target_capabilities: L73 → L61 (many-to-many)
    investment_target_services: L73 → L62 (many-to-many)
    investment_work: L73 → L52 (many-to-many via work_unit_ids)
    investment_evidence: L73 → L31 (many-to-many via evidence_ids)

  USE CASES:
    1. Business Case Management: Track investment requests with ROI analysis
    2. Approval Workflow: Multi-stakeholder approval for high-value investments
    3. ROI Tracking: Compare expected vs actual returns post-implementation
    4. Portfolio Optimization: Prioritize investments by ROI and strategic fit

  SAMPLE SCHEMA:
    {
      "id": "investment-ai-auto-scaling-20260309",
      "investment_name": "AI Auto-scaling Infrastructure",
      "portfolio_id": "portfolio-ai-automation",
      "roadmap_id": "roadmap-ai-auto-scaling-2026",
      "investment_type": "infrastructure_upgrade",
      "status": "approved",
      "requested_amount_usd": 250000,
      "approved_amount_usd": 250000,
      "roi_analysis": {
        "expected_annual_savings_usd": 500000,
        "payback_period_months": 6
      }
    }

─────────────────────────────────────────────────────────────────────────────
 L74 work_factory_metrics
─────────────────────────────────────────────────────────────────────────────

  PURPOSE:
    Factory-level KPIs and aggregate health metrics. Executive dashboard data
    with aggregate metrics across portfolios/services, trend analyses, benchmarks,
    target governance. Enables strategic decision-making and performance monitoring.

  PRIMARY KEY:
    metric-{category}-{name-slug}-{YYYYMMDD}-{HHMM}
    Examples: metric-service-availability-overall-20260309-1430

  FOREIGN KEYS:
    portfolio_id               → L71 work_factory_portfolio (SET_NULL)
    service_id                 → L62 work_factory_services (SET_NULL)
    capability_id              → L61 work_factory_capabilities (SET_NULL)
    breach_ids[]               → L67 work_service_breaches
    related_governance_policy_ids[] → L75 work_factory_governance
    evidence_ids[]             → L31 evidence

  KEY FIELDS:
    - metric_name: Metric name
    - metric_category: availability, performance, cost, capacity, quality,
      efficiency, reliability, security
    - description: Calculation methodology
    - measurement_timestamp: When measured
    - measurement_period: realtime, hourly, daily, weekly, monthly, quarterly, yearly
    - value: Metric value
    - unit: percentage, count, milliseconds, USD, requests_per_second
    - target_value/threshold_warning/threshold_critical: Governance thresholds
    - status: healthy, warning, critical, unknown
    - scope: factory_wide, portfolio, service, capability
    - aggregation_details: {
        sample_size, source_layers[], calculation_method, weighting_strategy
      }
    - trend_analysis: {
        previous_value, change_absolute, change_percentage,
        trend_direction (improving/stable/degrading),
        moving_average_7d, moving_average_30d
      }
    - benchmark_comparison: {
        internal_benchmark, external_benchmark, best_in_class,
        comparison_status (above/at/below benchmark)
      }
    - contributing_factors[]: {factor_type, factor_id, contribution_percentage}

  GRAPH EDGES (6):
    metric_for_portfolio: L74 → L71 (many-to-one via portfolio_id, SET_NULL)
    metric_for_service: L74 → L62 (many-to-one via service_id, SET_NULL)
    metric_for_capability: L74 → L61 (many-to-one via capability_id, SET_NULL)
    metric_breaches: L74 → L67 (many-to-many via breach_ids)
    metric_governance: L74 → L75 (many-to-many via related_governance_policy_ids)
    metric_evidence: L74 → L31 (many-to-many via evidence_ids)

  USE CASES:
    1. Executive Dashboard: Real-time factory health with aggregate KPIs
    2. Trend Analysis: Identify improving/degrading metrics over time
    3. Threshold Governance: Auto-alert when metrics breach thresholds
    4. Benchmarking: Compare performance to internal/external benchmarks

  SAMPLE SCHEMA:
    {
      "id": "metric-availability-overall-20260309-1430",
      "metric_name": "Overall Service Availability",
      "metric_category": "availability",
      "measurement_timestamp": "2026-03-09T14:30:00Z",
      "measurement_period": "hourly",
      "value": 99.87,
      "unit": "percentage",
      "target_value": 99.9,
      "status": "warning",
      "scope": "factory_wide",
      "trend_analysis": {
        "previous_value": 99.95,
        "change_percentage": -0.08,
        "trend_direction": "degrading"
      }
    }

─────────────────────────────────────────────────────────────────────────────
 L75 work_factory_governance
─────────────────────────────────────────────────────────────────────────────

  PURPOSE:
    Governance policies and compliance rules. Policy definitions, compliance
    requirements, approval thresholds, audit procedures, enforcement mechanisms.
    Enables policy-driven governance and automated enforcement.

  PRIMARY KEY:
    governance-policy-{name-slug}
    Examples: governance-policy-security-review-required,
              governance-policy-cost-approval-threshold

  FOREIGN KEYS:
    portfolio_ids[]         → L71 work_factory_portfolio (scope=portfolio)
    service_ids[]           → L62 work_factory_services (scope=service)
    capability_ids[]        → L61 work_factory_capabilities (scope=capability)
    related_cp_policy_ids[] → L16 cp_policies
    related_metric_ids[]    → L74 work_factory_metrics
    evidence_ids[]          → L31 evidence

  KEY FIELDS:
    - policy_name: Human-readable name
    - description: Policy rationale
    - policy_type: approval_workflow, compliance_requirement, quality_gate,
      cost_control, security_control, operational_standard, slo_enforcement,
      risk_management, audit_rule
    - scope: factory_wide, portfolio, service, capability, project
    - status: draft, proposed, active, deprecated, retired
    - effective_date/expiration_date: Policy lifecycle
    - owner_type/owner_id: Polymorphic owner
    - enforcement_mechanism: automated_blocking, automated_warning,
      manual_review_required, advisory_only, audit_post_facto
    - policy_rules[]: Array of detailed rules with:
      - rule_id/rule_description
      - condition_type: metric_threshold, cost_threshold, approval_required,
        mandatory_step, prohibited_action, time_based, risk_level
      - condition_details: {metric_name, operator, threshold_value, required_approvers}
      - enforcement_action: block_execution, require_approval, send_alert,
        log_warning, escalate, trigger_audit
    - compliance_mappings[]: {framework_name, control_id} (ISO 27001, SOC 2, GDPR, HIPAA)
    - violation_history: {total_violations_count, violations_last_30d}
    - review_frequency: monthly, quarterly, semi_annual, annual, ad_hoc

  GRAPH EDGES (5):
    governance_for_portfolios: L75 → L71 (many-to-many via portfolio_ids)
    governance_for_services: L75 → L62 (many-to-many via service_ids)
    governance_for_capabilities: L75 → L61 (many-to-many via capability_ids)
    governance_cp_policies: L75 → L16 (many-to-many via related_cp_policy_ids)
    governance_evidence: L75 → L31 (many-to-many via evidence_ids)

  USE CASES:
    1. Policy Enforcement: Block deployments violating security policies
    2. Compliance Auditing: Track compliance with ISO 27001, SOC 2, etc.
    3. Approval Workflows: Enforce multi-stakeholder approvals for high-risk changes
    4. Threshold Governance: Alert when metrics breach policy-defined thresholds

  SAMPLE SCHEMA:
    {
      "id": "governance-policy-security-review-required",
      "policy_name": "Security Review Required for Production Deployments",
      "policy_type": "security_control",
      "scope": "factory_wide",
      "status": "active",
      "enforcement_mechanism": "automated_blocking",
      "policy_rules": [
        {
          "rule_id": "rule-01-approval",
          "condition_type": "approval_required",
          "condition_details": {
            "required_approvers": ["team-security"],
            "minimum_approvals_required": 1
          },
          "enforcement_action": "block_execution"
        }
      ],
      "compliance_mappings": [
        {"framework_name": "ISO 27001", "control_id": "A.12.1.2"}
      ]
    }

================================================================================
 DEPLOYMENT TIMELINE (COMPLETE)
================================================================================

  Phase 1 (L52-L56):     March 2026    ✅ DEPLOYED (Session 41 Part 10)
  Phase 2 (L55,L57-L58): March 2026    ✅ DEPLOYED (Session 41 Part 11)
  Phase 3 (L59-L60):     March 2026    ✅ DEPLOYED (Session 41 Part 11)
  Phase 4 (L61-L66):     March 2026    ✅ DEPLOYED (Session 41 Part 11)
  Phase 5 (L67-L70):     March 2026    ✅ DEPLOYED (Session 41 Part 11)
  Phase 6 (L71-L75):     March 2026    ✅ DEPLOYED (Session 41 Part 11)

  ALL 24 EXECUTION LAYERS DEPLOYED (L52-L75)

  STRATEGIC IMPACT:
    EVA Foundation now has COMPLETE EXECUTION ENGINE with:
    1. Work Execution (L52-L56): Governed AI work with full audit trail
    2. Learning & Patterns (L57-L60): Continuous improvement feedback loop
    3. Service Factory (L61-L66): Agent-as-service with SLA governance
    4. Self-Healing (L67-L70): Automated breach detection & remediation
    5. Strategy & Portfolio (L71-L75): Executive oversight & governance

  COMPETITIVE ADVANTAGE:
    ZERO other AI coding platforms have:
    - Portfolio-level health dashboards (L71, L74)
    - Strategic roadmaps with ROI tracking (L72, L73)
    - Policy-driven governance with compliance mapping (L75)
    - Self-healing services with continuous learning (L67-L70 → L57-L58)

  MARKET DIFFERENTIATION:
    Enterprise customers (insurance, banks, FDA-regulated) can now:
    - Track AI service portfolios like traditional IT services
    - Justify AI investments with quantified ROI analysis
    - Enforce governance policies with compliance audit trails
    - Manage AI services with strategic roadmaps and KPIs

================================================================================
 KNOWN LIMITATIONS & FUTURE WORK
================================================================================

  LIMITATION 1: NO RETRY TRACKING YET
  -----------------------------------
  Current: event_type=retry_attempt exists but no structured retry metadata
  Future: Add retry_count, backoff_strategy, max_retries to work_step_events
  Impact: Limited analysis of retry patterns and success rates

  LIMITATION 2: NO WORKFLOW ORCHESTRATION YET
  -------------------------------------------
  Current: workflow_id FK exists but no workflow execution engine
  Future: Phase 4 work_factory_services will provide orchestration
  Impact: Manual coordination required for multi-agent workflows

  LIMITATION 3: NO COST TRACKING YET
  ----------------------------------
  Current: No cost fields in work_execution_units
  Future: Add cost_usd, token_count, compute_time fields
  Impact: Cannot analyze cost per work unit

  LIMITATION 4: NO AUDIT LOG VISUALIZATION
  -----------------------------------------
  Current: Raw JSON records in Cosmos DB
  Future: Build timeline UI in 31-eva-faces/admin-face
  Impact: Manual JSON inspection required for timeline reconstruction

  LIMITATION 5: NO BULK OPERATIONS
  ---------------------------------
  Current: PUT one record at a time
  Future: POST /model/work_execution_units/bulk for batch creation
  Impact: Slower for high-volume work unit creation

  LIMITATION 6: NO SEARCH/INDEXING YET
  ------------------------------------
  Current: Query by exact field match only
  Future: Full-text search on title, description, action_taken
  Impact: Cannot search for "all work units mentioning 'schema validation'"

  FUTURE ENHANCEMENTS
  -------------------
  - Real-time event streaming (Azure Event Grid integration)
  - Anomaly detection (unusual retry rates, long durations)
  - Predictive analytics (estimate completion time based on historical data)
  - Automated remediation (trigger runbooks on specific error patterns)
  - Workflow templates (reusable work unit graphs for common tasks)
  - Agent performance scoring (reliability, speed, cost efficiency)
  - Work unit clustering (group similar work for batch optimization)
  - Timeline export (generate Mermaid Gantt charts from event stream)

================================================================================
 REFERENCES
================================================================================

  SCHEMAS (JSON Schema Draft-07)
  -------------------------------
  schema/work_execution_units.schema.json
  schema/work_step_events.schema.json
  schema/work_decision_records.schema.json
  schema/work_outcomes.schema.json

  ARCHITECTURE DOCS
  -----------------
  docs/architecture/EXECUTION-LAYERS-ASSESSMENT.md  -- Phased deployment plan
  docs/library/99-layers-design-20260309-0935.md    -- Canonical 75-layer design
  docs/library/98-model-ontology-for-agents.md      -- 12-domain cognitive architecture
  docs/library/10-FK-ENHANCEMENT.md                 -- FK design (27→38 edge types)
  docs/COMPLETE-LAYER-CATALOG.md                    -- Definitive layer catalog

  RELATED LAYERS
  --------------
  L25 projects          -- Project registry
  L26 wbs               -- Work breakdown structure
  L27 sprints           -- Sprint planning
  L28 milestones        -- Target milestones
  L31 evidence          -- Proof-of-completion artifacts
  L34 project_work      -- Session-level work tracking

  API ENDPOINTS
  -------------
  GET  /model/work_execution_units/
  GET  /model/work_execution_units/{id}
  PUT  /model/work_execution_units/{id}
  GET  /model/work_step_events/
  GET  /model/work_step_events/{id}
  PUT  /model/work_step_events/{id}
  GET  /model/work_decision_records/
  GET  /model/work_decision_records/{id}
  PUT  /model/work_decision_records/{id}
  GET  /model/work_outcomes/
  GET  /model/work_outcomes/{id}
  PUT  /model/work_outcomes/{id}

  ADMIN ENDPOINTS (Phase 0 FK Enhancement)
  -----------------------------------------
  GET  /model/relationships/orphans       -- Find dangling FKs
  POST /model/admin/validate-fks          -- Run FK validation

================================================================================
 REVISION HISTORY
================================================================================

  2026-03-09 14:00 ET -- Session 41 Part 10
    - Created this file (13-EXECUTION-LAYERS.md)
    - Documented 4 Phase 1 layers (L52, L53, L54, L56)
    - Defined 11 new FK edge types (27 → 38 total)
    - Added comprehensive usage patterns and JSON examples
    - Previewed 15 more layers (L55, L57-L70) for Phase 2-6

================================================================================
