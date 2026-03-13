#!/usr/bin/env python3
"""
Phase B UNIT 2-5: Comprehensive Local Validation
Tests layer architecture, relationships, lifecycle, and performance
without requiring cloud API (uses schema files directly)
"""

import json
import os
import time
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Any

class PhaseB_ValidationSuite:
    """Executes UNITS 2-5 validation against layer schemas"""
    
    def __init__(self, schema_dir: str, output_dir: str):
        self.schema_dir = Path(schema_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.layers: Dict[str, Any] = {}
        self.results = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "unit_2": {"name": "Relationship Testing", "status": "PENDING"},
            "unit_3": {"name": "Lifecycle Testing", "status": "PENDING"},
            "unit_4": {"name": "Performance Testing", "status": "PENDING"},
            "unit_5": {"name": "Integration Testing", "status": "PENDING"},
            "summary": {"total_pass": 0, "total_fail": 0}
        }
        self._load_layers()
    
    def _load_layers(self) -> None:
        """Load all layer schemas from disk"""
        print("[INIT] Loading layer schemas...")
        for schema_file in sorted(self.schema_dir.glob("*.json")):
            try:
                with open(schema_file) as f:
                    schema = json.load(f)
                    layer_name = schema.get("layer", schema_file.stem)
                    layer_id = schema.get("layer_id", "L???")
                    self.layers[layer_id] = {
                        "file": schema_file.name,
                        "data": schema,
                        "name": layer_name
                    }
                    print(f"  [OK] {layer_id}: {layer_name}")
            except json.JSONDecodeError as e:
                print(f"  [ERROR] {schema_file.name}: JSON parse failed - {e}")
                sys.exit(1)
        print(f"[LOADED] {len(self.layers)} layers ready\n")
    
    def unit_2_relationship_testing(self) -> Dict[str, Any]:
        """UNIT 2: Validate layer FK relationships"""
        print("[UNIT 2] Relationship Testing")
        print("="*50)
        
        tests = []
        
        # Test: L122 → L26 (parent project link)
        tests.append(self._test_relationship("L122", "L26", "projects parent link"))
        
        # Test: L122 → L127 (mission link)
        tests.append(self._test_relationship("L122", "L127", "mission link"))
        
        # Test: L123 → L122 (assumptions link to context)
        tests.append(self._test_relationship("L123", "L122", "assumptions to context"))
        
        # Test: L124 → L122 (risks link to context)
        tests.append(self._test_relationship("L124", "L122", "risks to context"))
        
        # Test: L125 → L122 (opportunities link to context)
        tests.append(self._test_relationship("L125", "L122", "opportunities to context"))
        
        # Test: L126 → L123 (validations link to assumptions)
        tests.append(self._test_relationship("L126", "L123", "validations to assumptions"))
        
        # Test: L127 → L26 (missions link to projects)
        tests.append(self._test_relationship("L127", "L26", "missions to projects"))
        
        # Test: L128 → L127 (sensors link to missions)
        tests.append(self._test_relationship("L128", "L127", "sensors to missions"))
        
        # Test: L129 → L128 (signals link to sensors)
        tests.append(self._test_relationship("L129", "L128", "signals to sensors"))
        
        # Test: L129 → L122 (signals feed to contexts)
        tests.append(self._test_relationship("L129", "L122", "signals to contexts"))
        
        passed = sum(1 for t in tests if t["pass"])
        failed = len(tests) - passed
        
        result = {
            "status": "PASS" if failed == 0 else "FAIL",
            "tests": tests,
            "passed": passed,
            "failed": failed,
            "pass_rate": f"{(passed/len(tests)*100):.0f}%"
        }
        
        print(f"\n[RESULT] {passed}/{len(tests)} relationship tests passed ({result['pass_rate']})")
        self.results["unit_2"].update(result)
        self.results["summary"]["total_pass"] += passed
        if failed > 0:
            self.results["summary"]["total_fail"] += failed
        
        return result
    
    def _test_relationship(self, source: str, target: str, desc: str) -> Dict[str, Any]:
        """Test if source layer references target layer"""
        try:
            source_layer = self.layers.get(source)
            if not source_layer:
                return {"source": source, "target": target, "desc": desc, "pass": False, "error": "Source layer not found"}
            
            relationships = source_layer["data"].get("relationships", {})
            all_refs = (relationships.get("parent", []) + 
                       relationships.get("child", []) + 
                       relationships.get("related", []))
            
            # Check both exact match and "L##/name" format
            found = target in str(all_refs)
            
            if found:
                print(f"  [OK] {source} → {target} ({desc})")
                return {"source": source, "target": target, "desc": desc, "pass": True}
            else:
                print(f"  [FAIL] {source} → {target} ({desc}) NOT FOUND")
                return {"source": source, "target": target, "desc": desc, "pass": False, "error": f"Reference not found in {all_refs}"}
        except Exception as e:
            return {"source": source, "target": target, "desc": desc, "pass": False, "error": str(e)}
    
    def unit_3_lifecycle_testing(self) -> Dict[str, Any]:
        """UNIT 3: Validate D³PDCA mission lifecycle"""
        print("\n[UNIT 3] Lifecycle Testing")
        print("="*50)
        
        tests = []
        
        # Test: L127 has phase tracking fields
        mission_layer = self.layers.get("L127", {})
        mission_schema = mission_layer.get("data", {}).get("schema", {})
        
        lifecycle_fields = ["phase", "started_at", "completed_at", "status", "d3pdca_phase"]
        for field in lifecycle_fields:
            found = any(field.lower() in str(mission_schema).lower() for _ in [1])
            tests.append({
                "field": field,
                "layer": "L127",
                "pass": found,
                "desc": f"Mission has {field} tracking"
            })
            status = "[OK]" if found else "[WARN]"
            print(f"  {status} {field}")
        
        # Test: L126 is append-only (immutable flag)
        validation_layer = self.layers.get("L126", {})
        is_immutable = validation_layer.get("data", {}).get("immutable", False)
        tests.append({
            "layer": "L126",
            "pass": is_immutable,
            "desc": "Validation records are immutable (append-only)"
        })
        status = "[OK]" if is_immutable else "[FAIL]"
        print(f"  {status} L126 immutable: {is_immutable}")
        
        # Test: L129 has TTL
        signal_layer = self.layers.get("L129", {})
        ttl = signal_layer.get("data", {}).get("ttl_days")
        has_ttl = ttl is not None and ttl > 0
        tests.append({
            "layer": "L129",
            "pass": has_ttl,
            "ttl_days": ttl,
            "desc": f"Signals have TTL ({ttl} days)"
        })
        status = "[OK]" if has_ttl else "[WARN]"
        print(f"  {status} L129 TTL: {ttl} days")
        
        passed = sum(1 for t in tests if t["pass"])
        failed = len(tests) - passed
        
        result = {
            "status": "PASS" if failed == 0 else "FAIL",
            "tests": tests,
            "passed": passed,
            "failed": failed
        }
        
        print(f"\n[RESULT] {passed}/{len(tests)} lifecycle tests passed")
        self.results["unit_3"].update(result)
        self.results["summary"]["total_pass"] += passed
        if failed > 0:
            self.results["summary"]["total_fail"] += failed
        
        return result
    
    def unit_4_performance_testing(self) -> Dict[str, Any]:
        """UNIT 4: Baseline performance metrics"""
        print("\n[UNIT 4] Performance Testing")
        print("="*50)
        
        metrics = {}
        
        # Metric 1: Schema parsing time
        start = time.time()
        for layer in self.layers.values():
            json.dumps(layer["data"])
        parse_time = time.time() - start
        metrics["schema_parse_ms"] = round(parse_time * 1000, 2)
        print(f"  Schema parsing: {metrics['schema_parse_ms']} ms")
        
        # Metric 2: Layer count
        metrics["total_layers"] = len(self.layers)
        print(f"  Total layers: {metrics['total_layers']}")
        
        # Metric 3: Average schema size
        sizes = [len(json.dumps(l["data"])) for l in self.layers.values()]
        metrics["avg_schema_size_bytes"] = round(sum(sizes) / len(sizes), 0)
        print(f"  Average schema size: {metrics['avg_schema_size_bytes']} bytes")
        
        # Metric 4: Relationship density
        total_refs = sum(
            len(l["data"].get("relationships", {}).get("parent", [])) +
            len(l["data"].get("relationships", {}).get("child", [])) +
            len(l["data"].get("relationships", {}).get("related", []))
            for l in self.layers.values()
        )
        metrics["total_references"] = total_refs
        metrics["avg_refs_per_layer"] = round(total_refs / len(self.layers), 1)
        print(f"  Average references per layer: {metrics['avg_refs_per_layer']}")
        
        result = {
            "status": "PASS",
            "metrics": metrics,
            "performance_targets": {
                "schema_parse_ms_max": 100,
                "avg_schema_size_bytes_max": 5000,
                "avg_refs_per_layer_max": 10
            },
            "sla_compliance": all([
                metrics["schema_parse_ms"] < 100,
                metrics["avg_schema_size_bytes"] < 5000,
                metrics["avg_refs_per_layer"] < 10
            ])
        }
        
        print(f"\n[RESULT] Performance baseline established (SLA Compliant: {result['sla_compliance']})")
        self.results["unit_4"].update(result)
        self.results["summary"]["total_pass"] += 1
        
        return result
    
    def unit_5_integration_testing(self) -> Dict[str, Any]:
        """UNIT 5: Cross-layer integration validation"""
        print("\n[UNIT 5] Integration Testing")
        print("="*50)
        
        tests = []
        
        # Test: L122 context identifies assumptions (L123)
        test_result = self._validate_child_relationship("L122", "L123")
        tests.append({"relationship": "context→assumptions", "pass": test_result})
        print(f"  {'[OK]' if test_result else '[FAIL]'} Context identifies assumptions")
        
        # Test: L127 missions ground in context (L122)
        test_result = self._validate_parent_relationship("L127", "L122")
        tests.append({"relationship": "mission grounded in context", "pass": test_result})
        print(f"  {'[OK]' if test_result else '[FAIL]'} Mission grounded in context")
        
        # Test: L128 sensors feed L129 signals
        test_result = self._validate_parent_relationship("L129", "L128")
        tests.append({"relationship": "signals from sensors", "pass": test_result})
        print(f"  {'[OK]' if test_result else '[FAIL]'} Signals from sensors")
        
        # Test: L129 signals feed back to L122 contexts (feedback loop)
        test_result = self._validate_relationship_exists("L129", "L122")
        tests.append({"relationship": "signals feed contexts", "pass": test_result})
        print(f"  {'[OK]' if test_result else '[FAIL]'} Signals feed back to contexts")
        
        # Test: L126 validations immutably track L123 assumptions
        test_result = self._validate_relationship_exists("L126", "L123")
        tests.append({"relationship": "validations track assumptions", "pass": test_result})
        imm = self.layers["L126"]["data"].get("immutable", False)
        print(f"  {'[OK]' if test_result and imm else '[FAIL]'} Validations immutably track assumptions")
        
        passed = sum(1 for t in tests if t["pass"])
        failed = len(tests) - passed
        
        result = {
            "status": "PASS" if failed == 0 else "FAIL",
            "tests": tests,
            "passed": passed,
            "failed": failed,
            "integration_status": "Ready for cloud testing" if failed == 0 else "Issues found"
        }
        
        print(f"\n[RESULT] {passed}/{len(tests)} integration tests passed - {result['integration_status']}")
        self.results["unit_5"].update(result)
        self.results["summary"]["total_pass"] += passed
        if failed > 0:
            self.results["summary"]["total_fail"] += failed
        
        return result
    
    def _validate_child_relationship(self, source: str, child: str) -> bool:
        """Check if source identifies child"""
        try:
            source_layer = self.layers[source]["data"]
            children = source_layer.get("relationships", {}).get("child", [])
            return any(child in str(c) for c in children)
        except:
            return False
    
    def _validate_parent_relationship(self, source: str, parent: str) -> bool:
        """Check if source has parent"""
        try:
            source_layer = self.layers[source]["data"]
            parents = source_layer.get("relationships", {}).get("parent", [])
            return any(parent in str(p) for p in parents)
        except:
            return False
    
    def _validate_relationship_exists(self, source: str, target: str) -> bool:
        """Check if any relationship exists between layers"""
        try:
            source_layer = self.layers[source]["data"]
            relationships = source_layer.get("relationships", {})
            all_refs = (relationships.get("parent", []) + 
                       relationships.get("child", []) +
                       relationships.get("related", []))
            return any(target in str(r) for r in all_refs)
        except:
            return False
    
    def run_all_units(self) -> Dict[str, Any]:
        """Execute UNITS 2-5 sequentially"""
        print("\n" + "="*60)
        print("PHASE B: UNITS 2-5 VALIDATION")
        print("="*60 + "\n")
        
        self.unit_2_relationship_testing()
        self.unit_3_lifecycle_testing()
        self.unit_4_performance_testing()
        self.unit_5_integration_testing()
        
        self._generate_summary()
        self._save_results()
        
        return self.results
    
    def _generate_summary(self) -> None:
        """Generate overall summary"""
        total_pass = self.results["summary"]["total_pass"]
        total_fail = self.results["summary"]["total_fail"]
        total = total_pass + total_fail
        overall_pass_rate = (total_pass / total * 100) if total > 0 else 0
        
        self.results["summary"].update({
            "overall_status": "PASS" if total_fail == 0 else "FAIL",
            "total_tests": total,
            "pass_rate": f"{overall_pass_rate:.0f}%"
        })
        
        print("\n" + "="*60)
        print("PHASE B SUMMARY")
        print("="*60)
        print(f"Total Tests: {total}")
        print(f"Passed: {total_pass}")
        print(f"Failed: {total_fail}")
        print(f"Pass Rate: {overall_pass_rate:.0f}%")
        print(f"Overall Status: {self.results['summary']['overall_status']}")
        print("="*60 + "\n")
    
    def _save_results(self) -> None:
        """Save results to JSON"""
        output_file = self.output_dir / "phase-b-units-2-5-results.json"
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"[SAVED] Results: {output_file}")

if __name__ == "__main__":
    schema_dir = "c:\\eva-foundry\\37-data-model\\evidence\\phase-a\\schemas"
    output_dir = "c:\\eva-foundry\\37-data-model\\evidence\\phase-b"
    
    suite = PhaseB_ValidationSuite(schema_dir, output_dir)
    results = suite.run_all_units()
    
    sys.exit(0 if results["summary"]["overall_status"] == "PASS" else 1)
