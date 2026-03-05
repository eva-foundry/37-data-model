# EVA-FEATURE: F37-01
# EVA-STORY: F37-01-001
# EVA-STORY: F37-01-002
# EVA-STORY: F37-01-003
# EVA-STORY: F37-API-001
# EVA-STORY: F37-API-002
# EVA-STORY: F37-API-003
# EVA-STORY: F37-AUDIT-001
# EVA-STORY: F37-AUDITREPO-001
# EVA-STORY: F37-BACKFILL-001
# EVA-STORY: F37-CACHE-001
# EVA-STORY: F37-COMMIT-001
# EVA-STORY: F37-EDGETYPES-001
# EVA-STORY: F37-EXPORT-001
# EVA-STORY: F37-FILTER-001
# EVA-STORY: F37-HEALTH-001
# EVA-STORY: F37-HEALTH-002
# EVA-STORY: F37-HEALTH-003
# EVA-STORY: F37-MODEL-001
# EVA-STORY: F37-MODEL-002
# EVA-STORY: F37-OBJ_IDPATH-001
# EVA-STORY: F37-OBJ_IDPATH-002
# EVA-STORY: F37-OBJ_IDPATH-003
# EVA-STORY: F37-READY-001
# EVA-STORY: F37-SEED-001
# EVA-STORY: F37-VALIDATE-001
"""
EVA Model API — FastAPI application entry point.

Mode selection (automatic, based on environment variables):
  Store:  COSMOS_URL + COSMOS_KEY set  →  CosmosStore   (production)
          otherwise                    →  MemoryStore   (local dev / tests)
  Cache:  REDIS_URL set                →  RedisCache    (production)
          otherwise                    →  MemoryCache   (local dev / tests)

On first run with Cosmos, call POST /model/admin/seed to load the disk
JSON layer files into Cosmos.  Subsequent restarts read from Cosmos directly.
"""
from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import get_settings

log = logging.getLogger(__name__)

# ── global uptime + call counter ──────────────────────────────────────────────
_started_at: float = time.time()
_request_count: int = 0


# ── lifespan — wires store + cache ────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    # ── PROD-WI-6: Reject insecure admin token in production ──────────────
    if not settings.dev_mode and settings.admin_token == "dev-admin":
        raise RuntimeError(
            "SECURITY: ADMIN_TOKEN is still 'dev-admin' but DEV_MODE=false. "
            "Set a strong ADMIN_TOKEN in your environment before starting in production."
        )
    if not settings.dev_mode:
        log.info("Production mode — admin token validation enforced")
    else:
        log.warning(
            "Dev mode — admin token is '%s'. Set DEV_MODE=false + strong ADMIN_TOKEN before deploying.",
            settings.admin_token,
        )

    # ── Store ──────────────────────────────────────────────────────────────
    if settings.use_cosmos:
        from api.store.cosmos import CosmosStore
        store = CosmosStore(
            url=settings.cosmos_url,
            key=settings.cosmos_key,
            db_name=settings.model_db_name,
            container_name=settings.model_container_name,
        )
        # PROD-4: wrap Cosmos init so a bad URL fails fast with a clear message
        # instead of silently killing the process with an unhandled exception.
        try:
            await store.init()
            log.info("Store: CosmosDB — %s / %s", settings.model_db_name, settings.model_container_name)
        except Exception as exc:
            log.error(
                "STARTUP FAILED: CosmosStore.init() raised %s: %s",
                type(exc).__name__, exc,
            )
            log.error(
                "Check COSMOS_URL and COSMOS_KEY in your .env. "
                "Falling back to MemoryStore — writes will be lost on restart."
            )
            from api.store.memory import MemoryStore as _FallbackMS
            store = _FallbackMS()
    else:
        from api.store.memory import MemoryStore
        store = MemoryStore()
        log.info("Store: MemoryStore (in-process, ephemeral — set COSMOS_URL to persist)")

    # ── Cache ──────────────────────────────────────────────────────────────
    if settings.use_redis:
        from api.cache.redis_cache import RedisCache
        cache = RedisCache(redis_url=settings.redis_url, ttl=settings.cache_ttl_seconds)
        await cache.init()
        log.info("Cache: Redis — %s  TTL=%ds", settings.redis_url, settings.cache_ttl_seconds)
    else:
        from api.cache.memory import MemoryCache
        cache = MemoryCache()
        log.info("Cache: MemoryCache (in-process)  TTL=%ds", settings.cache_ttl_seconds)

    app.state.store = store
    app.state.cache = cache

    # ── Auto-seed ──────────────────────────────────────────────────────────
    # In-memory mode: always seed from disk so the API is immediately useful.
    # Uses bulk_load (not upsert) so that audit fields already present in the
    # JSON (from a previous export) are preserved exactly.  Fields absent from
    # hand-written JSON get sensible defaults.  source_file is stamped on every
    # object so every record permanently knows which layer file it came from.
    from api.store.memory import MemoryStore as _MS
    if isinstance(store, _MS):
        from api.routers.admin import _LAYER_FILES, _get_model_dir
        import json
        total = 0
        for layer, filename in _LAYER_FILES.items():
            path = _get_model_dir() / filename
            if not path.exists():
                continue
            raw = json.loads(path.read_text(encoding="utf-8-sig"))
            # Handle both formats: direct array (from export) or dict with layer key (from disk)
            if isinstance(raw, list):
                objects = raw
            else:
                objects = raw.get(layer, [])
                if not objects:
                    for v in raw.values():
                        if isinstance(v, list):
                            objects = v
                            break
            # normalise id + stamp source_file
            for obj in objects:
                if "id" not in obj and "key" in obj:
                    obj["id"] = obj["key"]
                obj.setdefault("source_file", f"model/{filename}")
            objects = [o for o in objects if o.get("id")]
            loaded = await store.bulk_load(layer, objects, "system:autoload")
            total += loaded
        log.info("Auto-seeded %d objects from disk JSON files", total)

    yield

    # ── PROD-WI-7: Export-before-shutdown (MemoryStore + production mode only) ──
    # When the container receives SIGTERM, drain in-memory writes to disk so the
    # next cold-start auto-seed picks up all changes made since the last manual export.
    # Cosmos store: persistence is inherent — no export needed.
    # Dev mode (dev_mode=True): skip export to avoid polluting model/*.json during
    # local development and test runs (TestClient teardown triggers lifespan cleanup).
    from api.store.memory import MemoryStore as _MSShutdown
    if isinstance(store, _MSShutdown) and not settings.dev_mode:
        log.info("Shutdown: exporting MemoryStore to disk JSON layer files...")
        try:
            import json as _json
            from api.routers.admin import _LAYER_FILES, _get_model_dir
            _STRIP = {"obj_id", "layer", "_rid", "_self", "_etag", "_attachments", "_ts"}
            _total = 0
            for _layer, _filename in _LAYER_FILES.items():
                _path = _get_model_dir() / _filename
                try:
                    _objects = await store.get_all(_layer, active_only=False)
                except Exception:
                    continue
                _schema_url = ""
                if _path.exists():
                    try:
                        _existing = _json.loads(_path.read_text(encoding="utf-8-sig"))
                        _schema_url = _existing.get("$schema", "")
                    except Exception:
                        pass
                _clean = [{k: v for k, v in doc.items() if k not in _STRIP} for doc in _objects]
                _file_content: dict = {}
                if _schema_url:
                    _file_content["$schema"] = _schema_url
                _file_content[_layer] = _clean
                try:
                    _path.write_text(
                        _json.dumps(_file_content, indent=2, ensure_ascii=False) + "\n",
                        encoding="utf-8",
                    )
                    _total += len(_clean)
                except Exception as _we:
                    log.warning("Shutdown export: failed to write %s — %s", _filename, _we)
            log.info("Shutdown export complete: %d objects written to %d layer files", _total, len(_LAYER_FILES))
        except Exception as _exc:
            log.error("Shutdown export failed: %s", _exc)
    # Cosmos / Redis clients close themselves via GC


# ── app ───────────────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
        description=(
            "Machine-queryable HTTP interface to the EVA semantic object model. "
            "Every layer. Every object. Audit trail on every write.\n\n"
            "**Mode**: `COSMOS_URL` set → Cosmos DB.  Unset → in-memory (ephemeral).\n\n"
            "**Admin token**: `Authorization: Bearer <ADMIN_TOKEN>` for /model/admin/* routes."
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── request counter middleware ─────────────────────────────────────────
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.requests import Request

    class CounterMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next):
            global _request_count
            _request_count += 1
            return await call_next(request)

    app.add_middleware(CounterMiddleware)

    # register routers ──────────────────────────────────────────────────
    from api.routers.layers import (
        services_router, personas_router, feature_flags_router,
        containers_router, schemas_router, screens_router,
        literals_router, agents_router, infra_router, requirements_router,
        # control-plane catalog
        planes_router, connections_router, environments_router,
        cp_skills_router, cp_agents_router, runbooks_router,
        cp_workflows_router, cp_policies_router,
        # catalog extensions
        mc_servers_router, prompts_router, sec_controls_router,
        # frontend object layers
        components_router, hooks_router, ts_types_router,
        # project plane (E-07/E-08)
        projects_router, wbs_router,
        sprints_router, milestones_router, risks_router, decisions_router,
        traces_router,
        # observability plane (L11)
        evidence_router,
        # governance plane (L32-L35) — agent automation safety
        workspace_config_router, project_work_router,
        agent_policies_router, quality_gates_router, github_rules_router,
    )
    from api.routers.fp import router as fp_router  # noqa: E402
    from api.routers.filter_endpoints import router as endpoints_router
    from api.routers.impact import router as impact_router
    from api.routers.graph import router as graph_router
    from api.routers.admin import router as admin_router
    from api.routers.introspection import router as introspection_router  # Session 26: schema introspection
    from api.routers.aggregation import router as aggregation_router  # Session 26: metrics & analytics

    for r in [
        # introspection & aggregation (Session 26) — register FIRST for path precedence
        introspection_router,
        aggregation_router,
        # layer routers (generic /{obj_id} path)
        services_router, personas_router, feature_flags_router,
        containers_router, endpoints_router, schemas_router,
        screens_router, literals_router, agents_router,
        infra_router, requirements_router,
        # control-plane catalog
        planes_router, connections_router, environments_router,
        cp_skills_router, cp_agents_router, runbooks_router,
        cp_workflows_router, cp_policies_router,
        # catalog extensions
        mc_servers_router, prompts_router, sec_controls_router,
        # frontend object layers
        components_router, hooks_router, ts_types_router,
        # project plane
        projects_router, wbs_router,
        sprints_router, milestones_router, risks_router, decisions_router,
        traces_router,
        # observability plane (L11)
        evidence_router,
        # governance plane (L32-L35) — agent automation safety
        workspace_config_router, project_work_router,
        agent_policies_router, quality_gates_router, github_rules_router,
        fp_router,
        # graph (E-11)
        graph_router,
        impact_router, admin_router,
    ]:
        app.include_router(r)

    @app.get("/health", tags=["health"], summary="Liveness check — process alive + store type")
    async def health() -> dict:
        """
        Liveness probe: is the process up?
        Returns store/cache type, uptime, request count, and a hint to /model/agent-guide.
        Does NOT probe Cosmos — use /ready for that (readiness probe).
        """
        from api.store.memory import MemoryStore as _MS
        from api.store.cosmos import CosmosStore as _CS
        from api.cache.redis_cache import RedisCache as _RC
        import datetime

        store_type = "cosmos" if isinstance(app.state.store, _CS) else "memory"
        cache_type = "redis" if isinstance(app.state.cache, _RC) else "memory"
        uptime = int(time.time() - _started_at)
        started_iso = datetime.datetime.fromtimestamp(
            _started_at, tz=datetime.timezone.utc
        ).isoformat()

        return {
            "status":        "ok",
            "service":       "model-api",
            "version":       settings.api_version,
            "store":         store_type,
            "cache":         cache_type,
            "cache_ttl":     settings.cache_ttl_seconds,
            "started_at":    started_iso,
            "uptime_seconds": uptime,
            "request_count": _request_count,
            "agent_guide":   "/model/agent-guide",
            "readiness":     "/ready",
        }

    @app.get("/ready", tags=["health"], summary="Readiness probe — store connectivity verified")
    async def ready() -> dict:
        """
        Readiness probe: is the store reachable?
        Performs a live Cosmos ping (reads 1 item from any layer).
        Returns 200 + store_reachable=true if healthy, or 503 if Cosmos is unreachable.
        Use this for Kubernetes/Container Apps readiness probes.
        Use /health for liveness probes (cheaper — no Cosmos round-trip).
        """
        from api.store.cosmos import CosmosStore as _CS
        from fastapi.responses import JSONResponse
        import datetime

        store = app.state.store
        store_type = "cosmos" if isinstance(store, _CS) else "memory"

        store_reachable = False
        store_latency_ms: int | None = None
        store_error: str | None = None

        if isinstance(store, _CS):
            # Real Cosmos ping: fetch up to 1 item from any layer
            t0 = time.time()
            try:
                await store.get_all("services", active_only=False)
                store_reachable = True
                store_latency_ms = int((time.time() - t0) * 1000)
            except Exception as exc:
                store_error = str(exc)[:200]
                store_latency_ms = int((time.time() - t0) * 1000)
        else:
            # MemoryStore is always reachable
            store_reachable = True
            store_latency_ms = 0

        uptime = int(time.time() - _started_at)
        started_iso = datetime.datetime.fromtimestamp(
            _started_at, tz=datetime.timezone.utc
        ).isoformat()

        body = {
            "status":            "ready" if store_reachable else "not_ready",
            "service":           "model-api",
            "version":           settings.api_version,
            "store":             store_type,
            "store_reachable":   store_reachable,
            "store_latency_ms":  store_latency_ms,
            "started_at":        started_iso,
            "uptime_seconds":    uptime,
            "request_count":     _request_count,
        }
        if store_error:
            body["store_error"] = store_error

        status_code = 200 if store_reachable else 503
        return JSONResponse(content=body, status_code=status_code)

    @app.get(
        "/model/agent-summary",
        tags=["health"],
        summary="All layer counts in one call — use this instead of querying each layer separately",
    )
    async def agent_summary() -> dict:
        """Returns item count for every layer + total.  No auth required.
        One call replaces 27 separate GET /model/{layer}/ count queries.
        Response includes store type and cache_ttl so agents know the write-safety profile.
        """
        from api.routers.admin import _LAYER_FILES
        from api.store.memory import MemoryStore as _MS
        from api.store.cosmos import CosmosStore as _CS
        store = app.state.store
        store_type = "cosmos" if isinstance(store, _CS) else "memory"
        counts: dict[str, int] = {}
        for layer in _LAYER_FILES:
            try:
                objs = await store.get_all(layer, active_only=False)
                counts[layer] = len(objs)
            except Exception:
                counts[layer] = -1
        return {
            "layers":    counts,
            "total":     sum(v for v in counts.values() if v >= 0),
            "store":     store_type,
            "cache_ttl": settings.cache_ttl_seconds,
            "note":      "cache_ttl=0 means every GET goes to store -- safe for agent write-verify cycles",
        }

    @app.get(
        "/model/agent-guide",
        tags=["health"],
        summary="Agent protocol — read this before using the API",
    )
    async def agent_guide() -> dict:
        """
        Complete operating instructions for any agent that uses this API.
        The JSON model files (model/*.json) are an internal implementation
        detail. Agents MUST NOT read, parse, or reference them directly.
        This endpoint is the only bootstrap an agent needs.
        
        ENHANCED: Session 26 (2026-03-05) — Added discovery_journey, query_capabilities,
        terminal_safety, common_mistakes, examples for agent experience excellence.
        """
        from api.routers.admin import _LAYER_FILES
        layers = list(_LAYER_FILES.keys())
        return {
            "identity": {
                "service":     "EVA Data Model API",
                "description": (
                    "Single source of truth for all declared EVA platform entities. "
                    "27+ layers. Every object has an immutable audit trail. "
                    "Store=Cosmos in production. Store=memory in local dev."
                ),
                "base_url":    "http://localhost:8010",
                "cloud_url":   "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",
                "apim_base":   "https://marco-sandbox-apim.azure-api.net/data-model",
                "apim_header": "Ocp-Apim-Subscription-Key: <EVA_APIM_KEY>",
            },
            "golden_rule": (
                "This HTTP API is the ONLY interface for agents. "
                "The model/*.json files are an internal implementation detail. "
                "Agents must never read, parse, grep, or reference them. "
                "One HTTP call beats ten file reads."
            ),
            "discovery_journey": {
                "description": "5-step progression for agents exploring the data model",
                "steps": [
                    {
                        "step": 1,
                        "title": "Health & Identity",
                        "calls": ["GET /health", "GET /ready", "GET /model/agent-guide"],
                        "what_you_learn": "Store type (cosmos/memory), uptime, API capabilities"
                    },
                    {
                        "step": 2,
                        "title": "Discover Available Layers",
                        "calls": ["GET /model/layers", "GET /model/agent-summary"],
                        "what_you_learn": "34 layers with counts, which have data vs schemas only"
                    },
                    {
                        "step": 3,
                        "title": "Inspect Schema Structure",
                        "calls": [
                            "GET /model/schemas/{layer}",
                            "GET /model/{layer}/fields",
                            "GET /model/{layer}/example"
                        ],
                        "what_you_learn": "Field names, types, required vs optional, real data examples"
                    },
                    {
                        "step": 4,
                        "title": "Query & Filter",
                        "calls": [
                            "GET /model/{layer}/?limit=10",
                            "GET /model/endpoints/?status=active",
                            "GET /model/evidence/?sprint_id=ACA-S11&phase=D3"
                        ],
                        "what_you_learn": "Which layers support query params, how pagination works"
                    },
                    {
                        "step": 5,
                        "title": "Navigate Relationships",
                        "calls": [
                            "GET /model/graph/?node_id=X&depth=2",
                            "GET /model/impact/?container=X"
                        ],
                        "what_you_learn": "How objects reference each other, impact analysis"
                    }
                ],
                "terminal_safe_first_query": (
                    "Try: (Invoke-RestMethod -Uri http://localhost:8010/model/projects/?limit=5).data | Select-Object id,label,maturity | Format-Table"
                )
            },
            "bootstrap_sequence": [
                "1. GET /health    — liveness (store type, uptime, request_count)",
                "2. GET /ready     — readiness (confirms Cosmos is reachable; check store_reachable=true)",
                "3. GET /model/agent-summary     — all 27 layer counts in one call",
                "4. GET /model/{layer}/          — list objects in any layer",
                "5. GET /model/{layer}/{id}      — fetch one object by exact id",
            ],
            "query_capabilities": {
                "description": "What query parameters work where (varies by layer)",
                "universal_params": {
                    "limit": "All layers support ?limit=N (default=100, max=1000)",
                    "offset": "All layers support ?offset=N for pagination",
                    "active_only": "All layers support ?active_only=true (excludes is_active=false)"
                },
                "layer_specific_filters": {
                    "endpoints": ["?status=active|stub|impl|deprecated"],
                    "evidence": ["?sprint_id=X", "?story_id=X", "?phase=D1|D2|P|D3|A"],
                    "all_other_layers": "No query params yet (client-side filtering required)"
                },
                "coming_soon": "Universal query support for all layers (Session 26 Enhancement #3)",
                "workaround_for_now": (
                    "For layers without query params: GET the data, pipe to Where-Object. "
                    "Example: (irm http://localhost:8010/model/projects/).data | Where-Object {$_.maturity -eq 'active'}"
                )
            },
            "terminal_safety": {
                "problem": "Large JSON responses (272 literals, 135 endpoints) scramble PowerShell terminal with Format-Table overflow",
                "always_use_limit": (
                    "Add ?limit=10 to your first query. Example: "
                    "GET /model/endpoints/?limit=10  (not GET /model/endpoints/)"
                ),
                "always_use_select_object": (
                    "Pick 3-5 key fields before Format-Table. Example: "
                    "| Select-Object id,status,auth | Format-Table  (not | Format-Table)"
                ),
                "safe_exploration_pattern": (
                    "1. GET /model/{layer}/count → check object count\n"
                    "2. If count > 50: GET /model/{layer}/?limit=10\n"
                    "3. Pipe to Select-Object id,{2-3 key fields} | Format-Table\n"
                    "4. When ready for full scan: GET /model/{layer}/ → save to $data variable"
                ),
                "example_safe_query": (
                    "$endpoints = (Invoke-RestMethod http://localhost:8010/model/endpoints/?limit=20).data; "
                    "$endpoints | Select-Object id,status,auth | Format-Table"
                ),
                "fast_counts": "Use GET /model/{layer}/count for instant totals (no data transfer)"
            },
            "query_patterns": {
                "all_layer_counts":        "GET /model/agent-summary",
                "object_by_id":            "GET /model/{layer}/{id}",
                "all_objects_in_layer":    "GET /model/{layer}/",
                "filter_endpoints_status": "GET /model/endpoints/filter?status=stub",
                "filter_other_layers":     "GET /model/{layer}/ then filter client-side with Where-Object",
                "what_screen_calls":       "GET /model/screens/{id}  -> .api_calls",
                "auth_or_feature_flag":    "GET /model/endpoints/{id}  -> .auth  .feature_flag",
                "cosmos_container_schema": "GET /model/containers/{id}  -> .fields  .partition_key",
                "navigate_to_source":      ".repo_path + .repo_line  -> code --goto (line ref only, never grep)",
                "impact_analysis":         "GET /model/impact/?container=X",
                "relationship_graph":      "GET /model/graph/?node_id=X&depth=2",
                "services_list":           "GET /model/services/  -> obj_id, status, is_active, notes",
                "schema_introspection":    "GET /model/schemas/{layer} → full JSON schema",
                "example_object":          "GET /model/{layer}/example → first real object",
                "field_discovery":         "GET /model/{layer}/fields → array of field names",
                "fast_count":              "GET /model/{layer}/count → instant count without data"
            },
            "write_cycle": {
                "rule_1_capture_row_version": (
                    "Before any PUT: capture $prev_rv = obj.row_version. "
                    "After PUT: assert new row_version == prev_rv + 1."
                ),
                "rule_2_strip_audit_fields": (
                    "Exclude from PUT body: obj_id, layer, modified_by, modified_at, "
                    "created_by, created_at, row_version, source_file. "
                    "Keep: is_active and all domain fields."
                ),
                "rule_3_json_depth": (
                    "Always use ConvertTo-Json -Depth 10 (not 5). "
                    "-Depth 5 silently truncates request_schema / response_schema objects."
                ),
                "rule_4_no_patch": "PATCH is not supported. Always PUT the full object (422 otherwise).",
                "rule_5_endpoint_id": (
                    "Endpoint id = exact string 'METHOD /path'. "
                    "Never construct it. Copy verbatim from GET /model/endpoints/."
                ),
                "commit_cycle": [
                    "1. PUT /model/{layer}/{id}  -Method PUT -Body $json -Headers @{'X-Actor'='agent:copilot'}",
                    "2. GET /model/{layer}/{id}  -> assert row_version==prev+1, modified_by, field value",
                    "3. POST /model/admin/commit  -Headers @{'Authorization'='Bearer dev-admin'}",
                    "   -> response.status must be 'PASS', response.violation_count must be 0",
                ],
                "validate_only": (
                    "POST /model/admin/validate to check cross-references without committing. "
                    "38+ repo_line WARNs are pre-existing noise, not caused by your work."
                ),
            },
            "actor_header": {
                "write_operations": "Always include: -Headers @{'X-Actor'='agent:copilot'}",
                "admin_operations": "Always include: -Headers @{'Authorization'='Bearer dev-admin'}",
            },
            "common_mistakes": {
                "mistake_1": {
                    "error": "Terminal scrambled after GET /model/endpoints/",
                    "cause": "135 endpoints × Format-Table auto-columns = overflow",
                    "fix": "Always use ?limit=20 and Select-Object: (irm http://...?limit=20).data | Select-Object id,status | ft"
                },
                "mistake_2": {
                    "error": "Query param ignored (e.g., GET /model/projects/?maturity=active returns all)",
                    "cause": "Most layers don't support query params yet (only endpoints/evidence do)",
                    "fix": "Client-side filter: (irm http://...).data | Where-Object {$_.maturity -eq 'active'}"
                },
                "mistake_3": {
                    "error": "PUT returns 422 'PATCH not supported'",
                    "cause": "Sent partial object or used -Method PATCH",
                    "fix": "Always PUT full object with all fields (GET first, modify copy, PUT back)"
                },
                "mistake_4": {
                    "error": "ConvertTo-Json truncates nested objects (request_schema becomes System.Collections.Hashtable)",
                    "cause": "Default -Depth 2 is too shallow for complex objects",
                    "fix": "Always use ConvertTo-Json -Depth 10"
                },
                "mistake_5": {
                    "error": "Commit fails with 'unknown endpoint GET /search-cases'",
                    "cause": "Constructed endpoint id instead of copying from /model/endpoints/",
                    "fix": "GET /model/endpoints/ first, copy exact id (includes METHOD prefix)"
                },
                "mistake_6": {
                    "error": "Row version mismatch after PUT",
                    "cause": "Didn't capture prev row_version before PUT",
                    "fix": "$prev = $obj.row_version; (PUT); $new = (GET).row_version; assert ($new -eq $prev + 1)"
                },
                "mistake_7": {
                    "error": "Can't find schema for 'projects' layer",
                    "cause": "Schema file is singular (project.schema.json) but layer is plural",
                    "fix": "Use introspection: GET /model/schemas/projects (handles plural->singular conversion)"
                },
                "mistake_8": {
                    "error": "gh CLI fails with HTTP 401 despite gh auth login success",
                    "cause": "GITHUB_TOKEN or GH_TOKEN environment variables override keyring credentials",
                    "symptoms": "gh auth status shows both keyring auth (✓) and env token failure (✗), Active account: false",
                    "fix": "Clear env vars: $env:GITHUB_TOKEN = $null; $env:GH_TOKEN = $null; then retry gh command"
                },
                "mistake_9": {
                    "error": "git push origin main fails with 'protected branch hook declined'",
                    "cause": "Main branch has protection rules requiring pull requests",
                    "symptoms": "error: GH006: Protected branch update failed - Changes must be made through a pull request",
                    "fix": "Create feature branch: git checkout -b feat/my-change; git push origin feat/my-change; gh pr create --base main"
                }
            },
            "examples": {
                "before_after_pagination": {
                    "before": "irm http://localhost:8010/model/endpoints/  // scrambles terminal with 135 objects",
                    "after": "(irm 'http://localhost:8010/model/endpoints/?limit=20').data | Select-Object id,status | ft"
                },
                "before_after_filtering": {
                    "before": "irm http://localhost:8010/model/projects/?maturity=active  // returns all (query ignored)",
                    "after": "(irm http://localhost:8010/model/projects/).data | Where-Object {$_.maturity -eq 'active'}"
                },
                "before_after_schema_discovery": {
                    "before": "Read schema\\project.schema.json file // violates golden rule",
                    "after": "irm http://localhost:8010/model/schemas/projects  // self-service schema access"
                },
                "before_after_field_discovery": {
                    "before": "Get first object and inspect keys: (irm http://...).data[0].PSObject.Properties.Name",
                    "after": "irm http://localhost:8010/model/projects/fields  // instant field list + required fields"
                },
                "before_after_example_object": {
                    "before": "Fetch all and filter: (irm http://...).data | Where-Object {$_.id -notlike '*...'} | Select-Object -First 1",
                    "after": "irm http://localhost:8010/model/projects/example  // first real object, placeholders skipped"
                },
                "safe_write_pattern": {
                    "description": "How to safely update an object with audit trail verification",
                    "code": [
                        "$obj = (irm http://localhost:8010/model/projects/51-ACA).data",
                        "$prev_rv = $obj.row_version",
                        "$obj.maturity = 'production'",
                        "$body = $obj | Select-Object id,label,maturity,phase,status,is_active | ConvertTo-Json -Depth 10",
                        "irm -Method PUT -Uri http://localhost:8010/model/projects/51-ACA -Body $body -ContentType 'application/json' -Headers @{'X-Actor'='agent:copilot'}",
                        "$updated = (irm http://localhost:8010/model/projects/51-ACA).data",
                        "if ($updated.row_version -ne ($prev_rv + 1)) { Write-Error 'Row version mismatch' }",
                        "irm -Method POST -Uri http://localhost:8010/model/admin/commit -Headers @{'Authorization'='Bearer dev-admin'}"
                    ]
                }
            },
            "layers_available": layers,
            "layer_notes": {
                "endpoints":     "id = 'METHOD /path' (exact). Filter by status with ?status=",
                "screens":       ".api_calls[] lists every endpoint id the screen calls",
                "services":      "uses obj_id not id field; no type or port fields at root level",
                "requirements":  "type: capability|epic|feature|story|pbi|proposal. project scoped.",
                "wbs":           "programme decomposition. ado_epic_id populated after ado-import.ps1",
                "containers":    "Cosmos containers. .fields + .partition_key are the schema source",
                "projects":      "all 48 eva-foundation numbered project folders",
                "mcp_servers":   "registered MCP servers. used by agents to resolve skill endpoints",
                "agents":        "registered agent definitions. .skills[] links to mcp_servers",
                "agent_policies": "(L33) Agent capabilities, safety constraints, project access. evidence tech_stack='agent-policies'",
                "quality_gates":  "(L34) MTI thresholds, test coverage gates, phase-specific blockers. evidence tech_stack='quality-gates'",
                "github_rules":   "(L35) Branch protection, commit standards, naming conventions. evidence tech_stack='github-rules'",
            },
            "forbidden": [
                "Reading model/*.json files directly",
                "Grepping source files for data the model already knows",
                "Constructing endpoint ids (always copy from GET /model/endpoints/)",
                "Using PATCH (not supported, use PUT)",
                "Using ConvertTo-Json -Depth 5 or lower (use -Depth 10)",
                "Committing without POST /model/admin/commit returning PASS",
                "Writing new skills in a project repo (skills are mastered in 29-foundry)",
            ],
            "quick_reference": {
                "health_check":    "GET /health  (liveness — uptime, store type, request_count)",
                "readiness_check": "GET /ready   (readiness — Cosmos ping, store_reachable field)",
                "layer_counts":    "GET /model/agent-summary",
                "layer_list":      "GET /model/layers (all layers with schema + count metadata)",
                "schema":          "GET /model/schemas/{layer} (full JSON Schema draft-07)",
                "fields":          "GET /model/{layer}/fields (field names + required list)",
                "example":         "GET /model/{layer}/example (first real object)",
                "count":           "GET /model/{layer}/count (fast total without data)",
                "commit":          "POST /model/admin/commit  (Bearer dev-admin)",
                "validate":        "POST /model/admin/validate  (Bearer dev-admin)",
                "export":          "POST /model/admin/export  (Bearer dev-admin)",
                "impact":          "GET /model/impact/?container=X",
                "graph":           "GET /model/graph/?node_id=X&depth=2",
                "this_guide":      "GET /model/agent-guide",
            },
        }

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.server:app", host="0.0.0.0", port=8010, reload=True)
