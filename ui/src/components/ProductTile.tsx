// ─── ProductTile — portal-face ────────────────────────────────────────────────
// Single product card: icon, bilingual name, category, optional sprint badge.
// GC Design System tokens; keyboard navigable.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product, SprintSummary } from '@/types/scrum';
import { useLang } from '@context/LangContext';
import { SprintBadge } from './SprintBadge';

const GC_BORDER  = '#b1b4b6';
const GC_TEXT    = '#0b0c0e';
const GC_SEC     = '#505a5f';
const GC_SURFACE = '#f8f8f8';

interface ProductTileProps {
  product: Product;
  summary?: SprintSummary;
}

export const ProductTile: React.FC<ProductTileProps> = ({ product, summary }) => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const name = product.name[lang === 'en' ? 0 : 1];
  const isExternal = product.href.startsWith('http');

  const handleActivate = () => {
    if (isExternal) {
      window.location.href = product.href;
    } else {
      navigate(product.href);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={name}
      onClick={handleActivate}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleActivate(); }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        padding: '16px 14px',
        border: `1px solid ${GC_BORDER}`,
        borderRadius: 6,
        background: GC_SURFACE,
        cursor: 'pointer',
        minHeight: 110,
        outline: 'none',
        transition: 'box-shadow 0.15s',
        userSelect: 'none',
      }}
      onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 3px #1d70b8')}
      onBlur={(e)  => (e.currentTarget.style.boxShadow = 'none')}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      <span aria-hidden="true" style={{ fontSize: '1.8rem', lineHeight: 1 }}>
        {product.icon}
      </span>
      <strong style={{ fontSize: '0.9rem', color: GC_TEXT, lineHeight: 1.3 }}>{name}</strong>
      {summary && (
        <SprintBadge state={summary.badge} activeCount={summary.active_count} />
      )}
      <em style={{ fontSize: '0.75rem', color: GC_SEC, marginTop: 'auto' }}>
        {product.category}
      </em>
    </div>
  );
};

export default ProductTile;
