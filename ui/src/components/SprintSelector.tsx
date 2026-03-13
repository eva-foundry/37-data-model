// ─── SprintSelector — portal-face ────────────────────────────────────────────
// Dropdown to filter sprint board by sprint name.

import React from 'react';
import { useLang } from '@context/LangContext';

interface SprintSelectorProps {
  sprints: string[];
  selected: string;
  onChange: (sprint: string) => void;
}

export const SprintSelector: React.FC<SprintSelectorProps> = ({ sprints, selected, onChange }) => {
  const { lang } = useLang();
  const label = lang === 'en' ? 'Sprint' : 'Sprint';

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.875rem' }}>
      {label}
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: '1px solid #b1b4b6',
          borderRadius: 4,
          padding: '4px 8px',
          fontSize: '0.875rem',
          background: '#fff',
          cursor: 'pointer',
        }}
        aria-label={`Select ${label}`}
      >
        <option value="all">{lang === 'en' ? 'All sprints' : 'Tous les sprints'}</option>
        {sprints.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </label>
  );
};

export default SprintSelector;
