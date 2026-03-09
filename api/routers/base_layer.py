"""
Generic CRUD router factory.
Call make_layer_router("endpoints", "/model/endpoints", ["endpoints"])
to get a fully-wired APIRouter for that layer.

Every layer gets:
  GET  /model/{layer}          — list all (cached, with universal query support)
  GET  /model/{layer}/{id}     — get one (cached)
  PUT  /model/{layer}/{id}     — upsert (cache invalidated)
  DELETE /model/{layer}/{id}   — soft delete (cache invalidated)

ENHANCED: Session 26 (2026-03-05)
  - Universal query support: ?field=value, ?limit=N, ?offset=M
  - Helpful error messages for unsupported query params
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from api.dependencies import get_actor, get_cache, get_store
from api.store.base import AbstractStore
from api.cache.base import AbstractCache
from api.config import Settings, get_settings


def make_layer_router(layer: str, prefix: str, tags: list[str]) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=tags)

    # ── LIST (with universal query support) ──────────────────────────────
    @router.get("/",
                summary=f"List all {layer}",
                response_description=f"All active {layer} objects (cached {60}s, universal query support)",
                )
    async def list_objects(
        request: Request,
        active_only: bool = Query(True, description="Set false to include soft-deleted objects"),
        limit: int = Query(None, ge=1, le=10000, description="Limit results (default=all, max=10000)"),
        offset: int = Query(0, ge=0, description="Skip first N results for pagination"),
        store: AbstractStore = Depends(get_store),
        cache: AbstractCache = Depends(get_cache),
        settings: Settings = Depends(get_settings),
    ) -> dict[str, Any]:
        """
        List objects with universal query support.

        Query params:
          - active_only: filter by is_active (default=true)
          - limit: max results to return
          - offset: skip first N results
          - Any field: ?field=value (exact match)
          - Operators: ?field.gt=10, ?field.lt=100, ?field.contains=text

        Returns {"data": [...], "_query_warning": {...}} if unsupported param used.
        """
        # Extract all query params from request
        query_params = dict(request.query_params)

        # Remove reserved params that are handled explicitly
        reserved_params = {"active_only", "limit", "offset"}
        custom_filters = {
            k: v for k,
            v in query_params.items() if k not in reserved_params}

        # Fetch data from cache or store
        if active_only and not custom_filters:
            cached = await cache.get_layer(layer)
            if cached is not None:
                # Apply pagination to cached data
                data = cached
                if offset:
                    data = data[offset:]
                if limit:
                    data = data[:limit]
                for item in data:
                    item.setdefault("_cached", True)
                return {"data": data}

        # Fetch all objects
        data = await store.get_all(layer, active_only=active_only)

        # Apply custom filters server-side
        query_warnings = []
        if custom_filters:
            # Get first object to check valid fields
            sample_obj = next(
                (obj for obj in data if not obj.get(
                    "id", "").endswith("...")), None)
            if sample_obj:
                valid_fields = set(sample_obj.keys())
            else:
                valid_fields = set()

            filtered_data = []
            for obj in data:
                matches = True
                for param_name, param_value in custom_filters.items():
                    # Parse operator from param name (e.g., "count.gt" ->
                    # ("count", "gt"))
                    if "." in param_name:
                        field, operator = param_name.rsplit(".", 1)
                    else:
                        field, operator = param_name, "eq"

                    # Check if field exists in schema
                    if field not in valid_fields:
                        if param_name not in [w["param"]
                                              for w in query_warnings]:
                            query_warnings.append({
                                "param": param_name,
                                "message": f"Field '{field}' not found in {layer} schema",
                                # show first 20 fields
                                "valid_fields": sorted(list(valid_fields)[:20]),
                                "example": f"GET /model/{layer}/?{sorted(list(valid_fields))[0] if valid_fields else 'id'}=value"
                            })
                        continue  # Don't filter by unknown fields

                    # Get field value from object (support nested fields with
                    # dot notation)
                    obj_value = obj
                    for key_part in field.split("."):
                        if isinstance(
                                obj_value, dict) and key_part in obj_value:
                            obj_value = obj_value[key_part]
                        else:
                            obj_value = None
                            break

                    # Apply operator
                    if operator == "eq":
                        if str(obj_value) != param_value:
                            matches = False
                            break
                    elif operator == "gt":
                        try:
                            if float(obj_value) <= float(param_value):
                                matches = False
                                break
                        except (ValueError, TypeError):
                            matches = False
                            break
                    elif operator == "lt":
                        try:
                            if float(obj_value) >= float(param_value):
                                matches = False
                                break
                        except (ValueError, TypeError):
                            matches = False
                            break
                    elif operator == "gte":
                        try:
                            if float(obj_value) < float(param_value):
                                matches = False
                                break
                        except (ValueError, TypeError):
                            matches = False
                            break
                    elif operator == "lte":
                        try:
                            if float(obj_value) > float(param_value):
                                matches = False
                                break
                        except (ValueError, TypeError):
                            matches = False
                            break
                    elif operator == "contains":
                        if param_value.lower() not in str(obj_value).lower():
                            matches = False
                            break
                    elif operator == "in":
                        # Support comma-separated values
                        values = param_value.split(",")
                        if str(obj_value) not in values:
                            matches = False
                            break
                    else:
                        # Unknown operator - warn but don't filter
                        if f"{param_name}.{operator}" not in [
                                w["param"] for w in query_warnings]:
                            query_warnings.append({
                                "param": param_name,
                                "message": f"Unknown operator '{operator}'",
                                "valid_operators": ["eq (default)", "gt", "lt", "gte", "lte", "contains", "in"],
                                "example": f"GET /model/{layer}/?{field}.gt=10"
                            })
                        continue

                if matches:
                    filtered_data.append(obj)

            data = filtered_data

        # Apply pagination
        total_before_pagination = len(data)
        if offset:
            data = data[offset:]
        if limit:
            data = data[:limit]

        # Cache if appropriate
        if active_only and not custom_filters:
            await cache.set_layer(layer, data, settings.cache_ttl_seconds)

        # Build response
        response = {"data": data}

        # Add pagination metadata if used
        if limit or offset:
            response["_pagination"] = {
                "total_results": total_before_pagination,
                "returned": len(data),
                "offset": offset,
                "limit": limit
            }

        # Add query warnings if any
        if query_warnings:
            response["_query_warnings"] = query_warnings

        return response

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
        
        # Also invalidate Redis cache for agent-summary (Session 41 Part 7)
        try:
            from api.cache import cache_client
            await cache_client.delete("agent-summary:v1")
        except Exception:
            pass  # Non-fatal, old cache exists as fallback
        
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
        
        # Also invalidate Redis cache for agent-summary (Session 41 Part 7)
        try:
            from api.cache import cache_client
            await cache_client.delete("agent-summary:v1")
        except Exception:
            pass  # Non-fatal, old cache exists as fallback
        
        return {
            "deleted": obj_id,
            "layer": layer,
            "row_version": result.get("row_version"),
            "modified_at": result.get("modified_at"),
        }

    return router
