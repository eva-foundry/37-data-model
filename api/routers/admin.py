"""
Admin router — privileged operations.

POST /model/admin/seed           Seed Cosmos from disk JSON layer files (idempotent)
POST /model/admin/export         Export store back to disk JSON layer files (completes write cycle)
POST /model/admin/cache/flush    Flush all cache entries
GET  /model/admin/audit          Last N writes across all layers (audit trail)
GET  /model/admin/validate       In-process cross-reference integrity check
POST /model/admin/commit         export + assemble + validate in one API call (agent shortcut)
POST /model/admin/audit-repo     Proxy to eva-veritas MCP: verify declared progress matches artifacts
POST /model/admin/layers         Register new layer definition (Layer Registration API — Session 45 Phase A)

Write cycle (correct protocol — never edit JSON files directly):
  1. PUT /model/{layer}/{id}       stamps modified_at / modified_by / row_version
  2. GET /model/{layer}/{id}       verify
  3. POST /model/admin/commit      ONE CALL: export + assemble + validate (preferred)
     -- or individually:
        POST /model/admin/export      write store back to model/*.json
        assemble-model.ps1            rebuild eva-model.json
        validate-model.ps1            cross-reference check
Direct JSON edits bypass the audit trail entirely (modified_by stays "system:autoload",
row_version stays 1 for everything) — treat them the same as direct database UPDATE
instead of going through the application layer.

eva-veritas integration (EO-08):
  POST /model/admin/audit-repo { "project_id": "33-eva-brain-v2" }
  Proxies to eva-veritas MCP server (default http://localhost:8031/tools/audit_repo).
  Returns: { trust_score, coverage, gaps[], actions[] }
  Override MCP server URL: env var EVA_VERITAS_MCP_URL

Layer Registration API (Session 45 Phase A: D³PDCA Discovery Layers):
  POST /model/admin/layers { layer_id, layer_name, schema, relationships, ... }
  Registers new layer definition (L122-L129 Discovery & Sense-Making domain).
  Idempotent: safe to re-run.
  Returns: 201 Created with registration metadata.
  Protocol: Validate → Create JSON → Seed to Cosmos → Verify → Return 201.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Body

from pydantic import BaseModel, Field

from api.store.base import AbstractStore
from api.cache.base import AbstractCache
from api.dependencies import get_store, get_cache, require_admin

log = logging.getLogger(__name__)

router = APIRouter(prefix="/model/admin", tags=["model-admin"])

# Ordered — matches assemble-model.ps1 layer order
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
    
    # Phase 2: Factory Governance (L57-L61)
    "work_factory_capabilities": "work_factory_capabilities.json",
    "work_factory_governance": "work_factory_governance.json",
    "work_factory_investments": "work_factory_investments.json",
    "work_factory_metrics": "work_factory_metrics.json",
    "work_factory_portfolio": "work_factory_portfolio.json",
    "work_factory_roadmaps": "work_factory_roadmaps.json",
    "work_factory_services": "work_factory_services.json",
    
    # Phase 3: Obligations & Learning (L62-L64)
    "work_obligations": "work_obligations.json",
    "work_learning_feedback": "work_learning_feedback.json",
    
    # Phase 4: Pattern Framework (L65-L67)
    "work_pattern_applications": "work_pattern_applications.json",
    "work_pattern_performance_profiles": "work_pattern_performance_profiles.json",
    "work_reusable_patterns": "work_reusable_patterns.json",
    
    # Phase 5: Service Orchestration (L68-L73)
    "work_service_breaches": "work_service_breaches.json",
    "work_service_level_objectives": "work_service_level_objectives.json",
    "work_service_lifecycle": "work_service_lifecycle.json",
    "work_service_perf_profiles": "work_service_perf_profiles.json",
    "work_service_remediation_plans": "work_service_remediation_plans.json",
    "work_service_requests": "work_service_requests.json",
    "work_service_revalidation_results": "work_service_revalidation_results.json",
    "work_service_runs": "work_service_runs.json",
    
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


def _get_model_dir() -> Path:
    """Return the model data directory, honouring MODEL_DIR env override."""
    from api.config import get_settings
    override = get_settings().model_dir_override
    if override:
        return Path(override)
    return Path(__file__).parents[2] / "model"


# ── DATA EXTRACTION MAPPINGS ────────────────────────────────────────────

# Known exceptions: layers where data key differs from layer name
_LAYER_DATA_KEYS: dict[str, str] = {
    "agent_execution_history": "execution_records",
    "agent_performance_metrics": "agent_metrics",
    "deployment_quality_scores": "quality_scores",
    "performance_trends": "trend_records",
}

# Layers where the entire file is a single object (wrap in array)
_SINGLE_OBJECT_LAYERS: set[str] = {
    "remediation_effectiveness",
}

# Layers where data is in a dict that needs values extracted
_DICT_VALUE_LAYERS: set[str] = {
    "azure_infrastructure",  # resources: {key: obj, key: obj} -> [obj, obj]
}

# Layers with no arrays (metadata/placeholder files - skip without error)
_SKIP_LAYERS: set[str] = {
    "evidence",      # Has "objects" key but it's a dict, not array
    "traces",        # Has "traces" key but it's a dict, not array
    "eva_model",     # Placeholder file (4 bytes empty)
}

# Common ID field patterns: map alternate ID fields to 'id'
_COMMON_ID_FIELDS: list[str] = [
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
        if layer_id_field in obj:
            obj["id"] = obj[layer_id_field]
    
    return objects


def _extract_objects_from_json(raw: dict | list, layer: str, filename: str) -> list[dict]:
    """
    Smart extraction of object arrays from various JSON structures.
    
    Handles:
    - Raw arrays: [obj1, obj2, ...]
    - Standard dict: {"layer_name": [obj1, obj2, ...]}
    - Alternate keys: {"execution_records": [...]} for agent_execution_history
    - Single objects: Entire file is one object (wrap in array)
    - Dict values: {"resources": {key1: obj1, key2: obj2}} -> [obj1, obj2]
    - Skip layers: Known metadata files with no data
    
    Returns:
        List of dict objects ready for bulk_load
    """
    
    # Check skip list first
    if layer in _SKIP_LAYERS:
        log.info("Extract: %s is a metadata layer, skipping", layer)
        return []
    
    # Case 1: Raw array
    if isinstance(raw, list):
        return raw
    
    # Case 2: Single object layer (wrap entire file)
    if layer in _SINGLE_OBJECT_LAYERS:
        if isinstance(raw, dict):
            # Use layer name + "_id" field as 'id' if present
            id_field = f"{layer}_id"
            if id_field in raw:
                raw.setdefault("id", raw[id_field])
            return [raw]
        else:
            log.warning("Extract: %s marked as single object but not a dict", layer)
            return []
    
    # Case 3: Dict value extraction (resources dict -> array of resources)
    if layer in _DICT_VALUE_LAYERS:
        if isinstance(raw, dict) and "resources" in raw:
            resources = raw["resources"]
            if isinstance(resources, dict):
                # Extract values from dict, add resource key as 'id' if missing
                objects = []
                for key, obj in resources.items():
                    if isinstance(obj, dict):
                        obj.setdefault("id", key)
                        obj.setdefault("resource_id", key)
                        objects.append(obj)
                return objects
        log.warning("Extract: %s marked for dict extraction but no resources dict found", layer)
    
    # Case 4: Dict with layer data
    if isinstance(raw, dict):
        # Try exact layer name match
        if layer in raw and isinstance(raw[layer], list):
            return raw[layer]
        
        # Check known alternate keys
        if layer in _LAYER_DATA_KEYS:
            alt_key = _LAYER_DATA_KEYS[layer]
            if alt_key in raw and isinstance(raw[alt_key], list):
                return raw[alt_key]
        
        # Try common variations (plural forms)
        for candidate in [layer + 's', layer + 'es']:
            if candidate in raw and isinstance(raw[candidate], list):
                log.info("Extract: %s using plural key '%s'", layer, candidate)
                return raw[candidate]
        
        # Last resort: find first array that looks like data (has 'id' fields)
        for key, value in raw.items():
            # Skip schema/metadata keys
            if key.startswith('$') or key in ['metadata', 'summary', 'statistics']:
                continue
            
            if isinstance(value, list) and len(value) > 0:
                # Check if array contains objects with 'id' fields
                sample = value[:3] if len(value) >= 3 else value
                if all(isinstance(obj, dict) and 'id' in obj for obj in sample):
                    log.warning(
                        "Extract: %s using fallback array from key '%s' (add to _LAYER_DATA_KEYS)",
                        layer, key
                    )
                    return value
    
    # No data found
    return []


# ── SEED ────────────────────────────────────────────────────────────────

@router.post("/seed",
             summary="Seed store from disk JSON layer files (idempotent — safe to re-run)",
             )
async def seed(
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
    actor: str = Depends(require_admin),
) -> dict[str, Any]:
    """
    Reads each model/&lt;layer&gt;.json file and upserts every object into the store.
    Preserves existing created_by / created_at on objects that already exist.
    Increments row_version on existing objects.
    Idempotent: safe to call on first run, re-runs, and migrations.
    """
    start_time = time.time()
    counts: dict[str, int] = {}
    errors: list[str] = []
    progress: list[str] = []

    progress.append("=== SEED OPERATION STARTED ===")
    progress.append(f"Total layers to process: {len(_LAYER_FILES)}")
    progress.append(f"Actor: {actor}")
    progress.append("")

    try:
        for idx, (layer, filename) in enumerate(_LAYER_FILES.items(), 1):
            layer_start = time.time()
            path = _get_model_dir() / filename
            
            progress.append(f"[{idx}/{len(_LAYER_FILES)}] Processing {layer}...")
            
            if not path.exists():
                msg = f"  ⚠ File not found: {filename}, skipping"
                progress.append(msg)
                log.warning("Seed: %s not found, skipping", path)
                continue

            # Read file
            try:
                file_size = path.stat().st_size
                progress.append(
                    f"  [FILE] Reading {filename} ({file_size:,} bytes)...")
                raw = json.loads(path.read_text(encoding="utf-8"))
            except Exception as exc:
                error_msg = f"{layer}: Failed to read/parse {filename} — {exc}"
                errors.append(error_msg)
                progress.append(f"  [WARN] Read failed: {exc}")
                log.error("Seed: %s read failed — %s", filename, exc)
                continue

            # Extract objects using smart extractor
            try:
                objects = _extract_objects_from_json(raw, layer, filename)
            except Exception as exc:
                error_msg = f"{layer}: Failed to extract objects from {filename} — {exc}"
                errors.append(error_msg)
                progress.append(f"  [ERROR] Extract failed: {exc}")
                log.error("Seed: %s extract failed — %s", filename, exc)
                continue

            # Ensure objects is a list and filter to dicts only
            if not isinstance(objects, list):
                objects = []
            objects = [o for o in objects if isinstance(o, dict)]
            
            # Normalize IDs: map common ID field patterns to 'id'
            objects = _normalize_object_ids(objects, layer)
            
            # Filter out objects without 'id'
            objects = [o for o in objects if o.get("id")]
            # Stamp source_file on every object so the field is persisted on export
            # and carried forward into every subsequent cold-deploy seed cycle.
            for obj in objects:
                obj.setdefault("source_file", f"model/{filename}")
            
            progress.append(f"  [DATA] Found {len(objects)} objects")
            
            try:
                # bulk_load preserves audit fields from JSON; only fills defaults
                # for gaps
                progress.append("  [PROCESSING] Upserting to store...")
                log.info("Seed: Starting %s with %d objects", layer, len(objects))
                loaded = await store.bulk_load(layer, objects, actor)
                
                layer_time = time.time() - layer_start
                progress.append(
                    f"  [PASS] Loaded {loaded} objects in {layer_time:.2f}s")
                log.info("Seed: Completed %s — %d objects loaded in %.2fs", layer, loaded, layer_time)
            except Exception as exc:
                error_msg = f"{layer}: bulk_load failed — {type(exc).__name__}: {exc}"
                errors.append(error_msg)
                progress.append(
                    f"  [ERROR] Load failed: {type(exc).__name__}: {exc}")
                log.error("Seed: %s", error_msg, exc_info=True)
                loaded = 0

            await cache.invalidate_layer(layer)
            counts[layer] = loaded
            progress.append("")  # Blank line between layers

    except Exception as exc:
        error_msg = f"Seed operation failed — {type(exc).__name__}: {exc}"
        errors.append(error_msg)
        progress.append(f"[ERROR] FATAL ERROR: {error_msg}")
        log.error("Seed: Fatal error — %s", exc, exc_info=True)

    total_time = time.time() - start_time
    total_records = sum(counts.values())
    layers_with_data = sum(1 for c in counts.values() if c > 0)
    layers_skipped = len(_LAYER_FILES) - len(counts)
    
    # Invalidate Redis cache after seed (Session 41 Part 7)
    try:
        from api.simple_cache import invalidate_all_cache
        await invalidate_all_cache()
        log.info("Seed: Redis cache invalidated successfully")
    except Exception as cache_err:
        log.warning("Seed: Cache invalidation failed (non-fatal): %s", cache_err)
    
    progress.append("=== SEED OPERATION COMPLETED ===")
    progress.append(f"Total records loaded: {total_records:,}")
    progress.append(f"Layers in _LAYER_FILES: {len(_LAYER_FILES)}")
    progress.append(f"Layers processed: {len(counts)} (files found)")
    progress.append(f"Layers with data: {layers_with_data}")
    progress.append(f"Layers skipped: {layers_skipped} (file not found)")
    progress.append(f"Total errors: {len(errors)}")
    progress.append(f"Total time: {total_time:.2f}s")
    if total_records > 0:
        progress.append(f"Average speed: {total_records/total_time:.0f} records/sec")

    return {
        "seeded": counts,
        "total": total_records,
        "errors": errors,
        "actor": actor,
        "progress": progress,  # ← Verbose log of all operations
        "duration_seconds": round(total_time, 2),
        "layers_in_definition": len(_LAYER_FILES),
        "layers_processed": len(counts),
        "layers_with_data": layers_with_data,
        "layers_skipped": layers_skipped,
    }


# ── EXPORT ──────────────────────────────────────────────────────────────

@router.post("/export",
             summary="Export store back to disk JSON layer files (completes the write cycle)",
             )
async def export_to_disk(
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
    actor: str = Depends(require_admin),
) -> dict[str, Any]:
    """
    Step 3 of the correct write cycle:
      1. PUT /model/{layer}/{id}     -- stamps modified_at / modified_by / row_version
      2. GET /model/{layer}/{id}     -- verify
      3. POST /model/admin/export    -- this endpoint: write store back to model/*.json
      4. assemble-model.ps1          -- rebuild eva-model.json

    Each layer file is written as {"$schema": <existing>, "<layer>": [...]}
    Internal store fields (obj_id, layer) are stripped; all audit fields are preserved.
    Cosmos document-id (base64 encoded) is replaced with the business obj_id.
    """
    counts: dict[str, int] = {}
    errors: list[str] = []

    # Cosmos-internal fields to strip from every exported object
    _STRIP = {
        "obj_id",
        "layer",
        "_rid",
        "_self",
        "_etag",
        "_attachments",
        "_ts"}

    for layer, filename in _LAYER_FILES.items():
        path = _get_model_dir() / filename
        try:
            objects = await store.get_all(layer, active_only=False)
        except Exception as exc:
            errors.append(f"{layer}: get_all failed — {exc}")
            continue

        # Read existing $schema value so we don't lose it
        schema_url: str = ""
        if path.exists():
            try:
                existing_raw = json.loads(path.read_text(encoding="utf-8"))
                schema_url = existing_raw.get("$schema", "")
            except Exception:
                pass

        clean: list[dict] = []
        for doc in objects:
            out = {k: v for k, v in doc.items() if k not in _STRIP}
            # Restore business id: in Cosmos the 'id' field is the base64 doc id;
            # obj_id holds the original business key.
            if "obj_id" in doc:
                out["id"] = doc["obj_id"]
            clean.append(out)

        file_content: dict[str, Any] = {}
        if schema_url:
            file_content["$schema"] = schema_url
        file_content[layer] = clean

        try:
            path.write_text(
                json.dumps(file_content, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            counts[layer] = len(clean)
            log.info(
                "Export: %s — %d objects written to %s",
                layer,
                len(clean),
                path)
        except Exception as exc:
            errors.append(f"{layer}: write failed — {exc}")

    return {
        "exported": counts,
        "total": sum(
            counts.values()),
        "errors": errors,
        "actor": actor,
        "note": "Run assemble-model.ps1 to rebuild eva-model.json after export",
    }


# ── CACHE FLUSH ─────────────────────────────────────────────────────────

@router.post(
    "/cache/flush",
    summary="Flush the entire cache (all layers)",
)
async def flush_cache(
    cache: AbstractCache = Depends(get_cache),
    actor: str = Depends(require_admin),
) -> dict[str, Any]:
    await cache.flush_all()
    return {"flushed": True, "actor": actor}


# ── BACKFILL ────────────────────────────────────────────────────────────

# Fields that every live object should carry.  We also try to derive source_file
# from whichever existing field the layer uses to point at the real-world
# artifact.
_AUDIT_FIELDS = {"created_by", "created_at", "modified_by", "modified_at",
                 "row_version", "is_active"}

# Per-layer hint: which existing field contains the repo path for the object?
_SOURCE_FILE_HINT: dict[str, str] = {
    "endpoints": "implemented_in",
    "screens": "component_path",
    "services": "repo_path",
    "components": "file_path",
    "hooks": "file_path",
    "ts_types": "file_path",
    "runbooks": "workflow_file",
    "cp_workflows": "workflow_file",
    "agents": "file_path",
    "cp_agents": "file_path",
}


@router.post("/backfill",
             summary=("One-shot: stamp missing audit fields on all legacy objects. "
                      "Derives source_file from layer-specific path fields where possible. "
                      "Idempotent — safe to re-run; only touches objects that are still missing fields."),
             )
async def backfill_metadata(
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
    actor: str = Depends(require_admin),
) -> dict[str, Any]:
    """
    Walks every object in every layer.  For each object that is missing any
    of {created_by, created_at, modified_by, modified_at, row_version, is_active}:

      1. Derives source_file from a layer-specific hint field if that field
         is present (e.g. endpoints.implemented_in → source_file)
      2. Calls store.upsert() so the write cycle stamps modified_* and
         increments row_version correctly
      3. Flushes the layer cache

    After a full backfill, run POST /model/admin/export + assemble-model.ps1
    to persist the corrected audit trail back to disk.
    """
    touched: dict[str, int] = {}
    skipped: dict[str, int] = {}
    errors: list[str] = []

    for layer in _LAYER_FILES:
        try:
            objects = await store.get_all(layer, active_only=False)
        except Exception as exc:
            errors.append(f"{layer}: get_all failed — {exc}")
            continue

        layer_touched = 0
        layer_skipped = 0
        hint_field = _SOURCE_FILE_HINT.get(layer)

        for obj in objects:
            obj_id = str(obj.get("obj_id") or obj.get("id") or "")
            if not obj_id:
                continue

            missing = _AUDIT_FIELDS - obj.keys()
            needs_source = hint_field and hint_field in obj and "source_file" not in obj

            if not missing and not needs_source:
                layer_skipped += 1
                continue

            # Build a patch payload — carry all existing fields forward
            patch = dict(obj)
            patch.pop("obj_id", None)
            patch.pop("layer", None)
            for f in ("_rid", "_self", "_etag", "_attachments", "_ts"):
                patch.pop(f, None)

            # Derive source_file from the layer hint if possible
            if needs_source:
                patch["source_file"] = obj[hint_field]

            try:
                await store.upsert(layer, obj_id, patch, actor)
                layer_touched += 1
            except Exception as exc:
                errors.append(f"{layer}::{obj_id}: {exc}")

        await cache.invalidate_layer(layer)
        touched[layer] = layer_touched
        skipped[layer] = layer_skipped
        log.info("Backfill: %s — %d touched, %d already complete",
                 layer, layer_touched, layer_skipped)

    return {
        "touched": touched,
        "skipped": skipped,
        "total_touched": sum(touched.values()),
        "total_skipped": sum(skipped.values()),
        "errors": errors,
        "actor": actor,
        "note": "Run POST /model/admin/export then assemble-model.ps1 to persist changes",
    }


# ── AUDIT LOG ───────────────────────────────────────────────────────────

@router.get(
    "/audit",
    summary="Last N write events across all layers — audit trail",
)
async def audit_log(
    limit: int = Query(50, ge=1, le=500, description="Number of events to return"),
    store: AbstractStore = Depends(get_store),
    actor: str = Depends(require_admin),
) -> list[dict[str, Any]]:
    return await store.get_audit(limit=limit)


# ── VALIDATE ────────────────────────────────────────────────────────────

@router.get("/validate",
            summary="Run cross-reference integrity check in-process — equivalent to validate-model.ps1",
            )
async def validate(
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
    enhanced: bool = False,  # Session 41 Part 7: enhanced response with severity & remediation
    settings=Depends(lambda: None),   # unused but future-proof
    actor: str = Depends(require_admin),
) -> dict[str, Any]:
    """
    Checks:
    1. endpoint.cosmos_reads/writes → containers
    2. endpoint.feature_flag        → feature_flags
    3. endpoint.auth[]              → personas
    4. screen.api_calls[]           → endpoints
    5. literal.screens[]            → screens
    6. requirement.satisfied_by[]   → endpoints + screens
    7. agent.output_screens[]       → screens
    
    Query params:
    - enhanced=true : Return detailed categorization with severity levels and remediation
    - enhanced=false : Return legacy format (default, backward compatible)
    """
    # Load all layers
    layers: dict[str, list[dict]] = {}
    for lname in _LAYER_FILES:
        layers[lname] = await store.get_all(lname, active_only=False)
    
    # Use enhanced validation if requested
    if enhanced:
        from api.validation import enhanced_validate
        return enhanced_validate(layers)
    
    # Otherwise use legacy validation (backward compatible)
    violations: list[str] = []

    def _ids(layer_data: list[dict]) -> set[str]:
        return {str(d.get("id") or d.get("obj_id") or "")
                for d in layer_data if d}

    container_ids = _ids(layers["containers"])
    feature_flag_ids = _ids(layers["feature_flags"])
    persona_ids = _ids(layers["personas"])
    endpoint_ids = _ids(layers["endpoints"])
    screen_ids = _ids(layers["screens"])

    # 1 & 2 & 3 — endpoints
    for ep in layers["endpoints"]:
        eid = ep.get("id") or ep.get("obj_id")
        for c in ep.get("cosmos_reads", []) or []:
            if c and c not in container_ids:
                violations.append(
                    f"endpoint '{eid}' cosmos_reads references unknown container '{c}'")
        for c in ep.get("cosmos_writes", []) or []:
            if c and c not in container_ids:
                violations.append(
                    f"endpoint '{eid}' cosmos_writes references unknown container '{c}'")
        ff = ep.get("feature_flag")
        if ff and ff not in feature_flag_ids:
            violations.append(
                f"endpoint '{eid}' feature_flag '{ff}' not in feature_flags")
        for p in ep.get("auth", []) or []:
            if p and p not in persona_ids:
                violations.append(
                    f"endpoint '{eid}' auth references unknown persona '{p}'")

    # 4 — screens
    for sc in layers["screens"]:
        sid = sc.get("id") or sc.get("obj_id")
        for call in sc.get("api_calls", []) or []:
            if call and call not in endpoint_ids:
                violations.append(
                    f"screen '{sid}' api_calls references unknown endpoint '{call}'")

    # 5 — literals
    for lit in layers["literals"]:
        lid = lit.get("id") or lit.get("obj_id")
        for s in lit.get("screens", []) or []:
            if s and s not in screen_ids:
                violations.append(
                    f"literal '{lid}' screens references unknown screen '{s}'")

    # 6 — requirements
    all_obj_ids = endpoint_ids | screen_ids
    for req in layers["requirements"]:
        rid = req.get("id") or req.get("obj_id")
        for s in req.get("satisfied_by", []) or []:
            if s and s not in all_obj_ids:
                violations.append(
                    f"requirement '{rid}' satisfied_by references unknown object '{s}'")

    # 7 — agents
    for ag in layers["agents"]:
        aid = ag.get("id") or ag.get("obj_id")
        for s in ag.get("output_screens", []) or []:
            if s and s not in screen_ids:
                violations.append(
                    f"agent '{aid}' output_screens references unknown screen '{s}'")

    return {
        "violations": violations,
        "count": len(violations),
        "status": "PASS" if not violations else "FAIL",
    }


# ── CASCADE IMPACT CHECK (Session 41 Part 7) ─────────────────────────────

@router.get("/cascade-check/{layer}/{obj_id:path}",
            summary="Analyze cascade impact: identify all references to a target object")
async def cascade_check(
    layer: str,
    obj_id: str,
    store: AbstractStore = Depends(get_store),
    actor: str = Depends(require_admin),
) -> dict[str, Any]:
    """
    Perform cascade impact analysis for a target object.
    
    Returns detailed information about all objects that reference the target,
    including whether it's safe to delete without creating orphaned references.
    
    Example:
        GET /admin/cascade-check/screens/S001
        
        Returns:
        {
          "target": {"layer": "screens", "id": "S001", "exists": true, "is_active": true},
          "references": [
            {"layer": "literals", "field": "screens", "referencing_objects": [...], "count": 2},
            {"layer": "agents", "field": "output_screens", "referencing_objects": [...], "count": 1}
          ],
          "total_references": 3,
          "safe_to_delete": false,
          "warning": "Deleting this object would create 3 orphaned references",
          "remediation": ["Remove S001 from literals...", "Remove S001 from agents..."]
        }
    """
    from api.validation import build_reverse_index, cascade_impact_check
    
    # Load all layers
    layers_data: dict[str, list[dict]] = {}
    for lname in _LAYER_FILES:
        layers_data[lname] = await store.get_all(lname, active_only=False)
    
    # Build reverse index for fast lookups
    reverse_index = build_reverse_index(layers_data)
    
    # Perform cascade check
    result = cascade_impact_check(layer, obj_id, layers_data, reverse_index)
    
    return result


# ── REVERSE REFERENCE LOOKUP (Session 41 Part 7) ──────────────────────────

@router.get("/references/{layer}/{obj_id:path}",
            summary="Lookup all objects that reference a specific target (who references me?)")
async def references(
    layer: str,
    obj_id: str,
    store: AbstractStore = Depends(get_store),
    actor: str = Depends(require_admin),
) -> dict[str, Any]:
    """
    Answer the question "Who references me?" for any object.
    
    Returns all objects that have FK references to the target, grouped by layer and field.
    Useful for understanding object dependencies, planning migrations, and impact analysis.
    
    Example:
        GET /admin/references/containers/users
        
        Returns:
        {
          "target": {"layer": "containers", "id": "users", "exists": true, "is_active": true},
          "referenced_by": {
            "endpoints_cosmos_reads": {
              "field": "cosmos_reads",
              "references": [{"id": "user-profile-get", "is_active": true}, ...],
              "count": 2
            },
            "endpoints_cosmos_writes": {
              "field": "cosmos_writes",
              "references": [{"id": "user-update-post", "is_active": true}, ...],
              "count": 2
            }
          },
          "total_references": 4,
          "usage_summary": "Referenced by: 2 endpoints via cosmos_reads, 2 endpoints via cosmos_writes"
        }
    """
    from api.validation import build_reverse_index, reverse_reference_lookup
    
    # Load all layers
    layers_data: dict[str, list[dict]] = {}
    for lname in _LAYER_FILES:
        layers_data[lname] = await store.get_all(lname, active_only=False)
    
    # Build reverse index for fast lookups
    reverse_index = build_reverse_index(layers_data)
    
    # Perform reverse lookup
    result = reverse_reference_lookup(layer, obj_id, layers_data, reverse_index)
    
    return result


# ── COMMIT (export + assemble + validate in one call) ───────────────────

_SCRIPTS_DIR = Path(__file__).parents[2] / "scripts"


async def _run_ps1(script_name: str) -> dict[str, Any]:
    """Run a PowerShell script and return stdout/stderr + exit code."""
    script = _SCRIPTS_DIR / script_name
    if not script.exists():
        return {"ok": False, "rc": -1, "stdout": "",
                "stderr": f"Script not found: {script}"}
    try:
        proc = await asyncio.create_subprocess_exec(
            "pwsh", "-NonInteractive", "-NoProfile", "-File", str(script),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
        rc = proc.returncode
        return {
            "ok": rc == 0,
            "rc": rc,
            "stdout": stdout.decode("utf-8", errors="replace").strip(),
            "stderr": stderr.decode("utf-8", errors="replace").strip(),
        }
    except asyncio.TimeoutError:
        return {
            "ok": False,
            "rc": -1,
            "stdout": "",
            "stderr": "Timeout after 120s"}
    except Exception as exc:
        return {"ok": False, "rc": -1, "stdout": "", "stderr": str(exc)}


@router.post(
    "/commit",
    summary=(
        "One-call write cycle shortcut: export to disk + assemble eva-model.json + validate. "
        "Returns {status, violations, counts, exported, assemble, validate}. "
        "Replaces steps 3-5 of the manual write cycle."),
)
async def commit(
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
    actor: str = Depends(require_admin),
) -> dict[str, Any]:
    """
    Shortcut for the final three steps of the write cycle:
      Step 3: POST /model/admin/export    (done inline)
      Step 4: assemble-model.ps1          (run via subprocess)
      Step 5: validate cross-references   (done inline, same logic as GET /model/admin/validate)

    Response shape:
    {
      "status":    "PASS" | "FAIL",
      "violations": [...],            # empty on PASS
      "violation_count": 0,
      "exported":  { "projects": 45, ... },
      "exported_total": 865,
      "assemble":  { "ok": true, "rc": 0, "stdout": "..." },
      "actor": "..."
    }
    """
    # ── Step 3: export ────────────────────────────────────────────────────
    export_counts: dict[str, int] = {}
    export_errors: list[str] = []
    _STRIP = {
        "obj_id",
        "layer",
        "_rid",
        "_self",
        "_etag",
        "_attachments",
        "_ts"}

    for layer, filename in _LAYER_FILES.items():
        path = _get_model_dir() / filename
        try:
            objects = await store.get_all(layer, active_only=False)
        except Exception as exc:
            export_errors.append(f"{layer}: get_all failed — {exc}")
            continue

        schema_url: str = ""
        if path.exists():
            try:
                existing_raw = json.loads(path.read_text(encoding="utf-8"))
                schema_url = existing_raw.get("$schema", "")
            except Exception:
                pass

        clean: list[dict] = []
        for doc in objects:
            out = {k: v for k, v in doc.items() if k not in _STRIP}
            if "obj_id" in doc:
                out["id"] = doc["obj_id"]
            clean.append(out)

        file_content: dict[str, Any] = {}
        if schema_url:
            file_content["$schema"] = schema_url
        file_content[layer] = clean

        try:
            path.write_text(
                json.dumps(file_content, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            export_counts[layer] = len(clean)
        except Exception as exc:
            export_errors.append(f"{layer}: write failed — {exc}")

    log.info(
        "Commit: export complete — %d total objects", sum(
            export_counts.values()))

    # ── Step 4: assemble ──────────────────────────────────────────────────
    assemble_result = await _run_ps1("assemble-model.ps1")
    log.info("Commit: assemble rc=%d", assemble_result["rc"])

    # ── Step 5: validate ──────────────────────────────────────────────────
    violations: list[str] = []

    def _ids(layer_data: list[dict]) -> set[str]:
        return {str(d.get("id") or d.get("obj_id") or "")
                for d in layer_data if d}

    layers_data: dict[str, list[dict]] = {}
    for lname in _LAYER_FILES:
        layers_data[lname] = await store.get_all(lname, active_only=False)

    container_ids = _ids(layers_data["containers"])
    feature_flag_ids = _ids(layers_data["feature_flags"])
    persona_ids = _ids(layers_data["personas"])
    endpoint_ids = _ids(layers_data["endpoints"])
    screen_ids = _ids(layers_data["screens"])

    for ep in layers_data["endpoints"]:
        eid = ep.get("id") or ep.get("obj_id")
        for c in ep.get("cosmos_reads", []) or []:
            if c and c not in container_ids:
                violations.append(
                    f"endpoint '{eid}' cosmos_reads references unknown container '{c}'")
        for c in ep.get("cosmos_writes", []) or []:
            if c and c not in container_ids:
                violations.append(
                    f"endpoint '{eid}' cosmos_writes references unknown container '{c}'")
        ff = ep.get("feature_flag")
        if ff and ff not in feature_flag_ids:
            violations.append(
                f"endpoint '{eid}' feature_flag '{ff}' not in feature_flags")
        for p in ep.get("auth", []) or []:
            if p and p not in persona_ids:
                violations.append(
                    f"endpoint '{eid}' auth references unknown persona '{p}'")

    for sc in layers_data["screens"]:
        sid = sc.get("id") or sc.get("obj_id")
        for call in sc.get("api_calls", []) or []:
            if call and call not in endpoint_ids:
                violations.append(
                    f"screen '{sid}' api_calls references unknown endpoint '{call}'")

    for lit in layers_data["literals"]:
        lid = lit.get("id") or lit.get("obj_id")
        for s in lit.get("screens", []) or []:
            if s and s not in screen_ids:
                violations.append(
                    f"literal '{lid}' screens references unknown screen '{s}'")

    all_obj_ids = endpoint_ids | screen_ids
    for req in layers_data["requirements"]:
        rid = req.get("id") or req.get("obj_id")
        for s in req.get("satisfied_by", []) or []:
            if s and s not in all_obj_ids:
                violations.append(
                    f"requirement '{rid}' satisfied_by references unknown object '{s}'")

    for ag in layers_data["agents"]:
        aid = ag.get("id") or ag.get("obj_id")
        for s in ag.get("output_screens", []) or []:
            if s and s not in screen_ids:
                violations.append(
                    f"agent '{aid}' output_screens references unknown screen '{s}'")

    overall_ok = not violations and assemble_result["ok"] and not export_errors
    
    # Invalidate Redis cache after commit (Session 41 Part 7)
    if overall_ok:
        try:
            from api.simple_cache import invalidate_all_cache
            await invalidate_all_cache()
            log.info("Commit: Redis cache invalidated successfully (PASS)")
        except Exception as cache_err:
            log.warning("Commit: Cache invalidation failed (non-fatal): %s", cache_err)

    return {
        "status": "PASS" if overall_ok else "FAIL",
        "violations": violations,
        "violation_count": len(violations),
        "exported": export_counts,
        "exported_total": sum(
            export_counts.values()),
        "export_errors": export_errors,
        "assemble": assemble_result,
        "actor": actor,
        "note": "PASS = export written, eva-model.json rebuilt, 0 cross-ref violations",
    }


# ── AUDIT-REPO (eva-veritas proxy) ───────────────────────────────────────────

_EVA_VERITAS_DEFAULT = "http://localhost:8031"
# C:\eva-foundry\eva-foundation
_VERITAS_PORTFOLIO = Path(__file__).parents[3]


@router.post("/audit-repo",
             summary=("Proxy to eva-veritas MCP: verify that declared project progress matches "
                      "real artifacts on disk. Returns trust score, coverage, and gap list. "
                      "Override MCP server URL: env var EVA_VERITAS_MCP_URL (default http://localhost:8031)"),
             )
async def audit_repo(
    body: dict[str, Any],
    actor: str = Depends(require_admin),
) -> dict[str, Any]:
    """
    EO-08-001 — eva-veritas integration.

    Input body: { "project_id": "33-eva-brain-v2" }
    Optional:   { "repo_path": "/absolute/path" }  -- overrides portfolio lookup.

    Resolution order:
      1. body["repo_path"] — explicit absolute path
      2. {portfolio_root}/{project_id} — folder under eva-foundation root
         (portfolio_root = parent of 37-data-model/api/../../../, i.e. eva-foundation)

    Returns the standard veritas audit payload:
      {
        "project_id":   "33-eva-brain-v2",
        "repo_path":    "/absolute/resolved/path",
        "trust_score":  82,
        "coverage":     { "stories_total": N, ... },
        "gaps":         [ { "type": "missing_implementation", "story_id": "...", "title": "..." }, ... ],
        "actions":      [ "review-required", ... ]
      }
    """
    project_id: str = body.get("project_id", "")
    repo_path: str = body.get("repo_path", "")

    if not project_id and not repo_path:
        raise HTTPException(
            status_code=422,
            detail="Body must include 'project_id' (e.g. '33-eva-brain-v2') or 'repo_path'.",
        )

    # Resolve repo_path
    if not repo_path:
        candidate = _VERITAS_PORTFOLIO / project_id
        if not candidate.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Project folder not found: {candidate}. "
                       "Pass 'repo_path' explicitly or check the project_id.",
            )
        repo_path = str(candidate)

    # Call eva-veritas MCP server
    mcp_base = os.environ.get(
        "EVA_VERITAS_MCP_URL",
        _EVA_VERITAS_DEFAULT).rstrip("/")
    url = f"{mcp_base}/tools/audit_repo"
    payload = json.dumps({"repo_path": repo_path}).encode("utf-8")

    try:
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                f"eva-veritas MCP server unreachable at {mcp_base}. "
                f"Start it with: node src/mcp-server.js --port 8031 "
                f"(from C:\\eva-foundry\\eva-foundation\\48-eva-veritas). "
                f"Error: {exc.reason if hasattr(exc, 'reason') else exc}"
            ),
        ) from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"eva-veritas MCP returned non-JSON response: {exc}",
        ) from exc

    result = raw.get("result", raw)
    return {
        "project_id": project_id or None,
        "repo_path": repo_path,
        "trust_score": result.get("trust_score"),
        "coverage": result.get("coverage", {}),
        "gaps": result.get("gaps", []),
        "actions": result.get("actions", []),
        "mcp_url": mcp_base,
        "actor": actor,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Layer Registration (Session 45: Phase A — D³PDCA Discovery Layers L122-L129)
# ═══════════════════════════════════════════════════════════════════════════════

class LayerRegistrationRequest(BaseModel):
    """Request model for POST /model/admin/layers — register new layer to data model."""
    
    layer_id: str = Field(
        ...,
        description="Layer ID (e.g., 'L122', 'L123')",
        examples=["L122", "L127"],
    )
    layer_name: str = Field(
        ...,
        description="Layer name in snake_case (e.g., 'discovery_contexts')",
        examples=["discovery_contexts", "missions", "discovery_sensors"],
    )
    domain_id: str = Field(
        default="D13",
        description="Domain ID (e.g., 'D13' for Discovery & Sense-Making)",
        examples=["D13", "D06"],
    )
    domain_name: str = Field(
        default="Discovery & Sense-Making",
        description="Human-readable domain name",
        examples=["Discovery & Sense-Making", "Observability & Monitoring"],
    )
    schema: dict[str, Any] = Field(
        ...,
        description="Layer schema definition (fields, types, relationships)",
    )
    relationships: dict[str, Any] = Field(
        default_factory=dict,
        description="FK relationships: parent layers, child layers, edge types",
    )
    description: str = Field(
        default="",
        description="Layer purpose and usage",
    )
    purpose: str = Field(
        default="",
        description="Strategic purpose in the EVA data model",
    )
    notes: str = Field(
        default="",
        description="Implementation notes, constraints, or antitransactions",
    )
    immutable: bool = Field(
        default=False,
        description="True for append-only layers (like evidence L31, assumption_validations L126)",
    )


class LayerRegistrationResponse(BaseModel):
    """Response model for POST /model/admin/layers — confirmation of registration."""
    
    status: str = Field(default="created", description="Registration status")
    layer_id: str = Field(description="Layer ID registered")
    layer_name: str = Field(description="Layer name registered")
    file_path: str = Field(description="Path to JSON file created: model/{layer_name}.json")
    objects_seeded: int = Field(description="Number of objects seeded from JSON")
    timestamp: str = Field(description="ISO 8601 timestamp of registration")
    actor: str = Field(description="User/agent who performed registration")
    details: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata (schema_valid, fk_valid, etc.)"
    )


@router.post(
    "/layers",
    summary="Register new layer definition to data model (Layer Registration API)",
    response_model=LayerRegistrationResponse,
    status_code=201,
)
async def register_layer(
    layer_req: LayerRegistrationRequest = Body(..., description="Layer registration request"),
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
    actor: str = Depends(require_admin),
) -> LayerRegistrationResponse:
    """
    POST /model/admin/layers
    
    Register a new layer definition to the data model (REST-compliant layer registration).
    
    Idempotent: safe to re-run (overwrites existing layer file + re-seeds).
    
    Protocol:
    1. Validate: layer_id unique or update, schema well-formed
    2. Create: {layer_name}.json in /model/ directory with schema
    3. Format: Layer schema as JSON with objects array (may be empty or populated)
    4. Seed: Call internal seed logic to load to Cosmos DB
    5. Verify: Query back via GET /model/{layer} to confirm registration
    6. Return: 201 Created with metadata
    
    Example:
    ```json
    {
      "layer_id": "L122",
      "layer_name": "discovery_contexts",
      "domain_id": "D13",
      "domain_name": "Discovery & Sense-Making",
      "schema": {
        "id": {"type": "string"},
        "mission_id": {"type": "string"},
        "stakeholders": {"type": "array"},
        ...
      },
      "relationships": {
        "parent": "L127",
        "child": ["L123", "L124"],
        "edges": ["discover_assumption", "discover_risk"]
      },
      "description": "Stakeholder maps, system boundaries, constraints for discovery",
      "purpose": "Foundation for assumption tracking and mission grounding",
      "immutable": false
    }
    ```
    
    Returns: 201 Created
    ```json
    {
      "status": "created",
      "layer_id": "L122",
      "layer_name": "discovery_contexts",
      "file_path": "model/discovery_contexts.json",
      "objects_seeded": 0,
      "timestamp": "2026-03-13T16:45:32.123Z",
      "actor": "admin@eva-foundry",
      "details": {
        "schema_valid": true,
        "fk_valid": true,
        "file_created": true,
        "seeded_to_cosmos": true
      }
    }
    ```
    """
    import datetime
    
    start_time = time.time()
    details: dict[str, Any] = {}
    
    try:
        # ── Step 1: Validate request ──
        if not layer_req.layer_id or not layer_req.layer_name:
            raise HTTPException(
                status_code=400,
                detail="layer_id and layer_name are required",
            )
        
        # Normalize layer_id format (L### or L##)
        if not layer_req.layer_id.startswith("L"):
            raise HTTPException(
                status_code=400,
                detail=f"layer_id must start with 'L' (e.g., L122, not {layer_req.layer_id})",
            )
        
        # Normalize layer_name (snake_case)
        if not layer_req.layer_name.islower() or not all(
            c.isalnum() or c == "_" for c in layer_req.layer_name
        ):
            raise HTTPException(
                status_code=400,
                detail=f"layer_name must be lowercase with underscores (e.g., discovery_contexts, not {layer_req.layer_name})",
            )
        
        # Validate schema is dict
        if not isinstance(layer_req.schema, dict):
            raise HTTPException(
                status_code=400,
                detail="schema must be a dict",
            )
        
        details["schema_valid"] = True
        
        # ── Step 2: Create JSON file in /model/ directory ──
        model_dir = _get_model_dir()
        file_path = model_dir / f"{layer_req.layer_name}.json"
        
        # Prepare layer definition (empty objects array, schema-only)
        layer_def = {
            "layer_id": layer_req.layer_id,
            "layer_name": layer_req.layer_name,
            "domain_id": layer_req.domain_id,
            "domain_name": layer_req.domain_name,
            "description": layer_req.description,
            "purpose": layer_req.purpose,
            "immutable": layer_req.immutable,
            "created_at": datetime.datetime.utcnow().isoformat() + "Z",
            "created_by": actor,
            "schema": layer_req.schema,
            "relationships": layer_req.relationships,
            "notes": layer_req.notes,
            "objects": [],  # Empty — objects added via PUT /model/{layer}/{id}
        }
        
        # Write JSON file (idempotent)
        file_path.write_text(
            json.dumps(layer_def, indent=2),
            encoding="utf-8"
        )
        details["file_created"] = True
        details["file_path"] = str(file_path)
        
        # ── Step 3: Seed to Cosmos DB ──
        try:
            # Re-read to get proper structure for extraction
            raw = json.loads(file_path.read_text(encoding="utf-8"))
            objects = _extract_objects_from_json(raw, layer_req.layer_name, f"{layer_req.layer_name}.json")
            
            if not isinstance(objects, list):
                objects = []
            objects = [o for o in objects if isinstance(o, dict)]
            objects = _normalize_object_ids(objects, layer_req.layer_name)
            objects = [o for o in objects if o.get("id")]
            
            # Stamp source_file
            for obj in objects:
                obj.setdefault("source_file", f"model/{layer_req.layer_name}.json")
            
            # Bulk load to store
            seeded_count = await store.bulk_load(
                layer_req.layer_name,
                objects,
                actor,
            )
            details["seeded_to_cosmos"] = True
            details["objects_seeded"] = seeded_count
            
            # Invalidate cache for this layer
            await cache.invalidate_layer(layer_req.layer_name)
            
        except Exception as exc:
            details["seeded_to_cosmos"] = False
            details["seed_error"] = str(exc)
            log.error(
                "Layer registration seed failed for %s: %s",
                layer_req.layer_name,
                exc,
                exc_info=True,
            )
            raise HTTPException(
                status_code=500,
                detail=f"Seed to Cosmos failed: {exc}",
            ) from exc
        
        # ── Step 4: Verify queryable ──
        try:
            # Simple query to verify layer exists
            summary = await store.query({
                "layer": layer_req.layer_name,
                "limit": 1,
            })
            details["queryable"] = True
            details["query_summary"] = summary
        except Exception as exc:
            details["queryable"] = False
            details["query_error"] = str(exc)
            log.warning(
                "Could not verify queryable layer %s: %s",
                layer_req.layer_name,
                exc,
            )
        
        # ── Step 5: Return success ──
        elapsed = time.time() - start_time
        details["elapsed_seconds"] = round(elapsed, 2)
        
        return LayerRegistrationResponse(
            status="created",
            layer_id=layer_req.layer_id,
            layer_name=layer_req.layer_name,
            file_path=str(file_path),
            objects_seeded=details.get("objects_seeded", 0),
            timestamp=datetime.datetime.utcnow().isoformat() + "Z",
            actor=actor,
            details=details,
        )
    
    except HTTPException:
        raise
    except Exception as exc:
        log.error(
            "Layer registration failed for %s: %s",
            layer_req.layer_name,
            exc,
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Layer registration failed: {exc}",
        ) from exc
