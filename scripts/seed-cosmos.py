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
    # ── L01-L05: Project Management (Session 41 populated) ──
    "projects": "projects.json",
    "sprints": "sprints.json",
    "stories": "stories.json",
    "tasks": "tasks.json",
    "evidence": "evidence.json",
    "coverage_summary": "coverage_summary.json",
    
    # ── L06-L10: Service Catalog & Architecture (Session 41 populated) ──
    "services": "services.json",
    "repos": "repos.json",
    "tech_stack": "tech_stack.json",
    "architecture_decisions": "architecture_decisions.json",
    
    # ── L11-L15: API & Contracts (Session 41 populated) ──
    "endpoints": "endpoints.json",
    "api_contracts": "api_contracts.json",
    "request_response_samples": "request_response_samples.json",
    
    # ── L16-L20: Deployment & Config (Session 41 populated) ──
    "deployment_targets": "deployment_targets.json",
    "ci_cd_pipelines": "ci_cd_pipelines.json",
    "deployment_history": "deployment_history.json",
    "config_defs": "config_defs.json",
    "runtime_config": "runtime_config.json",
    "secrets_catalog": "secrets_catalog.json",
    "env_vars": "env_vars.json",
    
    # ── L21-L25: Agent Workflows & Instructions (Session 41 populated) ──
    "prompts": "prompts.json",
    "personas": "personas.json",
    "instructions": "instructions.json",
    "agentic_workflows": "agentic_workflows.json",
    "session_transcripts": "session_transcripts.json",
    "workflow_metrics": "workflow_metrics.json",
    
    # ── L26-L30: Error Tracking & Telemetry (Session 41 populated) ──
    "error_catalog": "error_catalog.json",
    "model_telemetry": "model_telemetry.json",
    "cost_tracking": "cost_tracking.json",
    "evidence_correlation": "evidence_correlation.json",
    "decision_provenance": "decision_provenance.json",
    
    # ── L31-L35: Governance & Quality Gates (existing) ──
    "agent_policies": "agent_policies.json",
    "quality_gates": "quality_gates.json",
    "github_rules": "github_rules.json",
    "verification_records": "verification_records.json",
    
    # ── L36-L39: Deployment Policies & Testing (Session 41 populated) ──
    "deployment_policies": "deployment_policies.json",
    "runbooks": "runbooks.json",
    "test_cases": "test_cases.json",
    "synthetic_tests": "synthetic_tests.json",
    
    # ── L40-L47: Infrastructure Monitoring (Session 41 populated) ──
    "agent_performance_metrics": "agent_performance_metrics.json",
    "service_health_metrics": "service_health_metrics.json",
    "resource_inventory": "resource_inventory.json",
    "usage_metrics": "usage_metrics.json",
    "cost_allocation": "cost_allocation.json",
    "infrastructure_events": "infrastructure_events.json",
    "agent_execution_history": "agent_execution_history.json",
    "resource_costs": "resource_costs.json",
    
    # ── L48-L51: Automated Remediation (Session 40 deployed) ──
    "remediation_policies": "remediation_policies.json",
    "auto_fix_execution_history": "auto_fix_execution_history.json",
    "remediation_outcomes": "remediation_outcomes.json",
    "remediation_effectiveness": "remediation_effectiveness.json",
    
    # ── Legacy / Deprecated (keep for backward compatibility) ──
    "wbs": "wbs.json",
    "feature_flags": "feature_flags.json",
    "containers": "containers.json",
    "schemas": "schemas.json",
    "screens": "screens.json",
    "literals": "literals.json",
    "agents": "agents.json",
    "infrastructure": "infrastructure.json",
    "requirements": "requirements.json",
    "planes": "planes.json",
    "connections": "connections.json",
    "environments": "environments.json",
    "cp_skills": "cp_skills.json",
    "cp_agents": "cp_agents.json",
    "cp_workflows": "cp_workflows.json",
    "cp_policies": "cp_policies.json",
    "mcp_servers": "mcp_servers.json",
    "security_controls": "security_controls.json",
    "components": "components.json",
    "hooks": "hooks.json",
    "ts_types": "ts_types.json",
    "milestones": "milestones.json",
    "risks": "risks.json",
    "decisions": "decisions.json",
    "traces": "traces.json",
    "workspace_config": "workspace_config.json",
    "project_work": "project_work.json",
    "testing_policies": "testing_policies.json",
    "validation_rules": "validation_rules.json",
    "azure_infrastructure": "azure_infrastructure.json",
    "compliance_audit": "compliance_audit.json",
    "deployment_quality_scores": "deployment_quality_scores.json",
    "deployment_records": "deployment_records.json",
    "eva_model": "eva-model.json",
    "infrastructure_drift": "infrastructure_drift.json",
    "performance_trends": "performance_trends.json",
    
    # ── L52-L75: Execution Engine (Phases 1-6, Session 41 Part 11) ──
    # Phase 1: Core Execution (L52-L56)
    "work_execution_units": "work_execution_units.json",           # L52
    "work_step_events": "work_step_events.json",                   # L53
    "work_decision_records": "work_decision_records.json",         # L54
    "work_outcomes": "work_outcomes.json",                         # L56
    
    # Phase 2: Obligations & Learning (L55, L57-L58)
    "work_obligations": "work_obligations.json",                   # L55
    "work_learning_feedback": "work_learning_feedback.json",       # L57
    "work_reusable_patterns": "work_reusable_patterns.json",       # L58
    
    # Phase 3: Pattern Performance (L59-L60)
    "work_pattern_applications": "work_pattern_applications.json", # L59
    "work_pattern_performance_profiles": "work_pattern_performance_profiles.json", # L60
    
    # Phase 4: Factory Capabilities & Services (L61-L66)
    "work_factory_capabilities": "work_factory_capabilities.json", # L61
    "work_factory_services": "work_factory_services.json",         # L62
    "work_service_requests": "work_service_requests.json",         # L63
    "work_service_runs": "work_service_runs.json",                 # L64
    "work_service_perf_profiles": "work_service_perf_profiles.json", # L65
    "work_service_level_objectives": "work_service_level_objectives.json", # L66
    
    # Phase 5: Self-Healing (L67-L70)
    "work_service_breaches": "work_service_breaches.json",         # L67
    "work_service_remediation_plans": "work_service_remediation_plans.json", # L68
    "work_service_revalidation_results": "work_service_revalidation_results.json", # L69
    "work_service_lifecycle": "work_service_lifecycle.json",       # L70
    
    # Phase 6: Strategy & Portfolio (L71-L75)
    "work_factory_portfolio": "work_factory_portfolio.json",       # L71
    "work_factory_roadmaps": "work_factory_roadmaps.json",         # L72
    "work_factory_investments": "work_factory_investments.json",   # L73
    "work_factory_metrics": "work_factory_metrics.json",           # L74
    "work_factory_governance": "work_factory_governance.json",     # L75
    
    # ── L76-L86: Security Schemas (Session 46 P36 Red-Teaming + P58 Security Factory) ──
    # P36 Red-Teaming: LLM vulnerability testing (L76-L80)
    "attack_tactic_catalog": "attack_tactic_catalog.json",                 # L76
    "red_team_test_suite": "red_team_test_suite.json",                     # L77
    "ai_security_finding": "ai_security_finding.json",                     # L78
    "framework_evidence_mapping": "framework_evidence_mapping.json",       # L79
    "ai_security_metrics": "ai_security_metrics.json",                     # L80
    
    # P58 Security Factory: Infrastructure vulnerability scanning (L81-L86)
    "vulnerability_scan_result": "vulnerability_scan_result.json",         # L81
    "cve_finding": "cve_finding.json",                                     # L82
    "risk_ranking": "risk_ranking.json",                                   # L83
    "remediation_task": "remediation_task.json",                           # L84
    "compliance_gap_mapping": "compliance_gap_mapping.json",               # L85
    "threat_intelligence_context": "threat_intelligence_context.json",     # L86
}

_MODEL_DIR = _ROOT / "model"
_ACTOR = "system:seed-cosmos"

# Common ID field patterns: map alternate ID fields to 'id'
_COMMON_ID_FIELDS = [
    "work_unit_id",
    "decision_id",
    "execution_id",
    "metric_id",
    "effectiveness_id",
    "score_id",
    "trend_id",
    "record_id",
    "event_id",
    "policy_id",
    "resource_id",
]


def _normalize_object_ids(objects: list[dict], layer: str) -> list[dict]:
    """
    Ensure all objects have an 'id' field by checking common patterns.
    
    Args:
        objects: List of dict objects extracted from JSON
        layer: Layer name for logging
        
    Returns:
        List of objects with 'id' field set
    """
    for obj in objects:
        if "id" in obj:
            continue  # Already has id
        
        # Check for 'key' field (legacy pattern)
        if "key" in obj:
            obj["id"] = obj["key"]
            continue
        
        # Check common ID field patterns
        for id_field in _COMMON_ID_FIELDS:
            if id_field in obj:
                obj["id"] = obj[id_field]
                break
        
        # Last resort: for single-object layers, try layer_id pattern
        layer_id_field = f"{layer}_id"
        if layer_id_field in obj and "id" not in obj:
            obj["id"] = obj[layer_id_field]
    
    return objects


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

        # Normalize id fields and add metadata
        objects = _normalize_object_ids(objects, layer)
        for obj in objects:
            obj.setdefault("source_file", f"model/{filename}")
        
        # Filter to only objects with valid IDs
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
