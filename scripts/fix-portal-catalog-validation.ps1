# fix-portal-catalog-validation.ps1
# Fixes two validator issues in register-portal-full-catalog.ps1:
#   1. All new endpoints need cosmos_reads=[] and cosmos_writes=[]
#   2. 7 endpoints referenced in new screens were not yet registered
#
# Run from: C:\eva-foundry\eva-foundation\37-data-model
# Safe to re-run — PUTs are idempotent (increments row_version).

param([string]$Base = "http://localhost:8010", [string]$AdminToken = "dev-admin")
$h    = @{ "Content-Type" = "application/json"; "X-Actor" = "agent:copilot" }
$hadm = @{ "Authorization" = "Bearer $AdminToken"; "Content-Type" = "application/json" }
$ok = 0; $fail = 0

function Put-Obj {
    param([string]$Layer, [string]$Id, [hashtable]$Body)
    $json = $Body | ConvertTo-Json -Depth 8
    try {
        $r = Invoke-WebRequest "$Base/model/$Layer/$Id" -Method PUT -Body $json -Headers $h -UseBasicParsing -TimeoutSec 15
        $script:ok++
        $rv = ($r.Content | ConvertFrom-Json).row_version
        "[OK]  $Layer/$Id  rv=$rv"
    } catch { $script:fail++; "[FAIL] $Layer/$Id  $_" }
}

Write-Host "[INFO] Fix 1: Add missing cosmos_reads/cosmos_writes to all new endpoints" -ForegroundColor Yellow

# Fetch each new endpoint from the API, add the two fields, and re-PUT
$newEndpointIds = @(
    "GET /v1/auth/me","GET /v1/auth/personas","POST /v1/auth/login",
    "POST /v1/auth/logout","POST /v1/auth/persona/select",
    "POST /v1/eva-da/chat","GET /v1/eva-da/rag-modes",
    "POST /v1/eva-da/data/upload","GET /v1/eva-da/data/folders",
    "POST /v1/eva-da/data/folders","GET /v1/eva-da/data/tags",
    "GET /v1/eva-da/data/status","POST /v1/eva-da/data/url-scrape",
    "GET /v1/eva-da/knowledge","POST /v1/eva-da/analysis",
    "GET /v1/eva-da/analysis/images","GET /v1/eva-da/analysis/output",
    "GET /v1/eva-da/analysis/maxfilesize","POST /v1/eva-da/translate",
    "GET /v1/eva-da/feedback","GET /v1/eva-da/feedback/export",
    "GET /v1/admin/a11y/themes","POST /v1/admin/a11y/themes",
    "PATCH /v1/admin/a11y/themes/{id}","DELETE /v1/admin/a11y/themes/{id}",
    "GET /v1/admin/a11y/themes/active",
    "GET /v1/rbac/responsibilities","POST /v1/rbac/act-as","DELETE /v1/rbac/act-as",
    "GET /v1/logs/system","GET /v1/logs/system/export",
    "GET /v1/config/translations/by-screen/{screenId}",
    "POST /v1/config/translations/import",
    "GET /v1/redteam/results","GET /v1/redteam/runs",
    "POST /v1/redteam/run","GET /v1/redteam/config",
    "POST /v1/assistme/chat","GET /v1/assistme/topics","POST /v1/assistme/feedback"
)

foreach ($epId in $newEndpointIds) {
    $slug = [System.Uri]::EscapeDataString($epId)
    try {
        $existing = Invoke-RestMethod "$Base/model/endpoints/$slug" -UseBasicParsing -TimeoutSec 10
        # Merge cosmos_reads + cosmos_writes onto the existing object
        $obj = @{}
        $existing.PSObject.Properties | ForEach-Object { $obj[$_.Name] = $_.Value }
        if ($null -eq $obj["cosmos_reads"])  { $obj["cosmos_reads"]  = @() }
        if ($null -eq $obj["cosmos_writes"]) { $obj["cosmos_writes"] = @() }
        Put-Obj "endpoints" $epId $obj
    } catch {
        $fail++
        "[FAIL] fetch $epId : $_"
    }
}

Write-Host ""
Write-Host "[INFO] Fix 2: Register 7 missing endpoints (referenced by new screens)" -ForegroundColor Yellow

Put-Obj "endpoints" "GET /v1/rbac/roles" @{
    id = "GET /v1/rbac/roles"; method = "GET"; path = "/v1/rbac/roles"
    service = "eva-roles-api"; status = "planned"
    description = "List all defined roles. Used by RbacResponsibilitiesPage and ActAsPage to populate role dropdown."
    cosmos_reads = @("security_config"); cosmos_writes = @()
}
Put-Obj "endpoints" "GET /v1/scrum/sprints" @{
    id = "GET /v1/scrum/sprints"; method = "GET"; path = "/v1/scrum/sprints"
    service = "eva-brain-api"; status = "planned"
    description = "List all ADO sprints for the current project/team. Paginated. Used by ADOCommandCenterPage sprint selector."
    cosmos_reads = @("scrum-cache"); cosmos_writes = @()
}
Put-Obj "endpoints" "GET /v1/scrum/pbis" @{
    id = "GET /v1/scrum/pbis"; method = "GET"; path = "/v1/scrum/pbis"
    service = "eva-brain-api"; status = "planned"
    description = "List product backlog items (work items) for a given sprint and project filter. Used by ADOCommandCenterPage WICard list."
    cosmos_reads = @("scrum-cache"); cosmos_writes = @()
}
Put-Obj "endpoints" "GET /model/services/" @{
    id = "GET /model/services/"; method = "GET"; path = "/model/services/"
    service = "model-api"; status = "implemented"
    description = "List all registered services in the EVA data model. Served by 37-data-model ACA (https://marco-eva-data-model.*). Used by DataModelExplorerPage."
    cosmos_reads = @(); cosmos_writes = @()
}
Put-Obj "endpoints" "GET /model/graph/" @{
    id = "GET /model/graph/"; method = "GET"; path = "/model/graph/"
    service = "model-api"; status = "implemented"
    description = "Return the full EVA model dependency graph (304 nodes, 533 edges, 20 edge types). BFS traversal with depth filter. Used by DataModelExplorerPage graph visualizer."
    cosmos_reads = @(); cosmos_writes = @()
}
Put-Obj "endpoints" "GET /model/services/{id}" @{
    id = "GET /model/services/{id}"; method = "GET"; path = "/model/services/{id}"
    service = "model-api"; status = "implemented"
    description = "Retrieve a single service object from the EVA data model by id. Used by DataModelExplorerPage detail panel."
    cosmos_reads = @(); cosmos_writes = @()
}
Put-Obj "endpoints" "GET /model/impact/" @{
    id = "GET /model/impact/"; method = "GET"; path = "/model/impact/"
    service = "model-api"; status = "implemented"
    description = "Return the upstream/downstream dependency blast radius for a given container or service. Used by DataModelExplorerPage impact panel."
    cosmos_reads = @(); cosmos_writes = @()
}

# ── Export → assemble → validate ────────────────────────────────────────────
Write-Host ""
Write-Host "[INFO] Running export..." -ForegroundColor Cyan
try {
    $exp    = Invoke-WebRequest "$Base/model/admin/export" -Method POST -Headers $hadm -UseBasicParsing -TimeoutSec 60
    $expObj = $exp.Content | ConvertFrom-Json
    "[OK]  Export: total=$($expObj.total)  errors=$($expObj.errors.Count)"
} catch { "[FAIL] Export: $_" }

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "  OK:   $ok" -ForegroundColor Green
Write-Host "  FAIL: $fail" -ForegroundColor $(if ($fail -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "[INFO] Now run: .\scripts\assemble-model.ps1; .\scripts\validate-model.ps1"
