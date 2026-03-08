#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Comprehensive L01-L51 Layer Audit - Systematic testing of all EVA Data Model endpoints

.DESCRIPTION
  Tests all 51 operational layers systematically:
  - Endpoint availability (HTTP 200)
  - Data count per layer  - FK relationship validation where applicable
  - Performance metrics (response time)
  - Agent-guide introspection verification

  Based on: docs/architecture/AGENT-EXPERIENCE-AUDIT.md

.PARAMETER BaseUrl
  API base URL (default: cloud production endpoint)

.PARAMETER OutputFormat
  Output format: table|json|markdown (default: table)

.PARAMETER TestFK
  Enable FK relationship testing (requires sample data)

.EXAMPLE
  .\comprehensive-layer-audit.ps1
  # Full audit with table output

.EXAMPLE
  .\comprehensive-layer-audit.ps1 -OutputFormat json -TestFK
  # JSON output with FK testing
#>

param(
  [string]$BaseUrl = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",
  [ValidateSet("table", "json", "markdown")]
  [string]$OutputFormat = "table",
  [switch]$TestFK
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# ─────────────────────────────────────────────────────────────────────────────
# Layer Definitions (L01-L51)
# ─────────────────────────────────────────────────────────────────────────────

$allLayers = @(
  # L01-L11: Project & Evidence Plane
  [PSCustomObject]@{Number=1; Name="projects"; Priority="P0"; Description="Project catalog"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=2; Name="sprints"; Priority="P0"; Description="Sprint tracking"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=3; Name="stories"; Priority="P1"; Description="User stories (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=4; Name="tasks"; Priority="P1"; Description="Task breakdown (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=5; Name="evidence"; Priority="P0"; Description="Proof artifacts"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=6; Name="coverage_summary"; Priority="P1"; Description="Test coverage (stub)"; Operational=$false; FK=$null}
  
  # L07-L11: Architecture & Tech Stack
  [PSCustomObject]@{Number=7; Name="services"; Priority="P0"; Description="Service catalog"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=8; Name="repos"; Priority="P1"; Description="Repository registry (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=9; Name="tech_stack"; Priority="P1"; Description="Technology inventory (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=10; Name="architecture_decisions"; Priority="P1"; Description="ADRs (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=11; Name="endpoints"; Priority="P0"; Description="API endpoints"; Operational=$true; FK=$null}
  
  # L12-L16: API & Deployment
  [PSCustomObject]@{Number=12; Name="api_contracts"; Priority="P1"; Description="API contracts (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=13; Name="request_response_samples"; Priority="P1"; Description="API samples (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=14; Name="deployment_targets"; Priority="P1"; Description="Deploy targets (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=15; Name="ci_cd_pipelines"; Priority="P1"; Description="CI/CD config (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=16; Name="deployment_history"; Priority="P1"; Description="Deploy history (stub)"; Operational=$false; FK=$null}
  
  # L17-L20: Configuration Management
  [PSCustomObject]@{Number=17; Name="config_defs"; Priority="P1"; Description="Config definitions (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=18; Name="runtime_config"; Priority="P1"; Description="Runtime config (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=19; Name="secrets_catalog"; Priority="P1"; Description="Secrets catalog (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=20; Name="env_vars"; Priority="P1"; Description="Env variables (stub)"; Operational=$false; FK=$null}
  
  # L21-L26: Agentic Workflows
  [PSCustomObject]@{Number=21; Name="prompts"; Priority="P0"; Description="Prompt catalog"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=22; Name="personas"; Priority="P0"; Description="Agent personas"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=23; Name="instructions"; Priority="P1"; Description="Agent instructions (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=24; Name="agentic_workflows"; Priority="P1"; Description="Workflow definitions (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=25; Name="session_transcripts"; Priority="P1"; Description="Session logs (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=26; Name="workflow_metrics"; Priority="P1"; Description="Workflow metrics (stub)"; Operational=$false; FK=$null}
  
  # L27-L29: Observability
  [PSCustomObject]@{Number=27; Name="error_catalog"; Priority="P1"; Description="Error taxonomy (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=28; Name="model_telemetry"; Priority="P1"; Description="Model telemetry (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=29; Name="cost_tracking"; Priority="P1"; Description="Cost tracking (stub)"; Operational=$false; FK=$null}
  
  # L30-L31: Evidence Correlation
  [PSCustomObject]@{Number=30; Name="evidence_correlation"; Priority="P1"; Description="Evidence links (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=31; Name="decision_provenance"; Priority="P1"; Description="Decision provenance (stub)"; Operational=$false; FK=$null}
  
  # L32-L35: Governance (Session 28)
  [PSCustomObject]@{Number=32; Name="agent_policies"; Priority="P2"; Description="Agent policies (Session 28)"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=33; Name="quality_gates"; Priority="P2"; Description="Quality gates (Session 28)"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=34; Name="github_rules"; Priority="P2"; Description="GitHub rules (Session 28)"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=35; Name="verification_records"; Priority="P2"; Description="Verification records (stub)"; Operational=$false; FK=$null}
  
  # L36-L39: Deployment & Testing
  [PSCustomObject]@{Number=36; Name="deployment_policies"; Priority="P2"; Description="Deployment policies"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=37; Name="runbooks"; Priority="P2"; Description="Runbook catalog"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=38; Name="test_cases"; Priority="P2"; Description="Test case registry (stub)"; Operational=$false; FK=$null}
  [PSCustomObject]@{Number=39; Name="synthetic_tests"; Priority="P2"; Description="Synthetic tests (stub)"; Operational=$false; FK=$null}
  
  # L40-L47: Infrastructure Monitoring (Priority #3)
  [PSCustomObject]@{Number=40; Name="agent_performance_metrics"; Priority="P3"; Description="Agent metrics (Priority #3)"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=41; Name="service_health_metrics"; Priority="P3"; Description="Service health (Priority #3)"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=42; Name="resource_inventory"; Priority="P3"; Description="Resource inventory (Priority #3)"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=43; Name="usage_metrics"; Priority="P3"; Description="Usage metrics (Priority #3)"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=44; Name="cost_allocation"; Priority="P3"; Description="Cost allocation (Priority #3)"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=45; Name="infrastructure_events"; Priority="P3"; Description="Infra events (Priority #3)"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=46; Name="agent_execution_history"; Priority="P3"; Description="Agent execution (Priority #3)"; Operational=$true; FK=$null}
  [PSCustomObject]@{Number=47; Name="resource_costs"; Priority="P3"; Description="Resource costs (Priority #3)"; Operational=$true; FK=$null}
  
  # L48-L51: Automated Remediation (Priority #4 - Session 40)
  [PSCustomObject]@{Number=48; Name="remediation_policies"; Priority="P4"; Description="Remediation policies (Session 40)"; Operational=$true; FK=@("agent_policies", "deployment_policies")}
  [PSCustomObject]@{Number=49; Name="auto_fix_execution_history"; Priority="P4"; Description="Auto-fix history (Session 40)"; Operational=$true; FK=@("remediation_policies", "agent_performance_metrics", "agent_execution_history", "decision_provenance")}
  [PSCustomObject]@{Number=50; Name="remediation_outcomes"; Priority="P4"; Description="Remediation outcomes (Session 40)"; Operational=$true; FK=@("auto_fix_execution_history")}
  [PSCustomObject]@{Number=51; Name="remediation_effectiveness"; Priority="P4"; Description="Effectiveness metrics (Session 40)"; Operational=$true; FK=@("remediation_policies", "agent_performance_metrics")}
)

# ─────────────────────────────────────────────────────────────────────────────
# Test Functions
# ─────────────────────────────────────────────────────────────────────────────

function Test-LayerEndpoint {
  param(
    [Parameter(Mandatory)]
    [PSCustomObject]$Layer,
    
    [Parameter(Mandatory)]
    [string]$BaseUrl
  )
  
  $url = "$BaseUrl/model/$($Layer.Name)/"
  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  
  try {
    $response = Invoke-RestMethod $url -Method GET -TimeoutSec 10 -ErrorAction Stop
    $stopwatch.Stop()
    
    [PSCustomObject]@{
      Number = $Layer.Number
      Layer = $Layer.Name
      Status = "✓"
      Count = $response.data.Count
      ResponseTime = "$($stopwatch.ElapsedMilliseconds)ms"
      Priority = $Layer.Priority
      Operational = if ($Layer.Operational) { "Yes" } else { "No" }
      FK = if ($Layer.FK) { $Layer.FK -join ", " } else { "-" }
      Error = $null
    }
  }
  catch {
    $stopwatch.Stop()
    
    [PSCustomObject]@{
      Number = $Layer.Number
      Layer = $Layer.Name
      Status = "✗"
      Count = "FAIL"
      ResponseTime = "$($stopwatch.ElapsedMilliseconds)ms"
      Priority = $Layer.Priority
      Operational = if ($Layer.Operational) { "Yes" } else { "No" }
      FK = if ($Layer.FK) { $Layer.FK -join ", " } else { "-" }
      Error = $_.Exception.Message
    }
  }
}

function Test-ForeignKeyRelationship {
  param(
    [Parameter(Mandatory)]
    [string]$SourceLayer,
    
    [Parameter(Mandatory)]
    [string]$TargetLayer,
    
    [Parameter(Mandatory)]
    [string]$FKField,
    
    [Parameter(Mandatory)]
    [string]$BaseUrl
  )
  
  try {
    $sourceData = Invoke-RestMethod "$BaseUrl/model/$SourceLayer/" -TimeoutSec 5 -ErrorAction Stop
    
    if ($sourceData.data.Count -eq 0) {
      return [PSCustomObject]@{
        SourceLayer = $SourceLayer
        TargetLayer = $TargetLayer
        FKField = $FKField
        Status = "⚠"
        Result = "No data to test"
      }
    }
    
    $firstItem = $sourceData.data[0]
    $fkValue = $firstItem.$FKField
    
    if (-not $fkValue) {
      return [PSCustomObject]@{
        SourceLayer = $SourceLayer
        TargetLayer = $TargetLayer
        FKField = $FKField
        Status = "⚠"
        Result = "FK field null"
      }
    }
    
    # Try to resolve FK
    $targetItem = Invoke-RestMethod "$BaseUrl/model/$TargetLayer/$fkValue" -TimeoutSec 5 -ErrorAction Stop
    
    return [PSCustomObject]@{
      SourceLayer = $SourceLayer
      TargetLayer = $TargetLayer
      FKField = $FKField
      Status = "✓"
      Result = "Resolved: $($targetItem.id)"
    }
  }
  catch {
    return [PSCustomObject]@{
      SourceLayer = $SourceLayer
      TargetLayer = $TargetLayer
      FKField = $FKField
      Status = "✗"
      Result = $_.Exception.Message
    }
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# Main Audit
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " EVA Data Model - Comprehensive Layer Audit" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host " API:  $BaseUrl" -ForegroundColor Gray
Write-Host " Test: All 51 operational layers (L01-L51)" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Test 1: Introspection Endpoints
Write-Host "`n=== Test 1: Introspection & Discovery ===" -ForegroundColor Yellow

try {
  $guide = Invoke-RestMethod "$BaseUrl/model/agent-guide" -ErrorAction Stop
  Write-Host "✓ agent-guide: $($guide.layers_available.Count) layers available" -ForegroundColor Green
}
catch {
  Write-Host "✗ agent-guide: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

try {
  $health = Invoke-RestMethod "$BaseUrl/health" -ErrorAction Stop
  Write-Host "✓ health: $($health.status) - uptime $($health.uptime_seconds)s" -ForegroundColor Green
}
catch {
  Write-Host "✗ health: FAILED" -ForegroundColor Red
}

try {
  $ready = Invoke-RestMethod "$BaseUrl/ready" -ErrorAction Stop
  Write-Host "✓ ready: store_reachable=$($ready.store_reachable)" -ForegroundColor Green
}
catch {
  Write-Host "✗ ready: FAILED" -ForegroundColor Red
}

# Test 2: All Layer Endpoints
Write-Host "`n=== Test 2: Layer Endpoint Availability (L01-L51) ===" -ForegroundColor Yellow
Write-Host "Testing all 51 layers..." -ForegroundColor Gray

$results = @()
foreach ($layer in $allLayers) {
  $results += Test-LayerEndpoint -Layer $layer -BaseUrl $BaseUrl
  Write-Host "." -NoNewline -ForegroundColor Gray
}
Write-Host "`n"

# Statistics
$total = $results.Count
$available = ($results | Where-Object { $_.Status -eq "✓" }).Count
$failed = ($results | Where-Object { $_.Status -eq "✗" }).Count
$operational = ($results | Where-Object { $_.Operational -eq "Yes" }).Count
$withData = ($results | Where-Object { $_.Status -eq "✓" -and [int]$_.Count -gt 0 }).Count

Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Total layers:       $total" -ForegroundColor White
Write-Host "  Available (HTTP 200): $available" -ForegroundColor Green
Write-Host "  Failed (HTTP 4xx/5xx): $failed" -ForegroundColor Red
Write-Host "  Operational:        $operational" -ForegroundColor Green
Write-Host "  With data (count > 0): $withData" -ForegroundColor Yellow

# Test 3: Session 40 L48-L51 Verification
Write-Host "`n=== Test 3: Session 40 L48-L51 Verification ===" -ForegroundColor Yellow

$l48to51 = $results | Where-Object { $_.Number -ge 48  -and $_.Number -le 51 }
$l48to51Available = ($l48to51 | Where-Object { $_.Status -eq "✓" }).Count
$l48to51WithData = ($l48to51 | Where-Object { $_.Status -eq "✓" -and [int]$_.Count -gt 0 }).Count

if ($l48to51Available -eq 4) {
  Write-Host "✓ All 4 L48-L51 endpoints available" -ForegroundColor Green
}
else {
  Write-Host "✗ Only $l48to51Available/4 L48-L51 endpoints available" -ForegroundColor Red
}

if ($l48to51WithData -gt 0) {
  Write-Host "✓ $l48to51WithData/4 L48-L51 layers have data" -ForegroundColor Green
}
else {
  Write-Host "⚠ 0/4 L48-L51 layers have data (seed operation pending)" -ForegroundColor Yellow
}

# Test 4: FK Relationship Testing (if enabled)
if ($TestFK -and $withData -gt 0) {
  Write-Host "`n=== Test 4: Foreign Key Relationship Validation ===" -ForegroundColor Yellow
  
  $fkTests = @(
    [PSCustomObject]@{Source="auto_fix_execution_history"; Target="remediation_policies"; Field="policy_id"}
    [PSCustomObject]@{Source="auto_fix_execution_history"; Target="agent_performance_metrics"; Field="executor_agent_id"}
    [PSCustomObject]@{Source="remediation_outcomes"; Target="auto_fix_execution_history"; Field="execution_id"}
  )
  
  $fkResults = @()
  foreach ($test in $fkTests) {
    $fkResults += Test-ForeignKeyRelationship `
      -SourceLayer $test.Source `
      -TargetLayer $test.Target `
      -FKField $test.Field `
      -BaseUrl $BaseUrl
  }
  
  $fkResults | Format-Table -AutoSize
}

# Output Results
Write-Host "`n=== Full Audit Results ===" -ForegroundColor Yellow

switch ($OutputFormat) {
  "table" {
    $results | Format-Table -AutoSize
  }
  "json" {
    $results | ConvertTo-Json -Depth 3
  }
  "markdown" {
    # Markdown table output
    Write-Host "| # | Layer | Status | Count | Response | Priority | Operational | FK References |"
    Write-Host "|---|-------|--------|-------|----------|----------|-------------|---------------|"
    foreach ($r in $results) {
      Write-Host "| L$($r.Number.ToString().PadLeft(2,'0')) | $($r.Layer) | $($r.Status) | $($r.Count) | $($r.ResponseTime) | $($r.Priority) | $($r.Operational) | $($r.FK) |"
    }
  }
}

# Final Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " Audit Complete" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " ✓ Available: $available/$total layers" -ForegroundColor Green
Write-Host " ✓ Operational: $operational layers" -ForegroundColor Green
Write-Host " ⚠ With Data: $withData/$available layers" -ForegroundColor Yellow
if ($failed -gt 0) {
  Write-Host " ✗ Failed: $failed layers" -ForegroundColor Red
}
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Return results for programmatic use
return $results
