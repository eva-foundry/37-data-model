#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Bulk-stamp transaction_function_type (EI/EO/EQ) on all implemented endpoints.
  F37-10-001 -- IFPUG FPA classification for Function Point estimation.

.DESCRIPTION
  EI  External Input   : POST/PUT/PATCH/DELETE -- data enters or modifies the system
  EO  External Output  : AI chat/retrieve/report/export/stats/computed responses
  EQ  External Inquiry : simple GET read-only lookups (no computation, no transforms)

  Classification rules applied:
    DELETE *         -> EI
    PATCH  *         -> EI
    PUT    *         -> EI
    POST   /v1/chat* -> EO (AI response generation)
    POST   /v1/assistant/* -> EO (AI computation)
    POST   /v1/retrieve   -> EO (semantic retrieval)
    POST   /model/admin/audit-repo -> EO (analysis report)
    POST   /agents/*      -> EO (workflow invocation)
    POST   /v1/roles/check-feature -> EQ (simple policy check -- no state change)
    POST   *              -> EI (everything else with POST)
    GET    */export       -> EO (file generation)
    GET    */stats        -> EO (aggregated computation)
    GET    */dashboard    -> EO (multi-source aggregation)
    GET    */summary      -> EO (derived aggregate)
    GET    */content      -> EO (binary content retrieval from blob)
    GET    *              -> EQ (simple lookups, health, config reads)

.PARAMETER Base
  Data model API base URL.

.PARAMETER DryRun
  Print classifications without writing to the model.

.PARAMETER WarnOnly
  Exit 0 even if some PUTs fail.
#>
param(
  [string]$Base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io",
  [switch]$DryRun,
  [switch]$WarnOnly
)

Set-StrictMode -Off
$ErrorActionPreference = "Continue"

# ── Classification map ────────────────────────────────────────────────────────
# FORMAT: "endpoint_id" = "EI|EO|EQ"
# Generated from the full 76-endpoint implemented list (2026-02-25)

$TFT_MAP = @{
  # ── DELETEs (EI) ─────────────────────────────────────────────────────────
  "DELETE /v1/apps/{appId}"                    = "EI"
  "DELETE /v1/config/translations/{language}"  = "EI"
  "DELETE /v1/documents/{doc_id}"              = "EI"
  "DELETE /v1/documents/{doc_id}/chunks"       = "EI"
  "DELETE /v1/ingest/jobs/{job_id}"            = "EI"
  "DELETE /v1/roles/acting-as"                 = "EI"
  "DELETE /v1/search/saved/{search_id}"        = "EI"
  "DELETE /v1/sessions"                        = "EI"
  "DELETE /v1/sessions/{session_id}"           = "EI"

  # ── GETs: simple lookups (EQ) ────────────────────────────────────────────
  "GET /v1/admin/groups"                       = "EQ"
  "GET /v1/apps"                               = "EQ"
  "GET /v1/apps/{appId}"                       = "EQ"
  "GET /v1/chat/approaches"                    = "EQ"
  "GET /v1/config/features"                    = "EQ"
  "GET /v1/config/info"                        = "EQ"
  "GET /v1/documents"                          = "EQ"
  "GET /v1/documents/{doc_id}"                 = "EQ"
  "GET /v1/documents/{doc_id}/chunks"          = "EQ"
  "GET /v1/health"                             = "EQ"
  "GET /v1/health/background"                  = "EQ"
  "GET /v1/ingest/jobs"                        = "EQ"
  "GET /v1/ingest/jobs/{job_id}"               = "EQ"
  "GET /v1/logs/audit"                         = "EQ"
  "GET /v1/logs/audit/{log_id}"                = "EQ"
  "GET /v1/logs/content"                       = "EQ"
  "GET /v1/logs/content/{log_id}"              = "EQ"
  "GET /v1/roles/context"                      = "EQ"
  "GET /v1/roles/features"                     = "EQ"
  "GET /v1/roles/personas"                     = "EQ"
  "GET /v1/search/history"                     = "EQ"
  "GET /v1/search/saved"                       = "EQ"
  "GET /v1/sessions"                           = "EQ"
  "GET /v1/sessions/{session_id}"              = "EQ"
  "GET /v1/settings"                           = "EQ"
  "GET /v1/tags"                               = "EQ"
  "GET /v1/tags/{tag_name}/documents"          = "EQ"

  # ── GETs: computed / exported output (EO) ────────────────────────────────
  "GET /v1/apps/{appId}/export"                = "EO"
  "GET /v1/documents/{doc_id}/content"         = "EO"
  "GET /v1/logs/audit/export"                  = "EO"
  "GET /v1/logs/audit/stats"                   = "EO"
  "GET /v1/logs/content/export"                = "EO"
  "GET /v1/logs/content/stats"                 = "EO"
  "GET /v1/scrum/dashboard"                    = "EO"
  "GET /v1/scrum/summary"                      = "EO"

  # ── PATCHes (EI) ─────────────────────────────────────────────────────────
  "PATCH /v1/apps/{appId}"                     = "EI"
  "PATCH /v1/documents/{doc_id}"               = "EI"
  "PATCH /v1/sessions/{session_id}"            = "EI"
  "PATCH /v1/settings/{key}"                   = "EI"

  # ── POSTs: AI/report output (EO) ─────────────────────────────────────────
  "POST /agents/session-workflow-agent/invoke" = "EO"
  "POST /model/admin/audit-repo"               = "EO"
  "POST /v1/assistant/math/convert"            = "EO"
  "POST /v1/assistant/math/explain"            = "EO"
  "POST /v1/assistant/math/solve"              = "EO"
  "POST /v1/assistant/tabular/analyze"         = "EO"
  "POST /v1/assistant/tabular/compare"         = "EO"
  "POST /v1/assistant/tabular/extract"         = "EO"
  "POST /v1/assistant/tabular/summarize"       = "EO"
  "POST /v1/chat"                              = "EO"
  "POST /v1/chat/hybrid"                       = "EO"
  "POST /v1/chat/read-retrieve-read"           = "EO"
  "POST /v1/chat/rrr"                          = "EO"
  "POST /v1/chat/rtr"                          = "EO"
  "POST /v1/chat/ungrounded"                   = "EO"
  "POST /v1/chat/work"                         = "EO"
  "POST /v1/retrieve"                          = "EO"

  # ── POSTs: simple check -- no state change (EQ) ──────────────────────────
  "POST /v1/roles/check-feature"               = "EQ"

  # ── POSTs: state-changing inputs (EI) ────────────────────────────────────
  "POST /v1/admin/users"                       = "EI"
  "POST /v1/apps"                              = "EI"
  "POST /v1/apps/{appId}/disable"              = "EI"
  "POST /v1/documents/{doc_id}/reindex"        = "EI"
  "POST /v1/ingest/reprocess/{job_id}"         = "EI"
  "POST /v1/ingest/upload"                     = "EI"
  "POST /v1/roles/acting-as"                   = "EI"
  "POST /v1/search/saved"                      = "EI"
  "POST /v1/sessions"                          = "EI"

  # ── PUTs (EI) ────────────────────────────────────────────────────────────
  "PUT /v1/config/translations/{language}"     = "EI"
}

# ── Counts ────────────────────────────────────────────────────────────────────
$ei = @($TFT_MAP.GetEnumerator() | Where-Object { $_.Value -eq "EI" }).Count
$eo = @($TFT_MAP.GetEnumerator() | Where-Object { $_.Value -eq "EO" }).Count
$eq = @($TFT_MAP.GetEnumerator() | Where-Object { $_.Value -eq "EQ" }).Count
Write-Host "[INFO] Classification: EI=$ei EO=$eo EQ=$eq Total=$($TFT_MAP.Count)"

if ($DryRun) {
  Write-Host "[DRY-RUN] Classifications:"
  $TFT_MAP.GetEnumerator() | Sort-Object Value,Name | ForEach-Object {
    Write-Host "  $($_.Value)  $($_.Name)"
  }
  Write-Host "[DRY-RUN] Done. No writes."
  exit 0
}

# ── Bulk PUT ──────────────────────────────────────────────────────────────────
$ok = 0; $fail = 0; $skip = 0

foreach ($entry in $TFT_MAP.GetEnumerator()) {
  $id = $entry.Name
  $tft = $entry.Value

  try {
    $ep = Invoke-RestMethod "$Base/model/endpoints/$([uri]::EscapeDataString($id))" -TimeoutSec 10

    # Skip if already correctly stamped
    $existing = [string]($ep.PSObject.Properties['transaction_function_type']?.Value)
    if ($existing -eq $tft) { $skip++; continue }

    $prev_rv = $ep.row_version
    $body = $ep | Select-Object * -ExcludeProperty layer,modified_by,modified_at,created_by,created_at,row_version,source_file
    $body | Add-Member -Force -NotePropertyName transaction_function_type -NotePropertyValue $tft
    $json = $body | ConvertTo-Json -Depth 10

    $r = Invoke-RestMethod "$Base/model/endpoints/$([uri]::EscapeDataString($id))" `
      -Method PUT -ContentType "application/json" -Body $json `
      -Headers @{"X-Actor"="agent:fp-stamper"}

    if ($r.row_version -eq ($prev_rv + 1)) {
      $ok++
    } else {
      Write-Host "[WARN] rv not incremented for $id (was=$prev_rv now=$($r.row_version))"
      $fail++
    }
  } catch {
    Write-Host "[FAIL] $id -- $_"
    $fail++
  }
}

Write-Host "[INFO] Stamped=$ok Skipped=$skip Failed=$fail"

if ($fail -gt 0 -and -not $WarnOnly) {
  Write-Host "[FAIL] $fail endpoint(s) could not be stamped. See above."
  exit 1
}

Write-Host "[PASS] transaction_function_type stamping complete."
