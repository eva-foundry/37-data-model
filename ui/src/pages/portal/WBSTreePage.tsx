/**
 * WBSTreePage -- /portal/wbs
 *
 * Work Breakdown Structure viewer with expand/collapse tree,
 * phase gate lock icons, and Critical Path Panel.
 * F31-PM2 -- WI-F10 thru WI-F18
 *
 * i18n: all strings via portal.wbs.* keys (inline lang table)
 * Data: fetchWBSTree() + fetchCriticalPath() -- mock-first
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavHeader } from '@components/NavHeader';
import { WBSNodeRow } from '@components/WBSNodeRow';
import { CriticalPathPanel } from '@components/CriticalPathPanel';
import { fetchWBSTree, fetchCriticalPath } from '@api/wbsApi';
import { useLang } from '@context/LangContext';
import type { WBSNode, CriticalPathItem } from '@/types/scrum';

const GC_TEXT    = '#0b0c0e';
const GC_BORDER  = '#b1b4b6';
const GC_SURFACE = '#f8f8f8';
const GC_MUTED   = '#505a5f';

/** Build child map from flat node list */
function buildChildMap(nodes: WBSNode[]): Map<string | null, WBSNode[]> {
  const map = new Map<string | null, WBSNode[]>();
  for (const n of nodes) {
    const siblings = map.get(n.parent_id) ?? [];
    siblings.push(n);
    map.set(n.parent_id, siblings);
  }
  return map;
}

/** Flatten tree to visible nodes based on expanded set */
function flattenVisible(
  childMap: Map<string | null, WBSNode[]>,
  expandedIds: Set<string>,
  parentId: string | null = null,
): Array<{ node: WBSNode; hasChildren: boolean }> {
  const children = childMap.get(parentId) ?? [];
  const result: Array<{ node: WBSNode; hasChildren: boolean }> = [];
  for (const n of children) {
    const hasChildren = (childMap.get(n.id)?.length ?? 0) > 0;
    result.push({ node: n, hasChildren });
    if (hasChildren && expandedIds.has(n.id)) {
      result.push(...flattenVisible(childMap, expandedIds, n.id));
    }
  }
  return result;
}

/** Default expanded IDs: top-level phase nodes */
function defaultExpanded(nodes: WBSNode[]): Set<string> {
  return new Set(nodes.filter((n) => n.parent_id === null).map((n) => n.id));
}

export const WBSTreePage: React.FC = () => {
  const { lang } = useLang();
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // i18n table -- portal.wbs.* keys
  const t = {
    title:       lang === 'fr' ? 'Structure de decomposition du travail' : 'Work Breakdown Structure',
    subtitle:    lang === 'fr' ? 'Hierarchie de travail du projet' : 'Project work hierarchy',
    loading:     lang === 'fr' ? 'Chargement...' : 'Loading...',
    error:       lang === 'fr' ? 'Erreur de chargement' : 'Failed to load WBS',
    empty:       lang === 'fr' ? 'Aucun noeud WBS disponible' : 'No WBS nodes available',
    tree:        lang === 'fr' ? 'Arbre WBS' : 'WBS Tree',
    treeSection: lang === 'fr' ? 'Structure du travail' : 'Work structure',
    refreshedAt: lang === 'fr' ? 'Mis a jour' : 'Refreshed',
    expandAll:   lang === 'fr' ? 'Tout agrandir' : 'Expand all',
    collapseAll: lang === 'fr' ? 'Tout reduire' : 'Collapse all',
    chooseProject: lang === 'fr' ? 'Projet' : 'Project',
  };

  const [nodes,         setNodes]         = useState<WBSNode[]>([]);
  const [critItems,     setCritItems]     = useState<CriticalPathItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [expandedIds,   setExpandedIds]   = useState<Set<string>>(new Set());
  const [projectId,     setProjectId]     = useState('31-eva-faces');
  const [refreshed,     setRefreshed]     = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchWBSTree(projectId),
      fetchCriticalPath(projectId),
    ])
      .then(([wbsRes, critRes]) => {
        setNodes(wbsRes.nodes);
        setCritItems(critRes.items);
        setRefreshed(wbsRes.refreshed_at);
        setExpandedIds(defaultExpanded(wbsRes.nodes));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  const childMap = buildChildMap(nodes);
  const visible  = flattenVisible(childMap, expandedIds);

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const expandAll  = () => setExpandedIds(new Set(nodes.filter((n) => (childMap.get(n.id)?.length ?? 0) > 0).map((n) => n.id)));
  const collapseAll = () => setExpandedIds(new Set());

  /** Scroll WBSTree row into view -- WI-F17 */
  const scrollToNode = useCallback((nodeId: string) => {
    const el = nodeRefs.current.get(nodeId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
      // Ensure parent nodes are expanded
      setExpandedIds((prev) => {
        const next = new Set(prev);
        const target = nodes.find((n) => n.id === nodeId);
        if (target) {
          let cur: WBSNode | undefined = target;
          while (cur?.parent_id) {
            next.add(cur.parent_id);
            cur = nodes.find((n) => n.id === cur?.parent_id);
          }
        }
        return next;
      });
    }
  }, [nodes]);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Noto Sans, sans-serif', color: GC_TEXT }}>
      <NavHeader />

      {/* Page header */}
      <div role="region" aria-label="Page header" style={{ padding: '20px 32px', borderBottom: `1px solid ${GC_BORDER}`, background: GC_SURFACE }}>
        <h1 data-testid="wbs-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: GC_TEXT }}>
          {t.title}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: GC_MUTED }}>{t.subtitle}</p>
        {refreshed && (
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: GC_MUTED }}>
            {t.refreshedAt}: {new Date(refreshed).toLocaleString()}
          </p>
        )}
      </div>

      {/* Project selector */}
      <div style={{ padding: '10px 32px', borderBottom: `1px solid ${GC_BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{t.chooseProject}:</span>
          <input
            data-testid="wbs-project-input"
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 3, border: `1px solid ${GC_BORDER}`, fontSize: '0.875rem', width: 180 }}
          />
        </label>
        <button
          data-testid="wbs-expand-all"
          onClick={expandAll}
          style={{ padding: '4px 12px', fontSize: '0.8rem', border: `1px solid ${GC_BORDER}`, borderRadius: 3, background: '#fff', cursor: 'pointer' }}
        >
          {t.expandAll}
        </button>
        <button
          data-testid="wbs-collapse-all"
          onClick={collapseAll}
          style={{ padding: '4px 12px', fontSize: '0.8rem', border: `1px solid ${GC_BORDER}`, borderRadius: 3, background: '#fff', cursor: 'pointer' }}
        >
          {t.collapseAll}
        </button>
      </div>

      {/* Body: tree + critical path */}
      <main id="main-content" style={{ display: 'flex', gap: 0 }}>
        {/* WBS Tree panel */}
        <section
          data-testid="wbs-tree-panel"
          aria-label={t.treeSection}
          style={{ flex: 1, borderRight: `1px solid ${GC_BORDER}`, overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}
        >
          {loading && (
            <p data-testid="wbs-loading" role="status" aria-live="polite" style={{ padding: '24px 32px', color: GC_MUTED }}>
              {t.loading}
            </p>
          )}

          {error && (
            <p data-testid="wbs-error" role="alert" style={{ padding: '24px 32px', color: '#d4351c' }}>
              {t.error}: {error}
            </p>
          )}

          {!loading && !error && visible.length === 0 && (
            <p data-testid="wbs-empty" style={{ padding: '24px 32px', color: GC_MUTED }}>
              {t.empty}
            </p>
          )}

          {!loading && !error && visible.length > 0 && (
            <div role="treegrid" aria-label={t.tree} data-testid="wbs-tree">
              {visible.map(({ node, hasChildren }) => (
                <WBSNodeRow
                  key={node.id}
                  ref={(el) => { if (el) nodeRefs.current.set(node.id, el); }}
                  tabIndex={-1}
                  node={node}
                  isExpanded={expandedIds.has(node.id)}
                  hasChildren={hasChildren}
                  onToggle={toggle}
                  lang={lang}
                />
              ))}
            </div>
          )}
        </section>

        {/* Critical path panel */}
        <aside
          style={{ width: 320, flexShrink: 0, padding: '16px', overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}
        >
          <CriticalPathPanel
            items={critItems}
            lang={lang}
            onScrollToNode={scrollToNode}
          />
        </aside>
      </main>
    </div>
  );
};
