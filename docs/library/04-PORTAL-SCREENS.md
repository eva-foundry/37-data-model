================================================================================
 EVA PORTAL -- 46-SCREEN CATALOG
 File: docs/library/04-PORTAL-SCREENS.md
 Updated: 2026-02-24 @ 15:30 ET -- Two-portal split. face field set on all 46.
 Source: http://localhost:8010/model/screens/  (PASS 0 violations)
================================================================================

All screens: WCAG 2.1 AA (jest-axe enforced) + react-i18next (EN/FR)
Faces: assistant-face (20 screens) | ops-face (26 screens)
Two SWA deployment targets. face field set in Cosmos on all 46 screens.
New screens (Feb 24 catalog): marked [NEW]

--------------------------------------------------------------------------------
 TWO-PORTAL DESIGN (ratified 2026-02-24)
--------------------------------------------------------------------------------

  ASSISTANT-FACE            citizen / AI-use portal
  ----------------          React 19 SWA (eva-faces/assistant)
  20 screens                Login, EVA DA suite, JP Spark suite, EVAHome,
                            ChatPane, AssistMe

  OPS-FACE                  admin / control-plane portal
  --------                  React 19 SWA (eva-faces/ops)
  26 screens                Admin, DevOps/Platform, Dev Tools, DevBench

  Face field set in Cosmos on all 46 screens. GET /model/screens/ is authoritative.

--------------------------------------------------------------------------------
 SCREEN STATUS LEGEND
--------------------------------------------------------------------------------
  planned     - registered in model, component not yet built
  scaffold    - component shell exists, no logic
  implemented - logic built, not yet connected to live backend
  live        - connected end-to-end
  (all Feb 24 additions are "planned")

================================================================================
 ASSISTANT-FACE SCREENS (20 screens)
================================================================================

  Citizen / AI-use portal. RAG, JP jurisprudence, chat, translation, knowledge.
  Deployment target: eva-faces/assistant  (SWA #1)
  All screens: WCAG 2.1 AA + react-i18next EN/FR

--------------------------------------------------------------------------------
 AUTH / ENTRY LAYER (2 screens) [NEW]
--------------------------------------------------------------------------------

  ID                         Route          Persona Access
  -------------------------  ------------   ----------------
  PersonaLoginPage           /login         all
  PersonaExperienceDashboard /my-eva        all (post-login)

  PersonaLoginPage
    Purpose: Entry point for all EVA users.
             User selects which persona they want to experience.
             Each persona configures nav, home route, visible features.
    API calls:
      GET  /v1/auth/personas          (list available personas)
      POST /v1/auth/login             (Entra token exchange)
      POST /v1/auth/persona/select    (issue persona-scoped token)

  PersonaExperienceDashboard
    Purpose: Personalized home after login.
             Tiles/widgets reconfigure based on persona profile.
             "My EVA" -- shortcuts to most-used tools for this persona.
    API calls:
      GET  /v1/auth/me                (current user + persona)
      GET  /model/services/           (available services for persona)

--------------------------------------------------------------------------------
 GENERAL AI HUB (3 screens)
--------------------------------------------------------------------------------

  ID                     Route              Status
  ---------------------  -----------------  -----------
  EVAHomePage            /                  implemented
  ChatPane               /chat              implemented
  AssistMePage           /portal/assistme   planned

  EVAHomePage
    Central hub for the assistant portal. Tiles for EVA DA, JP Spark, Chat,
    AssistMe. Persona-aware: nav and tiles reconfigure per selected persona.
    API calls: GET /v1/auth/me, GET /model/services/

  ChatPane
    Standalone chat. Direct bookmark / embedded widget scenario.
    Simpler than EvaDAChatPage -- no RAG mode selector.
    API calls: POST /v1/chat, POST /api/feedback

  AssistMePage
    AssistMe AI knowledge management assistant.
    API calls: POST /v1/assistme/chat, GET /v1/assistme/topics,
               POST /v1/assistme/feedback

  EVA DA Chat Suite (7 screens) [NEW]
  ------------------------------------
  ID                    Route                 Purpose
  --------------------  --------------------  ---------------------
  EvaDAChatPage         /eva-da               Main chat (RAG modes)
  EvaDADataLoadPage     /eva-da/data          Upload + manage corpus
  EvaDASearchPage       /eva-da/search        Direct search interface
  EvaDAAnalysisPage     /eva-da/analysis      Document analysis
  EvaDAKnowledgePage    /eva-da/knowledge     Knowledge base browse
  EvaDAFeedbackPage     /eva-da/feedback      Feedback + ratings view
  EvaDATranslatorPage   /eva-da/translate     EN<->FR translation

  EvaDAChatPage
    Main RAG chat. Mode selector: hybrid, semantic, full-text, none.
    Citation cards with source + confidence. Bilingual toggle.
    API calls:
      GET  /v1/eva-da/rag-modes
      POST /v1/eva-da/chat
      POST /v1/eva-da/feedback

  EvaDADataLoadPage
    Corpus management. Upload files, scrape URLs, manage folders/tags.
    API calls:
      POST /v1/eva-da/data/upload
      GET  /v1/eva-da/data/folders
      POST /v1/eva-da/data/folders
      GET  /v1/eva-da/data/tags
      GET  /v1/eva-da/data/status
      POST /v1/eva-da/data/url-scrape

  EvaDASearchPage
    Direct search (no chat). Raw retrieval results with scoring.
    API calls: POST /v1/eva-da/chat (rag_mode=full-text, search_only=true)

  EvaDAAnalysisPage
    Upload document -> structured analysis output. Image extraction.
    API calls:
      POST /v1/eva-da/analysis
      GET  /v1/eva-da/analysis/images
      GET  /v1/eva-da/analysis/output
      GET  /v1/eva-da/analysis/maxfilesize

  EvaDAKnowledgePage
    Browse indexed knowledge base. Filter by tag, folder, date.
    API calls: GET /v1/eva-da/knowledge

  EvaDAFeedbackPage
    Admin view of all feedback submitted across eva-da suite.
    API calls: GET /v1/eva-da/feedback, GET /v1/eva-da/feedback/export

  EvaDATranslatorPage
    Standalone EN<->FR translator. PSPC/GC terminology aware.
    API calls: POST /v1/eva-da/translate

  NOTE: ADOCommandCenterPage, DataModelExplorerPage, RedTeamingPage have
  moved to ops-face (developer tools). AssistMePage stays in assistant-face
  (see GENERAL AI HUB above).

--------------------------------------------------------------------------------
 JP SPARK SUITE (8 screens) [ASSISTANT-FACE]
--------------------------------------------------------------------------------

  React 19 + GC Design System. Bilingual mandatory. Phase 3.
  Jurisprudence-specific RAG (Employment Insurance, CPP, OAS).

  ID                       Route          Status
  -----------------------  -------------  -------
  JpSparkLayout            /              scaffold
  JpSparkChatPage          /              scaffold
  JpSparkContentPage       /content       scaffold
  JpSparkTranslatorPage    /translator    scaffold
  JpSparkUrlScrapperPage   /urlscrapper   scaffold
  JpSparkTDAPage           /tda           scaffold
  JpSparkTutorPage         /tutor         scaffold
  JpSparkNoPage            *              scaffold

  JP-specific notes:
  - Corpus: JP SQLite -> XML (05-extract-cases pipeline)
  - RAG grounded on Employment Law corpus (ESDC)
  - Answers cite specific case IDs + decision paragraphs
  - French-first: FR is primary, EN is secondary
  - Project: 44-eva-jp-spark (inherits EVA-JP-v1.2 as reference)

================================================================================
 OPS-FACE SCREENS (26 screens)
================================================================================

  Admin / control-plane portal. Platform health, RBAC, ingestion, dev tools.
  Deployment target: eva-faces/ops  (SWA #2)
  Audience: jr_admin, developer, admin, eva_admin, support_agent, auditor, red_teamer
  All screens: WCAG 2.1 AA + react-i18next EN/FR

--------------------------------------------------------------------------------
 DEVOPS / PLATFORM (3 screens)
--------------------------------------------------------------------------------

  ID                        Route            Status
  ------------------------  ---------------  -----------
  SprintBoardPage           /devops/sprint   implemented
  FinOpsDashboardPage       /devops/finops   planned
  DevopsHealthDashboardPage /devops/health   planned

  SprintBoardPage
    ADO sprint board view. Current sprint PBIs, velocity, blockers.
    API calls: GET /v1/scrum/sprints, GET /v1/scrum/pbis

  FinOpsDashboardPage [NEW]
    Azure cost attribution dashboard.
    Bar chart by X-Cost-Center, trend line, spend alerts.
    API calls: GET /v1/finops/summary, GET /v1/finops/by-cost-center

  DevopsHealthDashboardPage [NEW]
    Platform health: ACA status, APIM latency, error rates, deployments.
    API calls: GET /v1/devops/health, GET /v1/devops/deployments

--------------------------------------------------------------------------------
 DEV TOOLS (3 screens)
--------------------------------------------------------------------------------

  ID                    Route                Status
  --------------------  -------------------  -------
  ADOCommandCenterPage  /portal/ado          planned
  DataModelExplorerPage /portal/data-model   planned
  RedTeamingPage        /portal/red-teaming  planned

  ADOCommandCenterPage
    Sprint management, PBI grooming, velocity charts.
    Source: 38-ado-poc
    API calls: GET /v1/scrum/sprints, GET /v1/scrum/pbis,
               GET /model/services/

  DataModelExplorerPage
    Browse the 27-layer data model. Graph view, impact analysis.
    Source: 37-data-model
    API calls: GET /model/services/, GET /model/graph/,
               GET /model/services/{id}, GET /model/impact/

  RedTeamingPage
    Promptfoo red teaming results. ATLAS control coverage matrix.
    Source: 36-red-teaming
    API calls: GET /v1/redteam/results, GET /v1/redteam/runs,
               POST /v1/redteam/run, GET /v1/redteam/config

--------------------------------------------------------------------------------
 DEVBENCH (5 screens)
--------------------------------------------------------------------------------

  COBOL / legacy modernization assistant. Targeted at developers
  modernizing Oracle Forms and COBOL programs. Source: 27-devbench.

  ID                         Route     Status
  -------------------------  --------  -------
  DevbenchReviewDemo         /         scaffold
  DevbenchProjectsPage       #projects scaffold
  DevbenchContextBundlesPage #bundles  scaffold
  DevbenchRunsPage           #runs     scaffold
  DevbenchSettingsPage       #settings scaffold

--------------------------------------------------------------------------------
 ADMIN SCREENS (15 screens) [OPS-FACE]
--------------------------------------------------------------------------------

  Pre-existing Screens (Phase 1-2)
  ---------------------------------
  ID                   Route                  Status
  -------------------  ---------------------  -----------
  TranslationsPage     /admin/translations    implemented
  SettingsPage         /admin/settings        implemented
  AppsPage             /admin/apps            implemented
  AuditLogsPage        /admin/audit           implemented  (PIPEDA lane A)
  RbacPage             /admin/rbac            implemented
  RbacRolesPage        /admin/rbac/roles      implemented
  IngestionRunsPage    /admin/ingestion       implemented
  SearchHealthPage     /admin/search-health   implemented
  SupportTicketsPage   /admin/support         implemented
  FeatureFlagsPage     /admin/feature-flags   planned

  TranslationsPage
    Manage i18n translation keys. Import/export. Version history.
    API calls: GET /v1/config/translations, POST /v1/config/translations/import

  AuditLogsPage
    PIPEDA audit lane. Immutable. Filter by actor, action, resource.
    Privacy-sensitive fields are masked.
    API calls: GET /v1/logs/audit, GET /v1/logs/audit/export

  RbacPage / RbacRolesPage
    Role assignments, permission matrix, role definitions.
    API calls: GET /v1/rbac/roles, GET /v1/rbac/assignments

  New Admin Screens (Feb 24) [NEW]
  ---------------------------------
  ID                      Route                   Status
  ----------------------  ----------------------  -------
  A11yThemesPage          /admin/a11y/themes      planned
  AdminI18nByScreenPage   /admin/i18n/by-screen   planned
  SystemLogsPage          /admin/logs/system      planned
  RbacResponsibilitiesPage /admin/rbac/resp        planned
  ActAsPage               /admin/act-as           planned

  A11yThemesPage
    Manage WCAG theme variants. Default, high-contrast, large-text.
    Themes applied globally via ThemeProvider.
    API calls:
      GET    /v1/admin/a11y/themes
      POST   /v1/admin/a11y/themes
      PATCH  /v1/admin/a11y/themes/{id}
      DELETE /v1/admin/a11y/themes/{id}
      GET    /v1/admin/a11y/themes/active

  AdminI18nByScreenPage
    Edit i18n literals per screen. Export/import JSON bundles.
    Enables non-developer translation management.
    API calls:
      GET  /v1/config/translations/by-screen/{screenId}
      POST /v1/config/translations/import
      GET  /v1/config/translations/export

  SystemLogsPage
    Structural / operational log lane (Lane B).
    Filter by service, level, trace ID. Not privacy-sensitive.
    API calls: GET /v1/logs/system, GET /v1/logs/system/export

  RbacResponsibilitiesPage
    Governance: what each role is RESPONSIBLE for (not just allowed).
    Distinction: Role = what you CAN do. Responsibility = what you OWN.
    Aligned to EVA Actor Model (19-ai-gov/EVA-Actor-Governance.md).
    API calls: GET /v1/rbac/responsibilities, GET /v1/rbac/roles

  ActAsPage
    Admin-level persona impersonation for empathy + support.
    Issues elevated session token scoped to target persona.
    Full nav redraws. Every session produces an audit event (Lane A).
    Use case 1: admin wants to experience the citizen persona
    Use case 2: support agent replicates a user's exact view
    Use case 3: developer tests persona-gated features
    API calls:
      GET    /v1/rbac/responsibilities   (list valid target personas)
      POST   /v1/rbac/act-as             {target_persona, reason}
      DELETE /v1/rbac/act-as             (end elevated session)

  NOTE: ChatPane (/chat) is in ASSISTANT-FACE (see GENERAL AI HUB above).
  JP Spark suite (8 screens) is in ASSISTANT-FACE (see JP SPARK SUITE above).
  DevBench (5 screens) is in OPS-FACE (see DEVBENCH above).

--------------------------------------------------------------------------------
 PERSONA -> PORTAL ROUTING
--------------------------------------------------------------------------------

  Persona              Portal Target     Default Landing    Key Screens
  -------------------  ----------------  -----------------  ----------------------------
  citizen              assistant-face    /portal/eva-da/chat  EvaDAChatPage, EvaDATranslator
  jr_user              assistant-face    /portal/eva-da/chat  All 7 EVA DA screens
  jr_admin             ops-face          /admin/ingestion/runs  IngestionRunsPage,
                                                               SearchHealthPage,
                                                               AuditLogsPage (read-only)
  developer            ops-face          /portal/ado          ADOCommandCenterPage,
                                                               DataModelExplorer,
                                                               RedTeamingPage, DevBench
  admin                ops-face          /admin/rbac/users    ALL admin + DevOps screens
  eva_admin            ops-face          /admin/rbac/users    ALL + ActAsPage,
                                                               FeatureFlagsPage
  sr_developer         ops-face          /portal/data-model   DataModelExplorer +
                                                               all dev screens
  support_agent        ops-face          /admin/support/tickets  SupportTickets +
                                                               read-only audit
  auditor              ops-face          /admin/audit/logs    Both audit lanes (read-only)
  red_teamer           ops-face          /portal/red-teaming  RedTeamingPage, AuditLogs

  Cross-portal note:
    PersonaLoginPage and PersonaExperienceDashboard (assistant-face) issue
    persona-scoped tokens. The token determines which portal the user lands on.
    Ops personas are redirected to the ops-face SWA. Others stay on assistant-face.

--------------------------------------------------------------------------------
 TOTAL SCREEN COUNT
--------------------------------------------------------------------------------

  ASSISTANT-FACE (20 screens -- SWA #1: eva-faces/assistant)
  -----------------------------------------------------------
  Auth/Entry layer       2   PersonaLoginPage, PersonaExperienceDashboard
  EVA DA Suite           7   EvaDAChatPage + 6 supporting screens
  JP Spark Suite         8   JpSparkLayout + 7 JP screens
  General AI Hub         3   EVAHomePage, ChatPane, AssistMePage
  -----------------------  --
  Subtotal              20

  OPS-FACE (26 screens -- SWA #2: eva-faces/ops)
  ------------------------------------------------
  Admin (pre-existing)  10   TranslationsPage, SettingsPage, AppsPage,
                             AuditLogsPage, RbacPage, RbacRolesPage,
                             IngestionRunsPage, SearchHealthPage,
                             SupportTicketsPage, FeatureFlagsPage
  Admin (Feb 24 new)     5   A11yThemesPage, AdminI18nByScreenPage,
                             SystemLogsPage, RbacResponsibilitiesPage, ActAsPage
  DevOps/Platform        3   SprintBoardPage, FinOpsDashboardPage,
                             DevopsHealthDashboardPage
  Dev Tools              3   ADOCommandCenterPage, DataModelExplorerPage,
                             RedTeamingPage
  DevBench               5   DevbenchReviewDemo + 4 DevBench screens
  -----------------------  --
  Subtotal              26

  TOTAL                 46   (face field set in Cosmos on all 46)
  (45-aicoe-page: 2 screens are public-page, outside both portals)

================================================================================
