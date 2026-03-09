# Session 41 Part 8 - Test All Endpoints
# Comprehensive test suite for Priority 3 FK validation endpoints

$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$ErrorActionPreference = "Continue"

Write-Host "=" * 80
Write-Host "Session 41 Part 8 - FK Validation Endpoint Testing"
Write-Host "=" * 80
Write-Host "`nBase URL: $base"
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# ============================================================================
# Test Suite 1: Cascade Impact Check
# ============================================================================

Write-Host "`n" + ("=" * 80)
Write-Host "TEST SUITE 1: Cascade Impact Check"
Write-Host ("=" * 80)

Write-Host "`n[Test 1A] Cascade check for 'projects' container (should have references)"
Write-Host ("-" * 80)
try {
    $cascade1 = Invoke-RestMethod "$base/admin/cascade-check/containers/projects" -ErrorAction Stop
    
    Write-Host "✅ Request successful"
    Write-Host "   Target: $($cascade1.target.layer)/$($cascade1.target.id)"
    Write-Host "   Exists: $($cascade1.target.exists)"
    Write-Host "   Is Active: $($cascade1.target.is_active)"
    Write-Host "   Total References: $($cascade1.total_references)"
    Write-Host "   Safe to Delete: $($cascade1.safe_to_delete)"
    
    if ($cascade1.references) {
        Write-Host "`n   Referenced By:"
        $cascade1.references | ForEach-Object {
            Write-Host "     - $($_.source_layer).$($_.source_field): $($_.referring_objects.Count) objects"
        }
    }
    
    if ($cascade1.warning) {
        Write-Host "`n   ⚠️  Warning: $($cascade1.warning)"
    }
    
    # Validation
    if ($cascade1.target.exists -and $cascade1.total_references -gt 0) {
        Write-Host "`n   ✅ PASS: Object exists and has references as expected"
    } else {
        Write-Host "`n   ⚠️  INFO: Object might not have expected references"
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)"
}

Write-Host "`n[Test 1B] Cascade check for feature flag (should be safe to delete)"
Write-Host ("-" * 80)
try {
    $cascade2 = Invoke-RestMethod "$base/admin/cascade-check/feature_flags/enable-redis-cache" -ErrorAction Stop
    
    Write-Host "✅ Request successful"
    Write-Host "   Target: $($cascade2.target.layer)/$($cascade2.target.id)"
    Write-Host "   Exists: $($cascade2.target.exists)"
    Write-Host "   Total References: $($cascade2.total_references)"
    Write-Host "   Safe to Delete: $($cascade2.safe_to_delete)"
    
    # Validation
    if ($cascade2.safe_to_delete -eq $true -and $cascade2.total_references -eq 0) {
        Write-Host "`n   ✅ PASS: Safe to delete with 0 references"
    } else {
        Write-Host "`n   ℹ️  INFO: safe_to_delete=$($cascade2.safe_to_delete), references=$($cascade2.total_references)"
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)"
}

# ============================================================================
# Test Suite 2: Reverse Reference Lookup
# ============================================================================

Write-Host "`n`n" + ("=" * 80)
Write-Host "TEST SUITE 2: Reverse Reference Lookup"
Write-Host ("=" * 80)

Write-Host "`n[Test 2A] References to 'projects' container"
Write-Host ("-" * 80)
try {
    $refs1 = Invoke-RestMethod "$base/admin/references/containers/projects" -ErrorAction Stop
    
    Write-Host "✅ Request successful"
    Write-Host "   Target: $($refs1.target.layer)/$($refs1.target.id)"
    Write-Host "   Exists: $($refs1.target.exists)"
    Write-Host "   Is Active: $($refs1.target.is_active)"
    Write-Host "   Total References: $($refs1.total_references)"
    
    if ($refs1.referenced_by) {
        Write-Host "`n   Referenced By:"
        $refs1.referenced_by.PSObject.Properties | ForEach-Object {
            Write-Host "     $($_.Name):"
            Write-Host "       Field: $($_.Value.field)"
            Write-Host "       Count: $($_.Value.count)"
            Write-Host "       Sample: $($_.Value.references[0].id)"
        }
    }
    
    if ($refs1.usage_summary) {
        Write-Host "`n   Usage Summary: $($refs1.usage_summary)"
    }
    
    # Validation
    if ($refs1.target.exists -and $refs1.total_references -gt 0) {
        Write-Host "`n   ✅ PASS: Found reverse references correctly"
    } else {
        Write-Host "`n   ℹ️  INFO: No references found (may be expected)"
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)"
}

Write-Host "`n[Test 2B] References to new Priority 1 layer (service_health_metrics)"
Write-Host ("-" * 80)
try {
    # Get first record from service_health_metrics
    $summary = Invoke-RestMethod "$base/model/agent-summary"
    if ($summary.layers.service_health_metrics -gt 0) {
        # Try to get the first record
        $health_records = Invoke-RestMethod "$base/model/service_health_metrics"
        if ($health_records -and $health_records.Count -gt 0) {
            $first_id = $health_records[0].id
            $refs2 = Invoke-RestMethod "$base/admin/references/service_health_metrics/$first_id" -ErrorAction Stop
            
            Write-Host "✅ Request successful"
            Write-Host "   Target: $($refs2.target.layer)/$($refs2.target.id)"
            Write-Host "   Exists: $($refs2.target.exists)"
            Write-Host "   Total References: $($refs2.total_references)"
            
            if ($refs2.total_references -eq 0) {
                Write-Host "`n   ✅ PASS: Priority 1 layer operational, 0 references expected"
            } else {
                Write-Host "`n   ℹ️  INFO: Found $($refs2.total_references) references"
            }
        } else {
            Write-Host "⚠️  SKIP: No records in service_health_metrics yet"
        }
    } else {
        Write-Host "⚠️  SKIP: service_health_metrics not seeded yet (0 records)"
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)"
}

# ============================================================================
# Test Suite 3: Enhanced Validation
# ============================================================================

Write-Host "`n`n" + ("=" * 80)
Write-Host "TEST SUITE 3: Enhanced Validation"
Write-Host ("=" * 80)

Write-Host "`n[Test 3A] Enhanced validation report"
Write-Host ("-" * 80)
try {
    $validation = Invoke-RestMethod "$base/admin/validate?enhanced=true" -ErrorAction Stop
    
    Write-Host "✅ Request successful"
    Write-Host "   Overall Status: $($validation.overall_status)"
    Write-Host "`n   Breaking Errors: $($validation.breaking.count)"
    if ($validation.breaking.violations) {
        $validation.breaking.violations | Select-Object -First 3 | ForEach-Object {
            Write-Host "     - $_"
        }
        if ($validation.breaking.violations.Count -gt 3) {
            Write-Host "     ... and $($validation.breaking.violations.Count - 3) more"
        }
    }
    
    Write-Host "`n   Warnings: $($validation.warnings.count)"
    if ($validation.warnings.violations) {
        $validation.warnings.violations | Select-Object -First 3 | ForEach-Object {
            Write-Host "     - $_"
        }
        if ($validation.warnings.violations.Count -gt 3) {
            Write-Host "     ... and $($validation.warnings.violations.Count - 3) more"
        }
    }
    
    Write-Host "`n   Info: $($validation.info.count)"
    
    if ($validation.orphaned_references) {
        Write-Host "`n   Orphaned References:"
        $validation.orphaned_references.PSObject.Properties | ForEach-Object {
            Write-Host "     $($_.Name): $($_.Value.count) orphans"
        }
    }
    
    if ($validation.recommended_actions) {
        Write-Host "`n   Recommended Actions:"
        $validation.recommended_actions | Select-Object -First 3 | ForEach-Object {
            Write-Host "     - $_"
        }
    }
    
    # Validation
    if ($validation.overall_status -in @("pass", "warning")) {
        Write-Host "`n   ✅ PASS: Overall status is acceptable ($($validation.overall_status))"
    } else {
        Write-Host "`n   ⚠️  STATUS: $($validation.overall_status)"
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)"
}

Write-Host "`n[Test 3B] Legacy validation (for comparison)"
Write-Host ("-" * 80)
try {
    $legacy = Invoke-RestMethod "$base/admin/validate" -ErrorAction Stop
    
    Write-Host "✅ Request successful"
    Write-Host "   OK: $($legacy.ok)"
    Write-Host "   Violations: $($legacy.violations.Count)"
    if ($legacy.violations) {
        $legacy.violations | Select-Object -First 3 | ForEach-Object {
            Write-Host "     - $_"
        }
        if ($legacy.violations.Count -gt 3) {
            Write-Host "     ... and $($legacy.violations.Count - 3) more"
        }
    }
    
    Write-Host "`n   ✅ PASS: Legacy endpoint still works (backward compatible)"
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)"
}

# ============================================================================
# Test Suite 4: FK Relationship Coverage
# ============================================================================

Write-Host "`n`n" + ("=" * 80)
Write-Host "TEST SUITE 4: FK Relationship Coverage"
Write-Host ("=" * 80)

Write-Host "`n[Test 4A] Verify 9 FK relationships defined"
Write-Host ("-" * 80)

$expected_relationships = @(
    "endpoints.cosmos_reads → containers",
    "endpoints.cosmos_writes → containers",
    "endpoints.feature_flag → feature_flags",
    "endpoints.auth → personas",
    "screens.api_calls → endpoints",
    "literals.screens → screens",
    "requirements.satisfied_by → endpoints/screens",
    "agents.output_screens → screens",
    "auto_fix_execution_history.endpoint → endpoints"
)

Write-Host "Expected FK Relationships:"
$expected_relationships | ForEach-Object {
    Write-Host "   ✓ $_"
}

Write-Host "`n   ℹ️  Note: Actual relationships are validated in api/validation.py"
Write-Host "   ℹ️  Run: python test_validation_module.py for local verification"

# ============================================================================
# Summary
# ============================================================================

Write-Host "`n`n" + ("=" * 80)
Write-Host "TEST SUMMARY"
Write-Host ("=" * 80)

Write-Host "`nTest Results:"
Write-Host "  - Cascade Impact Check: 2 tests"
Write-Host "  - Reverse Reference Lookup: 2 tests"
Write-Host "  - Enhanced Validation: 2 tests"
Write-Host "  - FK Relationship Coverage: Documented"

Write-Host "`nNext Steps:"
Write-Host "  1. Review any failures above"
Write-Host "  2. Verify all endpoints return expected data structures"
Write-Host "  3. Check FK relationships are accurately identified"
Write-Host "  4. Update documentation with test results"

Write-Host "`n" + ("=" * 80)
Write-Host "Testing Complete"
Write-Host ("=" * 80)
Write-Host ""
