"""
Admin router — privileged operations.

POST /model/admin/seed           Seed Cosmos from disk JSON layer files (idempotent)
POST /model/admin/export         Export store back to disk JSON layer files (completes write cycle)
POST /model/admin/cache/flush    Flush all cache entries
GET  /model/admin/audit          Last N writes across all layers (audit trail)
GET  /model/admin/validate       In-process cross-reference integrity check
POST /model/admin/commit         export + assemble + validate in one API call (agent shortcut)
POST /model/admin/audit-repo     Proxy to eva-veritas MCP: verify declared progress matches artifacts

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
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import subprocess
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from api.store.base import AbstractStore
from api.cache.base import AbstractCache
from api.dependencies import get_store, get_cache, require_admin

log = logging.getLogger(__name__)

router = APIRouter(prefix="/model/admin", tags=["model-admin"])

# Ordered — matches assemble-model.ps1 layer order
_LAYER_FILES: dict[str, str] = {
    "services":       "services.json",
    "personas":       "personas.json",
    "feature_flags":  "feature_flags.json",
    "containers":     "containers.json",
    "endpoints":      "endpoints.json",
    "schemas":        "schemas.json",
    "screens":        "screens.json",
    "literals":       "literals.json",
    "agents":         "agents.json",
    "infrastructure": "infrastructure.json",
    "requirements":   "requirements.json",
    # control-plane catalog
    "planes":         "planes.json",
    "connections":    "connections.json",
    "environments":   "environments.json",
    "cp_skills":      "cp_skills.json",
    "cp_agents":      "cp_agents.json",
    "runbooks":       "runbooks.json",
    "cp_workflows":   "cp_workflows.json",
    "cp_policies":    "cp_policies.json",
    # catalog extensions (precedence fields + new layers)
    "mcp_servers":     "mcp_servers.json",
    "prompts":         "prompts.json",
    "security_controls": "security_controls.json",
    # frontend object layers (E-01/E-02/E-03)
    "components":      "components.json",
    "hooks":           "hooks.json",
    "ts_types":        "ts_types.json",
    # project plane (E-07/E-08) — waterfall WBS + agile scrum + CI/CD linkage
    "projects":        "projects.json",
    "wbs":             "wbs.json",
    "sprints":         "sprints.json",
    "milestones":      "milestones.json",
    "risks":           "risks.json",
    "decisions":       "decisions.json",
    "traces":          "traces.json",
    # observability plane (L11) — proof-of-completion + call tracing
    "evidence":        "evidence.json",
    # governance plane (L32-L35) — data-model-first architecture + agent automation safety
    "workspace_config": "workspace_config.json",
    "project_work":     "project_work.json",
    "agent_policies":   "agent_policies.json",
    "quality_gates":    "quality_gates.json",
    "github_rules":     "github_rules.json",
}

def _get_model_dir() -> Path:
    """Return the model data directory, honouring MODEL_DIR env override."""
    from api.config import get_settings
    override = get_settings().model_dir_override
    if override:
        return Path(override)
    return Path(__file__).parents[2] / "model"


# ── SEED ──────────────────────────────────────────────────────────────────────

@router.post(
    "/seed",
    summary="Seed store from disk JSON layer files (idempotent — safe to re-run)",
)
async def seed(
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
    actor: str           = Depends(require_admin),
) -> dict[str, Any]:
    """
    Reads each model/&lt;layer&gt;.json file and upserts every object into the store.
    Preserves existing created_by / created_at on objects that already exist.
    Increments row_version on existing objects.
    Idempotent: safe to call on first run, re-runs, and migrations.
    """
    counts: dict[str, int] = {}
    errors: list[str] = []

    for layer, filename in _LAYER_FILES.items():
        path = _get_model_dir() / filename
        if not path.exists():
            log.warning("Seed: %s not found, skipping", path)
            continue

        raw = json.loads(path.read_text(encoding="utf-8"))
        # Layer files have structure: {"$schema": ..., "layer_key": [...]}
        objects: list[dict] = raw.get(layer, [])
        if not objects:
            # Some files use alternate plural keys
            for v in raw.values():
                if isinstance(v, list):
                    objects = v
                    break

        # Normalise: ensure every object has an 'id' field
        for obj in objects:
            if "id" not in obj and "key" in obj:
                obj["id"] = obj["key"]

        objects = [o for o in objects if o.get("id")]
        # Stamp source_file on every object so the field is persisted on export
        # and carried forward into every subsequent cold-deploy seed cycle.
        for obj in objects:
            obj.setdefault("source_file", f"model/{filename}")
        try:
            # bulk_load preserves audit fields from JSON; only fills defaults for gaps
            loaded = await store.bulk_load(layer, objects, actor)
        except Exception as exc:
            errors.append(f"{layer}: bulk_load failed — {exc}")
            loaded = 0

        await cache.invalidate_layer(layer)
        counts[layer] = loaded
        log.info("Seed: %s — %d objects", layer, loaded)

    return {
        "seeded":  counts,
        "total":   sum(counts.values()),
        "errors":  errors,
        "actor":   actor,
    }


# ── EXPORT ────────────────────────────────────────────────────────────────────

@router.post(
    "/export",
    summary="Export store back to disk JSON layer files (completes the write cycle)",
)
async def export_to_disk(
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
    actor: str           = Depends(require_admin),
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
    _STRIP = {"obj_id", "layer", "_rid", "_self", "_etag", "_attachments", "_ts"}

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
            log.info("Export: %s — %d objects written to %s", layer, len(clean), path)
        except Exception as exc:
            errors.append(f"{layer}: write failed — {exc}")

    return {
        "exported": counts,
        "total":    sum(counts.values()),
        "errors":   errors,
        "actor":    actor,
        "note":     "Run assemble-model.ps1 to rebuild eva-model.json after export",
    }


# ── CACHE FLUSH ───────────────────────────────────────────────────────────────

@router.post(
    "/cache/flush",
    summary="Flush the entire cache (all layers)",
)
async def flush_cache(
    cache: AbstractCache = Depends(get_cache),
    actor: str           = Depends(require_admin),
) -> dict[str, Any]:
    await cache.flush_all()
    return {"flushed": True, "actor": actor}


# ── BACKFILL ──────────────────────────────────────────────────────────────────

# Fields that every live object should carry.  We also try to derive source_file
# from whichever existing field the layer uses to point at the real-world artifact.
_AUDIT_FIELDS   = {"created_by", "created_at", "modified_by", "modified_at",
                   "row_version", "is_active"}

# Per-layer hint: which existing field contains the repo path for the object?
_SOURCE_FILE_HINT: dict[str, str] = {
    "endpoints":        "implemented_in",
    "screens":          "component_path",
    "services":         "repo_path",
    "components":       "file_path",
    "hooks":            "file_path",
    "ts_types":         "file_path",
    "runbooks":         "workflow_file",
    "cp_workflows":     "workflow_file",
    "agents":           "file_path",
    "cp_agents":        "file_path",
}


@router.post(
    "/backfill",
    summary=(
        "One-shot: stamp missing audit fields on all legacy objects. "
        "Derives source_file from layer-specific path fields where possible. "
        "Idempotent — safe to re-run; only touches objects that are still missing fields."
    ),
)
async def backfill_metadata(
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
    actor: str           = Depends(require_admin),
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
    errors:  list[str]      = []

    for layer in _LAYER_FILES:
        try:
            objects = await store.get_all(layer, active_only=False)
        except Exception as exc:
            errors.append(f"{layer}: get_all failed — {exc}")
            continue

        layer_touched = 0
        layer_skipped = 0
        hint_field    = _SOURCE_FILE_HINT.get(layer)

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
            patch.pop("obj_id",  None)
            patch.pop("layer",   None)
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
        "errors":  errors,
        "actor":   actor,
        "note":    "Run POST /model/admin/export then assemble-model.ps1 to persist changes",
    }


# ── AUDIT LOG ─────────────────────────────────────────────────────────────────

@router.get(
    "/audit",
    summary="Last N write events across all layers — audit trail",
)
async def audit_log(
    limit: int           = Query(50, ge=1, le=500, description="Number of events to return"),
    store: AbstractStore = Depends(get_store),
    actor: str           = Depends(require_admin),
) -> list[dict[str, Any]]:
    return await store.get_audit(limit=limit)


# ── VALIDATE ──────────────────────────────────────────────────────────────────

@router.get(
    "/validate",
    summary="Run cross-reference integrity check in-process — equivalent to validate-model.ps1",
)
async def validate(
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
    settings             = Depends(lambda: None),   # unused but future-proof
    actor: str           = Depends(require_admin),
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
    """
    violations: list[str] = []

    def _ids(layer_data: list[dict]) -> set[str]:
        return {str(d.get("id") or d.get("obj_id") or "") for d in layer_data if d}

    layers: dict[str, list[dict]] = {}
    for lname in _LAYER_FILES:
        layers[lname] = await store.get_all(lname, active_only=False)

    container_ids   = _ids(layers["containers"])
    feature_flag_ids = _ids(layers["feature_flags"])
    persona_ids     = _ids(layers["personas"])
    endpoint_ids    = _ids(layers["endpoints"])
    screen_ids      = _ids(layers["screens"])

    # 1 & 2 & 3 — endpoints
    for ep in layers["endpoints"]:
        eid = ep.get("id") or ep.get("obj_id")
        for c in ep.get("cosmos_reads", []) or []:
            if c and c not in container_ids:
                violations.append(f"endpoint '{eid}' cosmos_reads references unknown container '{c}'")
        for c in ep.get("cosmos_writes", []) or []:
            if c and c not in container_ids:
                violations.append(f"endpoint '{eid}' cosmos_writes references unknown container '{c}'")
        ff = ep.get("feature_flag")
        if ff and ff not in feature_flag_ids:
            violations.append(f"endpoint '{eid}' feature_flag '{ff}' not in feature_flags")
        for p in ep.get("auth", []) or []:
            if p and p not in persona_ids:
                violations.append(f"endpoint '{eid}' auth references unknown persona '{p}'")

    # 4 — screens
    for sc in layers["screens"]:
        sid = sc.get("id") or sc.get("obj_id")
        for call in sc.get("api_calls", []) or []:
            if call and call not in endpoint_ids:
                violations.append(f"screen '{sid}' api_calls references unknown endpoint '{call}'")

    # 5 — literals
    for lit in layers["literals"]:
        lid = lit.get("id") or lit.get("obj_id")
        for s in lit.get("screens", []) or []:
            if s and s not in screen_ids:
                violations.append(f"literal '{lid}' screens references unknown screen '{s}'")

    # 6 — requirements
    all_obj_ids = endpoint_ids | screen_ids
    for req in layers["requirements"]:
        rid = req.get("id") or req.get("obj_id")
        for s in req.get("satisfied_by", []) or []:
            if s and s not in all_obj_ids:
                violations.append(f"requirement '{rid}' satisfied_by references unknown object '{s}'")

    # 7 — agents
    for ag in layers["agents"]:
        aid = ag.get("id") or ag.get("obj_id")
        for s in ag.get("output_screens", []) or []:
            if s and s not in screen_ids:
                violations.append(f"agent '{aid}' output_screens references unknown screen '{s}'")

    return {
        "violations": violations,
        "count":      len(violations),
        "status":     "PASS" if not violations else "FAIL",
    }


# ── COMMIT (export + assemble + validate in one call) ─────────────────────────

_SCRIPTS_DIR = Path(__file__).parents[2] / "scripts"


async def _run_ps1(script_name: str) -> dict[str, Any]:
    """Run a PowerShell script and return stdout/stderr + exit code."""
    script = _SCRIPTS_DIR / script_name
    if not script.exists():
        return {"ok": False, "rc": -1, "stdout": "", "stderr": f"Script not found: {script}"}
    try:
        proc = await asyncio.create_subprocess_exec(
            "pwsh", "-NonInteractive", "-NoProfile", "-File", str(script),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
        rc = proc.returncode
        return {
            "ok":     rc == 0,
            "rc":     rc,
            "stdout": stdout.decode("utf-8", errors="replace").strip(),
            "stderr": stderr.decode("utf-8", errors="replace").strip(),
        }
    except asyncio.TimeoutError:
        return {"ok": False, "rc": -1, "stdout": "", "stderr": "Timeout after 120s"}
    except Exception as exc:
        return {"ok": False, "rc": -1, "stdout": "", "stderr": str(exc)}


@router.post(
    "/commit",
    summary=(
        "One-call write cycle shortcut: export to disk + assemble eva-model.json + validate. "
        "Returns {status, violations, counts, exported, assemble, validate}. "
        "Replaces steps 3-5 of the manual write cycle."
    ),
)
async def commit(
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
    actor: str           = Depends(require_admin),
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
    _STRIP = {"obj_id", "layer", "_rid", "_self", "_etag", "_attachments", "_ts"}

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

    log.info("Commit: export complete — %d total objects", sum(export_counts.values()))

    # ── Step 4: assemble ──────────────────────────────────────────────────
    assemble_result = await _run_ps1("assemble-model.ps1")
    log.info("Commit: assemble rc=%d", assemble_result["rc"])

    # ── Step 5: validate ──────────────────────────────────────────────────
    violations: list[str] = []

    def _ids(layer_data: list[dict]) -> set[str]:
        return {str(d.get("id") or d.get("obj_id") or "") for d in layer_data if d}

    layers_data: dict[str, list[dict]] = {}
    for lname in _LAYER_FILES:
        layers_data[lname] = await store.get_all(lname, active_only=False)

    container_ids    = _ids(layers_data["containers"])
    feature_flag_ids = _ids(layers_data["feature_flags"])
    persona_ids      = _ids(layers_data["personas"])
    endpoint_ids     = _ids(layers_data["endpoints"])
    screen_ids       = _ids(layers_data["screens"])

    for ep in layers_data["endpoints"]:
        eid = ep.get("id") or ep.get("obj_id")
        for c in ep.get("cosmos_reads", []) or []:
            if c and c not in container_ids:
                violations.append(f"endpoint '{eid}' cosmos_reads references unknown container '{c}'")
        for c in ep.get("cosmos_writes", []) or []:
            if c and c not in container_ids:
                violations.append(f"endpoint '{eid}' cosmos_writes references unknown container '{c}'")
        ff = ep.get("feature_flag")
        if ff and ff not in feature_flag_ids:
            violations.append(f"endpoint '{eid}' feature_flag '{ff}' not in feature_flags")
        for p in ep.get("auth", []) or []:
            if p and p not in persona_ids:
                violations.append(f"endpoint '{eid}' auth references unknown persona '{p}'")

    for sc in layers_data["screens"]:
        sid = sc.get("id") or sc.get("obj_id")
        for call in sc.get("api_calls", []) or []:
            if call and call not in endpoint_ids:
                violations.append(f"screen '{sid}' api_calls references unknown endpoint '{call}'")

    for lit in layers_data["literals"]:
        lid = lit.get("id") or lit.get("obj_id")
        for s in lit.get("screens", []) or []:
            if s and s not in screen_ids:
                violations.append(f"literal '{lid}' screens references unknown screen '{s}'")

    all_obj_ids = endpoint_ids | screen_ids
    for req in layers_data["requirements"]:
        rid = req.get("id") or req.get("obj_id")
        for s in req.get("satisfied_by", []) or []:
            if s and s not in all_obj_ids:
                violations.append(f"requirement '{rid}' satisfied_by references unknown object '{s}'")

    for ag in layers_data["agents"]:
        aid = ag.get("id") or ag.get("obj_id")
        for s in ag.get("output_screens", []) or []:
            if s and s not in screen_ids:
                violations.append(f"agent '{aid}' output_screens references unknown screen '{s}'")

    overall_ok = not violations and assemble_result["ok"] and not export_errors

    return {
        "status":          "PASS" if overall_ok else "FAIL",
        "violations":      violations,
        "violation_count": len(violations),
        "exported":        export_counts,
        "exported_total":  sum(export_counts.values()),
        "export_errors":   export_errors,
        "assemble":        assemble_result,
        "actor":           actor,
        "note":            "PASS = export written, eva-model.json rebuilt, 0 cross-ref violations",
    }


# ── AUDIT-REPO (eva-veritas proxy) ───────────────────────────────────────────

_EVA_VERITAS_DEFAULT = "http://localhost:8031"
_VERITAS_PORTFOLIO   = Path(__file__).parents[3]          # C:\AICOE\eva-foundation


@router.post(
    "/audit-repo",
    summary=(
        "Proxy to eva-veritas MCP: verify that declared project progress matches "
        "real artifacts on disk. Returns trust score, coverage, and gap list. "
        "Override MCP server URL: env var EVA_VERITAS_MCP_URL (default http://localhost:8031)"
    ),
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
    repo_path:  str = body.get("repo_path", "")

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
    mcp_base = os.environ.get("EVA_VERITAS_MCP_URL", _EVA_VERITAS_DEFAULT).rstrip("/")
    url      = f"{mcp_base}/tools/audit_repo"
    payload  = json.dumps({"repo_path": repo_path}).encode("utf-8")

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
                f"(from C:\\AICOE\\eva-foundation\\48-eva-veritas). "
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
        "project_id":  project_id or None,
        "repo_path":   repo_path,
        "trust_score": result.get("trust_score"),
        "coverage":    result.get("coverage", {}),
        "gaps":        result.get("gaps", []),
        "actions":     result.get("actions", []),
        "mcp_url":     mcp_base,
        "actor":       actor,
    }
