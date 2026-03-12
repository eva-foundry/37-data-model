<#
.SYNOPSIS
  Bulk AI translation for literals layer (L17) with API upsert.

.DESCRIPTION
  - Discovers literal keys from existing literals API + UI useLiterals()/t() usage.
  - Uses AI model to generate EN/FR/ES/DE/PT in batches.
  - Upserts full records via PUT /model/literals/{id}.
  - Writes logs and evidence artifacts.

.NOTES
  Requires OPENAI_API_KEY env var OR -OpenAIKey parameter.
#>

[CmdletBinding()]
param(
  [string]$BaseUrl = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",
  [string]$OpenAIKey = "",
  [string]$OpenAIModel = "gpt-4o-mini",
  [int]$BatchSize = 25,
  [switch]$DryRun,
  [int]$MaxItems = 0
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$logsDir = Join-Path $repoRoot "logs"
$evidenceDir = Join-Path $repoRoot "evidence"
$debugDir = Join-Path $repoRoot "debug"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null
New-Item -ItemType Directory -Force -Path $debugDir | Out-Null

$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = Join-Path $logsDir "translate-literals-ai_$ts.log"
$evidenceFile = Join-Path $evidenceDir "translate-literals-ai_$ts.json"
$errorFile = Join-Path $evidenceDir "translate-literals-ai-error_$ts.json"

function Write-Log {
  param(
    [string]$Message,
    [ValidateSet("INFO","PASS","FAIL","ERROR")]
    [string]$Level = "INFO"
  )
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$Level] $Message"
  $line | Out-File -FilePath $logFile -Append -Encoding ascii
  switch ($Level) {
    "PASS" { Write-Host "[PASS] $Message" -ForegroundColor Green }
    "FAIL" { Write-Host "[FAIL] $Message" -ForegroundColor Red }
    "ERROR" { Write-Host "[ERROR] $Message" -ForegroundColor Red }
    default { Write-Host "[INFO] $Message" }
  }
}

function To-Hashtable {
  param([object]$InputObject)
  if ($null -eq $InputObject) { return @{} }
  if ($InputObject -is [hashtable]) { return $InputObject }
  return ($InputObject | ConvertTo-Json -Depth 20 | ConvertFrom-Json -AsHashtable)
}

function Get-UiLiteralKeys {
  param([string]$UiSrc)

  $keys = [System.Collections.Generic.HashSet[string]]::new()
  $files = Get-ChildItem -Path $UiSrc -Recurse -File -Include *.ts,*.tsx

  foreach ($file in $files) {
    if ($file.FullName -match "src-backup|test-output|node_modules") { continue }

    $content = Get-Content $file.FullName -Raw
    $scopeMatch = [regex]::Match($content, 'useLiterals\(\s*[''\"]([^''\"]+)[''\"]\s*\)')
    $scope = if ($scopeMatch.Success) { $scopeMatch.Groups[1].Value } else { "" }

    $tmatches = [regex]::Matches($content, '\bt\(\s*[''\"]([^''\"]+)[''\"]')
    foreach ($m in $tmatches) {
      $k = $m.Groups[1].Value.Trim()
      if (-not $k) { continue }
      if ($scope) {
        [void]$keys.Add("$scope.$k")
      }
      else {
        [void]$keys.Add($k)
      }
    }
  }

  return @($keys)
}

function Invoke-OpenAITranslationBatch {
  param(
    [array]$Items,
    [string]$ApiKey,
    [string]$Model
  )

  $payload = @{
    model = $Model
    temperature = 0.1
    response_format = @{ type = "json_object" }
    messages = @(
      @{
        role = "system"
        content = @"
You are a localization engine for UI literals.
Return strict JSON only with this shape:
{
  "translations": [
    {"key":"...","en":"...","fr":"...","es":"...","de":"...","pt":"..."}
  ]
}
Rules:
- Preserve placeholders like {name}, {{var}}, %s, and route tokens.
- Keep labels concise and UI-friendly.
- If source_en is empty, infer a clear English UI text from key.
- Do not add explanations.
"@
      },
      @{
        role = "user"
        content = ($Items | ConvertTo-Json -Depth 10 -Compress)
      }
    )
  }

  $headers = @{ "Authorization" = "Bearer $ApiKey"; "Content-Type" = "application/json" }
  $resp = Invoke-RestMethod -Method POST -Uri "https://api.openai.com/v1/chat/completions" -Headers $headers -Body ($payload | ConvertTo-Json -Depth 20)
  $jsonText = $resp.choices[0].message.content
  return ($jsonText | ConvertFrom-Json)
}

try {
  Write-Log "Pre-flight: health check $BaseUrl/health"
  $health = Invoke-RestMethod "$BaseUrl/health" -TimeoutSec 20
  if (-not $health) { throw "Health check returned empty response" }
  Write-Log "API reachable" "PASS"

  if (-not $OpenAIKey) {
    $OpenAIKey = $env:OPENAI_API_KEY
  }
  if (-not $OpenAIKey) {
    # Auto-load from Key Vault as last resort
    Write-Log "Attempting Key Vault auto-load for openai-api-key"
    try {
      $OpenAIKey = (az keyvault secret show --vault-name msubsandkv202603031449 --name openai-api-key --query value -o tsv 2>$null).Trim()
      if ($OpenAIKey) { Write-Log "Key Vault: openai-api-key loaded" "PASS" }
    } catch { $OpenAIKey = "" }
  }
  if (-not $OpenAIKey) {
    # Try azure-foundry-key as fallback model source
    Write-Log "Attempting Key Vault auto-load for azure-openai-key"
    try {
      $OpenAIKey = (az keyvault secret show --vault-name msubsandkv202603031449 --name azure-openai-key --query value -o tsv 2>$null).Trim()
      if ($OpenAIKey) { Write-Log "Key Vault: azure-openai-key loaded" "PASS" }
    } catch { $OpenAIKey = "" }
  }
  if (-not $OpenAIKey) {
    throw "OpenAI key missing. Set OPENAI_API_KEY, pass -OpenAIKey, or ensure az cli is logged in with Key Vault access."
  }

  Write-Log "Fetching literals from API"
  $rawExisting = Invoke-RestMethod "$BaseUrl/model/literals/" -TimeoutSec 60
  $existing = @()
  if ($rawExisting -is [System.Array]) {
    $existing = $rawExisting
  }
  elseif ($rawExisting.records -is [System.Array]) {
    $existing = $rawExisting.records
  }
  elseif ($rawExisting.items -is [System.Array]) {
    $existing = $rawExisting.items
  }
  elseif ($rawExisting.data -is [System.Array]) {
    $existing = $rawExisting.data
  }
  else {
    throw "Unexpected literals response shape; expected array or records/items envelope"
  }
  Write-Log "Fetched $($existing.Count) literal records" "PASS"

  $uiSrc = Join-Path $repoRoot "ui\src"
  $discoveredKeys = Get-UiLiteralKeys -UiSrc $uiSrc
  Write-Log "Discovered $($discoveredKeys.Count) literal keys from UI usage" "PASS"

  $byKey = @{}
  foreach ($obj in $existing) {
    $h = To-Hashtable $obj
    $k = if ($h.ContainsKey("key") -and $h.key) { [string]$h.key } else { [string]$h.id }
    if ($k) { $byKey[$k] = $h }
  }

  foreach ($k in $discoveredKeys) {
    if (-not $byKey.ContainsKey($k)) {
      $byKey[$k] = @{
        id = $k
        key = $k
        namespace = (($k -split "\\.")[0..([Math]::Max(0, ($k -split "\\.").Count - 2))] -join ".")
        layer = "literals"
        source_file = "api:translate-literals-ai"
        is_active = $true
      }
    }
  }

  $allKeys = @($byKey.Keys | Sort-Object)
  if ($MaxItems -gt 0) {
    $allKeys = $allKeys | Select-Object -First $MaxItems
    Write-Log "MaxItems applied: $MaxItems"
  }

  # Skip keys that already have complete translations in all 5 languages
  $langs = @('default_en','default_fr','default_es','default_de','default_pt')
  $incomplete = $allKeys | Where-Object {
    $o = $byKey[$_]
    $missing = $langs | Where-Object { -not ($o.ContainsKey($_) -and $o[$_]) }
    $missing.Count -gt 0
  }
  $skipped = $allKeys.Count - @($incomplete).Count
  $allKeys = @($incomplete)
  Write-Log "Skipping $skipped already-complete translations"
  Write-Log "Total keys to translate: $($allKeys.Count)"

  $translated = @{}
  for ($i = 0; $i -lt $allKeys.Count; $i += $BatchSize) {
    $batchKeys = $allKeys[$i..([Math]::Min($i + $BatchSize - 1, $allKeys.Count - 1))]
    $items = @()
    foreach ($k in $batchKeys) {
      $o = $byKey[$k]
      $en = ""
      if ($o.ContainsKey("default_en") -and $o.default_en) { $en = [string]$o.default_en }
      elseif ($o.ContainsKey("en") -and $o.en) { $en = [string]$o.en }
      $items += @{ key = $k; source_en = $en }
    }

    Write-Log "Translating batch $($i + 1)-$([Math]::Min($i + $BatchSize, $allKeys.Count))"
    $result = Invoke-OpenAITranslationBatch -Items $items -ApiKey $OpenAIKey -Model $OpenAIModel

    foreach ($t in $result.translations) {
      $translated[$t.key] = $t
    }
  }

  Write-Log "Translated keys returned: $($translated.Count)" "PASS"

  $success = 0
  $failed = 0
  $failures = @()

  foreach ($k in $allKeys) {
    if (-not $translated.ContainsKey($k)) {
      $failed++
      $failures += @{ key = $k; error = "missing translation result" }
      continue
    }

    $record = To-Hashtable $byKey[$k]
    $t = $translated[$k]

    $record.id = $k
    $record.key = $k
    $record.default_en = [string]$t.en
    $record.default_fr = [string]$t.fr
    $record.default_es = [string]$t.es
    $record.default_de = [string]$t.de
    $record.default_pt = [string]$t.pt

    # Backward compatibility fields consumed by some older views
    $record.en = [string]$t.en
    $record.fr = [string]$t.fr

    if ($DryRun) {
      $success++
      continue
    }

    try {
      $idEscaped = [uri]::EscapeDataString($k)
      Invoke-RestMethod -Method PUT -Uri "$BaseUrl/model/literals/$idEscaped" -ContentType "application/json" -Body ($record | ConvertTo-Json -Depth 20) -TimeoutSec 60 | Out-Null
      $success++
    }
    catch {
      $failed++
      $failures += @{ key = $k; error = $_.Exception.Message }
    }
  }

  $evidence = @{
    timestamp = (Get-Date).ToString("o")
    operation = "translate-literals-ai"
    status = if ($failed -eq 0) { "success" } else { "partial" }
    base_url = $BaseUrl
    model = $OpenAIModel
    dry_run = [bool]$DryRun
    metrics = @{
      total_keys = $allKeys.Count
      translated_results = $translated.Count
      upsert_success = $success
      upsert_failed = $failed
    }
    sample_keys = ($allKeys | Select-Object -First 20)
    failures = $failures
  }

  ($evidence | ConvertTo-Json -Depth 20) | Out-File -FilePath $evidenceFile -Encoding ascii
  Write-Log "Evidence written: $evidenceFile" "PASS"

  if ($failed -gt 0) {
    Write-Log "Completed with failures: $failed" "FAIL"
    exit 1
  }

  Write-Log "Completed successfully. Updated $success literals." "PASS"
  exit 0
}
catch {
  $err = @{
    timestamp = (Get-Date).ToString("o")
    operation = "translate-literals-ai"
    status = "error"
    error_type = $_.Exception.GetType().FullName
    message = $_.Exception.Message
    stack = $_.ScriptStackTrace
  }
  ($err | ConvertTo-Json -Depth 10) | Out-File -FilePath $errorFile -Encoding ascii
  Write-Log "Unhandled error: $($_.Exception.Message)" "ERROR"
  Write-Log "Error evidence written: $errorFile" "ERROR"
  exit 2
}
