"""
Schema Introspection Router — Self-documenting layer metadata

Provides schema details, example objects, field lists, and fast counts for all layers.
Enables agents to discover the data model structure without trial-and-error.

ENHANCEMENT 2 from AGENT-EXPERIENCE-AUDIT.md (Session 26, 2026-03-05)
"""
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

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
                "hint": "Try /model/layers to see available layers with schemas"
            }
        )
    
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


# ── GET /model/{layer}/fields — Return field name array ────────────────────
@router.get(
    "/{layer}/fields",
    summary="Get field names for layer",
    description="Returns list of field names from the layer's JSON schema"
)
async def get_fields(layer: str):
    """
    Return array of field names defined in the layer's schema.
    Useful for discovering what query parameters are valid.
    
    Example:
        GET /model/projects/fields → ["id", "label", "maturity", ...]
        GET /model/evidence/fields → ["id", "sprint_id", "phase", ...]
    """
    schema_path = _get_schema_path(layer)
    
    if not schema_path:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Schema not found",
                "layer": layer,
                "hint": "Try /model/layers to see available layers"
            }
        )
    
    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_data = json.load(f)
        
        # Extract field names from properties
        properties = schema_data.get("properties", {})
        fields = list(properties.keys())
        
        # Get required fields
        required = schema_data.get("required", [])
        
        return JSONResponse(content={
            "layer": layer,
            "fields": fields,
            "required": required,
            "total": len(fields),
            "schema_file": schema_path.name
        })
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to read schema", "reason": str(e)}
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
        placeholders = sum(1 for obj in objects if obj.get("id", "").endswith("..."))
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
    
    # List of all known layers (from layers.py)
    known_layers = [
        "services", "personas", "feature_flags", "containers", "schemas", 
        "screens", "literals", "agents", "infrastructure", "requirements",
        "planes", "connections", "environments", "cp_skills", "cp_agents",
        "runbooks", "cp_workflows", "cp_policies", "mcp_servers", "prompts",
        "security_controls", "components", "hooks", "ts_types", "projects",
        "wbs", "sprints", "milestones", "risks", "decisions", "traces",
        "evidence", "workspace_config", "project_work"
    ]
    
    layers_info = []
    
    for layer in known_layers:
        # Check if schema exists
        schema_path = _get_schema_path(layer)
        has_schema = schema_path is not None
        
        # Get count if possible
        try:
            objects = await store.get_all(layer)
            count = len(objects)
            placeholders = sum(1 for obj in objects if obj.get("id", "").endswith("..."))
            real_count = count - placeholders
        except:
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
    
    return JSONResponse(content={
        "layers": layers_info,
        "summary": {
            "total_layers": len(known_layers),
            "active_layers": active_layers,
            "total_objects": total_objects,
            "layers_with_schemas": sum(1 for layer in layers_info if layer["has_schema"])
        }
    })
