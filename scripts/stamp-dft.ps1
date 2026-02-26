#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Bulk-stamp data_function_type (ILF/EIF) on all Cosmos containers.
  F37-10-002 -- IFPUG FPA classification for Function Point estimation.

.DESCRIPTION
  ILF  Internal Logical File  : data created and maintained by this application
  EIF  External Interface File : data maintained by an external app, only read here

  Classification rules applied:
    jobs                -- ILF  (ingest jobs created/owned by eva-brain-api)
    extracted_content   -- ILF  (text extracted by brain from documents)
    chunks              -- ILF  (document chunks created by brain indexing pipeline)
    audit_logs          -- ILF  (audit events written by brain)
    content_access_logs -- ILF  (content access events written by brain)
    sessions            -- ILF  (conversation sessions owned by brain)
    messages            -- ILF  (chat messages within sessions)
    scrum-cache         -- ILF  (brain writes/maintains ADO cache)
    config              -- ILF  (app configuration maintained by brain)
    apps                -- ILF  (application registry maintained by brain)
    model_objects       -- EIF  (maintained by 37-data-model API, read by brain/faces)
    translations        -- ILF  (i18n keys maintained by brain config service)
    content_logs        -- ILF  (content access log maintained by brain)

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
# 12 ILF + 1 EIF (model_objects is maintained by 37-data-model, referenced externally)

$DFT_MAP = @{
  "jobs"                = "ILF"
  "extracted_content"   = "ILF"
  "chunks"              = "ILF"
  "audit_logs"          = "ILF"
  "content_access_logs" = "ILF"
  "sessions"            = "ILF"
  "messages"            = "ILF"
  "scrum-cache"         = "ILF"
  "config"              = "ILF"
  "apps"                = "ILF"
  "model_objects"       = "EIF"
  "translations"        = "ILF"
  "content_logs"        = "ILF"
}

$ilf = @($DFT_MAP.GetEnumerator() | Where-Object { $_.Value -eq "ILF" }).Count
$eif = @($DFT_MAP.GetEnumerator() | Where-Object { $_.Value -eq "EIF" }).Count
Write-Host "[INFO] Classification: ILF=$ilf EIF=$eif Total=$($DFT_MAP.Count)"

if ($DryRun) {
  Write-Host "[DRY-RUN] Classifications:"
  $DFT_MAP.GetEnumerator() | Sort-Object Value,Name | ForEach-Object {
    Write-Host "  $($_.Value)  $($_.Name)"
  }
  Write-Host "[DRY-RUN] Done. No writes."
  exit 0
}

# ── Bulk PUT ──────────────────────────────────────────────────────────────────
$ok = 0; $fail = 0; $skip = 0

foreach ($entry in $DFT_MAP.GetEnumerator()) {
  $id = $entry.Name
  $dft = $entry.Value

  try {
    $ctr = Invoke-RestMethod "$Base/model/containers/$id" -TimeoutSec 10

    $existing = [string]($ctr.PSObject.Properties['data_function_type']?.Value)
    if ($existing -eq $dft) { $skip++; continue }

    $prev_rv = $ctr.row_version
    $body = $ctr | Select-Object * -ExcludeProperty layer,modified_by,modified_at,created_by,created_at,row_version,source_file
    $body | Add-Member -Force -NotePropertyName data_function_type -NotePropertyValue $dft
    $json = $body | ConvertTo-Json -Depth 10

    $r = Invoke-RestMethod "$Base/model/containers/$id" `
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
  Write-Host "[FAIL] $fail container(s) could not be stamped. See above."
  exit 1
}

Write-Host "[PASS] data_function_type stamping complete."
