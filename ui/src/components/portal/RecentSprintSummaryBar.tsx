// ─── RecentSprintSummaryBar — portal-face ────────────────────────────────────
// Sticky footer strip: shows latest active project + sprint badge.
// Hidden when summaries array is empty.

import React from 'react';
import type { SprintSummary } from '@/types/scrum';
import { SprintBadge } from './SprintBadge';
import { useLang } from '@context/LangContext';

interface RecentSprintSummaryBarProps {
  summaries: SprintSummary[];
}

export const RecentSprintSummaryBar: React.FC<RecentSprintSummaryBarProps> = ({ summaries }) => {
  const { lang } = useLang();

  const active = summaries.filter((s) => s.badge === 'Active');
  if (active.length === 0) return null;

  const label = lang === 'en' ? 'Active sprints:' : 'Sprints actifs :';

  return (
    <div
      role="region"
      aria-label={lang === 'en' ? 'Recent sprint activity' : 'Activité de sprint récente'}
      style={{
        position: 'sticky',
        bottom: 0,
        background: '#f8f8f8',
        borderTop: '1px solid #b1b4b6',
        padding: '8px 32px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 10,
        fontSize: '0.8rem',
        color: '#505a5f',
      }}
    >
      <span style={{ fontWeight: 600 }}>{label}</span>
      {active.map((s) => (
        <span key={s.project} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 500 }}>{s.project}</span>
          <SprintBadge state={s.badge} activeCount={s.active_count} />
        </span>
      ))}
    </div>
  );
};

export default RecentSprintSummaryBar;
