#!/usr/bin/env python
"""
validate-stub-layers.py — Validate 24 stub layer JSON files for seed readiness.

Usage:
  python validate-stub-layers.py

Checks:
  - JSON files exist
  - JSON is valid (parseable)
  - Object count (how many objects ready to seed)
  - ID field presence (required for Cosmos DB)

Output:
  - Summary report with object counts
  - Evidence JSON for tracking
"""

import json
import sys
from pathlib import Path
from datetime import datetime

_ROOT = Path(__file__).parent
_MODEL_DIR = _ROOT / "model"

# The 24 stub layers
_STUB_LAYERS = [
    "traces",
    "work_execution_units", "work_decision_records", "work_outcomes",
    "work_factory_capabilities", "work_factory_governance", "work_factory_investments",
    "work_factory_metrics", "work_factory_portfolio", "work_factory_roadmaps", "work_factory_services",
    "work_obligations", "work_learning_feedback", "work_pattern_applications",
    "work_pattern_performance_profiles", "work_reusable_patterns",
    "work_service_breaches", "work_service_level_objectives", "work_service_lifecycle",
    "work_service_perf_profiles", "work_service_remediation_plans", "work_service_requests",
    "work_service_revalidation_results", "work_service_runs"
]

def extract_objects(raw, layer, filename):
    """Extract objects from various JSON structures."""
    objects = []
    
    # Pattern 1: Direct array
    if isinstance(raw, list):
        objects = raw
        
    # Pattern 2: Layer name as key
    elif layer in raw and isinstance(raw[layer], list):
        objects = raw[layer]
        
    # Pattern 3: "objects" key (metadata wrapper)
    elif "objects" in raw and isinstance(raw["objects"], list):
        objects = raw["objects"]
        
    # Pattern 4: Check all list values
    else:
        for value in raw.values():
            if isinstance(value, list):
                objects = value
                break
                
    return objects

def validate_layer(layer):
    """Validate a single layer JSON file."""
    filename = f"{layer}.json"
    filepath = _MODEL_DIR / filename
    
    result = {
        "layer": layer,
        "file": filename,
        "exists": False,
        "valid_json": False,
        "object_count": 0,
        "has_ids": False,
        "error": None
    }
    
    # Check file exists
    if not filepath.exists():
        result["error"] = "File not found"
        return result
    
    result["exists"] = True
    
    # Try to parse JSON
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            raw = json.load(f)
        result["valid_json"] = True
    except Exception as e:
        result["error"] = f"JSON parse error: {e}"
        return result
    
    # Extract objects
    objects = extract_objects(raw, layer, filename)
    result["object_count"] = len(objects)
    
    # Check for ID fields
    if objects:
        has_id = all("id" in obj for obj in objects)
        result["has_ids"] = has_id
        if not has_id:
            result["error"] = "Some objects missing 'id' field"
    
    return result

def main():
    print("[INFO] Validating 24 stub layer JSON files...")
    print()
    
    results = []
    files_with_data = []
    empty_files = []
    errors = []
    
    for layer in _STUB_LAYERS:
        result = validate_layer(layer)
        results.append(result)
        
        if result["error"]:
            errors.append(f"{layer}: {result['error']}")
            print(f"  [FAIL]  {layer:<35} ERROR: {result['error']}")
        elif result["object_count"] > 0:
            files_with_data.append(result)
            print(f"  [DATA]  {layer:<35} {result['object_count']:>3} objects")
        else:
            empty_files.append(result)
            print(f"  [EMPTY] {layer:<35}   0 objects")
    
    # Summary
    print()
    print("[SUMMARY]")
    print(f"  Total layers checked: {len(_STUB_LAYERS)}")
    print(f"  Files with data: {len(files_with_data)}")
    print(f"  Empty files: {len(empty_files)}")
    print(f"  Errors: {len(errors)}")
    
    if files_with_data:
        print()
        print("[READY TO SEED] Layers with data:")
        total_objects = 0
        for r in files_with_data:
            print(f"    {r['layer']} ({r['object_count']} objects)")
            total_objects += r['object_count']
        print(f"  Total: {total_objects} objects")
    
    # Save evidence
    evidence = {
        "timestamp": datetime.now().isoformat(),
        "script": "validate-stub-layers.py",
        "operation": "validate_24_stub_layers",
        "total_layers": len(_STUB_LAYERS),
        "files_with_data": len(files_with_data),
        "empty_files": len(empty_files),
        "errors": len(errors),
        "total_objects": sum(r["object_count"] for r in results),
        "results": results,
        "status": "PASS" if len(errors) == 0 else "FAIL"
    }
    
    evidence_path = _ROOT / "evidence" / f"validate-stub-layers_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    evidence_path.parent.mkdir(parents=True, exist_ok=True)
    with open(evidence_path, 'w', encoding='utf-8') as f:
        json.dump(evidence, f, indent=2)
    
    print()
    print(f"[INFO] Evidence saved to: {evidence_path.name}")
    
    return 0 if len(errors) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
