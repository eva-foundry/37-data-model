/**
 * EVAHomePage -- Launcher
 *
 * Route: /
 * Three portal tiles: EVA Agentic (/chat/), EVA Admin (/admin/translations),
 * EVA Command Center (/model)
 *
 * Original sprint tile content preserved but secondary.
 * WCAG 2.1 AA, bilingual EN/FR.
 */

import React from 'react';
import { useEffect, useState } from 'react';
import { NavHeader } from '@components/NavHeader';
import { ProductTileGrid } from '@components/ProductTileGrid';
import { useLang } from '@context/LangContext';
import { fetchSprintSummaries } from '@api/scrumApi';
import type { SprintSummary } from '@/types/scrum';

export const EVAHomePage: React.FC = () => {
  const { lang } = useLang();
  const [summaries, setSummaries] = useState<SprintSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchSprintSummaries()
      .then((data) => { if (mounted) { setSummaries(data); setError(null); } })
      .catch((err) => { if (mounted) { setError('Failed to load sprint data'); setSummaries([]); } })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const t = {
    title:    lang === 'en' ? 'EVA Portal' : 'Portail EVA',
    subtitle: lang === 'en'
      ? 'Government of Canada AI Platform'
      : 'Gouvernement du Canada Plateforme IA',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f2f1', display: 'flex', flexDirection: 'column' }}>
      <NavHeader />
      <main id="main-content" tabIndex={-1} style={{ flex: 1, padding: '40px 32px', maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* GC header bar */}
        <div style={{ background: '#26374a', color: '#fff', padding: '12px 24px', borderRadius: 4, marginBottom: 32 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Government of Canada / Gouvernement du Canada
          </span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0b0c0e', margin: '0 0 6px' }}>{t.title}</h1>
        <p style={{ fontSize: '1rem', color: '#505a5f', margin: '0 0 40px' }}>{t.subtitle}</p>
        {/* Loading and error states for sprint summaries */}
        {loading && <div role="status" style={{ marginBottom: 24, color: '#00703c', fontWeight: 600 }}>Loading sprint data...</div>}
        {error && <div role="alert" style={{ marginBottom: 24, color: '#d4351c', fontWeight: 600 }}>{error}</div>}
        {/* Product grid (5 categories, 23 products) */}
        {!loading && !error && <ProductTileGrid summaries={summaries} />}
      </main>
      <footer style={{ background: '#26374a', color: '#d3d3d3', padding: '16px 32px', fontSize: '0.8rem', textAlign: 'center' }}>
        EVA Platform -- Government of Canada / Gouvernement du Canada -- February 2026
      </footer>
    </div>
  );
};

export default EVAHomePage;
