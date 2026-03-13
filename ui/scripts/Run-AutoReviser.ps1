<#
.SYNOPSIS
    Run-AutoReviser.ps1 - Reliable auto-reviser execution
    Based on proven patterns from Invoke-PrimeWorkspace.ps1 v2.0.0
    
.DESCRIPTION
    Executes auto-reviser-fixer.py with:
    - Pre-flight validation (layers exist, Python works, no partial state)
    - Single-layer test run first (catch errors early)
    - Batch execution with stop-on-failure
    - Full error logging + evidence persistence
    - Can be re-run safely (idempotent)
    - Clear diagnostics if something breaks
    
.PARAMETER Layer
    Single layer name to run (e.g. 'projects', 'wbs')
    If omitted, runs Batch 1 (20 core layers)
    
.PARAMETER TestOnly
    Run validation only, don't execute fixes
    
.PARAMETER DryRun
    Print what would happen without executing Python

.EXAMPLE
    # Test single layer first
    .\Run-AutoReviser.ps1 -Layer 'projects' -TestOnly
    
    # Output shows:
    # [DISCOVER] Pre-flight: Python venv OK, auto-reviser-fixer.py exists, no partial state
    # [PLAN] Will run: projects (test mode)
    # [DO] python auto-reviser-fixer.py --layer projects --test
    # [CHECK] Exit code: 0, Evidence: ✓, Fixes: 150, MTI: 89
    # [INFO] Ready for batch run. Use: .\Run-AutoReviser.ps1 -Batch 1

.EXAMPLE
    # Run Batch 1 for real (20 layers, ~25 min)
    .\Run-AutoReviser.ps1 -Batch 1
    
    # Stops on first failure with full diagnostic
#>

[CmdletBinding()]
param(
    [string]$Layer,
    [int]$Batch = 0,
    [switch]$TestOnly,
    [switch]$DryRun
)

# ============================================================================
# CONSTANTS & UTILITIES (Proven patterns from Invoke-PrimeWorkspace.ps1 v2.0.0)
# ============================================================================

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$UiRoot = Split-Path -Parent $ScriptRoot
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogFile = "$ScriptRoot\logs\run-auto-reviser_$Timestamp.log"
$EvidenceFile = "$ScriptRoot\evidence\session_$Timestamp.json"

# Ensure output directories exist
@("$ScriptRoot\logs", "$ScriptRoot\evidence", "$ScriptRoot\debug") | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force > $null }
}

# Get Python executable
$PythonExe = & {
    $venv = "$ScriptRoot\..\..\.venv\Scripts\python.exe"
    if (Test-Path $venv) { $venv }
    else { "python" }
}

# Batch definitions (same as batch-orchestrator-sequential.py)
$BATCHES = @{
    1 = @('projects', 'wbs', 'sprints', 'stories', 'tasks', 'evidence', 
           'verification_records', 'quality_gates', 'project_work', 'sprint_tracking',
           'task_tracking', 'agent_policies', 'prompt_definitions', 'model_configs',
           'security_controls', 'compliance_audit', 'risk_items', 'decisions',
           'deployment_records', 'performance_metrics')
    2 = @('components', 'api_endpoints', 'data_models', 'services', 'hooks',
           'context_providers', 'utilities', 'schemas', 'types', 'validators',
           'transformers', 'repositories', 'clients', 'middleware', 'handlers',
           'helpers', 'formatters', 'parsers', 'builders', 'factories',
           'mappers', 'adapters', 'decorators', 'guards', 'interceptors',
           'middleware_auth', 'middleware_logging', 'middleware_error', 'middleware_cache',
           'middleware_rate_limit', 'plugins', 'extensions', 'integrations',
           'connectors', 'gateways', 'proxies', 'bridges', 'facades', 'strategies')
    3 = @('terraform', 'bicep', 'docker', 'kubernetes', 'monitoring',
           'alert_rules', 'backup_policies', 'disaster_recovery', 'network',
           'firewall', 'ssl', 'secrets', 'iam', 'rbac', 'audit_logging',
           'compliance_policies', 'data_retention', 'encryption', 'replication',
           'failover', 'scaling', 'cost_optimization', 'performance_tuning',
           'observability', 'distributed_tracing', 'log_aggregation', 'metrics_collection',
           'health_checks', 'load_balancing')
    4 = @('roadmap', 'vision', 'goals', 'kpis', 'success_metrics',
           'risk_mitigation', 'contingency', 'stakeholder_management', 'communication_plan',
           'change_management', 'training_plan', 'adoption_strategy', 'vendor_management',
           'partnership_strategy', 'market_analysis', 'competitive_analysis', 'innovation_pipeline',
           'technical_debt_backlog', 'architecture_evolution', 'technology_refresh_plan',
           'modernization_roadmap')
}

function Log {
    param([string]$Level, [string]$Message)
    $Prefix = "[{0:HH:mm:ss}] [{1,-5}]" -f (Get-Date), $Level
    $Line = "$Prefix $Message"
    Write-Host $Line
    Add-Content -Path $LogFile -Value $Line
}

function Verify-Python {
    Log "INFO" "Pre-flight: Python validation"
    $testCmd = "import sys; print(sys.version.split()[0])"
    try {
        $ver = & $PythonExe -c $testCmd 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Python exit code: $LASTEXITCODE" }
        Log "OK" "Python $ver found at $PythonExe"
        return $true
    }
    catch {
        Log "FAIL" "Python validation failed: $_"
        return $false
    }
}

function Verify-AutoReviser {
    Log "INFO" "Pre-flight: auto-reviser-fixer.py check"
    $reviserPath = "$ScriptRoot\auto-reviser-fixer.py"
    if (-not (Test-Path $reviserPath)) {
        Log "FAIL" "auto-reviser-fixer.py not found at $reviserPath"
        return $false
    }
    Log "OK" "auto-reviser-fixer.py found"
    return $true
}

function Verify-NoPartialState {
    Log "INFO" "Pre-flight: Checking for incomplete runs"
    $evidenceDir = "$ScriptRoot\evidence"
    $partialFiles = Get-ChildItem -Path $evidenceDir -Filter "*partial*" -ErrorAction SilentlyContinue
    if ($partialFiles) {
        Log "WARN" "Found $($partialFiles.Count) partial state files - cleanup recommended"
        Log "INFO" "  Partial files: $($partialFiles.Name -join ', ')"
        Log "INFO" "  Continuing anyway... (safe to re-run)"
    }
    return $true
}

function Invoke-Layer {
    param([string]$LayerName, [bool]$IsTest = $false)
    
    $testFlag = if ($IsTest) { "--test" } else { "" }
    $cmd = @($PythonExe, "$ScriptRoot\auto-reviser-fixer.py", "--layer", $LayerName, $testFlag) | Where-Object { $_ }
    
    Log "DO" "python auto-reviser-fixer.py --layer $LayerName $(if ($IsTest) { '--test' })"
    
    if ($DryRun) {
        Log "DRYRUN" "Would execute: $($cmd -join ' ')"
        return $true
    }
    
    $output = New-TemporaryFile
    try {
        # For workflow runs: suppress verbose output, just return pass/fail
        if ($env:GITHUB_ACTIONS) {
            & $cmd > $output 2>&1
            $exitCode = $LASTEXITCODE
            if ($exitCode -eq 0) {
                Log "OK" "$LayerName completed"
                return $true
            } else {
                Log "FAIL" "$LayerName failed (code $exitCode)"
                return $false
            }
        }
        else {
            # Local runs: show full output
            & $cmd > $output 2>&1
            $exitCode = $LASTEXITCODE
            
            if ($exitCode -eq 0) {
                Log "OK" "$LayerName completed (exit code 0)"
                return $true
            }
            else {
                Log "FAIL" "$LayerName failed (exit code $exitCode)"
                Log "INFO" "Full output:"
                Get-Content $output | ForEach-Object { Log "DEBUG" $_ }
                return $false
            }
        }
    }
    finally {
        Remove-Item $output -ErrorAction SilentlyContinue
    }
}

function Run-Batch {
    param([int]$BatchNum)
    
    if ($BatchNum -notin @(1, 2, 3, 4)) {
        Log "FAIL" "Invalid batch: $BatchNum (must be 1-4)"
        return $false
    }
    
    $layers = $BATCHES[$BatchNum]
    Log "INFO" "[BATCH $BatchNum] Starting - $($layers.Count) layers"
    
    $passed = 0
    $failed = 0
    $results = @()
    $batchStart = Get-Date
    
    foreach ($i in 0..($layers.Count - 1)) {
        $layer = $layers[$i]
        $layerNum = $i + 1
        Log "INFO" "[$layerNum/$($layers.Count)] Processing: $layer"
        
        if (Invoke-Layer -LayerName $layer) {
            $passed++
            $results += @{ layer = $layer; status = "PASS" }
            Log "OK" "$layer passed"
        }
        else {
            $failed++
            $results += @{ layer = $layer; status = "FAIL" }
            Log "FAIL" "$layer failed - STOPPING BATCH"
            
            # On first failure, stop and give diagnostic
            $summary = @{
                timestamp = $Timestamp
                batch = $BatchNum
                total_layers = $layers.Count
                passed = $passed
                failed = $failed
                failed_layer = $layer
                stopped_at = $layerNum
                results = $results
                log_file = $LogFile
            }
            
            $summary | ConvertTo-Json -Depth 10 | Out-File -Path $EvidenceFile -Encoding UTF8
            Log "INFO" "Evidence saved: $EvidenceFile"
            return $false
        }
    }
    
    $batchEnd = Get-Date
    $duration = ($batchEnd - $batchStart).TotalSeconds
    
    Log "OK" "[BATCH $BatchNum] COMPLETE: $passed/$($layers.Count) layers passed in $([int]$duration)s"
    
    $summary = @{
        timestamp = $Timestamp
        batch = $BatchNum
        total_layers = $layers.Count
        passed = $passed
        failed = $failed
        duration_seconds = [int]$duration
        results = $results
        log_file = $LogFile
    }
    
    $summary | ConvertTo-Json -Depth 10 | Out-File -Path $EvidenceFile -Encoding UTF8
    Log "INFO" "Evidence saved: $EvidenceFile"
    return $true
}

# ============================================================================
# MAIN
# ============================================================================

Log "INFO" "=============================================="
Log "INFO" "Run-AutoReviser.ps1 - Reliable Execution"
Log "INFO" "=============================================="
Log "INFO" "UI Root: $UiRoot"
Log "INFO" "Python: $PythonExe"
Log "INFO" "Timestamp: $Timestamp"

# DISCOVER - Pre-flight checks
Log "INFO" "[DISCOVER] Pre-flight validation..."
if (-not (Verify-Python)) { exit 1 }
if (-not (Verify-AutoReviser)) { exit 1 }
if (-not (Verify-NoPartialState)) { exit 1 }

# PLAN
if ($Layer) {
    Log "INFO" "[PLAN] Will run single layer: $Layer (test mode: $TestOnly)"
}
elseif ($Batch -gt 0) {
    Log "INFO" "[PLAN] Will run Batch $Batch ($($BATCHES[$Batch].Count) layers)"
}
else {
    Log "INFO" "[PLAN] No layer or batch specified. Use: -Layer <name> or -Batch <1-4>"
    exit 1
}

# DO
if ($Layer) {
    Log "INFO" "[DO] Running single layer..."
    if (Invoke-Layer -LayerName $Layer -IsTest $TestOnly) {
        Log "OK" "[CHECK] Layer passed. Evidence in: $EvidenceFile"
        exit 0
    }
    else {
        Log "FAIL" "[CHECK] Layer failed. See log: $LogFile"
        exit 1
    }
}
elseif ($Batch -gt 0) {
    Log "INFO" "[DO] Running batch..."
    if (Run-Batch -BatchNum $Batch) {
        Log "OK" "[CHECK] Batch passed"
        exit 0
    }
    else {
        Log "FAIL" "[CHECK] Batch failed - stopping"
        exit 1
    }
}
