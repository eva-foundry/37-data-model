// ─── ProductTileGrid — portal-face ───────────────────────────────────────────
// Renders all 23 EVA products in 5 category groups.
// Static catalogue defined here; sprint summaries injected via prop.
// Source: 39-ado-dashboard spec — eva-ado-dashboard.epic.yaml §screens[0].component_specs.ProductTileGrid

import React from 'react';
import type { Product, ProductCategory, SprintSummary } from '@/types/scrum';
import { ProductTile } from './ProductTile';
import { useLang } from '@context/LangContext';

// ─── Static product catalogue (23 products × 5 categories) ──────────────────

const PRODUCTS: Product[] = [
  // User Products
  { id: 'eva-chat',          name: ['EVA Chat',            'Conversation EVA'],       category: 'User Products',  adoProject: 'faces',         href: '/chat',         icon: '💬' },
  { id: 'eva-da',            name: ['EVA Document Analyst','Analyste doc. EVA'],      category: 'User Products',  adoProject: 'da',            href: '/da',           icon: '📄' },
  { id: 'eva-portal',        name: ['EVA Portal',          'Portail EVA'],            category: 'User Products',  adoProject: 'ado-dashboard', href: '/',             icon: '🏠' },
  { id: 'eva-jurisprudence', name: ['EVA Jurisprudence',   'Jurisprudence EVA'],      category: 'User Products',  adoProject: null,            href: '/jurisprudence',icon: '⚖️' },
  { id: 'eva-translate',     name: ['EVA Translate',       'Traduction EVA'],         category: 'User Products',  adoProject: null,            href: '/translate',    icon: '🌐' },
  // AI Intelligence
  { id: 'eva-brain',         name: ['EVA Brain',           'Cerveau EVA'],            category: 'AI Intelligence',adoProject: 'brain-v2',      href: '/devops/sprint',icon: '🧠' },
  { id: 'eva-embedder',      name: ['EVA Embedder',        'Intégrateur EVA'],        category: 'AI Intelligence',adoProject: null,            href: '/embedder',     icon: '🔢' },
  { id: 'eva-rag',           name: ['EVA RAG',             'RAG EVA'],                category: 'AI Intelligence',adoProject: null,            href: '/rag',          icon: '🔍' },
  { id: 'eva-eval',          name: ['EVA Eval',            'Évaluation EVA'],         category: 'AI Intelligence',adoProject: null,            href: '/eval',         icon: '📊' },
  { id: 'eva-finops',        name: ['EVA FinOps',          'FinOps EVA'],             category: 'AI Intelligence',adoProject: 'finops',        href: '/finops',       icon: '💰' },
  // Platform
  { id: 'eva-faces',         name: ['EVA Faces',           'Faces EVA'],              category: 'Platform',       adoProject: 'faces',         href: '/faces',        icon: '🖥️' },
  { id: 'eva-apim',          name: ['EVA APIM',            'APIM EVA'],               category: 'Platform',       adoProject: 'apim',          href: '/apim',         icon: '🔀' },
  { id: 'eva-auth',          name: ['EVA Auth',            'Auth EVA'],               category: 'Platform',       adoProject: null,            href: '/auth',         icon: '🔐' },
  { id: 'eva-infra',         name: ['EVA Infrastructure',  'Infrastructure EVA'],     category: 'Platform',       adoProject: null,            href: '/infra',        icon: '☁️' },
  { id: 'eva-cosmos',        name: ['EVA Cosmos',          'Cosmos EVA'],             category: 'Platform',       adoProject: null,            href: '/cosmos',       icon: '🗄️' },
  // Developer
  { id: 'eva-data-model',    name: ['EVA Data Model',      'Modèle de données EVA'],  category: 'Developer',      adoProject: 'data-model',    href: '/data-model',   icon: '📐' },
  { id: 'eva-ado-poc',       name: ['EVA ADO PoC',         'Preuv. ADO EVA'],         category: 'Developer',      adoProject: 'ado-poc',       href: '/devops/sprint',icon: '📋' },
  { id: 'eva-sdk',           name: ['EVA SDK',             'SDK EVA'],                category: 'Developer',      adoProject: null,            href: '/sdk',          icon: '🛠️' },
  { id: 'eva-cli',           name: ['EVA CLI',             'ILC EVA'],                category: 'Developer',      adoProject: null,            href: '/cli',          icon: '⌨️' },
  { id: 'eva-devcontainer',  name: ['EVA DevContainer',    'DevContainer EVA'],       category: 'Developer',      adoProject: null,            href: '/devcontainer', icon: '📦' },
  // Moonshot
  { id: 'eva-agents',        name: ['EVA Agents',          'Agents EVA'],             category: 'Moonshot',       adoProject: 'agents',        href: '/agents',       icon: '🤖' },
  { id: 'eva-foundry',       name: ['EVA Foundry',         'Fonderie EVA'],           category: 'Moonshot',       adoProject: 'foundry',       href: '/foundry',      icon: '🏭' },
  { id: 'eva-copilot',       name: ['EVA Copilot',         'Copilote EVA'],           category: 'Moonshot',       adoProject: null,            href: '/copilot',      icon: '🚀' },
];

const CATEGORY_ORDER: ProductCategory[] = [
  'User Products',
  'AI Intelligence',
  'Platform',
  'Developer',
  'Moonshot',
];

const CATEGORY_LABELS: Record<ProductCategory, [string, string]> = {
  'User Products':   ['User Products',   'Produits utilisateur'],
  'AI Intelligence': ['AI Intelligence', 'Intelligence IA'],
  'Platform':        ['Platform',        'Plateforme'],
  'Developer':       ['Developer',       'Développeur'],
  'Moonshot':        ['Moonshot',        'Moonshot'],
};

interface ProductTileGridProps {
  summaries: SprintSummary[];
}

export const ProductTileGrid: React.FC<ProductTileGridProps> = ({ summaries }) => {
  const { lang } = useLang();

  const summaryMap = React.useMemo(() => {
    const m = new Map<string, SprintSummary>();
    summaries.forEach((s) => m.set(s.project, s));
    return m;
  }, [summaries]);

  return (
    <div>
      {CATEGORY_ORDER.map((cat) => {
        const items = PRODUCTS.filter((p) => p.category === cat);
        const catLabel = CATEGORY_LABELS[cat][lang === 'en' ? 0 : 1];
        return (
          <section key={cat} style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#0b0c0e',
                borderBottom: '2px solid #1d70b8',
                paddingBottom: 4,
                marginBottom: 16,
              }}
            >
              {catLabel}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 12,
              }}
            >
              {items.map((p) => (
                <ProductTile
                  key={p.id}
                  product={p}
                  summary={p.adoProject ? summaryMap.get(p.adoProject) : undefined}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default ProductTileGrid;
