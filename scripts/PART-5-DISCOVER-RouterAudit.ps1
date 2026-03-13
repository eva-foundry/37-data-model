# PART 5.DISCOVER: Audit Current Router Organization
# Purpose: Analyze existing router structure and map to functional domains
# Output: Router inventory, domain mapping, reorganization opportunities

param(
    [string]$SchemaDir = "$(Get-Location)\schema",
    [string]$DocsDir = "$(Get-Location)\docs",
    [string]$EvidenceDir = "$(Get-Location)\evidence"
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date -Format "yyyyMMdd_HHmmss")
$logPath = "$(Get-Location)\logs\PART-5-DISCOVER_$timestamp.log"

# Ensure directories exist
@("$(Get-Location)\logs", $EvidenceDir) | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Force $_ | Out-Null }
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $msg = "[$Level] $Message"
    Add-Content $logPath $msg -Force
    Write-Host $msg
}

Write-Log "=== PART 5.DISCOVER: Router Organization Audit ===" "INFO"

# Initialize results
$audit = @{
    timestamp = $timestamp
    phase = "DISCOVER"
    status = "pending"
    schemas_inventoried = 0
    domains_identified = @{}
    router_mapping = @()
    organization_gaps = @()
    evidence_summary = @{}
}

try {
    Write-Log "[DISCOVER] Analyzing schema files as logical routers..." "INFO"
    
    # Get all schema files - these represent the "routers" (domain endpoints)
    $schemaDir = "$(Get-Location)\schema"
    $schemas = @()
    
    if (Test-Path $schemaDir) {
        $schemas = Get-ChildItem $schemaDir -Filter "*.schema.json" | ForEach-Object {
            try {
                $content = Get-Content $_.FullName | ConvertFrom-Json
                @{
                    file_name = $_.Name
                    schema_id = $content.'$id' -replace ".*/" -replace ".schema.json"
                    title = $content.title
                    description = $content.description
                    properties_count = @($content.properties.PSObject.Properties).Count
                    path = $_.FullName
                }
            }
            catch {
                Write-Log "[WARN] Failed to parse $($_.Name): $_" "WARN"
                $null
            }
        } | Where-Object { $_ } | Sort-Object schema_id
    }
    
    Write-Log "[OK] Schemas inventoried: $($schemas.Count)" "INFO"
    $audit.schemas_inventoried = $schemas.Count
    
    # Map schemas to 12 ontology domains
    Write-Log "[DISCOVER] Mapping schemas to 12 ontology domains..." "INFO"
    
    $domainMappings = @(
        @{
            domain_name = "System Architecture"
            domain_id = 1
            description = "How the system is built"
            expected_schemas = @("services", "containers", "endpoints", "schemas", "infrastructure", "eva_model", "api_contracts", "error_catalog")
        },
        @{
            domain_name = "Identity & Access"
            domain_id = 2
            description = "Who can do what"
            expected_schemas = @("personas", "security_controls", "secrets_catalog", "access_control_matrix", "audit_trail")
        },
        @{
            domain_name = "AI Runtime"
            domain_id = 3
            description = "Who performs intelligent work"
            expected_schemas = @("agents", "prompts", "mcp_servers", "agent_policies", "agentic_workflows", "instructions")
        },
        @{
            domain_name = "User Interface"
            domain_id = 4
            description = "How users interact"
            expected_schemas = @("screens", "screen_registry", "user_flows", "navigation", "accessibility_standards")
        },
        @{
            domain_name = "Project & PM"
            domain_id = 5
            description = "Planning and tracking"
            expected_schemas = @("projects", "wbs", "sprints", "stories", "tasks", "backlog")
        },
        @{
            domain_name = "Strategy & Portfolio"
            domain_id = 6
            description = "Portfolio planning and roadmap"
            expected_schemas = @("strategies", "roadmap", "portfolio", "initiatives", "epics", "themes")
        },
        @{
            domain_name = "Execution Engine"
            domain_id = 7
            description = "DPDCA execution and orchestration"
            expected_schemas = @("execution_workflows", "dpdca_templates", "process_definitions", "work_units")
        },
        @{
            domain_name = "DevOps & Delivery"
            domain_id = 8
            description = "Build, test, and deployment"
            expected_schemas = @("ci_cd_pipelines", "build_configs", "test_suites", "deployment_targets", "release_notes")
        },
        @{
            domain_name = "Governance & Policy"
            domain_id = 9
            description = "Rules, compliance, and standards"
            expected_schemas = @("policies", "standards", "compliance_mapping", "quality_gates", "risk_register", "decisions")
        },
        @{
            domain_name = "Observability & Evidence"
            domain_id = 10
            description = "Monitoring and audit trails"
            expected_schemas = @("evidence", "metrics", "logs", "verification_records", "attestation_records", "audit_trail")
        },
        @{
            domain_name = "Infrastructure & FinOps"
            domain_id = 11
            description = "Cloud resources and cost"
            expected_schemas = @("infrastructure", "cloud_resources", "cost_allocation", "deployment_records", "monitoring")
        },
        @{
            domain_name = "Ontology Domains"
            domain_id = 12
            description = "Knowledge and reasoning"
            expected_schemas = @("ontology", "concepts", "relationships", "vocabularies", "taxonomies")
        }
    )
    
    Write-Log "[OK] Domain definitions loaded: 12 domains" "INFO"
    
    # Match schemas to domains
    foreach ($domain in $domainMappings) {
        $matched = @()
        $missing = @()
        
        foreach ($expectedSchema in $domain.expected_schemas) {
            $found = $schemas | Where-Object {
                $_.schema_id -match $expectedSchema -or
                $_.title -match $expectedSchema -or
                $_.file_name -match $expectedSchema
            }
            
            if ($found) {
                $matched += $found
                Write-Log "[OK] Domain $($domain.domain_id) matched: $expectedSchema" "INFO"
            } else {
                $missing += $expectedSchema
            }
        }
        
        $domain | Add-Member -NotePropertyName matched_schemas -NotePropertyValue @($matched | Select-Object -Unique)
        $domain | Add-Member -NotePropertyName missing_schemas -NotePropertyValue $missing
        
        $audit.domains_identified[$domain.domain_name] = @{
            domain_id = $domain.domain_id
            matched = $matched.Count
            missing = $missing.Count
            coverage = if ($matched.Count -gt 0) { [Math]::Round(($matched.Count / ($matched.Count + $missing.Count)) * 100, 1) } else { 0 }
        }
    }
    
    Write-Log "[OK] Domain mapping complete" "INFO"
    
    # Build reorganization mapping
    Write-Log "[DISCOVER] Creating router reorganization mapping..." "INFO"
    
    $audit.router_mapping = $domainMappings | ForEach-Object {
        @{
            domain_id = $_.domain_id
            domain_name = $_.domain_name
            description = $_.description
            schemas = $_.matched_schemas
            schema_count = $_.matched_schemas.Count
            coverage_pct = $audit.domains_identified[$_.domain_name].coverage
        }
    }
    
    # Identify gaps
    Write-Log "[DISCOVER] Identifying organization gaps..." "INFO"
    
    $unmappedSchemas = $schemas | Where-Object {
        -not ($audit.router_mapping | Where-Object { $_.schemas | Where-Object { $_.schema_id -eq $_.schema_id } })
    }
    
    if ($unmappedSchemas) {
        Write-Log "[WARN] Unmapped schemas found: $($unmappedSchemas.Count)" "WARN"
        $audit.organization_gaps += @{
            gap_type = "unmapped_schemas"
            count = $unmappedSchemas.Count
            schemas = $unmappedSchemas
        }
    }
    
    # Check for schemas in multiple domains (should be unique)
    $duplicateMappings = @()
    foreach ($schema in $schemas) {
        $mappingCount = ($audit.router_mapping | Where-Object { $_.schemas | Where-Object { $_.schema_id -eq $schema.schema_id } } | Measure-Object).Count
        if ($mappingCount -gt 1) {
            $duplicateMappings += @{
                schema = $schema.schema_id
                domain_count = $mappingCount
            }
        }
    }
    
    if ($duplicateMappings) {
        Write-Log "[WARN] Schemas mapped to multiple domains: $($duplicateMappings.Count)" "WARN"
        $audit.organization_gaps += @{
            gap_type = "duplicate_mappings"
            count = $duplicateMappings.Count
            items = $duplicateMappings
        }
    }
    
    # Summary metrics
    Write-Log "[DISCOVER] Calculating summary metrics..." "INFO"
    
    $totalSchemasInMapping = ($audit.router_mapping | Measure-Object -Property schema_count -Sum | Select-Object -ExpandProperty Sum)
    $averageCoverage = [Math]::Round(($audit.router_mapping | Measure-Object -Property coverage_pct -Average | Select-Object -ExpandProperty Average), 1)
    $domainsWithFullCoverage = ($audit.router_mapping | Where-Object { $_.coverage_pct -eq 100 } | Measure-Object).Count
    
    $audit.evidence_summary = @{
        total_schemas = $audit.schemas_inventoried
        schemas_in_mapping = $totalSchemasInMapping
        unmapped_schemas = $unmappedSchemas.Count
        domains_with_full_coverage = $domainsWithFullCoverage
        average_domain_coverage = $averageCoverage
        duplicate_mappings = $duplicateMappings.Count
        organization_gaps = $audit.organization_gaps.Count
        readiness_for_reorganization = if ($unmappedSchemas.Count -eq 0 -and $duplicateMappings.Count -eq 0) { "READY" } else { "NEEDS_NORMALIZATION" }
    }
    
    Write-Log "[OK] Metrics calculated" "INFO"
    
    $audit.status = "COMPLETE"
    
} catch {
    Write-Log "[ERROR] DISCOVER failed: $_" "ERROR"
    $audit.status = "FAILED"
    $audit.error = $_.Exception.Message
    exit 1
}

# Save evidence
$evidencePath = "$EvidenceDir\PART-5-DISCOVER-RouterAudit-$timestamp.json"
$audit | ConvertTo-Json -Depth 5 | Out-File $evidencePath -Force
Write-Log "[OK] Evidence saved: $evidencePath" "INFO"

# Print summary
Write-Host ""
Write-Host "=== PART 5.DISCOVER SUMMARY ===" -ForegroundColor Cyan
Write-Host "[OK] Schemas inventoried: $($audit.schemas_inventoried)"
Write-Host "[OK] Domains identified: 12"
Write-Host "[OK] Domains with full coverage: $($audit.evidence_summary.domains_with_full_coverage)"
Write-Host "[METRIC] Average domain coverage: $($audit.evidence_summary.average_domain_coverage)%"
Write-Host "[WARN] Organization gaps: $($audit.evidence_summary.organization_gaps)"
Write-Host "[OK] Readiness: $($audit.evidence_summary.readiness_for_reorganization)"
Write-Host ""

exit 0
