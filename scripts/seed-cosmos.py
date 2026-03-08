#!/usr/bin/env python
"""
seed-cosmos.py — One-shot Cosmos DB seed from disk JSON layer files.

Usage:
  python scripts/seed-cosmos.py [--dry-run] [--layer <layer>]

Options:
  --dry-run        Validate layer files and count objects without writing to Cosmos.
  --layer <name>   Seed only the specified layer (e.g. --layer endpoints).
                   Can be repeated. Defaults to all 51 layers.

Requirements:
  COSMOS_URL and COSMOS_KEY must be set in .env (or environment).
  Run from the repo root:  python scripts/seed-cosmos.py

Why this exists (COS-4):
  When pointing at a fresh Cosmos container (first deploy or disaster recovery),
  there is no automated way to seed all 51 layers from disk JSON without this script.
  The API's POST /model/admin/seed endpoint does the same thing but requires the
  API to already be running and authenticated — this script is the bootstrap path.

Performance:
  Uses CosmosStore.bulk_load which was parallelized in PROD-WI-4.
  Expected throughput: 960 objects in ~5-10s (vs ~60s sequential before PROD-WI-4).
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path

# ── path bootstrap ────────────────────────────────────────────────────────────
_ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(_ROOT))

from api.config import Settings
from api.store.cosmos import CosmosStore

# ── layer file registry (mirrors api/routers/admin.py _LAYER_FILES) ───────────
_LAYER_FILES: dict[str, str] = {
    "services":           "services.json",
    "personas":           "personas.json",
    "feature_flags":      "feature_flags.json",
    "containers":         "containers.json",
    "endpoints":          "endpoints.json",
    "schemas":            "schemas.json",
    "screens":            "screens.json",
    "literals":           "literals.json",
    "agents":             "agents.json",
    "infrastructure":     "infrastructure.json",
    "requirements":       "requirements.json",
    "planes":             "planes.json",
    "connections":        "connections.json",
    "environments":       "environments.json",
    "cp_skills":          "cp_skills.json",
    "cp_agents":          "cp_agents.json",
    "runbooks":           "runbooks.json",
    "cp_workflows":       "cp_workflows.json",
    "cp_policies":        "cp_policies.json",
    "mcp_servers":        "mcp_servers.json",
    "prompts":            "prompts.json",
    "security_controls":  "security_controls.json",
    "components":         "components.json",
    "hooks":              "hooks.json",
    "ts_types":           "ts_types.json",
    # project plane (E-07/E-08) — waterfall WBS + agile scrum + CI/CD linkage
    "projects":           "projects.json",
    "wbs":                "wbs.json",
    "sprints":            "sprints.json",
    "milestones":         "milestones.json",
    "risks":              "risks.json",
    "decisions":          "decisions.json",
    "traces":             "traces.json",
    # observability plane (L11) — proof-of-completion + call tracing
    "evidence":           "evidence.json",
    # governance plane (L32-L35) — data-model-first architecture + agent automation safety
    "workspace_config":   "workspace_config.json",
    "project_work":       "project_work.json",
    "agent_policies":     "agent_policies.json",
    "quality_gates":      "quality_gates.json",
    "github_rules":       "github_rules.json",
    # deployment & testing (L36-L38) — deployment policies + testing automation + validation rules
    "deployment_policies": "deployment_policies.json",
    "testing_policies":   "testing_policies.json",
    "validation_rules":   "validation_rules.json",
    # infrastructure monitoring (L48-L51) — Priority #4 observability layers
    "agent_execution_history":       "agent_execution_history.json",
    "agent_performance_metrics":     "agent_performance_metrics.json",
    "azure_infrastructure":          "azure_infrastructure.json",
    "compliance_audit":              "compliance_audit.json",
    "deployment_quality_scores":     "deployment_quality_scores.json",
    "deployment_records":            "deployment_records.json",
    "eva_model":                     "eva-model.json",
    "infrastructure_drift":          "infrastructure_drift.json",
    "performance_trends":            "performance_trends.json",
    "resource_costs":                "resource_costs.json",
}

_MODEL_DIR = _ROOT / "model"
_ACTOR = "system:seed-cosmos"


async def seed(
    store: CosmosStore,
    layers_to_seed: list[str],
    dry_run: bool,
) -> dict[str, int]:
    counts: dict[str, int] = {}
    errors: list[str] = []

    for layer in layers_to_seed:
        filename = _LAYER_FILES[layer]
        path = _MODEL_DIR / filename
        if not path.exists():
            print(f"  [WARN]  {layer:<22} — {filename} not found, skipping")
            continue

        raw = json.loads(path.read_text(encoding="utf-8"))
        objects: list[dict] = raw.get(layer, [])
        if not objects:
            for v in raw.values():
                if isinstance(v, list):
                    objects = v
                    break

        # Normalise id field
        for obj in objects:
            if "id" not in obj and "key" in obj:
                obj["id"] = obj["key"]
            obj.setdefault("source_file", f"model/{filename}")
        objects = [o for o in objects if o.get("id")]

        if dry_run:
            print(f"  [DRY]   {layer:<22} — {len(objects):>4} objects (not written)")
            counts[layer] = len(objects)
            continue

        t0 = time.perf_counter()
        try:
            loaded = await store.bulk_load(layer, objects, _ACTOR)
            elapsed = time.perf_counter() - t0
            print(f"  [OK]    {layer:<22} — {loaded:>4} objects  ({elapsed:.1f}s)")
            counts[layer] = loaded
        except Exception as exc:
            elapsed = time.perf_counter() - t0
            msg = f"{layer}: bulk_load failed — {exc}"
            errors.append(msg)
            print(f"  [FAIL]  {layer:<22} — {msg}  ({elapsed:.1f}s)")
            counts[layer] = 0

    if errors:
        print(f"\n[FAIL] {len(errors)} layer(s) failed:")
        for e in errors:
            print(f"  {e}")
    else:
        total = sum(counts.values())
        tag = "[DRY] " if dry_run else "[OK]  "
        print(f"\n{tag}Total: {total} objects across {len(counts)} layers")

    return counts


async def main(args: argparse.Namespace) -> int:
    settings = Settings()

    # ── credential check ──────────────────────────────────────────────────
    if not settings.cosmos_url or not settings.cosmos_key:
        print("[FAIL] COSMOS_URL and COSMOS_KEY must be set in .env or environment.")
        print("       Copy .env.example → .env and fill in the values.")
        return 1

    # ── layer selection ───────────────────────────────────────────────────
    if args.layer:
        unknown = [l for l in args.layer if l not in _LAYER_FILES]
        if unknown:
            print(f"[FAIL] Unknown layer(s): {', '.join(unknown)}")
            print(f"       Valid layers: {', '.join(_LAYER_FILES)}")
            return 1
        layers_to_seed = args.layer
    else:
        layers_to_seed = list(_LAYER_FILES)

    mode = "DRY RUN — no writes to Cosmos" if args.dry_run else (
        f"Cosmos DB:  {settings.cosmos_url}\n"
        f"  Database:   {settings.model_db_name}\n"
        f"  Container:  {settings.model_container_name}"
    )
    print(f"EVA Data Model — Cosmos Seed\n{mode}\n")

    # ── connect (skip for dry-run) ────────────────────────────────────────
    store: CosmosStore | None = None
    if not args.dry_run:
        print("Connecting to Cosmos DB...")
        store = CosmosStore(
            url=settings.cosmos_url,
            key=settings.cosmos_key,
            db_name=settings.model_db_name,
            container_name=settings.model_container_name,
        )
        t0 = time.perf_counter()
        await store.init()
        elapsed = time.perf_counter() - t0
        print(f"  [OK]    Connected + container ready  ({elapsed:.1f}s)\n")

    t_start = time.perf_counter()
    counts = await seed(store, layers_to_seed, args.dry_run)   # type: ignore[arg-type]
    total_elapsed = time.perf_counter() - t_start

    if not args.dry_run:
        total = sum(counts.values())
        print(f"\nDone: {total} objects seeded in {total_elapsed:.1f}s")
        print("Next: POST http://localhost:8010/model/admin/validate  (Bearer <ADMIN_TOKEN>)")

    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Cosmos DB from disk JSON layer files.")
    parser.add_argument("--dry-run", action="store_true", help="Count objects without writing")
    parser.add_argument("--layer", action="append", metavar="LAYER",
                        help="Seed only this layer (can be repeated)")
    ns = parser.parse_args()
    sys.exit(asyncio.run(main(ns)))
