"""
Endpoints-layer router — standard CRUD from base_layer, plus a rich /filter endpoint
that lets callers compose multi-field queries in a single HTTP call.

GET /model/endpoints/filter?status=stub&cosmos_writes=jobs&auth=admin&feature_flag=action.chat
"""
from __future__ import annotations

from fastapi import Depends, Query
from typing import Any

from api.routers.base_layer import make_layer_router
from api.store.base import AbstractStore
from api.cache.base import AbstractCache
from api.dependencies import get_store, get_cache
from api.config import Settings, get_settings

# Inherit all generic CRUD routes
router = make_layer_router("endpoints", "/model/endpoints", ["endpoints"])


@router.get("/filter",
            tags=["endpoints"],
            summary="Filter endpoints by any combination of status, cosmos_writes, cosmos_reads, auth, feature_flag",
            )
async def filter_endpoints(
    status: str | None = Query(None, description="implemented | stub | planned"),
    cosmos_writes: str | None = Query(None, description="Container id written to, e.g. 'jobs'"),
    cosmos_reads: str | None = Query(None, description="Container id read from"),
    auth: str | None = Query(None, description="Persona id that can call this endpoint"),
    feature_flag: str | None = Query(None, description="Feature flag id"),
    service: str | None = Query(None, description="Service id, e.g. 'eva-brain-api'"),
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
    settings: Settings = Depends(get_settings),
) -> list[dict[str, Any]]:
    # Serve from cache if available
    items: list[dict[str, Any]] | None = await cache.get_layer("endpoints")
    if items is None:
        items = await store.get_all("endpoints", active_only=True)
        await cache.set_layer("endpoints", items, settings.cache_ttl_seconds)

    result = items
    if status:
        result = [e for e in result if e.get("status") == status]
    if cosmos_writes:
        result = [
            e for e in result if cosmos_writes in (
                e.get("cosmos_writes") or [])]
    if cosmos_reads:
        result = [
            e for e in result if cosmos_reads in (
                e.get("cosmos_reads") or [])]
    if auth:
        result = [e for e in result if auth in (e.get("auth") or [])]
    if feature_flag:
        result = [e for e in result if e.get("feature_flag") == feature_flag]
    if service:
        result = [e for e in result if e.get("service") == service]

    return result


# ── Route ordering fix ──────────────────────────────────────────────────
# FastAPI evaluates routes in registration order.
# make_layer_router() registers /{obj_id:path} first, which would shadow /filter.
# Move all exact/non-parameterised paths before the catch-all path routes.
_exact: list = [r for r in router.routes if "{" not in getattr(r, "path", "")]
_catchall: list = [r for r in router.routes if "{" in getattr(r, "path", "")]
router.routes = _exact + _catchall
