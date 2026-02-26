"""
E-10 Provenance test suite — repo_line stamping on implemented objects.

Test IDs: T50 – T52

These tests work against the auto-seeded TestClient (disk JSON → MemoryStore),
so they validate that exported JSON carries the backfilled repo_line values.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


# ── T50 ─────────────────────────────────────────────────────────────────────

def test_T50_repo_line_on_implemented_endpoints(
    client: TestClient, admin_headers: dict
) -> None:
    """
    E-10: All endpoints that DO have repo_line must be valid (int >= 1).
    Reports coverage gaps for objects whose source file is unreachable on this machine
    (e.g. files that exist only in a different repo clone).
    """
    r = client.get("/model/endpoints", headers=admin_headers)
    assert r.status_code == 200
    endpoints = r.json()
    assert isinstance(endpoints, list)

    eligible = [
        ep for ep in endpoints
        if ep.get("status") == "implemented" and ep.get("implemented_in")
    ]

    if not eligible:
        pytest.skip("No implemented endpoints with implemented_in — skipping repo_line check")

    covered     = [ep for ep in eligible if ep.get("repo_line") is not None]
    uncovered   = [ep["id"] for ep in eligible if ep.get("repo_line") is None]

    # Quality gate: at least one endpoint must have repo_line (proves feature works)
    assert covered, (
        "repo_line backfill produced no results on endpoints — "
        "run: python scripts/backfill-repo-lines.py"
    )

    # All covered values must be valid positive integers
    bad_type = [
        ep["id"] for ep in covered
        if not isinstance(ep["repo_line"], int) or ep["repo_line"] < 1
    ]
    assert not bad_type, f"Non-positive or non-int repo_line on endpoints: {bad_type}"

    # Report gaps (informational — source files may not exist on every machine)
    if uncovered:
        print(f"\n  [INFO] {len(uncovered)} endpoints missing repo_line (source not on disk): "
              + ", ".join(uncovered[:5])
              + (" ..." if len(uncovered) > 5 else ""))


# ── T51 ─────────────────────────────────────────────────────────────────────

def test_T51_repo_line_on_implemented_hooks(
    client: TestClient, admin_headers: dict
) -> None:
    """
    E-10: All hooks that DO have repo_line must be valid (int >= 1).
    Hooks whose source files don't exist on disk will lack repo_line — this is
    tracked as an informational gap rather than a hard failure.
    """
    r = client.get("/model/hooks", headers=admin_headers)
    assert r.status_code == 200
    hooks = r.json()
    assert isinstance(hooks, list)

    eligible = [
        h for h in hooks
        if h.get("status") == "implemented" and h.get("repo_path")
    ]

    if not eligible:
        pytest.skip("No implemented hooks with repo_path — skipping")

    covered   = [h for h in eligible if h.get("repo_line") is not None]
    uncovered = [h["id"] for h in eligible if h.get("repo_line") is None]

    assert covered, (
        "repo_line backfill produced no results on hooks — "
        "run: python scripts/backfill-repo-lines.py"
    )

    bad_type = [
        h["id"] for h in covered
        if not isinstance(h["repo_line"], int) or h["repo_line"] < 1
    ]
    assert not bad_type, f"Non-positive or non-int repo_line on hook: {bad_type}"

    if uncovered:
        print(f"\n  [INFO] {len(uncovered)} hooks missing repo_line (source not on disk): {uncovered}")


# ── T52 ─────────────────────────────────────────────────────────────────────

def test_T52_repo_line_on_implemented_screens(
    client: TestClient, admin_headers: dict
) -> None:
    """
    E-10: All screens that DO have repo_line must be valid (int >= 1).
    Screens whose component function name differs from the screen id
    (e.g. ChatPane → ChatInterface.tsx) may lack repo_line — tracked as a gap.
    """
    r = client.get("/model/screens", headers=admin_headers)
    assert r.status_code == 200
    screens = r.json()
    assert isinstance(screens, list)

    eligible = [
        sc for sc in screens
        if sc.get("status") == "implemented" and sc.get("component_path")
    ]

    if not eligible:
        pytest.skip("No implemented screens with component_path — skipping")

    covered   = [sc for sc in eligible if sc.get("repo_line") is not None]
    uncovered = [sc["id"] for sc in eligible if sc.get("repo_line") is None]

    assert covered, (
        "repo_line backfill produced no results on screens — "
        "run: python scripts/backfill-repo-lines.py"
    )

    bad_type = [
        sc["id"] for sc in covered
        if not isinstance(sc["repo_line"], int) or sc["repo_line"] < 1
    ]
    assert not bad_type, f"Non-positive or non-int repo_line on screen: {bad_type}"

    if uncovered:
        print(f"\n  [INFO] {len(uncovered)} screen(s) missing repo_line (id/file name mismatch): {uncovered}")
