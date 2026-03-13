# PART 1.DO.2: Layer Registration for L112-L121
# Purpose: Define layer objects for the 10 new P36-P58 security schemas
# Method: Create layer definitions + prepare Cosmos DB payloads

$schemaDir = "c:\eva-foundry\37-data-model\schema"
$evidenceDir = "c:\eva-foundry\37-data-model\evidence"
$docsDir = "c:\eva-foundry\37-data-model\docs\library"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$evidenceFile = Join-Path $evidenceDir "PART-1-LAYER-REGISTRATION-$timestamp.json"
$layerDefFile = Join-Path $docsDir "LAYER-DEFINITIONS-L112-L121.md"

Write-Host "[INFO] === PART 1.DO.2: Layer Registration ===" -ForegroundColor Cyan
Write-Host "[INFO] Creating layer objects for 10 security schemas (L112-L121)"
Write-Host "[INFO] Layer Definitions: $layerDefFile"
Write-Host ""

$results = @{
    timestamp = [datetime]::UtcNow.ToString("o")
    part = 1
    phase = "DO.2-LayerRegistration"
    layers_defined = 0
    payloads_created = 0
    layer_details = @()
    errors = @()
}

# Define the 10 layers with their metadata
$layerDefinitions = @(
    @{
        L = "L112"
        name = "red_team_test_suites"
        schema_file = "red_team_test_suite.schema.json"
        domain = "Domain 3 (AI Runtime) + Domain 6 (Governance)"
        purpose = "Promptfoo test pack: test cases, prompts, attack tactics, assertion rules, coverage mapping"
        parent_layers = @("L9/agents", "L21/prompts", "L36/agent_policies", "L22/security_controls")
        child_layers = @("L114/ai_security_findings")
        startup_seed_count = 2
        status = "operational"
    },
    @{
        L = "L113"
        name = "attack_tactic_catalog"
        schema_file = "attack_tactic_catalog.schema.json"
        domain = "Domain 6 (Governance)"
        purpose = "OWASP + ATLAS + NIST attack taxonomy (50+ attack types with framework mappings)"
        parent_layers = @("L22/security_controls")
        child_layers = @()
        startup_seed_count = 3
        status = "operational"
    },
    @{
        L = "L114"
        name = "ai_security_findings"
        schema_file = "ai_security_finding.schema.json"
        domain = "Domain 9 (Observability)"
        purpose = "Promptfoo evaluation output: per-test pass/fail, attack tactic, severity, framework mapping"
        parent_layers = @("L33/evidence", "L112/red_team_test_suites")
        child_layers = @()
        startup_seed_count = 1
        status = "operational"
    },
    @{
        L = "L115"
        name = "assertions_catalog"
        schema_file = "assertions_catalog.schema.json"
        domain = "Domain 6 (Governance)"
        purpose = "Custom assertion definitions (is-bilingual, has-pii, latency-under-threshold, etc.)"
        parent_layers = @("L41/validation_rules")
        child_layers = @()
        startup_seed_count = 3
        status = "operational"
    },
    @{
        L = "L116"
        name = "ai_security_metrics"
        schema_file = "ai_security_metrics.schema.json"
        domain = "Domain 9 (Observability)"
        purpose = "Test suite KPIs: test_count, pass_rate, false_positive_count, coverage_by_framework, api_cost, duration"
        parent_layers = @("L43/agent_performance_metrics")
        child_layers = @()
        startup_seed_count = 1
        status = "operational"
    },
    @{
        L = "L117"
        name = "vulnerability_scan_results"
        schema_file = "vulnerability_scan_result.schema.json"
        domain = "Domain 8 (DevOps & Delivery)"
        purpose = "Network scan execution: scan_type (Nmap, Nessus, Azure Security Center), timestamp, target scope, host/service counts"
        parent_layers = @()
        child_layers = @("L118/infrastructure_cve_findings")
        startup_seed_count = 1
        status = "operational"
    },
    @{
        L = "L118"
        name = "infrastructure_cve_findings"
        schema_file = "cve_finding.schema.json"
        domain = "Domain 9 (Observability)"
        purpose = "CVE record: cve_id, cvss_score, cvss_vector, exploitability_score, affected_host, affected_port, affected_service, cpe_match, patch_availability"
        parent_layers = @("L117/vulnerability_scan_results")
        child_layers = @()
        startup_seed_count = 5
        status = "operational"
    },
    @{
        L = "L119"
        name = "risk_ranking_analysis"
        schema_file = "risk_ranking.schema.json"
        domain = "Domain 9 (Observability)"
        purpose = "Pareto analysis output: risk scores, percentile ranking, top_20_percent grouping, risk_reduction_potential"
        parent_layers = @("L118/infrastructure_cve_findings")
        child_layers = @()
        startup_seed_count = 1
        status = "operational"
    },
    @{
        L = "L120"
        name = "remediation_tasks"
        schema_file = "remediation_task.schema.json"
        domain = "Domain 7 (Project & PM)"
        purpose = "Fix actions: severity, assigned_to, due_date, sla_status, remediation_type, patches_available, runbooks"
        parent_layers = @("L27/wbs", "L29/tasks")
        child_layers = @()
        startup_seed_count = 3
        status = "operational"
    },
    @{
        L = "L121"
        name = "remediation_effectiveness_metrics"
        schema_file = "remediation_effectiveness.schema.json"
        domain = "Domain 9 (Observability)"
        purpose = "Progress tracking: findings_closed, risk_reduction_pct, sla_compliance_pct, velocity, backlog_size"
        parent_layers = @("L120/remediation_tasks")
        child_layers = @()
        startup_seed_count = 1
        status = "operational"
    }
)

Write-Host "[REGISTER] Defining 10 layers..." -ForegroundColor Yellow

$layers_markdown = @"
# Layer Definitions L112-L121
## P36 (Red-Teaming) + P58 (Infrastructure Vulnerability) Security Schemas

Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

This document defines the 10 new security layers for Projects 36 and 58.
All layers are deployed together as a unified Phase 1 deployment.

---

"@

$cosmos_payloads = @()

foreach ($layer in $layerDefinitions) {
    Write-Host -NoNewline "[LAYER] $($layer.L) $($layer.name) ... "
    
    try {
        # Verify schema file exists
        $schemaPath = Join-Path $schemaDir $layer.schema_file
        if (-not (Test-Path $schemaPath)) {
            throw "Schema file not found: $($layer.schema_file)"
        }
        
        $schema = Get-Content -Raw $schemaPath | ConvertFrom-Json
        
        # Build layer definition markdown
        $layers_markdown += @"
## $($layer.L): $($layer.name)

**Domain**: $($layer.domain)  
**Status**: $($layer.status)  
**Purpose**: $($layer.purpose)

### Schema
- **File**: $($layer.schema_file)
- **Title**: $($schema.title)
- **Description**: $($schema.description)

### Relationships
- **Parent Layers**: $($layer.parent_layers -join ', ')
- **Child Layers**: $($layer.child_layers -join ', ')
- **Startup Seed Count**: $($layer.startup_seed_count)

### Query Endpoints
- \`GET /model/$($layer.name)\` - List all objects
- \`GET /model/$($layer.name)/{id}\` - Get specific object
- \`POST /model/$($layer.name)\` - Create new object
- \`PUT /model/$($layer.name)/{id}\` - Update object
- \`DELETE /model/$($layer.name)/{id}\` - Delete object

### Cosmos DB Payload (Template)
\`\`\`json
{
  "layer_id": "$($layer.L)",
  "name": "$($layer.name)",
  "status": "$($layer.status)",
  "schema": {...},
  "created_at": "2026-03-12T{timestamp}Z"
}
\`\`\`

---

"@
        
        # Create Cosmos DB payload
        $payload = @{
            layer_id = $layer.L
            name = $layer.name
            schema_file = $layer.schema_file
            domain = $layer.domain
            status = $layer.status
            startup_seed_count = $layer.startup_seed_count
            parent_layers = $layer.parent_layers
            child_layers = $layer.child_layers
        }
        
        $cosmos_payloads += $payload
        $results.layers_defined += 1
        $results.payloads_created += 1
        
        $results.layer_details += @{
            layer_id = $layer.L
            name = $layer.name
            status = "PREPARED"
        }
        
        Write-Host "OK" -ForegroundColor Green
    } catch {
        Write-Host "ERROR" -ForegroundColor Red
        $results.errors += "$($layer.L): $($_.Exception.Message)"
    }
}

# Save layer definitions markdown
$layers_markdown | Out-File -Encoding utf8 -FilePath $layerDefFile
Write-Host ""
Write-Host "[SAVE] Layer definitions: $layerDefFile" -ForegroundColor Gray

# Save Cosmos payloads as JSON
$payloads_file = Join-Path $evidenceDir "PART-1-COSMOS-PAYLOADS-$timestamp.json"
$cosmos_payloads | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 -FilePath $payloads_file
Write-Host "[SAVE] Cosmos DB payloads: $payloads_file" -ForegroundColor Gray

Write-Host ""
Write-Host "[SUMMARY]" -ForegroundColor Cyan
Write-Host "  Layers Defined: $($results.layers_defined) / 10"
Write-Host "  Payloads Created: $($results.payloads_created) / 10"

if ($results.errors.Count -gt 0) {
    Write-Host "  Status: ERROR" -ForegroundColor Red
    $results.status = "ERROR"
    $results.exit_code = 1
    foreach ($error in $results.errors) {
        Write-Host "    - $error" -ForegroundColor Red
    }
} else {
    Write-Host "  Status: SUCCESS" -ForegroundColor Green
    $results.status = "SUCCESS"
    $results.exit_code = 0
}

# Save evidence
$results | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 -FilePath $evidenceFile
Write-Host ""
Write-Host "[EVIDENCE] Saved: $evidenceFile" -ForegroundColor Gray

exit $results.exit_code
