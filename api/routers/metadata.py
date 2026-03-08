"""
Layer Metadata Router — Query and filter layer catalog metadata

Provides comprehensive layer metadata including operational status, FK relationships,
categories, priorities, and schema information. Supports filtering and sorting.

Created: Session 41 Phase 2 (March 8, 2026 @ 6:58 PM ET)
"""
import json
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/model", tags=["metadata"])


# ── Helper: Load layer-metadata-index.json ──────────────────────────────────
def _load_metadata_index() -> dict:
    """Load the layer metadata index from model/ directory."""
    project_root = Path(__file__).parent.parent.parent
    metadata_file = project_root / "model" / "layer-metadata-index.json"
    
    if not metadata_file.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Metadata index not found: {metadata_file}"
        )
    
    with open(metadata_file, "r", encoding="utf-8") as f:
        return json.load(f)


# ── GET /model/layer-metadata/ — Query layer metadata ───────────────────────
@router.get(
    "/layer-metadata/",
    summary="Query layer metadata with filters",
    description="""
    Get metadata for all 51 EVA Data Model layers with optional filtering and sorting.
    
    **Query Parameters:**
    - `operational`: Filter by operational status (true/false)
    - `priority`: Filter by priority (comma-separated: P0,P1,P2,P3,P4)
    - `category`: Filter by category (Foundation, Governance, Infrastructure, Operations, Remediation)
    - `sort`: Sort field (layer_number, layer_name, priority, category, operational)
    - `with_fk`: Filter layers with FK relationships (true/false)
    
    **Example Queries:**
    - `GET /model/layer-metadata/` → All 51 layers
    - `GET /model/layer-metadata/?operational=true` → Only operational layers
    - `GET /model/layer-metadata/?priority=P0,P1` → P0 and P1 priority layers
    - `GET /model/layer-metadata/?category=Foundation` → Foundation layers only
    - `GET /model/layer-metadata/?operational=true&with_fk=true` → Operational layers with FKs
    - `GET /model/layer-metadata/?sort=layer_name` → Sorted alphabetically
    
    **Response Structure:**
    ```json
    {
        "data": [
            {
                "layer_number": 1,
                "layer_name": "projects",
                "description": "Project catalog with 56 numbered initiatives",
                "priority": "P0",
                "category": "Foundation",
                "operational": true,
                "schema_file": "project.schema.json",
                "fk_references": [],
                "referenced_by": ["sprints", "wbs", "evidence"],
                "automation": "manual",
                "notes": "Core foundation layer"
            }
        ],
        "metadata": {
            "total_layers": 51,
            "filtered_count": 19,
            "operational_count": 19,
            "last_updated": "2026-03-08T18:58:00Z"
        }
    }
    ```
    """
)
async def get_layer_metadata(
    operational: Optional[bool] = Query(None, description="Filter by operational status"),
    priority: Optional[str] = Query(None, regex="^(P0|P1|P2|P3|P4)(,(P0|P1|P2|P3|P4))*$", description="Filter by priority (comma-separated)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    sort: str = Query("layer_number", regex="^(layer_number|layer_name|priority|category|operational)$", description="Sort field"),
    with_fk: Optional[bool] = Query(None, description="Filter layers with FK relationships")
):
    """
    Query layer metadata with optional filters and sorting.
    
    Returns comprehensive metadata for EVA Data Model layers including:
    - Layer number, name, description
    - Priority (P0-P4) and category
    - Operational status and automation level
    - FK relationships (outbound and inbound)
    - Schema file reference
    """
    # Load metadata index
    metadata_index = _load_metadata_index()
    layers = metadata_index.get("layers", [])
    
    # Apply filters
    filtered_layers = layers
    
    if operational is not None:
        filtered_layers = [l for l in filtered_layers if l.get("operational") == operational]
    
    if priority:
        priorities = priority.split(",")
        filtered_layers = [l for l in filtered_layers if l.get("priority") in priorities]
    
    if category:
        filtered_layers = [l for l in filtered_layers if l.get("category") == category]
    
    if with_fk is not None:
        if with_fk:
            # Has FK relationships (either outbound or inbound)
            filtered_layers = [
                l for l in filtered_layers 
                if (l.get("fk_references") and len(l.get("fk_references", [])) > 0) or
                   (l.get("referenced_by") and len(l.get("referenced_by", [])) > 0)
            ]
        else:
            # No FK relationships
            filtered_layers = [
                l for l in filtered_layers 
                if (not l.get("fk_references") or len(l.get("fk_references", [])) == 0) and
                   (not l.get("referenced_by") or len(l.get("referenced_by", [])) == 0)
            ]
    
    # Sort
    sort_key = {
        "layer_number": lambda x: x.get("layer_number", 999),
        "layer_name": lambda x: x.get("layer_name", ""),
        "priority": lambda x: x.get("priority", "P9"),
        "category": lambda x: x.get("category", ""),
        "operational": lambda x: (0 if x.get("operational") else 1, x.get("layer_number", 999))
    }.get(sort, lambda x: x.get("layer_number", 999))
    
    filtered_layers = sorted(filtered_layers, key=sort_key)
    
    # Calculate metadata
    operational_count = sum(1 for l in layers if l.get("operational"))
    
    return {
        "data": filtered_layers,
        "metadata": {
            "total_layers": len(layers),
            "filtered_count": len(filtered_layers),
            "operational_count": operational_count,
            "stub_count": len(layers) - operational_count,
            "last_updated": metadata_index.get("last_updated", "2026-03-08T18:58:00Z"),
            "fk_matrix_available": "fk_matrix" in metadata_index
        }
    }


# ── GET /model/layer-metadata/{layer} — Get specific layer metadata ─────────
@router.get(
    "/layer-metadata/{layer}",
    summary="Get metadata for specific layer",
    description="Returns metadata for a single layer by name or number"
)
async def get_layer_metadata_by_name(layer: str):
    """
    Get metadata for a specific layer.
    
    Examples:
        GET /model/layer-metadata/projects → Layer 1 metadata
        GET /model/layer-metadata/48 → Remediation policies metadata
    """
    metadata_index = _load_metadata_index()
    layers = metadata_index.get("layers", [])
    
    # Try to find by number first (if numeric)
    if layer.isdigit():
        layer_num = int(layer)
        found = next((l for l in layers if l.get("layer_number") == layer_num), None)
        if found:
            return found
    
    # Try to find by name
    found = next((l for l in layers if l.get("layer_name") == layer), None)
    
    if not found:
        raise HTTPException(
            status_code=404,
            detail=f"Layer not found: {layer}. Use /model/layer-metadata/ to list all layers."
        )
    
    return found


# ── GET /model/fk-matrix — Get FK relationship matrix ───────────────────────
@router.get(
    "/fk-matrix",
    summary="Get FK relationship matrix",
    description="Returns the complete foreign key relationship matrix for all layers"
)
async def get_fk_matrix():
    """
    Get the complete FK relationship matrix.
    
    Returns a matrix showing all foreign key relationships between layers,
    including both outbound (references) and inbound (referenced_by) relationships.
    
    Example response:
    ```json
    {
        "remediation_policies": {
            "outbound": ["agent_policies", "deployment_policies"],
            "inbound": ["auto_fix_execution_history", "remediation_effectiveness"]
        },
        "auto_fix_execution_history": {
            "outbound": ["remediation_policies", "agent_performance_metrics"],
            "inbound": ["remediation_outcomes"]
        }
    }
    ```
    """
    metadata_index = _load_metadata_index()
    
    if "fk_matrix" not in metadata_index:
        raise HTTPException(
            status_code=404,
            detail="FK matrix not available in metadata index"
        )
    
    return {
        "fk_matrix": metadata_index["fk_matrix"],
        "layer_count": len(metadata_index.get("layers", [])),
        "last_updated": metadata_index.get("last_updated")
    }
