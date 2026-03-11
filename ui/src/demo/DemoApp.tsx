import React, { useMemo, useState } from 'react';
import { useLang, type Lang } from '@context/LangContext';
import { acceleratorRoutes, adminRoutes, layerRoutes, portalRoutes } from '../layerRoutes';
import { GC_BLUE, GC_BORDER, GC_MUTED, GC_SURFACE, GC_TEXT } from '../styles/tokens';

type RouteItem = {
  path: string;
  element: React.ReactNode;
};

type RouteGroup = {
  key: string;
  title: Record<Lang, string>;
  routes: RouteItem[];
};

const UI_TEXT: Record<Lang, {
  appTitle: string;
  appSubtitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  selectedLabel: string;
  totalLabel: string;
}> = {
  en: {
    appTitle: 'EVA Screens Machine Portal',
    appSubtitle: 'Full navigation for generated routes and modules',
    searchLabel: 'Search',
    searchPlaceholder: 'Find a screen',
    selectedLabel: 'Selected route',
    totalLabel: 'Total routes',
  },
  fr: {
    appTitle: 'Portail EVA Screens Machine',
    appSubtitle: 'Navigation complete pour les routes et modules generes',
    searchLabel: 'Recherche',
    searchPlaceholder: 'Trouver un ecran',
    selectedLabel: 'Route selectionnee',
    totalLabel: 'Routes totales',
  },
  es: {
    appTitle: 'Portal EVA Screens Machine',
    appSubtitle: 'Navegacion completa para rutas y modulos generados',
    searchLabel: 'Buscar',
    searchPlaceholder: 'Buscar pantalla',
    selectedLabel: 'Ruta seleccionada',
    totalLabel: 'Rutas totales',
  },
  de: {
    appTitle: 'EVA Screens Machine Portal',
    appSubtitle: 'Vollstandige Navigation fur generierte Routen und Module',
    searchLabel: 'Suche',
    searchPlaceholder: 'Ansicht finden',
    selectedLabel: 'Ausgewahlte Route',
    totalLabel: 'Gesamtrouten',
  },
  pt: {
    appTitle: 'Portal EVA Screens Machine',
    appSubtitle: 'Navegacao completa para rotas e modulos gerados',
    searchLabel: 'Buscar',
    searchPlaceholder: 'Encontrar tela',
    selectedLabel: 'Rota selecionada',
    totalLabel: 'Rotas totais',
  },
};

const GROUPS: RouteGroup[] = [
  {
    key: 'portal',
    title: { en: 'Portal', fr: 'Portail', es: 'Portal', de: 'Portal', pt: 'Portal' },
    routes: portalRoutes,
  },
  {
    key: 'layers',
    title: { en: 'Data Model Layers', fr: 'Couches modele', es: 'Capas del modelo', de: 'Modellschichten', pt: 'Camadas do modelo' },
    routes: layerRoutes,
  },
  {
    key: 'admin',
    title: { en: 'Admin', fr: 'Admin', es: 'Admin', de: 'Admin', pt: 'Admin' },
    routes: adminRoutes,
  },
  {
    key: 'accelerator',
    title: { en: 'Accelerator', fr: 'Accelerateur', es: 'Acelerador', de: 'Beschleuniger', pt: 'Acelerador' },
    routes: acceleratorRoutes,
  },
];

const ALL_KEYS = GROUPS.flatMap((group) =>
  group.routes.map((route) => `${group.key}:${route.path}`)
);

const LANGUAGE_OPTIONS: Array<{ code: Lang; label: string; abbr: string }> = [
  { code: 'en', label: 'English', abbr: 'EN' },
  { code: 'fr', label: 'Francais', abbr: 'FR' },
  { code: 'es', label: 'Espanol', abbr: 'ES' },
  { code: 'de', label: 'Deutsch', abbr: 'DE' },
  { code: 'pt', label: 'Portugues', abbr: 'PT' },
];

function toDisplayName(path: string): string {
  const trimmed = path.replace(/^\//, '');
  if (!trimmed) return 'home';
  return trimmed
    .split('/')
    .join(' - ')
    .replace(/[_-]/g, ' ');
}

function findRouteByKey(selectionKey: string): RouteItem | null {
  const [groupKey, routePath] = selectionKey.split(':');
  const group = GROUPS.find((item) => item.key === groupKey);
  if (!group) return null;
  return group.routes.find((route) => route.path === routePath) ?? null;
}

export const DemoApp: React.FC = () => {
  const { lang, setLang } = useLang();
  const text = UI_TEXT[lang];
  const [query, setQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState(ALL_KEYS[0]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const selectedRoute = findRouteByKey(selectedKey);

  const groupedRoutes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GROUPS.map((group) => {
      const filtered = q
        ? group.routes.filter((route) => route.path.toLowerCase().includes(q))
        : group.routes;
      return { ...group, routes: filtered };
    }).filter((group) => group.routes.length > 0);
  }, [query]);

  const totalRoutes = GROUPS.reduce((total, group) => total + group.routes.length, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: GC_TEXT }}>
      <header
        style={{
          borderBottom: `1px solid ${GC_BORDER}`,
          padding: '16px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, color: GC_BLUE, fontSize: '1.3rem' }}>{text.appTitle}</h1>
            <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: GC_MUTED }}>{text.appSubtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              style={{
                border: `1px solid ${GC_BORDER}`,
                borderRadius: '6px',
                padding: '7px 10px',
                background: '#fff',
                color: GC_TEXT,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Menu
            </button>
            <label style={{ fontSize: '0.8rem', color: GC_MUTED }}>
              Lang
              <select
                value={lang}
                onChange={(event) => setLang(event.target.value as Lang)}
                style={{ marginLeft: '8px', padding: '7px 10px', border: `1px solid ${GC_BORDER}`, borderRadius: '6px' }}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.abbr} - {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 88px)' }}>
        <aside
          style={{
            width: isMenuOpen ? '320px' : '280px',
            borderRight: `1px solid ${GC_BORDER}`,
            background: GC_SURFACE,
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          <label style={{ display: 'block', fontSize: '0.78rem', color: GC_MUTED, marginBottom: '8px' }}>
            {text.searchLabel}
          </label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text.searchPlaceholder}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: `1px solid ${GC_BORDER}`,
              borderRadius: '6px',
              padding: '8px 10px',
              marginBottom: '16px',
            }}
          />

          {groupedRoutes.map((group) => (
            <section key={group.key} style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '0.84rem', margin: '0 0 8px', color: GC_BLUE }}>
                {group.title[lang]} ({group.routes.length})
              </h2>
              <div style={{ display: 'grid', gap: '6px' }}>
                {group.routes.map((route) => {
                  const key = `${group.key}:${route.path}`;
                  const isSelected = selectedKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedKey(key)}
                      style={{
                        textAlign: 'left',
                        border: `1px solid ${isSelected ? GC_BLUE : GC_BORDER}`,
                        background: isSelected ? '#dfefff' : '#fff',
                        color: GC_TEXT,
                        borderRadius: '6px',
                        padding: '7px 9px',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                      }}
                    >
                      {toDisplayName(route.path)}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </aside>

        <main style={{ flex: 1, padding: '20px', overflowX: 'auto' }}>
          <div
            style={{
              border: `1px solid ${GC_BORDER}`,
              borderRadius: '8px',
              background: '#fff',
              padding: '16px',
              marginBottom: '14px',
            }}
          >
            <p style={{ margin: 0, color: GC_MUTED, fontSize: '0.82rem' }}>
              {text.selectedLabel}: <strong>{selectedRoute?.path ?? '-'}</strong>
            </p>
            <p style={{ margin: '6px 0 0', color: GC_MUTED, fontSize: '0.8rem' }}>
              {text.totalLabel}: {totalRoutes}
            </p>
          </div>

          <div style={{ border: `1px solid ${GC_BORDER}`, borderRadius: '8px', padding: '16px', minHeight: '560px' }}>
            {selectedRoute ? selectedRoute.element : <p style={{ color: GC_MUTED }}>No route selected.</p>}
          </div>
        </main>
      </div>
    </div>
  );
};
