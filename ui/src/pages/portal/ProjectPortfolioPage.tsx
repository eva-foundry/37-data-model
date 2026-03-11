/**
 * ProjectPortfolioPage -- /portal/projects
 *
 * Displays all EVA Foundation projects with maturity badges,
 * PBI progress, sprint tags, and filter bar.
 * F31-PM1 -- WI-F1 thru WI-F6 (DependencyGraphPanel WI-F7 deferred)
 *
 * i18n: all strings via portal.projects.* keys (inline lang table)
 * Data: fetchProjects() -- mock-first when VITE_BRAIN_API_URL absent
 */

import React, { useEffect, useMemo, useState } from 'react';
import { NavHeader } from '@components/NavHeader';
import { ProjectCard } from '@components/ProjectCard';
import { fetchProjects } from '@api/projectApi';
import { useLang } from '@context/LangContext';
import type { ProjectRecord, MaturityLevel, ProjectStream } from '@/types/project';

const GC_TEXT    = '#0b0c0e';
const GC_BORDER  = '#b1b4b6';
const GC_SURFACE = '#f8f8f8';
const GC_MUTED   = '#505a5f';
const GC_BLUE    = '#1d70b8';

const ALL_MATURITIES: MaturityLevel[] = ['active', 'poc', 'idea', 'retired', 'empty'];
const ALL_STREAMS: ProjectStream[]    = ['frontend', 'backend', 'infra', 'data', 'ai', 'security'];

export const ProjectPortfolioPage: React.FC = () => {
  const { lang } = useLang();

  // i18n table -- portal.projects.* keys
  const t = {
    title:           lang === 'fr' ? 'Portefeuille de projets' : 'Project Portfolio',
    subtitle:        lang === 'fr' ? 'Tous les projets EVA Foundation' : 'All EVA Foundation projects',
    filterMaturity:  lang === 'fr' ? 'Maturite' : 'Maturity',
    filterStream:    lang === 'fr' ? 'Flux' : 'Stream',
    filterSprint:    lang === 'fr' ? 'Sprint actif' : 'Active sprint',
    filterAll:       lang === 'fr' ? 'Tous' : 'All',
    filterYes:       lang === 'fr' ? 'Oui' : 'Yes',
    filterNo:        lang === 'fr' ? 'Non' : 'No',
    loading:         lang === 'fr' ? 'Chargement...' : 'Loading...',
    error:           lang === 'fr' ? 'Erreur de chargement' : 'Failed to load projects',
    noResults:       lang === 'fr' ? 'Aucun projet trouve' : 'No projects match the filters',
    refreshedAt:     lang === 'fr' ? 'Mis a jour' : 'Refreshed',
    projectCount:    lang === 'fr' ? 'projets' : 'projects',
  };

  const [projects, setProjects]   = useState<ProjectRecord[]>([]);
  const [refreshed, setRefreshed] = useState<string>('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Filter state
  const [maturityFilter, setMaturityFilter] = useState<MaturityLevel | 'all'>('all');
  const [streamFilter,   setStreamFilter]   = useState<ProjectStream | 'all'>('all');
  const [sprintFilter,   setSprintFilter]   = useState<'all' | 'yes' | 'no'>('all');

  useEffect(() => {
    setLoading(true);
    fetchProjects()
      .then((res) => { setProjects(res.projects); setRefreshed(res.refreshed_at); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (maturityFilter !== 'all' && p.maturity !== maturityFilter) return false;
      if (streamFilter   !== 'all' && p.stream   !== streamFilter)   return false;
      if (sprintFilter === 'yes' && !p.sprint) return false;
      if (sprintFilter === 'no'  &&  p.sprint)  return false;
      return true;
    });
  }, [projects, maturityFilter, streamFilter, sprintFilter]);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Noto Sans, sans-serif', color: GC_TEXT }}>
      <NavHeader />

      {/* Page header */}
      <div role="region" aria-label="Page header" style={{ padding: '24px 32px', borderBottom: `1px solid ${GC_BORDER}`, background: GC_SURFACE }}>
        <h1 data-testid="portfolio-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: GC_TEXT }}>
          {t.title}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: GC_MUTED }}>{t.subtitle}</p>
        {refreshed && (
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: GC_MUTED }}>
            {t.refreshedAt}: {new Date(refreshed).toLocaleString()}
          </p>
        )}
      </div>

      {/* Filter bar */}
      <section
        data-testid="portfolio-filter-bar"
        aria-label={lang === 'fr' ? 'Filtres' : 'Filters'}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
          padding: '12px 32px', borderBottom: `1px solid ${GC_BORDER}`,
          background: '#fff',
        }}
      >
        {/* Maturity filter */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
          <span>{t.filterMaturity}:</span>
          <select
            data-testid="filter-maturity"
            value={maturityFilter}
            onChange={(e) => setMaturityFilter(e.target.value as MaturityLevel | 'all')}
            style={{ padding: '4px 8px', borderRadius: 3, border: `1px solid ${GC_BORDER}`, fontSize: '0.875rem' }}
          >
            <option value="all">{t.filterAll}</option>
            {ALL_MATURITIES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        {/* Stream filter */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
          <span>{t.filterStream}:</span>
          <select
            data-testid="filter-stream"
            value={streamFilter}
            onChange={(e) => setStreamFilter(e.target.value as ProjectStream | 'all')}
            style={{ padding: '4px 8px', borderRadius: 3, border: `1px solid ${GC_BORDER}`, fontSize: '0.875rem' }}
          >
            <option value="all">{t.filterAll}</option>
            {ALL_STREAMS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        {/* Sprint filter */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
          <span>{t.filterSprint}:</span>
          <select
            data-testid="filter-sprint"
            value={sprintFilter}
            onChange={(e) => setSprintFilter(e.target.value as 'all' | 'yes' | 'no')}
            style={{ padding: '4px 8px', borderRadius: 3, border: `1px solid ${GC_BORDER}`, fontSize: '0.875rem' }}
          >
            <option value="all">{t.filterAll}</option>
            <option value="yes">{t.filterYes}</option>
            <option value="no">{t.filterNo}</option>
          </select>
        </label>

        {/* Count badge */}
        {!loading && !error && (
          <span
            data-testid="portfolio-count"
            style={{ marginLeft: 'auto', fontSize: '0.78rem', color: GC_MUTED }}
          >
            {filtered.length} {t.projectCount}
          </span>
        )}
      </section>

      {/* Main content */}
      <main id="main-content" style={{ padding: '24px 32px' }}>
        {loading && (
          <p data-testid="portfolio-loading" role="status" aria-live="polite" style={{ color: GC_MUTED }}>
            {t.loading}
          </p>
        )}

        {error && (
          <p data-testid="portfolio-error" role="alert" style={{ color: GC_BLUE }}>
            {t.error}: {error}
          </p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p data-testid="portfolio-empty" style={{ color: GC_MUTED }}>
            {t.noResults}
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div
            data-testid="portfolio-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} lang={lang} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
