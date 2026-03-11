/**
 * SprintBoardPage — FACES-WI-B
 *
 * Route: /devops/sprint
 * Spec: 31-eva-faces/docs/epics/eva-ado-dashboard.epic.yaml §screens[1]
 * User stories: US-A1 through US-A8
 *
 * - Sprint selector, project filter bar
 * - Feature sections with WI cards
 * - WI detail drawer (focus trapped)
 * - Velocity panel (SVG sparklines + accessible table)
 * - Bilingual EN/FR, WCAG 2.1 AA
 * - Mock data active when VITE_APIM_BASE_URL is empty
 */

import React, { useEffect, useMemo, useState } from 'react';
import { NavHeader } from '@components/NavHeader';
import { SprintSelector } from '@components/SprintSelector';
import { ProjectFilterBar } from '@components/ProjectFilterBar';
import { FeatureSection } from '@components/FeatureSection';
import { WIDetailDrawer } from '@components/WIDetailDrawer';
import { VelocityPanel } from '@components/VelocityPanel';
import { fetchScrumDashboard } from '@api/scrumApi';
import type { ScrumDashboardResponse, WorkItem, VelocityPoint } from '@/types/scrum';
import { useLang } from '@context/LangContext';

// Derive velocity points from dashboard response for sparklines
function deriveVelocity(data: ScrumDashboardResponse): VelocityPoint[] {
  const bySprintMap = new Map<string, { tests: number; cov: number[]; }>();
  data.epic.features.forEach((f) =>
    f.work_items.forEach((wi) => {
      const cur = bySprintMap.get(wi.sprint) ?? { tests: 0, cov: [] };
      cur.tests += wi.test_count ?? 0;
      if (wi.coverage_pct !== null) cur.cov.push(wi.coverage_pct);
      bySprintMap.set(wi.sprint, cur);
    })
  );
  return Array.from(bySprintMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sprint, { tests, cov }]) => ({
      sprint,
      tests_added: tests,
      coverage_pct: cov.length > 0 ? Math.round(cov.reduce((a, b) => a + b, 0) / cov.length) : null,
    }));
}

export const SprintBoardPage: React.FC = () => {
  const { lang } = useLang();

  const [data, setData]             = useState<ScrumDashboardResponse | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [sprint, setSprint]         = useState('all');
  const [project, setProject]       = useState('all');
  const [activeWI, setActiveWI]     = useState<WorkItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchScrumDashboard({ project, sprint })
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e: Error) => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [project, sprint]);

  // Unique sprint names for selector
  const sprintNames = useMemo(() => {
    if (!data) return [];
    const names = new Set<string>();
    data.epic.features.forEach((f) => f.work_items.forEach((wi) => names.add(wi.sprint)));
    return Array.from(names).sort();
  }, [data]);

  // Unique project slugs for filter bar
  const projectSlugs = useMemo(() =>
    data ? data.epic.features.map((f) => f.project) : [],
    [data]
  );

  // Filter features by project selection
  const visibleFeatures = useMemo(() => {
    if (!data) return [];
    return project === 'all'
      ? data.epic.features
      : data.epic.features.filter((f) => f.project === project);
  }, [data, project]);

  const velocityPoints = useMemo(() => (data ? deriveVelocity(data) : []), [data]);

  const t = {
    title:      lang === 'en' ? 'Sprint Board'                         : 'Tableau de bord Sprint',
    subtitle:   lang === 'en' ? 'EVA Platform — Active Sprint'         : 'Plateforme EVA — Sprint actif',
    loading:    lang === 'en' ? 'Loading sprint data…'                 : 'Chargement des données de sprint…',
    lastSync:   lang === 'en' ? 'Last synced:'                         : 'Dernière sync :',
    noFeatures: lang === 'en' ? 'No features match the current filter.': 'Aucune fonctionnalité ne correspond au filtre.',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <NavHeader />

      <main
        id="main-content"
        tabIndex={-1}
        style={{
          flex: 1,
          padding: '24px 32px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Page heading */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0b0c0e', margin: 0 }}>
            {t.title}
          </h1>
          <p style={{ fontSize: '1rem', color: '#505a5f', margin: '6px 0 0' }}>{t.subtitle}</p>
          {data && !loading && (
            <p style={{ fontSize: '0.75rem', color: '#505a5f', marginTop: 4 }}>
              {t.lastSync} {new Date(data.refreshed_at).toLocaleString(lang === 'en' ? 'en-CA' : 'fr-CA')}
            </p>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <SprintSelector
            sprints={sprintNames}
            selected={sprint}
            onChange={setSprint}
          />
          <ProjectFilterBar
            projects={projectSlugs}
            selected={project}
            onChange={setProject}
          />
        </div>

        {/* Status */}
        {loading && (
          <p aria-live="polite" role="status" style={{ color: '#505a5f', fontSize: '0.875rem' }}>
            {t.loading}
          </p>
        )}
        {error && !loading && (
          <p role="alert" style={{ color: '#d4351c', fontSize: '0.875rem' }}>
            {error}
          </p>
        )}

        {/* Feature sections */}
        {!loading && !error && (
          <>
            {visibleFeatures.length === 0 ? (
              <p style={{ color: '#505a5f' }}>{t.noFeatures}</p>
            ) : (
              visibleFeatures.map((f) => (
                <FeatureSection key={f.id} feature={f} onWIClick={setActiveWI} />
              ))
            )}

            {/* Velocity panel */}
            <VelocityPanel points={velocityPoints} />
          </>
        )}
      </main>

      {/* WI detail drawer */}
      <WIDetailDrawer item={activeWI} onClose={() => setActiveWI(null)} />
    </div>
  );
};

export default SprintBoardPage;
