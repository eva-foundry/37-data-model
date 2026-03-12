/**
 * WBSNodeRow -- portal-face component
 *
 * Single row in the WBS tree: level-aware indent, type icon,
 * expand/collapse toggle, phase gate lock icon with tooltip.
 * F31-PM2 WI-F11, WI-F12, WI-F13
 */

import React from 'react';
import type { WBSNode, WBSNodeType } from '@/types/scrum';
import type { Lang } from '@context/LangContext';

interface WBSNodeRowProps {
  node: WBSNode;
  isExpanded?: boolean;
  hasChildren?: boolean;
  onToggle?: (id: string) => void;
  lang?: Lang;
  tabIndex?: number;
}

/** ASCII-safe type icons (no Unicode above U+007F) */
const TYPE_ICON: Record<WBSNodeType, string> = {
  phase:     '[P]',
  epic:      '[E]',
  feature:   '[F]',
  task:      '[T]',
  milestone: '[M]',
};

const GC_TEXT    = '#0b0c0e';
const GC_MUTED   = '#505a5f';
const GC_BLUE    = '#1d70b8';
const GC_LOCKED  = '#d4351c';

export const WBSNodeRow = React.forwardRef<HTMLDivElement, WBSNodeRowProps>(function WBSNodeRow({
  node, isExpanded = false, hasChildren = false, onToggle, lang = 'en', tabIndex,
}, ref) {
  const indent = node.level * 20;

  const lockLabel = lang === 'fr' ? 'Porte de phase verrouillee' : 'Phase gate locked';
  const expandLabel = isExpanded
    ? (lang === 'fr' ? 'Reduire' : 'Collapse')
    : (lang === 'fr' ? 'Agrandir' : 'Expand');

  return (
    <div
      ref={ref}
      data-testid={`wbs-row-${node.id}`}
      role="row"
      tabIndex={tabIndex}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingLeft: indent + 12,
        paddingRight: 12,
        paddingTop: 6,
        paddingBottom: 6,
        borderBottom: '1px solid #f0f0f0',
        fontFamily: 'Noto Sans, sans-serif',
        color: node.is_locked ? GC_MUTED : GC_TEXT,
        background: node.type === 'phase' ? '#f8f8f8' : '#fff',
      }}
    >
      <div role="gridcell" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      {/* Expand / collapse toggle */}
      {hasChildren
        ? (
          <button
            data-testid={`wbs-toggle-${node.id}`}
            aria-expanded={isExpanded}
            aria-label={`${expandLabel}: ${node.title}`}
            onClick={() => onToggle?.(node.id)}
            style={{
              width: 18, height: 18, flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer',
              color: GC_BLUE, fontSize: '0.75rem', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isExpanded ? '-' : '+'}
          </button>
        )
        : <span style={{ width: 18, flexShrink: 0 }} aria-hidden="true" />
      }

      {/* Node type badge */}
      <span
        data-testid={`wbs-type-${node.id}`}
        aria-label={node.type}
        style={{
          fontSize: '0.7rem', fontWeight: 700, color: GC_MUTED,
          minWidth: 28, flexShrink: 0,
        }}
      >
        {TYPE_ICON[node.type]}
      </span>

      {/* Title */}
      <span
        data-testid={`wbs-title-${node.id}`}
        style={{
          flex: 1, fontSize: '0.875rem',
          fontWeight: node.type === 'phase' ? 700 : 400,
          color: node.is_locked ? GC_MUTED : GC_TEXT,
        }}
      >
        {node.title}
      </span>

      {/* Sprint tag */}
      {node.sprint && (
        <span
          data-testid={`wbs-sprint-${node.id}`}
          style={{ fontSize: '0.75rem', color: GC_BLUE }}
        >
          {node.sprint}
        </span>
      )}

      {/* Lock icon */}
      {node.is_locked && (
        <span
          data-testid={`wbs-lock-${node.id}`}
          role="img"
          aria-label={lockLabel}
          title={lockLabel}
          style={{ fontSize: '0.8rem', color: GC_LOCKED, flexShrink: 0 }}
        >
          [LOCKED]
        </span>
      )}
    </div>{/* /gridcell */}
    </div>
  );
});
