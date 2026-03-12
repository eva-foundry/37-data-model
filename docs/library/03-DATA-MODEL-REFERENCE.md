================================================================================
 EVA DATA MODEL -- 111-LAYER REFERENCE (87 Operational + 24 Pending + 12 Planned)
 File: docs/library/03-DATA-MODEL-REFERENCE.md
 Version: v1.1 | Updated: 2026-03-12 19:46 ET | Status: operative (87 layers live; 24 pending ACA; 12 planned security)
 Session: 46A (Execution Layers), 46B+ (Security Schemas) | Domain: Foundation/Governance
 Source: https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io
 Design: docs/library/98-model-ontology-for-agents.md (12-domain cognitive architecture)
         docs/COMPLETE-LAYER-CATALOG.md (definitive catalog)
         docs/library/13-EXECUTION-LAYERS.md (Phases 1-6: 24 layers in Session 46A, pending ACA deployment)
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
    GET /model/agent-summary   -> all 87 layer counts in one call
    GET /model/layers          -> introspect all 87 layers with schema availability
    GET /model/{layer}/fields  -> get field names, types, descriptions for any layer
    GET /model/{layer}/example -> see real object structure from any layer

  DISCOVERY & INTROSPECTION (Session 26):
    All layers support self-documenting endpoints for agent orientation:
      GET /model/layers               -> 87 layers with descriptions, example counts
      GET /model/{layer}/fields       -> schema field definitions
      GET /model/{layer}/example      -> first real object for reference
      GET /model/{layer}/count        -> total object count
      GET /model/schema-def/{layer}   -> JSON Schema Draft-07 definition (WIP)

  UNIVERSAL QUERY OPERATORS (Session 26):
    All 87 layers support standardized query parameters:
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

  THE 12 ONTOLOGY DOMAINS (see docs/library/98-model-ontology-for-agents.md)
  -----------------------------------------------------------------------
  Agents reason over 12 conceptual domains, not 91 individual layers.
  91 operational layers + 20 planned (L55, L57-L75) = 111 total.
  36 organic layers (no L-number) added by sessions beyond original L1-L51.
  4 Phase 1 execution layers (L52-L56) deployed Session 41 Part 10.
  Agents query by layer NAME. L-numbers are historical identifiers only.

   Domain                       Layers  Key Layers
   --------------------------   ------  -----------------------------------------
   1. System Architecture       10      services, endpoints, schemas, infrastructure
   2. Identity & Access          3      personas, security_controls, secrets_catalog
   3. AI Runtime                 6      agents, prompts, mcp_servers, agent_policies
   4. User Interface             5      screens, literals, components, hooks, ts_types
   5. Control Plane             12      planes, connections, environments, cp_*, feature_flags
   6. Governance & Policy       10      quality_gates, github_rules, validation_rules, risks
   7. Project & PM              9      projects, wbs, sprints, stories, tasks, milestones
   8. DevOps & Delivery         10      deployment_policies, repos, ci_cd_pipelines, test_cases
   9. Observability & Evidence  13      evidence, agent_execution_history, verification_records
  10. Infrastructure & FinOps    9      azure_infrastructure, resource_costs, cost_tracking
  11. Execution Engine          4 (+15) work_execution_units, work_step_events (L52-L56 operational)
  12. Strategy & Portfolio (planned) 5  work_factory_portfolio, roadmaps (L71-L75)

  See docs/COMPLETE-LAYER-CATALOG.md for the definitive per-layer catalog.

  LEGACY NOTE: Layer numbering shifted multiple times historically.
  The canonical 75-layer design is in docs/library/99-layers-design-20260309-0935.md.
  Organic layers beyond L51 get names only (no L-number).

--------------------------------------------------------------------------------
 APPLICATION MODEL (L0-L10)
--------------------------------------------------------------------------------

  L0  services          36 items
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

  L4  endpoints         187 items
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

  L5  schemas           39 items
  -----------------------------------------------------------------------
  Purpose: request/response/domain object type definitions.
  breakdown: request:12, response:19, model:5
  Examples: ChatRequest, ChatResponse, RAGModeEnum, ActorEnvelope,
            MTIScore, DecisionResult, EvidenceArtifact, PersonaProfile

  L6  screens           50 items
  -----------------------------------------------------------------------
  See 04-PORTAL-SCREENS.md for full catalog.
  Key fields: id, route, face, title_en, title_fr, component,
              api_calls[], a11y, i18n_system, status, persona_access[]

  L7  literals          458 items
  -----------------------------------------------------------------------
  Purpose: i18n string catalog by namespace + screen.
  Namespaces: common.*, nav.*, portal.*, admin.*, chat.*, da.*, auth.*
  All new screens registered Feb 24 need literals added.
  Key fields: id, namespace, key, value_en, value_fr, screen_id

  L8  agents            13 items
  -----------------------------------------------------------------------
  Purpose: catalog AI agents built on the platform.
  Items include: screen-generator, test-generator, validator,
         control-plane-agent, + 9 additional operational agents
  Key fields: id, type, skills[], model, host_project, status

  L9  infrastructure    46 items
  -----------------------------------------------------------------------
  Purpose: Azure resource catalog (IaC reference).
  Statuses: provisioned:12, planned:11
  Items include: ACA (data-model, brain-v2, control-plane),
                 Cosmos DB, AI Search, Blob, APIM, Key Vault,
                 Entra App Registration, Application Insights,
                 Container Registry, Log Analytics Workspace
  Corrections applied 2026-02-22: cosmos DB name, 2 SWA types

  L10 requirements      29 items
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

  L25 projects          56 items (ENHANCED with governance{} + acceptance_criteria[])
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
    layer_catalog[]         -- All 87 layers with descriptions
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
    projects      -> project-manifest.md   (all 57 projects, maturity, skills)
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
 EXECUTION ENGINE PLANE (L52-L56) -- PHASE 1 SESSION 41 PART 10
--------------------------------------------------------------------------------

  L52 work_execution_units    0 items (schema deployed, parent layer for cascade)
  -----------------------------------------------------------------------
  Purpose: Operational work ledger tracking each governed unit of work
  Status: DEPLOYED Mar 9, 2026 (Session 41 Part 10) -- parent layer with CASCADE children
  Schema: schema/work_execution_units.schema.json
  
  Key fields:
    work_unit_id           -- Primary key: {project-id}-wu-{YYYYMMDD}-{seq}
    project_id             -- FK to L25 projects
    wbs_id                 -- FK to L26 wbs
    sprint_id              -- FK to L27 sprints
    title                  -- Brief description of work
    status                 -- queued | in-progress | paused | succeeded | failed | cancelled
    assigned_to_type       -- agent | cp_agent | human
    assigned_to_id         -- Polymorphic FK (agent_id, cp_agent_id, or persona_id)
    milestone_id           -- FK to L28 milestones
    workflow_id            -- FK to L18 cp_workflows (governing workflow)
    project_work_id        -- FK to L34 project_work (session container)
    parent_work_unit_id    -- Self-referencing FK for sub-tasks
    depends_on[]           -- Array of work_unit_ids (dependencies)
    policy_refs[]          -- FK array to L16 cp_policies
    evidence_ids[]         -- FK array to L31 evidence
  
  Parent-child cascade: L53, L54, L56 CASCADE on delete
  Use cases: Govern agent work, DPDCA tracking, audit trail
  Query: GET /model/work_execution_units/?project_id={id}&status=in-progress

  L53 work_step_events    0 items (schema deployed, child of L52 with CASCADE)
  -----------------------------------------------------------------------
  Purpose: Execution event stream capturing step-by-step timeline of work units
  Status: DEPLOYED Mar 9, 2026 (Session 41 Part 10) -- event log with CASCADE delete
  Schema: schema/work_step_events.schema.json
  
  Key fields:
    event_id               -- Primary key: {work_unit_id}-evt-{seq}
    work_unit_id           -- FK to L52 work_execution_units (CASCADE)
    sequence_no            -- Event order within work unit
    event_type             -- state_change | gate_check | action_execution | error_occurred | retry_attempt
    timestamp              -- ISO8601 timestamp
    actor_type             -- agent | cp_agent | human | system
    actor_id               -- Identifier of actor
    state_before           -- Status before event (for state_change)
    state_after            -- Status after event (for state_change)
    action_taken           -- Description of action performed
    gate_name              -- Quality gate identifier (for gate_check)
    gate_result            -- PASS | FAIL | WARN | SKIP
    evidence_ids[]         -- FK array to L31 evidence
    trace_ids[]            -- FK array to L32 traces (LLM traces)
    decision_ids[]         -- FK array to L54 work_decision_records
    error_details          -- Error details (for error_occurred)
  
  Parent: L52 work_execution_units (CASCADE on parent delete)
  Use cases: Event timeline, audit trail, retry analysis, gate verification
  Query: GET /model/work_step_events/?work_unit_id={id}&event_type=gate_check

  L54 work_decision_records    0 items (schema deployed, child of L52 with CASCADE)
  -----------------------------------------------------------------------
  Purpose: Runtime decision ledger capturing decisions made during execution
  Status: DEPLOYED Mar 9, 2026 (Session 41 Part 10) -- distinct from L30 decisions (architectural ADRs)
  Schema: schema/work_decision_records.schema.json
  
  Key fields:
    decision_id            -- Primary key: {work_unit_id}-dec-{seq}
    work_unit_id           -- FK to L52 work_execution_units (CASCADE)
    decision_question      -- What decision was being made
    options_considered[]   -- Alternative options evaluated
    selected_option_id     -- The option that was chosen
    decision_scope         -- execution | governance | quality | deployment | exception
    basis                  -- policy | evidence | heuristic | human_judgment
    decided_by_type        -- agent | human
    decided_by_id          -- Identifier of decision maker
    decided_at             -- ISO8601 timestamp
    rationale              -- Explanation of choice
    policy_refs[]          -- FK array to L16 cp_policies
    evidence_refs[]        -- Supporting evidence IDs or documents
    obligation_ids[]       -- FK array to L55 work_obligations (Phase 2)
    reversible             -- Boolean: can decision be undone?
    risk_level             -- low | medium | high
  
  Parent: L52 work_execution_units (CASCADE on parent delete)
  Contrast with L30 decisions: L30 = architectural ADRs, L54 = runtime execution decisions
  Use cases: Decision audit, basis documentation, reversibility tracking
  Query: GET /model/work_decision_records/?work_unit_id={id}&basis=policy

  L56 work_outcomes    0 items (schema deployed, child of L52 with CASCADE)
  -----------------------------------------------------------------------
  Purpose: Result ledger recording what was delivered vs what was expected
  Status: DEPLOYED Mar 9, 2026 (Session 41 Part 10) -- realized outcomes vs expectations
  Schema: schema/work_outcomes.schema.json
  
  Key fields:
    outcome_id             -- Primary key: {work_unit_id}-out-{seq}
    work_unit_id           -- FK to L52 work_execution_units (CASCADE)
    result                 -- delivered | not_delivered | partially_delivered
    outcome_type           -- technical | governance | quality | operational | business
    recorded_at            -- ISO8601 timestamp
    expected_vs_actual     -- Narrative comparison
    delivered_changes{}    -- Structured summary (files, commits, deployments, metrics)
      - files_created[]    -- Array of created file paths
      - files_modified[]   -- Array of modified file paths
      - files_deleted[]    -- Array of deleted file paths
      - commits[]          -- Array of commit SHAs
      - deployments[]      -- Array of deployment IDs
      - metrics{}          -- Quantitative measures
    evidence_ids[]         -- FK array to L31 evidence
    decision_ids[]         -- FK array to L54 (decisions that influenced outcome)
    learning_ids[]         -- FK array to L57 work_learning_feedback (Phase 2)
    metrics{}              -- Time, cost, quality scores
  
  Parent: L52 work_execution_units (CASCADE on parent delete)
  Use cases: Delivery verification, lesson learned capture, variance analysis
  Query: GET /model/work_outcomes/?work_unit_id={id}&result=delivered

  L55 work_obligations    0 items (schema deployed, inverse FK from L54)
  -----------------------------------------------------------------------
  Purpose: Follow-up obligations from decisions and policy enforcement
  Status: DEPLOYED Mar 9, 2026 (Session 41 Part 11, Phase 2)
  Schema: schema/work_obligations.schema.json
  
  Key fields:
    id                     -- Primary key: {project-id}-obl-{YYYYMMDD}-{seq}
    decision_id            -- FK to L54 work_decision_records (REQUIRED inverse relationship)
    work_unit_id           -- FK to L52 work_execution_units (optional context)
    policy_id              -- FK to L16 cp_policies (if policy-mandated)
    obligation_text        -- Actionable description (10-2000 chars)
    status                 -- open | in_progress | blocked | completed | cancelled
    priority               -- critical | high | medium | low
    assigned_to_type       -- agent | cp_agent | human (polymorphic)
    assigned_to_id         -- Polymorphic FK
    due_date               -- Optional deadline
    blocked_reason         -- Why blocked (if status=blocked)
    completion_evidence_id -- FK to L31 evidence
  
  Graph edges: obligates (L54→L55), obligation_evidence (L55→L31)
  Use cases: Remediation tracking, policy compliance, decision follow-up
  Query: GET /model/work_obligations/?status=open&assigned_to_id={agent-id}

  L57 work_learning_feedback    0 items (schema deployed, adaptive learning)
  -----------------------------------------------------------------------
  Purpose: Lessons learned and improvement insights from work execution
  Status: DEPLOYED Mar 9, 2026 (Session 41 Part 11, Phase 2)
  Schema: schema/work_learning_feedback.schema.json
  
  Key fields:
    id                     -- Primary key: learning-{YYYYMMDD}-{seq}
    work_unit_ids[]        -- FK array to L52 work_execution_units (sources, REQUIRED)
    learning_type          -- success_factor | failure_cause | optimization | anti_pattern |
                              best_practice | edge_case | tuning_signal
    observation            -- Factual description (20-2000 chars)
    recommendation         -- Actionable advice (10-2000 chars)
    confidence_score       -- 0.0-1.0 (quality indicator, higher = more reliable)
    validation_status      -- draft | under_review | validated | rejected | archived
    author_type            -- agent | cp_agent | human (polymorphic)
    author_id              -- Polymorphic FK
    pattern_ids[]          -- FK array to L58 work_reusable_patterns (backfill)
    tags[]                 -- Searchable categorization
  
  Graph edges: learns_from (L57→L52), learning_references_pattern (L57→L58)
  Use cases: Retrospectives, tuning signals, pattern derivation, continuous improvement
  Query: GET /model/work_learning_feedback/?validation_status=validated&confidence_score>=0.8

  L58 work_reusable_patterns    0 items (schema deployed, pattern library)
  -----------------------------------------------------------------------
  Purpose: Approved execution templates derived from learning feedback
  Status: DEPLOYED Mar 9, 2026 (Session 41 Part 11, Phase 2)
  Schema: schema/work_reusable_patterns.schema.json
  
  Key fields:
    id                     -- Primary key: pattern-{kebab-case-name}
    pattern_name           -- Human-readable name (3-100 chars)
    pattern_type           -- workflow | quality_gate | deployment | testing | 
                              refactoring | analysis | remediation
    description            -- Detailed guidance (20-2000 chars)
    applicability_conditions[] -- Array of { condition_type, condition_text }
                                  condition_type: project_type | tech_stack | complexity |
                                  risk_level | team_size | custom
    steps[]                -- Array of { step_number, step_name, step_description, required,
                              validation_criteria[] } -- executable steps
    expected_outcomes[]    -- What should be achieved
    derived_from_learning_ids[] -- FK array to L57 work_learning_feedback (sources)
    example_work_units[]   -- FK array to L52 work_execution_units (examples)
    approval_status        -- draft | under_review | approved | deprecated
    approval_date          -- When approved
    approver               -- Who approved
    version                -- Semantic version (major.minor.patch)
    deprecation_reason     -- Why deprecated (if status=deprecated)
  
  Graph edges: derives_pattern (L58→L57), pattern_examples (L58→L52)
  Use cases: Factory capabilities (Phase 4), agent pattern selection, performance tracking (Phase 3)
  Query: GET /model/work_reusable_patterns/?approval_status=approved&pattern_type=deployment

  L59 work_pattern_applications    0 items (schema deployed, child of L52 with CASCADE)
  -----------------------------------------------------------------------
  Purpose: Pattern usage tracking for continuous improvement
  Status: DEPLOYED Mar 9, 2026 (Session 41 Part 11, Phase 3)
  Schema: schema/work_pattern_applications.schema.json
  
  Key fields:
    id                     -- Primary key: application-{work_unit_id}-{seq}
    work_unit_id           -- FK to L52 work_execution_units (CASCADE on delete)
    pattern_id             -- FK to L58 work_reusable_patterns (RESTRICT on delete)
    applied_at             -- When pattern was applied
    adaptations_made[]     -- Array of { step_number, adaptation_description, adaptation_type }
                              adaptation_type: skip | modify | add_step | reorder
    success_score          -- 0.0-1.0 (0.0 = failed, 1.0 = perfect execution)
    feedback               -- Freeform effectiveness feedback (10-2000 chars)
    outcome_id             -- FK to L56 work_outcomes (optional)
  
  Graph edges: applies_pattern (L59→L58), pattern_applied_to (L59→L52 CASCADE)
  Use cases: Track pattern usage, measure effectiveness, identify adaptation patterns
  Query: GET /model/work_pattern_applications/?pattern_id={id}&success_score<0.5

  L60 work_pattern_performance_profiles    0 items (schema deployed, aggregate layer)
  -----------------------------------------------------------------------
  Purpose: Aggregate pattern effectiveness metrics for selection guidance
  Status: DEPLOYED Mar 9, 2026 (Session 41 Part 11, Phase 3)
  Schema: schema/work_pattern_performance_profiles.schema.json
  
  Key fields:
    id                     -- Primary key: profile-{pattern_id}
    pattern_id             -- FK to L58 work_reusable_patterns (RESTRICT on delete)
    total_applications     -- Count of L59 records for this pattern
    success_rate           -- Aggregate success rate (avg of success_score from L59)
    successful_applications -- Count with success_score >= 0.8
    failed_applications    -- Count with success_score < 0.4
    avg_duration_seconds   -- Average work unit duration (nullable)
    p50_duration_seconds   -- Median duration
    p95_duration_seconds   -- 95th percentile
    common_adaptations[]   -- Top 5 most frequent adaptations (max 5 items)
                              Array of { adaptation_description, frequency, step_numbers[], adaptation_type }
    source_application_ids[] -- FK array to L59 (audit trail)
    last_updated           -- When profile was re-computed
    computation_method     -- manual | scheduled_batch | on_demand | real_time
  
  Graph edges: profiles_pattern (L60→L58), profile_sourced_from (L60→L59)
  Use cases: Pattern selection, performance comparison, tuning signals, pattern validation
  Query: GET /model/work_pattern_performance_profiles/?success_rate>0.9&pattern_type=deployment

## L61 work_factory_capabilities

  Capability catalog backed by patterns (L58). Abstract, compositional capabilities.
  
  Primary key: capability-{kebab-case-name}
  FK: backed_by_pattern_ids[] → L58 (SET_NULL), owner_type/owner_id (polymorphic)
  
  Field catalog:
    id, capability_name, description, maturity_level (experimental|beta|stable|deprecated),
    backed_by_pattern_ids[], required_patterns[], optional_patterns[], prerequisites[],
    input_schema_ref (L21), output_schema_ref (L21), owner_type, owner_id
  
  Graph edges: backs_capability (L61→L58)
  Use cases: Capability registry, maturity tracking, prerequisite checking, service composition
  Query: GET /model/work_factory_capabilities/?maturity_level=stable

## L62 work_factory_services

  Service packaging of capabilities - concrete invocable implementations.
  
  Primary key: service-{kebab-case-name}
  FK: required_capability_ids[] → L61 (RESTRICT), optional_capability_ids[] → L61 (RESTRICT),
      availability_sla_ref → L66, performance_profile_ref → L65,
      provider_type/provider_id (polymorphic: agent/cp_agent/external_api/human)
  
  Field catalog:
    id, service_name, description, service_type (synchronous|asynchronous|streaming|batch),
    required_capability_ids[], optional_capability_ids[], input_schema, output_schema,
    provider_type, provider_id, endpoint_url, authentication_method, status,
    availability_sla_ref, performance_profile_ref, version, deployment_target
  
  Graph edges: requires_capability (L62→L61), provides_optional_capability (L62→L61)
  Use cases: Service registry, agent-as-service routing, SLA monitoring, version management
  Query: GET /model/work_factory_services/?status=production&service_type=asynchronous

## L63 work_service_requests

  Service invocation requests - demand intake for services (L62). Fulfilled via runs (L64).
  
  Primary key: request-{YYYYMMDD}-{seq}
  FK: service_id → L62 (RESTRICT), requester_type/requester_id (polymorphic),
      project_id → L25 (optional), work_unit_id → L52 (optional)
  
  Field catalog:
    id, service_id, requester_type, requester_id, project_id, work_unit_id, input_payload,
    priority (critical|high|medium|low), status (queued|assigned|in_progress|completed|failed|cancelled),
    requested_at, assigned_at, completed_at, cancellation_reason
  
  Graph edges: requests_service (L63→L62), request_context_project (L63→L25),
               request_triggered_by (L63→L52)
  Use cases: Demand tracking, priority-based scheduling, backlog management, context tracing
  Query: GET /model/work_service_requests/?status=in_progress&priority=critical

## L64 work_service_runs

  Service runtime execution instances - child of requests (L63). Actual execution attempts.
  
  Primary key: run-{request_id}-{attempt}
  Parent: work_service_requests (CASCADE on delete)
  FK: request_id → L63 (CASCADE), work_unit_id → L52 (SET_NULL),
      trace_ids[] → L32, evidence_ids[] → L31
  
  Field catalog:
    id, request_id, work_unit_id, started_at, completed_at, duration_seconds,
    status (running|succeeded|failed|timeout|cancelled), output_payload, error_details,
    retry_attempt, resource_consumption {cpu_seconds, memory_mb, tokens_consumed, cost_usd},
    trace_ids[], evidence_ids[]
  
  Graph edges: fulfills_request (L64→L63, CASCADE), run_creates_work (L64→L52)
  Use cases: Execution tracking, retry logic, resource accounting, observability linking
  Query: GET /model/work_service_runs/?status=failed&retry_attempt=1

## L65 work_service_perf_profiles

  Aggregate service performance metrics - computed view tracking success, timing, cost per service.
  
  Primary key: profile-{service_id}
  FK: service_id → L62 (RESTRICT), source_run_ids[] → L64 (audit trail)
  
  Field catalog:
    id, service_id, total_runs, success_rate, successful_runs, failed_runs, timeout_runs,
    avg_duration_seconds, p50_duration_seconds, p95_duration_seconds, p99_duration_seconds,
    avg_cost_usd, total_cost_usd, common_errors[], source_run_ids[], last_updated,
    computation_method (manual|scheduled_batch|on_demand|real_time), time_window_hours
  
  Graph edges: profiles_service (L65→L62), profile_based_on_runs (L65→L64)
  Use cases: Service health monitoring, performance comparison, capacity planning, degradation detection
  Query: GET /model/work_service_perf_profiles/?success_rate<0.95

## L66 work_service_level_objectives

  Service Level Objective (SLO) definitions and thresholds per service. Breaches feed L67.
  
  Primary key: slo-{service_id}-{metric_name}
  FK: service_id → L62 (CASCADE on service delete)
  
  Field catalog:
    id, service_id, metric_name, target_value, threshold_warning, threshold_critical,
    measurement_window_hours, evaluation_frequency_minutes, comparison_operator,
    status (active|paused|archived), priority, description, remediation_runbook_url,
    notification_channels[], last_breach_at, last_evaluation_at, last_evaluation_result,
    breach_count_24h, breach_count_7d
  
  Graph edges: defines_slo (L66→L62, CASCADE)
  Use cases: SLA monitoring, breach detection, alert routing, compliance reporting
  Query: GET /model/work_service_level_objectives/?status=active&breach_count_24h>0

## L67 work_service_breaches

  SLA breach incident records — triggered automatically when service performance violates SLO thresholds.
  
  Primary key: breach-{slo_id}-{YYYYMMDD}-{seq}
  Parent: work_service_level_objectives (tracks which SLO was breached)
  FK: slo_id → L66 (RESTRICT), service_id → L62 (RESTRICT),
      affected_requests[] → L63, failed_runs[] → L64,
      remediation_plan_id → L68 (SET_NULL), revalidation_result_id → L69 (SET_NULL)
  
  Field catalog:
    id, slo_id, service_id, breach_detected_at, breach_resolved_at, duration_minutes,
    severity (warning|critical), status (active|remediating|resolved|acknowledged|false_positive),
    metric_name, target_value, actual_value, threshold_breached, measurement_window_hours,
    impact_assessment, root_cause_hypothesis, affected_requests[], failed_runs[],
    notification_sent, acknowledged_by, remediation_plan_id, revalidation_result_id
  
  Graph edges: breaches_slo (L67→L66), breach_for_service (L67→L62),
               breach_affects_requests (L67→L63), breach_failed_runs (L67→L64)
  Use cases: Automated SLO breach detection, impact assessment, breach lifecycle management
  Query: GET /model/work_service_breaches/?status=active&severity=critical

## L68 work_service_remediation_plans

  Remediation plans for SLA breaches — step-by-step recovery procedures with resource estimates.
  
  Primary key: remediation-{breach_id}
  Parent: work_service_breaches (CASCADE on breach delete)
  FK: breach_id → L67 (CASCADE), service_id → L62 (RESTRICT), work_unit_id → L52 (SET_NULL)
  
  Field catalog:
    id, breach_id, service_id, plan_type (automated|semi_automated|manual|escalation),
    status (draft|approved|executing|completed|failed|cancelled), priority, title, description,
    remediation_steps[] (step_number, step_name, step_description, required, estimated_duration_minutes,
    automation_available, validation_criteria[], rollback_instructions),
    estimated_duration_minutes, resource_requirements {agent_type, human_expertise, infrastructure_changes[],
    estimated_cost_usd}, risks[], approved_by, work_unit_id, success, failure_reason, lessons_learned
  
  Graph edges: remediates_breach (L68→L67, CASCADE), remediation_for_service (L68→L62),
               remediation_work (L68→L52)
  Use cases: Runbook codification, approval workflows, resource planning, lessons capture
  Query: GET /model/work_service_remediation_plans/?status=executing

## L69 work_service_revalidation_results

  Post-remediation verification — validates whether remediation successfully resolved breach.
  
  Primary key: revalidation-{breach_id}
  Parent: work_service_breaches (CASCADE on breach delete)
  FK: breach_id → L67 (CASCADE), remediation_plan_id → L68 (CASCADE),
      service_id → L62 (RESTRICT), slo_id → L66 (RESTRICT),
      sample_run_ids[] → L64, learning_feedback_id → L57 (SET_NULL)
  
  Field catalog:
    id, breach_id, remediation_plan_id, service_id, slo_id, revalidation_performed_at,
    measurement_window_hours, metric_name, target_value, pre_remediation_value,
    post_remediation_value, threshold_critical, passed (boolean), improvement_percentage,
    result_status (fully_resolved|partially_resolved|no_improvement|degraded),
    sample_size, sample_run_ids[], comparison_data {pre_remediation{}, post_remediation{}},
    next_steps, learning_feedback_id
  
  Graph edges: revalidates_breach (L69→L67, CASCADE), revalidates_remediation (L69→L68, CASCADE),
               revalidation_samples (L69→L64), revalidation_learning (L69→L57)
  Use cases: Remediation effectiveness verification, pre/post comparison, learning capture
  Query: GET /model/work_service_revalidation_results/?passed=false

## L70 work_service_lifecycle

  Service lifecycle events — tracks major transitions: deployment, upgrades, scaling, maintenance, deprecation.
  
  Primary key: lifecycle-{service_id}-{YYYYMMDD}-{seq}
  Parent: work_factory_services (CASCADE on service delete)
  FK: service_id → L62 (CASCADE), work_unit_id → L52 (SET_NULL),
      breach_id → L67 (SET_NULL), remediation_plan_id → L68 (SET_NULL), evidence_ids[] → L31
  
  Field catalog:
    id, service_id, event_type (deployed|upgraded|downgraded|scaled_up|scaled_down|
    maintenance_started|maintenance_completed|deprecated|retired|restored|configuration_changed|
    endpoint_migrated), event_timestamp, triggered_by_type, triggered_by_id, reason,
    previous_state {version, status, deployment_target, endpoint_url},
    new_state {version, status, deployment_target, endpoint_url},
    change_details {version_from, version_to, configuration_diff, infrastructure_changes[], breaking_changes},
    duration_minutes, downtime_minutes, success, error_details, rollback_performed,
    approval_required, approved_by, work_unit_id, breach_id, remediation_plan_id, evidence_ids[]
  
  Graph edges: lifecycle_for_service (L70→L62, CASCADE), lifecycle_work (L70→L52),
               lifecycle_breach_driven (L70→L67), lifecycle_remediation_driven (L70→L68)
  Use cases: Service change audit trail, upgrade/downgrade history, breach-driven changes, compliance
  Query: GET /model/work_service_lifecycle/?event_type=upgraded&service_id=service-schema-migrator

## L71 work_factory_portfolio

  Portfolio management view of all work services — executive-level oversight with aggregate health and capacity.
  
  Primary key: portfolio-{name-slug}
  FK: service_ids[] → L62 (many-to-many), roadmap_ids[] → L72, active_investment_ids[] → L73, governance_policy_ids[] → L75
  
  Field catalog:
    id, portfolio_name, description, owner_type, owner_id, status (active|planning|maintenance|deprecated|retired),
    service_ids[], service_count, health_summary {healthy_services, degraded_services, critical_services, offline_services,
    overall_health_score, last_updated_at}, capacity_summary {total_requests_24h, total_runs_24h, average_success_rate,
    total_active_breaches, peak_load_services[]}, strategic_priority (critical|high|medium|low),
    investment_level (flagship|growth|maintenance|harvest|divest), cost_summary {total_cost_usd_mtd,
    budget_allocation_usd, burn_rate_percentage, projected_end_of_month_usd}, roadmap_ids[], active_investment_ids[],
    governance_policy_ids[], tags[], created_at, updated_at, retired_at, notes
  
  Graph edges: portfolio_services (L71→L62), portfolio_roadmaps (L71→L72), portfolio_investments (L71→L73),
               portfolio_governance (L71→L75)
  Use cases: Portfolio dashboard, strategic planning, resource allocation, executive reporting
  Query: GET /model/work_factory_portfolio/?status=active&strategic_priority=critical

## L72 work_factory_roadmaps

  Strategic roadmaps for capability and service evolution — forward-looking initiatives with milestones and dependencies.
  
  Primary key: roadmap-{name-slug}
  Parent: work_factory_portfolio (RESTRICT on delete)
  FK: portfolio_id → L71 (RESTRICT), initiatives[].target_capability_ids[] → L61, initiatives[].target_service_ids[] → L62,
      initiatives[].investment_id → L73 (SET_NULL), initiatives[].milestone_ids[] → L28
  
  Field catalog:
    id, roadmap_name, description, portfolio_id, owner_type, owner_id, status (draft|proposed|approved|active|on_hold|
    completed|cancelled), planning_horizon (short_term_3mo|medium_term_6mo|long_term_12mo|multi_year), start_date,
    target_end_date, actual_completion_date, initiatives[] {initiative_id, initiative_name, description, status, priority,
    target_capability_ids[], target_service_ids[], investment_id, milestone_ids[], dependencies[], target_start_date,
    target_completion_date, actual_start_date, actual_completion_date, estimated_effort_person_days, actual_effort_person_days},
    strategic_themes[], success_criteria[], risks[], stakeholders[], approval_required, approved_by, approved_at, progress_percentage
  
  Graph edges: roadmap_for_portfolio (L72→L71, RESTRICT), roadmap_target_capabilities (L72→L61),
               roadmap_target_services (L72→L62), roadmap_milestones (L72→L28)
  Use cases: Strategic planning, dependency management, progress tracking, investment prioritization
  Query: GET /model/work_factory_roadmaps/?status=active&portfolio_id=portfolio-ai-automation

## L73 work_factory_investments

  Investment decisions and business justification — ROI tracking, approval workflows, funding allocation, actual returns.
  
  Primary key: investment-{name-slug}-{YYYYMMDD}
  Parent: work_factory_portfolio (RESTRICT on delete)
  FK: portfolio_id → L71 (RESTRICT), roadmap_id → L72 (SET_NULL), target_capability_ids[] → L61,
      target_service_ids[] → L62, work_unit_ids[] → L52, evidence_ids[] → L31
  
  Field catalog:
    id, investment_name, description, portfolio_id, roadmap_id, investment_type (new_capability|service_enhancement|
    infrastructure_upgrade|reliability_improvement|cost_optimization|technical_debt_reduction|security_hardening|
    compliance_requirement), status (draft|submitted|under_review|approved|rejected|funded|in_progress|completed|
    cancelled|deferred), requested_by, requested_at, requested_amount_usd, approved_amount_usd, actual_spent_usd,
    financial_breakdown {infrastructure_cost_usd, development_cost_usd, operational_cost_usd, training_cost_usd,
    contingency_percentage}, roi_analysis {expected_annual_savings_usd, expected_annual_revenue_usd, payback_period_months,
    net_present_value_usd, internal_rate_of_return_percentage, actual_annual_savings_usd, actual_annual_revenue_usd},
    target_capability_ids[], target_service_ids[], benefits[], risks[], approval_workflow, implementation_timeline,
    work_unit_ids[], evidence_ids[], success_metrics[], lessons_learned
  
  Graph edges: investment_for_portfolio (L73→L71, RESTRICT), investment_for_roadmap (L73→L72, SET_NULL),
               investment_target_capabilities (L73→L61), investment_target_services (L73→L62),
               investment_work (L73→L52), investment_evidence (L73→L31)
  Use cases: Business case management, approval workflow, ROI tracking, portfolio optimization
  Query: GET /model/work_factory_investments/?status=approved&portfolio_id=portfolio-ai-automation

## L74 work_factory_metrics

  Factory-level KPIs and aggregate health metrics — executive dashboard data with trend analysis and benchmarks.
  
  Primary key: metric-{category}-{name-slug}-{YYYYMMDD}-{HHMM}
  FK: portfolio_id → L71 (SET_NULL), service_id → L62 (SET_NULL), capability_id → L61 (SET_NULL),
      breach_ids[] → L67, related_governance_policy_ids[] → L75, evidence_ids[] → L31
  
  Field catalog:
    id, metric_name, metric_category (availability|performance|cost|capacity|quality|efficiency|reliability|security),
    description, measurement_timestamp, measurement_period (realtime|hourly|daily|weekly|monthly|quarterly|yearly),
    value, unit, target_value, threshold_warning, threshold_critical, status (healthy|warning|critical|unknown),
    scope (factory_wide|portfolio|service|capability), portfolio_id, service_id, capability_id,
    aggregation_details {sample_size, source_layers[], calculation_method, weighting_strategy},
    trend_analysis {previous_value, change_absolute, change_percentage, trend_direction, moving_average_7d,
    moving_average_30d}, benchmark_comparison {internal_benchmark, external_benchmark, best_in_class, comparison_status},
    contributing_factors[] {factor_type, factor_id, factor_name, contribution_percentage}, breach_ids[],
    related_governance_policy_ids[], evidence_ids[], alert_triggered, alert_details
  
  Graph edges: metric_for_portfolio (L74→L71), metric_for_service (L74→L62), metric_for_capability (L74→L61),
               metric_breaches (L74→L67), metric_governance (L74→L75), metric_evidence (L74→L31)
  Use cases: Executive dashboard, trend analysis, threshold governance, benchmarking
  Query: GET /model/work_factory_metrics/?status=critical&scope=factory_wide

## L75 work_factory_governance

  Governance policies and compliance rules — policy definitions, approval thresholds, audit procedures, enforcement mechanisms.
  
  Primary key: governance-policy-{name-slug}
  FK: portfolio_ids[] → L71, service_ids[] → L62, capability_ids[] → L61,
      related_cp_policy_ids[] → L16, related_metric_ids[] → L74, evidence_ids[] → L31
  
  Field catalog:
    id, policy_name, description, policy_type (approval_workflow|compliance_requirement|quality_gate|cost_control|
    security_control|operational_standard|slo_enforcement|risk_management|audit_rule), scope (factory_wide|portfolio|
    service|capability|project), portfolio_ids[], service_ids[], capability_ids[], status (draft|proposed|active|
    deprecated|retired), effective_date, expiration_date, owner_type, owner_id, enforcement_mechanism (automated_blocking|
    automated_warning|manual_review_required|advisory_only|audit_post_facto), policy_rules[] {rule_id, rule_description,
    condition_type, condition_details, enforcement_action, exemption_criteria}, compliance_mappings[] {framework_name,
    control_id, control_description}, related_cp_policy_ids[], related_metric_ids[], violation_history,
    audit_trail[] {event_type, event_timestamp, event_actor, event_details}, evidence_ids[], review_frequency,
    last_reviewed_at, next_review_due
  
  Graph edges: governance_for_portfolios (L75→L71), governance_for_services (L75→L62),
               governance_for_capabilities (L75→L61), governance_cp_policies (L75→L16), governance_evidence (L75→L31)
  Use cases: Policy enforcement, compliance auditing, approval workflows, threshold governance
  Query: GET /model/work_factory_governance/?status=active&policy_type=security_control

  SESSION 41 PART 10 SUMMARY (March 9, 2026 2:00 PM ET):
    - 4 execution layers deployed (L52, L53, L54, L56)
    - Parent-child cascade architecture: L52 parent, L53/L54/L56 children
    - 11 new FK edge types added (27 → 38 total)
    - Layer count: 87 → 91 operational
    - Planned layers: 24 → 20 (still L55, L57-L75 to deploy)
    - Phase 1 complete, Phase 2-6 ready for deployment
    - See docs/library/13-EXECUTION-LAYERS.md for complete specification

  SESSION 41 PART 11 UPDATE (March 9, 2026 6:37 PM ET):
    - Phase 2: 3 layers deployed (L55, L57, L58) -- Obligations, Learning, Patterns
      • Obligations tracking from decisions (L54→L55 inverse FK)
      • Adaptive learning feedback layer (L57) with confidence scoring
      • Reusable pattern library (L58) derived from learning
      • 6 new FK edge types added (38 → 44 total)
    - Phase 3: 2 layers deployed (L59, L60) -- Pattern Application & Performance
      • Pattern usage tracking (L59) with adaptations and success scoring
      • Performance profiles (L60) computed from applications (aggregate layer)
      • 4 new FK edge types added (44 → 48 total)
    - Phase 4: 6 layers deployed (L61-L66) -- Factory Services with SLAs
      • Capability catalog (L61) backed by patterns (L58)
      • Service registry (L62) with agent-as-service packaging
      • Request tracking (L63) for demand intake and priority scheduling
      • Run tracking (L64) for execution attempts with resource consumption
      • Performance profiles (L65) for service health monitoring
      • SLO definitions (L66) for breach detection (feeds L67 in Phase 5)
      • 11 new FK edge types added (48 → 59 total)
    - Phase 5: 4 layers deployed (L67-L70) -- Breach Remediation & Lifecycle
      • Breach tracking (L67) with automated detection and impact assessment
      • Remediation planning (L68) with runbook codification and approval workflows
      • Revalidation results (L69) with pre/post comparison and learning capture
      • Lifecycle events (L70) for service change audit trail
      • 16 new FK edge types added (59 → 75 total)
      • COMPLETE SELF-HEALING LOOP: breach → plan → remediate → revalidate → learn
    - Phase 6: 5 layers deployed (L71-L75) -- Strategy & Portfolio Management
      • Portfolio management (L71) with aggregate health, capacity, and cost tracking
      • Strategic roadmaps (L72) with initiatives, milestones, and dependency tracking
      • Investment decisions (L73) with ROI analysis, approval workflows, and actual returns
      • Factory metrics (L74) with aggregate KPIs, trend analysis, and benchmarking
      • Governance policies (L75) with compliance mapping and automated enforcement
      • 24 new FK edge types added (75 → 99 total)
      • COMPLETE EXECUTION ENGINE: Work → Learn → Services → Self-heal → Strategy → Governance
    - Layer count: 91 → 96 → 102 → 106 → 111 operational
    - Edge types: 38 → 48 → 59 → 75 → 99 total
    - ALL 24 EXECUTION LAYERS DEPLOYED (L52-L75)

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
 PLANNED EXPANSION: SECURITY SCHEMAS (L76-L87, Session 46B+C)
================================================================================

  Target: Q1 2026 (March 2026)
  Domains: 
    - P36 (AI Security Observatory): Red-teaming + LLM vulnerability testing
    - P58 (Security Factory): Infrastructure vulnerability scanning + remediation
  
  **P36 Red-Teaming Schemas (L76-L80):**
    L76: attack_tactic_catalog         - OWASP/ATLAS/NIST attack taxonomy
    L77: red_team_test_suite           - Promptfoo test pack definitions
    L78: ai_security_finding           - Dedicated red-team vulnerability records
    L79: framework_evidence_mapping    - Test → control → finding crosswalk
    L80: ai_security_metrics           - Test suite performance + coverage metrics
  
  **P58 Infrastructure Scanning Schemas (L81-L87):**
    L81: vulnerability_scan_result     - Network scan execution records
    L82: cve_finding                   - Individual CVE + CVSS + exploitability
    L83: risk_ranking                  - Pareto-ranked vulnerabilities (80/20 principle)
    L84: remediation_task              - Prioritized fix actions with SLA tracking
    L85: compliance_gap_mapping        - Framework control → CVE → remediation linker
    L86: threat_intelligence_context   - CVE enrichment + exploit trending
    L87: (reserved for Phase 2 extension)
  
  Status: Schema definitions in progress (Session 46B). Deployment planned post-execution-layers.
  See docs/SCHEMA-REQUIREMENTS-P36-P58.md for detailed specifications.

================================================================================
