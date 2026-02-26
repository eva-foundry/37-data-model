<#
.SYNOPSIS
  Update 37-data-model to reflect EVA Brain v2 Sprint 5 completion reality.
  Sprint 5 full gate: 577/577 tests, 60/60 endpoints, 72% coverage.
  Run date: February 23, 2026 @ 8:16 AM ET
#>

$base    = "http://localhost:8010"
$actor   = "agent:copilot"
$headers = @{ "X-Actor" = $actor; "Content-Type" = "application/json" }

function Set-Status($layer, $id, $updates) {
  $url = "$base/model/$layer/$([uri]::EscapeUriString($id))"
  $obj = (Invoke-WebRequest $url -TimeoutSec 8).Content | ConvertFrom-Json
  foreach ($k in $updates.Keys) { $obj.$k = $updates[$k] }
  $body = $obj | ConvertTo-Json -Depth 6 -Compress
  $r = Invoke-WebRequest $url -Method PUT -Headers $headers -Body $body -TimeoutSec 10
  $updated = $r.Content | ConvertFrom-Json
  Write-Host "OK  [$layer] $id -> $($updates | ConvertTo-Json -Compress)"
}

# ──────────────────────────────────────────────────────────────────
# 1. ENDPOINT STUBS: promote to implemented
# ──────────────────────────────────────────────────────────────────
$implRouteBase = "33-eva-brain-v2/services/eva-brain-api/app/routes"

$stubsToImpl = @(
  # Ingest
  @{ id="POST /v1/ingest/upload";            route_file="ingest.py" }
  @{ id="GET /v1/ingest/jobs";               route_file="ingest.py" }
  @{ id="GET /v1/ingest/jobs/{job_id}";      route_file="ingest.py" }
  @{ id="DELETE /v1/ingest/jobs/{job_id}";   route_file="ingest.py" }
  @{ id="POST /v1/ingest/reprocess/{job_id}";route_file="ingest.py" }
  # Sessions
  @{ id="POST /v1/sessions";                 route_file="sessions.py" }
  @{ id="GET /v1/sessions";                  route_file="sessions.py" }
  @{ id="GET /v1/sessions/{session_id}";     route_file="sessions.py" }
  @{ id="PATCH /v1/sessions/{session_id}";   route_file="sessions.py" }
  @{ id="DELETE /v1/sessions/{session_id}";  route_file="sessions.py" }
  @{ id="DELETE /v1/sessions";               route_file="sessions.py" }
  # Config (public)
  @{ id="GET /v1/config/info";               route_file="config.py" }
  @{ id="GET /v1/config/features";           route_file="config.py" }
  @{ id="GET /v1/config/translations/{language}"; route_file="config.py" }
  # Admin
  @{ id="POST /v1/admin/users";              route_file="admin.py" }
  @{ id="GET /v1/admin/groups";              route_file="admin.py" }
  # Search
  @{ id="GET /v1/search/saved";              route_file="search.py" }
  @{ id="POST /v1/search/saved";             route_file="search.py" }
  @{ id="GET /v1/search/history";            route_file="search.py" }
  @{ id="DELETE /v1/search/saved/{search_id}"; route_file="search.py" }
  # Tags (currently "planned")
  @{ id="GET /v1/tags";                      route_file="tags.py" }
  @{ id="GET /v1/tags/{tag_name}/documents"; route_file="tags.py" }
)

Write-Host "`n=== Endpoints: stub/planned -> implemented ==="
foreach ($ep in $stubsToImpl) {
  Set-Status "endpoints" $ep.id @{
    status         = "implemented"
    implemented_in = "$implRouteBase/$($ep.route_file)"
  }
}

# ──────────────────────────────────────────────────────────────────
# 2. FEATURE FLAGS: update statuses for Sprint 5 features
# ──────────────────────────────────────────────────────────────────
Write-Host "`n=== Feature flags: planned/stub -> active ==="

$ffUpdates = @(
  @{ id="action.admin.translations"; status="active" }
  @{ id="action.admin.settings";     status="active" }
  @{ id="action.admin.apps";         status="active" }
  @{ id="action.admin.manage_users"; status="active" }
  @{ id="action.admin.view_groups";  status="active" }
  @{ id="action.assistant";          status="active" }
)
foreach ($ff in $ffUpdates) {
  Set-Status "feature_flags" $ff.id @{ status = $ff.status }
}

# ──────────────────────────────────────────────────────────────────
# 3. SERVICE RECORD: eva-brain-api
# ──────────────────────────────────────────────────────────────────
Write-Host "`n=== Service record: eva-brain-api ==="
Set-Status "services" "eva-brain-api" @{
  status = "code_complete"
  notes  = "Sprint 5 full gate: 577/577 tests passing, 72% coverage, 60/60 endpoints implemented. Sprint 6 active (deployment to Azure Container Apps + APIM)."
}

# ──────────────────────────────────────────────────────────────────
# 4. PROJECT RECORD: 33-eva-brain-v2
# ──────────────────────────────────────────────────────────────────
Write-Host "`n=== Project record: 33-eva-brain-v2 ==="
Set-Status "projects" "33-eva-brain-v2" @{
  services  = @("eva-brain-api", "eva-roles-api")
  pbi_done  = 7
  notes     = "Sprint 5 full gate passed (Feb 20, 2026). Sprint 6 active: Dockerfile (roles-api), ACR push, Container App deploy, APIM policies, end-to-end smoke test."
}

Write-Host "`nAll PUTs complete. Running write cycle..."
