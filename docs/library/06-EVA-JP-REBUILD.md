================================================================================
 EVA-JP-v1.2 FRONTEND REBUILD
 File: docs/library/06-EVA-JP-REBUILD.md
 Updated: 2026-02-24
 Source: C:\AICOE\EVA-JP-v1.2 (production app being migrated)
================================================================================

THE CRITICAL CONTEXT
--------------------
EVA-JP-v1.2 is the EXISTING PRODUCTION APPLICATION being rebuilt.
It is the primary reason the whole EVA platform exists.

It is NOT a side project.
It IS the live bilingual jurisprudence AI assistant that case workers and
legal staff use to query Employment Insurance, CPP, and OAS case law.

The rebuild is NOT a from-scratch rewrite.
It IS an in-place Fluent UI v8 -> v9 migration + WCAG 2.1 AA + i18n hardening.

The 44-eva-jp-spark project is the FUTURE evolution (portal-integrated).
EVA-JP-v1.2 is the CURRENT RUNNING VERSION being brought up to standard.

These two tracks run in PARALLEL:
  Track A: EVA-JP-v1.2 rebuild (this file)  -- upgrade the existing app
  Track B: 44-eva-jp-spark                   -- build the next-gen version

--------------------------------------------------------------------------------
 WHAT EVA-JP-v1.2 IS
--------------------------------------------------------------------------------

  Type:       Bilingual AI assistant web app (EN/FR, GC federal government)
  Domain:     Jurisprudence -- Employment Insurance, CPP, OAS case law
  Users:      Case workers, legal staff, HR professionals (ESDC)
  Backend:    FastAPI (app/backend/) + Azure Functions (functions/)
  RAG corpus: JP decisions indexed in Azure AI Search (vector + semantic)
  Auth:       Azure AD (Entra ID) -- group-based RBAC
  Repo:       C:\AICOE\EVA-JP-v1.2
  Base:       Forked from microsoft/PubSec-Info-Assistant (heavily customized)

  ROUTES (HashRouter)
  -------------------
  /              Chat screen       all users
  /content       Manage Content    admin | contributor (upload, scrape, status)
  /translator    Translator        admin | contributor (file translation EN<->FR)
  /urlscrapper   URL Scraper       admin | contributor (web corpus ingestion)
  /tda           Tabular Data Asst all users (feature_flag: ENABLE_TDA)
  /tutor         Math Tutor        all users (feature_flag: ENABLE_MATH)
  /*             404 No Page       all

  ROLES (from Azure AD group membership)
  ---------------------------------------
  reader        Read-only: Chat, TDA, Tutor
  contributor   + Content, Translator, URL Scraper
  admin         + Examples editing, advanced settings
  owner         + all admin capabilities

--------------------------------------------------------------------------------
 REBUILD SPECIFICATION
--------------------------------------------------------------------------------

  PRD:          C:\AICOE\EVA-JP-v1.2\PRD-REBUILD-FLUENT-V9.md
  Spec JSON:    C:\AICOE\EVA-JP-v1.2\eva-jp-rebuild-spec.json   (631 lines)
  Version:      1.0 -- February 22, 2026

  TECHNOLOGY TARGETS
  ------------------
  Remove:       @fluentui/react (v8) -- ZERO imports allowed after rebuild
  Keep:         @fluentui/react-components (v9, ^9.72)
  Keep:         @fluentui/react-icons (^2.0)
  Keep:         i18next ^25, react-i18next ^16
  Keep:         react-router-dom ^6.8 (HashRouter)
  Keep:         react ^18.2, vite, TypeScript strict
  CSS:          makeStyles + mergeClasses ONLY -- no raw .module.css except layout
  Colors:       tokens.* ONLY -- zero hardcoded hex
  High contrast: @media (forced-colors: active) block in EVERY makeStyles that
                 uses color or bg (keywords: Canvas, CanvasText, Highlight, etc.)

  ACCESSIBILITY TARGETS (ALL must pass)
  --------------------------------------
  Standard:     WCAG 2.1 AA
  Focus ring:   3px solid tokens.colorStrokeFocus2, offset 2px on ALL elements
  Skip link:    Visible-on-focus "Skip to main content" -> #mainContent
  Live regions: polite for loading/success/transitions; assertive for fatal errors
  Focus trap:   All Modal/Dialog/Drawer trap focus; Escape closes, focus returns
  Landmarks:    role=banner (header), id=mainContent role=main tabIndex=-1,
                aria-label on nav, role=contentinfo (footer)
  Chat log:     role="log" aria-live="polite" on message list
  Route change: update document.title, announce page name, focus first h2
                in #mainContent after 150ms
  html lang:    document.documentElement.lang = active i18n locale

  I18N TARGETS
  ------------
  Languages:    EN + FR (both required, no placeholder FR values)
  Detection:    navigator.language on first visit
  Hook:         useTranslation() -- zero string literals in JSX
  Locale files: src/i18n/locales/en/resources_en.json
                src/i18n/locales/fr/resources_fr.json
  Lang attr:    Updated on i18n.on('languageChanged')

--------------------------------------------------------------------------------
 REBUILD STATE (as of 2026-02-24 scan)
--------------------------------------------------------------------------------

  SCREENS
  -----------------------------------------------------------------------
  Screen          File            v8 imports   v9 imports   Status
  --------------- --------------- -----------  -----------  ---------------
  Layout shell    Layout.tsx      0            1            DONE (v9 clean)
  Manage Content  Content.tsx     0            2            DONE (v9 clean)
  Math Tutor      Tutor.tsx       0            2            DONE (v9 clean)
  Main Chat       Chat.tsx        1            3            IN PROGRESS
  Tabular Data    Tda.tsx         1            2            IN PROGRESS
  Translator      Translator.tsx  1            2            IN PROGRESS
  URL Scraper     Urlscrapper.tsx 2            2            IN PROGRESS
  404 No Page     NoPage.tsx      0            0            TODO (no Fluent)
  -----------------------------------------------------------------------
  3 of 8 screens DONE.   4 of 8 IN PROGRESS.   1 TODO.

  Chat.tsx is the most complex and most important screen (main RAG UI).
  It is the BLOCKER for declaring the rebuild "done enough to demo".

  SHARED COMPONENTS
  -----------------------------------------------------------------------
  Component                 Status
  ------------------------- --------------
  QuestionInput             v9 CLEAN
  UserChatMessage           v9 CLEAN
  ClearChatButton           v9 CLEAN
  ChatHistory               v9 CLEAN
  ChatHistoryDrawerTrigger  v9 CLEAN
  SettingsButton            v9 CLEAN
  SettingsIconButton        v9 CLEAN
  InfoButton                v9 CLEAN
  RAIPanel                  v9 CLEAN
  CreateFolderDialog        v9 CLEAN
  AnswerIcon                v9 CLEAN
  file-picker               v9 CLEAN     (TDA upload zone)
  -----------------------------------------------------------------------
  Answer.tsx                MIX/v8       CRITICAL -- renders every response
  AnalysisPanel.tsx         MIX/v8       Side panel for citation detail
  TagPicker.tsx             MIX/v8       Corpus filter
  FolderPicker.tsx          MIX/v8       Corpus filter
  FileStatus.tsx            MIX/v8       Upload status DataGrid
  AnswerError.tsx           MIX/v8       Error state
  AnswerLoading.tsx         MIX/v8       Loading state
  ResponseLengthButtonGroup MIX/v8       Settings drawer
  ResponseTempButtonGroup   MIX/v8       Settings drawer
  ApproachesButtonGroup     MIX/v8       Settings drawer
  InfoContent.tsx           MIX/v8       Settings info tab
  StatusContent.tsx         MIX/v8
  FeedbackModal.tsx         MIX/v8
  DocumentsDetailList.tsx   MIX/v8
  DownloadPreviewContent.tsx MIX/v8
  -----------------------------------------------------------------------
  CharacterStreamer          NONE (no Fluent, streams text, leave as-is)
  ExampleList / Example     NONE (chips, may need Fluent v9 tokens)
  AnnouncerProvider         NONE (a11y live region, pure DOM)
  ChatModeButtonGroup       NONE (may already be v9 -- check)
  WarningBanner             NONE (should use v9 MessageBar)
  ApplicationContext        NONE (React context, no UI)

--------------------------------------------------------------------------------
 REBUILD PHASES (from PRD-REBUILD-FLUENT-V9.md)
--------------------------------------------------------------------------------

  PHASE 1 -- Foundation (do first, once)
  ----------------------------------------
  1. Remove all @fluentui/react (v8) imports from the codebase
  2. Create src/theme.ts -- export webLightTheme (+ webDarkTheme optional)
  3. Verify FluentProvider in src/index.tsx consumes the theme
  4. Verify src/i18n/i18n.tsx uses navigator.language detection
  5. Add all spec-defined i18n keys to resources_en.json + resources_fr.json
     (FR values must be real translations, not placeholders)
  6. Verify AnnouncerProvider renders:
     role="status" aria-live="polite" aria-atomic="true" visually-hidden div

  PHASE 2 -- Shared Components (in spec order)
  ---------------------------------------------
  Build/migrate in the order given in implementation_phases.phase_2_components_order
  in eva-jp-rebuild-spec.json. Each component entry defines:
    - props interface
    - Fluent v9 primitives to use
    - keyboard behavior
    - ARIA requirements

  Key patterns across all components:
    Toggle button groups   -- role="radiogroup", each button role="radio" + aria-checked
    Drawers                -- store trigger ref, return focus on close
    CharacterStreamer       -- aria-live="polite" on output container
    QuestionInput          -- Enter=submit, Shift+Enter=newline, disabled when empty

  PHASE 3 -- Screens (in spec order)
  ------------------------------------
  Build order: Layout -> Chat -> Content -> Translator -> Urlscrapper -> TDA -> Tutor -> 404
  For each screen:
    1. Read spec entry (layout, i18n_keys, rbac, acceptance_criteria)
    2. Stub file (section + heading)
    3. Wire i18n (useTranslation, all strings)
    4. Build layout (v9 only)
    5. Wire interactivity (state, API, useAnnouncer)
    6. Add ARIA attributes
    7. Gate RBAC
    8. Fix focus management (dialogs, drawers, page nav)
    9. Check acceptance_criteria[] in spec

  Per-screen ARIA notes:
    Chat.tsx
      - role="log" aria-live="polite" on message thread div
      - SettingsDrawer: focus trap, return focus to settings button on close
      - Error MessageBar: aria-live="assertive"
      - Route change: focus first h2 in #mainContent after 150ms
    Translator.tsx
      - Comboboxes: @media (forced-colors) styles required
      - Loading state: push announcement via useAnnouncer()
    Urlscrapper.tsx
      - Preview Dialog: focus trap, paginated checkboxes with aria-label per URL
      - "Selected: N links" live region updates as selections change
      - Double-confirm dialog if exceeding effectiveMaxLinks
    Tda.tsx
      - Drop zone: visually-hidden <input type="file"> + label as visible target
      - aria-describedby for max file size hint
      - img elements: alt from t("Generated chart")

--------------------------------------------------------------------------------
 CRITICAL COMPONENT: Chat.tsx
--------------------------------------------------------------------------------

The chat screen is the main user-facing screen and the most complex.
It blocks the rebuild from being demoed end-to-end.

Key architectural elements:
  - Three zones: top bar (history, clear, settings), chat area, bottom bar
  - Chat area: ExampleList (empty state) OR message log (conversation)
  - Message log: role="log" aria-live="polite"
  - Auto-scroll: div ref at bottom of message list
  - Settings drawer: TabList (Info / Adjust / Examples), right-side overlay
  - Bottom bar: FolderPicker + TagPicker row, QuestionInput, ChatModeButtonGroup
  - Session management: createNewSession() on mount + clear; ID in state + ref
  - Streaming: ReadableStream -> Answer -> CharacterStreamer
  - Error state: MessageBar intent="error" + assertive announcement
  - Analysis panel: replaces right portion of layout (not an overlay)
  - Feature flags: TDA and Tutor nav items gated by getFeatureFlags() on init
  - RBAC: Examples tab in settings only for owner or admin role

Blocking dependencies (must be v9 clean before Chat can be done):
  Answer.tsx         -- every AI response
  AnalysisPanel.tsx  -- citation detail side panel
  FolderPicker.tsx   -- corpus scope filter
  TagPicker.tsx      -- corpus tag filter
  AnswerError.tsx    -- inline error
  AnswerLoading.tsx  -- streaning loading indicator
  ResponseLengthButtonGroup, ResponseTempButtonGroup, ApproachesButtonGroup
  InfoContent.tsx    -- settings info tab

--------------------------------------------------------------------------------
 RELATIONSHIP TO 44-EVA-JP-SPARK
--------------------------------------------------------------------------------

  EVA-JP-v1.2 (this file)          44-eva-jp-spark
  -------------------------------- ----------------------------------------
  Existing production app          Future portal-integrated version
  Standalone SWA / ACA             Embedded within EVA portal (31-eva-faces)
  HashRouter (/#/...)              React Router + portal shell
  Azure AD auth inline             Shared Entra session from PersonaLoginPage
  8 screens, corpus-specific       8 screens + portal nav + persona context
  Fluent UI v9 (migration)         Fluent UI v9 + GC Design System (greenfield)
  Current year delivery priority   Phase 3 of 31-eva-faces roadmap
  jp-spark corpus (JP decisions)   Same corpus via shared brain-v2 RAG route
  Deployed: EVA-JP-v1.2 ACA       Deployed: portal-face ACA (same as admin)

  When EVA-JP-v1.2 rebuild completes, its architecture becomes the spec
  that 44-eva-jp-spark inherits. They share the same backend routes.
  The rebuild is not just maintenance -- it IS the reference implementation.

--------------------------------------------------------------------------------
 PENDING WORK (priority order)
--------------------------------------------------------------------------------

  PRIORITY 1 -- UNBLOCK CHAT DEMO
  1. Migrate Answer.tsx        (every response renders through this)
  2. Migrate AnalysisPanel.tsx (citation detail)
  3. Migrate AnswerError.tsx + AnswerLoading.tsx
  4. Complete Chat.tsx migration (remove last v8 import)

  PRIORITY 2 -- COMPLETE SCREENS
  5. Complete Translator.tsx
  6. Complete Tda.tsx
  7. Complete Urlscrapper.tsx
  8. Build NoPage.tsx (simple, use v9 Text + Link)

  PRIORITY 3 -- COMPLETE COMPONENTS
  9.  Migrate ResponseLengthButtonGroup + ResponseTempButtonGroup
  10. Migrate ApproachesButtonGroup
  11. Migrate FolderPicker + TagPicker
  12. Migrate FileStatus (DataGrid)
  13. Migrate InfoContent, StatusContent, FeedbackModal
  14. Migrate DownloadPreviewContent, DocumentsDetailList

  PRIORITY 4 -- VALIDATE
  15. Run jest-axe on all 8 screens (WCAG 2.1 AA gate)
  16. Verify resources_fr.json has real FR values (not placeholder copies)
  17. Verify document.documentElement.lang updates on language toggle
  18. Verify focus returns to trigger after every drawer/dialog close
  19. Remove @fluentui/react from package.json dependencies
  20. Run: npm run build -- must exit 0 with zero TypeScript errors

--------------------------------------------------------------------------------
 HOW TO START A REBUILD SESSION
--------------------------------------------------------------------------------

  1. Read PRD-REBUILD-FLUENT-V9.md for ground rules (5 min)
  2. Read eva-jp-rebuild-spec.json for the component/screen you are working on
  3. Check the status table above to pick the right target
  4. Run: cd C:\AICOE\EVA-JP-v1.2\app\frontend && npm run dev
     (hot-reload server -- vite)
  5. Focus on ONE component or ONE screen per session
  6. After each file: grep for @fluentui/react[^-] -- must return 0 matches
  7. Update status table in this file when a component/screen reaches DONE

  Start API (backend):
    cd C:\AICOE\EVA-JP-v1.2
    C:\AICOE\.venv\Scripts\python -m uvicorn app.backend.main:app --port 5000

================================================================================
