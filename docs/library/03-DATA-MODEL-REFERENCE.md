================================================================================
 EVA DATA MODEL -- 51-LAYER REFERENCE
 File: docs/library/03-DATA-MODEL-REFERENCE.md
 Updated: 2026-03-08 9:13 AM ET -- 51 layers; Session 39 (Infrastructure Monitoring L40-L49 Deployed)
 Source: https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io
================================================================================

  PAPERLESS GOVERNANCE (Session 38, March 7, 2026 6:03 PM ET)
  -----------------------------------------------------------
  **Mandatory files on disk:** README.md + ACCEPTANCE.md ONLY
  **Everything else via API:** project_work, wbs, sprints, risks, decisions, evidence
  
  Query governance without markdown files:
    GET /model/project_work/{project_id}  -> replaces STATUS.md
    GET /model/wbs/?project_id={id}       -> replaces PLAN.md  
    GET /model/sprints/?project_id={id}   -> replaces sprint tracking
    GET /model/risks/?project_id={id}     -> replaces risk register
    GET /model/decisions/?project_id={id} -> replaces ADR files
    GET /model/evidence/?project_id={id}  -> replaces evidence/*.md
  
  Single source of truth. Always current. Queryable by any agent.

  COMPETITIVE ADVANTAGE: EVIDENCE LAYER (L31)
  -------------------------------------------
  The EVA Data Model is the ONLY AI coding platform with immutable audit trails.
  Evidence Layer = 31+ receipts with correlation IDs, test results, artifacts.
  
  Every AI-generated change gets a receipt. Every receipt is queryable.
  GitHub Copilot: ZERO audit trail. Cursor: ZERO audit trail. Devin: ZERO.
  EVA Foundation: FULL PROVENANCE. Insurance-ready. FDA 21 CFR Part 11 compliant.
  
  This is patent-worthy IP. This is the billion-dollar moat.
  
  Query: GET /model/evidence/         -> all receipts
         GET /model/evidence/{id}     -> specific story receipt
  Seed:  POST /model/admin/seed-evidence  (Bearer dev-admin)

  GOLDEN RULE
  -----------
  This HTTP API is the ONLY interface for agents.
  The model/*.json files are an INTERNAL IMPLEMENTATION DETAIL.
  Agents must never read, grep, parse, or reference them.
  One HTTP call beats ten file reads and ten grep commands.

  Bootstrap sequence for any agent (SESSION 38 ENHANCED):
    GET /health                -> confirms store=cosmos, gives agent_guide link
    GET /model/agent-guide     -> COMPLETE: 6 sections (discovery_journey,
                                  query_capabilities, write_cycle, common_mistakes,
                                  forbidden_actions, quick_reference)
    GET /model/agent-summary   -> all 51 layer counts in one call
    GET /model/layers          -> introspect all 51 layers with schema availability
    GET /model/{layer}/fields  -> get field names, types, descriptions for any layer
    GET /model/{layer}/example -> see real object structure from any layer

  DISCOVERY & INTROSPECTION (Session 26):
    All layers support self-documenting endpoints for agent orientation:
      GET /model/layers               -> 51 layers with descriptions, example counts
      GET /model/{layer}/fields       -> schema field definitions
      GET /model/{layer}/example      -> first real object for reference
      GET /model/{layer}/count        -> total object count
      GET /model/schema-def/{layer}   -> JSON Schema Draft-07 definition (WIP)

  UNIVERSAL QUERY OPERATORS (Session 26):
    All 51 layers support standardized query parameters:
      ?limit=N                        -> pagination (DEFAULT: use in terminal!)
      ?offset=N                       -> skip N records
      ?field=value                    -> exact match filter
      ?field.gt=value                 -> greater than
      ?field.lt=value                 -> less than
      ?field.contains=substring       -> substring search
      ?field.in=val1,val2,val3        -> multiple value match

    Response format (with metadata):
      { "data": [...], "metadata": {"total": N, "limit": N, "offset": N} }

  AGGREGATION ENDPOINTS (Session 26):
    Server-side aggregation for complex queries:
      GET /model/evidence/aggregate?group_by=phase&metrics=count,avg_test_count
      GET /model/sprints/{id}/metrics          -> phase breakdown (D1/D2/P/D3/A)
      GET /model/projects/{id}/metrics/trend   -> multi-sprint velocity trend

  WRITE CYCLE (3-step preferred) - Session 38 CORRECTED  
  --------------------------------
  Authentication: X-Actor header (NO FOUNDRY_TOKEN needed)
  Write method: PUT with ID in URL (NO POST support)
  
  1. PUT /model/{layer}/{id}      -Headers @{'X-Actor'='agent:copilot'}
  2. GET /model/{layer}/{id}      assert row_version == prev + 1
  3. POST /model/admin/commit     -Headers @{'Authorization'='Bearer dev-admin'}
     -> response.status == 'PASS'  AND  response.violation_count == 0

  Manual fallback only if admin/commit unavailable:
    POST /model/admin/export -> scripts/assemble-model.ps1 -> validate-model.ps1

--------------------------------------------------------------------------------
 LAYER GROUPS
--------------------------------------------------------------------------------

  L0-L10   Application Model     (original 11 layers, Sprint 1-5)
  L11      Observability Plane   (L31 EVIDENCE + L32 Traces -- PROOF & telemetry)
           *** L31 Evidence = COMPETITIVE MOAT = only AI with audit trails ***
  L12-L18  Control Plane         (automation operating model, Phase 4)
  L13      Governance Plane      (L33-L34 -- workspace_config + project_work)
           *** DATA-MODEL-FIRST: Bootstrap queries API, not files ***
           *** PAPERLESS: Only README + ACCEPTANCE on disk ***
  L19-L21  Frontend Structural   (components / hooks / ts_types, Phase 5)
  L22-L25  Catalog Additions     (MCP servers / prompts / security / runbooks)
  L26-L30  Project & DPDCA Plane (projects + WBS + sprints + milestones + risks + decisions)
  L31-L38  CI/CD & Testing       (deployment/testing/validation policies, Priority #3)
  L40-L49  Infrastructure Monitoring  (agent perf, azure infra, compliance, drift, costs -- Priority #4 Session 39)

  NOTE: Layer numbering shifted after L11 Observability insertion (Mar 1, 2026).
        Old L11-L26 layers remain in same logical order but renumbered L12-L27.
        Governance Plane (L33-L34) added Mar 5, 2026 for data-model-first architecture.

--------------------------------------------------------------------------------
 APPLICATION MODEL (L0-L10)
--------------------------------------------------------------------------------

  L0  services          33 items
  -----------------------------------------------------------------------
  Purpose: catalog every deployed or planned service in EVA.
  Notable additions (Feb 24):
    UI/UX surfaces:   model-explorer-ui, graph-explorer, admin-panel,
                      drift-dashboard, impact-view
    Agentic services: model-sync, drift, doc-generator, diagram,
                      status, trust-linker
  Key fields: id, name, type, host, port, status, aca_fqdn,
              dependencies[], owner, maturity

  L1  personas          10 items
  -----------------------------------------------------------------------
  Purpose: define every actor persona that the portal serves.
  Personas drive nav configuration from PersonaLoginPage.
  Items: citizen, jr_admin, jr_user, developer, admin, eva_admin,
         sr_developer, support_agent, auditor, red_teamer
  Key fields: id, label_en, label_fr, nav_profile, home_route,
              allowed_faces[], rbac_roles[]

  L2  feature_flags     15 items
  -----------------------------------------------------------------------
  Purpose: runtime flag registry. APIM + portal read these.
  Statuses: active (4), planned (4), stub (2), deprecated (others)
  Notable flags: action.assistant, action.programme, action.ado_sync,
                 action.ado_write, jp.chat.enabled, da.rag.hybrid,
                 da.translate.enabled, redteam.continuous
  Key fields: id, status, default_value, description, owner

  L3  containers        13 items
  -----------------------------------------------------------------------
  Purpose: Cosmos DB container catalog (data layer registry).
  Items include: model_objects, chat_sessions, feedback, audit_events,
                 translations, content_logs, evidence_packs, rbac_policies,
                 trust_scores, governance_catalog, run_records,
                 ingestion_runs, search_health
  Key fields: id, cosmos_db, container_name, partition_key, status,
              retention_days, classification

  L4  endpoints         184 items
  -----------------------------------------------------------------------
  Purpose: canonical backend API catalog. Every frontend API call must
           reference an endpoint registered here.
  Status breakdown:
    implemented: 52   (code exists, tested)
    stub:        37   (route exists, returns 501)
    planned:     95   (registered, not yet coded)
  New groups added Feb 24:
    auth/persona  (5)   /v1/auth/*
    eva-da        (17)  /v1/eva-da/*
    a11y admin    (5)   /v1/admin/a11y/*
    rbac          (3)   /v1/rbac/responsibilities, act-as
    system logs   (2)   /v1/logs/system, export
    i18n          (3)   /v1/config/translations/*
    red teaming   (4)   /v1/redteam/*
    assistme      (3)   /v1/assistme/*
    model proxy   (4)   /model/services/, graph/, impact/
    scrum         (2)   /v1/scrum/sprints, pbis
    rbac roles    (1)   /v1/rbac/roles
  Required fields on every endpoint:
    cosmos_reads: []   cosmos_writes: []
    feature_flag: null  auth: []

  L5  schemas           36 items
  -----------------------------------------------------------------------
  Purpose: request/response/domain object type definitions.
  breakdown: request:12, response:19, model:5
  Examples: ChatRequest, ChatResponse, RAGModeEnum, ActorEnvelope,
            MTIScore, DecisionResult, EvidenceArtifact, PersonaProfile

  L6  screens           46 items
  -----------------------------------------------------------------------
  See 04-PORTAL-SCREENS.md for full catalog.
  Key fields: id, route, face, title_en, title_fr, component,
              api_calls[], a11y, i18n_system, status, persona_access[]

  L7  literals          375 items
  -----------------------------------------------------------------------
  Purpose: i18n string catalog by namespace + screen.
  Namespaces: common.*, nav.*, portal.*, admin.*, chat.*, da.*, auth.*
  All new screens registered Feb 24 need literals added.
  Key fields: id, namespace, key, value_en, value_fr, screen_id

  L8  agents            4 items
  -----------------------------------------------------------------------
  Purpose: catalog AI agents built on the platform.
  Items: screen-generator (eva-faces), test-generator (eva-faces),
         validator (eva-faces), control-plane-agent
  Key fields: id, type, skills[], model, host_project, status

  L9  infrastructure    23 items
  -----------------------------------------------------------------------
  Purpose: Azure resource catalog (IaC reference).
  Statuses: provisioned:12, planned:11
  Items include: ACA (data-model, brain-v2, control-plane),
                 Cosmos DB, AI Search, Blob, APIM, Key Vault,
                 Entra App Registration, Application Insights,
                 Container Registry, Log Analytics Workspace
  Corrections applied 2026-02-22: cosmos DB name, 2 SWA types

  L10 requirements      22 items
  -----------------------------------------------------------------------
  Purpose: traceability from business requirement to implementation.
  breakdown: epics:5, requirements:10, stories:4, acceptance:3
  Linked to: endpoints (api_calls), screens (route), containers

--------------------------------------------------------------------------------
 CONTROL PLANE LAYERS (L12-L18)
--------------------------------------------------------------------------------

  L12 planes            3 items
  -----------------------------------------------------------------------
  EVA automation operating model planes.
  Items: plane-ado, plane-github, plane-azure
  Each plane has a DPDCA runner registered in 38-ado-poc.

  L13 connections       3 items
  -----------------------------------------------------------------------
  External system connection records (design-time config).
  Items: ADO org URL, Azure subscription ID, Azure RG + location
  Backfilled 2026-02-22; used by plane agents for authentication.

  L14 environments      3 items
  -----------------------------------------------------------------------
  Items: dev, staging, prod
  Each has: feature_flag defaults, APIM policies, Cosmos connection,
            allowed personas, MTI threshold overrides

  L15 cp_agents         4 items
  -----------------------------------------------------------------------
  Control plane automation agents (not user-facing).
  Items: ADO scrum agent, code review agent, PR merge agent, deploy agent
  Each agent has an assurance profile (from 19-ai-gov).

  L16 cp_policies       3 items
  -----------------------------------------------------------------------
  Items: approval policy, cost policy, compliance policy
  These feed the Decision Engine as policy references.

  L17 cp_skills         7 items
  -----------------------------------------------------------------------
  Orchestration skill catalog (29-foundry inputs).
  Examples: rag-retrieval, answer-generation, evidence-emit,
            redteam-run, sprint-sync, cost-attribution, log-audit

  L18 cp_workflows      2 items
  -----------------------------------------------------------------------
  Items: sprint-execute (38-ado-poc driven),
         deploy-to-sandbox (17-apim + ACA)

--------------------------------------------------------------------------------
 FRONTEND STRUCTURAL LAYERS (L19-L21)
--------------------------------------------------------------------------------

  L19 components        32 items
  -----------------------------------------------------------------------
  React component catalog (31-eva-faces scan, 2026-02-22).
  Examples: ChatPane, CitationCard, PersonaSelector, RAGModeToggle,
            A11yThemeProvider, I18nByScreenEditor, AuditLogViewer,
            ActAsSelector, MTIDashboard, FinOpsTile

  L20 hooks             18 items
  -----------------------------------------------------------------------
  React hook catalog.
  Examples: usePersona, useRAGMode, useEvidencePack, useA11yTheme,
            useI18nByScreen, useActAs, useFeatureFlag, useFinOps

  L21 ts_types          (items pending population)
  -----------------------------------------------------------------------
  TypeScript type definitions shared across faces.
  Planned: Actor, PersonaProfile, RAGMode, EvidenceArtifact, MTIScore,
           DecisionResult, ChatMessage, Citation

--------------------------------------------------------------------------------
 OBSERVABILITY PLANE (L31-L32) -- L11
--------------------------------------------------------------------------------

  L31 evidence          62 items (POLYMORPHIC schema, Session 27 LIVE)
  -----------------------------------------------------------------------
  Purpose: Capture proof-of-completion for every DPDCA phase across all projects.
           Universal schema works for 51-ACA, 31-eva-faces, 33-eva-brain-v2, etc.

  Status: LIVE as of 2026-03-01 7:39 PM ET | ENHANCED 2026-03-05 (Session 27)
  Schema: schema/evidence.schema.json (JSON Schema Draft-07, POLYMORPHIC)
  Model:  model/evidence.json (62 evidence receipts, growing)
  API:    GET /model/evidence/, PUT /model/evidence/{id}, filters by sprint/story/phase

  POLYMORPHIC ARCHITECTURE (Session 27):
    tech_stack field enables tech-specific context validation:
      python      -> pytest{}, coverage{}, ruff{}, mypy{}
      react       -> jest{}, bundle{}, lighthouse{}, eslint{}
      terraform   -> validate{}, plan{}, tfsec{}
      docker      -> build{}, scan{}, layers{}
      csharp      -> xunit{}, coverage{}, roslyn{}
      generic     -> fallback for other stacks

    oneOf validation ensures context matches tech_stack.
    See: docs/architecture/EVIDENCE-POLYMORPHISM-ADO-INTEGRATION.md

  DPDCA PHASES (record after each):
    D1 -- Discover (problem statement, blockers documented)
    D2 -- Discover-Audit (requirements clarified, readiness gates passed)
    P  -- Plan (sprint manifest committed, team aligned)
    D3 -- Do (code complete, tests pass, PR merged, evidence collected)
    A  -- Act (results reflected in model + plan docs, loop closed)

  REQUIRED FIELDS:
    id, sprint_id, story_id, phase, created_at, tech_stack

  VALIDATION GATES (merge-blocking in CI/CD):
    test_result = "FAIL"  --> blocks merge (exit 1 in evidence_validate.ps1)
    lint_result = "FAIL"  --> blocks merge (exit 1 in evidence_validate.ps1)

  METRICS CAPTURED:
    duration_ms, files_changed, lines_added, lines_deleted,
    tokens_used, cost_usd, test_count

  TECH-SPECIFIC CONTEXT (examples):
    Python:     pytest{total_tests, passed, failed, skipped},
                coverage{line_pct, branch_pct}, ruff{violations}, mypy{errors}
    React:      jest{total_tests, snapshots}, bundle{size_kb, gzip_size_kb},
                lighthouse{performance, accessibility}, eslint{errors, warnings}
    Terraform:  validate{success}, plan{resources_add, change, destroy},
                tfsec{issues_high, medium, low}

  ARTIFACTS TRACKED:
    [{path, type (source|test|schema|config|doc), action (created|modified|deleted)}]

  COMMITS LINKED:
    [{sha, message, timestamp}]

  TOOLS:
    Python library:     .github/scripts/evidence_generator.py (EvidenceBuilder class)
    CI/CD validator:    scripts/evidence_validate.ps1 (runs on every PR)
    Query tool:         scripts/evidence_query.py (portfolio audits)

  USAGE PATTERN:
    from evidence_generator import EvidenceBuilder
    evidence = (
        EvidenceBuilder(sprint_id="51-ACA-sprint-1", story_id="51-ACA-001", phase="D3")
        .add_validation(test_result="PASS", lint_result="PASS", coverage_percent=92)
        .add_metrics(duration_ms=3600000, files_changed=14, lines_added=582)
        .add_artifact(path="src/extractor.py", action="modified")
        .build()
    )
    # PUT /model/evidence/{id} with evidence object

  QUERY EXAMPLES:
    GET /model/evidence/?sprint_id=51-ACA-sprint-1  --> all sprint evidence
    GET /model/evidence/?phase=D3                    --> all completed work
    GET /model/evidence/?story_id=51-ACA-001        --> all phases for one story

  CORRELATION IDs:
    Tie together: sprint ops, stories, evidence, traces, transactions
    One correlation_id links full DPDCA cycle end-to-end

  FULL DOCUMENTATION:
    USER-GUIDE.md -- Evidence Layer section (comprehensive agent guide)
    ARCHITECTURE.md -- L11 Observability Plane design
    ANNOUNCEMENT.md -- Quick-start for agents

  L32 traces            0 items (schema ready, implementation pending)
  -----------------------------------------------------------------------
  Purpose: LM call telemetry (tokens, cost, latency, model, prompts)
  Status: Schema defined, API router registration pending
  Fields: correlation_id, model, tokens_in, tokens_out, cost_usd,
          latency_ms, prompt_hash, response_hash, timestamp
  Integration: Links to evidence via correlation_id for full sprint tracing

--------------------------------------------------------------------------------
 CATALOG ADDITIONS (L22-L25)
--------------------------------------------------------------------------------

  L22 mcp_servers       (items pending)
  -----------------------------------------------------------------------
  MCP server catalog (29-foundry).
  Known servers: Azure AI Search MCP, Cosmos DB MCP, Blob Storage MCP,
                 Skill Discovery MCP

  L23 prompts           (items pending)
  -----------------------------------------------------------------------
  Versioned system prompt catalog.
  Each prompt has: id, version, model_target, policy_constraints[],
                   language, last_red_teamed

  L24 security_controls (items pending)
  -----------------------------------------------------------------------
  ITSG-33 / ATLAS control mapping registry.
  Used for ATO artifact generation.

  L25 runbooks          (items pending)
  -----------------------------------------------------------------------
  Operational runbooks for common platform tasks.
  Examples: Cosmos re-seed, ACA redeploy, APIM policy update,
            evidence pack generation, red team run

--------------------------------------------------------------------------------
 PROJECT & DPDCA PLANE (L25-L30)
--------------------------------------------------------------------------------

  L25 projects          59 items (ENHANCED with governance{} + acceptance_criteria[])
  -----------------------------------------------------------------------
  NOTE: All EVA workspace projects with ADO epic IDs, maturity, and governance metadata.
  Status: ENHANCED Mar 5, 2026 with governance{} and acceptance_criteria[] fields
  
  Key fields (original): id, name, maturity, owner, description,
                        copilot_instructions, skills_count, wbs_count
  
  NEW FIELDS (data-model-first architecture):
    governance:
      readme_summary         -- Executive overview from README.md
      purpose               -- Why this project exists
      key_artifacts[]       -- Critical deliverables (path, description)
      current_sprint{}      -- Active sprint metadata
      latest_achievement{}  -- Most recent milestone (date, description)
    acceptance_criteria[]:
      gate                  -- Acceptance gate name
      criteria              -- Success criteria
      status                -- PASS | FAIL | WARN | CONDITIONAL
  
  Maturity values: active, poc, idea, empty, retired
  
  QUERY: GET /model/projects/{id} returns ALL governance metadata in one call
         (vs reading 4 files: README.md, PLAN.md, STATUS.md, ACCEPTANCE.md)

  L26 wbs               869 items (1 program | 4 streams | 56 projects | 808 deliverables)
  -----------------------------------------------------------------------
  Work breakdown structure. Dual-mode PM: Agile Scrum + classical Gantt/EVM.
  Schema: schema/wbs.schema.json (JSON Schema Draft-07, Session 27)
  Status: LIVE as of 2026-03-05 (Session 27 deployment)

  CORE IDENTITY
    id, label, label_fr, level (program|stream|project|deliverable|milestone)
    parent_wbs_id, project_id, stream, deliverable, methodology, owner, team

  STATUS & GATES
    status (planned|active|in_progress|done|on_hold|cancelled), milestone (bool)
    phase_gate, depends_on_wbs[], depends_on_infra[]

  GANTT / SCHEDULE
    planned_start, planned_end     -- schedule plan
    actual_start,  actual_end      -- set when work begins / finishes
    baseline_start, baseline_end   -- frozen at sprint-0, never changes
    schedule_variance_days         -- actual_end - planned_end (computed)

  SCRUM INTEGRATION
    sprint, sprint_start, sprint_end
    sprints_planned, sprints_done, sprint_count

  PROGRESS TRACKING
    percent_complete (0-100 float)
    stories_total, stories_done, points_total, points_done

  AGILE METRICS
    velocity (rolling 3-sprint avg)
    cycle_time_days (avg days start->done per story)
    defect_rate (defects per sprint)

  L27 sprints           (schema ready, data seeding in progress)
  -----------------------------------------------------------------------
  Sprint velocity records with planned/actual metrics, MTI at close
  Key fields: sprint_id, velocity_planned, velocity_actual, mti_at_close,
              ado_iteration_path, sprint_start, sprint_end

  L28 milestones        (schema ready, data seeding in progress)
  -----------------------------------------------------------------------
  RUP phase gates with deliverables, sign-off, WBS linkage
  Key fields: milestone_id, phase_gate, deliverables[], sign_off_by,
              wbs_ids[], status

  L29 risks             (schema ready, data seeding in progress)
  -----------------------------------------------------------------------
  3x3 risk matrix with probability × impact scoring
  Key fields: risk_id, probability, impact, risk_score, mitigation_owner,
              status, wbs_ids[]

  L30 decisions         (schema ready, data seeding in progress)
  -----------------------------------------------------------------------
  Architecture Decision Records (ADRs)
  Key fields: adr_id, context, decision, consequences, deciders[],
              superseded_by, status

--------------------------------------------------------------------------------
 CI/CD & TESTING PLANE (L35-L38) -- PRIORITY #3
--------------------------------------------------------------------------------

  L35 agent_policies    4 items
  -----------------------------------------------------------------------
  Purpose: Agent behavioral policies and constraints for safe AI operations
  Key fields: policy_id, policy_type, constraints{}, enforcement_level,
              applies_to_agents[], validation_rules[], exceptions[]

  L36 quality_gates     4 items
  -----------------------------------------------------------------------
  Purpose: Quality gate definitions for deployment readiness assessment
  Key fields: gate_id, gate_name, criteria[], thresholds{}, blocking,
              applies_to_phases[], validation_script

  L37 github_rules      4 items
  -----------------------------------------------------------------------
  Purpose: GitHub repository rules, branch protection, and PR requirements
  Key fields: rule_id, repo_pattern, branch_protection{}, pr_requirements{},
              status_checks[], review_policies[]

  L38 deployment_policies    4 items
  -----------------------------------------------------------------------
  Purpose: Deployment approval workflows and rollback policies
  Key fields: policy_id, environment, approval_workflow{}, rollback_policy{},
              health_checks[], post_deploy_actions[]

  NOTE: L39 testing_policies and L39 validation_rules planned for future Priority #3 expansion

--------------------------------------------------------------------------------
 GOVERNANCE PLANE (L33-L34) -- DATA-MODEL-FIRST ARCHITECTURE
--------------------------------------------------------------------------------

  L33 workspace_config  1 item (schema ready, pilot in progress)
  -----------------------------------------------------------------------
  Purpose: Workspace-level best practices, bootstrap rules, data model config
  Status: ADDED Mar 5, 2026 -- enables data-model-first bootstrap (query vs read files)
  
  Key fields:
    id                     -- workspace root path (eva-foundry)
    workspace_root        -- Absolute path
    best_practices{}:
      encoding_safety     -- Windows Enterprise encoding rules (ASCII only)
      component_patterns  -- DebugArtifactCollector, SessionManager patterns
      evidence_collection -- Capture state at every operation boundary
      timestamped_naming  -- {component}_{context}_{YYYYMMDD_HHMMSS}.{ext}
    bootstrap_rules{}:
      mandatory_files     -- .github/copilot-instructions.md, README, PLAN, STATUS
      governance_query    -- GET /model/projects/{id} for bootstrap context
      fallback_strategy   -- Read local files if API timeout
    data_model_config{}:
      cloud_endpoint      -- Production API URL
      layer_count         -- Current layer count (41)
      backup_strategy     -- sync-cloud-to-local.ps1 frequency
  
  QUERY: GET /model/workspace_config/eva-foundry
  BENEFIT: Single API call returns workspace-level best practices for all agents

  L34 project_work      (schema ready, pilot in progress)
  -----------------------------------------------------------------------
  Purpose: Active work sessions -- REPLACES STATUS.md with queryable DPDCA records
  Status: ADDED Mar 5, 2026 -- structured, versioned work tracking
  
  Key fields:
    id                    -- {project_id}-{YYYY-MM-DD} (one record per session)
    project_id            -- Foreign key to L25 projects
    current_phase         -- D1 | D2 | P | D3 | A (DPDCA phase)
    session_summary{}:
      session_number      -- Incremental session counter
      date                -- Session date
      focus               -- What was worked on
      outcome             -- Key result
    tasks[]:
      task_id
      description
      status              -- not-started | in-progress | completed | blocked
      owner
    blockers[]:
      blocker_id
      description
      severity            -- critical | high | medium | low
      resolution
    metrics{}:
      files_modified      -- Count of files changed
      lines_added
      lines_deleted
      duration_minutes
      mti_score           -- MTI at session close
    next_steps[]          -- Prioritized actions for next session
  
  QUERY: GET /model/project_work/?project_id=07-foundation-layer
  BENEFIT: Queryable work history, structured session data, API-driven status
  
  ARCHITECTURE SHIFT:
    Before: Bootstrap reads README.md (purpose), PLAN.md (features), 
            STATUS.md (sessions), ACCEPTANCE.md (gates) -- 4 file reads per project
    After:  GET /model/projects/{id} returns governance{} + acceptance_criteria[]
            GET /model/project_work/?project_id={id} returns active sessions
    Result: 236 file reads (59 projects × 4 files) → 2 API calls

  FILES AS EXPORTS:
    README.md, STATUS.md, ACCEPTANCE.md become snapshots GENERATED from data model
    Use export-governance-to-files.py to generate markdown from API data
    Data model is single source of truth; files are presentation layer

--------------------------------------------------------------------------------
 INFRASTRUCTURE MONITORING PLANE (L40-L49) -- PRIORITY #4 SESSION 39
--------------------------------------------------------------------------------

  L40 agent_execution_history    0 items (schema ready, awaiting operational data)
  -----------------------------------------------------------------------
  Purpose: Complete audit trail of every agent execution for forensics and compliance
  Status: DEPLOYED Mar 8, 2026 (Session 39) -- ready for agent operational tracking
  
  Key fields:
    execution_id          -- Unique identifier for each agent run
    agent_id              -- Which agent performed the action
    action_type           -- Type of operation (code_gen, review, deploy, etc.)
    timestamp             -- When the execution occurred
    outcome               -- success | failure | partial
    duration_ms           -- Execution time in milliseconds
    cost_impact_usd       -- Financial cost of this execution
    evidence_trail[]      -- Array of evidence IDs for audit linkage
  
  Use cases: Agent forensics, action tracking, timing analysis, cost attribution
  Query: GET /model/agent_execution_history/?agent_id={id}&date.gte={start}

  L41 agent_performance_metrics    0 items (schema ready, awaiting metrics data)
  -----------------------------------------------------------------------
  Purpose: Real-time agent performance indicators for SLA monitoring and optimization
  Status: DEPLOYED Mar 8, 2026 (Session 39) -- calculates from execution history
  
  Key fields:
    agent_id                    -- Agent identifier
    reliability_score           -- Success rate (0-100%)
    speed_percentile            -- Performance vs peers (0-100)
    cost_efficiency_percentile  -- Cost efficiency ranking (0-100)
    safety_incidents            -- Count of safety violations
    rollback_rate              -- Percentage of changes rolled back
  
  Use cases: Performance monitoring, SLA tracking, optimization opportunity identification
  Query: GET /model/agent_performance_metrics/?agent_id={id}

  L42 azure_infrastructure    0 items (schema ready, awaiting Azure inventory sync)
  -----------------------------------------------------------------------
  Purpose: Azure resource inventory and state tracking for infrastructure auditing
  Status: DEPLOYED Mar 8, 2026 (Session 39) -- awaits Azure Resource Graph sync
  
  Key fields:
    subscription_id       -- Azure subscription ID
    resource_name         -- Resource name
    resource_type         -- Type (VM, Storage, Container App, etc.)
    status                -- running | stopped | deallocated
    configuration{}       -- Resource-specific config snapshot
    security_config{}     -- Security settings (RBAC, networking, encryption)
    cost_tracking{}       -- Cost allocation and budget tracking
  
  Use cases: Infrastructure auditing, cost allocation, capacity planning, security review
  Query: GET /model/azure_infrastructure/?subscription_id={id}&resource_type={type}

  L43 compliance_audit    0 items (schema ready, awaiting first audit run)
  -----------------------------------------------------------------------
  Purpose: Compliance assessment and remediation tracking for regulatory frameworks
  Status: DEPLOYED Mar 8, 2026 (Session 39) -- supports SOC2, PCI-DSS, HIPAA, GDPR
  
  Key fields:
    audit_timestamp        -- When audit was performed
    framework              -- SOC2 | PCI-DSS | HIPAA | GDPR | ISO27001
    overall_status         -- PASS | FAIL | CONDITIONAL
    compliance_score       -- Percentage compliance (0-100%)
    findings[]             -- Array of non-compliance findings
    remediations_tracking  -- Remediation status and ownership
  
  Use cases: Security compliance, audit preparation, governance validation
  Query: GET /model/compliance_audit/?framework={name}&status=FAIL

  L44 deployment_quality_scores    0 items (schema ready, calculated post-deployment)
  -----------------------------------------------------------------------
  Purpose: Multi-dimensional quality metrics with letter grades (A-F) for deployments
  Status: DEPLOYED Mar 8, 2026 (Session 39) -- automated quality gate assessment
  
  Key fields:
    deployment_id              -- Link to L45 deployment_records
    quality_dimensions{}:
      compliance_score         -- Regulatory compliance score
      performance_score        -- Performance benchmarks
      safety_score            -- Safety and reliability
      cost_score              -- Cost efficiency
      speed_score             -- Deployment velocity
      reliability_score       -- Stability and uptime
    overall_quality_score     -- Weighted average (0-100)
    grade                     -- A | B | C | D | F
  
  Use cases: Deployment readiness assessment, quality gate validation, trend analysis
  Query: GET /model/deployment_quality_scores/?grade.in=A,B&deployment_id={id}

  L45 deployment_records    0 items (schema ready, captures all deployments)
  -----------------------------------------------------------------------
  Purpose: Complete deployment history and audit trails for change tracking
  Status: DEPLOYED Mar 8, 2026 (Session 39) -- captures every deployment
  
  Key fields:
    deployment_number      -- Sequential deployment counter
    timestamp              -- Deployment timestamp
    status                 -- success | failed | rolled_back
    resources_deployed[]   -- Array of resources deployed
    changelog[]            -- Changes included in deployment
    validation_results[]   -- Pre-deployment validation outcomes
    rollback_info{}        -- Rollback procedure and status
  
  Use cases: Deployment analysis, rollback planning, change tracking, audit compliance
  Query: GET /model/deployment_records/?status=success&timestamp.gte={date}

  L46 eva_model    0 items (schema ready, self-describing meta-model)
  -----------------------------------------------------------------------
  Purpose: Self-describing data model metadata for schema introspection
  Status: DEPLOYED Mar 8, 2026 (Session 39) -- enables dynamic schema discovery
  
  Key fields:
    model_version           -- Data model version (semantic versioning)
    layer_catalog[]         -- All 51 layers with descriptions
    layer_groups[]          -- Logical groupings (Application, Control, etc.)
    relationships[]         -- Cross-layer relationships and dependencies
    schema_definitions[]    -- JSON Schema references for each layer
  
  Use cases: Data model discovery, schema evolution tracking, documentation generation
  Query: GET /model/eva_model/ (returns single meta-model record)

  L47 infrastructure_drift    0 items (schema ready, awaits drift detection runs)
  -----------------------------------------------------------------------
  Purpose: Desired vs actual infrastructure state comparison for drift detection
  Status: DEPLOYED Mar 8, 2026 (Session 39) -- automated drift detection
  
  Key fields:
    drift_detected          -- Boolean: drift detected?
    resources_drifted       -- Count of resources with drift
    severity                -- low | medium | high | critical
    drift_items[]           -- Detailed drift findings per resource
    remediation{}           -- Automated remediation options and status
  
  Use cases: Drift detection, configuration management, automated remediation
  Query: GET /model/infrastructure_drift/?severity=high&drift_detected=true

  L48 performance_trends    0 items (schema ready, calculated from historical data)
  -----------------------------------------------------------------------
  Purpose: Historical trends and capacity planning predictions
  Status: DEPLOYED Mar 8, 2026 (Session 39) -- trend analysis and forecasting
  
  Key fields:
    metric_period           -- Time period for trend calculation
    metrics_snapshot{}      -- Current metrics snapshot
    trend_indicators{}      -- Trend direction and velocity
    prediction{}            -- Forecasted future state
  
  Use cases: Trend analysis, prediction, capacity forecasting, proactive scaling
  Query: GET /model/performance_trends/?metric_period=30d

  L49 resource_costs    0 items (schema ready, awaits Azure Cost Management sync)
  -----------------------------------------------------------------------
  Purpose: Cloud cost tracking and budget management for financial optimization
  Status: DEPLOYED Mar 8, 2026 (Session 39) -- Azure cost data integration
  
  Key fields:
    subscription_id             -- Azure subscription ID
    total_cost                  -- Total cost for period
    budget                      -- Allocated budget
    cost_by_service[]           -- Cost breakdown by service type
    forecasted_cost{}           -- Predicted future costs
    optimization_opportunities[] -- Cost optimization recommendations
  
  Use cases: Cost optimization, budget alerts, forecasting, cost allocation
  Query: GET /model/resource_costs/?subscription_id={id}&total_cost.gt={budget}

  SESSION 39 SUMMARY (March 8, 2026 9:13 AM ET):
    - All 10 infrastructure monitoring layers deployed to Azure Container Apps
    - Validation: 10/10 endpoints responding with HTTP 200 (100% pass rate)
    - Cloud status: msub-eva-data-model provisioning succeeded
    - Ready for operational data ingestion
    - Enables comprehensive infrastructure governance and cost optimization

--------------------------------------------------------------------------------
 DPDCA EVOLUTION PLANE (L27-L30) -- FORMERLY PART OF PROJECT PLANE
--------------------------------------------------------------------------------

  EARNED VALUE MANAGEMENT (EVM)
    budget_at_completion (BAC -- authorised budget in story points)
    planned_value (PV), earned_value (EV), actual_cost (AC)
    spi (EV/PV -- <1=behind), cpi (EV/AC -- <1=over budget)
    estimate_at_completion (EAC = BAC/CPI), variance_at_completion (VAC = BAC-EAC)

  RISK
    risk_level (low|medium|high|critical), risk_notes

  ADO INTEGRATION
    ado_epic_id, ado_feature_id, work_items[]
    NOTE: ado_wi_id readback script missing -- see 38-ado-poc backlog

  EVIDENCE
    done_criteria, ci_runbook, evidence_id_pattern

  CURRENT STATE (13 nodes all carrying PM fields as of 2026-02-23)
  ----------------------------------------------------------------
    WBS-000        program     active       35% -- EVA Foundation Programme
    WBS-S-UP/AI/PL/DEV  streams  active    milestone=true
    WBS-017        project     in_progress  60% -- 17-APIM
    WBS-029        project     active       50% -- 29-Foundry
    WBS-033        project     in_progress  45% -- 33-EVA-Brain-v2
    WBS-031/037/038/039/044  deliverables  10-30%
    NOTE: WBS-044 risk_level=high (ADO readback gap -- 38-ado-poc)

--------------------------------------------------------------------------------
 DOCUMENTATION GENERATION (doc-generator service, L0)
--------------------------------------------------------------------------------

  Service: doc-generator (registered in L0 services layer, status=planned)

  Trigger:  POST /model/admin/commit (fire on every PASS cycle)
  Output:   Markdown docs + Mermaid diagrams, one file per layer
  Storage:  Azure Blob Storage -- container: eva-docs
            Path pattern: eva-docs/{layer}/{YYYYMMDD}-{layer}.md

  Layer -> doc output mapping:
    endpoints     -> endpoint-catalog.md   (route, auth, status, schemas)
    screens       -> screen-catalog.md     (face, route, persona, API calls)
    services      -> service-map.md        (deployed services, health, tech stack)
    containers    -> container-schema.md   (Cosmos containers, fields, partition)
    agents        -> agent-registry.md     (registered agents, skills, trust)
    requirements  -> requirements-trace.md (req -> endpoint -> screen trace)
    projects      -> project-manifest.md   (all 48 projects, maturity, skills)
    infrastructure-> infra-inventory.md    (Azure resources, ACA, Blob, APIM)
    personas      -> persona-matrix.md     (persona -> portal -> screen access)

  Architecture snapshots (on every commit):
    - 02-ARCHITECTURE.md regenerated from live layer data
    - 04-PORTAL-SCREENS.md regenerated from /model/screens/ + face field
    - Full cross-reference graph (Mermaid) saved to eva-docs/diagrams/

  ATO / compliance artifacts (pipes into 48-eva-veritas):
    - Evidence pack per commit: violation_count, layer counts, timestamp
    - Saved to: eva-docs/compliance/{YYYYMMDD}-evidence-pack.json

  Implementation location: to be built in 37-data-model api/docs_generator.py
  API endpoint (planned): POST /model/docs/generate
  Async trigger (planned): background task in POST /model/admin/commit

--------------------------------------------------------------------------------
 QUERY REFERENCE (don't grep when model has the answer)
--------------------------------------------------------------------------------

  What you want to know          HTTP call (1 turn)
  -----------------------------------------------
  All endpoints for a service    GET /model/endpoints/?service=eva-brain-api
  What a screen calls            GET /model/screens/{id} --> .api_calls
  Auth on an endpoint            GET /model/endpoints/{id} --> .auth, .feature_flag
  What breaks if X changes       GET /model/impact/?container=X
  All screens for a persona      GET /model/screens/?persona=citizen
  All planned endpoints          GET /model/endpoints/?status=planned
  Service health summary         GET /model/services/
  Project record                 GET /model/projects/{folder_name}
  Trust score for actor          POST /trust/evaluateTrust (47-eva-mti)
  Governance decision            POST /governance/getDecision (19-ai-gov)

--------------------------------------------------------------------------------
 VALIDATION RULES (what the validator checks)
--------------------------------------------------------------------------------

  Endpoints must have:
    cosmos_reads:  [] (not null, not missing)
    cosmos_writes: [] (not null, not missing)
    feature_flag:  null or string (cannot be missing key)
    auth:          [] (not null, not missing)

  Screens must have:
    route: string
    api_calls: [] where EVERY item resolves to a known endpoint ID

  Cross-reference violations are [FAIL] -- block the model.
  Coverage warnings (60 pre-existing) are [WARN] -- non-blocking.

================================================================================
