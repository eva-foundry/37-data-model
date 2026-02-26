param([string]$Base = "http://localhost:8010")
$h = @{"Content-Type"="application/json";"X-Actor"="agent:copilot"}
$ids = @(
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
    "POST /v1/assistme/chat","GET /v1/assistme/topics",
    "POST /v1/assistme/feedback",
    "GET /v1/rbac/roles","GET /v1/scrum/sprints","GET /v1/scrum/pbis",
    "GET /model/services/","GET /model/graph/",
    "GET /model/services/{id}","GET /model/impact/"
)
$ok = 0; $fail = 0
foreach ($id in $ids) {
    $slug = [System.Uri]::EscapeDataString($id)
    try {
        $cur = Invoke-RestMethod "$Base/model/endpoints/$slug" -TimeoutSec 10
        $patch = [ordered]@{}
        $cur.PSObject.Properties | ForEach-Object { $patch[$_.Name] = $_.Value }
        $patch["cosmos_reads"]  = @()
        $patch["cosmos_writes"] = @()
        $json = $patch | ConvertTo-Json -Depth 6
        Invoke-WebRequest "$Base/model/endpoints/$slug" -Method PUT -Body $json -Headers $h -UseBasicParsing -TimeoutSec 10 | Out-Null
        $ok++; Write-Host "[OK] $id"
    } catch {
        $fail++; Write-Host "[FAIL] $id : $_"
    }
}
Write-Host ""; Write-Host "DONE: OK=$ok FAIL=$fail"
