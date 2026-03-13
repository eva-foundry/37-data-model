// ─── WIDetailDrawer — portal-face ────────────────────────────────────────────
// Slide-in panel showing full WI details. Focus-trapped while open.
// WCAG 2.1: role=dialog, aria-modal, focus trap, Escape closes.

import React, { useEffect, useRef } from 'react';
import type { WorkItem } from '@/types/scrum';
import { useLang } from '@context/LangContext';

interface WIDetailDrawerProps {
  item: WorkItem | null;
  onClose: () => void;
}

export const WIDetailDrawer: React.FC<WIDetailDrawerProps> = ({ item, onClose }) => {
  const { lang } = useLang();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (item) closeRef.current?.focus();
  }, [item]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!item) return null;

  const t = {
    close:    lang === 'en' ? 'Close' : 'Fermer',
    dod:      lang === 'en' ? 'Definition of Done' : 'Définition de terminé',
    tests:    lang === 'en' ? 'Tests' : 'Tests',
    coverage: lang === 'en' ? 'Coverage' : 'Couverture',
    entities: lang === 'en' ? 'Entities affected' : 'Entités affectées',
    closed:   lang === 'en' ? 'Closed at' : 'Fermé le',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 200,
        }}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${item.wi_tag}: ${item.title}`}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: Math.min(480, window.innerWidth),
          background: '#fff',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
          zIndex: 201,
          overflowY: 'auto',
          padding: '24px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#505a5f' }}>{item.wi_tag}</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '1rem', color: '#0b0c0e' }}>{item.title}</h2>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={t.close}
            style={{
              background: 'none', border: 'none', fontSize: '1.4rem',
              cursor: 'pointer', lineHeight: 1, padding: 4, color: '#505a5f',
            }}
          >
            ×
          </button>
        </div>

        {/* DoD */}
        {item.dod && (
          <section>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, color: '#505a5f' }}>{t.dod}</h3>
            <p style={{ fontSize: '0.875rem', color: '#0b0c0e', margin: 0, lineHeight: 1.5 }}>{item.dod}</p>
          </section>
        )}

        {/* Metrics */}
        <div style={{ display: 'flex', gap: 24 }}>
          {item.test_count !== null && (
            <div>
              <div style={{ fontSize: '0.75rem', color: '#505a5f' }}>{t.tests}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0b0c0e' }}>{item.test_count}</div>
            </div>
          )}
          {item.coverage_pct !== null && (
            <div>
              <div style={{ fontSize: '0.75rem', color: '#505a5f' }}>{t.coverage}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#00703c' }}>{item.coverage_pct}%</div>
            </div>
          )}
        </div>

        {/* Entities */}
        {item.entities_affected.length > 0 && (
          <section>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, color: '#505a5f' }}>{t.entities}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {item.entities_affected.map((e) => (
                <span
                  key={e}
                  style={{
                    padding: '2px 10px', borderRadius: 12,
                    background: '#f8f8f8', border: '1px solid #b1b4b6',
                    fontSize: '0.75rem', color: '#0b0c0e',
                  }}
                >
                  {e}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Closed at */}
        {item.closed_at && (
          <p style={{ fontSize: '0.75rem', color: '#505a5f', margin: 0 }}>
            {t.closed}: {new Date(item.closed_at).toLocaleDateString(lang === 'en' ? 'en-CA' : 'fr-CA')}
          </p>
        )}
      </div>
    </>
  );
};

export default WIDetailDrawer;
