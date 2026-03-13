// ─── WICard — portal-face ────────────────────────────────────────────────────
// Compact card for a single Work Item. Click opens WIDetailDrawer.

import React from 'react';
import type { WorkItem } from '@/types/scrum';
import { SprintBadge } from './SprintBadge';

const STATE_BADGE_MAP: Record<WorkItem['state'], 'Active' | 'Done' | 'Blocked'> = {
  Active:   'Active',
  Blocked:  'Blocked',
  Resolved: 'Done',
  Closed:   'Done',
  New:      'Active',
};

interface WICardProps {
  item: WorkItem;
  onClick: (item: WorkItem) => void;
}

export const WICard: React.FC<WICardProps> = ({ item, onClick }) => (
  <div
    role="button"
    tabIndex={0}
    aria-label={`${item.wi_tag}: ${item.title}`}
    onClick={() => onClick(item)}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(item); }}
    style={{
      padding: '10px 14px',
      border: '1px solid #b1b4b6',
      borderRadius: 4,
      background: '#fff',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      outline: 'none',
    }}
    onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 3px #1d70b8')}
    onBlur={(e)  => (e.currentTarget.style.boxShadow = 'none')}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#505a5f' }}>{item.wi_tag}</span>
      <SprintBadge state={STATE_BADGE_MAP[item.state]} />
    </div>
    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0b0c0e', lineHeight: 1.4 }}>
      {item.title}
    </span>
    <span style={{ fontSize: '0.75rem', color: '#505a5f' }}>{item.sprint}</span>
    {item.test_count !== null && (
      <span style={{ fontSize: '0.7rem', color: '#505a5f' }}>
        {item.test_count} tests
        {item.coverage_pct !== null ? ` · ${item.coverage_pct}% cov` : ''}
      </span>
    )}
  </div>
);

export default WICard;
