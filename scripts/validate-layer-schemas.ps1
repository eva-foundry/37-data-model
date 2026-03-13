param(
    [string]$SchemaDir = "c:\eva-foundry\37-data-model\evidence\phase-a\schemas",
    [string]$OutputFile = "c:\eva-foundry\37-data-model\evidence\phase-b\schema-validation-report.json"
)

Write-Host "[UNIT 1] Phase B Schema Validation Starting..." -ForegroundColor Cyan
Write-Host "[CONFIG] Schema Directory: $SchemaDir"
Write-Host "[CONFIG] Output File: $OutputFile"
Write-Host ""

# Ensure output directory exists
$outputDir = Split-Path $OutputFile
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    Write-Host "[INIT] Created output directory: $outputDir"
}

$results = @{
    timestamp = Get-Date -Format "yyyy-MM-dd'T'HH:mm:ss.fffZ"
    total_schemas = 0
    schemas_valid = 0
    schemas_invalid = 0
    fk_errors = 0
    circular_deps_detected = 0
    schemas = @()
    summary = ""
}

# Define expected FK references (layers that should exist)
$expectedLayers = @{
    "L26" = "projects"
    "L25" = "project_work"
    "L27" = "sprints"
    "L28" = "stories"
    "L29" = "tasks"
    "L31" = "evidence"
    "L34" = "quality_gates"
    "L45" = "verification_records"
}

# Expected FK patterns
$fkPatterns = @(
    @{ layer = "L122"; field = "project_id"; expectedParent = "L26" }
    @{ layer = "L123"; field = "context_id"; expectedParent = "L122" }
    @{ layer = "L124"; field = "context_id"; expectedParent = "L122" }
    @{ layer = "L125"; field = "context_id"; expectedParent = "L122" }
    @{ layer = "L126"; field = "assumption_id"; expectedParent = "L123" }
    @{ layer = "L127"; field = "project_id"; expectedParent = "L26" }
    @{ layer = "L128"; field = "mission_id"; expectedParent = "L127" }
    @{ layer = "L129"; field = "sensor_id"; expectedParent = "L128" }
)

# Get all schema files
$schemaFiles = Get-ChildItem $SchemaDir -Filter "*.json" -ErrorAction SilentlyContinue | Sort-Object Name

Write-Host "[SCAN] Found $(($schemaFiles | Measure-Object).Count) schema files"
Write-Host ""

foreach ($file in $schemaFiles) {
    $results.total_schemas++
    
    $layerId = $file.BaseName.Split('-')[0]
    $layerName = ($file.BaseName -split '-', 2)[1]
    
    Write-Host "[VALIDATING] $($file.Name)..." -ForegroundColor Yellow
    
    $schemaResult = @{
        file = $file.Name
        layer_id = $layerId
        layer_name = $layerName
        valid_json = $false
        valid_structure = $false
        fk_errors = @()
        issues = @()
        details = @{}
    }
    
    try {
        # 1. Load and parse JSON
        $schema = Get-Content $file.FullName -Raw | ConvertFrom-Json -ErrorAction Stop
        $schemaResult.valid_json = $true
        Write-Host "  [OK] JSON valid" -ForegroundColor Green
        
        # 2. Check required fields (schema.id is the id_format, so check both)
        $hasIdFormat = $schema.PSObject.Properties["id_format"] -or ($schema.schema.id -and $schema.schema.id -match "^string")
        $hasLayer = $schema.PSObject.Properties["layer"]
        $hasDescription = $schema.PSObject.Properties["description"]
        $hasRelationships = $schema.PSObject.Properties["relationships"]
        
        $missingFields = @()
        if (-not $hasIdFormat -and -not $schema.schema.id) { $missingFields += "id_format or schema.id" }
        if (-not $hasLayer) { $missingFields += "layer" }
        if (-not $hasDescription) { $missingFields += "description" }
        if (-not $hasRelationships) { $missingFields += "relationships" }
        
        if ($missingFields.Count -eq 0) {
            $schemaResult.valid_structure = $true
            Write-Host "  [OK] Structure valid (all required fields present)" -ForegroundColor Green
        } else {
            Write-Host "  [ERROR] Missing fields: $($missingFields -join ', ')" -ForegroundColor Red
        }
        
        # 3. Validate FK references (handle both "L26" and "L26/projects" formats)
        if ($schema.relationships) {
            $schema.relationships | Get-Member -MemberType NoteProperty | ForEach-Object {
                $refProp = $_.Name
                $refValue = $schema.relationships.$refProp
                
                if ($refValue -is [array]) {
                    $refValue | ForEach-Object {
                        # Extract layer ID from both "L26" and "L26/projects" formats
                        if ($_ -match "^L\d+") {
                            $layerIdRef = [regex]::Match($_, "L\d+").Value
                            # For Phase A layers, also accept other valid layers (L25-L29, L31, L33, L34, L45, L52)
                            $validLayers = @("L25", "L26", "L27", "L28", "L29", "L31", "L33", "L34", "L45", "L52", "L122", "L123", "L124", "L125", "L126", "L127", "L128", "L129", "L30")
                            if ($layerIdRef -notin $validLayers) {
                                $schemaResult.fk_errors += "Unknown parent layer: $_"
                            }
                        }
                    }
                }
            }
        }
        
        if ($schemaResult.fk_errors.Count -eq 0) {
            Write-Host "  [OK] FK references valid" -ForegroundColor Green
        } else {
            Write-Host "  [ERROR] FK errors: $($schemaResult.fk_errors.Count)" -ForegroundColor Red
            $schemaResult.fk_errors | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
            $results.fk_errors += $schemaResult.fk_errors.Count
        }
        
        # 4. Check for circular dependencies (simple check: layer doesn't reference itself)
        $selfRef = $schema.relationships | Get-Member -MemberType NoteProperty | Where-Object {
            $refValue = $schema.relationships.$($_.Name)
            $refValue -contains $layerId
        }
        
        if ($selfRef) {
            $schemaResult.issues += "Circular dependency: layer references itself"
            $results.circular_deps_detected++
            Write-Host "  [ERROR] Circular dependency detected" -ForegroundColor Red
        } else {
            Write-Host "  [OK] No self-references" -ForegroundColor Green
        }
        
        # 5. Collect metadata
        $schemaResult.details = @{
            id_format = $schema.id_format
            immutable = $schema.immutable
            ttl_days = $schema.ttl_days
            parent_layers = $schema.relationships.parent
            child_layers = $schema.relationships.child
            edge_types = $schema.relationships.edge_types
        }
        
        # Final determination
        if ($schemaResult.valid_json -and $schemaResult.valid_structure -and $schemaResult.fk_errors.Count -eq 0 -and -not $selfRef) {
            $results.schemas_valid++
            Write-Host "  [PASS] Schema validation passed" -ForegroundColor Green
        } else {
            $results.schemas_invalid++
            Write-Host "  [FAIL] Schema validation failed" -ForegroundColor Red
        }
        
    } catch {
        $schemaResult.issues += "JSON parsing error: $($_.Exception.Message)"
        $results.schemas_invalid++
        Write-Host "  [ERROR] Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    $results.schemas += $schemaResult
    Write-Host ""
}

# Generate summary
$passRate = if ($results.total_schemas -gt 0) { 
    [math]::Round(($results.schemas_valid / $results.total_schemas) * 100, 1) 
} else { 
    0 
}

$results.summary = @{
    total = $results.total_schemas
    passed = $results.schemas_valid
    failed = $results.schemas_invalid
    pass_rate = "$passRate%"
    fk_errors_total = $results.fk_errors
    circular_deps = $results.circular_deps_detected
    status = if ($results.schemas_invalid -eq 0 -and $results.fk_errors -eq 0) { "PASS" } else { "FAIL" }
}

# Output results
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PHASE B UNIT 1: SCHEMA VALIDATION REPORT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Schemas: $($results.total_schemas)"
Write-Host "Passed: $($results.schemas_valid)"
Write-Host "Failed: $($results.schemas_invalid)"
Write-Host "Pass Rate: $passRate%"
Write-Host ""
Write-Host "FK Reference Errors: $($results.fk_errors)"
Write-Host "Circular Dependencies: $($results.circular_deps_detected)"
Write-Host ""
$statusColor = if ($results.summary.status -eq "PASS") { "Green" } else { "Red" }
Write-Host "Overall Status: $($results.summary.status)" -ForegroundColor $statusColor
Write-Host ""

# Save report
$jsonOutput = $results | ConvertTo-Json -Depth 5
$jsonOutput | Out-File -FilePath $OutputFile -Encoding UTF8 -Force

Write-Host "[OUTPUT] Report saved to: $OutputFile"
Write-Host ""

# Exit with appropriate code
if ($results.summary.status -eq "PASS") {
    Write-Host "[SUCCESS] All schemas validated successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAILURE] Schema validation detected issues" -ForegroundColor Red
    exit 1
}
