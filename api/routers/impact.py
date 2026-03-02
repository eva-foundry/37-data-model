"""
# EVA-STORY: F37-IMPACT-001
Cross-layer impact analysis.

GET /model/impact?container=translations
GET /model/impact?container=translations&field=key

Returns every endpoint, screen, agent, and requirement that would be affected
by a change to the specified container (and optionally a specific field within it).

This is the API equivalent of:
  .\\scripts\\impact-analysis.ps1 -field key -container translations
but available over HTTP to any consumer without PowerShell.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from api.store.base import AbstractStore
from api.cache.base import AbstractCache
from api.dependencies import get_store, get_cache
from api.config import Settings, get_settings

router = APIRouter(prefix="/model/impact", tags=["impact"])


@router.get(
    "/",
    summary="What breaks if this container (and optional field) changes?",
    response_description="Endpoints, screens, agents, requirements referencing the target container",
)
async def impact_analysis(
    container: str        = Query(...,  description="Container id, e.g. 'translations'"),
    field: str | None     = Query(None, description="Optional field name — narrows the result set"),
    store: AbstractStore  = Depends(get_store),
    cache: AbstractCache  = Depends(get_cache),
    settings: Settings    = Depends(get_settings),
) -> dict[str, Any]:

    async def _layer(name: str) -> list[dict[str, Any]]:
        cached = await cache.get_layer(name)
        if cached is not None:
            return cached
        data = await store.get_all(name, active_only=True)
        await cache.set_layer(name, data, settings.cache_ttl_seconds)
        return data

    endpoints     = await _layer("endpoints")
    screens       = await _layer("screens")
    agents        = await _layer("agents")
    requirements  = await _layer("requirements")
    schemas       = await _layer("schemas")

    # ── endpoints that read or write the target container ─────────────────
    hit_endpoints = [
        e for e in endpoints
        if container in (e.get("cosmos_reads") or [])
        or container in (e.get("cosmos_writes") or [])
    ]
    hit_ep_ids = {e.get("id") or e.get("obj_id") for e in hit_endpoints}

    # ── screens that call any of those endpoints ──────────────────────────
    hit_screens = [
        s for s in screens
        if any(c in hit_ep_ids for c in (s.get("api_calls") or []))
    ]

    # ── agents whose input_endpoints overlap ──────────────────────────────
    hit_agents = [
        a for a in agents
        if any(ep in hit_ep_ids for ep in (a.get("input_endpoints") or []))
    ]

    # ── requirements satisfied_by any of the hit endpoints ────────────────
    hit_reqs = [
        r for r in requirements
        if any(ep in hit_ep_ids for ep in (r.get("satisfied_by") or []))
    ]

    # ── schemas referenced by hit endpoints ───────────────────────────────
    schema_ids_in_use: set[str] = set()
    for e in hit_endpoints:
        if e.get("request_schema"):
            schema_ids_in_use.add(e["request_schema"])
        if e.get("response_schema"):
            schema_ids_in_use.add(e["response_schema"])
    hit_schemas = [
        s for s in schemas
        if (s.get("id") or s.get("obj_id")) in schema_ids_in_use
    ]

    def _ep_summary(e: dict) -> dict:
        return {
            "id":     e.get("id") or e.get("obj_id"),
            "status": e.get("status"),
            "cosmos_reads":  e.get("cosmos_reads"),
            "cosmos_writes": e.get("cosmos_writes"),
        }

    def _sc_summary(s: dict) -> dict:
        return {
            "id":     s.get("id") or s.get("obj_id"),
            "route":  s.get("route"),
            "status": s.get("status"),
        }

    return {
        "container": container,
        "field":     field,
        "impact": {
            "total":        len(hit_endpoints) + len(hit_screens) + len(hit_agents) + len(hit_reqs),
            "endpoints":    [_ep_summary(e) for e in hit_endpoints],
            "screens":      [_sc_summary(s) for s in hit_screens],
            "schemas":      [{"id": s.get("id") or s.get("obj_id")} for s in hit_schemas],
            "agents":       [{"id": a.get("id") or a.get("obj_id")} for a in hit_agents],
            "requirements": [{"id": r.get("id") or r.get("obj_id"), "title": r.get("title")} for r in hit_reqs],
        },
    }
