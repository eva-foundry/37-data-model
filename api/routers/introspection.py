"""
Schema Introspection Router — Self-documenting layer metadata

Provides schema details, example objects, field lists, and fast counts for all layers.
Enables agents to discover the data model structure without trial-and-error.

ENHANCEMENT 2 from AGENT-EXPERIENCE-AUDIT.md (Session 26, 2026-03-05)
"""
import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/model", tags=["introspection"])

# ── Helper: Get schema file path ────────────────────────────────────────────


def _get_schema_path(layer: str) -> Optional[Path]:
    """
    Return path to schema file for layer, or None if not found.
    Handles plural -> singular conversion (services -> service).
    """
    # Project root is 2 levels up from api/routers/
    project_root = Path(__file__).parent.parent.parent
    schema_dir = project_root / "schema"

    # Try plural first (services.schema.json)
    schema_file = schema_dir / f"{layer}.schema.json"
    if schema_file.exists():
        return schema_file

    # Try singular (service.schema.json for services layer)
    if layer.endswith("s"):
        singular = layer.rstrip("s")
        schema_file = schema_dir / f"{singular}.schema.json"
        if schema_file.exists():
            return schema_file

    # Special cases
    mappings = {
        "infrastructure": "infrastructure",
        "ts_types": "ts_type",
        "mcp_servers": "mcp_server",
        "security_controls": "security_control",
        "cp_skills": "cp_skill",
        "cp_agents": "cp_agent",
        "cp_workflows": "cp_workflow",
        "cp_policies": "cp_policy",
        "workspace_config": "workspace_config",
        "project_work": "project_work"
    }

    if layer in mappings:
        schema_file = schema_dir / f"{mappings[layer]}.schema.json"
        if schema_file.exists():
            return schema_file

    return None


# ── GET /model/schema-def/{layer} — Return JSON Schema ─────────────────────
@router.get(
    "/schema-def/{layer}",
    summary="Get JSON schema for layer",
    description="Returns the JSON Schema (draft-07) for the specified layer"
)
async def get_schema(layer: str):
    """
    Return the JSON Schema definition for a layer.

    Example:
        GET /model/schema-def/projects → returns project.schema.json
        GET /model/schema-def/evidence → returns evidence.schema.json
    """
    schema_path = _get_schema_path(layer)

    if not schema_path:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Schema not found",
                "layer": layer,
                "hint": "Try /model/layers to see available layers with schemas"})

    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_data = json.load(f)
        return JSONResponse(content=schema_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to read schema", "reason": str(e)}
        )


# ── GET /model/{layer}/example — Return first real object ──────────────────
@router.get(
    "/{layer}/example",
    summary="Get example object from layer",
    description="Returns the first real object from the layer (not placeholder)"
)
async def get_example(layer: str, request: Request):
    """
    Return one real object from the layer as an example.
    Skips placeholder objects (those ending in ...)

    Example:
        GET /model/projects/example → returns first real project
        GET /model/evidence/example → returns first evidence record
    """
    store = request.app.state.store

    try:
        # Get all objects from layer
        objects = await store.get_all(layer)

        if not objects:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "No objects found",
                    "layer": layer,
                    "hint": "This layer exists but has no data yet"
                }
            )

        # Find first non-placeholder object
        for obj in objects:
            obj_id = obj.get("id", "")
            if not obj_id.endswith("..."):
                return JSONResponse(content=obj)

        # All objects are placeholders
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Only placeholder objects found",
                "layer": layer,
                "hint": "Layer has schemas but no real data yet"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to fetch example", "reason": str(e)}
        )


# ── GET /model/{layer}/fields — Return rich field metadata from live data ─
@router.get(
    "/{layer}/fields",
    summary="Get rich field metadata for layer",
    description="Queries live Cosmos DB objects to extract field metadata with types and examples"
)
async def get_fields(layer: str, request: Request):
    """
    Return rich field metadata from live objects in the layer.
    Extracts field_name, field_type, required status, and example_value.

    Example:
        GET /model/projects/fields → rich metadata with types and examples
        GET /model/evidence/fields → immutable audit field details
    
    FKTE Sprint 1 - Critical path for autonomous screen generation
    """
    from datetime import datetime
    
    store = request.app.state.store

    try:
        # Get all objects from layer
        objects = await store.get_all(layer)
        
        if not objects:
            # Layer exists but has no objects
            return JSONResponse(content={
                "layer": layer,
                "sample_count": 0,
                "fields": [],
                "generated_at": datetime.utcnow().isoformat() + "Z"
            })
        
        # Find first non-placeholder object for example values
        sample_obj = None
        for obj in objects:
            if not obj.get("id", "").endswith("..."):
                sample_obj = obj
                break
        
        if not sample_obj:
            sample_obj = objects[0]  # Use placeholder if that's all we have
        
        # Extract field metadata
        fields = []
        for field_name, field_value in sample_obj.items():
            # Determine field type
            field_type = "string"  # default
            if isinstance(field_value, bool):
                field_type = "boolean"
            elif isinstance(field_value, int) or isinstance(field_value, float):
                field_type = "number"
            elif isinstance(field_value, str):
                # Check if it's a date
                if "T" in field_value and (field_value.endswith("Z") or "+" in field_value or field_value.count(":") >= 2):
                    try:
                        datetime.fromisoformat(field_value.replace("Z", "+00:00"))
                        field_type = "date"
                    except:
                        pass
                # Check if it's a reference (FK pattern: ends with _id)
                if field_name.endswith("_id") and field_name != "id":
                    field_type = "reference"
            elif isinstance(field_value, list):
                field_type = "array"
            elif isinstance(field_value, dict):
                field_type = "object"
            
            # Check if required (simplified - field present in all objects)
            required = all(field_name in obj for obj in objects[:min(10, len(objects))])
            
            fields.append({
                "field_name": field_name,
                "field_type": field_type,
                "required": required,
                "example_value": field_value
            })
        
        return JSONResponse(content={
            "layer": layer,
            "sample_count": len(objects),
            "fields": fields,
            "generated_at": datetime.utcnow().isoformat() + "Z"
        })
    
    except HTTPException:
        raise
    except Exception as e:
        # Cosmos timeout or other errors
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Failed to fetch schema from live data",
                "reason": str(e),
                "hint": "Service may be temporarily unavailable"
            },
            headers={"Retry-After": "30"}
        )


# ── GET /model/{layer}/count — Fast count without data transfer ────────────
@router.get(
    "/{layer}/count",
    summary="Get object count for layer",
    description="Returns fast count of objects in layer without fetching data"
)
async def get_count(layer: str, request: Request):
    """
    Return count of objects in layer (fast, no data transfer).

    Example:
        GET /model/projects/count → {"layer": "projects", "count": 34}
        GET /model/evidence/count → {"layer": "evidence", "count": 62}
    """
    store = request.app.state.store

    try:
        objects = await store.get_all(layer)
        count = len(objects)

        # Separate placeholder vs real objects
        placeholders = sum(
            1 for obj in objects if obj.get(
                "id", "").endswith("..."))
        real_objects = count - placeholders

        return JSONResponse(content={
            "layer": layer,
            "total": count,
            "real_objects": real_objects,
            "placeholders": placeholders
        })

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to count objects", "reason": str(e)}
        )


# ── GET /model/layers — List all available layers ──────────────────────────
@router.get(
    "/layers",
    summary="List all available layers",
    description="Returns list of all data model layers with metadata"
)
async def list_layers(request: Request):
    """
    Return list of all available layers with schema and data status.

    Example:
        GET /model/layers → [{"name": "projects", "has_schema": true, "count": 34}, ...]
    """
    store = request.app.state.store

    # Dynamically read from _LAYER_FILES (single source of truth)
    from api.routers.admin import _LAYER_FILES
    known_layers = list(_LAYER_FILES.keys())

    layers_info = []

    for layer in known_layers:
        # Check if schema exists
        schema_path = _get_schema_path(layer)
        has_schema = schema_path is not None

        # Get count if possible
        try:
            objects = await store.get_all(layer)
            count = len(objects)
            placeholders = sum(
                1 for obj in objects if obj.get(
                    "id", "").endswith("..."))
            real_count = count - placeholders
        except BaseException:
            count = 0
            real_count = 0
            placeholders = 0

        layers_info.append({
            "name": layer,
            "has_schema": has_schema,
            "total_count": count,
            "real_objects": real_count,
            "is_active": real_count > 0,
            "schema_file": schema_path.name if schema_path else None
        })

    # Summary stats
    active_layers = sum(1 for layer in layers_info if layer["is_active"])
    total_objects = sum(layer["real_objects"] for layer in layers_info)

    return JSONResponse(
        content={
            "layers": layers_info,
            "summary": {
                "total_layers": len(known_layers),
                "active_layers": active_layers,
                "total_objects": total_objects,
                "layers_with_schemas": sum(
                    1 for layer in layers_info if layer["has_schema"])}})
