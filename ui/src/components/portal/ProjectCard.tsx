/**
 * ProjectCard -- portal-face component
 *
 * Card showing: name, description, MaturityBadge, PBI progress bar, sprint tag.
 * F31-PM1 WI-F2
 */

import React from 'react';
import { MaturityBadge } from './MaturityBadge';
import type { ProjectRecord } from '@/types/project';
import type { Lang } from '@context/LangContext';

interface ProjectCardProps {
  project: ProjectRecord;
  lang?: Lang;
  onClick?: (id: string) => void;
}

const GC_BLUE   = '#1d70b8';
const GC_TEXT   = '#0b0c0e';
const GC_BORDER = '#b1b4b6';
const GC_MUTED  = '#505a5f';

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, lang = 'en', onClick }) => {
  const { id, name, description, maturity, sprint, pbi_total, pbi_done } = project;

  const pct = pbi_total > 0 ? Math.round((pbi_done / pbi_total) * 100) : 0;

  const labels = {
    pbiProgress: lang === 'fr' ? 'PBI accomplis' : 'PBI progress',
    sprint:      lang === 'fr' ? 'Sprint' : 'Sprint',
    noSprint:    lang === 'fr' ? 'Hors sprint' : 'Not in sprint',
    done:        lang === 'fr' ? `${pbi_done} sur ${pbi_total}` : `${pbi_done} / ${pbi_total}`,
  };

  return (
    <article
      data-testid={`project-card-${id}`}
      aria-label={name}
      onClick={() => onClick?.(id)}
      style={{
        background: '#fff',
        border: `1px solid ${GC_BORDER}`,
        borderRadius: 4,
        padding: '16px 20px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'box-shadow 0.15s',
        fontFamily: 'Noto Sans, sans-serif',
      }}
    >
      {/* Header row: name + maturity badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: GC_TEXT }}>
          {name}
        </h2>
        <MaturityBadge maturity={maturity} lang={lang} />
      </div>

      {/* Description */}
      <p style={{ margin: 0, fontSize: '0.85rem', color: GC_MUTED, lineHeight: 1.4 }}>
        {description}
      </p>

      {/* PBI progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: GC_MUTED, marginBottom: 4 }}>
          <span>{labels.pbiProgress}</span>
          <span data-testid={`card-pbi-done-${id}`}>{labels.done}</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${labels.pbiProgress}: ${pct}%`}
          style={{
            height: 6, borderRadius: 3,
            background: '#e8e8e8',
            overflow: 'hidden',
          }}
        >
          <div
            data-testid={`card-progress-bar-${id}`}
            style={{
              height: '100%',
              width: `${pct}%`,
              background: pct === 100 ? '#00703c' : GC_BLUE,
              borderRadius: 3,
            }}
          />
        </div>
      </div>

      {/* Sprint tag */}
      <div style={{ fontSize: '0.78rem', color: GC_MUTED }}>
        {sprint
          ? <span data-testid={`card-sprint-${id}`} style={{ color: GC_BLUE, fontWeight: 600 }}>{labels.sprint}: {sprint}</span>
          : <span data-testid={`card-sprint-${id}`}>{labels.noSprint}</span>
        }
      </div>
    </article>
  );
};
