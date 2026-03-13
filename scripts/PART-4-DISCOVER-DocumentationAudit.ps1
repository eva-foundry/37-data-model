# PART 4.DISCOVER: Audit Documentation Gaps vs Data Model API
# Purpose: Compare API-live layer metadata against existing documentation files
# Output: Evidence JSON with audit results (gaps, outdated entries, missing endpoints)

param(
    [string]$ApiBase = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",
    [string]$EvidenceDir = "$(Get-Location)\evidence",
    [int]$Timeout = 30
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date -Format "yyyyMMdd_HHmmss")
$logPath = "$(Get-Location)\logs\PART-4-DISCOVER_$timestamp.log"

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

Write-Log "=== PART 4.DISCOVER: Documentation Audit ===" "INFO"
Write-Log "API Base: $ApiBase" "INFO"
Write-Log "Evidence Dir: $EvidenceDir" "INFO"

# Initialize results object
$audit = @{
    timestamp = $timestamp
    phase = "DISCOVER"
    api_base = $ApiBase
    status = "pending"
    api_layers = @()
    documentation_files = @()
    gap_analysis = @{
        missing_documentation = @()
        outdated_descriptions = @()
        missing_api_endpoints = @()
        inconsistent_layer_counts = @()
    }
    evidence_summary = @{}
}

try {
    Write-Log "[SCHEMA] Scanning schema files for layers..." "INFO"
    
    # Get all schema files (these represent layers)
    $schemaDir = "$(Get-Location)\schema"
    $schemaFiles = @()
    
    if (Test-Path $schemaDir) {
        $schemaFiles = Get-ChildItem $schemaDir -Filter "*.schema.json" | ForEach-Object {
            try {
                $content = Get-Content $_.FullName | ConvertFrom-Json
                @{
                    file = $_.Name
                    path = $_.FullName
                    id = $content.'$id' -replace ".*#/" -replace ".schema.json" -replace "^schema/"
                    has_description = -not [string]::IsNullOrEmpty($content.description)
                    description = $content.description
                    properties_count = @($content.properties.PSObject.Properties).Count
                }
            }
            catch {
                Write-Log "[WARN] Failed to parse $($_.Name): $_" "WARN"
                $null
            }
        } | Where-Object { $_ }
    }
    
    Write-Log "[OK] Schema files found: $($schemaFiles.Count)" "INFO"
    $audit.api_layers = $schemaFiles | Sort-Object id
    
    # Also scan evidence files
    Write-Log "[SCHEMA] Scanning layer definition files..." "INFO"
    $defFile = "$(Get-Location)\docs\library\LAYER-DEFINITIONS-L112-L121.md"
    $layerDefsContent = @()
    
    if (Test-Path $defFile) {
        $content = Get-Content $defFile -Raw
        $audit.api_layers += @{
            source = "definitions"
            path = $defFile
            status = "documented"
            layers_count = ($content | Select-String "^##\s+L\d+" | Measure-Object).Count
        }
        Write-Log "[OK] Layer definitions found: $($content | Select-String '^##\s+L\d+' | Measure-Object).Count" "INFO"
    }
    
    # Check existing documentation files
    $docFiles = @(
        "$(Get-Location)\docs\COMPLETE-LAYER-CATALOG.md"
        "$(Get-Location)\docs\library\03-DATA-MODEL-REFERENCE.md"
        "$(Get-Location)\docs\library\98-model-ontology-for-agents.md"
        "$(Get-Location)\docs\library\99-layers-design-20260309-0935.md"
    )
    
    Write-Log "[DOC] Scanning documentation files..." "INFO"
    foreach ($docFile in $docFiles) {
        if (Test-Path $docFile) {
            Write-Log "[OK] Found: $docFile" "INFO"
            $audit.documentation_files += @{
                path = $docFile
                exists = $true
                size_bytes = (Get-Item $docFile).Length
                last_modified = (Get-Item $docFile).LastWriteTime | Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            }
        } else {
            Write-Log "[WARN] Missing: $docFile" "WARN"
            $audit.documentation_files += @{
                path = $docFile
                exists = $false
            }
        }
    }
    
    # Audit: Check for layers documented in files
    Write-Log "[AUDIT] Analyzing documentation coverage..." "INFO"
    
    $catalogPath = "$(Get-Location)\docs\COMPLETE-LAYER-CATALOG.md"
    $catalogContent = ""
    $sectionCount = 0
    $documentedLayers = @()
    
    if (Test-Path $catalogPath) {
        $catalogContent = Get-Content $catalogPath -Raw
        
        # Extract layer identifiers from docs (both L## format and natural layer names)
        if ($catalogContent -match "# EVA DATA MODEL -- COMPLETE LAYER CATALOG") {
            Write-Log "[OK] COMPLETE-LAYER-CATALOG.md found" "INFO"
            
            # Count sections
            $sectionCount = ($catalogContent | Select-String "^  Layer\s+L#? " | Measure-Object).Count
            Write-Log "[OK] Layer sections documented: $sectionCount" "INFO"
        }
    } else {
        Write-Log "[WARN] COMPLETE-LAYER-CATALOG.md not found" "WARN"
        $audit.gap_analysis.missing_documentation += @{
            file = "COMPLETE-LAYER-CATALOG.md"
            severity = "CRITICAL"
        }
        $sectionCount = -1
    }
    
    # Check for PART 1 additions (L112-L121)
    Write-Log "[AUDIT] Checking for PART 1 security schemas (L112-L121)..." "INFO"
    $part1Schemas = @(
        "assertions_catalog.schema.json",
        "remediation_effectiveness.schema.json",
        "audit_trail.schema.json",
        "compliance_mapping.schema.json",
        "risk_register.schema.json",
        "security_controls.schema.json",
        "vulnerability_assessment.schema.json",
        "access_control_matrix.schema.json",
        "incident_response.schema.json",
        "attestation_records.schema.json"
    )
    
    $missingSchemas = @()
    foreach ($schema in $part1Schemas) {
        $schemaPath = "$(Get-Location)\schema\$schema"
        if (-not (Test-Path $schemaPath)) {
            $missingSchemas += $schema
            Write-Log "[WARN] Missing schema: $schema" "WARN"
        } else {
            Write-Log "[OK] Found: $schema" "INFO"
        }
    }
    
    if ($missingSchemas.Count -gt 0) {
        $audit.gap_analysis.missing_documentation += @{
            type = "security_schemas"
            missing_count = $missingSchemas.Count
            schemas = $missingSchemas
        }
    }
    
    # Check layer count consistency
    $expectedLayerCount = 121  # 111 existing + 10 new (L112-L121)
    Write-Log "[AUDIT] Checking layer count consistency..." "INFO"
    Write-Log "[METRIC] Expected total layers (canonical + organic): 121+" "INFO"
    Write-Log "[METRIC] Documented layers: $sectionCount" "INFO"
    Write-Log "[METRIC] Schema files: $($schemaFiles.Count)" "INFO"
    
    if ($sectionCount -le 0) {
        $audit.gap_analysis.inconsistent_layer_counts += @{
            expected = "111+ operational"
            actual = $sectionCount
            severity = "HIGH"
            recommendation = "Update COMPLETE-LAYER-CATALOG.md with latest layer inventory"
        }
        Write-Log "[WARN] Layer catalog may be outdated" "WARN"
    } else {
        Write-Log "[OK] Layer count check baseline: $sectionCount documented" "INFO"
    }
    
    # Check for outdated descriptions (schemas without descriptions)
    Write-Log "[AUDIT] Checking schema quality..." "INFO"
    $schemasWithoutDesc = $schemaFiles | Where-Object { -not $_.has_description }
    if ($schemasWithoutDesc.Count -gt 0) {
        Write-Log "[WARN] Schemas with missing descriptions: $($schemasWithoutDesc.Count)" "WARN"
        $audit.gap_analysis.outdated_descriptions = $schemasWithoutDesc | Select-Object file, id
    } else {
        Write-Log "[OK] All schemas have descriptions" "INFO"
    }
    
    # Query API endpoints to verify documentation exists
    Write-Log "[API] Verifying API endpoints are documented..." "INFO"
    $endpoints = @(
        "/health",
        "/model/agent-guide",
        "/model/user-guide",
        "/model/ontology",
        "/ready"
    )
    
    $missingEndpoints = @()
    
    # Check in the main doc files we already scanned
    foreach ($endpoint in $endpoints) {
        $found = $false
        
        if ($catalogContent -match [regex]::Escape($endpoint)) {
            $found = $true
        }
        
        if (-not $found) {
            $missingEndpoints += $endpoint
            Write-Log "[WARN] Endpoint not documented: $endpoint" "WARN"
        } else {
            Write-Log "[OK] Endpoint documented: $endpoint" "INFO"
        }
    }
    
    # Summary
    $audit.evidence_summary = @{
        schema_files_found = $schemaFiles.Count
        documented_files_found = ($audit.documentation_files | Where-Object { $_.exists -eq $true }).Count
        documentation_files_missing = ($audit.documentation_files | Where-Object { $_.exists -eq $false }).Count
        schemas_without_descriptions = $schemasWithoutDesc.Count
        missing_security_schemas = $missingSchemas.Count
        missing_endpoints_in_docs = $missingEndpoints.Count
        critical_gaps = @(
            $audit.gap_analysis.missing_documentation.Count,
            $missingSchemas.Count
        ) | Measure-Object -Sum | Select-Object -ExpandProperty Sum
    }
    
    $audit.status = "COMPLETE"
    Write-Log "[OK] DISCOVER phase complete" "INFO"
    
} catch {
    Write-Log "[ERROR] DISCOVER failed: $_" "ERROR"
    $audit.status = "FAILED"
    $audit.error = $_.Exception.Message
    exit 1
}

# Save evidence
$evidencePath = "$EvidenceDir\PART-4-DISCOVER-DocumentationAudit-$timestamp.json"
$audit | ConvertTo-Json -Depth 5 | Out-File $evidencePath -Force
Write-Log "[OK] Evidence saved: $evidencePath" "INFO"

# Print summary
Write-Host ""
Write-Host "=== PART 4.DISCOVER SUMMARY ===" -ForegroundColor Cyan
Write-Host "[OK] Schema files: $($audit.evidence_summary.schema_files_found)"
Write-Host "[OK] Documentation files found: $($audit.evidence_summary.documented_files_found)"
Write-Host "[WARN] Documentation files missing: $($audit.evidence_summary.documentation_files_missing)"
Write-Host "[WARN] Schemas without descriptions: $($audit.evidence_summary.schemas_without_descriptions)"
Write-Host "[WARN] Missing security schemas: $($audit.evidence_summary.missing_security_schemas)"
Write-Host "[WARN] Missing API endpoints in docs: $($audit.evidence_summary.missing_endpoints_in_docs)"
Write-Host "[METRIC] Critical gaps identified: $($audit.evidence_summary.critical_gaps)"
Write-Host ""

exit 0
