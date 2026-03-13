// ─── ProjectFilterBar — portal-face ──────────────────────────────────────────
// Pill-button filter row to show WIs for a specific ADO project.

import React from 'react';
import { useLang } from '@context/LangContext';

interface ProjectFilterBarProps {
  projects: string[];
  selected: string;
  onChange: (project: string) => void;
}

const GC_BLUE    = '#1d70b8';
const GC_BORDER  = '#b1b4b6';
const GC_SURFACE = '#f8f8f8';

export const ProjectFilterBar: React.FC<ProjectFilterBarProps> = ({ projects, selected, onChange }) => {
  const { lang } = useLang();
  const allLabel = lang === 'en' ? 'All' : 'Tous';

  return (
    <div
      role="group"
      aria-label={lang === 'en' ? 'Filter by project' : 'Filtrer par projet'}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
    >
      {['all', ...projects].map((p) => {
        const active = selected === p;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-pressed={active}
            style={{
              padding: '4px 14px',
              borderRadius: 16,
              border: `1px solid ${active ? GC_BLUE : GC_BORDER}`,
              background: active ? GC_BLUE : GC_SURFACE,
              color: active ? '#fff' : '#0b0c0e',
              fontWeight: active ? 700 : 400,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {p === 'all' ? allLabel : p}
          </button>
        );
      })}
    </div>
  );
};

export default ProjectFilterBar;
