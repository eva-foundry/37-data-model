"""
Graph endpoint -- typed edge list across all 27 EVA model layers.

GET /model/graph                                  All nodes and edges
GET /model/graph?from_layer=screens&to_layer=endpoints
GET /model/graph?edge_type=calls
GET /model/graph?node_id=TranslationsPage&depth=1
GET /model/graph?node_id=TranslationsPage&depth=2
GET /model/graph?format=mermaid                   Mermaid flowchart diagram string
GET /model/graph/edge-types                       Vocabulary of all edge types

Design:
  - All relationship fields are already encoded in the JSON (api_calls,
    cosmos_reads, depends_on, etc.).  This router materialises them as a
    typed, directed edge list without modifying any stored data.
  - BFS traversal with visited-set cycle guard for depth queries.
  - Every edge is derived from a single source field in one layer -- no
    implicit or inferred edges.
  - Mermaid output: sanitises node IDs, renders as `flowchart LR` diagram.
"""
from __future__ import annotations

import re
import time
from typing import Any

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse

from api.store.base import AbstractStore
from api.cache.base import AbstractCache
from api.dependencies import get_store, get_cache
from api.config import Settings, get_settings
from api.models.graph import GraphNode, GraphEdge, GraphResponse, EdgeTypeMeta

router = APIRouter(prefix="/model/graph", tags=["graph"])


# ── Edge type vocabulary ───────────────────────────────────────────────────────
# Each entry defines one directed edge type between two layers via one field.

EDGE_TYPES: list[EdgeTypeMeta] = [
    EdgeTypeMeta(edge_type="calls",          from_layer="screens",       to_layer="endpoints",      via_field="api_calls",         cardinality="many-to-many", description="Screen calls endpoint"),
    EdgeTypeMeta(edge_type="reads",          from_layer="endpoints",     to_layer="containers",     via_field="cosmos_reads",      cardinality="many-to-many", description="Endpoint reads from Cosmos container"),
    EdgeTypeMeta(edge_type="writes",         from_layer="endpoints",     to_layer="containers",     via_field="cosmos_writes",     cardinality="many-to-many", description="Endpoint writes to Cosmos container"),
    EdgeTypeMeta(edge_type="uses_component", from_layer="screens",       to_layer="components",     via_field="components",        cardinality="many-to-many", description="Screen uses React component"),
    EdgeTypeMeta(edge_type="uses_hook",      from_layer="screens",       to_layer="hooks",          via_field="hooks",             cardinality="many-to-many", description="Screen uses custom hook"),
    EdgeTypeMeta(edge_type="hook_calls",     from_layer="hooks",         to_layer="endpoints",      via_field="calls_endpoints",   cardinality="many-to-many", description="Hook calls endpoint"),
    EdgeTypeMeta(edge_type="implemented_by", from_layer="endpoints",     to_layer="services",       via_field="service",           cardinality="many-to-one",  description="Endpoint is implemented in service"),
    EdgeTypeMeta(edge_type="depends_on",     from_layer="services",      to_layer="services",       via_field="depends_on",        cardinality="many-to-many", description="Service depends on another service"),
    EdgeTypeMeta(edge_type="gated_by",       from_layer="endpoints",     to_layer="feature_flags",  via_field="feature_flag",      cardinality="many-to-one",  description="Endpoint is gated by feature flag"),
    EdgeTypeMeta(edge_type="reads_schema",   from_layer="endpoints",     to_layer="schemas",        via_field="request_schema",    cardinality="many-to-one",  description="Endpoint request body uses schema"),
    EdgeTypeMeta(edge_type="writes_schema",  from_layer="endpoints",     to_layer="schemas",        via_field="response_schema",   cardinality="many-to-one",  description="Endpoint response uses schema"),
    EdgeTypeMeta(edge_type="agent_reads",    from_layer="agents",        to_layer="endpoints",      via_field="input_endpoints",   cardinality="many-to-many", description="Agent reads from endpoint"),
    EdgeTypeMeta(edge_type="agent_outputs",  from_layer="agents",        to_layer="screens",        via_field="output_screens",    cardinality="many-to-many", description="Agent produces output consumed by screen"),
    EdgeTypeMeta(edge_type="satisfies",      from_layer="endpoints",     to_layer="requirements",   via_field="satisfied_by",      cardinality="many-to-many", description="Endpoint satisfies requirement (inverse lookup)"),
    EdgeTypeMeta(edge_type="wbs_depends",    from_layer="wbs",           to_layer="wbs",            via_field="depends_on_wbs",    cardinality="many-to-many", description="WBS node depends on another WBS node"),
    EdgeTypeMeta(edge_type="project_depends",from_layer="projects",      to_layer="projects",       via_field="depends_on",        cardinality="many-to-many", description="Project depends on another project"),
    EdgeTypeMeta(edge_type="project_wbs",    from_layer="projects",      to_layer="wbs",            via_field="wbs_id",            cardinality="many-to-one",  description="Project has WBS root node"),
    EdgeTypeMeta(edge_type="persona_flags",  from_layer="personas",      to_layer="feature_flags",  via_field="feature_flags",     cardinality="many-to-many", description="Persona can access feature flag"),
    EdgeTypeMeta(edge_type="runbook_skill",  from_layer="runbooks",      to_layer="cp_skills",      via_field="skills",            cardinality="many-to-many", description="Runbook exercises a control-plane skill"),
    EdgeTypeMeta(edge_type="wbs_runbook",    from_layer="wbs",           to_layer="runbooks",       via_field="ci_runbook",        cardinality="many-to-one",  description="WBS node references CI runbook evidence"),
]

# Fast lookup by edge_type string
_EDGE_TYPE_MAP: dict[str, EdgeTypeMeta] = {e.edge_type: e for e in EDGE_TYPES}


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _layer(
    name: str,
    store: AbstractStore,
    cache: AbstractCache,
    ttl: int,
) -> list[dict[str, Any]]:
    cached = await cache.get_layer(name)
    if cached is not None:
        return cached
    data = await store.get_all(name, active_only=True)
    await cache.set_layer(name, data, ttl)
    return data


def _obj_id(obj: dict) -> str:
    return str(obj.get("id") or obj.get("obj_id") or "")


def _extract_edges(
    objects: list[dict[str, Any]],
    from_layer: str,
    meta: EdgeTypeMeta,
) -> list[GraphEdge]:
    """
    Scan `objects` (all from `from_layer`) and produce one GraphEdge
    per relationship value found in `meta.via_field`.

    Handles both scalar (str) and list (str[]) field shapes.
    For `satisfies` the direction is inverted: the to-layer object (requirement)
    carries `satisfied_by` pointing back at endpoints — so we emit the edge
    from the endpoint toward the requirement rather than the reverse.
    """
    edges: list[GraphEdge] = []
    for obj in objects:
        src_id = _obj_id(obj)
        if not src_id:
            continue
        raw = obj.get(meta.via_field)
        if raw is None:
            continue
        targets: list[str] = raw if isinstance(raw, list) else [raw]
        for tgt in targets:
            if tgt:
                edges.append(GraphEdge(
                    from_id=src_id,
                    from_layer=from_layer,
                    to_id=str(tgt),
                    to_layer=meta.to_layer,
                    edge_type=meta.edge_type,
                    via_field=meta.via_field,
                ))
    return edges


async def _build_all_edges(
    store: AbstractStore,
    cache: AbstractCache,
    ttl: int,
    edge_type_filter: str | None = None,
    from_layer_filter: str | None = None,
    to_layer_filter: str | None = None,
) -> list[GraphEdge]:
    """
    Build the full edge list (or a filtered subset) by scanning all relevant layers.
    The special `satisfies` edge type reads requirements and emits endpoint→requirement
    edges via the `satisfied_by` list on each requirement.
    """
    all_edges: list[GraphEdge] = []

    # Determine which edge types to materialise
    types_to_build = EDGE_TYPES
    if edge_type_filter:
        types_to_build = [e for e in EDGE_TYPES if e.edge_type == edge_type_filter]
    if from_layer_filter:
        types_to_build = [e for e in types_to_build if e.from_layer == from_layer_filter]
    if to_layer_filter:
        types_to_build = [e for e in types_to_build if e.to_layer == to_layer_filter]

    # Cache loaded layers to avoid redundant store calls
    layer_cache: dict[str, list[dict]] = {}

    async def _get(name: str) -> list[dict]:
        if name not in layer_cache:
            layer_cache[name] = await _layer(name, store, cache, ttl)
        return layer_cache[name]

    for meta in types_to_build:
        # `satisfies` is a special inverse edge: requirements.satisfied_by → endpoint
        # We emit endpoint → requirement edges by scanning requirements layer
        if meta.edge_type == "satisfies":
            reqs = await _get("requirements")
            for req in reqs:
                req_id = _obj_id(req)
                for ep_id in req.get("satisfied_by") or []:
                    all_edges.append(GraphEdge(
                        from_id=str(ep_id),
                        from_layer="endpoints",
                        to_id=req_id,
                        to_layer="requirements",
                        edge_type="satisfies",
                        via_field="satisfied_by",
                    ))
        else:
            objs = await _get(meta.from_layer)
            all_edges.extend(_extract_edges(objs, meta.from_layer, meta))

    return all_edges


def _bfs_subgraph(
    node_id: str,
    depth: int,
    all_edges: list[GraphEdge],
) -> tuple[set[str], list[GraphEdge]]:
    """
    BFS from `node_id` up to `depth` hops in either direction.
    Returns the set of visited node keys ("id|layer") and matching edges.
    """
    # Key: "id|layer" to avoid cross-layer collisions
    def _key(eid: str, elayer: str) -> str:
        return f"{eid}|{elayer}"

    # Build adjacency index: node_key → edges touching it
    adj: dict[str, list[GraphEdge]] = {}
    for e in all_edges:
        fk = _key(e.from_id, e.from_layer)
        tk = _key(e.to_id, e.to_layer)
        adj.setdefault(fk, []).append(e)
        adj.setdefault(tk, []).append(e)

    # Find the starting node across all layers it might appear in
    start_keys = [k for k in adj if k.startswith(f"{node_id}|")]
    if not start_keys:
        # node_id might be isolated — start with it in visited anyway
        start_keys = [f"{node_id}|unknown"]

    visited: set[str] = set(start_keys)
    frontier: set[str] = set(start_keys)
    matched_edges: list[GraphEdge] = []
    seen_edge_ids: set[tuple] = set()

    for _ in range(depth):
        next_frontier: set[str] = set()
        for nk in frontier:
            for e in adj.get(nk, []):
                eid = (e.from_id, e.from_layer, e.to_id, e.to_layer, e.edge_type)
                if eid not in seen_edge_ids:
                    matched_edges.append(e)
                    seen_edge_ids.add(eid)
                fk = _key(e.from_id, e.from_layer)
                tk = _key(e.to_id, e.to_layer)
                for k in (fk, tk):
                    if k not in visited:
                        visited.add(k)
                        next_frontier.add(k)
        frontier = next_frontier

    return visited, matched_edges


# ── Mermaid output ─────────────────────────────────────────────────────────────

def _safe_mid(node_id: str, layer: str) -> str:
    """Return a Mermaid-safe node identifier prefixed with layer."""
    safe = re.sub(r"[^a-zA-Z0-9]", "_", node_id)
    safe_layer = re.sub(r"[^a-zA-Z0-9]", "_", layer)
    return f"{safe_layer}__{safe}"


def _to_mermaid(nodes: list[GraphNode], edges: list[GraphEdge]) -> str:
    """Convert a GraphNode/GraphEdge list to a Mermaid flowchart LR diagram.

    Node IDs are sanitised (non-alphanumeric -> underscore) and prefixed
    with their layer so same-id nodes in different layers stay distinct.
    """
    lines: list[str] = ["flowchart LR"]

    # Emit node definitions (id["label (layer)"])
    for n in nodes:
        mid = _safe_mid(n.id, n.layer)
        label = (n.label or n.id).replace('"', "'")
        lines.append(f'    {mid}["{label} ({n.layer})"]')

    # Emit edges (from -->|edge_type| to)
    for e in edges:
        fmid = _safe_mid(e.from_id, e.from_layer)
        tmid = _safe_mid(e.to_id, e.to_layer)
        lines.append(f"    {fmid} -->|{e.edge_type}| {tmid}")

    return "\n".join(lines)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get(
    "/edge-types",
    summary="Vocabulary of all edge types across the 27-layer model",
)
async def get_edge_types() -> list[dict[str, Any]]:
    return [e.model_dump() for e in EDGE_TYPES]


@router.get(
    "/",
    summary="Typed edge list -- full graph or filtered/traversed subgraph. Pass ?format=mermaid for Mermaid diagram output.",
)
async def get_graph(
    from_layer: str | None = Query(None, description="Filter: only edges whose from-node is in this layer"),
    to_layer:   str | None = Query(None, description="Filter: only edges whose to-node is in this layer"),
    edge_type:  str | None = Query(None, description="Filter: only edges of this type"),
    node_id:    str | None = Query(None, description="BFS root node id -- combined with depth"),
    depth:      int        = Query(1,   ge=1, le=5, description="BFS hop depth (default 1, max 5)"),
    fmt:        str | None = Query(None, alias="format", description="Output format: omit for JSON, 'mermaid' for Mermaid flowchart text"),
    store: AbstractStore   = Depends(get_store),
    cache: AbstractCache   = Depends(get_cache),
    settings: Settings     = Depends(get_settings),
) -> Any:
    t0 = time.monotonic()

    # When node_id + depth is used, we need the full unfiltered edge list for BFS,
    # then apply layer/type filters to the subgraph result.
    bfs_mode = node_id is not None

    edges = await _build_all_edges(
        store, cache, settings.cache_ttl_seconds,
        edge_type_filter=None if bfs_mode else edge_type,
        from_layer_filter=None if bfs_mode else from_layer,
        to_layer_filter=None if bfs_mode else to_layer,
    )

    if bfs_mode:
        _, edges = _bfs_subgraph(node_id, depth, edges)
        # Apply any additional filters to the BFS result
        if edge_type:
            edges = [e for e in edges if e.edge_type == edge_type]
        if from_layer:
            edges = [e for e in edges if e.from_layer == from_layer]
        if to_layer:
            edges = [e for e in edges if e.to_layer == to_layer]

    # Collect unique nodes from edges
    node_keys: dict[str, GraphNode] = {}
    for e in edges:
        fk = f"{e.from_id}|{e.from_layer}"
        tk = f"{e.to_id}|{e.to_layer}"
        if fk not in node_keys:
            node_keys[fk] = GraphNode(id=e.from_id, layer=e.from_layer)
        if tk not in node_keys:
            node_keys[tk] = GraphNode(id=e.to_id, layer=e.to_layer)

    # Enrich nodes with label + status from the store (best-effort, no 404 on miss)
    layer_cache2: dict[str, dict[str, dict]] = {}
    for nk, node in node_keys.items():
        lyr = node.layer
        if lyr not in layer_cache2:
            try:
                objs = await _layer(lyr, store, cache, settings.cache_ttl_seconds)
                layer_cache2[lyr] = {_obj_id(o): o for o in objs}
            except Exception:
                layer_cache2[lyr] = {}
        obj = layer_cache2[lyr].get(node.id)
        if obj:
            node.label = obj.get("label") or obj.get("summary") or obj.get("title") or None
            node.status = obj.get("status") or None

    duration_ms = round((time.monotonic() - t0) * 1000)

    # ---- Mermaid output ----
    if fmt == "mermaid":
        return PlainTextResponse(_to_mermaid(list(node_keys.values()), edges))

    return GraphResponse(
        nodes=list(node_keys.values()),
        edges=edges,
        meta={
            "node_count":     len(node_keys),
            "edge_count":     len(edges),
            "depth":          depth if bfs_mode else None,
            "node_id":        node_id,
            "edge_type":      edge_type,
            "from_layer":     from_layer,
            "to_layer":       to_layer,
            "duration_ms":    duration_ms,
        },
    ).model_dump()
