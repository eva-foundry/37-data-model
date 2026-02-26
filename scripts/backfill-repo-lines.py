#!/usr/bin/env python3
"""
E-10 backfill: scan source files and stamp repo_line on endpoints, components,
hooks, and screens via the model API.

Usage:
  python scripts/backfill-repo-lines.py [--dry-run] [--layer LAYER]

Layers:  endpoints  components  hooks  screens  (default: all)

Strategy (per layer):
  endpoints  → implemented_in path → search for route decorator matching endpoint path
  components → repo_path           → search for export/function declaration of component id
  hooks      → repo_path           → search for export/function declaration of hook id
  screens    → component_path      → search for export/function declaration of screen id

All paths are relative to EVA_FOUNDATION_ROOT (default: C:/AICOE/eva-foundation).
Objects with status=planned/stub that have no source file are skipped (repo_line stays null).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.parse
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package not installed.  pip install requests", file=sys.stderr)
    sys.exit(1)

# ── Configuration ──────────────────────────────────────────────────────────────

EVA_FOUNDATION_ROOT = Path("C:/AICOE/eva-foundation")
API_BASE            = "http://localhost:8010"
ADMIN_TOKEN         = "dev-admin"
REQUEST_DELAY_S     = 0.05   # throttle PUTs slightly

HEADERS = {
    "Authorization": f"Bearer {ADMIN_TOKEN}",
    "Content-Type": "application/json",
}

# ── Helpers ────────────────────────────────────────────────────────────────────

def _resolve(rel_path: str | None) -> Path | None:
    """Resolve a repo-relative path to an absolute Path (or None if not given)."""
    if not rel_path:
        return None
    # Normalise Windows separators coming from JSON
    p = EVA_FOUNDATION_ROOT / rel_path.replace("\\", "/")
    return p if p.exists() else None


def _find_line(file_path: Path, patterns: list[str]) -> int | None:
    """
    Return the 1-based line number of the first line matching any regex pattern.
    Returns None if not found or file unreadable.
    """
    try:
        text = file_path.read_text(encoding="utf-8", errors="replace")
        for i, line in enumerate(text.splitlines(), 1):
            for pat in patterns:
                if re.search(pat, line):
                    return i
    except Exception:
        pass
    return None


def _api_get_all(layer: str) -> list[dict[str, Any]]:
    """Fetch all objects for a layer from the running API."""
    r = requests.get(f"{API_BASE}/model/{layer}", headers=HEADERS, timeout=10)
    r.raise_for_status()
    data = r.json()
    if isinstance(data, list):
        return data
    # Some routers wrap in {layer: [...]}
    if layer in data:
        return data[layer]
    # Fallback: first list value
    for v in data.values():
        if isinstance(v, list):
            return v
    return []


def _api_put(layer: str, obj_id: str, body: dict[str, Any]) -> dict[str, Any]:
    encoded = urllib.parse.quote(obj_id, safe="")
    r = requests.put(
        f"{API_BASE}/model/{layer}/{encoded}",
        json=body,
        headers=HEADERS,
        timeout=10,
    )
    if not r.ok:
        raise RuntimeError(f"PUT {layer}/{obj_id} → {r.status_code}: {r.text[:200]}")
    return r.json()


# ── Per-layer line finders ─────────────────────────────────────────────────────

def _endpoint_line(obj: dict) -> int | None:
    """
    Find the 1-based line of the route handler in implemented_in.
    Searches for the FastAPI/Starlette route decorator matching the endpoint path.
    e.g. endpoint 'GET /v1/health' → looks for  @router.get("/v1/health"  in the file.
    """
    file_path = _resolve(obj.get("implemented_in"))
    if file_path is None:
        return None

    method  = (obj.get("method") or "").lower()
    ep_path = obj.get("path") or ""
    # Strip path params to match partial path in decorator
    base_path = re.split(r"\{", ep_path)[0].rstrip("/")

    patterns = [
        # FastAPI/Starlette decorator  @router.get("/v1/health"
        rf'@\w+\.{re.escape(method)}\s*\(\s*["\']/?{re.escape(base_path.lstrip("/"))}',
        # Generic fallback: the full path string appears on that line
        rf'["\']/?{re.escape(base_path.lstrip("/"))}["\'/]',
    ]
    return _find_line(file_path, patterns)


def _component_line(obj: dict) -> int | None:
    """
    Find the 1-based line of the React component declaration in repo_path.
    Matches: export default function X, export function X, const X = , function X(
    """
    file_path = _resolve(obj.get("repo_path"))
    if file_path is None:
        return None

    cid = re.escape(obj["id"])
    patterns = [
        rf"export\s+default\s+function\s+{cid}\b",
        rf"export\s+function\s+{cid}\b",
        rf"export\s+const\s+{cid}\s*[:=]",
        rf"function\s+{cid}\s*\(",
        rf"const\s+{cid}\s*[:=]",
    ]
    return _find_line(file_path, patterns)


def _hook_line(obj: dict) -> int | None:
    """
    Find the 1-based line of the hook function declaration in repo_path.
    Hook id may or may not start with 'use' depending on convention.
    """
    file_path = _resolve(obj.get("repo_path"))
    if file_path is None:
        return None

    hid = re.escape(obj["id"])
    patterns = [
        rf"export\s+function\s+{hid}\b",
        rf"export\s+const\s+{hid}\s*[:=]",
        rf"function\s+{hid}\s*\(",
        rf"const\s+{hid}\s*[:=]",
    ]
    return _find_line(file_path, patterns)


def _screen_line(obj: dict) -> int | None:
    """
    Find the 1-based line of the screen component declaration in component_path.
    Falls back to repo_path if present.
    """
    file_path = _resolve(obj.get("component_path")) or _resolve(obj.get("repo_path"))
    if file_path is None:
        return None

    sid = re.escape(obj["id"])
    patterns = [
        rf"export\s+default\s+function\s+{sid}\b",
        rf"export\s+function\s+{sid}\b",
        rf"export\s+const\s+{sid}\s*[:=]",
        rf"function\s+{sid}\s*\(",
        rf"const\s+{sid}\s*[:=]",
    ]
    return _find_line(file_path, patterns)


# ── Layer dispatch table ───────────────────────────────────────────────────────

LAYER_CONFIG: dict[str, dict] = {
    "endpoints":  {"finder": _endpoint_line,  "path_field": "implemented_in"},
    "components": {"finder": _component_line, "path_field": "repo_path"},
    "hooks":      {"finder": _hook_line,      "path_field": "repo_path"},
    "screens":    {"finder": _screen_line,    "path_field": "component_path"},
}


# ── Main ───────────────────────────────────────────────────────────────────────

def process_layer(
    layer: str,
    dry_run: bool,
    verbose: bool,
) -> tuple[int, int, int]:
    """
    Returns (put_count, skipped_count, error_count).
    """
    cfg = LAYER_CONFIG[layer]
    finder = cfg["finder"]
    path_field = cfg["path_field"]

    print(f"\n-- {layer} {'-' * (50 - len(layer))}")
    try:
        objects = _api_get_all(layer)
    except Exception as exc:
        print(f"  ERROR fetching layer: {exc}")
        return 0, 0, 1

    put_count = skipped = errors = 0

    for obj in objects:
        obj_id = obj.get("id") or obj.get("obj_id") or ""
        if not obj_id:
            skipped += 1
            continue

        # Skip if already has a repo_line value
        existing = obj.get("repo_line")

        new_line = finder(obj)

        if new_line is None:
            if verbose:
                src = obj.get(path_field) or "—"
                status = obj.get("status", "?")
                print(f"  SKIP  {obj_id!r:50s}  [{status}]  path={src}")
            skipped += 1
            continue

        if new_line == existing:
            if verbose:
                print(f"  SAME  {obj_id!r:50s}  line={new_line}")
            skipped += 1
            continue

        print(f"  {'DRY ' if dry_run else 'PUT '}  {obj_id!r:50s}  line={new_line}  (was {existing!r})")

        if not dry_run:
            # Merge the new field into the existing object
            updated = {**obj, "repo_line": new_line}
            try:
                result = _api_put(layer, obj_id, updated)
                if verbose:
                    print(f"         rv={result.get('row_version')} modified={result.get('modified_at','?')[:19]}")
                put_count += 1
                time.sleep(REQUEST_DELAY_S)
            except Exception as exc:
                print(f"  ERROR  {obj_id!r}: {exc}")
                errors += 1
        else:
            put_count += 1

    return put_count, skipped, errors


def main() -> None:
    global EVA_FOUNDATION_ROOT  # must be declared before any reference in this scope

    parser = argparse.ArgumentParser(description="Backfill repo_line on EVA model objects")
    parser.add_argument("--dry-run", action="store_true", help="Compute lines but do not PUT")
    parser.add_argument("--layer", choices=list(LAYER_CONFIG), help="Process one layer only")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show skipped objects too")
    parser.add_argument("--root", default=str(EVA_FOUNDATION_ROOT),
                        help=f"Path to eva-foundation root (default: {EVA_FOUNDATION_ROOT})")
    args = parser.parse_args()

    EVA_FOUNDATION_ROOT = Path(args.root)

    print(f"EVA Foundation root : {EVA_FOUNDATION_ROOT}")
    print(f"API base            : {API_BASE}")
    print(f"Dry run             : {args.dry_run}")

    # Health check
    try:
        h = requests.get(f"{API_BASE}/health", timeout=5)
        h.raise_for_status()
        print(f"API health          : {h.json().get('status', 'ok')}")
    except Exception as exc:
        print(f"\nERROR: Cannot reach API at {API_BASE}: {exc}", file=sys.stderr)
        sys.exit(1)

    layers = [args.layer] if args.layer else list(LAYER_CONFIG)

    total_put = total_skip = total_err = 0
    for layer in layers:
        p, s, e = process_layer(layer, dry_run=args.dry_run, verbose=args.verbose)
        total_put  += p
        total_skip += s
        total_err  += e

    print(f"\n{'=' * 60}")
    print(f"PUT (updated)  : {total_put}")
    print(f"Skipped        : {total_skip}")
    print(f"Errors         : {total_err}")

    if total_err:
        sys.exit(1)


if __name__ == "__main__":
    main()
