"""
Generic Query Router — /model/query endpoint

Provides unified query interface for all layers with filtering and pagination.
Enables agents and scripts to discover layer data without layer-specific endpoints.

Session 47: Implement missing /model/query endpoint (Phase 3: DO)
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query as QueryParam
from pydantic import BaseModel

from api.dependencies import (
    get_cache,
    get_store,
    AbstractCache,
    AbstractStore,
)

router = APIRouter(prefix="/model", tags=["query"])


# ── Request/Response Models ──────────────────────────────────────────────

class QueryRequest(BaseModel):
    """Generic layer query request."""
    layer: str = Body(..., description="Layer to query (e.g., 'project_work', 'evidence')")
    filters: Optional[Dict[str, Any]] = Body(None, description="Filter criteria (field: value)")
    limit: int = Body(100, description="Max results (default 100, max 1000)")
    offset: int = Body(0, description="Pagination offset (default 0)")


class QueryResponse(BaseModel):
    """Generic layer query response."""
    layer: str
    count: int
    results: List[Dict[str, Any]]
    filters_applied: Optional[Dict[str, Any]] = None
    pagination: Dict[str, int]
    query_time_ms: float


# ── Endpoint: POST /model/query ──────────────────────────────────────────

@router.post(
    "/query",
    summary="Query any layer with filtering and pagination",
    description="Generic query interface for discovering objects across all layers",
    response_model=QueryResponse,
)
async def query_layer(
    req: QueryRequest,
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
) -> QueryResponse:
    """
    Generic query endpoint for retrieving objects from any layer.

    **Supported Layers**: project_work, evidence, sprints, wbs, risks, decisions,
    quality_gates, verification_records, and all other data model layers.

    **Filtering**: Pass a dict with field:value pairs to filter results.
    Example: `{"project_id": "61-govops", "status": "active"}`

    **Pagination**: Use limit (default 100) and offset (default 0) for pagination.

    **Returns**:
    - count: number of results
    - results: array of matching objects
    - pagination: {limit, offset} used in query
    - query_time_ms: query execution time

    **Example**:
    ```bash
    curl -X POST https://api.example.com/model/query \
      -H "Content-Type: application/json" \
      -d '{
        "layer": "project_work",
        "filters": {"project_id": "61-govops"},
        "limit": 50,
        "offset": 0
      }'
    ```
    """
    import time

    start_time = time.time()

    # ── Validation ──────────────────────────────────────────────────────────
    if not req.layer or not isinstance(req.layer, str):
        raise HTTPException(400, detail="layer must be a non-empty string")

    if req.limit < 1 or req.limit > 1000:
        raise HTTPException(400, detail="limit must be between 1 and 1000")

    if req.offset < 0:
        raise HTTPException(400, detail="offset must be >= 0")

    # ── Query ───────────────────────────────────────────────────────────────
    try:
        # Get all objects from layer (store.query() may not exist yet, so use get_all)
        # TODO: Implement store.query(layer, filters) helper for proper filtering
        all_objects = await store.get_all(layer=req.layer, active_only=True)

        # Apply filters (simple dict-based filtering)
        if req.filters:
            filtered = []
            for obj in all_objects:
                match = True
                for key, expected_value in req.filters.items():
                    # Support nested keys (e.g., "validation.result")
                    obj_value = obj
                    for key_part in key.split("."):
                        if isinstance(obj_value, dict):
                            obj_value = obj_value.get(key_part)
                        else:
                            obj_value = None
                            break

                    if obj_value != expected_value:
                        match = False
                        break

                if match:
                    filtered.append(obj)
            results = filtered
        else:
            results = all_objects

        # Apply pagination
        paginated = results[req.offset : req.offset + req.limit]

        query_time_ms = (time.time() - start_time) * 1000

        return QueryResponse(
            layer=req.layer,
            count=len(paginated),
            results=paginated,
            filters_applied=req.filters,
            pagination={"limit": req.limit, "offset": req.offset},
            query_time_ms=query_time_ms,
        )

    except Exception as exc:
        raise HTTPException(
            500,
            detail={
                "error": "Query failed",
                "layer": req.layer,
                "reason": str(exc),
            },
        )


# ── Endpoint: GET /model/query (Alternative — QS params) ─────────────────

@router.get(
    "/query",
    summary="Query any layer (query string version)",
    description="Alternative query endpoint using query parameters instead of JSON body",
    response_model=QueryResponse,
)
async def query_layer_qs(
    layer: str = QueryParam(..., description="Layer to query"),
    filter_field: Optional[str] = QueryParam(None, description="Filter field name"),
    filter_value: Optional[str] = QueryParam(None, description="Filter field value"),
    limit: int = QueryParam(100, description="Max results"),
    offset: int = QueryParam(0, description="Pagination offset"),
    store: AbstractStore = Depends(get_store),
    cache: AbstractCache = Depends(get_cache),
) -> QueryResponse:
    """
    Query endpoint using query string parameters (alternative to POST).

    **Example**:
    ```
    GET /model/query?layer=project_work&filter_field=project_id&filter_value=61-govops&limit=50
    ```
    """
    # Convert QS params to filter dict
    filters = {}
    if filter_field and filter_value:
        filters[filter_field] = filter_value

    # Re-use POST handler logic
    req = QueryRequest(
        layer=layer,
        filters=filters if filters else None,
        limit=limit,
        offset=offset,
    )

    return await query_layer(req, store, cache)
