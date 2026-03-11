/**
 * ModelGraphPage — /model/graph
 *
 * Interactive graph visualisation of the EVA Data Model.
 * Nodes are model objects grouped by ontology domain (12 domains).
 * Edges are typed relationships (calls, reads, writes, depends_on, etc.)
 *
 * Requires: view:model permission.
 * Uses: @xyflow/react for canvas rendering.
 * Data: /model/graph (nodes + edges), /model/user-guide (ontology domains)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  ConnectionLineType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GCThemeProvider } from '@eva/gc-design-system';
import { NavHeader } from '@components/NavHeader';
import { useLang } from '@context/LangContext';
import { EvaSpinner, EvaBadge } from '@eva/ui';
import {
  getGraph,
  getEdgeTypes,
  getUserGuideDomains,
  type GraphResponse,
  type EdgeTypeMeta,
  type OntologyDomain,
} from '@api/modelApi';

// ── Domain colours (match ModelBrowserPage) ──────────────────────────────────
const DOMAIN_COLORS: Record<string, string> = {
  system_architecture:     '#1d70b8',
  identity_access:         '#d4351c',
  ai_runtime:              '#00703c',
  user_interface:          '#f47738',
  control_plane:           '#912b88',
  governance_policy:       '#b58840',
  project_pm:              '#005ea5',
  devops_delivery:         '#28a197',
  observability_evidence:  '#4c2c92',
  infrastructure_finops:   '#6f72af',
  execution_engine:        '#505a5f',
  strategy_portfolio:      '#0b0c0e',
};

const DOMAIN_LABELS: Record<string, { en: string; fr: string }> = {
  system_architecture:     { en: 'System Architecture',       fr: 'Architecture systeme' },
  identity_access:         { en: 'Identity & Access',         fr: 'Identite et acces' },
  ai_runtime:              { en: 'AI Runtime',                fr: 'Execution IA' },
  user_interface:          { en: 'User Interface',            fr: 'Interface utilisateur' },
  control_plane:           { en: 'Control Plane',             fr: 'Plan de controle' },
  governance_policy:       { en: 'Governance & Policy',       fr: 'Gouvernance et politiques' },
  project_pm:              { en: 'Project & PM',              fr: 'Projet et gestion' },
  devops_delivery:         { en: 'DevOps & Delivery',         fr: 'DevOps et livraison' },
  observability_evidence:  { en: 'Observability & Evidence',  fr: 'Observabilite et preuves' },
  infrastructure_finops:   { en: 'Infrastructure & FinOps',   fr: 'Infrastructure et FinOps' },
  execution_engine:        { en: 'Execution Engine',          fr: 'Moteur d execution' },
  strategy_portfolio:      { en: 'Strategy & Portfolio',      fr: 'Strategie et portefeuille' },
};

// ── Styles ───────────────────────────────────────────────────────────────────
const GC_TEXT    = '#0b0c0e';
const GC_BORDER  = '#b1b4b6';
const GC_SURFACE = '#f8f8f8';

const s: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: '#fff', fontFamily: 'Noto Sans, sans-serif', color: GC_TEXT },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '8px 32px', background: GC_SURFACE,
    borderBottom: `1px solid ${GC_BORDER}`,
    fontSize: '0.82rem',
  },
  backLink: { color: '#1d70b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' },
  filterGroup: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  filterLabel: { fontSize: '0.78rem', color: '#505a5f' },
  select: {
    padding: '4px 8px', border: `1px solid ${GC_BORDER}`, borderRadius: 4,
    fontSize: '0.82rem', background: '#fff',
  },
  canvas: { width: '100%', height: 'calc(100vh - 170px)' },
  detail: {
    position: 'absolute', top: 10, right: 10,
    width: 300, maxHeight: 'calc(100vh - 200px)',
    background: '#fff', border: `1px solid ${GC_BORDER}`, borderRadius: 6,
    padding: 16, overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    fontSize: '0.85rem', zIndex: 10,
  },
  detailTitle: { fontSize: '1rem', fontWeight: 700, marginBottom: 4 },
  detailMeta: { fontSize: '0.78rem', color: '#505a5f', marginBottom: 8 },
  detailField: { display: 'flex', gap: 8, marginBottom: 4 },
  detailKey: { fontWeight: 600, color: '#505a5f', minWidth: 70, fontSize: '0.78rem' },
  detailVal: { color: GC_TEXT, fontSize: '0.78rem', wordBreak: 'break-word' },
  legend: {
    display: 'flex', flexWrap: 'wrap', gap: 8,
    padding: 8, background: 'rgba(255,255,255,0.92)',
    borderRadius: 6, border: `1px solid ${GC_BORDER}`,
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem' },
  legendDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 170px)' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildLayerToDomain(domains: Record<string, OntologyDomain>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [domainKey, domain] of Object.entries(domains)) {
    for (const layer of domain.layers) {
      map.set(layer, domainKey);
    }
  }
  return map;
}

/** Position nodes in a grid layout grouped by domain */
function layoutNodes(
  graphData: GraphResponse,
  layerToDomain: Map<string, string>,
): Node[] {
  // Group nodes by domain
  const domainGroups = new Map<string, GraphResponse['nodes']>();
  for (const node of graphData.nodes) {
    const domain = layerToDomain.get(node.layer) ?? 'unknown';
    if (!domainGroups.has(domain)) domainGroups.set(domain, []);
    domainGroups.get(domain)!.push(node);
  }

  const nodes: Node[] = [];
  const domainKeys = Array.from(domainGroups.keys()).sort();
  const COLS = 4; // domains per row
  const DOMAIN_W = 400;
  const DOMAIN_H = 300;
  const NODE_W = 160;
  const NODE_H = 36;

  domainKeys.forEach((domainKey, di) => {
    const col = di % COLS;
    const row = Math.floor(di / COLS);
    const baseX = col * DOMAIN_W;
    const baseY = row * DOMAIN_H;
    const color = DOMAIN_COLORS[domainKey] ?? '#888';
    const domainNodes = domainGroups.get(domainKey)!;

    const innerCols = 2;
    domainNodes.forEach((gn, ni) => {
      const nc = ni % innerCols;
      const nr = Math.floor(ni / innerCols);
      nodes.push({
        id: `${gn.layer}::${gn.id}`,
        position: { x: baseX + nc * (NODE_W + 20) + 20, y: baseY + nr * (NODE_H + 12) + 40 },
        data: {
          label: gn.label || gn.id,
          layer: gn.layer,
          domain: domainKey,
          status: gn.status,
        },
        style: {
          background: color + '18',
          border: `2px solid ${color}`,
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: '0.72rem',
          color: GC_TEXT,
          width: NODE_W,
          cursor: 'pointer',
        },
      });
    });
  });

  return nodes;
}

function layoutEdges(graphData: GraphResponse): Edge[] {
  return graphData.edges.map((ge, i) => ({
    id: `e-${i}`,
    source: `${ge.from_layer}::${ge.from_id}`,
    target: `${ge.to_layer}::${ge.to_id}`,
    label: ge.edge_type,
    type: 'smoothstep',
    animated: ge.edge_type === 'calls',
    style: { stroke: '#b1b4b6', strokeWidth: 1.5 },
    labelStyle: { fontSize: '0.6rem', fill: '#505a5f' },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
  }));
}

// ── Component ────────────────────────────────────────────────────────────────

export function ModelGraphPage() {
  const [graphData, setGraphData]     = useState<GraphResponse | null>(null);
  const [edgeTypes, setEdgeTypes]     = useState<EdgeTypeMeta[]>([]);
  const [domains, setDomains]         = useState<Record<string, OntologyDomain>>({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [filterLayer, setFilterLayer] = useState<string>('');
  const [filterEdge, setFilterEdge]   = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const { lang } = useLang();
  const t = {
    title:      lang === 'en' ? 'Model Graph' : 'Graphe du modele',
    back:       lang === 'en' ? 'Back to Browser' : 'Retour au navigateur',
    filterLayer: lang === 'en' ? 'Layer:' : 'Couche:',
    filterEdge: lang === 'en' ? 'Edge type:' : 'Type de lien:',
    all:        lang === 'en' ? 'All' : 'Tous',
    nodes:      lang === 'en' ? 'nodes' : 'noeuds',
    edgesLabel: lang === 'en' ? 'edges' : 'liens',
    loading:    lang === 'en' ? 'Loading graph...' : 'Chargement du graphe...',
    layer:      lang === 'en' ? 'Layer' : 'Couche',
    domain:     lang === 'en' ? 'Domain' : 'Domaine',
    status:     lang === 'en' ? 'Status' : 'Statut',
  };

  // Load data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getGraph(filterLayer ? { layer: filterLayer } : undefined),
      getEdgeTypes(),
      getUserGuideDomains(),
    ])
      .then(([graph, et, dom]) => {
        setGraphData(graph);
        setEdgeTypes(et);
        setDomains(dom);
        setError(null);
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, [filterLayer]);

  // Build layout when data changes
  const layerToDomain = useMemo(() => buildLayerToDomain(domains), [domains]);

  useEffect(() => {
    if (!graphData) return;

    let filteredGraph = graphData;
    if (filterEdge) {
      const filteredEdges = graphData.edges.filter(e => e.edge_type === filterEdge);
      const nodeIds = new Set<string>();
      for (const e of filteredEdges) {
        nodeIds.add(`${e.from_layer}::${e.from_id}`);
        nodeIds.add(`${e.to_layer}::${e.to_id}`);
      }
      filteredGraph = {
        ...graphData,
        nodes: graphData.nodes.filter(n => nodeIds.has(`${n.layer}::${n.id}`)),
        edges: filteredEdges,
      };
    }

    setNodes(layoutNodes(filteredGraph, layerToDomain));
    setEdges(layoutEdges(filteredGraph));
    setSelectedNode(null);
  }, [graphData, filterEdge, layerToDomain, setNodes, setEdges]);

  // Get unique layers for filter dropdown
  const availableLayers = useMemo(() => {
    if (!graphData) return [];
    return [...new Set(graphData.nodes.map(n => n.layer))].sort();
  }, [graphData]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNode(node);
  }, []);

  return (
    <GCThemeProvider>
      <div style={s.root}>
        <NavHeader />

        {/* Toolbar */}
        <div style={s.toolbar}>
          <Link to="/model" style={s.backLink}>&larr; {t.back}</Link>
          <strong style={{ fontSize: '0.95rem' }}>{t.title}</strong>
          {graphData && (
            <span style={{ color: '#505a5f', fontSize: '0.8rem' }}>
              {graphData.node_count} {t.nodes} &middot; {graphData.edge_count} {t.edgesLabel}
              {graphData.duration_ms != null && <> &middot; {graphData.duration_ms}ms</>}
            </span>
          )}

          <div style={s.filterGroup}>
            <span style={s.filterLabel}>{t.filterLayer}</span>
            <select
              style={s.select}
              value={filterLayer}
              onChange={e => setFilterLayer(e.target.value)}
            >
              <option value="">{t.all}</option>
              {availableLayers.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            <span style={s.filterLabel}>{t.filterEdge}</span>
            <select
              style={s.select}
              value={filterEdge}
              onChange={e => setFilterEdge(e.target.value)}
            >
              <option value="">{t.all}</option>
              {edgeTypes.map(et => (
                <option key={et.edge_type} value={et.edge_type}>
                  {et.edge_type} ({et.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Canvas */}
        {loading && (
          <div style={s.center}>
            <EvaSpinner label={t.loading} />
          </div>
        )}
        {error && (
          <div style={s.center}>
            <p style={{ color: '#d4351c' }}>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div style={s.canvas}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              connectionLineType={ConnectionLineType.SmoothStep}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
              <MiniMap
                nodeColor={node => {
                  const domain = (node.data as Record<string, unknown>)?.domain as string;
                  return DOMAIN_COLORS[domain] ?? '#ccc';
                }}
                maskColor="rgba(248,248,248,0.8)"
              />

              {/* Legend */}
              <Panel position="bottom-right">
                <div style={s.legend}>
                  {Object.entries(DOMAIN_COLORS).map(([key, color]) => (
                    <div key={key} style={s.legendItem}>
                      <span style={{ ...s.legendDot, background: color }} />
                      <span>{DOMAIN_LABELS[key]?.[lang] ?? key}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </ReactFlow>

            {/* Detail panel */}
            {selectedNode && (
              <div style={s.detail}>
                <button
                  style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                  onClick={() => setSelectedNode(null)}
                  aria-label="Close"
                >
                  X
                </button>
                <div style={s.detailTitle}>
                  {String((selectedNode.data as Record<string, unknown>).label ?? '')}
                </div>
                <div style={s.detailMeta}>
                  <div style={s.detailField}>
                    <span style={s.detailKey}>{t.layer}</span>
                    <span style={s.detailVal}>
                      {(selectedNode.data as Record<string, unknown>).layer as string}
                    </span>
                  </div>
                  <div style={s.detailField}>
                    <span style={s.detailKey}>{t.domain}</span>
                    <span style={s.detailVal}>
                      {DOMAIN_LABELS[(selectedNode.data as Record<string, unknown>).domain as string]?.[lang]
                        ?? (selectedNode.data as Record<string, unknown>).domain as string}
                    </span>
                  </div>
                  {(selectedNode.data as Record<string, unknown>).status && (
                    <div style={s.detailField}>
                      <span style={s.detailKey}>{t.status}</span>
                      <EvaBadge variant="neutral">
                        {(selectedNode.data as Record<string, unknown>).status as string}
                      </EvaBadge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </GCThemeProvider>
  );
}

export default ModelGraphPage;
