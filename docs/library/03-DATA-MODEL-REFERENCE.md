================================================================================
 EVA DATA MODEL -- 27-LAYER REFERENCE
 File: docs/library/03-DATA-MODEL-REFERENCE.md
 Updated: 2026-02-24 @ 15:30 ET -- Two-portal split; face field on all 46 screens
 Source: http://localhost:8010  (store=cosmos, validated PASS 0 violations)
================================================================================

  GOLDEN RULE
  -----------
  This HTTP API is the ONLY interface for agents.
  The model/*.json files are an INTERNAL IMPLEMENTATION DETAIL.
  Agents must never read, grep, parse, or reference them.
  One HTTP call beats ten file reads and ten grep commands.

  Bootstrap sequence for any agent:
    GET /health                -> confirms store=cosmos, gives agent_guide link
    GET /model/agent-guide     -> complete operating protocol in JSON
    GET /model/agent-summary   -> all 27 layer counts in one call

  WRITE CYCLE (3-step preferred)
  --------------------------------
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
  L11-L17  Control Plane         (automation operating model, Phase 4)
  L18-L20  Frontend Structural   (components / hooks / ts_types, Phase 5)
  L21-L24  Catalog Additions     (MCP servers / prompts / security / runbooks)
  L25-L26  Project Plane         (projects + WBS, E-07/E-08 sprint)

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
 CONTROL PLANE LAYERS (L11-L17)
--------------------------------------------------------------------------------

  L11 planes            3 items
  -----------------------------------------------------------------------
  EVA automation operating model planes.
  Items: plane-ado, plane-github, plane-azure
  Each plane has a DPDCA runner registered in 38-ado-poc.

  L12 connections       3 items
  -----------------------------------------------------------------------
  External system connection records (design-time config).
  Items: ADO org URL, Azure subscription ID, Azure RG + location
  Backfilled 2026-02-22; used by plane agents for authentication.

  L13 environments      3 items
  -----------------------------------------------------------------------
  Items: dev, staging, prod
  Each has: feature_flag defaults, APIM policies, Cosmos connection,
            allowed personas, MTI threshold overrides

  L14 cp_agents         4 items
  -----------------------------------------------------------------------
  Control plane automation agents (not user-facing).
  Items: ADO scrum agent, code review agent, PR merge agent, deploy agent
  Each agent has an assurance profile (from 19-ai-gov).

  L15 cp_policies       3 items
  -----------------------------------------------------------------------
  Items: approval policy, cost policy, compliance policy
  These feed the Decision Engine as policy references.

  L16 cp_skills         7 items
  -----------------------------------------------------------------------
  Orchestration skill catalog (29-foundry inputs).
  Examples: rag-retrieval, answer-generation, evidence-emit,
            redteam-run, sprint-sync, cost-attribution, log-audit

  L17 cp_workflows      2 items
  -----------------------------------------------------------------------
  Items: sprint-execute (38-ado-poc driven),
         deploy-to-sandbox (17-apim + ACA)

--------------------------------------------------------------------------------
 FRONTEND STRUCTURAL LAYERS (L18-L20)
--------------------------------------------------------------------------------

  L18 components        32 items
  -----------------------------------------------------------------------
  React component catalog (31-eva-faces scan, 2026-02-22).
  Examples: ChatPane, CitationCard, PersonaSelector, RAGModeToggle,
            A11yThemeProvider, I18nByScreenEditor, AuditLogViewer,
            ActAsSelector, MTIDashboard, FinOpsTile

  L19 hooks             18 items
  -----------------------------------------------------------------------
  React hook catalog.
  Examples: usePersona, useRAGMode, useEvidencePack, useA11yTheme,
            useI18nByScreen, useActAs, useFeatureFlag, useFinOps

  L20 ts_types          (items pending population)
  -----------------------------------------------------------------------
  TypeScript type definitions shared across faces.
  Planned: Actor, PersonaProfile, RAGMode, EvidenceArtifact, MTIScore,
           DecisionResult, ChatMessage, Citation

--------------------------------------------------------------------------------
 CATALOG ADDITIONS (L21-L24)
--------------------------------------------------------------------------------

  L21 mcp_servers       (items pending)
  -----------------------------------------------------------------------
  MCP server catalog (29-foundry).
  Known servers: Azure AI Search MCP, Cosmos DB MCP, Blob Storage MCP,
                 Skill Discovery MCP

  L22 prompts           (items pending)
  -----------------------------------------------------------------------
  Versioned system prompt catalog.
  Each prompt has: id, version, model_target, policy_constraints[],
                   language, last_red_teamed

  L23 security_controls (items pending)
  -----------------------------------------------------------------------
  ITSG-33 / ATLAS control mapping registry.
  Used for ATO artifact generation.

  L24 runbooks          (items pending)
  -----------------------------------------------------------------------
  Operational runbooks for common platform tasks.
  Examples: Cosmos re-seed, ACA redeploy, APIM policy update,
            evidence pack generation, red team run

--------------------------------------------------------------------------------
 PROJECT PLANE (L25-L26)
--------------------------------------------------------------------------------

  L25 projects          48 items
  -----------------------------------------------------------------------
  NOTE: All 27 numbered eva-foundation projects and their maturity.
  Key fields: id, name, maturity, owner, description,
              copilot_instructions, skills_count, wbs_count
  Maturity values: active, poc, idea, empty, retired

  L26 wbs               13 items (1 program | 4 streams | 3 projects | 5 deliverables)
  -----------------------------------------------------------------------
  Work breakdown structure. Dual-mode PM: Agile Scrum + classical Gantt/EVM.
  Schema registered: WBSNode (in /model/schemas/WBS)

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
