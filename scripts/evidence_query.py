#!/usr/bin/env python3
"""
EVA Evidence Query Tool

Query evidence receipts by sprint, phase, story, or correlation ID.
Useful for portfolio-level compliance reporting and debugging.

Usage:
    python evidence_query.py --sprint ACA-S11
    python evidence_query.py --phase A --sprint ACA-S11
    python evidence_query.py --story ACA-14-001
    python evidence_query.py --correlation-id ACA-S11-20260301-285bd914
    python evidence_query.py --test-fail      (find all evidence with test_result=FAIL)
    python evidence_query.py --low-coverage   (find all evidence with coverage < 80%)
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Optional


def load_evidence(model_path: Path) -> list[dict[str, Any]]:
    """Load evidence objects from model/evidence.json."""
    if not model_path.exists():
        return []
    try:
        with open(model_path) as f:
            data = json.load(f)
            return data.get("objects", [])
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error loading evidence: {e}")
        return []


def filter_evidence(
    evidence: list[dict[str, Any]],
    sprint_id: Optional[str] = None,
    phase: Optional[str] = None,
    story_id: Optional[str] = None,
    correlation_id: Optional[str] = None,
    test_fail: bool = False,
    low_coverage: bool = False,
) -> list[dict[str, Any]]:
    """Filter evidence by various criteria."""
    results = evidence

    if sprint_id:
        results = [e for e in results if e.get("sprint_id") == sprint_id]

    if phase:
        results = [e for e in results if e.get("phase") == phase]

    if story_id:
        results = [e for e in results if e.get("story_id") == story_id]

    if correlation_id:
        results = [e for e in results if e.get("correlation_id") == correlation_id]

    if test_fail:
        results = [e for e in results if e.get("validation", {}).get("test_result") == "FAIL"]

    if low_coverage:
        results = [
            e for e in results
            if e.get("validation", {}).get("coverage_percent") is not None
            and e.get("validation", {}).get("coverage_percent") < 80
        ]

    return results


def format_table(evidence: list[dict[str, Any]]) -> None:
    """Pretty-print evidence records as table."""
    if not evidence:
        print("No evidence found.")
        return

    print(f"{'ID':<40} {'Phase':<5} {'Test':<6} {'Lint':<6} {'Cov%':<5} {'Files':<6}")
    print("-" * 110)

    for e in evidence:
        obj_id = e.get("id", "---")[:40]
        phase = e.get("phase", "---")
        test_result = e.get("validation", {}).get("test_result", "---")
        lint_result = e.get("validation", {}).get("lint_result", "---")
        coverage = e.get("validation", {}).get("coverage_percent")
        coverage_str = str(coverage) if coverage is not None else "---"
        files_changed = e.get("metrics", {}).get("files_changed")
        files_str = str(files_changed) if files_changed is not None else "---"

        print(f"{obj_id:<40} {phase:<5} {test_result:<6} {lint_result:<6} {coverage_str:<5} {files_str:<6}")


def format_json(evidence: list[dict[str, Any]]) -> None:
    """Print evidence records as JSON."""
    print(json.dumps(evidence, indent=2))


def main():
    parser = argparse.ArgumentParser(
        description="Query evidence receipts from EVA Data Model",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--model", default="model/evidence.json", help="Path to evidence.json")
    parser.add_argument("--sprint", help="Filter by sprint_id (e.g. ACA-S11)")
    parser.add_argument("--phase", help="Filter by phase (D1, D2, P, D3, A)")
    parser.add_argument("--story", help="Filter by story_id (e.g. ACA-14-001)")
    parser.add_argument("--correlation-id", help="Filter by correlation_id")
    parser.add_argument("--test-fail", action="store_true", help="Find all evidence with test_result=FAIL")
    parser.add_argument("--low-coverage", action="store_true", help="Find all evidence with coverage < 80%")
    parser.add_argument("--format", choices=["table", "json"], default="table", help="Output format")
    parser.add_argument("--count-only", action="store_true", help="Print only count")

    args = parser.parse_args()

    model_path = Path(args.model)
    evidence = load_evidence(model_path)

    filtered = filter_evidence(
        evidence,
        sprint_id=args.sprint,
        phase=args.phase,
        story_id=args.story,
        correlation_id=args.correlation_id,
        test_fail=args.test_fail,
        low_coverage=args.low_coverage,
    )

    if args.count_only:
        print(f"{len(filtered)} records")
    elif args.format == "json":
        format_json(filtered)
    else:
        format_table(filtered)


if __name__ == "__main__":
    main()
