#!/usr/bin/env python3
"""
Compare two endpoint discovery snapshots (before vs after deployment).

Purpose: Detect API surface changes during deployment.
         Identifies new endpoints, removed endpoints, and response changes.

Usage:
    python scripts/compare-endpoint-snapshots.py <before.json> <after.json>
    python scripts/compare-endpoint-snapshots.py --latest  # Auto-find latest before/after

Output:
    evidence/endpoint-comparison_{timestamp}.json
    logs/compare-endpoint-snapshots_run_{timestamp}.log
    Console: Human-readable summary

Evidence Structure:
    {
        "timestamp": "2026-03-10T21:30:00Z",
        "before_file": "...",
        "after_file": "...",
        "endpoints_added": 2,
        "endpoints_removed": 0,
        "endpoints_changed": 3,
        "endpoints_unchanged": 35,
        "details": {
            "added": [...],
            "removed": [...],
            "changed": [...]
        }
    }
"""
import argparse
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple

from eva_script_infra import (
    setup_logging,
    save_evidence,
    ensure_directories,
    format_status,
    STATUS_PASS,
    STATUS_FAIL,
    STATUS_INFO,
    STATUS_ERROR
)


def load_snapshot(file_path: Path, logger: logging.Logger) -> Dict[str, Any]:
    """Load endpoint discovery snapshot from JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logger.info(format_status(STATUS_PASS, f"Loaded {file_path.name}"))
        return data
    except Exception as e:
        logger.error(format_status(STATUS_ERROR, f"Failed to load {file_path}: {e}"))
        raise


def find_latest_snapshots(logger: logging.Logger) -> Tuple[Path, Path]:
    """Find latest matching before/after snapshot files for the same run."""
    evidence_dir = Path("evidence")

    before_prefix = "endpoint-discovery_before_"
    after_prefix = "endpoint-discovery_after_"
    suffix = ".json"

    before_by_run: Dict[str, Path] = {}
    after_by_run: Dict[str, Path] = {}

    # Index all "before" snapshots by run identifier
    for path in evidence_dir.glob(f"{before_prefix}*{suffix}"):
        name = path.name
        if not name.startswith(before_prefix) or not name.endswith(suffix):
            continue
        run_id = name[len(before_prefix):-len(suffix)]
        before_by_run[run_id] = path

    # Index all "after" snapshots by run identifier
    for path in evidence_dir.glob(f"{after_prefix}*{suffix}"):
        name = path.name
        if not name.startswith(after_prefix) or not name.endswith(suffix):
            continue
        run_id = name[len(after_prefix):-len(suffix)]
        after_by_run[run_id] = path

    if not before_by_run:
        raise FileNotFoundError("No 'before' snapshot found in evidence/")
    if not after_by_run:
        raise FileNotFoundError("No 'after' snapshot found in evidence/")

    # Find run identifiers that have both before and after snapshots
    common_run_ids = sorted(set(before_by_run.keys()) & set(after_by_run.keys()))
    if not common_run_ids:
        raise FileNotFoundError(
            "No matching before/after snapshot pair found in evidence/. "
            "Ensure both stages produced snapshots for the same run."
        )

    # Choose the latest common run identifier (lexicographically, e.g., timestamp)
    latest_run_id = common_run_ids[-1]
    before_file = before_by_run[latest_run_id]
    after_file = after_by_run[latest_run_id]

    logger.info("Auto-detected snapshots for run id '%s':", latest_run_id)
    logger.info("  Before: %s", before_file.name)
    logger.info("  After:  %s", after_file.name)
    
    return before_file, after_file


def compare_endpoint_lists(before: List[Dict], after: List[Dict], logger: logging.Logger) -> Dict[str, Any]:
    """
    Compare two endpoint lists and identify changes.
    
    Returns:
        Dictionary with added, removed, changed, unchanged endpoints
    """
    # Create lookup by (path, method)
    before_map = {(ep["path"], ep["method"]): ep for ep in before}
    after_map = {(ep["path"], ep["method"]): ep for ep in after}
    
    before_keys = set(before_map.keys())
    after_keys = set(after_map.keys())
    
    # Identify changes
    added_keys = after_keys - before_keys
    removed_keys = before_keys - after_keys
    common_keys = before_keys & after_keys
    
    added = [after_map[k] for k in added_keys]
    removed = [before_map[k] for k in removed_keys]
    
    # Check for changes in common endpoints
    changed = []
    unchanged = []
    
    for key in common_keys:
        before_ep = before_map[key]
        after_ep = after_map[key]
        
        # Compare key attributes
        changes = []
        
        if before_ep.get("status") != after_ep.get("status"):
            changes.append(f"status: {before_ep.get('status')} -> {after_ep.get('status')}")
        
        if before_ep.get("response_code") != after_ep.get("response_code"):
            changes.append(f"response_code: {before_ep.get('response_code')} -> {after_ep.get('response_code')}")
        
        # Response size change > 10%
        before_size = before_ep.get("response_size_bytes", 0)
        after_size = after_ep.get("response_size_bytes", 0)
        if before_size and after_size:
            size_change_pct = abs(after_size - before_size) / before_size * 100
            if size_change_pct > 10:
                changes.append(f"response_size: {before_size}b -> {after_size}b ({size_change_pct:.1f}% change)")
        
        if changes:
            changed.append({
                "path": key[0],
                "method": key[1],
                "changes": changes,
                "before": before_ep,
                "after": after_ep
            })
        else:
            unchanged.append(after_ep)
    
    logger.info(f"Added: {len(added)}, Removed: {len(removed)}, Changed: {len(changed)}, Unchanged: {len(unchanged)}")
    
    return {
        "added": added,
        "removed": removed,
        "changed": changed,
        "unchanged": unchanged
    }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Compare endpoint discovery snapshots"
    )
    parser.add_argument(
        "before_file",
        nargs="?",
        type=Path,
        help="Before snapshot JSON file"
    )
    parser.add_argument(
        "after_file",
        nargs="?",
        type=Path,
        help="After snapshot JSON file"
    )
    parser.add_argument(
        "--latest",
        action="store_true",
        help="Auto-find latest before/after snapshots"
    )
    args = parser.parse_args()
    
    # Setup logging
    logger = setup_logging('compare-endpoint-snapshots')
    ensure_directories()
    
    logger.info("=" * 70)
    logger.info(" ENDPOINT SNAPSHOT COMPARISON")
    logger.info("=" * 70)
    
    # Save start evidence
    save_evidence(
        operation='compare-endpoint-snapshots',
        status='started',
        metrics={},
        script_name='compare-endpoint-snapshots'
    )
    
    try:
        # Determine files to compare
        if args.latest:
            before_file, after_file = find_latest_snapshots(logger)
        elif args.before_file and args.after_file:
            before_file = args.before_file
            after_file = args.after_file
        else:
            logger.error(format_status(STATUS_ERROR, "Must specify both before_file and after_file, or use --latest"))
            sys.exit(1)
        
        # Load snapshots
        logger.info("\n[1/3] Loading snapshots...")
        before_data = load_snapshot(before_file, logger)
        after_data = load_snapshot(after_file, logger)
        
        # Compare endpoints
        logger.info("\n[2/3] Comparing endpoints...")
        comparison = compare_endpoint_lists(
            before_data.get("endpoints", []),
            after_data.get("endpoints", []),
            logger
        )
        
        # Generate evidence
        logger.info("\n[3/3] Generating comparison evidence...")
        
        evidence = {
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "before_file": str(before_file),
            "after_file": str(after_file),
            "before_timestamp": before_data.get("timestamp"),
            "after_timestamp": after_data.get("timestamp"),
            "before_api_url": before_data.get("api_url"),
            "after_api_url": after_data.get("api_url"),
            "endpoints_added": len(comparison["added"]),
            "endpoints_removed": len(comparison["removed"]),
            "endpoints_changed": len(comparison["changed"]),
            "endpoints_unchanged": len(comparison["unchanged"]),
            "details": comparison
        }
        
        # Save to evidence file
        evidence_file = Path("evidence") / f"endpoint-comparison_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(evidence_file, 'w', encoding='utf-8') as f:
            json.dump(evidence, f, indent=2, ensure_ascii=True)
        
        # Print summary
        logger.info("=" * 70)
        logger.info(" COMPARISON SUMMARY")
        logger.info("=" * 70)
        logger.info(f"Before: {before_file.name}")
        logger.info(f"After:  {after_file.name}")
        logger.info("")
        logger.info(f"Endpoints added:     {evidence['endpoints_added']}")
        logger.info(f"Endpoints removed:   {evidence['endpoints_removed']}")
        logger.info(f"Endpoints changed:   {evidence['endpoints_changed']}")
        logger.info(f"Endpoints unchanged: {evidence['endpoints_unchanged']}")
        
        # Show details
        if comparison["added"]:
            logger.info("\n[ADDED ENDPOINTS]")
            for ep in comparison["added"]:
                logger.info(f"  + {ep['method']} {ep['path']}")
        
        if comparison["removed"]:
            logger.info("\n[REMOVED ENDPOINTS]")
            for ep in comparison["removed"]:
                logger.info(f"  - {ep['method']} {ep['path']}")
        
        if comparison["changed"]:
            logger.info("\n[CHANGED ENDPOINTS]")
            for ep in comparison["changed"]:
                logger.info(f"  ~ {ep['method']} {ep['path']}")
                for change in ep["changes"]:
                    logger.info(f"      {change}")
        
        logger.info(f"\nEvidence saved: {evidence_file}")
        logger.info("")
        
        # Save success evidence
        save_evidence(
            operation='compare-endpoint-snapshots',
            status='success',
            metrics={
                'added': evidence['endpoints_added'],
                'removed': evidence['endpoints_removed'],
                'changed': evidence['endpoints_changed'],
                'unchanged': evidence['endpoints_unchanged']
            },
            script_name='compare-endpoint-snapshots'
        )
        
        # Exit with appropriate code
        if comparison["removed"]:
            logger.warning(format_status(STATUS_FAIL, f"{len(comparison['removed'])} endpoints removed - review required"))
            sys.exit(1)
        else:
            logger.info(format_status(STATUS_PASS, "Comparison complete - no endpoints removed"))
            sys.exit(0)
        
    except Exception as e:
        logger.error(format_status(STATUS_ERROR, f"Fatal error: {e}"))
        import traceback
        logger.error(traceback.format_exc())
        
        save_evidence(
            operation='compare-endpoint-snapshots',
            status='error',
            metrics={'error': str(e)},
            script_name='compare-endpoint-snapshots'
        )
        
        sys.exit(2)


if __name__ == "__main__":
    main()
