"""
Graph response models for GET /model/graph.

A node is any EVA model object (identified by id + layer).
An edge is a typed, directed relationship between two nodes (from → to).
"""
from __future__ import annotations

from typing import Any
from pydantic import BaseModel


class GraphNode(BaseModel):
    """A node in the EVA object graph — one model object from any layer."""
    id: str
    layer: str
    label: str | None = None
    status: str | None = None

    @classmethod
    def from_obj(cls, obj: dict[str, Any], layer: str) -> "GraphNode":
        return cls(
            id=obj.get("id") or obj.get("obj_id") or "",
            layer=layer,
            label=obj.get("label") or obj.get("summary") or obj.get("title") or None,
            status=obj.get("status") or None,
        )


class GraphEdge(BaseModel):
    """A typed, directed edge between two nodes."""
    from_id: str
    from_layer: str
    to_id: str
    to_layer: str
    edge_type: str
    via_field: str  # the source field that encodes this relationship


class EdgeTypeMeta(BaseModel):
    """Describes one edge type in the vocabulary."""
    edge_type: str
    from_layer: str
    to_layer: str
    via_field: str
    cardinality: str  # "many-to-one" | "many-to-many" | "one-to-many"
    description: str


class GraphResponse(BaseModel):
    """Full graph response returned by GET /model/graph."""
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    meta: dict[str, Any]
