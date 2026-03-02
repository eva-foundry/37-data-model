#Requires -Version 7.0
<#
.SYNOPSIS
Validate all evidence records against evidence schema.
Enforces merge-blocking validation gates.

.DESCRIPTION
Loads all evidence objects from model/evidence.json and validates against
schema/evidence.schema.json using JSON Schema validation.

Merge-blocking gates:
  - validation.test_result = "FAIL"     → BLOCK merge
  - validation.lint_result = "FAIL"     → BLOCK merge
  - validation.coverage_percent < 80    → WARN (not blocking)

.EXAMPLE
    .\evidence_validate.ps1
    # Exit 0 if all evidence is valid; exit 1 if FAIL gates detected

.NOTES
    Part of 37-data-model CI/CD validation pipeline.
    Call from GitHub Actions or ADO Pipelines as a merge gate.
#>

param()

$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"

$repo_root = "$PSScriptRoot\.."
$schema_file = "$repo_root\schema\evidence.schema.json"
$model_file = "$repo_root\model\evidence.json"

Write-Host "=== Evidence Layer Validation ==="
Write-Host "  Schema: $schema_file"
Write-Host "  Model:  $model_file"
Write-Host ""

# ── Load schema ───────────────────────────────────────────────────────
if (-not (Test-Path $schema_file)) {
    Write-Host "[SKIP] Schema not found: $schema_file (expected for fresh repos)"
    exit 0
}

$schema = Get-Content $schema_file | ConvertFrom-Json
Write-Host "[OK] Schema loaded"

# ── Load model ─────────────────────────────────────────────────────────
if (-not (Test-Path $model_file)) {
    Write-Host "[SKIP] Model not found: $model_file (expected for fresh repos)"
    exit 0
}

$model = Get-Content $model_file | ConvertFrom-Json
$evidence_objects = $model.objects

$total = $evidence_objects.Count
Write-Host "[OK] Loaded $total evidence objects"

if ($total -eq 0) {
    Write-Host "[SKIP] No evidence objects to validate"
    exit 0
}

# ── Validate each object ──────────────────────────────────────────────
$violations = @()
$fails = @()
$warnings = @()

foreach ($obj in $evidence_objects) {
    $obj_id = $obj.id

    # Required fields
    @("id", "sprint_id", "story_id", "phase", "created_at") | ForEach-Object {
        if (-not $obj.$_) {
            $violations += "[$obj_id] Missing required field: $_"
        }
    }

    # Phase enum
    if ($obj.phase -notin @("D1", "D2", "P", "D3", "A")) {
        $violations += "[$obj_id] Invalid phase: $($obj.phase)"
    }

    # Validation gates (merge blockers)
    if ($obj.validation) {
        if ($obj.validation.test_result -eq "FAIL") {
            $fails += "[$obj_id] test_result=FAIL (blocks merge)"
        }
        if ($obj.validation.lint_result -eq "FAIL") {
            $fails += "[$obj_id] lint_result=FAIL (blocks merge)"
        }
        if ($obj.validation.coverage_percent -and $obj.validation.coverage_percent -lt 80 -and $obj.validation.coverage_percent -gt 0) {
            $warnings += "[$obj_id] coverage_percent=$($obj.validation.coverage_percent)% (below 80% target)"
        }
    }

    # Artifact validation
    if ($obj.artifacts) {
        foreach ($art in $obj.artifacts) {
            if (-not $art.path) {
                $violations += "[$obj_id] Artifact missing path"
            }
            if ($art.type -notin @("source", "test", "schema", "config", "doc", "report", "other")) {
                $violations += "[$obj_id] Invalid artifact type: $($art.type)"
            }
            if ($art.action -notin @("created", "modified", "deleted")) {
                $violations += "[$obj_id] Invalid artifact action: $($art.action)"
            }
        }
    }

    # Metrics validation
    if ($obj.metrics) {
        if ($obj.metrics.duration_ms -and $obj.metrics.duration_ms -lt 0) {
            $violations += "[$obj_id] duration_ms must be non-negative"
        }
    }
}

# ── Report ─────────────────────────────────────────────────────────────
$violate_count = $violations.Count
$fail_count = $fails.Count
$warn_count = $warnings.Count

if ($violate_count -gt 0) {
    Write-Host ""
    Write-Host "[FAIL] Violations detected:"
    $violations | ForEach-Object { Write-Host "  - $_" }
}

if ($fail_count -gt 0) {
    Write-Host ""
    Write-Host "[FAIL] Merge-blocking gates failed:"
    $fails | ForEach-Object { Write-Host "  - $_" }
}

if ($warn_count -gt 0) {
    Write-Host ""
    Write-Host "[WARN] Warnings (not blocking):"
    $warnings | ForEach-Object { Write-Host "  - $_" }
}

Write-Host ""
if ($violate_count -eq 0 -and $fail_count -eq 0) {
    Write-Host "[PASS] All $total evidence objects valid. No merge blocks."
    exit 0
} else {
    Write-Host "[FAIL] $violate_count violations + $fail_count merge-blocks detected."
    exit 1
}
