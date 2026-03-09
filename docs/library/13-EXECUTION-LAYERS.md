================================================================================
 EVA DATA MODEL -- EXECUTION ENGINE (PHASES 1 & 2: L52-L58)
 File: docs/library/13-EXECUTION-LAYERS.md
 Created: 2026-03-09 -- Session 41 Part 10
 Updated: 2026-03-09 -- Session 41 Part 11 (Phase 2 deployed)
 Status: 7 layers operational (L52-L56, L57, L58), 17 layers planned (L59-L75)
 Source: https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io
 Design: docs/architecture/EXECUTION-LAYERS-ASSESSMENT.md (phased deployment plan)
         docs/library/99-layers-design-20260309-0935.md (canonical numbering)
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
 PHASE 3-6 PREVIEW -- 17 MORE LAYERS (L59-L75)
================================================================================

  Phase 1 deployed 4 layers (L52-L56). Phase 2 deployed 3 layers (L55, L57, L58).
  17 more layers planned across 4 phases.
  See docs/architecture/EXECUTION-LAYERS-ASSESSMENT.md for full phased plan.

  PHASE 3 (L59-L60) -- PATTERN APPLICATION & PERFORMANCE
  -------------------------------------------------------
  L59 work_pattern_applications     Instances where patterns were applied
  L60 work_pattern_perf_profiles    Performance profiles per pattern

  Use case: Agents query L58 for proven patterns, apply via L59, measure via L60

  PHASE 4 (L61-L66) -- WORK FACTORY SERVICES
  -------------------------------------------
  L61 work_factory_capabilities     Available automation capabilities
  L62 work_factory_services         Registered work services (agents as services)
  L63 work_service_requests         Service invocation requests
  L64 work_service_runs             Service execution records
  L65 work_service_perf_profiles    Per-service performance metrics
  L66 work_service_level_objs       SLA definitions for work services

  Vision: Agents register as work services, receive requests, deliver under SLA

  PHASE 5 (L67-L70) -- BREACH REMEDIATION & LIFECYCLE
  ----------------------------------------------------
  L67 work_service_breaches         SLA breach records
  L68 work_service_remed_plans      Remediation plans for breaches
  L69 work_service_reval_results    Re-evaluation after remediation
  L70 work_service_lifecycle        Service lifecycle events (deploy/retire/upgrade)

  Complete self-healing loop: breach → plan → remediate → re-evaluate → learn

  PHASE 6 (L71-L75) -- STRATEGY & PORTFOLIO (DOMAIN 12)
  ------------------------------------------------------
  L71 work_factory_portfolio        Portfolio of all work services
  L72 work_factory_roadmaps         Strategic roadmaps for capability evolution
  L73 work_factory_investments      Investment decisions for new capabilities
  L74 work_factory_metrics          Factory-level KPIs and health metrics
  L75 work_factory_governance       Governance policies for the work factory

  Vision: EVA Foundation as self-managing work factory with strategic planning

  DEPLOYMENT TIMELINE
  -------------------
  Phase 1 (L52-L56):     March 2026    ✅ DEPLOYED (Session 41 Part 10)
  Phase 2 (L55,L57-L58): March 2026    ✅ DEPLOYED (Session 41 Part 11)
  Phase 3 (L59-L60):     TBD
  Phase 4 (L61-L66):     TBD  
  Phase 5 (L67-L70):     TBD
  Phase 6 (L71-L75):     TBD

  Strategy: Deploy phases incrementally as operational needs emerge.
  No fixed timeline. Demand-driven deployment.

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
