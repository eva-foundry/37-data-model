# PART 3.PLAN - Design Comprehensive Test Matrix
# Purpose: Create test strategy for all 173 screens across multiple test types
# Output: PART-3-TEST-MATRIX-{timestamp}.json with test plan

param([string]$RegistryFile = "docs/examples\screen-registry-payload.json", [string]$EvidenceDir = "evidence")

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "[PLAN] PART 3.PLAN: Designing comprehensive test matrix"
Write-Host "[PLAN] Timestamp: $timestamp"
Write-Host ""

# Load registry
Write-Host "[PLAN] STEP 1: Load screen registry"
Write-Host ("─" * 80)

try {
    if (-Not (Test-Path $RegistryFile)) { throw "Registry not found" }
    $registry = Get-Content $RegistryFile | ConvertFrom-Json
    if ($registry -isnot [array]) { $registry = @($registry) }
    $count = $registry.Count
    Write-Host "[OK] Loaded $count screens"
}
catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Design test matrix
Write-Host "[PLAN] STEP 2: Design test matrix by screen type"
Write-Host ("─" * 80)

$testMatrix = @{
    unit_tests = @{
        description = "Unit tests for individual components"
        frameworks = @("pytest", "jest")
        coverage = 80
        estimated_tests = $count
        estimated_duration_minutes = $count / 2  # 0.5 min per test
        screens_applicable = @(
            "eva-faces components", "project screens", 
            "react pages", "backend services"
        )
    }
    integration_tests = @{
        description = "Integration tests for layer interactions"
        frameworks = @("pytest", "jest")
        coverage = 60
        estimated_tests = $count / 2
        estimated_duration_minutes = $count / 1
        screens_applicable = @(
            "data-model layers", "screen-to-layer mappings",
            "cross-layer navigation"
        )
    }
    e2e_tests = @{
        description = "End-to-end tests for user workflows"
        frameworks = @("playwright", "cypress")
        coverage = 50
        estimated_tests = $count / 5
        estimated_duration_minutes = $count
        screens_applicable = @(
            "eva-faces pages", "project dashboards",
            "user workflows", "multi-step processes"
        )
    }
    accessibility_tests = @{
        description = "WCAG AA compliance for all screens"
        frameworks = @("axe-core", "pa11y")
        coverage = 100
        estimated_tests = $count
        estimated_duration_minutes = $count / 4
        screens_applicable = @("all screens")
    }
    performance_tests = @{
        description = "Load and performance testing"
        frameworks = @("k6", "locust")
        coverage = 30
        estimated_tests = 10
        estimated_duration_minutes = 60
        screens_applicable = @(
            "data-model queries", "dashboard loads",
            "search functionality"
        )
    }
}

Write-Host "[OK] Test matrix designed with 5 test types"
foreach ($test in $testMatrix.Keys) {
    Write-Host "  - $test : $($testMatrix[$test].estimated_tests) tests"
}

Write-Host ""

# Calculate coverage totals
Write-Host "[PLAN] STEP 3: Calculate test coverage totals"
Write-Host ("─" * 80)

$totalTests = 0
$totalMinutes = 0
$totalCoverage = 0

foreach ($test in $testMatrix.Values) {
    $totalTests += $test.estimated_tests
    $totalMinutes += $test.estimated_duration_minutes
}

Write-Host "[OK] Total estimated tests: $totalTests"
Write-Host "[OK] Total estimated duration: $([math]::Round($totalMinutes)) minutes"
Write-Host "[OK] Parallel execution possible with distributed runners"
Write-Host ""

# Design execution strategy
Write-Host "[PLAN] STEP 4: Define execution strategy"
Write-Host ("─" * 80)

$executionStrategy = @{
    phase_1_unit = @{
        name = "Unit Tests"
        duration_minutes = 30
        parallelism = 4
        command = "npm test -- --coverage && pytest --cov=."
        retry_count = 2
        success_criteria = "coverage >= 80%"
    }
    phase_2_integration = @{
        name = "Integration Tests"
        duration_minutes = 45
        parallelism = 2
        command = "npm run test:integration && pytest integration/"
        retry_count = 1
        success_criteria = "all tests pass"
    }
    phase_3_e2e = @{
        name = "End-to-End Tests"
        duration_minutes = 120
        parallelism = 2
        command = "npx playwright test && npx cypress run"
        retry_count = 2
        success_criteria = "no critical failures"
    }
    phase_4_accessibility = @{
        name = "Accessibility Compliance"
        duration_minutes = 60
        parallelism = 4
        command = "npm run test:a11y && python a11y_scan.py"
        retry_count = 1
        success_criteria = "WCAG AA compliance"
    }
    phase_5_performance = @{
        name = "Performance Testing"
        duration_minutes = 90
        parallelism = 1
        command = "k6 run load-tests/*.js"
        retry_count = 0
        success_criteria = "response time < 2s, p99 < 5s"
    }
}

$totalExecutionTime = 0
$totalPhases = 0
foreach ($phase in $executionStrategy.Values) {
    $totalExecutionTime += $phase.duration_minutes
    $totalPhases++
}

Write-Host "[OK] Execution strategy defined with $totalPhases phases"
Write-Host "[OK] Sequential execution time: $totalExecutionTime minutes"
Write-Host "[OK] Parallel timeline could reduce to ~120 minutes" 
Write-Host ""

# Design reporting
Write-Host "[PLAN] STEP 5: Design test reporting"
Write-Host ("─" * 80)

$reportingPlan = @{
    junit_xml = @{
        description = "JUnit XML format for CI integration"
        tools = @("jest", "pytest", "playwright")
    }
    html_reports = @{
        description = "HTML dashboards for each test phase"
        tools = @("jest", "mochawesome", "playwright-html")
    }
    coverage_reports = @{
        description = "Code coverage metrics and trends"
        tools = @("nyc", "coverage.py")
    }
    performance_metrics = @{
        description = "API response times, load times, resource usage"
        tools = @("k6", "prometheus", "grafana")
    }
    accessibility_reports = @{
        description = "WCAG violation summary and remediation"
        tools = @("axe-reporter", "pa11y-reporter")
    }
}

Write-Host "[OK] Reporting plan designed with 5 report types"
Write-Host ""

# Save plan evidence
Write-Host "[PLAN] STEP 6: Save test matrix evidence"
Write-Host ("─" * 80)

try {
    if (-Not (Test-Path $EvidenceDir)) { New-Item -ItemType Directory -Path $EvidenceDir | Out-Null }
    
    $planEvidence = @{
        phase = "PART 3.PLAN"
        timestamp = Get-Date -Format "o"
        screens_to_test = $count
        test_matrix = $testMatrix
        execution_strategy = $executionStrategy
        reporting_plan = $reportingPlan
        totals = @{
            total_tests_planned = [int]$totalTests
            total_phases = $totalPhases
            sequential_duration_minutes = $totalExecutionTime
            parallel_estimated_minutes = 120
            screens_per_test_type = @{
                unit = $count
                integration = [int]($count / 2)
                e2e = [int]($count / 5)
                accessibility = $count
                performance = 10
            }
        }
        recommendations = @(
            "Test matrix covers all screen types"
            "Parallel execution recommended to reduce runtime"
            "WCAG accessibility testing covers all 173 screens"
            "Performance tests focus on data-layer queries"
            "Ready for PART 3.DO (test execution)"
        )
    }
    
    $file = "$EvidenceDir\PART-3-TEST-MATRIX-$timestamp.json"
    $planEvidence | ConvertTo-Json -Depth 10 | Out-File -FilePath $file -Encoding UTF8
    Write-Host "[OK] Test matrix saved: $file"
}
catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[SUMMARY] PART 3.PLAN COMPLETE"
Write-Host ("─" * 80)
Write-Host "[PASS] Test matrix designed for $count screens"
Write-Host "[PASS] 5 test types planned with $totalTests total tests"
Write-Host "[PASS] Execution strategy: sequential $totalExecutionTime min, parallel ~120 min"
Write-Host "[PASS] Ready for PART 3.DO (test execution)"
Write-Host ""

exit 0
