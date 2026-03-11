// ─── NavHeader — portal-face ──────────────────────────────────────────────────
// GC Design System top bar with skip link, GC signature, language toggle,
// and primary navigation (Sprint Board gated by view:devops permission).
// FACES-WI-A/B/C — WCAG 2.1 AA required.

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '@context/LangContext';
import { PermissionGate } from '@components/PermissionGate';

const GC_BLUE = '#1d70b8';
const GC_TEXT = '#0b0c0e';
const GC_BORDER = '#b1b4b6';
const GC_SURFACE = '#f8f8f8';

const styles: Record<string, React.CSSProperties> = {
  skipLink: {
    position: 'absolute',
    top: '-100%',
    left: 0,
    padding: '8px 16px',
    background: GC_BLUE,
    color: '#fff',
    fontWeight: 600,
    zIndex: 9999,
    textDecoration: 'none',
    transition: 'top 0.1s',
  },
  skipLinkFocus: {
    top: 0,
  },
  header: {
    background: GC_SURFACE,
    borderBottom: `1px solid ${GC_BORDER}`,
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  maple: {
    fontSize: '1.4rem',
    lineHeight: 1,
  },
  signature: {
    fontSize: '0.8rem',
    color: GC_TEXT,
    whiteSpace: 'nowrap',
  },
  divider: {
    width: 1,
    height: 28,
    background: GC_BORDER,
    display: 'inline-block',
  },
  productName: {
    fontWeight: 600,
    fontSize: '1rem',
    color: GC_TEXT,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  langBtn: {
    background: 'none',
    border: `1px solid ${GC_BLUE}`,
    color: GC_BLUE,
    borderRadius: 4,
    padding: '4px 12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  nav: {
    background: GC_SURFACE,
    borderBottom: `1px solid ${GC_BORDER}`,
    padding: '0 32px',
    display: 'flex',
    gap: 0,
  },
  navLink: {
    display: 'inline-block',
    padding: '10px 16px',
    fontSize: '0.9375rem',
    fontWeight: 400,
    color: GC_TEXT,
    textDecoration: 'none',
    borderBottom: '3px solid transparent',
  },
  navLinkActive: {
    color: GC_BLUE,
    borderBottom: `3px solid ${GC_BLUE}`,
    fontWeight: 600,
  },
};

export const NavHeader: React.FC = () => {
  const { lang, setLang } = useLang();
  const location = useLocation();
  const [skipFocused, setSkipFocused] = React.useState(false);

  const productName = lang === 'en' ? 'EVA Portal' : 'Portail EVA';
  const govLabel    = lang === 'en' ? 'Government of Canada' : 'Gouvernement du Canada';
  const skipLabel   = lang === 'en' ? 'Skip to main content' : 'Passer au contenu principal';
  const toggleLabel = lang === 'en' ? 'Français' : 'English';
  const toggleLang  = lang === 'en' ? 'fr' : 'en';

  /** Merge active style when the current path matches the link href. */
  function navLinkStyle(href: string): React.CSSProperties {
    const isActive = location.pathname === href
      || (href !== '/' && location.pathname.startsWith(href));
    return { ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) };
  }

  return (
    <>
      {/* Skip link — WCAG 2.1 SC 2.4.1 */}
      <a
        href="#main-content"
        style={{ ...styles.skipLink, ...(skipFocused ? styles.skipLinkFocus : {}) }}
        onFocus={() => setSkipFocused(true)}
        onBlur={() => setSkipFocused(false)}
      >
        {skipLabel}
      </a>

      <header style={styles.header} role="banner">
        <div style={styles.left}>
          <span style={styles.maple} aria-hidden="true">🍁</span>
          <span style={styles.signature}>{govLabel}</span>
          <span style={styles.divider} aria-hidden="true" />
          <span style={styles.productName}>{productName}</span>
        </div>
        <div style={styles.right}>
          <button
            style={styles.langBtn}
            onClick={() => setLang(toggleLang)}
            aria-label={`Switch language to ${toggleLabel}`}
            lang={toggleLang}
          >
            {toggleLabel}
          </button>
        </div>
      </header>

      {/* Primary navigation — Sprint Board visible to view:devops only */}
      <nav aria-label={lang === 'en' ? 'Primary navigation' : 'Navigation principale'} style={styles.nav}>
        <Link
          to="/"
          style={navLinkStyle('/')}
          aria-current={location.pathname === '/' ? 'page' : undefined}
        >
          {lang === 'en' ? 'Home' : 'Accueil'}
        </Link>

        <PermissionGate requires="view:devops">
          <Link
            to="/devops/sprint"
            style={navLinkStyle('/devops/sprint')}
            aria-current={location.pathname === '/devops/sprint' ? 'page' : undefined}
          >
            {lang === 'en' ? 'Sprint Board' : 'Tableau de sprint'}
          </Link>
        </PermissionGate>

        <PermissionGate requires="view:model">
          <Link
            to="/model"
            style={navLinkStyle('/model')}
            aria-current={location.pathname === '/model' ? 'page' : undefined}
          >
            {lang === 'en' ? 'Data Model' : 'Modele de donnees'}
          </Link>
        </PermissionGate>

        <PermissionGate requires="view:model">
          <Link
            to="/model/graph"
            style={navLinkStyle('/model/graph')}
            aria-current={location.pathname === '/model/graph' ? 'page' : undefined}
          >
            {lang === 'en' ? 'Model Graph' : 'Graphe du modele'}
          </Link>
        </PermissionGate>

        <PermissionGate requires="view:portal">
          <Link
            to="/portal/projects"
            style={navLinkStyle('/portal/projects')}
            aria-current={location.pathname === '/portal/projects' ? 'page' : undefined}
          >
            {lang === 'en' ? 'Projects' : 'Projets'}
          </Link>
        </PermissionGate>

        <PermissionGate requires="view:portal">
          <Link
            to="/portal/wbs"
            style={navLinkStyle('/portal/wbs')}
            aria-current={location.pathname === '/portal/wbs' ? 'page' : undefined}
          >
            {lang === 'en' ? 'WBS' : 'SDT'}
          </Link>
        </PermissionGate>
      </nav>
    </>
  );
};

export default NavHeader;
