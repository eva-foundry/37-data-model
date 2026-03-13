# PART 4.PLAN: Design Documentation Remediation Strategy
# Purpose: Map 9 identified gaps to specific remediation actions per domain
# Output: Detailed plan with file checklist, API endpoint documentation, and schema completeness

param(
    [string]$EvidenceDir = "$(Get-Location)\evidence",
    [string]$DiscoverEvidenceFile = ""
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date -Format "yyyyMMdd_HHmmss")
$logPath = "$(Get-Location)\logs\PART-4-PLAN_$timestamp.log"

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

Write-Log "=== PART 4.PLAN: Documentation Remediation Strategy ===" "INFO"
Write-Log "Evidence Dir: $EvidenceDir" "INFO"

# Initialize plan object
$plan = @{
    timestamp = $timestamp
    phase = "PLAN"
    status = "pending"
    gap_count = 9
    remediation_items = @()
    documentation_artifacts = @()
    validation_checklist = @()
    metrics = @{}
}

try {
    Write-Log "[PLAN] Analyzing 9 critical gaps..." "INFO"
    
    # GAP 1-8: Missing security schemas (L112-L121)
    Write-Log "[PLAN] Domain 1: Complete missing PART 1 security schemas..." "INFO"
    
    $missingSchemas = @(
        @{
            id = "L112"
            name = "audit_trail"
            file = "audit_trail.schema.json"
            description = "Immutable records of all system changes for compliance"
            priority = "HIGH"
            depends_on = "assertions_catalog (L110)"
        },
        @{
            id = "L113"
            name = "compliance_mapping"
            file = "compliance_mapping.schema.json"
            description = "Maps layers to compliance frameworks (HIPAA, SOC2, ISO27001)"
            priority = "HIGH"
            depends_on = "assertions_catalog (L110)"
        },
        @{
            id = "L114"
            name = "risk_register"
            file = "risk_register.schema.json"
            description = "Risk identification, assessment, and mitigation tracking"
            priority = "MEDIUM"
            depends_on = "remediation_effectiveness (L111)"
        },
        @{
            id = "L115"
            name = "security_controls"
            file = "security_controls.schema.json"
            description = "Control implementations per NIST/CIS framework"
            priority = "HIGH"
            depends_on = "assertions_catalog (L110)"
        },
        @{
            id = "L116"
            name = "vulnerability_assessment"
            file = "vulnerability_assessment.schema.json"
            description = "Vulnerability discovery and remediation workflow"
            priority = "HIGH"
            depends_on = "risk_register (L114)"
        },
        @{
            id = "L117"
            name = "access_control_matrix"
            file = "access_control_matrix.schema.json"
            description = "RBAC configuration per resource and actor"
            priority = "HIGH"
            depends_on = "personas (L2)"
        },
        @{
            id = "L118"
            name = "incident_response"
            file = "incident_response.schema.json"
            description = "Incident detection, response, and post-mortem tracking"
            priority = "MEDIUM"
            depends_on = "audit_trail (L112)"
        },
        @{
            id = "L119"
            name = "attestation_records"
            file = "attestation_records.schema.json"
            description = "Compliance attestations and signed audit records"
            priority = "MEDIUM"
            depends_on = "audit_trail (L112)"
        }
    )
    
    Write-Log "[OK] Missing schema specifications defined: $($missingSchemas.Count)" "INFO"
    
    foreach ($schema in $missingSchemas) {
        $plan.remediation_items += @{
            gap_id = $schema.id
            gap_type = "missing_schema"
            gap_name = $schema.name
            file = $schema.file
            description = $schema.description
            priority = $schema.priority
            action = "Create JSON Schema Draft-7 file in schema/ directory"
            action_owner = "PART 4.DO - Schema Creation Phase"
            validation = "Schema passes JSON Schema validation + has $id field"
            depends_on = $schema.depends_on
            estimated_effort_minutes = 15
        }
    }
    
    # GAP 9: Missing API endpoint documentation
    Write-Log "[PLAN] Domain 2: Document missing API endpoints..." "INFO"
    
    $missingEndpoints = @(
        @{
            path = "/model/user-guide"
            method = "GET"
            response_type = "application/json"
            description = "Retrieves 6 DPDCA category runbooks with layer definitions, query sequences, and anti-trash rules"
            related_layer = "ontology_domains (L12)"
        },
        @{
            path = "/model/ontology"
            method = "GET"
            response_type = "application/json"
            description = "Returns 12-domain cognitive architecture for agent reasoning"
            related_layer = "ontology_domains (L12)"
        },
        @{
            path = "/ready"
            method = "GET"
            response_type = "application/json"
            description = "Kubernetes readiness probe: returns true if API can serve requests"
            related_layer = "infrastructure (L10)"
        }
    )
    
    Write-Log "[OK] Missing endpoint specifications defined: $($missingEndpoints.Count)" "INFO"
    
    foreach ($endpoint in $missingEndpoints) {
        $plan.remediation_items += @{
            gap_id = "ENDPOINT_" + ($endpoint.path -replace "/", "_")
            gap_type = "missing_endpoint_doc"
            path = $endpoint.path
            method = $endpoint.method
            description = $endpoint.description
            action = "Add endpoint documentation to docs/API-ENDPOINTS.md"
            action_owner = "PART 4.DO - Endpoint Documentation Phase"
            validation = "Endpoint documented with method, response schema, example"
            related_layer = $endpoint.related_layer
            estimated_effort_minutes = 10
        }
    }
    
    Write-Log "[OK] Remediation plan items: $($plan.remediation_items.Count)" "INFO"
    
    # Define documentation artifacts to create/update
    Write-Log "[PLAN] Defining documentation artifacts..." "INFO"
    
    $plan.documentation_artifacts = @(
        @{
            name = "docs/API-ENDPOINTS.md"
            type = "API Reference"
            action = "CREATE or UPDATE with 3 missing endpoints"
            includes = @(
                "GET /model/user-guide",
                "GET /model/ontology",
                "GET /ready"
            )
            format = "OpenAPI 3.0 spec + examples"
            links_to = @("docs/library/98-model-ontology-for-agents.md")
        },
        @{
            name = "docs/library/LAYER-DEFINITIONS-L112-L121.md"
            type = "Layer Definitions"
            action = "CREATE with 8 missing security schemas"
            includes = @(
                "L112 audit_trail",
                "L113 compliance_mapping",
                "L114 risk_register",
                "L115 security_controls",
                "L116 vulnerability_assessment",
                "L117 access_control_matrix",
                "L118 incident_response",
                "L119 attestation_records"
            )
            format = "Markdown with layer specifications"
            links_to = @("docs/COMPLETE-LAYER-CATALOG.md")
        },
        @{
            name = "docs/COMPLETE-LAYER-CATALOG.md"
            type = "Layer Inventory"
            action = "UPDATE to include 8 new layers in DOMAIN 2 section"
            sections_affected = @("DOMAIN 2 -- IDENTITY & ACCESS")
            new_entries = 8
            format = "Markdown table format"
        }
    )
    
    Write-Log "[OK] Documentation artifacts defined: $($plan.documentation_artifacts.Count)" "INFO"
    
    # Define validation checklist
    Write-Log "[PLAN] Creating validation checklist..." "INFO"
    
    $plan.validation_checklist = @(
        @{
            step_number = 1
            category = "Schemas"
            check = "All 8 missing schema JSON files exist in schema/ directory"
            validation_command = "Get-ChildItem ./schema/*.schema.json | Where {(L112|L113|L114|L115|L116|L117|L118|L119)}"
            pass_criteria = "8 files found"
        },
        @{
            step_number = 2
            category = "Schemas"
            check = "All 8 schemas validate against JSON Schema Draft-7"
            validation_command = "npm run validate-schemas -- L112 L113 L114 L115 L116 L117 L118 L119"
            pass_criteria = "0 validation errors"
        },
        @{
            step_number = 3
            category = "Schemas"
            check = "All 8 schemas have $id field in correct format"
            validation_command = "Get-Content schema/*.schema.json | ConvertFrom-Json | Where {$_.'$id' -match 'L11[2-9]'}"
            pass_criteria = "8 schemas with $id"
        },
        @{
            step_number = 4
            category = "Documentation"
            check = "API endpoint documentation file exists"
            validation_command = "Test-Path docs/API-ENDPOINTS.md"
            pass_criteria = "true"
        },
        @{
            step_number = 5
            category = "Documentation"
            check = "All 3 missing endpoints documented in API-ENDPOINTS.md"
            validation_command = "Select-String '/model/user-guide','  /model/ontology', '/ready' docs/API-ENDPOINTS.md"
            pass_criteria = "3 endpoints found"
        },
        @{
            step_number = 6
            category = "Documentation"
            check = "COMPLETE-LAYER-CATALOG.md includes all 8 new layers"
            validation_command = "Select-String 'L112|L113|L114|L115|L116|L117|L118|L119' docs/COMPLETE-LAYER-CATALOG.md"
            pass_criteria = "8 layers referenced"
        },
        @{
            step_number = 7
            category = "Integration"
            check = "Layer definitions linked from catalog"
            validation_command = "Select-String 'LAYER-DEFINITIONS-L112-L121' docs/COMPLETE-LAYER-CATALOG.md"
            pass_criteria = "Link exists"
        },
        @{
            step_number = 8
            category = "Integration"
            check = "All documentation is internally consistent"
            validation_command = "Cross-reference layer names, IDs, and descriptions"
            pass_criteria = "No conflicts found"
        }
    )
    
    Write-Log "[OK] Validation checklist created: $($plan.validation_checklist.Count) items" "INFO"
    
    # Summary metrics
    Write-Log "[PLAN] Calculating effort metrics..." "INFO"
    
    $effortMinutes = 0
    foreach ($item in $plan.remediation_items) {
        if ($item.estimated_effort_minutes) {
            $effortMinutes += $item.estimated_effort_minutes
        }
    }
    $totalMinutes = $effortMinutes * 1.2  # 20% margin
    $totalHours = [Math]::Round($totalMinutes / 60, 1)
    
    $plan.metrics = @{
        total_gaps = 9
        gap_by_type = @{
            missing_schemas = 8
            missing_endpoints = 3
            total = 9
        }
        remediation_items = $plan.remediation_items.Count
        documentation_artifacts = $plan.documentation_artifacts.Count
        validation_checks = $plan.validation_checklist.Count
        estimated_effort_minutes = $totalMinutes
        estimated_effort_hours = $totalHours
        dependencies = @(
            "assertions_catalog.schema.json (L110) - already exists",
            "remediation_effectiveness.schema.json (L111) - already exists"
        )
        risk_level = "LOW"
        blocking_issues = 0
    }
    
    Write-Log "[OK] Metrics calculated: $($totalHours)h estimated effort" "INFO"
    
    # Readiness assessment
    Write-Log "[PLAN] Assessing readiness for DO phase..." "INFO"
    
    $plan.status = "COMPLETE"
    $plan.readiness = @{
        all_gaps_understood = $true
        remediation_strategy_defined = $true
        resources_available = $true
        blocking_dependencies = @()
        ready_for_do_phase = $true
        recommended_action = "Proceed to PART 4.DO - Schema Creation and Documentation Update"
    }
    
    Write-Log "[OK] PLAN phase complete - ready for DO" "INFO"
    
} catch {
    Write-Log "[ERROR] PLAN failed: $_" "ERROR"
    $plan.status = "FAILED"
    $plan.error = $_.Exception.Message
    exit 1
}

# Save evidence
$evidencePath = "$EvidenceDir\PART-4-PLAN-RemediationStrategy-$timestamp.json"
$plan | ConvertTo-Json -Depth 5 | Out-File $evidencePath -Force
Write-Log "[OK] Evidence saved: $evidencePath" "INFO"

# Print summary
Write-Host ""
Write-Host "=== PART 4.PLAN SUMMARY ===" -ForegroundColor Cyan
Write-Host "[OK] Gaps analyzed: $($plan.metrics.total_gaps)"
Write-Host "[OK] Remediation items: $($plan.metrics.remediation_items)"
Write-Host "[OK] Documentation artifacts: $($plan.metrics.documentation_artifacts)"
Write-Host "[OK] Validation checks: $($plan.metrics.validation_checks)"
Write-Host "[METRIC] Estimated effort: $($plan.metrics.estimated_effort_hours)h"
Write-Host "[METRIC] Risk level: $($plan.metrics.risk_level)"
Write-Host "[OK] Readiness: $($plan.readiness.ready_for_do_phase)"
Write-Host "[ACTION] $($plan.readiness.recommended_action)"
Write-Host ""

exit 0
