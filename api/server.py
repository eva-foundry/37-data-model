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

# ── global uptime + call counter ────────────────────────────────────────
_started_at: float = time.time()
_request_count: int = 0


# ── lifespan — wires store + cache ──────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    # ── PROD-WI-6: Reject insecure admin token in production ──────────────
    if not settings.dev_mode and settings.admin_token == "dev-admin":
        raise RuntimeError(
            "SECURITY: ADMIN_TOKEN is still 'dev-admin' but DEV_MODE=false. "
            "Set a strong ADMIN_TOKEN in your environment before starting in production.")
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
            log.info(
                "Store: CosmosDB — %s / %s",
                settings.model_db_name,
                settings.model_container_name)
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
        log.info(
            "Store: MemoryStore (in-process, ephemeral — set COSMOS_URL to persist)")

    # ── Cache ──────────────────────────────────────────────────────────────
    if settings.use_redis:
        from api.cache.redis_cache import RedisCache
        cache = RedisCache(
            redis_url=settings.redis_url,
            ttl=settings.cache_ttl_seconds)
        await cache.init()
        log.info(
            "Cache: Redis — %s  TTL=%ds",
            settings.redis_url,
            settings.cache_ttl_seconds)
    else:
        from api.cache.memory import MemoryCache
        cache = MemoryCache()
        log.info(
            "Cache: MemoryCache (in-process)  TTL=%ds",
            settings.cache_ttl_seconds)

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
            # Handle both formats: direct array (from export) or dict with
            # layer key (from disk)
            if isinstance(raw, list):
                objects = raw
            else:
                objects = raw.get(layer, [])
                if not objects:
                    for v in raw.values():
                        if isinstance(v, list):
                            objects = v
                            break
            # Ensure objects is a list and filter to dicts only
            if not isinstance(objects, list):
                objects = []
            # normalise id + stamp source_file
            objects = [o for o in objects if isinstance(o, dict)]
            for obj in objects:
                if "id" not in obj and "key" in obj:
                    obj["id"] = obj["key"]
                obj.setdefault("source_file", f"model/{filename}")
            objects = [o for o in objects if o.get("id")]
            loaded = await store.bulk_load(layer, objects, "system:autoload")
            total += loaded
        log.info("Auto-seeded %d objects from disk JSON files", total)

    yield

    # ── Graceful Shutdown (Session 41 Part 12: Vital Service Operations) ──
    # When container receives SIGTERM (from ACA during deployment):
    # 1. Stop accepting new requests (FastAPI handles this)
    # 2. Drain in-flight requests (wait up to terminationGracePeriod)
    # 3. Export MemoryStore state to disk (if applicable)
    # 4. Close connections gracefully
    
    log.info("Shutdown initiated - draining connections...")
    
    # Wait briefly for in-flight requests to complete (connection draining)
    # Container Apps sets terminationGracePeriodSeconds=30, giving us time
    import asyncio
    drain_timeout = settings.shutdown_grace_period_seconds if hasattr(settings, 'shutdown_grace_period_seconds') else 10
    log.info(f"Waiting {drain_timeout}s for in-flight requests to complete...")
    await asyncio.sleep(drain_timeout)
    
    # ── PROD-WI-7: Export-before-shutdown (MemoryStore + production mode only) ──
    # When the container receives SIGTERM, drain in-memory writes to disk so the
    # next cold-start auto-seed picks up all changes made since the last manual export.
    # Cosmos store: persistence is inherent — no export needed.
    # Dev mode (dev_mode=True): skip export to avoid polluting model/*.json during
    # local development and test runs (TestClient teardown triggers lifespan
    # cleanup).
    from api.store.memory import MemoryStore as _MSShutdown
    if isinstance(store, _MSShutdown) and not settings.dev_mode:
        log.info("Shutdown: exporting MemoryStore to disk JSON layer files...")
        try:
            import json as _json
            from api.routers.admin import _LAYER_FILES, _get_model_dir
            _STRIP = {
                "obj_id",
                "layer",
                "_rid",
                "_self",
                "_etag",
                "_attachments",
                "_ts"}
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
                        _existing = _json.loads(
                            _path.read_text(encoding="utf-8-sig"))
                        _schema_url = _existing.get("$schema", "")
                    except Exception:
                        pass
                _clean = [{k: v for k, v in doc.items() if k not in _STRIP}
                          for doc in _objects]
                _file_content: dict = {}
                if _schema_url:
                    _file_content["$schema"] = _schema_url
                _file_content[_layer] = _clean
                try:
                    _path.write_text(
                        _json.dumps(
                            _file_content,
                            indent=2,
                            ensure_ascii=False) +
                        "\n",
                        encoding="utf-8",
                    )
                    _total += len(_clean)
                except Exception as _we:
                    log.warning(
                        "Shutdown export: failed to write %s — %s", _filename, _we)
            log.info(
                "Shutdown export complete: %d objects written to %d layer files",
                _total,
                len(_LAYER_FILES))
        except Exception as _exc:
            log.error("Shutdown export failed: %s", _exc)
    
    log.info("Shutdown complete - all connections drained")
    # Cosmos / Redis clients close themselves via GC


# ── app ─────────────────────────────────────────────────────────────────

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
        # deployment & testing (L36-L38) — deployment policies + testing
        # automation + validation rules
        deployment_policies_router, testing_policies_router, validation_rules_router,
        # infrastructure monitoring (L40-L47) — agent execution, performance,
        # deployment quality
        agent_execution_history_router, agent_performance_metrics_router,
        azure_infrastructure_router, compliance_audit_router,
        deployment_quality_scores_router, deployment_records_router,
        eva_model_router, infrastructure_drift_router,
        performance_trends_router, resource_costs_router,
        # automated remediation (L48-L51) — Priority #4 self-healing framework
        remediation_policies_router, auto_fix_execution_history_router,
        remediation_outcomes_router, remediation_effectiveness_router,
        # execution engine (L52-L56) — Phase 1 core work ledger (Session 41 Part 10)
        work_execution_units_router, work_step_events_router,
        work_decision_records_router, work_outcomes_router,
    )
    from api.routers.fp import router as fp_router  # noqa: E402
    from api.routers.filter_endpoints import router as endpoints_router
    from api.routers.impact import router as impact_router
    from api.routers.graph import router as graph_router
    from api.routers.admin import router as admin_router
    # Session 26: schema introspection
    from api.routers.introspection import router as introspection_router
    # Session 26: metrics & analytics
    from api.routers.aggregation import router as aggregation_router
    # Session 41: layer metadata query
    from api.routers.metadata import router as metadata_router
    # Session 41: debug agent-guide 500 error
    from api.routers.debug import router as debug_router

    for r in [
        # introspection & aggregation (Session 26) — register FIRST for path
        # precedence
        introspection_router,
        aggregation_router,
        # metadata (Session 41) — register SECOND for layer discovery endpoint
        metadata_router,
        # debug (Session 41) — debug agent-guide 500 error investigation
        debug_router,
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
        # deployment & testing (L36-L38)
        deployment_policies_router, testing_policies_router, validation_rules_router,
        # infrastructure monitoring (L40-L47) — Priority #3 layers
        agent_execution_history_router, agent_performance_metrics_router,
        azure_infrastructure_router, compliance_audit_router,
        deployment_quality_scores_router, deployment_records_router,
        eva_model_router, infrastructure_drift_router,
        performance_trends_router, resource_costs_router,
        # automated remediation (L48-L51) — Priority #4 self-healing framework
        remediation_policies_router, auto_fix_execution_history_router,
        remediation_outcomes_router, remediation_effectiveness_router,
        # execution engine (L52-L56) — Phase 1 core work ledger (Session 41 Part 10)
        work_execution_units_router, work_step_events_router,
        work_decision_records_router, work_outcomes_router,
        fp_router,
        # graph (E-11)
        graph_router,
        impact_router, admin_router,
    ]:
        app.include_router(r)

    @app.get("/health",
             tags=["health"],
             summary="Liveness check — process alive + store type")
    async def health() -> dict:
        """
        Liveness probe: is the process up?
        Returns store/cache type, uptime, request count, and a hint to /model/agent-guide.
        Does NOT probe Cosmos — use /ready for that (readiness probe).
        """
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
            "status": "ok",
            "service": "model-api",
            "version": settings.api_version,
            "store": store_type,
            "cache": cache_type,
            "cache_ttl": settings.cache_ttl_seconds,
            "started_at": started_iso,
            "uptime_seconds": uptime,
            "request_count": _request_count,
            "agent_guide": "/model/agent-guide",
            "readiness": "/ready",
        }

    @app.get("/ready",
             tags=["health"],
             summary="Readiness probe — store connectivity verified")
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
            "status": "ready" if store_reachable else "not_ready",
            "service": "model-api",
            "version": settings.api_version,
            "store": store_type,
            "store_reachable": store_reachable,
            "store_latency_ms": store_latency_ms,
            "started_at": started_iso,
            "uptime_seconds": uptime,
            "request_count": _request_count,
        }
        if store_error:
            body["store_error"] = store_error

        status_code = 200 if store_reachable else 503
        return JSONResponse(content=body, status_code=status_code)

    @app.get("/model/agent-summary",
             tags=["health"],
             summary="All layer counts in one call — use this instead of querying each layer separately",
             )
    async def agent_summary() -> dict:
        """Returns item count for every layer + total.  No auth required.
        One call replaces 27 separate GET /model/{layer}/ count queries.
        Response includes store type and cache_ttl so agents know the write-safety profile.
        
        ENHANCED (Session 41 Part 7): Added Redis caching for 5-10× faster responses.
        Cache invalidated on seed/commit operations.
        """
        from api.simple_cache import cache_client
        from api.routers.admin import _LAYER_FILES
        from api.store.cosmos import CosmosStore as _CS
        
        # Try cache first
        CACHE_KEY = "agent-summary:v1"
        cached_data = await cache_client.get(CACHE_KEY)
        if cached_data is not None:
            return cached_data
        
        # Cache miss - query Cosmos DB
        store = app.state.store
        store_type = "cosmos" if isinstance(store, _CS) else "memory"
        counts: dict[str, int] = {}
        for layer in _LAYER_FILES:
            try:
                objs = await store.get_all(layer, active_only=False)
                counts[layer] = len(objs)
            except Exception:
                counts[layer] = -1
        
        result = {
            "layers": counts,
            "total": sum(
                v for v in counts.values() if v >= 0),
            "store": store_type,
            "cache_ttl": settings.cache_ttl_seconds,
            "note": "cache_ttl=0 means every GET goes to store -- safe for agent write-verify cycles",
        }
        
        # Store in cache for next time
        await cache_client.set(CACHE_KEY, result)
        
        return result

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
        Session 41: Phase 2 - Load layers from layer-metadata-index.json for FK support.
        """
        # Load layers from layer-metadata-index.json (Phase 2)
        # Use metadata router's helper function
        from api.routers.metadata import _load_metadata_index
        layer_metadata_index = _load_metadata_index()
        layers = [entry["layer_name"]
                  for entry in layer_metadata_index["layers"]]
        operational_count = sum(
            1 for entry in layer_metadata_index["layers"] if entry.get(
                "operational", False))
        # Session 41 marker - verifying code reload
        debug_timestamp = "2026-03-08T21:15:00Z"
        return {
            "session_41_reload_marker": debug_timestamp,
            "identity": {
                "service": "EVA Data Model API",
                "description": (
                    "Single source of truth for all declared EVA platform entities. "
                    "27+ layers. Every object has an immutable audit trail. "
                    "Store=Cosmos in production. Store=memory in local dev."
                ),
                "base_url": "http://localhost:8010",
                "cloud_url": "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",
                "apim_base": "https://marco-sandbox-apim.azure-api.net/data-model",
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
                        "calls": ["GET /model/layers", "GET /model/agent-summary", "GET /model/layer-metadata/?operational=true"],
                        "what_you_learn": "51 layers with counts, FK relationships, priorities, categories, operational status flags"
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
                "all_layer_counts": "GET /model/agent-summary",
                "discover_layers": "GET /model/layer-metadata/ (all 51 layers with FK relationships)",
                "discover_operational": "GET /model/layer-metadata/?operational=true (only 19 operational layers)",
                "discover_by_priority": "GET /model/layer-metadata/?priority=P0,P1 (foundation layers)",
                "discover_by_category": "GET /model/layer-metadata/?category=Remediation (L48-L51)",
                "discover_with_fks": "GET /model/layer-metadata/?with_fk=true (layers with FK relationships)",
                "layer_fk_details": "GET /model/layer-metadata/{layer} (single layer with fk_references and referenced_by)",
                "fk_relationship_matrix": "GET /model/fk-matrix (complete FK map for all layers)",
                "object_by_id": "GET /model/{layer}/{id}",
                "all_objects_in_layer": "GET /model/{layer}/",
                "filter_endpoints_status": "GET /model/endpoints/filter?status=stub",
                "filter_other_layers": "GET /model/{layer}/ then filter client-side with Where-Object",
                "what_screen_calls": "GET /model/screens/{id}  -> .api_calls",
                "auth_or_feature_flag": "GET /model/endpoints/{id}  -> .auth  .feature_flag",
                "cosmos_container_schema": "GET /model/containers/{id}  -> .fields  .partition_key",
                "navigate_to_source": ".repo_path + .repo_line  -> code --goto (line ref only, never grep)",
                "impact_analysis": "GET /model/impact/?container=X",
                "relationship_graph": "GET /model/graph/?node_id=X&depth=2",
                "services_list": "GET /model/services/  -> obj_id, status, is_active, notes",
                "schema_introspection": "GET /model/schemas/{layer} → full JSON schema",
                "example_object": "GET /model/{layer}/example → first real object",
                "field_discovery": "GET /model/{layer}/fields → array of field names",
                "fast_count": "GET /model/{layer}/count → instant count without data"
            },
            "write_cycle": {
                "critical_rule": (
                    "This API does NOT support POST for creating objects. "
                    "ALL writes use PUT with the object ID in the URL path: PUT /model/{layer}/{id}"
                ),
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
                "creating_new_objects": (
                    "To create a new object: PUT /model/{layer}/{new-id} with is_active=true. "
                    "The object will be created if it doesn't exist (row_version=1), "
                    "or updated if it does (row_version increments). No separate POST endpoint."
                )
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
                },
                "mistake_10": {
                    "error": "Assumed FOUNDRY_TOKEN environment variable required for authentication",
                    "cause": "External systems use tokens, but this API uses simple X-Actor header for writes",
                    "symptoms": "Blocked waiting for token or credentials that don't exist",
                    "fix": "Write operations only need: -Headers @{'X-Actor'='agent:copilot'}. Read agent_guide.actor_header first."
                },
                "mistake_11": {
                    "error": "POST /model/project_work/ returns 405 Method Not Allowed",
                    "cause": "This API does not support POST - all writes use PUT with ID in URL path",
                    "symptoms": "Tried POST to layer endpoint; received 405 error",
                    "fix": "Always use PUT with explicit ID: PUT /model/{layer}/{id} -Body $json -Headers @{'X-Actor'='agent:copilot'}"
                },
                "mistake_12": {
                    "error": "Searched for non-existent /features/ or /stories/ endpoints",
                    "cause": "Assumed layer structure without checking introspection endpoints",
                    "symptoms": "404 Not Found on assumed endpoint paths",
                    "fix": "Use GET /model/layers or GET /model/agent-summary to discover available layers. Work tracking uses 'project_work' layer."
                },
                "mistake_13": {
                    "error": "Hardcoded layer count or capabilities in documentation",
                    "cause": "Layers evolve - hardcoded counts become stale immediately",
                    "symptoms": "Documentation says '41 layers' but API has 51; examples reference removed fields",
                    "fix": "Always tell agents to introspect: GET /model/agent-summary for live counts, GET /model/{layer}/example for current schema"
                },
                "mistake_14": {
                    "error": "Not discovering FK relationships before querying linked layers",
                    "cause": "Assumed FK structure instead of using layer-metadata endpoint",
                    "symptoms": "Manual FK resolution attempts; hardcoded layer names; missed referenced_by relationships",
                    "fix": "Use GET /model/layer-metadata/{layer} to see fk_references[] and referenced_by[] arrays. Example: GET /model/layer-metadata/remediation_policies shows links to agent_policies and deployment_policies"
                },
                "mistake_15": {
                    "error": "Not following FK resolution pattern for L48-L51 remediation framework",
                    "cause": "Fetched execution history but didn't resolve policy_id to full policy object",
                    "symptoms": "Incomplete data; missing policy details like triggers, actions, thresholds",
                    "fix": [
                        "1. GET /model/auto_fix_execution_history/{exec_id} → extract policy_id",
                        "2. GET /model/remediation_policies/{policy_id} → get full policy with triggers/actions",
                        "3. For agent context: extract executor_agent_id → GET /model/agent_performance_metrics/{agent_id}",
                        "4. For provenance: extract decision_ids[] → GET /model/decision_provenance/{decision_id}"
                    ]
                },
                "mistake_16": {
                    "error": "Querying all layers without knowing which have data vs stubs",
                    "cause": "No pre-query check of operational status",
                    "symptoms": "Empty responses; wasted queries; unclear which layers are production-ready",
                    "fix": "Use GET /model/layer-metadata/?operational=true to get only the 19 operational layers. Stub layers (32) are designed but not populated yet"
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
            "remediation_framework": {
                "overview": "L48-L51 automated remediation with policy-driven self-healing (Session 40)",
                "description": (
                    "4-layer framework for automated incident response: "
                    "L48 (policies) defines WHEN/HOW/WHO to remediate. "
                    "L49 (execution_history) records every auto-fix attempt. "
                    "L50 (outcomes) tracks resolution success/failure. "
                    "L51 (effectiveness) aggregates system-wide KPIs."
                ),
                "examples": {
                    "list_policies": {
                        "method": "GET",
                        "url": "/model/remediation_policies/",
                        "description": "Get all remediation policies with triggers and actions",
                        "response_fields": ["policy_id", "policy_name", "triggers", "actions", "linked_policies"]
                    },
                    "get_policy": {
                        "method": "GET",
                        "url": "/model/remediation_policies/policy:agent-performance-recovery",
                        "description": "Fetch specific policy by ID",
                        "use_case": "Understand what triggers a specific remediation action"
                    },
                    "execution_history": {
                        "method": "GET",
                        "url": "/model/auto_fix_execution_history/",
                        "description": "View audit trail of all remediation actions",
                        "query_params": ["?limit=20", "?executor_agent_id=X"],
                        "response_fields": ["execution_id", "policy_id", "timestamp", "outcome", "duration_seconds"]
                    },
                    "fk_resolution_pattern": {
                        "description": "Follow FK from execution to policy to agent metrics (4 API calls)",
                        "pattern": [
                            "1. GET /model/auto_fix_execution_history/exec:20260308-142035-abc -> extract policy_id, executor_agent_id",
                            "2. GET /model/remediation_policies/{policy_id} -> get triggers[], actions[], linked_policies[]",
                            "3. GET /model/agent_performance_metrics/{executor_agent_id} -> verify agent reliability",
                            "4. GET /model/decision_provenance/{decision_id} -> trace reasoning (if decision_ids[] populated)"
                        ],
                        "code_example": [
                            "$exec = (irm http://localhost:8010/model/auto_fix_execution_history/exec:xyz).data",
                            "$policy = (irm http://localhost:8010/model/remediation_policies/$($exec.policy_id)).data",
                            "$agent = (irm http://localhost:8010/model/agent_performance_metrics/$($exec.executor_agent_id)).data",
                            "Write-Host \"Policy: $($policy.policy_name), Agent: $($agent.agent_id), Reliability: $($agent.reliability_percent)%\""
                        ]
                    },
                    "effectiveness_metrics": {
                        "method": "GET",
                        "url": "/model/remediation_effectiveness/2026-03",
                        "description": "System-wide success rates and trends for March 2026",
                        "aggregations": {
                            "by_policy": "Success rate per policy type (agent restart, scale-up, rollback)",
                            "by_agent": "Which agents have highest auto-fix success rates",
                            "by_severity": "How quickly critical vs warning issues are resolved"
                        }
                    },
                    "outcomes_analysis": {
                        "method": "GET",
                        "url": "/model/remediation_outcomes/?resolution_status=resolved",
                        "description": "Analyze successful vs failed remediation attempts",
                        "use_case": "Identify which policies need tuning (high false positive rate)"
                    },
                    "layer_metadata_integration": {
                        "method": "GET",
                        "url": "/model/layer-metadata/?category=Remediation",
                        "description": "Get metadata for all 4 remediation layers (L48-L51)",
                        "returns": "Layer definitions with FK relationships, priorities, operational status",
                        "next_step": "Use fk_references[] to discover linked layers without hardcoding"
                    },
                    "discover_fk_relationships": {
                        "method": "GET",
                        "url": "/model/layer-metadata/auto_fix_execution_history",
                        "description": "See all FK relationships for execution history layer",
                        "returns": {
                            "fk_references": ["remediation_policies", "agent_performance_metrics", "agent_execution_history", "decision_provenance"],
                            "referenced_by": ["remediation_outcomes"]
                        }
                    },
                    "query_by_priority": {
                        "method": "GET",
                        "url": "/model/layer-metadata/?priority=P4",
                        "description": "Get all Priority #4 layers (automated remediation framework)",
                        "use_case": "Discover complete remediation layer set without hardcoding layer names"
                    }
                },
                "common_patterns": {
                    "trigger_policy": "Check L48 for policy_id, verify triggers match current metrics (latency_threshold, error_rate, etc.)",
                    "track_execution": "L49 records all execution attempts with timestamps, outcomes, and duration",
                    "analyze_outcome": "L50 links execution_id to resolution_status (resolved, failed, partial)",
                    "measure_effectiveness": "L51 aggregates by policy/agent/severity for trend analysis and false positive detection",
                    "cross_layer_workflow": [
                        "Metrics drop (L40-L47) -> Trigger policy (L48) -> Execute remediation (L49) -> Record outcome (L50) -> Update effectiveness (L51)"
                    ]
                },
                "fk_navigation": {
                    "description": "How to navigate FK relationships across remediation layers",
                    "outbound_fks": {
                        "L48_remediation_policies": {
                            "fk_to": ["L33:agent_policies", "L36:deployment_policies"],
                            "use_case": "Fetch governance constraints before executing policy"
                        },
                        "L49_auto_fix_execution_history": {
                            "fk_to": ["L48:remediation_policies", "L40:agent_performance_metrics", "L46:agent_execution_history", "L31:decision_provenance"],
                            "use_case": "Full context for execution: policy definition + agent state + reasoning"
                        },
                        "L50_remediation_outcomes": {
                            "fk_to": ["L49:auto_fix_execution_history"],
                            "use_case": "Link outcome metrics back to execution details"
                        },
                        "L51_remediation_effectiveness": {
                            "fk_to": ["L48:remediation_policies", "L40:agent_performance_metrics"],
                            "use_case": "Aggregate effectiveness by policy type and agent"
                        }
                    },
                    "inbound_fks": {
                        "L48_remediation_policies": {
                            "referenced_by": ["L49:auto_fix_execution_history", "L51:remediation_effectiveness"],
                            "use_case": "Find all executions and effectiveness records for a policy"
                        },
                        "L49_auto_fix_execution_history": {
                            "referenced_by": ["L50:remediation_outcomes"],
                            "use_case": "Get outcome analysis for a specific execution"
                        }
                    }
                },
                "ready_for_production": {
                    "status": "All 4 layers operational (Session 40)",
                    "data_available": True,
                    "sample_policies": "agent-performance-recovery, infrastructure-scale-up, deployment-rollback",
                    "sample_executions": "8+ historical executions across all policies",
                    "next_session": "Phase 4 - populate remaining 32 stub layers with realistic data"
                }
            },
            "layers_available": layers,
            "layers_total": len(layers),
            "layers_operational": operational_count,
            "layers_complete_percent": round((operational_count / len(layers) * 100) if layers else 0, 1),
            "layer_notes": {
                "endpoints": "id = 'METHOD /path' (exact). Filter by status with ?status=",
                "screens": ".api_calls[] lists every endpoint id the screen calls",
                "services": "uses obj_id not id field; no type or port fields at root level",
                "requirements": "type: capability|epic|feature|story|pbi|proposal. project scoped.",
                "wbs": "programme decomposition. ado_epic_id populated after ado-import.ps1",
                "containers": "Cosmos containers. .fields + .partition_key are the schema source",
                "projects": "all 48 eva-foundation numbered project folders",
                "mcp_servers": "registered MCP servers. used by agents to resolve skill endpoints",
                "agents": "registered agent definitions. .skills[] links to mcp_servers",
                "project_work": "session-based work tracking. id format: '{project_id}-{YYYY-MM-DD}'. Contains session_summary (number, date, objective, status), tasks[], metrics{}, next_steps[]",
                "agent_policies": "(L33) Agent capabilities, safety constraints, project access. evidence tech_stack='agent-policies'",
                "quality_gates": "(L34) MTI thresholds, test coverage gates, phase-specific blockers. evidence tech_stack='quality-gates'",
                "github_rules": "(L35) Branch protection, commit standards, naming conventions. evidence tech_stack='github-rules'",
                "remediation_policies": "(L48) Decision framework for when/how/who to remediate. Triggers, actions, linked_policies. FK to agent_policies, deployment_policies",
                "auto_fix_execution_history": "(L49) Audit trail of automated remediation attempts. FK to remediation_policies, agent_performance_metrics, agent_execution_history, decision_provenance",
                "remediation_outcomes": "(L50) Resolution status and impact analytics. FK to auto_fix_execution_history",
                "remediation_effectiveness": "(L51) System-wide KPIs aggregated by policy/agent/severity. FK to remediation_policies, agent_performance_metrics",
                "layer_metadata": "Use GET /model/layer-metadata/ to discover all 51 layers with FK relationships, priorities, categories, operational status. Query params: operational, priority, category, sort, with_fk"
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
                "health_check": "GET /health  (liveness — uptime, store type, request_count)",
                "readiness_check": "GET /ready   (readiness — Cosmos ping, store_reachable field)",
                "layer_counts": "GET /model/agent-summary",
                "layer_list": "GET /model/layers (all layers with schema + count metadata)",
                "layer_metadata": "GET /model/layer-metadata/ (51 layer definitions with FK relationships, priorities, categories)",
                "layer_metadata_single": "GET /model/layer-metadata/{layer} (single layer with fk_references and referenced_by)",
                "fk_matrix": "GET /model/fk-matrix (complete FK relationship matrix for all layers)",
                "schema": "GET /model/schemas/{layer} (full JSON Schema draft-07)",
                "fields": "GET /model/{layer}/fields (field names + required list)",
                "example": "GET /model/{layer}/example (first real object)",
                "count": "GET /model/{layer}/count (fast total without data)",
                "commit": "POST /model/admin/commit  (Bearer dev-admin)",
                "validate": "POST /model/admin/validate  (Bearer dev-admin)",
                "export": "POST /model/admin/export  (Bearer dev-admin)",
                "impact": "GET /model/impact/?container=X",
                "graph": "GET /model/graph/?node_id=X&depth=2",
                "this_guide": "GET /model/agent-guide",
            },
        }

    @app.get(
        "/model/user-guide",
        tags=["health"],
        summary="Paperless user guide for sprint/session work",
    )
    async def user_guide() -> dict:
        """
        Return API-native paperless guidance for sprint/session operations.
        No markdown/file dependency: data model API is authoritative.
        """
        return {
            "status": "ok",
            "source": "data-model-api",
            "paperless": {
                "authority": "data-model-api",
                "bootstrap": [
                    "GET /model/agent-guide",
                    "GET /model/user-guide",
                    "GET /model/project_work/{id}",
                    "GET /model/sprints/?project_id={id}",
                ],
                "write_cycle": {
                    "correct": "PUT /model/project_work/{id}",
                    "verify": "GET /model/project_work/{id}",
                    "commit": "POST /model/admin/commit",
                },
                "not_supported": "POST /model/project_work/",
            },
            "category_instructions": {
                "session_tracking": {
                    "layer": "project_work",
                    "objective": "Track session-level progress, blockers, and next steps paperlessly.",
                    "id_format": {
                        "pattern": "{project_id}-{YYYY-MM-DD}",
                        "examples": ["37-data-model-2026-03-09", "48-eva-veritas-2026-03-08"],
                        "validation": "project_id must exist in projects layer; date must be valid ISO format"
                    },
                    "query_sequence": [
                        {
                            "step": 1,
                            "action": "DISCOVER",
                            "method": "GET /model/projects/{project_id}",
                            "purpose": "Verify project exists and read current phase",
                            "expected_status": 200,
                            "abort_if": "404 (project not found)"
                        },
                        {
                            "step": 2,
                            "action": "DISCOVER",
                            "method": "GET /model/project_work/{id}",
                            "purpose": "Check if session record already exists",
                            "expected_status": [200, 404],
                            "note": "404 is OK for first session of the day"
                        },
                        {
                            "step": 3,
                            "action": "DO",
                            "method": "PUT /model/project_work/{id}",
                            "headers": {"X-Actor": "agent:copilot"},
                            "purpose": "Create or update session record",
                            "expected_status": 200,
                            "required_fields": ["project_id", "current_phase", "session_summary", "tasks", "metrics"]
                        },
                        {
                            "step": 4,
                            "action": "CHECK",
                            "method": "GET /model/project_work/{id}",
                            "purpose": "Verify write succeeded and row_version incremented",
                            "expected_status": 200,
                            "validate": "row_version == previous + 1"
                        },
                        {
                            "step": 5,
                            "action": "ACT",
                            "method": "POST /model/admin/commit",
                            "headers": {"Authorization": "Bearer dev-admin"},
                            "purpose": "Validate model consistency after write",
                            "expected_status": 200,
                            "validate": "response.status == 'PASS' AND violation_count == 0"
                        }
                    ],
                    "anti_trash_rules": [
                        "No duplicate dates per project (use PUT to update existing record)",
                        "session_summary must be non-empty dict with completed_tasks and next_steps",
                        "tasks array must have at least one task",
                        "metrics must include at least: tests_passing, tests_added, files_changed",
                        "current_phase must match project.current_phase unless phase transition documented"
                    ],
                    "common_mistakes": [
                        "Using POST instead of PUT (POST not supported)",
                        "Forgetting X-Actor header (write will fail)",
                        "Not verifying project exists before creating session (leads to orphaned records)",
                        "Creating multiple session records for same date (use same ID to update)",
                        "Not running admin/commit after writes (consistency violations may accumulate)"
                    ]
                },
                "sprint_tracking": {
                    "layer": "sprints",
                    "objective": "Track sprint commitments, velocity, and delivery status.",
                    "id_format": {
                        "pattern": "{project_id}-sprint-{N}",
                        "examples": ["37-data-model-sprint-41", "48-eva-veritas-sprint-12"],
                        "validation": "project_id must exist; sprint number sequential (no gaps)"
                    },
                    "query_sequence": [
                        {
                            "step": 1,
                            "action": "DISCOVER",
                            "method": "GET /model/projects/{project_id}",
                            "purpose": "Verify project exists and read governance context",
                            "expected_status": 200
                        },
                        {
                            "step": 2,
                            "action": "DISCOVER",
                            "method": "GET /model/sprints/?project_id={project_id}&limit=10",
                            "purpose": "Read recent sprint history to determine next sprint number",
                            "expected_status": 200,
                            "note": "Sort by sprint number descending to get latest"
                        },
                        {
                            "step": 3,
                            "action": "DISCOVER",
                            "method": "GET /model/wbs/?project_id={project_id}",
                            "purpose": "Read backlog to link committed stories",
                            "expected_status": 200,
                            "note": "Filter for stories in ready or in-progress status"
                        },
                        {
                            "step": 4,
                            "action": "DO",
                            "method": "PUT /model/sprints/{id}",
                            "headers": {"X-Actor": "agent:copilot"},
                            "purpose": "Create sprint with committed stories and velocity target",
                            "expected_status": 200,
                            "required_fields": ["project_id", "sprint_number", "start_date", "end_date", "committed_stories", "velocity_target"]
                        },
                        {
                            "step": 5,
                            "action": "CHECK",
                            "method": "GET /model/sprints/{id}",
                            "purpose": "Verify sprint created with correct story links",
                            "expected_status": 200,
                            "validate": "committed_stories array contains valid wbs ids"
                        },
                        {
                            "step": 6,
                            "action": "ACT",
                            "method": "POST /model/admin/commit",
                            "headers": {"Authorization": "Bearer dev-admin"},
                            "purpose": "Validate sprint references and model consistency",
                            "expected_status": 200,
                            "validate": "response.status == 'PASS'"
                        }
                    ],
                    "anti_trash_rules": [
                        "Sprint numbers must be sequential (no skipping numbers)",
                        "Start and end dates must not overlap with active sprints for same project",
                        "committed_stories must reference existing wbs items from same project",
                        "velocity_target must be > 0 and reasonable (typically 3-20 story points)",
                        "Sprint must have at least one committed story (no empty sprints)",
                        "Sprint status must progress: planned → active → closed (no backwards transitions)"
                    ],
                    "common_mistakes": [
                        "Not checking for active sprints before creating new one (causes overlap)",
                        "Linking stories from different projects (FK violation)",
                        "Creating sprint-0 or negative sprint numbers",
                        "Not updating sprint status to 'closed' when complete",
                        "Forgetting to link sprint to evidence when closing (no audit trail)"
                    ]
                },
                "evidence_tracking": {
                    "layer": "evidence",
                    "objective": "Persist DPDCA artifacts and validation proof with immutable audit trail.",
                    "id_format": {
                        "pattern": "{project_id}-{phase}-{artifact_type}-{YYYYMMDD-HHMMSS}",
                        "examples": [
                            "37-data-model-discover-baseline-20260309-143022",
                            "48-eva-veritas-check-test-results-20260308-091544",
                            "07-foundation-act-session-summary-20260307-180315"
                        ],
                        "validation": "phase must be one of: discover, plan, do, check, act; artifact_type must be kebab-case"
                    },
                    "query_sequence": [
                        {
                            "step": 1,
                            "action": "DISCOVER",
                            "method": "GET /model/projects/{project_id}",
                            "purpose": "Verify project exists",
                            "expected_status": 200
                        },
                        {
                            "step": 2,
                            "action": "DISCOVER",
                            "method": "GET /model/project_work/{project_id}-{date}",
                            "purpose": "Get current session context for linking evidence",
                            "expected_status": 200,
                            "note": "Evidence should link to session or sprint for traceability"
                        },
                        {
                            "step": 3,
                            "action": "DO",
                            "method": "PUT /model/evidence/{id}",
                            "headers": {"X-Actor": "agent:copilot"},
                            "purpose": "Create immutable evidence record with artifact and metadata",
                            "expected_status": 200,
                            "required_fields": ["project_id", "phase", "artifact_type", "artifact_content", "correlation_id", "timestamp"]
                        },
                        {
                            "step": 4,
                            "action": "DO",
                            "method": "PUT /model/project_work/{project_id}-{date}",
                            "headers": {"X-Actor": "agent:copilot"},
                            "purpose": "Link evidence id to session record",
                            "expected_status": 200,
                            "note": "Add evidence id to project_work.evidence_ids array"
                        },
                        {
                            "step": 5,
                            "action": "CHECK",
                            "method": "GET /model/evidence/{id}",
                            "purpose": "Verify evidence persisted correctly",
                            "expected_status": 200,
                            "validate": "correlation_id matches session/sprint id"
                        },
                        {
                            "step": 6,
                            "action": "ACT",
                            "method": "POST /model/admin/commit",
                            "headers": {"Authorization": "Bearer dev-admin"},
                            "purpose": "Validate evidence links and model consistency",
                            "expected_status": 200
                        }
                    ],
                    "anti_trash_rules": [
                        "correlation_id is REQUIRED (links evidence to session/sprint/story)",
                        "No orphaned evidence (must link to valid project_work or sprint)",
                        "artifact_content must be non-empty (no placeholder evidence)",
                        "timestamp must be ISO 8601 UTC format",
                        "phase must be valid DPDCA phase (discover, plan, do, check, act)",
                        "Evidence is immutable once written (no updates, only new records)",
                        "artifact_type must describe WHAT was captured (e.g., test-results, not generic-data)"
                    ],
                    "common_mistakes": [
                        "Creating evidence without correlation_id (becomes orphaned, no traceability)",
                        "Using vague artifact_type like 'data' or 'output' instead of specific types",
                        "Not linking evidence back to project_work or sprint (breaks audit trail)",
                        "Trying to UPDATE evidence (evidence is append-only, create new record instead)",
                        "Forgetting to capture test results as evidence (breaks quality gate validation)",
                        "Using local timestamps instead of UTC (causes timezone confusion)"
                    ]
                },
                "governance_events": {
                    "layers": ["verification_records", "quality_gates", "decisions", "risks"],
                    "objective": "Record governance outcomes and gate evaluations in model layers.",
                    "id_formats": {
                        "verification_records": {
                            "pattern": "{project_id}-verification-{gate_name}-{YYYYMMDD-HHMMSS}",
                            "examples": ["37-data-model-verification-mti-gate-20260309-140022"],
                            "validation": "gate_name must reference existing quality_gate"
                        },
                        "quality_gates": {
                            "pattern": "{layer_name}-{gate_type}",
                            "examples": ["project_work-mti-threshold", "sprints-velocity-minimum"],
                            "validation": "gate_type must be one of: threshold, ratio, count, existence"
                        },
                        "decisions": {
                            "pattern": "{project_id}-decision-{sequence}",
                            "examples": ["37-data-model-decision-001", "48-eva-veritas-decision-042"],
                            "validation": "sequence must be zero-padded 3 digits"
                        },
                        "risks": {
                            "pattern": "{project_id}-risk-{sequence}",
                            "examples": ["37-data-model-risk-001", "07-foundation-risk-012"],
                            "validation": "sequence must be sequential"
                        }
                    },
                    "query_sequences": {
                        "verification_records": [
                            {"step": 1, "action": "DISCOVER", "method": "GET /model/quality_gates/{gate_id}", "purpose": "Read gate definition and thresholds"},
                            {"step": 2, "action": "DO", "method": "Execute gate evaluation logic", "purpose": "Calculate actual vs expected"},
                            {"step": 3, "action": "DO", "method": "PUT /model/verification_records/{id}", "purpose": "Store gate result (PASS/FAIL/WARN)"},
                            {"step": 4, "action": "CHECK", "method": "GET /model/verification_records/{id}", "purpose": "Verify result persisted"},
                            {"step": 5, "action": "ACT", "method": "PUT /model/project_work/{session_id}", "purpose": "Link verification to session"},
                            {"step": 6, "action": "ACT", "method": "POST /model/admin/commit", "purpose": "Validate governance consistency"}
                        ],
                        "quality_gates": [
                            {"step": 1, "action": "PLAN", "method": "Define gate criteria", "purpose": "What must be true for PASS"},
                            {"step": 2, "action": "DO", "method": "PUT /model/quality_gates/{id}", "purpose": "Store gate definition"},
                            {"step": 3, "action": "CHECK", "method": "GET /model/quality_gates/{id}", "purpose": "Verify gate stored with all thresholds"},
                            {"step": 4, "action": "ACT", "method": "POST /model/admin/commit", "purpose": "Validate gate definition"}
                        ],
                        "decisions": [
                            {"step": 1, "action": "DISCOVER", "method": "GET /model/decisions/?project_id={id}", "purpose": "Read past decisions for context"},
                            {"step": 2, "action": "PLAN", "method": "Document alternatives considered", "purpose": "ADR must show options evaluated"},
                            {"step": 3, "action": "DO", "method": "PUT /model/decisions/{id}", "purpose": "Store decision with rationale and alternatives"},
                            {"step": 4, "action": "CHECK", "method": "GET /model/decisions/{id}", "purpose": "Verify decision has alternatives array"},
                            {"step": 5, "action": "ACT", "method": "POST /model/admin/commit", "purpose": "Validate decision consistency"}
                        ],
                        "risks": [
                            {"step": 1, "action": "DISCOVER", "method": "GET /model/risks/?project_id={id}&status=open", "purpose": "Check for duplicate risks"},
                            {"step": 2, "action": "DO", "method": "PUT /model/risks/{id}", "purpose": "Create risk with probability, impact, mitigation"},
                            {"step": 3, "action": "CHECK", "method": "GET /model/risks/{id}", "purpose": "Verify risk has mitigation plan"},
                            {"step": 4, "action": "ACT", "method": "PUT /model/project_work/{session_id}", "purpose": "Link risk to session blockers"},
                            {"step": 5, "action": "ACT", "method": "POST /model/admin/commit", "purpose": "Validate risk references"}
                        ]
                    },
                    "anti_trash_rules": [
                        "verification_records: No duplicate gate evaluations for same session (one result per gate per session)",
                        "quality_gates: Must have measurable criteria (no vague 'code quality' gates without metrics)",
                        "decisions: Must include alternatives array with at least 2 options considered",
                        "risks: Must have probability (1-5), impact (1-5), and mitigation plan (non-empty)",
                        "All: Must link to valid project_id (no orphaned governance records)",
                        "verification_records: result must be one of: PASS, FAIL, WARN, CONDITIONAL",
                        "quality_gates: threshold values must be numeric and positive"
                    ],
                    "common_mistakes": [
                        "Running gate without storing verification_record (no audit trail)",
                        "Creating quality_gate without clear pass/fail thresholds",
                        "Writing decision without alternatives (violates ADR pattern)",
                        "Creating risk without mitigation plan (incomplete risk management)",
                        "Not linking verification_records to evidence (breaks traceability)",
                        "Reusing gate IDs across projects (gates should be project-specific or layer-global)",
                        "Forgetting to update risk status when mitigated (stale open risks)"
                    ],
                    "fail_closed_note": "Governance is API-only in paperless mode. If API unreachable, operations must fail (no disk fallback in compliance mode)."
                },
                "infra_observability": {
                    "layers": ["infrastructure_events", "agent_execution_history", "deployment_records"],
                    "objective": "Persist operational events and execution traces for auditability.",
                    "id_formats": {
                        "infrastructure_events": {
                            "pattern": "{resource_id}-{event_type}-{timestamp_ms}",
                            "examples": ["msub-eva-data-model-scale-20260309143022456", "redis-cache-failover-20260308091544123"],
                            "validation": "timestamp_ms must include milliseconds for uniqueness; resource_id must exist in infrastructure layer"
                        },
                        "agent_execution_history": {
                            "pattern": "agent-{agent_id}-{session_id}-{timestamp_ms}",
                            "examples": ["agent-copilot-37-data-model-2026-03-09-20260309143022789"],
                            "validation": "agent_id must exist in agents layer; session_id should link to project_work"
                        },
                        "deployment_records": {
                            "pattern": "{service_id}-deploy-{revision}-{timestamp}",
                            "examples": ["msub-eva-data-model-deploy-0000022-20260309-140022"],
                            "validation": "revision must be zero-padded 7 digits; service_id must exist in services layer"
                        }
                    },
                    "query_sequences": {
                        "infrastructure_events": [
                            {"step": 1, "action": "DISCOVER (optional)", "method": "GET /model/infrastructure/{resource_id}", "purpose": "Validate resource exists (optional for high-volume events)"},
                            {"step": 2, "action": "DO", "method": "PUT /model/infrastructure_events/{id}", "purpose": "Fire-and-forget event capture"},
                            {"step": 3, "action": "SKIP CHECK", "note": "High-volume events skip verification for performance"}
                        ],
                        "agent_execution_history": [
                            {"step": 1, "action": "DISCOVER", "method": "GET /model/agents/{agent_id}", "purpose": "Verify agent exists"},
                            {"step": 2, "action": "DO", "method": "PUT /model/agent_execution_history/{id}", "purpose": "Capture agent invocation with inputs, outputs, duration"},
                            {"step": 3, "action": "CHECK", "method": "GET /model/agent_execution_history/{id}", "purpose": "Verify execution logged"},
                            {"step": 4, "action": "ACT", "method": "POST /model/admin/commit", "purpose": "Optional: validate if needed for audit"}
                        ],
                        "deployment_records": [
                            {"step": 1, "action": "DISCOVER", "method": "GET /model/services/{service_id}", "purpose": "Read service metadata and current version"},
                            {"step": 2, "action": "DISCOVER", "method": "GET /model/deployment_records/?service_id={id}&limit=1", "purpose": "Get previous deployment for comparison"},
                            {"step": 3, "action": "DO", "method": "PUT /model/deployment_records/{id}", "purpose": "Capture deployment with revision, artifacts, and status"},
                            {"step": 4, "action": "DO", "method": "PUT /model/services/{service_id}", "purpose": "Update service.current_revision to match deployment"},
                            {"step": 5, "action": "CHECK", "method": "GET /model/deployment_records/{id}", "purpose": "Verify deployment logged"},
                            {"step": 6, "action": "ACT", "method": "POST /model/admin/commit", "purpose": "Validate deployment references"}
                        ]
                    },
                    "anti_trash_rules": [
                        "infrastructure_events: Use millisecond timestamps for uniqueness (no duplicate events)",
                        "agent_execution_history: Must capture duration_ms and outcome (success/failure/timeout)",
                        "deployment_records: Revision must increment (no backwards deployments)",
                        "All: resource_id/service_id/agent_id must reference valid entities (FK validation)",
                        "infrastructure_events: event_type must be from controlled vocabulary (scale, failover, error, restart, etc.)",
                        "deployment_records: Must link to evidence (deployment artifacts, test results)",
                        "agent_execution_history: Must capture actual inputs/outputs (not placeholders)"
                    ],
                    "common_mistakes": [
                        "Using same timestamp for multiple events (causes ID collision)",
                        "Not including milliseconds in timestamp (events within same second collide)",
                        "Logging deployment without updating service.current_revision (data inconsistency)",
                        "Creating agent_execution_history without session_id link (no traceability)",
                        "Forgetting to capture deployment failures (only logging successes)",
                        "Not linking deployment to evidence/artifacts (can't reproduce builds)",
                        "Using local timestamps instead of UTC (timezone confusion in logs)"
                    ],
                    "performance_note": "infrastructure_events are fire-and-forget (high volume). Skip CHECK step for performance. agent_execution_history and deployment_records require verification."
                },
                "ontology_domains": {
                    "objective": "Reason by domain, then query layers within that domain. Agents think in 13 domains, not 119 layers.",
                    "reasoning_pattern": [
                        "Step 1: Identify which domain(s) your task belongs to",
                        "Step 2: Query the 'start_here' layer for that domain to orient",
                        "Step 3: Follow cross_layer_queries for multi-layer operations",
                        "Step 4: Use domain-specific query patterns for common tasks"
                    ],
                    "domains": {
                        "system_architecture": {
                            "layers": ["services", "endpoints", "schemas", "infrastructure", "containers"],
                            "start_here": "services",
                            "common_queries": [
                                "GET /model/services/?status=active -> list all running services",
                                "GET /model/services/{id} -> read service details then GET /model/endpoints/?service_id={id}",
                                "GET /model/infrastructure/ -> understand deployment targets"
                            ],
                            "cross_layer_queries": [
                                "Service → Endpoints → Schemas (trace API surface)",
                                "Infrastructure → Services → Containers (understand deployments)"
                            ]
                        },
                        "identity_access": {
                            "layers": ["personas", "security_controls", "secrets_catalog"],
                            "start_here": "personas",
                            "common_queries": [
                                "GET /model/personas/ -> understand all actors in system",
                                "GET /model/security_controls/?persona_id={id} -> what can this persona access",
                                "GET /model/secrets_catalog/ -> audit what secrets exist"
                            ],
                            "cross_layer_queries": [
                                "Personas → Security Controls → Endpoints (trace access paths)"
                            ]
                        },
                        "ai_runtime": {
                            "layers": ["agents", "prompts", "mcp_servers", "agent_policies"],
                            "start_here": "agents",
                            "common_queries": [
                                "GET /model/agents/?status=active -> list deployed agents",
                                "GET /model/agents/{id} -> read agent then GET /model/prompts/?agent_id={id}",
                                "GET /model/mcp_servers/ -> discover available MCP tools"
                            ],
                            "cross_layer_queries": [
                                "Agents → Prompts → Agent Policies (understand agent behavior)",
                                "Agents → MCP Servers (trace tool availability)"
                            ]
                        },
                        "user_interface": {
                            "layers": ["screens", "literals", "components", "hooks", "ts_types"],
                            "start_here": "screens",
                            "common_queries": [
                                "GET /model/screens/ -> understand UI structure",
                                "GET /model/screens/{id} -> read screen then GET /model/components/?screen_id={id}",
                                "GET /model/literals/?screen_id={id} -> get all text for i18n"
                            ],
                            "cross_layer_queries": [
                                "Screens → Components → Hooks (trace UI interactions)",
                                "Screens → Literals (localization)"
                            ]
                        },
                        "control_plane": {
                            "layers": ["planes", "connections", "environments", "cp_skills", "feature_flags"],
                            "start_here": "planes",
                            "common_queries": [
                                "GET /model/planes/ -> understand control plane structure",
                                "GET /model/environments/ -> list dev, staging, prod configs",
                                "GET /model/feature_flags/?status=enabled -> active feature flags"
                            ],
                            "cross_layer_queries": [
                                "Planes → Connections → Environments (trace data flows)"
                            ]
                        },
                        "governance_policy": {
                            "layers": ["quality_gates", "github_rules", "validation_rules", "risks", "decisions"],
                            "start_here": "quality_gates",
                            "common_queries": [
                                "GET /model/quality_gates/ -> list all gates",
                                "GET /model/verification_records/?project_id={id} -> check gate results",
                                "GET /model/risks/?project_id={id}&status=open -> active risks"
                            ],
                            "cross_layer_queries": [
                                "Quality Gates → Verification Records → Evidence (audit trail)",
                                "Risks → Decisions → Project Work (governance events)"
                            ]
                        },
                        "project_pm": {
                            "layers": ["projects", "wbs", "sprints", "stories", "tasks", "milestones"],
                            "start_here": "projects",
                            "common_queries": [
                                "GET /model/projects/{id} -> read project context",
                                "GET /model/sprints/?project_id={id}&status=active -> current sprint",
                                "GET /model/wbs/?project_id={id}&status=in-progress -> active work"
                            ],
                            "cross_layer_queries": [
                                "Projects → Sprints → WBS (trace sprint commitments)",
                                "WBS → Tasks → Evidence (verify story completion)",
                                "Projects → Milestones → Sprints (roadmap view)"
                            ]
                        },
                        "devops_delivery": {
                            "layers": ["ci_cd_pipelines", "deployment_history", "test_cases", "deployment_policies", "repos"],
                            "start_here": "repos",
                            "common_queries": [
                                "GET /model/repos/ -> list all repositories",
                                "GET /model/deployment_history/?service_id={id}&limit=10 -> recent deploys",
                                "GET /model/test_cases/?repo_id={id} -> test coverage"
                            ],
                            "cross_layer_queries": [
                                "Repos → CI/CD Pipelines → Deployment History (trace deployments)",
                                "Test Cases → Evidence (verify testing)"
                            ]
                        },
                        "observability_evidence": {
                            "layers": ["evidence", "deployment_records", "compliance_audit", "verification_records", "agent_execution_history"],
                            "start_here": "evidence",
                            "common_queries": [
                                "GET /model/evidence/?project_id={id}&phase=check -> test results",
                                "GET /model/verification_records/?project_id={id} -> gate outcomes",
                                "GET /model/agent_execution_history/?session_id={id} -> agent activity"
                            ],
                            "cross_layer_queries": [
                                "Evidence → Verification Records → Quality Gates (audit trail)",
                                "Deployment Records → Evidence (deployment artifacts)"
                            ]
                        },
                        "infrastructure_finops": {
                            "layers": ["azure_infrastructure", "resource_costs", "performance_trends", "cost_allocation"],
                            "start_here": "azure_infrastructure",
                            "common_queries": [
                                "GET /model/azure_infrastructure/ -> list all Azure resources",
                                "GET /model/resource_costs/?resource_id={id} -> cost breakdown",
                                "GET /model/cost_allocation/?project_id={id} -> project costs"
                            ],
                            "cross_layer_queries": [
                                "Azure Infrastructure → Resource Costs → Cost Allocation (billing)",
                                "Azure Infrastructure → Services (map Azure resources to EVA services)"
                            ]
                        },
                        "execution_engine": {
                            "layers": ["work_execution_units", "work_step_events", "work_outcomes", "work_session_trace"],
                            "start_here": "work_execution_units",
                            "common_queries": [
                                "GET /model/work_execution_units/?status=in-progress -> running work",
                                "GET /model/work_step_events/?execution_id={id} -> trace execution steps",
                                "GET /model/work_outcomes/?execution_id={id} -> execution results"
                            ],
                            "cross_layer_queries": [
                                "Work Execution Units → Work Step Events → Work Outcomes (trace execution)",
                                "Work Execution Units → Evidence (link to DPDCA artifacts)"
                            ],
                            "note": "24 execution layers (L52-L75) operational as of Session 41. See docs/library/13-EXECUTION-LAYERS.md"
                        },
                        "strategy_portfolio": {
                            "layers": ["work_factory_portfolio", "work_factory_roadmaps", "work_factory_investments", "work_factory_initiatives", "work_factory_okrs"],
                            "start_here": "work_factory_portfolio",
                            "common_queries": [
                                "GET /model/work_factory_portfolio/ -> list all portfolio items",
                                "GET /model/work_factory_roadmaps/?portfolio_id={id} -> roadmap view",
                                "GET /model/work_factory_okrs/?quarter={q} -> objectives and key results"
                            ],
                            "cross_layer_queries": [
                                "Portfolio -> Roadmaps -> Projects (strategic alignment)",
                                "Portfolio -> Investments -> Resource Costs (ROI tracking)"
                            ],
                            "note": "5 strategy layers (L71-L75) part of execution engine Phase 6. See docs/architecture/EXECUTION-LAYERS-ASSESSMENT.md"
                        },
                        "discovery_sense_making": {
                            "layers": [
                                "discovery_contexts",
                                "discovery_signals",
                                "discovery_patterns",
                                "discovery_insights",
                                "sense_making_models",
                                "discovery_outcomes",
                                "discovery_actions",
                                "discovery_knowledge_base"
                            ],
                            "start_here": "discovery_contexts",
                            "common_queries": [
                                "GET /model/discovery_contexts/?project_id={id} -> active discovery contexts",
                                "GET /model/discovery_signals/?context_id={id} -> signals for a context",
                                "GET /model/discovery_patterns/?context_id={id} -> recognized patterns",
                                "GET /model/discovery_insights/?context_id={id} -> synthesized insights",
                                "GET /model/sense_making_models/ -> conceptual frameworks",
                                "GET /model/discovery_outcomes/?project_id={id} -> discovery results",
                                "GET /model/discovery_actions/?context_id={id} -> triggered actions",
                                "GET /model/discovery_knowledge_base/?project_id={id} -> accumulated knowledge"
                            ],
                            "cross_layer_queries": [
                                "Discovery Contexts -> Signals -> Patterns (sense-making pipeline)",
                                "Patterns -> Insights -> Sense-Making Models (knowledge synthesis)",
                                "Insights -> Actions -> Outcomes (discovery-to-action loop)",
                                "Outcomes -> Knowledge Base (knowledge accumulation)"
                            ],
                            "note": "8 discovery layers (L122-L129) for Domain 13. Implements D3PDCA discovery phase."
                        }
                    },
                    "anti_trash_thinking": [
                        "DO NOT query all 119 layers individually (use domain-first approach)",
                        "DO NOT skip 'start_here' layer (provides context for domain)",
                        "DO follow cross_layer_queries patterns (domain-specific best practices)",
                        "DO use common_queries as templates (proven query patterns)",
                        "DO NOT mix domains without clear reasoning (respect domain boundaries)"
                    ]
                }
            }
        }

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.server:app", host="0.0.0.0", port=8010, reload=True)
