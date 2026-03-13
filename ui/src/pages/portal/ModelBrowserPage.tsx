/**
 * ModelBrowserPage — /model
 *
 * Browse all layers of the EVA Data Model, grouped by the 12 ontology domains.
 * Requires: view:model permission.
 *
 * Layout:
 *   - Left sidebar: ontology-grouped collapsible layer sections with object counts
 *   - Right pane: search + EvaDataGrid of objects in selected layer
 *   - Drawer: EvaDrawer + EvaJsonViewer for full object detail
 *
 * Data source: 37-data-model API (ACA by default; override with VITE_DATA_MODEL_URL)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GCThemeProvider } from '@eva/gc-design-system';
import { NavHeader } from '@components/NavHeader';
import { useLang } from '@context/LangContext';
import {
  EvaDataGrid,
  EvaDrawer,
  EvaJsonViewer,
  EvaBadge,
  EvaSpinner,
  EvaInput,
} from '@eva/ui';
import {
  getHealth,
  getAgentSummary,
  getUserGuideDomains,
  listLayer,
  type ModelHealth,
  type ModelObject,
  type ModelSummary,
  type OntologyDomain,
} from '@api/modelApi';

// ── Domain display metadata ─────────────────────────────────────────────────
interface DomainMeta {
  label: { en: string; fr: string };
  color: string;
  icon: string;
}

const DOMAIN_META: Record<string, DomainMeta> = {
  system_architecture:     { label: { en: 'System Architecture',       fr: 'Architecture systeme' },     color: '#1d70b8', icon: 'SA' },
  identity_access:         { label: { en: 'Identity & Access',         fr: 'Identite et acces' },        color: '#d4351c', icon: 'IA' },
  ai_runtime:              { label: { en: 'AI Runtime',                fr: 'Execution IA' },              color: '#00703c', icon: 'AI' },
  user_interface:          { label: { en: 'User Interface',            fr: 'Interface utilisateur' },     color: '#f47738', icon: 'UI' },
  control_plane:           { label: { en: 'Control Plane',             fr: 'Plan de controle' },          color: '#912b88', icon: 'CP' },
  governance_policy:       { label: { en: 'Governance & Policy',       fr: 'Gouvernance et politiques' }, color: '#b58840', icon: 'GP' },
  project_pm:              { label: { en: 'Project & PM',              fr: 'Projet et gestion' },         color: '#005ea5', icon: 'PM' },
  devops_delivery:         { label: { en: 'DevOps & Delivery',         fr: 'DevOps et livraison' },       color: '#28a197', icon: 'DD' },
  observability_evidence:  { label: { en: 'Observability & Evidence',  fr: 'Observabilite et preuves' },  color: '#4c2c92', icon: 'OE' },
  infrastructure_finops:   { label: { en: 'Infrastructure & FinOps',   fr: 'Infrastructure et FinOps' },  color: '#6f72af', icon: 'IF' },
  execution_engine:        { label: { en: 'Execution Engine',          fr: 'Moteur d execution' },        color: '#505a5f', icon: 'EE' },
  strategy_portfolio:      { label: { en: 'Strategy & Portfolio',      fr: 'Strategie et portefeuille' }, color: '#0b0c0e', icon: 'SP' },
};

// ── Styles (plain CSS-in-JS, consistent with portal-face pattern) ────────────
const GC_BLUE    = '#1d70b8';
const GC_TEXT    = '#0b0c0e';
const GC_BORDER  = '#b1b4b6';
const GC_SURFACE = '#f8f8f8';
const GC_ACTIVE  = '#e8f0fb';

const styles: Record<string, React.CSSProperties> = {
  root:  { minHeight: '100vh', background: '#fff', fontFamily: 'Noto Sans, sans-serif', color: GC_TEXT },
  page:  { display: 'flex', flexDirection: 'column', flex: 1 },
  healthBar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '6px 32px', background: GC_SURFACE,
    borderBottom: `1px solid ${GC_BORDER}`,
    fontSize: '0.82rem', color: '#505a5f',
  },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: {
    width: 260, flexShrink: 0,
    borderRight: `1px solid ${GC_BORDER}`,
    overflowY: 'auto', background: GC_SURFACE,
    padding: '12px 0',
  },
  sidebarHeader: {
    padding: '0 16px 8px', fontSize: '0.78rem',
    fontWeight: 700, color: '#505a5f',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  graphLink: {
    fontSize: '0.75rem', fontWeight: 600, color: GC_BLUE,
    textDecoration: 'none', textTransform: 'none', letterSpacing: 'normal',
  },
  domainHeader: {
    width: '100%', textAlign: 'left',
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '8px 16px 4px', fontSize: '0.78rem',
    fontWeight: 700, color: '#505a5f',
    display: 'flex', alignItems: 'center', gap: 8,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  domainBadge: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 22, height: 22, borderRadius: 4,
    color: '#fff', fontSize: '0.6rem', fontWeight: 700,
    flexShrink: 0,
  },
  domainCount: {
    marginLeft: 'auto', fontSize: '0.7rem', color: '#505a5f', fontWeight: 400,
  },
  layerBtn: {
    width: '100%', textAlign: 'left',
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px 16px 4px 46px', fontSize: '0.82rem',
    color: GC_TEXT, display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', borderLeft: '3px solid transparent',
  },
  layerBtnActive: {
    background: GC_ACTIVE, borderLeftColor: GC_BLUE,
    color: GC_BLUE, fontWeight: 600,
  },
  count: {
    fontSize: '0.7rem', background: '#d8e6f7',
    color: GC_BLUE, borderRadius: 10,
    padding: '1px 6px', fontWeight: 600,
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px 24px' },
  mainHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  h2: { fontSize: '1.25rem', fontWeight: 700, color: GC_TEXT, margin: 0 },
  searchWrap: { marginBottom: 16, maxWidth: 400 },
  empty: { color: '#505a5f', marginTop: 32, textAlign: 'center', fontSize: '0.9rem' },
  drawerContent: { padding: 24 },
  drawerTitle: { fontSize: '1rem', fontWeight: 700, marginBottom: 4 },
  drawerMeta: { fontSize: '0.8rem', color: '#505a5f', marginBottom: 16 },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusBadgeVariant(status: unknown): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'implemented': return 'success';
    case 'stub':        return 'warning';
    case 'planned':     return 'info';
    case 'coded':       return 'neutral';
    default:            return 'neutral';
  }
}

function objectLabel(obj: ModelObject): string {
  return (obj['title'] ?? obj['name'] ?? obj['path'] ?? obj['id']) as string;
}

function layerDisplayName(id: string): string {
  return id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Component ────────────────────────────────────────────────────────────────

interface DomainGroup {
  key: string;
  meta: DomainMeta;
  domain: OntologyDomain;
}

export function ModelBrowserPage() {
  const [health, setHealth]               = useState<ModelHealth | null>(null);
  const [summary, setSummary]             = useState<ModelSummary | null>(null);
  const [domains, setDomains]             = useState<DomainGroup[]>([]);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [activeLayer, setActiveLayer]     = useState('services');
  const [objects, setObjects]             = useState<ModelObject[]>([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [search, setSearch]               = useState('');
  const [selected, setSelected]           = useState<ModelObject | null>(null);
  const [drawerOpen, setDrawerOpen]       = useState(false);

  const { lang } = useLang();
  const t = {
    dataModelApi:      lang === 'en' ? 'Data Model API' : 'API du modele de donnees',
    unreachable:       lang === 'en' ? 'unreachable -- check VITE_DATA_MODEL_URL or ACA status' : 'inaccessible -- verifier VITE_DATA_MODEL_URL ou etat ACA',
    objectsAcrossLayers: lang === 'en' ? 'objects across' : 'objets sur',
    layersLabel:       lang === 'en' ? 'layers' : 'couches',
    store:             lang === 'en' ? 'store:' : 'magasin:',
    domains:           lang === 'en' ? 'Ontology Domains' : 'Domaines ontologiques',
    graphView:         lang === 'en' ? 'Graph View' : 'Vue graphique',
    primaryNav:        lang === 'en' ? 'Model layers grouped by ontology domain' : 'Couches du modele par domaine',
    clickToInspect:    lang === 'en' ? 'Click a row to inspect' : 'Cliquer une ligne pour inspecter',
    searchPlaceholder: lang === 'en' ? 'Search by id or name...' : 'Rechercher par id ou nom...',
    searchLabel:       lang === 'en' ? 'Search objects' : 'Rechercher des objets',
    noObjects:         lang === 'en' ? 'No objects found' : 'Aucun objet trouve',
    noObjectsMatch:    lang === 'en' ? 'matching' : 'correspondant a',
    loading:           lang === 'en' ? 'Loading...' : 'Chargement...',
    inspect:           lang === 'en' ? 'Inspect' : 'Inspecter',
    objectDetail:      lang === 'en' ? 'Object Detail' : 'Detail de l objet',
    layer:             lang === 'en' ? 'Layer:' : 'Couche:',
  };

  // Bootstrap: health + summary + ontology domains
  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
    getAgentSummary().then(setSummary).catch(() => setSummary(null));
    getUserGuideDomains()
      .then(raw => {
        const groups: DomainGroup[] = Object.entries(raw)
          .filter(([key]) => DOMAIN_META[key])
          .map(([key, domain]) => ({
            key,
            meta: DOMAIN_META[key],
            domain,
          }));
        setDomains(groups);
        // Expand the first domain by default
        if (groups.length > 0) {
          setExpandedDomains(new Set([groups[0].key]));
        }
      })
      .catch(() => setDomains([]));
  }, []);

  // Collect all layers across domains for total count
  const totalLayers = useMemo(
    () => domains.reduce((sum, g) => sum + g.domain.layers.length, 0),
    [domains],
  );

  // Load layer objects when active layer changes
  const loadLayer = useCallback((layer: string) => {
    setActiveLayer(layer);
    setLoading(true);
    setError(null);
    setSearch('');
    listLayer(layer)
      .then(setObjects)
      .catch(err => {
        setObjects([]);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadLayer('services'); }, [loadLayer]);

  function toggleDomain(key: string) {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Search filter
  const searchLower = search.toLowerCase();
  const filtered = objects.filter(o => {
    if (!search) return true;
    const label = objectLabel(o).toLowerCase();
    const oid   = (o.id ?? '').toString().toLowerCase();
    return label.includes(searchLower) || oid.includes(searchLower);
  });

  function openDetail(obj: ModelObject) {
    setSelected(obj);
    setDrawerOpen(true);
  }

  const layerLabel = layerDisplayName(activeLayer);

  return (
    <GCThemeProvider>
      <div style={styles.root}>
        <NavHeader />

        {/* Health bar */}
        <div style={styles.healthBar}>
          <strong>{t.dataModelApi}</strong>
          {health
            ? <>
                <EvaBadge variant={health.status === 'ok' ? 'success' : 'error'}>
                  {health.status}
                </EvaBadge>
                <span>{t.store} {health.store}</span>
                <span>v{health.version}</span>
              </>
            : <span style={{ color: '#d4351c' }}>{t.unreachable}</span>
          }
          {summary && (
            <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
              {summary.total.toLocaleString()} {t.objectsAcrossLayers}{' '}
              {totalLayers || Object.keys(summary.layers).length} {t.layersLabel}
            </span>
          )}
        </div>

        <main id="main-content" style={styles.body}>
          {/* Ontology-grouped sidebar */}
          <nav aria-label={t.primaryNav} style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <span>{t.domains}</span>
              <Link to="/model/graph" style={styles.graphLink}>{t.graphView} &rarr;</Link>
            </div>
            {domains.map(group => {
              const isExpanded = expandedDomains.has(group.key);
              const domainTotal = group.domain.layers.reduce(
                (sum, l) => sum + (summary?.layers?.[l] ?? 0), 0,
              );
              return (
                <div key={group.key}>
                  <button
                    style={styles.domainHeader}
                    onClick={() => toggleDomain(group.key)}
                    aria-expanded={isExpanded}
                  >
                    <span
                      style={{ ...styles.domainBadge, background: group.meta.color }}
                      aria-hidden="true"
                    >
                      {group.meta.icon}
                    </span>
                    <span>{group.meta.label[lang]}</span>
                    {domainTotal > 0 && (
                      <span style={styles.domainCount}>{domainTotal}</span>
                    )}
                    <span aria-hidden="true" style={{ marginLeft: 4, fontSize: '0.65rem' }}>
                      {isExpanded ? '\u25B2' : '\u25BC'}
                    </span>
                  </button>
                  {isExpanded && group.domain.layers.map(layerId => {
                    const cnt = summary?.layers?.[layerId] ?? 0;
                    const isActive = layerId === activeLayer;
                    return (
                      <button
                        key={layerId}
                        style={{ ...styles.layerBtn, ...(isActive ? styles.layerBtnActive : {}) }}
                        onClick={() => loadLayer(layerId)}
                        aria-current={isActive ? true : undefined}
                      >
                        <span>{layerDisplayName(layerId)}</span>
                        {cnt > 0 && <span style={styles.count}>{cnt}</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* Object grid */}
          <section style={styles.main}>
            <div style={styles.mainHeader}>
              <h1 style={styles.h2}>
                {layerLabel}
                {summary?.layers?.[activeLayer] != null && (
                  <span style={{ ...styles.count, marginLeft: 10 }}>
                    {summary.layers[activeLayer]}
                  </span>
                )}
              </h1>
              <span style={{ fontSize: '0.8rem', color: '#505a5f' }}>
                {t.clickToInspect}
              </span>
            </div>

            <div style={styles.searchWrap}>
              <EvaInput
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(_e, data) => setSearch(data.value)}
                aria-label={t.searchLabel}
              />
            </div>

            {loading && <EvaSpinner label={t.loading} />}
            {error   && <p style={{ color: '#d4351c' }}>{error}</p>}

            {!loading && !error && filtered.length === 0 && (
              <p style={styles.empty}>{t.noObjects}{search ? ` ${t.noObjectsMatch} "${search}"` : ''}.</p>
            )}

            {!loading && !error && filtered.length > 0 && (
              <EvaDataGrid
                items={filtered}
                getRowId={o => String(o.obj_id ?? o.id)}
                columns={[
                  {
                    columnId: 'id',
                    label: 'ID',
                    width: 280,
                    renderCell: o => (
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer',
                                 color: GC_BLUE, textAlign: 'left', padding: 0, fontSize: '0.875rem' }}
                        onClick={() => openDetail(o)}
                        aria-label={`${t.inspect} ${String(o.id)}`}
                      >
                        {String(o.id)}
                      </button>
                    ),
                  },
                  {
                    columnId: 'label',
                    label: 'Name / Title',
                    width: 360,
                    renderCell: o => <span>{objectLabel(o)}</span>,
                  },
                  {
                    columnId: 'status',
                    label: 'Status',
                    width: 130,
                    renderCell: o =>
                      o['status'] != null ? (
                        <EvaBadge variant={statusBadgeVariant(o['status'])}>
                          {String(o['status'])}
                        </EvaBadge>
                      ) : null,
                  },
                  {
                    columnId: 'rv',
                    label: 'Rev',
                    width: 60,
                    renderCell: o => <span style={{ fontSize: '0.75rem', color: '#505a5f' }}>
                      {o.row_version != null ? `v${o.row_version}` : ''}
                    </span>,
                  },
                  {
                    columnId: 'modified',
                    label: 'Modified',
                    width: 180,
                    renderCell: o => <span style={{ fontSize: '0.75rem', color: '#505a5f' }}>
                      {o.modified_at ? new Date(o.modified_at as string).toLocaleString() : ''}
                    </span>,
                  },
                ]}
              />
            )}
          </section>
        </main>

        {/* Detail drawer */}
        <EvaDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={selected ? String(selected.id) : t.objectDetail}
          size="medium"
          position="end"
        >
          {selected && (
            <div style={styles.drawerContent}>
              <div style={styles.drawerTitle}>{objectLabel(selected)}</div>
              <div style={styles.drawerMeta}>
                {t.layer} <strong>{selected.layer}</strong>
                {selected.row_version != null && <> &nbsp;|&nbsp; rev <strong>v{selected.row_version}</strong></>}
                {selected.modified_by  && <> &nbsp;|&nbsp; by <strong>{String(selected.modified_by)}</strong></>}
                {selected.modified_at  && <> &nbsp;|&nbsp; {new Date(String(selected.modified_at)).toLocaleString()}</>}
              </div>
              <EvaJsonViewer data={selected} />
            </div>
          )}
        </EvaDrawer>
      </div>
    </GCThemeProvider>
  );
}

export default ModelBrowserPage;
