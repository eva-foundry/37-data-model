/**
 * CriticalPathPanel -- portal-face component
 *
 * Ordered list of critical path items with sprint gate pass/fail badges.
 * Click on item fires onScrollToNode callback (for scroll-to-node WI-F17).
 * F31-PM2 WI-F15, WI-F16, WI-F17
 */

import React from 'react';
import type { CriticalPathItem } from '@/types/scrum';
import type { Lang } from '@context/LangContext';

interface CriticalPathPanelProps {
  items: CriticalPathItem[];
  lang?: Lang;
  onScrollToNode?: (nodeId: string) => void;
}

const GC_BLUE  = '#1d70b8';
const GC_TEXT  = '#0b0c0e';
const GC_PASS  = '#00703c';
const GC_FAIL  = '#d4351c';
const GC_MUTED = '#505a5f';

export const CriticalPathPanel: React.FC<CriticalPathPanelProps> = ({
  items, lang = 'en', onScrollToNode,
}) => {
  const t = {
    title:    lang === 'fr' ? 'Chemin critique' : 'Critical Path',
    empty:    lang === 'fr' ? 'Aucun element sur le chemin critique.' : 'No critical path items.',
    pass:     lang === 'fr' ? 'Franchie' : 'Gate pass',
    fail:     lang === 'fr' ? 'Bloquee' : 'Gate fail',
    sprint:   lang === 'fr' ? 'Sprint' : 'Sprint',
    noSprint: lang === 'fr' ? 'Hors sprint' : 'No sprint',
    goto:     lang === 'fr' ? 'Aller a ce noeud' : 'Scroll to node',
  };

  return (
    <section
      data-testid="critical-path-panel"
      aria-label={t.title}
      style={{
        background: '#f8f8f8',
        border: '1px solid #b1b4b6',
        borderRadius: 4,
        padding: '12px 16px',
        fontFamily: 'Noto Sans, sans-serif',
      }}
    >
      <h2
        data-testid="critical-path-title"
        style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, color: GC_TEXT }}
      >
        {t.title}
      </h2>

      {items.length === 0
        ? <p data-testid="critical-path-empty" style={{ color: GC_MUTED, fontSize: '0.875rem', margin: 0 }}>{t.empty}</p>
        : (
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, idx) => (
              <li
                key={item.node_id}
                data-testid={`crit-item-${item.node_id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#fff', border: '1px solid #e8e8e8',
                  borderRadius: 4, padding: '8px 12px',
                }}
              >
                {/* Position number */}
                <span
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: GC_BLUE, color: '#fff',
                    fontSize: '0.72rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </span>

                {/* Title + sprint */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: GC_TEXT }}>
                    <span data-testid={`crit-tag-${item.node_id}`} style={{ color: GC_MUTED, marginRight: 6 }}>
                      {item.wi_tag}
                    </span>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: GC_MUTED, marginTop: 2 }}>
                    {item.sprint ? `${t.sprint}: ${item.sprint}` : t.noSprint}
                  </div>
                </div>

                {/* Gate badge */}
                <span
                  data-testid={`crit-gate-${item.node_id}`}
                  aria-label={item.is_gate_passing ? t.pass : t.fail}
                  style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    padding: '2px 6px', borderRadius: 3,
                    background: item.is_gate_passing ? '#e8f5e7' : '#ffe9e9',
                    color: item.is_gate_passing ? GC_PASS : GC_FAIL,
                    border: `1px solid ${item.is_gate_passing ? GC_PASS : GC_FAIL}`,
                    flexShrink: 0,
                  }}
                >
                  {item.is_gate_passing ? t.pass : t.fail}
                </span>

                {/* Scroll-to-node button */}
                {onScrollToNode && (
                  <button
                    data-testid={`crit-goto-${item.node_id}`}
                    aria-label={`${t.goto}: ${item.title}`}
                    onClick={() => onScrollToNode(item.node_id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: GC_BLUE, fontSize: '0.78rem', flexShrink: 0,
                      padding: '2px 4px',
                    }}
                  >
                    &gt;
                  </button>
                )}
              </li>
            ))}
          </ol>
        )
      }
    </section>
  );
};
