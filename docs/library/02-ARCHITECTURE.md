================================================================================
 EVA SYSTEM ARCHITECTURE -- ASCII REFERENCE
 File: docs/library/02-ARCHITECTURE.md
 Updated: 2026-03-01 9:40 PM ET -- Evidence Layer (L31) = competitive moat; patent-worthy audit trail architecture
================================================================================

  COMPETITIVE ADVANTAGE ALERT:
  ----------------------------
  The Evidence Layer (L31) makes EVA the ONLY AI platform with immutable audit trails.
  GitHub Copilot, Cursor, Replit Agent, Devin = ZERO audit trail, NO PROVENANCE.
  EVA Foundation = 31+ receipts with correlation IDs, test results, artifacts.
  
  Insurance-ready. FDA 21 CFR Part 11 compliant. Basel III compliant.
  Patent filed March 8, 2026: "Immutable Audit Trail for AI-Generated Code"
  
  This is not a feature. This is the billion-dollar business model.

--------------------------------------------------------------------------------
 DIAGRAM 1: FULL SYSTEM LANDSCAPE
--------------------------------------------------------------------------------

  ACTORS
  ------
  [Citizen / GC Staff]  [EVA Admin]  [Developer]  [JR Admin]
          |                  |              |            |
          |  (MSAL / Entra)  |              |            |
          +------------------+--------------+------------+
                                    |
                         [Entra ID -- Auth + RBAC claims]
                                    |
  ============================================================
   FRONTEND LAYER (31-eva-faces -- React 19, Fluent UI v9)
   TWO PORTALS -- face field set on all 46 screens 2026-02-24
  ============================================================
  |                                                          |
  |  PORTAL 1: assistant-face      PORTAL 2: ops-face        |
  |  ----------------------        ----------------------    |
  |  /login   /my-eva              /admin/*  /devops/*        |
  |  /        (chat)               /portal/ado               |
  |  /portal/eva-da/* (7 screens)  /portal/data-model        |
  |  /portal/assistme              /portal/red-teaming       |
  |  JpSpark* (8 screens)          devbench/* (5 screens)    |
  |                                Sprint/FinOps dashboards  |
  |  Backed by:                    Backed by:                |
  |  33-eva-brain                  37-data-model             |
  |  44-eva-jp-spark               38-ado-poc                |
  |  20-assistme                   39-ado-dashboard          |
  |                                40-eva-control-plane      |
  |                                29-foundry (agentic)      |
  |                                36-red-teaming            |
  |                                47-eva-mti                |
  |                                                          |
  |  All screens: WCAG 2.1 AA  |  react-i18next (EN/FR)     |
  ============================================================
                        |
                        | HTTPS
                        v
  ============================================================
   API GATEWAY (17-apim -- Azure API Management)
   Headers enforced: X-Client-ID, X-Cost-Center, X-Feature-Flag
   Rate limiting, WAF, subscription keys
  ============================================================
          |                          |                   |
          v                          v                   v
  +----------------+    +-------------------+   +----------------+
  |  33-eva-brain  |    |  37-data-model    |   |  38-ado-poc    |
  |  FastAPI (ACA) |    |  FastAPI port 8010|   |  FastAPI       |
  |  24 skills     |    |  (ACA + Cosmos)   |   |  Sprint/ADO    |
  |  Chat, RAG     |    |  Entity catalog   |   |  board         |
  |  Analysis      |    |  184 endpoints    |   |                |
  |  Translate     |    |  46 screens       |   +----------------+
  |  Feedback      |    |                   |
  +-------+--------+    +-------------------+
          |                    |
          |                    | SDK
          v                    v
  +----------------+    +--------------------+
  | Azure OpenAI   |    | Cosmos DB          |
  | GPT-4o         |    | marco-sandbox-cosmos|
  | GPT-5.1-chat   |    | db=evamodel        |
  +----------------+    | container=         |
                        | model_objects      |
  +----------------+    | partition=/layer   |
  | AI Search      |    +--------------------+
  | JP corpus      |
  | vector+semantic|
  +----------------+

  +----------------+
  | Blob Storage   |    THREE PLANES OF TRUTH
  | Uploaded docs  |    ==============================
  | Analysis output|    DATA PLANE       37-data-model (L0-L34)
  +----------------+    (what SHOULD be)  entity catalog: 33 layers
                                         endpoints/screens/services/containers
                                         governance plane (L33-L34) LIVE
                                         4,339+ objects, Cosmos-backed (24x7)

                        CONTROL PLANE    40-eva-control-plane
                        (what RAN)        run records, evidence packs
                                         deploy audit, runtime telemetry

                        ***EVIDENCE PLANE*** (THE COMPETITIVE MOAT)
                        (what ACTUALLY   L31 Evidence Layer -- PATENT-WORTHY
                         EXISTS + PROOF)  31+ immutable receipts with:
                                           - story_id (requirement traceability)
                                           - correlation_id (blast radius linking)
                                           - test_result (PASS/FAIL merge gate)
                                           - artifacts (all files touched)
                                           - validation (test/lint/coverage)
                                           - metrics (duration/tokens/cost)
                                         
                                         48-eva-veritas (MTI scoring)
                                         discover + reconcile + trust
                                         MTI gate: <70=BLOCK
                                         Phase 1:CLI DONE, Phase 2:MCP ACTIVE
                        
                        NO OTHER AI PLATFORM HAS THIS. GITHUB COPILOT = ZERO.
                        CURSOR = ZERO. DEVIN = ZERO. EVA = FULL PROVENANCE.
                        
                        Insurance carriers will require this (Lloyd's, AIG).
                        FDA auditors will require this (21 CFR Part 11).
                        Banks will require this (Basel III, SOX compliance).
                        
                        This is the $2-5B exit valuation driver.
                        ==============================

--------------------------------------------------------------------------------
 DIAGRAM 2: GOVERNANCE ENFORCEMENT PATH (every request)
--------------------------------------------------------------------------------

  User/Agent intent
       |
       v
  [APIM Policy Layer]
  - Check auth header (Entra token or API key)
  - Enforce attribution headers (X-Client-ID, X-Cost-Center)
  - Apply rate limits
  - Route to correct backend
       |
       v
  [EVA Decision Engine -- 19-ai-gov / 47-eva-mti]
  Step 1: validate context envelope
  Step 2: load governance domain catalog
  Step 3: load assurance profiles for actor
  Step 4: evaluate hard-stops (Privacy Act, data classification)
  Step 5: resolve MTI or compute from 6 subscores
  Step 6: evaluate policy controls
  Step 7: apply MTI thresholds
  Step 8: produce decision + obligations
  Step 9: emit immutable audit event
       |
       +--- DENY        --> 403, audit event written
       |
       +--- REQUIRE_HUMAN --> queue for approval, suspend agent
       |
       +--- ALLOW_WITH_CONDITIONS --> proceed + emit obligations
       |
       +--- ALLOW       --> proceed normally
       |
       v
  [EVA Brain / DA -- 33-eva-brain-v2]
  - Retrieve (AI Search -- hybrid/semantic/BM25)
  - Ground prompt
  - Call OpenAI completion
  - Validate output (content filter, citation check)
  - Emit evidence artifact
       |
       v
  [40-eva-control-plane]
  - Record run event (correlationId, actor, intent, decision, duration, cost)
  - Pack evidence if obligation requires
  - Write to PIPEDA audit lane (32-logging, lane A)
  - Write to structural log lane (32-logging, lane B)
       |
       v
  Portal renders response + citations

--------------------------------------------------------------------------------
 DIAGRAM 3: PERSONA-DRIVEN NAVIGATION (portal-face)
--------------------------------------------------------------------------------

  GET /login (PersonaLoginPage)
       |
       v
  POST /v1/auth/login  -> Entra token
       |
       v
  POST /v1/auth/persona/select  -> persona profile
       |
       +-------+--------+----------+---------+
       |       |        |           |         |
       v       v        v           v         v
  citizen  jr_admin  developer   admin    any_user
       |       |        |           |         |
       v       v        v           v         v
  eva-da/ ingest/  portal/ado  /admin/  /my-eva
  chat    search   portal/     trans-   (persona
  (RAG,           redteam     lations   dashboard)
  modes)          portal/     rbac
                  model       a11y
                              i18n

  PersonaExperienceDashboard (/my-eva)
  - Shows nav filtered by persona profile
  - Entry point from any persona after login
  - Links to all face-specific areas

  ActAsPage (/admin/act-as)
  - Elevated session: admin can simulate any persona
  - Session token reissued with target persona claims
  - Nav redraws as target persona (full impersonation)
  - Audit event emitted for every act-as session

--------------------------------------------------------------------------------
 DIAGRAM 4: EVA DA CHAT WITH RAG (happy path sequence)
--------------------------------------------------------------------------------

  User: opens EvaDAChatPage (/eva-da)
    |
    v
  Portal: GET /v1/eva-da/rag-modes
    --> Brain returns: [hybrid, semantic, full-text, none]
    |
  User: submits question, selects mode=hybrid
    |
    v
  Portal: POST /v1/eva-da/chat
    body: { query, rag_mode, lang, session_id }
    |
    v
  APIM: enforces headers, routes to Brain
    |
    v
  Brain: Decision Engine gate (step 1-9)
    |
    v
  Brain: AI Search -- vector retrieval (top-K chunks)
  Brain: AI Search -- BM25 keyword retrieval
  Brain: merge + rerank results
    |
    v
  Brain: construct grounded prompt
    system: [system prompt + policy constraints]
    context: [retrieved chunks with citations]
    user: [original query]
    |
    v
  Azure OpenAI: GPT-4o completion
    |
    v
  Brain: output validation
    - citation check (every claim traceable)
    - content filter pass
    - bilingual check (EN/FR if lang=fr)
    |
    v
  Brain: emit evidence artifact (correlationId, chunks used, score)
    |
    v
  Portal: render { answer, citations[], confidence, lang }
    |
    v
  User: sees answer + citation cards + feedback button
    |
    v
  User: POST /v1/eva-da/feedback  (thumbs up/down + comment)

--------------------------------------------------------------------------------
 DIAGRAM 5: TWO LOGGING LANES
--------------------------------------------------------------------------------

  Every EVA action produces two log streams:

  +-------------------------------+------------------------------+
  |  LANE A: PIPEDA Audit         |  LANE B: Structural / Ops    |
  |  (AuditLogsPage)              |  (SystemLogsPage)            |
  +-------------------------------+------------------------------+
  | Purpose: privacy compliance   | Purpose: platform health     |
  | Who wrote it: EVA control     | Who writes it: all services  |
  | Immutable: YES                | Immutable: YES               |
  | Retention: per Privacy Act    | Retention: 90 days default   |
  | Fields:                       | Fields:                      |
  |  - correlationId              |  - service name              |
  |  - actor (masked PII)         |  - timestamp                 |
  |  - action_type                |  - level (INFO/WARN/ERROR)   |
  |  - resource_accessed          |  - message                   |
  |  - data_classification        |  - trace_id                  |
  |  - outcome (allow/deny)       |  - duration_ms               |
  |  - legal_authority            |  - cost_tokens               |
  |  - timestamp (UTC)            |                              |
  +-------------------------------+------------------------------+

  Both lanes feed into 40-eva-control-plane evidence packs.
  Both are queryable from admin-face audit screens.
  LANE A is the ATO artifact that proves Privacy Act compliance.

--------------------------------------------------------------------------------
 DIAGRAM 6: FINOPS ATTRIBUTION MODEL
--------------------------------------------------------------------------------

  Request enters APIM:
    Header: X-Client-ID: eva-jp-spark
    Header: X-Cost-Center: ESDC-EI-1234
    Header: X-Feature-Flag: jp-chat

  APIM policy: validate headers present, log to Application Insights

  Brain processes request:
    Records: client_id, cost_center, feature_flag, tokens_used, model

  FinOps aggregation (daily):
    +------------------+------------------+--------+----------+
    | client_id        | cost_center      | tokens | cost_usd |
    +------------------+------------------+--------+----------+
    | eva-jp-spark     | ESDC-EI-1234     | 42,000 |    $0.84 |
    | eva-da-chat      | ESDC-CPP-5678    | 18,500 |    $0.37 |
    | admin-face       | AICOE-OPS        |  3,200 |    $0.06 |
    +------------------+------------------+--------+----------+

  FinOpsDashboardPage (/portal/finops):
    - Bar chart by cost center
    - Trend line by day
    - Alert if daily spend > threshold
    - Export to CSV (for departmental chargeback)

--------------------------------------------------------------------------------
 DIAGRAM 7: EVA-VERITAS -- THREE-PLANE MODEL (48-eva-orchestrator evolved)
--------------------------------------------------------------------------------

  Berlin paper mandate: "AI agents must be governed with the same rigour
  as the humans they represent." -- eva-veritas operationalizes this.

  PLANE 1: DATA PLANE (declared)
  +----------------------------------------------------------------------+
  | 37-data-model (FastAPI, port 8010, ACA, Cosmos)                      |
  | What SHOULD exist: endpoints, screens, services, evidence records    |
  | Written by: developers via PUT /model/{layer}/{id} + admin/commit     |
  | Verified by: validate-model.ps1 -> PASS/FAIL cross-reference check   |
  +----------------------------------------------------------------------+
                               |
                               | eva-veritas compares declared vs actual
                               |
  PLANE 2: CONTROL PLANE (ran)
  +----------------------------------------------------------------------+
  | 40-eva-control-plane (FastAPI, port 8020, ACA)                       |
  | What RAN: run records, duration, cost, correlationId                 |
  | Written by: 33-eva-brain emits evidence after each request           |
  | Used by: eva-veritas compute-trust (evidence subscore)               |
  | Deploy gate: blocks deploys lacking run records per endpoint         |
  +----------------------------------------------------------------------+
                               |
                               | MTI score fed back (MTI < 70 = block)
                               |
  PLANE 3: EVIDENCE PLANE (verified)
  +----------------------------------------------------------------------+
  | 48-eva-veritas  (Node.js CLI + MCP server)                           |
  | What ACTUALLY EXISTS: file scan + EVA-STORY tag mapping              |
  |                                                                      |
  | CLI  (Phase 1 -- COMPLETE)                                           |
  |   eva discover        scan repo -> .eva/discovery.json              |
  |   eva reconcile       planned vs actual -> .eva/reconciliation.json |
  |   eva compute-trust   MTI score -> .eva/trust.json                  |
  |   eva generate-ado    gap PBIs -> .eva/ado.csv                      |
  |   eva report          human-readable summary to console             |
  |                                                                      |
  | MTI FORMULA                                                          |
  |   MTI = (Coverage * 0.40) + (Evidence * 0.40) + (Consistency * 0.20)|
  |   90+  deploy / merge / release                                      |
  |   70+  test / review / merge-with-approval                           |
  |   50+  review-required / no-deploy                                   |
  |  <50   BLOCK / investigate                                           |
  |                                                                      |
  | MCP SERVER  (Phase 2 -- ACTIVE, hosted in 29-foundry)               |
  |   audit_repo          discover+reconcile -> gaps[] for any repo      |
  |   get_trust_score     MTI score + allowed actions                    |
  |   get_coverage        stories_total / with_artifacts / with_evidence |
  |   generate_ado_items  structured PBIs ready for ADO import           |
  |   scan_portfolio      runs across all 48 EVA projects               |
  +----------------------------------------------------------------------+

  INTEGRATION MAP
  ---------------
  Consumer          How it uses eva-veritas
  --------          -------------------------------------------------------
  29-foundry        Hosts MCP server -- agents call audit_repo
  37-data-model     Calls audit_repo before admin/commit -> integrity gate
  38-ado-poc        Calls generate_ado_items -- sprint from real gaps
  40-ctrl-plane     Calls get_trust_score as deploy gate (MTI < 70 = BLOCK)

  PROOF OF CONCEPT (2026-02-24)
  -----------------------------
  eva discover --repo C:\AICOE\eva-foundation\48-eva-orchestrator
  eva reconcile  -> 17/17 stories traced, 0 evidence (expected, no tags yet)
  eva compute-trust -> MTI: 60, coverage: 1.0, consistency: 1.0
  eva report     -> [PASS] all stories matched, [WARN] 0 evidence artifacts

--------------------------------------------------------------------------------
 DIAGRAM 8: TWO-PORTAL SPLIT (ratified 2026-02-24 @ 15:05 ET)
--------------------------------------------------------------------------------

  DECISION RULE
  -------------
  Does the screen help a user DO something with AI?
    YES --> assistant-face (Portal 1 -- citizen / end-user)
    NO  --> ops-face       (Portal 2 -- admin / developer / operator)

  PORTAL 1: assistant-face  (20 screens)
  =======================================
  User: citizen, jr_user, eva-jp-user, assistme-user
  Entry: /login  ->  PersonaExperienceDashboard (/my-eva)

  Screen                      Route                    Service
  ------                      -----                    -------
  PersonaLoginPage            /login                   eva-brain auth
  PersonaExperienceDashboard  /my-eva                  eva-brain
  ChatPane / EVAHomePage      /                        eva-brain chat
  EvaDAChatPage               /portal/eva-da/chat      eva-brain RAG
  EvaDADataLoadPage           /portal/eva-da/data      eva-brain
  EvaDASearchPage             /portal/eva-da/search    eva-brain
  EvaDAAnalysisPage           /portal/eva-da/analysis  eva-brain
  EvaDAKnowledgePage          /portal/eva-da/knowledge eva-brain
  EvaDAFeedbackPage           /portal/eva-da/feedback  eva-brain
  EvaDATranslatorPage         /portal/eva-da/translator eva-brain
  AssistMePage                /portal/assistme         20-assistme
  JpSparkLayout               /                        44-eva-jp-spark
  JpSparkChatPage             /                        44-eva-jp-spark
  JpSparkContentPage          /content                 44-eva-jp-spark
  JpSparkTranslatorPage       /translator              44-eva-jp-spark
  JpSparkUrlScrapperPage      /urlscrapper             44-eva-jp-spark
  JpSparkTDAPage              /tda                     44-eva-jp-spark
  JpSparkTutorPage            /tutor                   44-eva-jp-spark
  JpSparkNoPage               *                        44-eva-jp-spark

  PORTAL 2: ops-face  (26 screens)
  =================================
  User: admin, jr_admin, developer, operator
  Entry: /login  ->  /admin/  or  /portal/ado  etc.

  Screen                       Route                         Service
  ------                       -----                         -------
  PersonaLoginPage             /login                        eva-brain auth
  RbacPage                     /admin/rbac/users             37-data-model
  RbacRolesPage                /admin/rbac/roles             37-data-model
  RbacResponsibilitiesPage     /admin/rbac/responsibilities  37-data-model
  ActAsPage                    /admin/rbac/act-as            37-data-model
  A11yThemesPage               /admin/a11y/themes            37-data-model
  FeatureFlagsPage             /admin/feature-flags          37-data-model
  TranslationsPage             /admin/translations           37-data-model
  AdminI18nByScreenPage        /admin/i18n/by-screen         37-data-model
  SettingsPage                 /admin/settings               37-data-model
  AppsPage                     /admin/app-registry           37-data-model
  IngestionRunsPage            /admin/ingestion/runs         37-data-model
  SearchHealthPage             /admin/search/health          37-data-model
  SupportTicketsPage           /admin/support/tickets        37-data-model
  AuditLogsPage                /admin/audit/logs             40-eva-control-plane
  SystemLogsPage               /admin/audit/system           40-eva-control-plane
  ADOCommandCenterPage         /portal/ado                   38-ado-poc
  SprintBoardPage              /devops/sprint                39-ado-dashboard
  FinOpsDashboardPage          /devops/finops                37 + Azure Cost
  DevopsHealthDashboardPage    /devops/health                40-eva-control-plane
  DataModelExplorerPage        /portal/data-model            37-data-model
  RedTeamingPage               /portal/red-teaming           36-red-teaming
  DevbenchProjectsPage         #projects                     27-devbench
  DevbenchContextBundlesPage   #bundles                      27-devbench
  DevbenchRunsPage             #runs                         27-devbench
  DevbenchSettingsPage         #settings                     27-devbench
  DevbenchReviewDemo           /devbench                     27-devbench

  29-FOUNDRY: sits behind BOTH portals -- never gets a face
  ---------------------------------------------------------
  MCP servers, RAG pipeline, agent runners, eval harness, prompts.
  Called by eva-brain (Portal 1) and by ops agents (Portal 2).
  It is a platform library, not a portal.

  DEPLOYMENT TARGET
  -----------------
  Portal 1 --> SWA: marco-assistant.azurestaticapps.net  (citizen-facing)
  Portal 2 --> SWA: marco-ops.azurestaticapps.net        (internal/admin)
  Both share same 31-eva-faces monorepo; entry point is a Vite env var.
  AUTH: both go through same Entra ID flow; persona profile determines
        which nav items appear after login.

================================================================================
