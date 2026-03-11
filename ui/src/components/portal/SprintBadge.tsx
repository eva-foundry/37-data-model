// ─── SprintBadge — portal-face ────────────────────────────────────────────────
// Coloured pill badge showing sprint state for a product.
// GC Design System colour tokens only.

import React from 'react';
import type { SprintBadgeState } from '@/types/scrum';
import { useLang } from '@context/LangContext';

const BG: Record<SprintBadgeState, string> = {
  Active:  '#1d70b8',
  Done:    '#00703c',
  Blocked: '#d4351c',
};

const LABELS: Record<SprintBadgeState, [string, string]> = {
  Active:  ['Active',  'Actif'],
  Done:    ['Done',    'Terminé'],
  Blocked: ['Blocked', 'Bloqué'],
};

interface SprintBadgeProps {
  state: SprintBadgeState;
  activeCount?: number;
}

export const SprintBadge: React.FC<SprintBadgeProps> = ({ state, activeCount }) => {
  const { lang } = useLang();
  const label = LABELS[state][lang === 'en' ? 0 : 1];
  const count = state === 'Active' && activeCount !== undefined && activeCount > 0
    ? ` (${activeCount})`
    : '';

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 12,
        background: BG[state],
        color: '#fff',
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
      aria-label={`Sprint status: ${label}${count}`}
    >
      {label}{count}
    </span>
  );
};

export default SprintBadge;
