# register-uiux-agentic.ps1
# Registers all UI/UX and agentic services that the EVA Data Model needs to power.
# Run from C:\AICOE\eva-foundation\37-data-model
# Usage: .\scripts\register-uiux-agentic.ps1

$base = "http://localhost:8010"
$h = @{"Content-Type" = "application/json"; "X-Actor" = "agent:copilot"}

function Put-Object {
    param([string]$layer, [string]$id, [hashtable]$body)
    $url = "$base/model/$layer/$id"
    $json = $body | ConvertTo-Json -Depth 6
    try {
        $r = Invoke-WebRequest $url -Method PUT -Body $json -Headers $h -UseBasicParsing -TimeoutSec 15
        $obj = $r.Content | ConvertFrom-Json
        "[OK]  PUT $layer/$id  rv=$($obj.row_version)"
    } catch {
        "[FAIL] PUT $layer/$id  $_"
    }
}

Write-Host "[INFO] Registering UI/UX + agentic services for EVA Data Model..." -ForegroundColor Cyan

# ── UI/UX surfaces (hosted in portal-face / 31-eva-faces) ──────────────────────

Put-Object "services" "model-explorer-ui" @{
    id          = "model-explorer-ui"
    name        = "Model Explorer UI"
    type        = "react_spa"
    project     = "31-eva-faces"
    status      = "planned"
    description = "Browse all 27 data model layers, filter and search objects, navigate entity relationships. Hosted in portal-face of 31-eva-faces."
    depends_on  = @("model-api")
    repo_path   = "eva-foundation/31-eva-faces"
}

Put-Object "services" "model-graph-explorer" @{
    id          = "model-graph-explorer"
    name        = "Model Graph Explorer"
    type        = "react_spa"
    project     = "31-eva-faces"
    status      = "planned"
    description = "Interactive force-directed rendering of GET /model/graph/ (304 nodes, 533 edges, 20 edge types). Supports BFS traversal, depth filter, edge-type legend. Hosted in portal-face."
    depends_on  = @("model-api")
    repo_path   = "eva-foundation/31-eva-faces"
}

Put-Object "services" "model-admin-panel" @{
    id          = "model-admin-panel"
    name        = "Model Admin Panel"
    type        = "react_spa"
    project     = "31-eva-faces"
    status      = "planned"
    description = "PUT objects to any of the 27 layers, manage row_version, trigger export/seed/assemble operations, view audit trail by actor + timestamp. Restricted to admin-face. Requires admin Bearer token."
    depends_on  = @("model-api")
    repo_path   = "eva-foundation/31-eva-faces"
}

Put-Object "services" "model-drift-dashboard" @{
    id          = "model-drift-dashboard"
    name        = "Model Drift Dashboard"
    type        = "react_spa"
    project     = "31-eva-faces"
    status      = "planned"
    description = "Displays output of sync-from-source.ps1 and coverage-gaps.ps1: staleness signals, objects missing repo_line, layers lacking source coverage. Surfaced as read-only panel in admin-face."
    depends_on  = @("model-api", "model-sync-agent")
    repo_path   = "eva-foundation/31-eva-faces"
}

Put-Object "services" "model-impact-view" @{
    id          = "model-impact-view"
    name        = "Model Impact Analysis View"
    type        = "react_spa"
    project     = "31-eva-faces"
    status      = "planned"
    description = "Renders GET /model/impact/?container=X as an interactive dependency tree. Shows upstream/downstream blast radius of changing a container, service, or endpoint. Hosted in portal-face."
    depends_on  = @("model-api")
    repo_path   = "eva-foundation/31-eva-faces"
}

# ── Agentic services ────────────────────────────────────────────────────────────

Put-Object "services" "model-sync-agent" @{
    id          = "model-sync-agent"
    name        = "Model Sync Agent"
    type        = "fastapi_agent"
    project     = "48-eva-orchestrator"
    status      = "planned"
    description = "Consumes source diffs (ADO commits, GitHub PRs) and proposes JSON patches to model layers via PUT /model/{layer}/{id}. Routes through 48-eva-orchestrator truth engine. Triggered by CI or scheduled scan."
    depends_on  = @("model-api", "eva-orchestrator")
    repo_path   = "eva-foundation/48-eva-orchestrator"
}

Put-Object "services" "model-drift-agent" @{
    id          = "model-drift-agent"
    name        = "Model Drift Detection Agent"
    type        = "fastapi_agent"
    project     = "48-eva-orchestrator"
    status      = "planned"
    description = "Scheduled agent (hourly/daily). Calls sync-from-source and coverage-gaps scripts, surfaces deltas as ADO work items or webhook alerts. Feeds model-drift-dashboard."
    depends_on  = @("model-api", "model-sync-agent")
    repo_path   = "eva-foundation/48-eva-orchestrator"
}

Put-Object "services" "model-doc-generator-agent" @{
    id          = "model-doc-generator-agent"
    name        = "Model Documentation Generator Agent"
    type        = "fastapi_agent"
    project     = "01-documentation-generator"
    status      = "planned"
    description = "Reads 27 model layers via GET /model/{layer}/ and generates architecture docs, ADO work item descriptions, README stubs, and human-readable reports. Part of 01-documentation-generator pipeline."
    depends_on  = @("model-api")
    repo_path   = "eva-foundation/01-documentation-generator"
}

Put-Object "services" "model-diagram-agent" @{
    id          = "model-diagram-agent"
    name        = "Model Architecture Diagram Agent"
    type        = "fastapi_agent"
    project     = "01-documentation-generator"
    status      = "planned"
    description = "Reads GET /model/graph/ and generates Mermaid diagrams: C4 context, layer dependency, screen flow, agent orchestration. Outputs .md files to docs/ or pushes to ADO wiki."
    depends_on  = @("model-api")
    repo_path   = "eva-foundation/01-documentation-generator"
}

Put-Object "services" "model-status-agent" @{
    id          = "model-status-agent"
    name        = "PoC Status Agent"
    type        = "fastapi_agent"
    project     = "48-eva-orchestrator"
    status      = "planned"
    description = "Reads all 48 project STATUS.md files + model layers + ADO sprint data to produce a cross-project health dashboard. Feeds 40-eva-control-plane evidence packs and the ADO Dashboard (39-ado-dashboard)."
    depends_on  = @("model-api", "eva-orchestrator", "eva-brain-api")
    repo_path   = "eva-foundation/48-eva-orchestrator"
}

Put-Object "services" "model-trust-linker" @{
    id          = "model-trust-linker"
    name        = "Model Trust Linker"
    type        = "fastapi_agent"
    project     = "47-eva-mti"
    status      = "planned"
    description = "Reads the model's services + endpoints layers to build the trust topology consumed by 47-eva-mti trust computation. Registers trust edges as model relationships. Called during 19-ai-gov Decision Engine Step 5."
    depends_on  = @("model-api", "eva-mti")
    repo_path   = "eva-foundation/47-eva-mti"
}

Write-Host ""
Write-Host "[INFO] All PUT calls complete. Running write cycle..." -ForegroundColor Cyan

# ── Write cycle ─────────────────────────────────────────────────────────────────
$adminH = @{"Authorization" = "Bearer dev-admin"; "Content-Type" = "application/json"}
try {
    $exp = Invoke-WebRequest "$base/model/admin/export" -Method POST -Headers $adminH -UseBasicParsing -TimeoutSec 30
    $expObj = $exp.Content | ConvertFrom-Json
    "[OK]  Export: total=$($expObj.total) errors=$($expObj.errors.Count)"
} catch {
    "[FAIL] Export: $_"
}
