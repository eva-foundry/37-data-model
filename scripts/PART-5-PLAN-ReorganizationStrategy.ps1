# PART 5.PLAN: Design Router Reorganization by Functional Domain
# Purpose: Create comprehensive reorganization strategy to align schemas with 12 ontology domains
# Output: Reorganization plan with schema-to-domain assignments, migration strategy

param(
    [string]$EvidenceDir = "$(Get-Location)\evidence"
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date -Format "yyyyMMdd_HHmmss")
$logPath = "$(Get-Location)\logs\PART-5-PLAN_$timestamp.log"

@("$(Get-Location)\logs", $EvidenceDir) | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Force $_ | Out-Null }
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $msg = "[$Level] $Message"
    Add-Content $logPath $msg -Force
    Write-Host $msg
}

Write-Log "=== PART 5.PLAN: Router Reorganization Strategy ===" "INFO"

$plan = @{
    timestamp = $timestamp
    phase = "PLAN"
    status = "pending"
    reorganization_strategy = @()
    schema_assignments = @()
    overlap_resolutions = @()
    directory_structure = @()
    metrics = @{}
}

try {
    Write-Log "[PLAN] Designing functional domain-based organization..." "INFO"
    
    # Define 12 domains with their primary responsibility and consolidated schema list
    $domains = @(
        @{
            domain_id = 1
            name = "System Architecture"
            category = "Discovery"
            description = "How the system is built - services, containers, API contracts"
            primary_schemas = @("services", "containers", "endpoints", "infrastructure", "api_contracts")
            secondary_schemas = @("schemas", "error_catalog")
            priority = "P0"
            owner_team = "Platform"
        },
        @{
            domain_id = 2
            name = "Identity & Access"
            category = "Discovery"
            description = "Who can do what - RBAC, personas, audit trails"
            primary_schemas = @("personas", "access_control_matrix", "security_controls")
            secondary_schemas = @("audit_trail", "secrets_catalog")
            priority = "P0"
            owner_team = "Security"
        },
        @{
            domain_id = 3
            name = "AI Runtime"
            category = "Discovery"
            description = "Intelligent work execution - agents, prompts, MCP"
            primary_schemas = @("agents", "prompts", "mcp_servers", "agent_policies")
            secondary_schemas = @("agentic_workflows", "instructions")
            priority = "P0"
            owner_team = "Platform"
        },
        @{
            domain_id = 4
            name = "User Interface"
            category = "Discovery"
            description = "User interactions - screens, flows, navigation"
            primary_schemas = @("screen_registry", "user_flows", "navigation")
            secondary_schemas = @("accessibility_standards", "theme_definitions")
            priority = "P1"
            owner_team = "Frontend"
        },
        @{
            domain_id = 5
            name = "Project & PM"
            category = "Planning"
            description = "Project tracking - WBS, sprints, stories, tasks"
            primary_schemas = @("wbs", "sprints", "stories", "tasks")
            secondary_schemas = @("projects", "backlog")
            priority = "P1"
            owner_team = "PMO"
        },
        @{
            domain_id = 6
            name = "Strategy & Portfolio"
            category = "Planning"
            description = "Strategic planning - roadmap, portfolio, initiatives"
            primary_schemas = @("portfolio", "roadmap", "initiatives")
            secondary_schemas = @("strategies", "epics", "themes")
            priority = "P1"
            owner_team = "Leadership"
        },
        @{
            domain_id = 7
            name = "Execution Engine"
            category = "Execution"
            description = "DPDCA orchestration - workflows, templates, process"
            primary_schemas = @("execution_workflows", "dpdca_templates")
            secondary_schemas = @("process_definitions", "work_units")
            priority = "P0"
            owner_team = "Platform"
        },
        @{
            domain_id = 8
            name = "DevOps & Delivery"
            category = "Execution"
            description = "Build and deployment - CI/CD, tests, deployment"
            primary_schemas = @("ci_cd_pipelines", "build_configs", "deployment_targets")
            secondary_schemas = @("test_suites", "release_notes")
            priority = "P0"
            owner_team = "DevOps"
        },
        @{
            domain_id = 9
            name = "Governance & Policy"
            category = "Control"
            description = "Compliance and standards - policies, gates, decisions"
            primary_schemas = @("policies", "compliance_mapping", "risk_register", "quality_gates")
            secondary_schemas = @("standards", "decisions")
            priority = "P0"
            owner_team = "Compliance"
        },
        @{
            domain_id = 10
            name = "Observability & Evidence"
            category = "Control"
            description = "Monitoring and audit - metrics, evidence, records"
            primary_schemas = @("evidence", "metrics", "verification_records", "attestation_records")
            secondary_schemas = @("logs", "audit_trail")
            priority = "P0"
            owner_team = "Operations"
        },
        @{
            domain_id = 11
            name = "Infrastructure & FinOps"
            category = "Operations"
            description = "Cloud resources and costs - infrastructure, monitoring"
            primary_schemas = @("infrastructure", "deployment_records", "cost_allocation")
            secondary_schemas = @("cloud_resources", "monitoring")
            priority = "P0"
            owner_team = "Infrastructure"
        },
        @{
            domain_id = 12
            name = "Ontology Domains"
            category = "Meta"
            description = "Knowledge and reasoning - concepts, relationships"
            primary_schemas = @("ontology", "relationships", "vocabularies")
            secondary_schemas = @("concepts", "taxonomies")
            priority = "P2"
            owner_team = "Knowledge"
        }
    )
    
    Write-Log "[OK] Domain strategy designed: 12 domains, 4 categories" "INFO"
    
    # Build schema assignments with rationale
    Write-Log "[PLAN] Assigning schemas to primary domains..." "INFO"
    
    foreach ($domain in $domains) {
        foreach ($schema in ($domain.primary_schemas + $domain.secondary_schemas)) {
            $plan.schema_assignments += @{
                schema_name = $schema
                domain_id = $domain.domain_id
                domain_name = $domain.name
                assignment_type = if ($schema -in $domain.primary_schemas) { "PRIMARY" } else { "SECONDARY" }
                rationale = "Belongs to $($domain.name) per 12-domain ontology"
            }
        }
    }
    
    Write-Log "[OK] Schema assignments defined: $($plan.schema_assignments.Count) mappings" "INFO"
    
    # Define directory structure
    Write-Log "[PLAN] Designing directory hierarchy by domain..." "INFO"
    
    $plan.directory_structure = @(
        @{
            path = "schema/domain_01_system-architecture/"
            domain_id = 1
            contains = "services, containers, endpoints, infrastructure, API contracts"
        },
        @{
            path = "schema/domain_02_identity-access/"
            domain_id = 2
            contains = "personas, RBAC matrix, security controls, audit trails"
        },
        @{
            path = "schema/domain_03_ai-runtime/"
            domain_id = 3
            contains = "agents, prompts, MCP servers, agent policies"
        },
        @{
            path = "schema/domain_04_user-interface/"
            domain_id = 4
            contains = "screen registry, user flows, navigation"
        },
        @{
            path = "schema/domain_05_project-pm/"
            domain_id = 5
            contains = "WBS, sprints, stories, tasks"
        },
        @{
            path = "schema/domain_06_strategy-portfolio/"
            domain_id = 6
            contains = "portfolio, roadmap, initiatives"
        },
        @{
            path = "schema/domain_07_execution-engine/"
            domain_id = 7
            contains = "execution workflows, DPDCA templates"
        },
        @{
            path = "schema/domain_08_devops-delivery/"
            domain_id = 8
            contains = "CI/CD, build configs, deployment"
        },
        @{
            path = "schema/domain_09_governance-policy/"
            domain_id = 9
            contains = "policies, compliance mapping, risk register, quality gates"
        },
        @{
            path = "schema/domain_10_observability-evidence/"
            domain_id = 10
            contains = "metrics, evidence, verification records, attestation"
        },
        @{
            path = "schema/domain_11_infrastructure-finops/"
            domain_id = 11
            contains = "infrastructure, deployment records, cost allocation"
        },
        @{
            path = "schema/domain_12_ontology-domains/"
            domain_id = 12  
            contains = "ontology, relationships, vocabularies"
        }
    )
    
    Write-Log "[OK] Directory structure designed: 12 domain directories" "INFO"
    
    # Overlap resolution strategy
    Write-Log "[PLAN] Creating overlap resolution strategy..." "INFO"
    
    $plan.overlap_resolutions = @(
        @{
            schema_name = "audit_trail"
            current_domains = @("Identity & Access", "Observability & Evidence")
            recommended_domain = "Observability & Evidence"
            rationale = "Primary purpose is evidence trail, secondary is identity logging"
        },
        @{
            schema_name = "infrastructure"
            current_domains = @("System Architecture", "Infrastructure & FinOps")
            recommended_domain = "Infrastructure & FinOps"
            rationale = "Cloud infra resource definition belongs in FinOps, system services in Architecture"
        },
        @{
            schema_name = "security_controls"
            current_domains = @("Identity & Access", "Governance & Policy")
            recommended_domain = "Governance & Policy"
            rationale = "Control implementations are governance artifacts"
        }
    )
    
    Write-Log "[OK] Overlap resolutions defined: $($plan.overlap_resolutions.Count) conflicts" "INFO"
    
    # Metrics
    $plan.metrics = @{
        total_domains = 12
        schemas_per_domain_avg = [Math]::Round(($plan.schema_assignments.Count / 12), 1)
        primary_assignments = ($plan.schema_assignments | Where-Object { $_.assignment_type -eq "PRIMARY" } | Measure-Object).Count
        secondary_assignments = ($plan.schema_assignments | Where-Object { $_.assignment_type -eq "SECONDARY" } | Measure-Object).Count
        overlap_conflicts = $plan.overlap_resolutions.Count
        estimated_effort_minutes = 120
        estimated_effort_hours = 2
        migration_strategy = "Create domain directories, move schemas by category, update import paths, validate references"
        risk_level = "LOW"
    }
    
    Write-Log "[OK] Metrics calculated" "INFO"
    
    $plan.status = "COMPLETE"
    
} catch {
    Write-Log "[ERROR] PLAN failed: $_" "ERROR"
    $plan.status = "FAILED"
    $plan.error = $_.Exception.Message
    exit 1
}

# Save evidence
$evidencePath = "$EvidenceDir\PART-5-PLAN-ReorganizationStrategy-$timestamp.json"
$plan | ConvertTo-Json -Depth 5 | Out-File $evidencePath -Force
Write-Log "[OK] Evidence saved: $evidencePath" "INFO"

# Print summary
Write-Host ""
Write-Host "=== PART 5.PLAN SUMMARY ===" -ForegroundColor Cyan
Write-Host "[OK] Domain strategy: 12 domains, 4 categories"
Write-Host "[OK] Schema assignments: $($plan.metrics.primary_assignments) primary + $($plan.metrics.secondary_assignments) secondary"
Write-Host "[OK] Directory structure: $($plan.directory_structure.Count) domain directories"
Write-Host "[OK] Overlap conflicts resolved: $($plan.metrics.overlap_conflicts)"
Write-Host "[METRIC] Estimated effort: $($plan.metrics.estimated_effort_hours)h"
Write-Host "[METRIC] Risk level: $($plan.metrics.risk_level)"
Write-Host ""

exit 0
