/**
 * ModelReportPage — /model/report
 *
 * Reports on EVA Data Model health:
 *   - Layer object counts summary
 *   - Endpoint status matrix by service
 *   - Graph statistics (node/edge counts by type)
 *
 * Requires: view:model permission.
 * Data source: 37-data-model API (ACA by default; override with VITE_DATA_MODEL_URL)
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GCThemeProvider } from '@eva/gc-design-system';
import { NavHeader } from '@components/NavHeader';
import { useLang } from '@context/LangContext';
import { EvaDataGrid, EvaBadge, EvaSpinner, EvaTabs, type EvaTab } from '@eva/ui';
import {
  getHealth, getAgentSummary, listLayer, getGraph, getEdgeTypes,
  endpointStatusMatrix,
  type ModelHealth, type ModelSummary, type EndpointObject,
  type GraphResponse, type EdgeTypeMeta,
} from '@api/modelApi';

// ── Styles ───────────────────────────────────────────────────────────────────
const GC_BLUE    = '#1d70b8';
const GC_TEXT    = '#0b0c0e';
const GC_BORDER  = '#b1b4b6';
const GC_SURFACE = '#f8f8f8';

const styles: Record<string, React.CSSProperties> = {
  root:  { minHeight: '100vh', background: '#fff', fontFamily: 'Noto Sans, sans-serif', color: GC_TEXT },
  healthBar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '6px 32px', background: GC_SURFACE,
    borderBottom: `1px solid ${GC_BORDER}`,
    fontSize: '0.82rem', color: '#505a5f',
  },
  page:     { padding: '28px 32px', maxWidth: 1200 },
  h1:       { fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px', color: GC_TEXT },
  lead:     { fontSize: '0.9rem', color: '#505a5f', marginBottom: 20 },
  h2:       { fontSize: '1.1rem', fontWeight: 700, marginBottom: 14, color: GC_TEXT, borderBottom: `2px solid ${GC_BORDER}`, paddingBottom: 6 },
  cards:    { display: 'flex', flexWrap: 'wrap' as const, gap: 14, marginBottom: 28 },
  card: {
    background: GC_SURFACE, border: `1px solid ${GC_BORDER}`,
    borderRadius: 6, padding: '14px 20px',
    minWidth: 140, flex: '0 0 auto',
  },
  cardNum:    { fontSize: '2rem', fontWeight: 700, color: GC_BLUE, lineHeight: 1 },
  cardLabel:  { fontSize: '0.8rem', color: '#505a5f', marginTop: 4 },
  section:    { marginBottom: 32, marginTop: 20 },
  navLink:    { color: GC_BLUE, fontSize: '0.875rem' },
  errorMsg:   { color: '#d4351c', fontSize: '0.875rem', padding: '12px 0' },
  tabContent: { marginTop: 20 },
};

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardNum}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div style={styles.cardLabel}>{label}</div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function ModelReportPage() {
  const [health,    setHealth]    = useState<ModelHealth | null>(null);
  const [summary,   setSummary]   = useState<ModelSummary | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointObject[]>([]);
  const [graph,     setGraph]     = useState<GraphResponse | null>(null);
  const [edgeTypes, setEdgeTypes] = useState<EdgeTypeMeta[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { lang } = useLang();
  const t = {
    dataModelApi:   lang === 'en' ? 'Data Model API' : 'API du modele de donnees',
    unreachable:    lang === 'en' ? 'unreachable' : 'inaccessible',
    store:          lang === 'en' ? 'store:' : 'magasin:',
    title:          lang === 'en' ? 'Data Model Report' : 'Rapport du modele de donnees',
    snapshot:       lang === 'en' ? 'Snapshot of' : 'Apercu de',
    objectsAcrossLayers: lang === 'en' ? 'model objects across 27 layers.' : 'objets du modele sur 27 couches.',
    loading:        lang === 'en' ? 'Loading report...' : 'Chargement du rapport...',
    tabOverview:    lang === 'en' ? 'Overview' : 'Vue d ensemble',
    tabEndpoints:   lang === 'en' ? 'Endpoint Matrix' : 'Matrice des points de terminaison',
    tabEdgeTypes:   lang === 'en' ? 'Edge Types' : 'Types de liaisons',
    tabLayerCounts: lang === 'en' ? 'Layer Counts' : 'Comptes par couche',
    modelHealth:    lang === 'en' ? 'Model Health' : 'Sante du modele',
    epBreakdown:    lang === 'en' ? 'Endpoint Status Breakdown' : 'Repartition des statuts de points de terminaison',
    graph:          lang === 'en' ? 'Graph' : 'Graphe',
    epByService:    lang === 'en' ? 'Endpoint Status by Service' : 'Statut des points de terminaison par service',
    edgeTypesH2:    lang === 'en' ? 'Graph Edge Types' : 'Types de liaisons du graphe',
    allLayersH2:    lang === 'en' ? 'All Layers' : 'Toutes les couches',
    totalObjects:   lang === 'en' ? 'Total objects' : 'Total des objets',
    endpoints:      lang === 'en' ? 'Endpoints' : 'Points de terminaison',
    screens:        lang === 'en' ? 'Screens' : 'Ecrans',
    containers:     lang === 'en' ? 'Containers' : 'Conteneurs',
    services:       lang === 'en' ? 'Services' : 'Services',
    agents:         lang === 'en' ? 'Agents' : 'Agents',
    projects:       lang === 'en' ? 'Projects' : 'Projets',
    wbsNodes:       lang === 'en' ? 'WBS nodes' : 'Noeuds WBS',
    nodes:          lang === 'en' ? 'Nodes' : 'Noeuds',
    edges:          lang === 'en' ? 'Edges' : 'Liaisons',
    queryMs:        lang === 'en' ? 'Query ms' : 'Requete ms',
    layerBrowser:   lang === 'en' ? '<- Layer Browser' : '<- Navigateur de couches',
    colService:     lang === 'en' ? 'Service' : 'Service',
    colTotal:       lang === 'en' ? 'Total' : 'Total',
    colImplemented: lang === 'en' ? 'Implemented' : 'Implemente',
    colStub:        lang === 'en' ? 'Stub' : 'Stub',
    colPlanned:     lang === 'en' ? 'Planned' : 'Planifie',
    colCoded:       lang === 'en' ? 'Coded' : 'Code',
    colEdgeType:    lang === 'en' ? 'Edge Type' : 'Type de liaison',
    colCount:       lang === 'en' ? 'Count' : 'Nombre',
    colLayer:       lang === 'en' ? 'Layer' : 'Couche',
    colObjects:     lang === 'en' ? 'Objects' : 'Objets',
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getHealth(),
      getAgentSummary(),
      listLayer('endpoints'),
      getGraph(),
      getEdgeTypes(),
    ])
      .then(([h, s, eps, g, et]) => {
        setHealth(h as ModelHealth);
        setSummary(s as ModelSummary);
        setEndpoints(eps as EndpointObject[]);
        setGraph(g as GraphResponse);
        setEdgeTypes(et as EdgeTypeMeta[]);
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const matrix = endpointStatusMatrix(endpoints);

  const epCounts = endpoints.reduce<Record<string, number>>((acc, ep) => {
    const st = ep.status ?? 'stub';
    acc[st] = (acc[st] ?? 0) + 1;
    return acc;
  }, {});

  const TABS: EvaTab[] = [
    { value: 'overview',  label: t.tabOverview },
    { value: 'endpoints', label: `${t.tabEndpoints} (${endpoints.length})` },
    { value: 'graph',     label: `${t.tabEdgeTypes} (${edgeTypes.length})` },
    { value: 'layers',    label: t.tabLayerCounts },
  ];

  return (
    <GCThemeProvider>
      <div style={styles.root}>
        <NavHeader />

        {/* Health bar */}
        <div style={styles.healthBar}>
          <strong>{t.dataModelApi}</strong>
          {health ? (
            <>
              <EvaBadge variant={health.status === 'ok' ? 'success' : 'error'}>{health.status}</EvaBadge>
              <span>{t.store} {health.store}</span>
              <span>v{health.version}</span>
            </>
          ) : (
            <span style={{ color: '#d4351c' }}>{t.unreachable}</span>
          )}
          <span style={{ marginLeft: 'auto' }}>
            <Link to="/model" style={styles.navLink}>{t.layerBrowser}</Link>
          </span>
        </div>

        <main id="main-content" style={styles.page}>
          <h1 style={styles.h1}>{t.title}</h1>
          <p style={styles.lead}>
            {t.snapshot} {summary?.total?.toLocaleString() ?? '--'} {t.objectsAcrossLayers}
          </p>

          {loading && <EvaSpinner label={t.loading} />}
          {error   && <p style={styles.errorMsg}>{error}</p>}

          {!loading && !error && (
            <>
              <EvaTabs tabs={TABS} selectedValue={activeTab} onTabSelect={setActiveTab} />

              {/* Overview */}
              {activeTab === 'overview' && (
                <div style={styles.tabContent}>
                  <div style={styles.section}>
                    <h2 style={styles.h2}>{t.modelHealth}</h2>
                    <div style={styles.cards}>
                      <StatCard label={t.totalObjects} value={summary?.total ?? 0} />
                      <StatCard label={t.endpoints}    value={summary?.layers?.['endpoints'] ?? 0} />
                      <StatCard label={t.screens}      value={summary?.layers?.['screens'] ?? 0} />
                      <StatCard label={t.containers}   value={summary?.layers?.['containers'] ?? 0} />
                      <StatCard label={t.services}     value={summary?.layers?.['services'] ?? 0} />
                      <StatCard label={t.agents}       value={summary?.layers?.['agents'] ?? 0} />
                      <StatCard label={t.projects}     value={summary?.layers?.['projects'] ?? 0} />
                      <StatCard label={t.wbsNodes}     value={summary?.layers?.['wbs'] ?? 0} />
                    </div>
                  </div>
                  <div style={styles.section}>
                    <h2 style={styles.h2}>{t.epBreakdown}</h2>
                    <div style={styles.cards}>
                      {Object.entries(epCounts).map(([st, n]) => (
                        <StatCard key={st} label={st} value={n} />
                      ))}
                    </div>
                  </div>
                  {graph && (
                    <div style={styles.section}>
                      <h2 style={styles.h2}>{t.graph}</h2>
                      <div style={styles.cards}>
                        <StatCard label={t.nodes} value={graph.node_count} />
                        <StatCard label={t.edges} value={graph.edge_count} />
                        {graph.duration_ms != null && (
                          <StatCard label={t.queryMs} value={Math.round(graph.duration_ms)} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Endpoint matrix */}
              {activeTab === 'endpoints' && (
                <div style={styles.tabContent}>
                  <h2 style={styles.h2}>{t.epByService}</h2>
                  <EvaDataGrid
                    items={matrix}
                    getRowId={r => r.service}
                    columns={[
                      { columnId: 'service',     label: t.colService,     width: 240,
                        renderCell: r => <span>{r.service}</span> },
                      { columnId: 'total',       label: t.colTotal,       width: 80,
                        renderCell: r => <strong>{r.total}</strong> },
                      { columnId: 'implemented', label: t.colImplemented, width: 120,
                        renderCell: r => r.implemented > 0
                          ? <EvaBadge variant="success">{r.implemented}</EvaBadge>
                          : <span>0</span> },
                      { columnId: 'stub',    label: t.colStub,    width: 90,
                        renderCell: r => r.stub > 0
                          ? <EvaBadge variant="warning">{r.stub}</EvaBadge>
                          : <span>0</span> },
                      { columnId: 'planned', label: t.colPlanned, width: 90,
                        renderCell: r => r.planned > 0
                          ? <EvaBadge variant="info">{r.planned}</EvaBadge>
                          : <span>0</span> },
                      { columnId: 'coded',   label: t.colCoded,   width: 90,
                        renderCell: r => r.coded > 0
                          ? <EvaBadge variant="neutral">{r.coded}</EvaBadge>
                          : <span>0</span> },
                    ]}
                  />
                </div>
              )}

              {/* Edge types */}
              {activeTab === 'graph' && (
                <div style={styles.tabContent}>
                  <h2 style={styles.h2}>{t.edgeTypesH2}</h2>
                  <EvaDataGrid
                    items={edgeTypes}
                    getRowId={e => e.edge_type}
                    columns={[
                      { columnId: 'edge_type', label: t.colEdgeType, width: 260,
                        renderCell: e => <code>{e.edge_type}</code> },
                      { columnId: 'count', label: t.colCount, width: 100,
                        renderCell: e => <strong>{e.count}</strong> },
                    ]}
                  />
                </div>
              )}

              {/* Layer counts */}
              {activeTab === 'layers' && summary && (
                <div style={styles.tabContent}>
                  <h2 style={styles.h2}>{t.allLayersH2}</h2>
                  <EvaDataGrid
                    items={Object.entries(summary.layers).map(([layer, count]) => ({ layer, count }))}
                    getRowId={r => r.layer}
                    columns={[
                      { columnId: 'layer', label: t.colLayer, width: 260,
                        renderCell: r => <Link to="/model" style={styles.navLink}>{r.layer}</Link> },
                      { columnId: 'count', label: t.colObjects, width: 100,
                        renderCell: r => <strong>{r.count}</strong> },
                    ]}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </GCThemeProvider>
  );
}

export default ModelReportPage;
