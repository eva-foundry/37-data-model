/**
 * MaturityBadge -- portal-face component
 *
 * Colour-coded pill showing a project maturity level.
 * Forced-colors safe (uses both background and border).
 * F31-PM1 WI-F3
 */

import React from 'react';
import type { MaturityLevel } from '@/types/project';

interface MaturityStyle {
  bg: string;
  text: string;
  border: string;
  label: string;
  labelFr: string;
}

const MATURITY_STYLES: Record<MaturityLevel, MaturityStyle> = {
  active:  { bg: '#e8f5e7', text: '#00703c', border: '#00703c', label: 'active',  labelFr: 'actif'    },
  poc:     { bg: '#fff5cc', text: '#6a4f00', border: '#f2a900', label: 'poc',     labelFr: 'poc'      },
  idea:    { bg: '#f0f4f8', text: '#505a5f', border: '#b1b4b6', label: 'idea',    labelFr: 'idee'     },
  retired: { bg: '#ffe9e9', text: '#d4351c', border: '#d4351c', label: 'retired', labelFr: 'archive'  },
  empty:   { bg: '#f8f8f8', text: '#505a5f', border: '#d8d8d8', label: 'empty',   labelFr: 'vide'     },
};

interface MaturityBadgeProps {
  maturity: MaturityLevel;
  lang?: 'en' | 'fr';
  /** Optional extra className (not used -- CSS-in-JS only) */
  className?: string;
}

export const MaturityBadge: React.FC<MaturityBadgeProps> = ({
  maturity, lang = 'en',
}) => {
  const s = MATURITY_STYLES[maturity] ?? MATURITY_STYLES.idea;
  const label = lang === 'fr' ? s.labelFr : s.label;

  return (
    <span
      data-testid={`maturity-badge-${maturity}`}
      role="status"
      aria-label={label}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
};
