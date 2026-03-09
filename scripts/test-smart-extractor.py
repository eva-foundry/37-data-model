#!/usr/bin/env python3
"""Test the smart extractor with problematic files"""
import json
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parents[1]))

from api.routers.admin import _extract_objects_from_json

def test_extraction():
    """Test extraction on the 9 problematic files"""
    
    model_dir = Path(__file__).parents[1] / "model"
    
    test_cases = [
        ("agent_execution_history", 5, "execution_records array"),
        ("agent_performance_metrics", 5, "agent_metrics array"),
        ("azure_infrastructure", 4, "resources dict values"),
        ("deployment_quality_scores", 4, "quality_scores array"),
        ("evidence", 0, "metadata file (skip)"),
        ("performance_trends", 4, "trend_records array"),
        ("remediation_effectiveness", 1, "single object (wrap)"),
        ("traces", 0, "metadata file (skip)"),
        ("projects", 50, "standard structure"),
    ]
    
    print("\n=== TESTING SMART EXTRACTOR ===\n")
    
    passed = 0
    failed = 0
    
    for layer, expected_count, description in test_cases:
        filename = f"{layer}.json"
        path = model_dir / filename
        
        if not path.exists():
            print(f"[SKIP] {layer}: File not found")
            continue
        
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            objects = _extract_objects_from_json(raw, layer, filename)
            
            actual_count = len(objects)
            status = "[PASS]" if actual_count == expected_count else "[FAIL]"
            
            if actual_count == expected_count:
                passed += 1
            else:
                failed += 1
            
            print(f"{status} {layer}")
            print(f"  Expected: {expected_count} objects ({description})")
            print(f"  Actual:   {actual_count} objects")
            
            if actual_count > 0:
                # Show first object's id
                first_id = objects[0].get("id", "NO_ID")
                print(f"  First ID: {first_id}")
            
            print()
            
        except Exception as exc:
            failed += 1
            print(f"[ERROR] {layer}: {exc}\n")
    
    print(f"\n=== SUMMARY ===")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Total:  {passed + failed}")
    
    return failed == 0

if __name__ == "__main__":
    success = test_extraction()
    sys.exit(0 if success else 1)
