"""
Generic CRUD router factory.
Call make_layer_router("endpoints", "/model/endpoints", ["endpoints"])
to get a fully-wired APIRouter for that layer.

Every layer gets:
  GET  /model/{layer}          — list all (cached)
  GET  /model/{layer}/{id}     — get one (cached)
  PUT  /model/{layer}/{id}     — upsert (cache invalidated)
  DELETE /model/{layer}/{id}   — soft delete (cache invalidated)
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.dependencies import get_actor, get_cache, get_store
from api.store.base import AbstractStore
from api.cache.base import AbstractCache
from api.config import Settings, get_settings


def make_layer_router(layer: str, prefix: str, tags: list[str]) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=tags)

    # ── LIST ──────────────────────────────────────────────────────────────
    @router.get(
        "/",
        summary=f"List all {layer}",
        response_description=f"All active {layer} objects (cached {60}s)",
    )
    async def list_objects(
        active_only: bool = Query(True, description="Set false to include soft-deleted objects"),
        store: AbstractStore = Depends(get_store),
        cache: AbstractCache = Depends(get_cache),
        settings: Settings = Depends(get_settings),
    ) -> list[dict[str, Any]]:
        if active_only:
            cached = await cache.get_layer(layer)
            if cached is not None:
                for item in cached:
                    item.setdefault("_cached", True)
                return cached
        data = await store.get_all(layer, active_only=active_only)
        if active_only:
            await cache.set_layer(layer, data, settings.cache_ttl_seconds)
        return data

    # ── GET ONE ───────────────────────────────────────────────────────────
    @router.get(
        "/{obj_id:path}",
        summary=f"Get one {layer} object by id",
    )
    async def get_object(
        obj_id: str,
        store: AbstractStore = Depends(get_store),
        cache: AbstractCache = Depends(get_cache),
        settings: Settings = Depends(get_settings),
    ) -> dict[str, Any]:
        cached = await cache.get_obj(layer, obj_id)
        if cached is not None:
            cached["_cached"] = True
            return cached
        obj = await store.get_one(layer, obj_id)
        if obj is None or obj.get("is_active") is False:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Not found: {layer}::{obj_id}",
            )
        await cache.set_obj(layer, obj_id, obj, settings.cache_ttl_seconds)
        return obj

    # ── UPSERT ────────────────────────────────────────────────────────────
    @router.put(
        "/{obj_id:path}",
        summary=f"Create or update a {layer} object",
        status_code=status.HTTP_200_OK,
    )
    async def upsert_object(
        obj_id: str,
        body: dict[str, Any],
        store: AbstractStore = Depends(get_store),
        cache: AbstractCache = Depends(get_cache),
        actor: str = Depends(get_actor),
    ) -> dict[str, Any]:
        result = await store.upsert(layer, obj_id, body, actor)
        await cache.invalidate_layer(layer)
        await cache.invalidate_obj(layer, obj_id)
        return result

    # ── SOFT DELETE ───────────────────────────────────────────────────────
    @router.delete(
        "/{obj_id:path}",
        summary=f"Soft-delete a {layer} object (is_active=false)",
    )
    async def delete_object(
        obj_id: str,
        store: AbstractStore = Depends(get_store),
        cache: AbstractCache = Depends(get_cache),
        actor: str = Depends(get_actor),
    ) -> dict[str, Any]:
        result = await store.soft_delete(layer, obj_id, actor)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Not found: {layer}::{obj_id}",
            )
        await cache.invalidate_layer(layer)
        await cache.invalidate_obj(layer, obj_id)
        return {
            "deleted": obj_id,
            "layer": layer,
            "row_version": result.get("row_version"),
            "modified_at": result.get("modified_at"),
        }

    return router
