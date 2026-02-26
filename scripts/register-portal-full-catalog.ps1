# register-portal-full-catalog.ps1
# Full EVA Portal screen + backend endpoint catalog — Feb 24, 2026
#
# Registers:
#   19 new screens (portal-face EVA-DA x7, login/persona, project embeds x4,
#                   admin-face a11y/i18n-by-screen/system-logs/rbac-resp/act-as)
#   35 new backend endpoints across:
#       auth (login, logout, me, persona select)
#       eva-da (chat, rag-modes, data, search, analysis, knowledge, feedback, translate)
#       a11y themes admin
#       rbac (responsibilities, act-as)
#       system logs (second audit lane)
#       translations by-screen + import
#       red-teaming
#
# Run from: C:\AICOE\eva-foundation\37-data-model
# Usage: .\scripts\register-portal-full-catalog.ps1

param(
    [string]$Base = "http://localhost:8010",
    [string]$AdminToken = "dev-admin"
)

$h    = @{ "Content-Type" = "application/json"; "X-Actor" = "agent:copilot" }
$hadm = @{ "Authorization" = "Bearer $AdminToken"; "Content-Type" = "application/json" }

$ok   = 0
$fail = 0

function Put-Obj {
    param([string]$Layer, [string]$Id, [hashtable]$Body)
    $url  = "$Base/model/$Layer/$Id"
    $json = $Body | ConvertTo-Json -Depth 8
    try {
        $r   = Invoke-WebRequest $url -Method PUT -Body $json -Headers $h -UseBasicParsing -TimeoutSec 15
        $obj = $r.Content | ConvertFrom-Json
        $script:ok++
        "[OK]  $Layer/$Id  rv=$($obj.row_version)"
    } catch {
        $script:fail++
        "[FAIL] $Layer/$Id  $_"
    }
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " EVA Portal — Full Screen + Backend Catalog Registration" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — PORTAL SCREENS: Login + Persona Selection
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "[INFO] Section 1: Login + Persona Selection" -ForegroundColor Yellow

Put-Obj "screens" "PersonaLoginPage" @{
    id            = "PersonaLoginPage"
    label         = "Login — Select Your EVA Experience"
    app           = "portal-face"
    project       = "31-eva-faces"
    route         = "/login"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("public")
    api_calls     = @("GET /v1/auth/personas", "POST /v1/auth/login", "POST /v1/auth/persona/select")
    components    = @("PersonaCard", "PersonaGrid", "EvaButton", "EvaSpinner", "LanguageToggle")
    hooks         = @("usePersonaSelection", "useAuth")
    notes         = "Entry point for all EVA users. Shows available personas (jp_user, jr_admin, developer, auditor, citizen, etc.) as cards. Selecting a persona personalises the navigation layout, feature flags, and default route. Supports EN/FR language toggle. MFA redirect handled here. WCAG 2.1 AA. Phase 3."
}

Put-Obj "screens" "PersonaExperienceDashboard" @{
    id            = "PersonaExperienceDashboard"
    label         = "My EVA — Personalised Home"
    app           = "portal-face"
    project       = "31-eva-faces"
    route         = "/my-eva"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("viewer")
    api_calls     = @("GET /v1/auth/me", "GET /v1/auth/personas", "GET /v1/config/features")
    components    = @("NavHeader", "PersonaSwitcher", "PersonalisedTileGrid")
    hooks         = @("useAuth", "usePersonaSelection", "useFeatureFlags")
    notes         = "Post-login landing page. Adapts tile grid, navigation menu, and quick-actions based on active persona. Includes persona switcher chip in header. Persona preference persisted via PATCH /v1/auth/persona/select."
}

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — PORTAL SCREENS: EVA DA Chat (7 screens, a11y + i18n)
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "[INFO] Section 2: EVA DA Chat (7 screens)" -ForegroundColor Yellow

Put-Obj "screens" "EvaDAChatPage" @{
    id            = "EvaDAChatPage"
    label         = "EVA DA — Chat"
    app           = "portal-face"
    project       = "31-eva-faces"
    route         = "/portal/eva-da/chat"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("viewer", "jr_user", "jp_user")
    api_calls     = @(
        "POST /v1/eva-da/chat",
        "GET /v1/eva-da/rag-modes",
        "GET /v1/sessions",
        "POST /v1/sessions",
        "GET /v1/sessions/{session_id}",
        "DELETE /v1/sessions/{session_id}",
        "POST /api/feedback"
    )
    components    = @(
        "QuestionInput", "Answer", "CharacterStreamer",
        "AnalysisPanel", "ChatHistory", "ExampleList",
        "UserChatMessage", "SupportingContent",
        "RagModePicker", "ResponseLengthButtonGroup",
        "ChatModeButtonGroup", "FolderPicker", "TagPicker",
        "WarningBanner", "RAIPanel", "EvaSpinner", "EvaButton"
    )
    hooks         = @("useChatSession", "useRagMode", "useTranslations", "useFeatureFlags", "useAnnouncer")
    notes         = "Full EVA DA chat with all RAG modes: semantic, keyword, hybrid, re-ranked, multi-hop. Mode picker surfaced as segmented control. Streaming responses via SSE. Chat history sidebar (session list + delete). Citation panel. Feedback thumbs-up/down. Full WCAG 2.1 AA: role=log, live=polite, focus management. EN/FR i18n. Phase 3 — wiring: POST /v1/eva-da/chat replaces jp-spark /api/conversation."
}

Put-Obj "screens" "EvaDADataLoadPage" @{
    id            = "EvaDADataLoadPage"
    label         = "EVA DA — Data Loading"
    app           = "portal-face"
    project       = "31-eva-faces"
    route         = "/portal/eva-da/data"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("contributor", "jr_admin", "admin")
    api_calls     = @(
        "POST /v1/eva-da/data/upload",
        "GET /v1/eva-da/data/folders",
        "POST /v1/eva-da/data/folders",
        "GET /v1/eva-da/data/tags",
        "GET /v1/eva-da/data/status",
        "POST /v1/eva-da/data/url-scrape",
        "GET /v1/admin/ingestion/runs",
        "PATCH /v1/admin/ingestion/runs/{runId}"
    )
    components    = @("FilePicker", "FileStatus", "FolderPicker", "TagPicker", "UrlScrapePanel", "IngestionStatusTable", "WarningBanner")
    hooks         = @("useDataUpload", "useFolders", "useTags", "useIngestionStatus", "useAnnouncer")
    notes         = "Unified data loading screen: drag-and-drop file upload, folder/tag assignment, URL scrape (preview + submit), ingestion run status table with cancel guard. Consolidates jp-spark /content + /urlscrapper into portal route. WCAG 2.1 AA. EN/FR. Phase 3."
}

Put-Obj "screens" "EvaDASearchPage" @{
    id            = "EvaDASearchPage"
    label         = "EVA DA — Search"
    app           = "portal-face"
    project       = "31-eva-faces"
    route         = "/portal/eva-da/search"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("viewer", "jr_user", "jp_user")
    api_calls     = @(
        "POST /v1/search/saved",
        "GET /v1/search/saved",
        "DELETE /v1/search/saved/{search_id}",
        "GET /v1/search/history"
    )
    components    = @("SearchInput", "SearchResultList", "SavedSearchChips", "SearchHistoryPanel")
    hooks         = @("useSavedSearches", "useSearchHistory", "useTranslations")
    notes         = "Keyword + semantic search with saved searches and browse history. Results show document excerpts with citations. Filter by folder/tag/date. WCAG 2.1 AA. EN/FR. Phase 3."
}

Put-Obj "screens" "EvaDAAnalysisPage" @{
    id            = "EvaDAAnalysisPage"
    label         = "EVA DA — Tabular Data Analysis"
    app           = "portal-face"
    project       = "31-eva-faces"
    route         = "/portal/eva-da/analysis"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("viewer", "jr_user", "jp_user")
    api_calls     = @(
        "POST /v1/eva-da/analysis",
        "GET /v1/eva-da/analysis/images",
        "GET /v1/eva-da/analysis/output",
        "GET /v1/eva-da/analysis/maxfilesize"
    )
    components    = @("FilePicker", "ExampleList", "CharacterStreamer", "WarningBanner", "RAIPanel", "ChartPreview")
    hooks         = @("useAnalysis", "useAnnouncer", "useFeatureFlags")
    notes         = "CSV/Excel tabular data analysis via LLM. Upload file, pose questions, get back streamed narrative + chart images. Mirrors jp-spark /tda but hosted in portal. WCAG 2.1 AA. EN/FR. Phase 3."
}

Put-Obj "screens" "EvaDAKnowledgePage" @{
    id            = "EvaDAKnowledgePage"
    label         = "EVA DA — Knowledge Base"
    app           = "portal-face"
    project       = "31-eva-faces"
    route         = "/portal/eva-da/knowledge"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("viewer", "jr_user", "jp_user")
    api_calls     = @(
        "GET /v1/eva-da/knowledge",
        "GET /v1/tags",
        "GET /v1/tags/{tag_name}/documents"
    )
    components    = @("KnowledgeTreeView", "DocumentCard", "TagPicker", "FolderPicker")
    hooks         = @("useKnowledge", "useTags", "useTranslations")
    notes         = "Browse the ingested knowledge base: folder tree, tag-based facets, document cards with metadata (source, ingestion date, chunk count). Read-only. WCAG 2.1 AA. EN/FR. Phase 3."
}

Put-Obj "screens" "EvaDAFeedbackPage" @{
    id            = "EvaDAFeedbackPage"
    label         = "EVA DA — Feedback History"
    app           = "portal-face"
    project       = "31-eva-faces"
    route         = "/portal/eva-da/feedback"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("jr_admin", "admin", "auditor")
    api_calls     = @(
        "GET /v1/eva-da/feedback",
        "POST /api/feedback",
        "GET /v1/eva-da/feedback/export"
    )
    components    = @("FeedbackTable", "RatingBadge", "EvaButton", "ExportButton")
    hooks         = @("useFeedback", "useTranslations")
    notes         = "Admin view of all collected thumbs-up/down + text feedback from chat sessions. Filter by date/rating/session. CSV export. Used by AI governance (19-ai-gov) review cycle. WCAG 2.1 AA. EN/FR. Phase 3."
}

Put-Obj "screens" "EvaDATranslatorPage" @{
    id            = "EvaDATranslatorPage"
    label         = "EVA DA — Document Translator"
    app           = "portal-face"
    project       = "31-eva-faces"
    route         = "/portal/eva-da/translator"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("contributor", "jr_admin", "admin")
    api_calls     = @(
        "GET /v1/eva-da/data/folders",
        "POST /v1/eva-da/translate"
    )
    components    = @("FilePicker", "FolderPicker", "TranslationStatusPanel", "WarningBanner")
    hooks         = @("useFolders", "useTranslation", "useAnnouncer")
    notes         = "Upload document → select target language → translate and write back to folder. Mirrors jp-spark /translator but hosted in portal. WCAG 2.1 AA. EN/FR. Phase 3."
}

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — PORTAL SCREENS: Project Embeds
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "[INFO] Section 3: Portal project embed screens" -ForegroundColor Yellow

Put-Obj "screens" "ADOCommandCenterPage" @{
    id            = "ADOCommandCenterPage"
    label         = "ADO Command Center"
    app           = "portal-face"
    project       = "38-ado-poc"
    route         = "/portal/ado"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("developer", "jr_admin", "admin")
    api_calls     = @("GET /v1/scrum/summary", "GET /v1/scrum/dashboard", "GET /v1/scrum/sprints", "GET /v1/scrum/pbis")
    components    = @("SprintSelector", "ProjectFilterBar", "FeatureSection", "WICard", "VelocityPanel")
    hooks         = @("useScrumData", "useTranslations")
    notes         = "Portal-face route embedding the ADO Dashboard (38-ado-poc / 39-ado-dashboard). Sprint selector, project/WI filter, velocity chart. Persona-aware: developer sees own WIs first; admin sees cross-project view. Phase 3."
}

Put-Obj "screens" "DataModelExplorerPage" @{
    id            = "DataModelExplorerPage"
    label         = "EVA Data Model Explorer"
    app           = "portal-face"
    project       = "37-data-model"
    route         = "/portal/data-model"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("developer", "jr_admin", "admin")
    api_calls     = @("GET /model/services/", "GET /model/graph/", "GET /model/services/{id}", "GET /model/impact/")
    components    = @("ModelLayerBrowser", "GraphVisualizerEmbed", "ImpactTreePanel")
    hooks         = @("useModelExplorer", "useTranslations")
    notes         = "Portal-face route that embeds the model-explorer-ui and model-graph-explorer from 37-data-model. Reads from the live ACA model-api (https://marco-eva-data-model.*). Developer + admin visible. Phase 3."
}

Put-Obj "screens" "RedTeamingPage" @{
    id            = "RedTeamingPage"
    label         = "Red Teaming Dashboard"
    app           = "portal-face"
    project       = "36-red-teaming"
    route         = "/portal/red-teaming"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("jr_admin", "admin")
    api_calls     = @("GET /v1/redteam/results", "POST /v1/redteam/run", "GET /v1/redteam/runs", "GET /v1/redteam/config")
    components    = @("TestRunTable", "VulnerabilityBadge", "RunDetailDrawer", "EvaButton")
    hooks         = @("useRedTeamRuns", "useTranslations")
    notes         = "Promptfoo adversarial test results surfaced in portal. Trigger a red-team run, view per-prompt pass/fail, vulnerability categories (OWASP LLM Top 10), export report. Admin-only. Phase 4."
}

Put-Obj "screens" "AssistMePage" @{
    id            = "AssistMePage"
    label         = "AssistMe — Citizen AI Assistant"
    app           = "portal-face"
    project       = "20-assistme"
    route         = "/portal/assistme"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("viewer", "citizen")
    api_calls     = @("POST /v1/assistme/chat", "GET /v1/assistme/topics", "POST /v1/assistme/feedback")
    components    = @("AssistMeChatPane", "TopicCards", "FeedbackPanel", "WarningBanner")
    hooks         = @("useAssistMe", "useTranslations", "useAnnouncer")
    notes         = "Citizen-facing AI knowledge management assistant (20-assistme) embedded in portal. Topic-card entry plus free-form chat. Bilingual. No auth required for citizen persona. WCAG 2.1 AA. Phase 3."
}

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — ADMIN SCREENS: A11y, i18n-by-screen, Logging, RBAC additions
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "[INFO] Section 4: Admin screens (a11y, i18n by screen, logs, rbac)" -ForegroundColor Yellow

Put-Obj "screens" "A11yThemesPage" @{
    id            = "A11yThemesPage"
    label         = "Accessibility Themes"
    app           = "admin-face"
    project       = "31-eva-faces"
    route         = "/admin/a11y/themes"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("action.admin.manage_settings")
    api_calls     = @(
        "GET /v1/admin/a11y/themes",
        "POST /v1/admin/a11y/themes",
        "PATCH /v1/admin/a11y/themes/{id}",
        "DELETE /v1/admin/a11y/themes/{id}",
        "GET /v1/admin/a11y/themes/active"
    )
    components    = @("AdminListPage", "EvaButton", "EvaBadge", "EvaDialog", "ThemePreviewCard")
    hooks         = @("useA11yThemesData", "useTranslations")
    notes         = "Create and manage named accessibility themes: high-contrast, large-text, reduced-motion, forced-colours. Preview live. Each theme maps to a Fluent UI token set + GC Design System overrides. Active theme applies system-wide. WCAG 2.1 AA (including the editor itself). Phase 3."
}

Put-Obj "screens" "AdminI18nByScreenPage" @{
    id            = "AdminI18nByScreenPage"
    label         = "i18n Literals — By Screen"
    app           = "admin-face"
    project       = "31-eva-faces"
    route         = "/admin/i18n/by-screen"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("action.admin.manage_translations")
    api_calls     = @(
        "GET /v1/config/translations/{language}",
        "GET /v1/config/translations/by-screen/{screenId}",
        "PATCH /v1/config/translations/{language}",
        "POST /v1/config/translations/import",
        "GET /v1/config/translations/export"
    )
    components    = @("ScreenSelector", "LiteralTable", "InlineEditCell", "ImportExportBar", "EvaButton", "EvaBadge")
    hooks         = @("useTranslationsByScreen", "useTranslations")
    notes         = "Companion to TranslationsPage — groups all literals by screen ID so a translator can focus on one screen at a time. Screen selector dropdown, filter by EN/FR coverage gap. Inline edit, bulk CSV import/export. Clicking a screen name jumps to its live route in a side-by-side preview panel. Phase 3."
}

Put-Obj "screens" "SystemLogsPage" @{
    id            = "SystemLogsPage"
    label         = "System Logs"
    app           = "admin-face"
    project       = "31-eva-faces"
    route         = "/admin/audit/system"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("action.admin.view_audit_logs", "auditor")
    api_calls     = @("GET /v1/logs/system", "GET /v1/logs/system/export")
    components    = @("AdminListPage", "LogLevelBadge", "EvaButton", "ExportButton")
    hooks         = @("useSystemLogsData", "useTranslations")
    notes         = "Second logging lane: application/structural logs (INFO/WARN/ERROR/FATAL) vs AuditLogsPage which holds PIPEDA-scoped user-action audit trail. Filter by level, service, time range. Export to CSV/JSONL. Read-only. Auditor + admin roles. WCAG 2.1 AA. Phase 3."
}

Put-Obj "screens" "RbacResponsibilitiesPage" @{
    id            = "RbacResponsibilitiesPage"
    label         = "Roles and Responsibilities"
    app           = "admin-face"
    project       = "31-eva-faces"
    route         = "/admin/rbac/responsibilities"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("action.admin.manage_roles")
    api_calls     = @("GET /v1/rbac/roles", "GET /v1/rbac/responsibilities")
    components    = @("ResponsibilityMatrix", "RoleLegend", "EvaBadge")
    hooks         = @("useRbacMatrix", "useTranslations")
    notes         = "RACI-style matrix view: roles on columns, responsibilities/actions on rows. Colour-coded cells (R/A/C/I). Printable. Read-only admin view driven by the roles + responsibilities model. Feeds onboarding docs. Phase 3."
}

Put-Obj "screens" "ActAsPage" @{
    id            = "ActAsPage"
    label         = "Act As — Elevated Operations"
    app           = "admin-face"
    project       = "31-eva-faces"
    route         = "/admin/rbac/act-as"
    status        = "planned"
    a11y          = "wcag-2.1-aa"
    i18n_system   = "react-i18next"
    rbac          = @("action.admin.manage_users")
    api_calls     = @(
        "GET /v1/rbac/assignments",
        "POST /v1/rbac/act-as",
        "DELETE /v1/rbac/act-as",
        "GET /v1/auth/me"
    )
    components    = @("UserSearchInput", "RoleSelector", "SessionBanner", "EvaButton", "EvaDialog")
    hooks         = @("useActAs", "useAuth", "useTranslations")
    notes         = "Allows admin or support role to temporarily 'Act As' another user or persona for troubleshooting, demo, and elevated workflows. Active session shown as persistent orange banner. Ends on explicit 'End Act-As' action or tab close. All actions during Act-As session are audit-logged with both real identity and assumed identity. PIPEDA safeguard: time-boxed (configurable, default 30 min). Phase 3."
}

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5 — BACKEND ENDPOINTS (eva-brain-v2 / eva-roles-api scope)
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "[INFO] Section 5: Auth + Persona endpoints" -ForegroundColor Yellow

Put-Obj "endpoints" "GET /v1/auth/me" @{
    id = "GET /v1/auth/me"; method = "GET"; path = "/v1/auth/me"
    service = "eva-brain-api"; status = "planned"
    description = "Return current authenticated user identity, active persona, assigned roles, and feature flags."
    response_schema = "AuthMeResponse"; auth_required = $true
}
Put-Obj "endpoints" "GET /v1/auth/personas" @{
    id = "GET /v1/auth/personas"; method = "GET"; path = "/v1/auth/personas"
    service = "eva-brain-api"; status = "planned"
    description = "List all available personas the current user may select from at login. Filtered by role membership."
    response_schema = "PersonaListResponse"; auth_required = $false
}
Put-Obj "endpoints" "POST /v1/auth/login" @{
    id = "POST /v1/auth/login"; method = "POST"; path = "/v1/auth/login"
    service = "eva-brain-api"; status = "planned"
    description = "Initiate EVA login. Returns MSAL redirect URL or token if already authenticated via Entra ID."
    request_schema = "LoginRequest"; response_schema = "LoginResponse"; auth_required = $false
}
Put-Obj "endpoints" "POST /v1/auth/logout" @{
    id = "POST /v1/auth/logout"; method = "POST"; path = "/v1/auth/logout"
    service = "eva-brain-api"; status = "planned"
    description = "Terminate the current EVA session and clear persona selection."
    auth_required = $true
}
Put-Obj "endpoints" "POST /v1/auth/persona/select" @{
    id = "POST /v1/auth/persona/select"; method = "POST"; path = "/v1/auth/persona/select"
    service = "eva-brain-api"; status = "planned"
    description = "Set or update the active persona for the current session. Persists preference. Affects navigation layout, feature flags, and default route returned to the portal."
    request_schema = "PersonaSelectRequest"; auth_required = $true
}

Write-Host "[INFO] Section 5: EVA DA endpoints (chat, data, search, analysis, knowledge, feedback, translate)" -ForegroundColor Yellow

Put-Obj "endpoints" "POST /v1/eva-da/chat" @{
    id = "POST /v1/eva-da/chat"; method = "POST"; path = "/v1/eva-da/chat"
    service = "eva-brain-api"; status = "planned"
    description = "Main EVA DA chat endpoint. Accepts message + session_id + rag_mode (semantic|keyword|hybrid|reranked|multihop). Streams response via SSE. Replaces /api/conversation in jp-spark."
    request_schema = "EvaDAChatRequest"; response_schema = "EvaDAChatStreamResponse"
    auth_required = $true
}
Put-Obj "endpoints" "GET /v1/eva-da/rag-modes" @{
    id = "GET /v1/eva-da/rag-modes"; method = "GET"; path = "/v1/eva-da/rag-modes"
    service = "eva-brain-api"; status = "planned"
    description = "List available RAG modes for the current user/tenant: semantic, keyword, hybrid, re-ranked, multi-hop. Mode availability gated by feature flags."
    response_schema = "RagModeListResponse"; auth_required = $true
}
Put-Obj "endpoints" "POST /v1/eva-da/data/upload" @{
    id = "POST /v1/eva-da/data/upload"; method = "POST"; path = "/v1/eva-da/data/upload"
    service = "eva-brain-api"; status = "planned"
    description = "Upload one or more files into the EVA DA knowledge base. Accepts multipart/form-data. Triggers async ingestion pipeline. Returns ingestion job_id."
    request_schema = "DataUploadRequest"; response_schema = "IngestionJobResponse"; auth_required = $true
}
Put-Obj "endpoints" "GET /v1/eva-da/data/folders" @{
    id = "GET /v1/eva-da/data/folders"; method = "GET"; path = "/v1/eva-da/data/folders"
    service = "eva-brain-api"; status = "planned"
    description = "List all knowledge base folders available to the current user (mirrors /api/getfolders)."
    response_schema = "FolderListResponse"; auth_required = $true
}
Put-Obj "endpoints" "POST /v1/eva-da/data/folders" @{
    id = "POST /v1/eva-da/data/folders"; method = "POST"; path = "/v1/eva-da/data/folders"
    service = "eva-brain-api"; status = "planned"
    description = "Create a new knowledge base folder. Folder names are unique per tenant."
    request_schema = "CreateFolderRequest"; auth_required = $true
}
Put-Obj "endpoints" "GET /v1/eva-da/data/tags" @{
    id = "GET /v1/eva-da/data/tags"; method = "GET"; path = "/v1/eva-da/data/tags"
    service = "eva-brain-api"; status = "planned"
    description = "List all tags in the knowledge base for the current tenant (mirrors /api/gettags)."
    response_schema = "TagListResponse"; auth_required = $true
}
Put-Obj "endpoints" "GET /v1/eva-da/data/status" @{
    id = "GET /v1/eva-da/data/status"; method = "GET"; path = "/v1/eva-da/data/status"
    service = "eva-brain-api"; status = "planned"
    description = "Get ingestion status for recent uploads (mirrors /api/uploadstatus as a paginated list with job_id, filename, state, progress %)."
    response_schema = "IngestionStatusResponse"; auth_required = $true
}
Put-Obj "endpoints" "POST /v1/eva-da/data/url-scrape" @{
    id = "POST /v1/eva-da/data/url-scrape"; method = "POST"; path = "/v1/eva-da/data/url-scrape"
    service = "eva-brain-api"; status = "planned"
    description = "Scrape a public URL and ingest into knowledge base. Supports preview mode (returns extracted text + metadata without indexing) and submit mode."
    request_schema = "UrlScrapeRequest"; response_schema = "UrlScrapeResponse"; auth_required = $true
}
Put-Obj "endpoints" "GET /v1/eva-da/knowledge" @{
    id = "GET /v1/eva-da/knowledge"; method = "GET"; path = "/v1/eva-da/knowledge"
    service = "eva-brain-api"; status = "planned"
    description = "Browse the ingested knowledge base: paginated list of documents with folder, tags, ingestion_date, chunk_count. Filter by folder/tag. Supports keyword-in-metadata search."
    response_schema = "KnowledgeListResponse"; auth_required = $true
}
Put-Obj "endpoints" "POST /v1/eva-da/analysis" @{
    id = "POST /v1/eva-da/analysis"; method = "POST"; path = "/v1/eva-da/analysis"
    service = "eva-brain-api"; status = "planned"
    description = "Tabular data analysis: upload CSV/Excel + natural-language question, returns streamed narrative + base64 chart images (mirrors /api/tda/analyse)."
    request_schema = "AnalysisRequest"; response_schema = "AnalysisStreamResponse"; auth_required = $true
}
Put-Obj "endpoints" "GET /v1/eva-da/analysis/images" @{
    id = "GET /v1/eva-da/analysis/images"; method = "GET"; path = "/v1/eva-da/analysis/images"
    service = "eva-brain-api"; status = "planned"
    description = "Retrieve generated chart images for a prior analysis run (mirrors /api/tda/images)."
    auth_required = $true
}
Put-Obj "endpoints" "GET /v1/eva-da/analysis/output" @{
    id = "GET /v1/eva-da/analysis/output"; method = "GET"; path = "/v1/eva-da/analysis/output"
    service = "eva-brain-api"; status = "planned"
    description = "Retrieve the full analysis output (narrative + charts) for a completed run (mirrors /api/tda/output)."
    auth_required = $true
}
Put-Obj "endpoints" "GET /v1/eva-da/analysis/maxfilesize" @{
    id = "GET /v1/eva-da/analysis/maxfilesize"; method = "GET"; path = "/v1/eva-da/analysis/maxfilesize"
    service = "eva-brain-api"; status = "planned"
    description = "Return max allowed CSV file size for analysis upload (mirrors /api/tda/maxcsvfilesize)."
    auth_required = $false
}
Put-Obj "endpoints" "POST /v1/eva-da/translate" @{
    id = "POST /v1/eva-da/translate"; method = "POST"; path = "/v1/eva-da/translate"
    service = "eva-brain-api"; status = "planned"
    description = "Translate a document file into a target language and write result back to designated folder (mirrors /api/translatefile). Async; returns job_id."
    request_schema = "TranslateRequest"; auth_required = $true
}
Put-Obj "endpoints" "GET /v1/eva-da/feedback" @{
    id = "GET /v1/eva-da/feedback"; method = "GET"; path = "/v1/eva-da/feedback"
    service = "eva-brain-api"; status = "planned"
    description = "Admin endpoint: list all collected chat feedback (rating, comment, session_id, user_hash, timestamp). Paginated. Filter by date/rating. Admin + auditor roles."
    response_schema = "FeedbackListResponse"; auth_required = $true
}
Put-Obj "endpoints" "GET /v1/eva-da/feedback/export" @{
    id = "GET /v1/eva-da/feedback/export"; method = "GET"; path = "/v1/eva-da/feedback/export"
    service = "eva-brain-api"; status = "planned"
    description = "Export feedback as CSV for AI governance review cycle (19-ai-gov). Admin + auditor roles."
    auth_required = $true
}

Write-Host "[INFO] Section 5: A11y themes endpoints" -ForegroundColor Yellow

Put-Obj "endpoints" "GET /v1/admin/a11y/themes" @{
    id = "GET /v1/admin/a11y/themes"; method = "GET"; path = "/v1/admin/a11y/themes"
    service = "eva-brain-api"; status = "planned"
    description = "List all registered accessibility themes (high-contrast, large-text, reduced-motion, etc.)."
    auth_required = $true
}
Put-Obj "endpoints" "POST /v1/admin/a11y/themes" @{
    id = "POST /v1/admin/a11y/themes"; method = "POST"; path = "/v1/admin/a11y/themes"
    service = "eva-brain-api"; status = "planned"
    description = "Create a new accessibility theme with Fluent UI token overrides."
    request_schema = "A11yThemeRequest"; auth_required = $true
}
Put-Obj "endpoints" "PATCH /v1/admin/a11y/themes/{id}" @{
    id = "PATCH /v1/admin/a11y/themes/{id}"; method = "PATCH"; path = "/v1/admin/a11y/themes/{id}"
    service = "eva-brain-api"; status = "planned"
    description = "Update an existing accessibility theme. Partial update (merge-patch semantics)."
    request_schema = "A11yThemePatchRequest"; auth_required = $true
}
Put-Obj "endpoints" "DELETE /v1/admin/a11y/themes/{id}" @{
    id = "DELETE /v1/admin/a11y/themes/{id}"; method = "DELETE"; path = "/v1/admin/a11y/themes/{id}"
    service = "eva-brain-api"; status = "planned"
    description = "Delete a custom accessibility theme. Blocked if the theme is currently active."
    auth_required = $true
}
Put-Obj "endpoints" "GET /v1/admin/a11y/themes/active" @{
    id = "GET /v1/admin/a11y/themes/active"; method = "GET"; path = "/v1/admin/a11y/themes/active"
    service = "eva-brain-api"; status = "planned"
    description = "Return the currently active system-wide accessibility theme token set."
    auth_required = $false
}

Write-Host "[INFO] Section 5: RBAC Act-As + Responsibilities endpoints" -ForegroundColor Yellow

Put-Obj "endpoints" "GET /v1/rbac/responsibilities" @{
    id = "GET /v1/rbac/responsibilities"; method = "GET"; path = "/v1/rbac/responsibilities"
    service = "eva-roles-api"; status = "planned"
    description = "Return the full RACI responsibility matrix: all roles x all actions with R/A/C/I designations. Powers RbacResponsibilitiesPage."
    response_schema = "ResponsibilityMatrixResponse"; auth_required = $true
}
Put-Obj "endpoints" "POST /v1/rbac/act-as" @{
    id = "POST /v1/rbac/act-as"; method = "POST"; path = "/v1/rbac/act-as"
    service = "eva-roles-api"; status = "planned"
    description = "Begin an Act-As session. Admin/support role assumes the identity of target_user_id for duration_minutes (default 30). Returns act_as_token. All subsequent API calls made with this token are audit-logged with both real + assumed identity."
    request_schema = "ActAsRequest"; response_schema = "ActAsSessionResponse"; auth_required = $true
}
Put-Obj "endpoints" "DELETE /v1/rbac/act-as" @{
    id = "DELETE /v1/rbac/act-as"; method = "DELETE"; path = "/v1/rbac/act-as"
    service = "eva-roles-api"; status = "planned"
    description = "End the active Act-As session immediately. Clears the act_as_token and restores the caller's own identity."
    auth_required = $true
}

Write-Host "[INFO] Section 5: System logs endpoints" -ForegroundColor Yellow

Put-Obj "endpoints" "GET /v1/logs/system" @{
    id = "GET /v1/logs/system"; method = "GET"; path = "/v1/logs/system"
    service = "eva-brain-api"; status = "planned"
    description = "Application/structural system logs (INFO/WARN/ERROR/FATAL). Filter by service, log level, time range. Paginated. Second logging lane vs audit logs (user-action / PIPEDA scope)."
    response_schema = "SystemLogListResponse"; auth_required = $true
}
Put-Obj "endpoints" "GET /v1/logs/system/export" @{
    id = "GET /v1/logs/system/export"; method = "GET"; path = "/v1/logs/system/export"
    service = "eva-brain-api"; status = "planned"
    description = "Export system logs as JSONL or CSV with the same filters as GET /v1/logs/system."
    auth_required = $true
}

Write-Host "[INFO] Section 5: i18n by-screen + import endpoints" -ForegroundColor Yellow

Put-Obj "endpoints" "GET /v1/config/translations/by-screen/{screenId}" @{
    id = "GET /v1/config/translations/by-screen/{screenId}"; method = "GET"
    path = "/v1/config/translations/by-screen/{screenId}"
    service = "eva-brain-api"; status = "planned"
    description = "Return all literals belonging to the specified screen ID, in all registered languages. Powers AdminI18nByScreenPage screen-scoped editor."
    response_schema = "TranslationsByScreenResponse"; auth_required = $true
}
Put-Obj "endpoints" "POST /v1/config/translations/import" @{
    id = "POST /v1/config/translations/import"; method = "POST"
    path = "/v1/config/translations/import"
    service = "eva-brain-api"; status = "planned"
    description = "Bulk import translations from a CSV upload. CSV format: key,language,value. Validates all keys exist in the literals model before applying. Returns validation_errors + applied_count."
    request_schema = "TranslationImportRequest"; auth_required = $true
}

Write-Host "[INFO] Section 5: Red teaming endpoints" -ForegroundColor Yellow

Put-Obj "endpoints" "GET /v1/redteam/results" @{
    id = "GET /v1/redteam/results"; method = "GET"; path = "/v1/redteam/results"
    service = "eva-brain-api"; status = "planned"
    description = "List red teaming test results across all runs: per-prompt pass/fail, vulnerability category (OWASP LLM Top 10), severity, timestamp. Used by RedTeamingPage."
    auth_required = $true
}
Put-Obj "endpoints" "GET /v1/redteam/runs" @{
    id = "GET /v1/redteam/runs"; method = "GET"; path = "/v1/redteam/runs"
    service = "eva-brain-api"; status = "planned"
    description = "List all red-team test run records with summary stats (pass%, fail_count, critical_count)."
    auth_required = $true
}
Put-Obj "endpoints" "POST /v1/redteam/run" @{
    id = "POST /v1/redteam/run"; method = "POST"; path = "/v1/redteam/run"
    service = "eva-brain-api"; status = "planned"
    description = "Trigger a new Promptfoo red-team run against the current EVA DA chat endpoint. Returns run_id. Async; poll GET /v1/redteam/runs/{run_id} for status."
    request_schema = "RedTeamRunRequest"; auth_required = $true
}
Put-Obj "endpoints" "GET /v1/redteam/config" @{
    id = "GET /v1/redteam/config"; method = "GET"; path = "/v1/redteam/config"
    service = "eva-brain-api"; status = "planned"
    description = "Return current Promptfoo test suite configuration (plugins enabled, target model, threshold settings)."
    auth_required = $true
}

Write-Host "[INFO] Section 5: AssistMe endpoints" -ForegroundColor Yellow

Put-Obj "endpoints" "POST /v1/assistme/chat" @{
    id = "POST /v1/assistme/chat"; method = "POST"; path = "/v1/assistme/chat"
    service = "eva-brain-api"; status = "planned"
    description = "Citizen-facing AssistMe chat: no authentication required for citizen persona. Returns streamed bilingual (EN/FR) response. Limited to curated knowledge base (citizen topics)."
    request_schema = "AssistMeChatRequest"; response_schema = "AssistMeChatStreamResponse"; auth_required = $false
}
Put-Obj "endpoints" "GET /v1/assistme/topics" @{
    id = "GET /v1/assistme/topics"; method = "GET"; path = "/v1/assistme/topics"
    service = "eva-brain-api"; status = "planned"
    description = "List curated topic cards for the AssistMe citizen portal. Returns topic_id, title_en, title_fr, icon, description."
    auth_required = $false
}
Put-Obj "endpoints" "POST /v1/assistme/feedback" @{
    id = "POST /v1/assistme/feedback"; method = "POST"; path = "/v1/assistme/feedback"
    service = "eva-brain-api"; status = "planned"
    description = "Submit citizen feedback on an AssistMe response. Appends to the same feedback store as EVA DA feedback."
    request_schema = "FeedbackRequest"; auth_required = $false
}

# ─────────────────────────────────────────────────────────────────────────────
# WRITE CYCLE: export → assemble → validate
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[INFO] Running write cycle (export / assemble / validate)..." -ForegroundColor Cyan

try {
    $exp    = Invoke-WebRequest "$Base/model/admin/export" -Method POST -Headers $hadm -UseBasicParsing -TimeoutSec 60
    $expObj = $exp.Content | ConvertFrom-Json
    "[OK]  Export: total=$($expObj.total)  errors=$($expObj.errors.Count)"
} catch {
    "[FAIL] Export: $_"
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "  PUT calls OK   : $ok"   -ForegroundColor Green
Write-Host "  PUT calls FAIL : $fail" -ForegroundColor $(if ($fail -gt 0) { "Red" } else { "Green" })
Write-Host ""
if ($fail -gt 0) {
    Write-Host "[WARN] $fail failure(s) above — review before running assemble+validate." -ForegroundColor Yellow
} else {
    Write-Host "[INFO] All PUTs succeeded. Run assemble + validate manually:" -ForegroundColor Green
    Write-Host "       .\scripts\assemble-model.ps1; .\scripts\validate-model.ps1"
}
