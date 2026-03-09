# Foreign Key Validation Enhancement Design

**Session 41 Part 7 - Priority 3**  
**Date**: March 9, 2026

---

## Executive Summary

Enhance the EVA Data Model API's foreign key validation with:

1. **Cascade Impact Analysis** - Prevent accidental deletions that would break references
2. **Enhanced Orphan Detection** - Detailed categorization and remediation guidance
3. **Reverse Reference Lookup** - "Who references me?" queries for any object

All enhancements are **non-breaking** and extend existing `/admin/validate` endpoint plus add new endpoints.

---

## Current State

### Existing FK Validation (GET /admin/validate)

Currently validates 7 FK relationships:

| Source Layer | Field | Target Layer(s) | Type |
|--------------|-------|----------------|------|
| endpoints | cosmos_reads/writes | containers | Array |
| endpoints | feature_flag | feature_flags | Single |
| endpoints | auth | personas | Array |
| screens | api_calls | endpoints | Array |
| literals | screens | screens | Array |
| requirements | satisfied_by | endpoints + screens | Array |
| agents | output_screens | screens | Array |

**Current Output**:
```json
{
  "violations": ["endpoint 'E001' cosmos_reads references unknown container 'C999'"],
  "count": 1,
  "status": "FAIL"
}
```

**Limitations**:
- No impact analysis before deletion
- No categorization by severity
- No remediation guidance
- No reverse lookup capability
- No layer-specific reporting

---

## Enhancement 1: Cascade Impact Analysis

### New Endpoint: GET /admin/cascade-check/{layer}/{obj_id}

**Purpose**: Identify all objects that reference a specific target, preventing accidental deletions that would break FK constraints.

**Use Cases**:
- Before deleting a screen, check if any literals or agents reference it
- Before deleting an endpoint, check if any screens or requirements reference it
- Before deleting a container, check if any endpoints read/write to it

**Request**:
```http
GET /admin/cascade-check/screens/S001
```

**Response**:
```json
{
  "target": {
    "layer": "screens",
    "id": "S001",
    "exists": true,
    "is_active": true
  },
  "references": [
    {
      "layer": "literals",
      "field": "screens",
      "referencing_objects": [
        {"id": "L001", "is_active": true},
        {"id": "L002", "is_active": true}
      ],
      "count": 2
    },
    {
      "layer": "agents",
      "field": "output_screens",
      "referencing_objects": [
        {"id": "A001", "is_active": true}
      ],
      "count": 1
    }
  ],
  "total_references": 3,
  "safe_to_delete": false,
  "warning": "Deleting this object would create 3 orphaned references across 2 layers",
  "remediation": [
    "Remove S001 from literals L001, L002 (field: screens)",
    "Remove S001 from agents A001 (field: output_screens)"
  ]
}
```

**If Safe to Delete**:
```json
{
  "target": {"layer": "containers", "id": "C999", "exists": true, "is_active": true},
  "references": [],
  "total_references": 0,
  "safe_to_delete": true,
  "message": "No objects reference this target. Safe to delete."
}
```

**Implementation**:
- New function: `cascade_impact_check(layer: str, obj_id: str) -> dict`
- Reverse index lookup for all FK relationships
- Check both active and inactive references (soft-deleted objects)
- Return detailed remediation steps

---

## Enhancement 2: Enhanced Orphan Detection

### Extended Endpoint: GET /admin/validate (Enhanced Response)

**Purpose**: Provide detailed categorization, severity levels, and remediation guidance for FK violations.

**Current Response** (for reference):
```json
{
  "violations": ["endpoint 'E001' cosmos_reads references unknown container 'C999'"],
  "count": 1,
  "status": "FAIL"
}
```

**New Enhanced Response**:
```json
{
  "status": "FAIL",
  "summary": {
    "total_violations": 12,
    "critical": 8,
    "warning": 4,
    "layers_affected": 5,
    "records_affected": 10
  },
  "violations_by_layer": {
    "endpoints": {
      "count": 5,
      "violations": [
        {
          "id": "E001",
          "field": "cosmos_reads",
          "invalid_reference": "C999",
          "target_layer": "containers",
          "severity": "critical",
          "message": "References non-existent container 'C999'",
          "remediation": "Remove 'C999' from cosmos_reads array or create container C999"
        },
        {
          "id": "E002",
          "field": "feature_flag",
          "invalid_reference": "FF-DELETED",
          "target_layer": "feature_flags",
          "severity": "warning",
          "message": "References soft-deleted feature flag 'FF-DELETED'",
          "remediation": "Update feature_flag to null or reactivate FF-DELETED"
        }
      ]
    },
    "screens": {
      "count": 3,
      "violations": [...]
    }
  },
  "violations": [
    "endpoint 'E001' cosmos_reads references unknown container 'C999'",
    "endpoint 'E002' feature_flag 'FF-DELETED' is inactive",
    "screen 'S001' api_calls references unknown endpoint 'E999'",
    "literal 'L001' screens references unknown screen 'S888'"
  ],
  "legacy_format_note": "violations array maintained for backward compatibility"
}
```

**Severity Levels**:
- **CRITICAL**: References completely non-existent object (never existed or hard-deleted)
- **WARNING**: References soft-deleted object (is_active=false)

**Implementation**:
- Extend existing `validate()` function
- Add severity classification logic
- Group violations by layer for easier remediation
- Provide actionable remediation steps

---

## Enhancement 3: Reverse Reference Lookup

### New Endpoint: GET /admin/references/{layer}/{obj_id}

**Purpose**: Answer the question "Who references me?" for any object. Useful for:
- Understanding object dependencies
- Planning migrations
- Impact analysis for changes

**Request**:
```http
GET /admin/references/containers/users
```

**Response**:
```json
{
  "target": {
    "layer": "containers",
    "id": "users",
    "exists": true,
    "is_active": true
  },
  "referenced_by": {
    "endpoints": {
      "field": "cosmos_reads",
      "references": [
        {"id": "user-profile-get", "is_active": true},
        {"id": "user-list-query", "is_active": true}
      ],
      "count": 2
    },
    "endpoints_writes": {
      "field": "cosmos_writes",
      "references": [
        {"id": "user-update-post", "is_active": true},
        {"id": "user-create-post", "is_active": true}
      ],
      "count": 2
    }
  },
  "total_references": 4,
  "usage_summary": "Container 'users' is read by 2 endpoints and written by 2 endpoints"
}
```

**No References Example**:
```json
{
  "target": {"layer": "feature_flags", "id": "experimental-AI", "exists": true, "is_active": false},
  "referenced_by": {},
  "total_references": 0,
  "usage_summary": "No active references found. Safe to permanently delete."
}
```

**Implementation**:
- Identical logic to cascade-check but different presentation
- Focus on usage patterns rather than deletion safety

---

## FK Relationship Matrix

Complete mapping of all FK relationships in EVA Data Model:

| Parent (Referenced) | Child (Referencing) | Field | Cardinality |
|---------------------|---------------------|-------|-------------|
| containers | endpoints | cosmos_reads | Many-to-Many |
| containers | endpoints | cosmos_writes | Many-to-Many |
| feature_flags | endpoints | feature_flag | Many-to-One |
| personas | endpoints | auth | Many-to-Many |
| endpoints | screens | api_calls | Many-to-Many |
| endpoints | requirements | satisfied_by | Many-to-Many (with screens) |
| screens | literals | screens | Many-to-Many |
| screens | agents | output_screens | Many-to-Many |
| screens | requirements | satisfied_by | Many-to-Many (with endpoints) |

**Total FK Relationships**: 9 distinct relationships across 7 layers

---

## Implementation Plan

### Phase 1: Core Infrastructure (15 minutes)
- Create `api/validation.py` module with FK mapping constants
- Implement `build_reverse_index()` function for fast lookups
- Add helper functions for severity classification

### Phase 2: Cascade Impact Analysis (20 minutes)
- Implement `cascade_impact_check()` function
- Add `/admin/cascade-check/{layer}/{obj_id}` endpoint
- Unit tests for all FK relationships

### Phase 3: Enhanced Orphan Detection (15 minutes)
- Extend existing `validate()` function with enhanced response
- Maintain backward compatibility (keep simple violations array)
- Add severity classification and remediation guidance

### Phase 4: Reverse Reference Lookup (10 minutes)
- Implement `/admin/references/{layer}/{obj_id}` endpoint
- Reuse cascade-check logic with different presentation

### Phase 5: Testing & Documentation (20 minutes)
- Integration tests for all new endpoints
- Update API documentation
- Create usage examples

**Total Estimated Time**: 80 minutes

---

## API Changes Summary

### New Endpoints

1. **GET /admin/cascade-check/{layer}/{obj_id}** (NEW)
   - Returns cascade impact analysis
   - Identifies all references to target object
   - Provides deletion safety assessment

2. **GET /admin/references/{layer}/{obj_id}** (NEW)
   - Returns reverse reference lookup
   - Lists all objects that reference the target
   - Provides usage summary

### Modified Endpoints

3. **GET /admin/validate** (ENHANCED)
   - Extended response with detailed categorization
   - Severity levels (critical vs warning)
   - Layer-specific grouping
   - Remediation guidance
   - **Backward Compatible**: Original violations array maintained

---

## Performance Considerations

### Current Validation
- **Time Complexity**: O(n × m) where n = records, m = FK fields
- **Current Performance**: ~200-300ms for 5,800 records

### Enhanced Validation
- **Reverse Index**: One-time O(n) build, then O(1) lookups
- **Expected Performance**: ~250-350ms (16-30% slower)
- **Cascade Check**: O(1) with reverse index
- **References Lookup**: O(1) with reverse index

**Mitigation**:
- Cache reverse index for 5 minutes (cleared on seed/commit)
- Lazy build only when cascade/references endpoints called

---

## Error Handling

### Target Object Not Found
```json
{
  "error": "Target object not found",
  "target": {"layer": "screens", "id": "NONEXISTENT", "exists": false},
  "message": "Cannot perform cascade check on non-existent object"
}
```

### Invalid Layer Name
```json
{
  "error": "Invalid layer",
  "layer": "invalid_layer",
  "valid_layers": ["containers", "endpoints", "screens", ...]
}
```

---

## Testing Strategy

### Unit Tests (`tests/test_validation.py`)
1. Test each FK relationship independently
2. Test orphan detection (references to deleted objects)
3. Test cascade impact with nested references
4. Test reverse lookup with multi-layer references

### Integration Tests (`tests/integration/test_fk_validation.py`)
1. Seed test data with deliberate FK violations
2. Call `/admin/validate` and verify all violations caught
3. Call `/admin/cascade-check` before deletion
4. Verify safe_to_delete flag accuracy

### Edge Cases
1. Circular references (if any exist in model)
2. Soft-deleted objects (is_active=false)
3. Empty arrays vs null values
4. Mixed active/inactive references

---

## Rollback Plan

If issues arise:
1. New endpoints can be disabled without affecting existing API
2. Enhanced validate response is additive (old violations array preserved)
3. No database schema changes required
4. Can deploy incrementally (one endpoint at a time)

---

## Success Metrics

**Before Enhancement**:
- FK validation: Basic existence checks only
- No pre-deletion safety checks
- No detailed reporting
- Manual investigation required for orphan remediation

**After Enhancement**:
- **100% FK coverage**: All 9 relationships validated
- **Pre-deletion safety**: Cascade impact analysis prevents accidental breakage
- **Detailed diagnostics**: Severity, layer grouping, remediation guidance
- **Proactive monitoring**: Reverse reference lookup for dependency tracking

**Expected Impact**:
- 80% reduction in accidental FK violations (through cascade-check)
- 90% faster orphan investigation (detailed reporting vs manual queries)
- 100% visibility into object dependencies (reverse references)

---

## Next Steps

1. ✅ Create design document (this file)
2. ⏳ Implement `api/validation.py` module
3. ⏳ Add new endpoints to `api/routers/admin.py`
4. ⏳ Create comprehensive tests
5. ⏳ Update API documentation
6. ⏳ Deploy and validate in production

---

**Document Status**: Design Complete - Ready for Implementation  
**Estimated Implementation Time**: 80 minutes  
**Backward Compatibility**: 100% (all additive changes)  
**Risk Level**: Low (new endpoints, enhanced responses are additive)
