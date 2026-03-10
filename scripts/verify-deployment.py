#!/usr/bin/env python3
"""
Verify deployment by comparing expected vs actual record counts

Purpose: Compare Evidence 1 (source files) with Evidence 2 (Cosmos DB)
         to ensure seeding was successful and complete.

Input:  evidence/01-expected-records.json
        evidence/02-actual-records.json
        
Output: evidence/{script}_{timestamp}.json with verification result
        Exit 0 (PASS) if all layers match
        Exit 1 (FAIL) if any discrepancies found
        Exit 2 (ERROR) if evidence files missing or technical error
"""
import json
import sys
from pathlib import Path
from datetime import datetime

# EVA Script Infrastructure (Professional Coding Standards)
from eva_script_infra import (
    setup_logging,
    save_evidence,
    save_error_evidence,
    ensure_directories,
    timestamped_filename,
    check_file_exists,
    STATUS_PASS,
    STATUS_FAIL,
    STATUS_INFO,
    STATUS_ERROR,
    format_status
)


def main():
    # Setup logging (Standard #1: Logging with dual handlers)
    logger = setup_logging('verify-deployment')
    
    # Ensure directories exist (Standard #1: logs/, evidence/, debug/)
    ensure_directories()
    
    # Save evidence at start (Standard #3: Evidence at operation boundaries)
    operation_name = 'verify-deployment'
    save_evidence(
        operation=operation_name,
        status='started',
        metrics={},
        script_name='verify-deployment'
    )
    logger.info(format_status(STATUS_INFO, "Operation started"))
    
    try:
        evidence_dir = Path('evidence')
        expected_file = evidence_dir / "01-expected-records.json"
        actual_file = evidence_dir / "02-actual-records.json"
        
        # Pre-flight checks (Standard #6: Verify inputs before execution)
        if not check_file_exists(expected_file, 'Evidence 1 (expected records)', logger):
            save_evidence(
                operation=operation_name,
                status='failed',
                metrics={'error': 'Evidence 1 not found'},
                script_name='verify-deployment'
            )
            sys.exit(2)
        
        if not check_file_exists(actual_file, 'Evidence 2 (actual records)', logger):
            save_evidence(
                operation=operation_name,
                status='failed',
                metrics={'error': 'Evidence 2 not found'},
                script_name='verify-deployment'
            )
            sys.exit(2)
        
        # Load both evidence files
        with open(expected_file, 'r', encoding='utf-8') as f:
            expected = json.load(f)
        
        with open(actual_file, 'r', encoding='utf-8') as f:
            actual = json.load(f)
        
        expected_counts = expected['layer_counts']
        actual_counts = actual['layer_counts']
        
        logger.info("=" * 60)
        logger.info(" DEPLOYMENT VERIFICATION")
        logger.info("=" * 60)
        logger.info("")
        logger.info(f"Expected: {expected['total_layers']} layers, {expected['total_records']} records")
        logger.info(f"Actual:   {actual['total_layers']} layers, {actual['total_records']} records")
        logger.info("")
        logger.info("-" * 60)
        
        # Compare each layer
        all_layers = set(expected_counts.keys()) | set(actual_counts.keys())
        matching = []
        mismatching = []
        
        for layer in sorted(all_layers):
            exp = expected_counts.get(layer, 0)
            act = actual_counts.get(layer, -1)
            
            if act == -1:
                # Layer query failed
                mismatching.append({
                    "layer": layer,
                    "expected": exp,
                    "actual": None,
                    "match": False,
                    "reason": "query_failed"
                })
                logger.info(f"X {{layer}}: Expected {exp}, Query FAILED".replace("{layer}", layer))
            
            elif exp == act:
                # Records match
                matching.append({
                    "layer": layer,
                    "expected": exp,
                    "actual": act,
                    "match": True
                })
                logger.info(f"  {{layer}}: {act} records".replace("{layer}", layer))
            
            else:
                # Count mismatch
                delta = act - exp
                mismatching.append({
                    "layer": layer,
                    "expected": exp,
                    "actual": act,
                    "match": False,
                    "delta": delta,
                    "reason": "count_mismatch"
                })
                logger.info(f"X {{layer}}: Expected {exp}, Got {act} (delta {delta:+d})".replace("{layer}", layer))
        
        logger.info("")
        logger.info("-" * 60)
        logger.info(f"Matching:    {len(matching):3d} / {len(all_layers)}")
        logger.info(f"Mismatching: {len(mismatching):3d} / {len(all_layers)}")
        
        pass_rate = (len(matching) / len(all_layers)) * 100 if all_layers else 0
        logger.info(f"Pass Rate:   {pass_rate:5.1f}%")
        logger.info("-" * 60)
        
        # Determine verdict
        verdict = "PASS" if len(mismatching) == 0 else "FAIL"
        
        logger.info("")
        if verdict == "PASS":
            logger.info("=" * 60)
            logger.info("  VERDICT: PASS")
            logger.info("=" * 60)
            logger.info("")
            logger.info("Source files and Cosmos DB are IDENTICAL")
            logger.info("Deployment verified successfully")
            exit_code = 0
        else:
            logger.info("=" * 60)
            logger.info("  VERDICT: FAIL")
            logger.info("=" * 60)
            logger.info("")
            logger.info("Discrepancies found:")
            for disc in mismatching:
                if disc.get('reason') == 'query_failed':
                    logger.info(f"  {disc['layer']}: Query failed (expected {disc['expected']})")
                else:
                    delta = disc.get('delta', 0)
                    logger.info(f"  {disc['layer']}: Delta {delta:+d} records")
            logger.info("")
            logger.info("Action Required:")
            logger.info("  1. Check seed operation completed successfully")
            logger.info("  2. Verify /admin/seed was called on correct endpoint")
            logger.info("  3. Review seed operation logs for errors")
            exit_code = 1
        
        # Create verification result with timestamped filename (Standard #5)
        result = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "verdict": verdict,
            "pass_rate": round(pass_rate, 2),
            "matching_layers": len(matching),
            "mismatching_layers": len(mismatching),
            "total_layers": len(all_layers),
            "expected_total_records": expected['total_records'],
            "actual_total_records": actual['total_records'],
            "discrepancies": mismatching,
            "evidence_files": {
                "expected": str(expected_file),
                "actual": str(actual_file)
            }
        }
        
        # Use timestamped filename for output (Standard #5)
        output_filename = timestamped_filename('verify-deployment', verdict.lower(), 'json')
        output_file = evidence_dir / output_filename
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)
        
        # Also write legacy filename for backwards compatibility
        legacy_file = evidence_dir / "03-verification-result.json"
        with open(legacy_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)
        
        logger.info(f"Evidence saved: {output_file}")
        logger.info(f"Legacy evidence: {legacy_file}")
        logger.info("")
        
        # Save success/fail evidence (Standard #3: Evidence at operation boundaries)
        save_evidence(
            operation=operation_name,
            status='success' if verdict == 'PASS' else 'failed',
            metrics={
                'verdict': verdict,
                'pass_rate': round(pass_rate, 2),
                'matching_layers': len(matching),
                'mismatching_layers': len(mismatching),
                'total_layers': len(all_layers),
                'output_file': str(output_file)
            },
            script_name='verify-deployment'
        )
        
        # Exit with appropriate code (Standard #4: Exit codes)
        logger.info(format_status(STATUS_PASS if verdict == 'PASS' else STATUS_FAIL, f"Operation completed: {verdict}"))
        sys.exit(exit_code)
    
    except Exception as e:
        # Error handling (Standard #8: Catch exceptions, save structured JSON)
        logger.error(format_status(STATUS_ERROR, f"Unexpected error: {e}"))
        save_error_evidence(e, operation_name, script_name='verify-deployment')
        save_evidence(
            operation=operation_name,
            status='failed',
            metrics={'error': str(e), 'error_type': type(e).__name__},
            script_name='verify-deployment'
        )
        sys.exit(2)


if __name__ == '__main__':
    main()
