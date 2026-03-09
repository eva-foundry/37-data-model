# Session 41 - Seed Fix Plan (DPDCA)

## DISCOVER (Complete ✅)

**Finding 1: Layer vs File Count Mismatch**
- _LAYER_FILES: 87 entries
- JSON files: 82 files
- Conclusion: 5 layers don't have JSON files (acceptable - computed/special layers)

**Finding 2: Structure Analysis**
- ✅ Working files: 73/82 (89%)
  - 70 files: `{"layer_name": [...]}`
  - 3 files: `[...]` raw arrays
- ❌ Problematic files: 9/82 (11%)

**Finding 3: The 9 Problematic Files**

| File | Issue | Wrong Key Found | Actual Data Location |
|------|-------|-----------------|---------------------|
| agent_execution_history.json | OTHER_ARRAY | execution_records (5 obj) | ❓ Need to check |
| agent_performance_metrics.json | OTHER_ARRAY | agent_metrics (5 obj) | ❓ Need to check |
| azure_infrastructure.json | OTHER_ARRAY | deployment_sequence (8 obj) | ❓ Likely "resources" |
| deployment_quality_scores.json | OTHER_ARRAY | quality_scores (4 obj) | ❓ Need to check |
| eva_model.json | NO_ARRAYS | 4 bytes empty | ⚠️ Placeholder file |
| evidence.json | NO_ARRAYS | "objects" key exists | ❓ Need to check |
| performance_trends.json | OTHER_ARRAY | trend_records (4 obj) | ❓ Need to check |
| remediation_effectiveness.json | OTHER_ARRAY | by_policy (3 obj) | ❓ Need to check |
| traces.json | KEY_NOT_ARRAY | "traces" exists but not array | ❓ Need to check |

## PLAN (This Document)

### Option A: Special Case Mappings (Quick Fix)
Create a dict mapping layer names to their actual data keys:
```python
_LAYER_DATA_KEYS = {
    "agent_execution_history": "execution_records",
    "agent_performance_metrics": "agent_metrics",
    "azure_infrastructure": "resources",  # Or deployment_sequence?
    "deployment_quality_scores": "quality_scores",
    "performance_trends": "trend_records",
    "remediation_effectiveness": "by_policy",
    # Others need investigation
}
```

**Pros:** Quick, minimal code change
**Cons:** Maintenance burden, doesn't solve root cause

### Option B: Smart Parser (Better Solution)
Enhance the seed logic to:
1. Try exact layer name match
2. Try common variations (plurals, snake_case)
3. Check _LAYER_DATA_KEYS for known exceptions
4. If all fail, use first array with 'id' fields
5. Log warnings for ambiguous cases

**Pros:** Handles most cases automatically
**Cons:** More complex logic

### 🎯 Recommended: **Option B with Option A fallback**

## DO (Implementation Steps)

### Step 1: Verify Actual Data Locations
For each of the 9 files, inspect to find where actual data lives:
```powershell
@(
    "agent_execution_history",
    "agent_performance_metrics",
    "azure_infrastructure",
    "deployment_quality_scores",
    "evidence",
    "performance_trends",
    "remediation_effectiveness",
    "traces"
) | ForEach-Object {
    Write-Host "`n=== $_ ===" -ForegroundColor Cyan
    $content = Get-Content "model\$_.json" | ConvertFrom-Json
    $content | Get-Member -MemberType NoteProperty | Select-Object Name, Definition
}
```

### Step 2: Create _LAYER_DATA_KEYS Mapping
Based on Step 1 findings, create authoritative mapping

### Step 3: Enhance Seed Logic
Update `api/routers/admin.py`:
```python
def extract_objects_from_json(raw: dict | list, layer: str) -> list[dict]:
    """Extract object array from JSON file, handling various structures."""
    
    # Case 1: Raw array
    if isinstance(raw, list):
        return raw
    
    # Case 2: Dict
    if isinstance(raw, dict):
        # Try exact layer name match
        if layer in raw and isinstance(raw[layer], list):
            return raw[layer]
        
        # Check known exceptions
        if layer in _LAYER_DATA_KEYS:
            key = _LAYER_DATA_KEYS[layer]
            if key in raw and isinstance(raw[key], list):
                return raw[key]
        
        # Try common variations
        for candidate in [layer + 's', layer.replace('_', '-')]:
            if candidate in raw and isinstance(raw[candidate], list):
                return raw[candidate]
        
        # Last resort: find first array with 'id' fields
        for key, value in raw.items():
            if isinstance(value, list) and len(value) > 0:
                if all(isinstance(obj, dict) and 'id' in obj for obj in value[:3]):
                    logger.warning(f"Layer {layer}: Using array from key '{key}' (not exact match)")
                    return value
    
    return []
```

### Step 4: Add Verbose Counters
Update seed endpoint to track:
- Total layers in _LAYER_FILES: 87
- JSON files found: N
- Files successfully parsed: N
- Objects loaded per file

### Step 5: Test Locally
```powershell
# Start local API
uvicorn api.server:app --port 8010

# Run seed
$result = Invoke-RestMethod "http://localhost:8010/model/admin/seed" -Method POST

# Verify
$result.seeded.Count  # Should be 82 (files with data)
$result.total         # Should be ~5,527
$result.errors        # Should be [] or only known placeholders
```

## CHECK (Verification)

- [ ] All 9 problematic files load correctly
- [ ] Known good files (70 + 3 = 73) still work
- [ ] Total object count matches expected (~5,527)
- [ ] Verbose progress shows correct file/layer/object counts
- [ ] Tests pass

## ACT (Deployment)

1. Create feature branch: `fix/seed-smart-parser`
2. Commit with evidence from diagnosis tool
3. PR with before/after comparison
4. Merge to main
5. Build image: `seed-fix-v1`
6. Deploy to production
7. Run seed operation
8. Verify Cosmos DB has all data

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Layers processed | 1 | 82-87 |
| Objects loaded | ~50 | ~5,527 |
| Files with errors | 9 | 0-2 (placeholders OK) |
| Parse success rate | 1.1% | >98% |
