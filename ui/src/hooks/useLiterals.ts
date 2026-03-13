import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@context/LangContext';

/**
 * Literal record from L17 literals layer
 */
interface Literal {
  key: string;
  default_en: string;
  default_fr: string;
  default_de: string;
  default_pt: string;
  default_cn: string;
  default_es: string;
  screens?: string[];
  category?: string;
  status?: string;
}

/**
 * Translation function signature
 */
type TranslationFunction = (key: string, vars?: Record<string, any>) => string;

/**
 * Cache for loaded literals
 */
type LiteralsCache = Record<string, Literal>;

/**
 * Mock literals for demo.portal scope (fallback when API unavailable)
 * IMPORTANT: These MUST load for the demo UI to work
 */
const MOCK_LITERALS: LiteralsCache = {
  'demo.portal.app.title': {
    key: 'demo.portal.app.title',
    default_en: 'EVA Data Model UI Demo',
    default_fr: 'Démo de l\'IU du modèle de données EVA',
    default_de: 'EVA Datenmodell UI Demo',
    default_pt: 'Demo da IU do modelo de dados EVA',
    default_cn: 'EVA 数据模型 UI 演示',
    default_es: 'Demo de IU del modelo de datos EVA'
  },
  'demo.portal.app.subtitle': {
    key: 'demo.portal.app.subtitle',
    default_en: 'Screens Machine - 128 Routes Generated',
    default_fr: 'Machine d\'écrans - 128 routes générées',
    default_de: 'Bildschirmmaschine - 128 Routen generiert',
    default_pt: 'Máquina de telas - 128 rotas geradas',
    default_cn: '屏幕机器 - 已生成 128 条路由',
    default_es: 'Máquina de pantallas - 128 rutas generadas'
  },
  'demo.portal.search.label': {
    key: 'demo.portal.search.label',
    default_en: 'Search routes',
    default_fr: 'Rechercher des routes',
    default_de: 'Routen suchen',
    default_pt: 'Pesquisar rotas',
    default_cn: '搜索路由',
    default_es: 'Buscar rutas'
  },
  'demo.portal.search.placeholder': {
    key: 'demo.portal.search.placeholder',
    default_en: 'Filter by path...',
    default_fr: 'Filtrer par chemin...',
    default_de: 'Nach Pfad filtern...',
    default_pt: 'Filtrar por caminho...',
    default_cn: '按路径筛选...',
    default_es: 'Filtrar por ruta...'
  },
  'demo.portal.groups.portal': {
    key: 'demo.portal.groups.portal',
    default_en: 'Portal Pages',
    default_fr: 'Pages du portail',
    default_de: 'Portalseiten',
    default_pt: 'Páginas do portal',
    default_cn: '门户页面',
    default_es: 'Páginas del portal'
  },
  'demo.portal.groups.layers': {
    key: 'demo.portal.groups.layers',
    default_en: 'Data Layers',
    default_fr: 'Couches de données',
    default_de: 'Datenschichten',
    default_pt: 'Camadas de dados',
    default_cn: '数据层',
    default_es: 'Capas de datos'
  },
  'demo.portal.groups.admin': {
    key: 'demo.portal.groups.admin',
    default_en: 'Admin Tools',
    default_fr: 'Outils d\'administration',
    default_de: 'Admin-Tools',
    default_pt: 'Ferramentas de administração',
    default_cn: '管理工具',
    default_es: 'Herramientas de administración'
  },
  'demo.portal.groups.accelerator': {
    key: 'demo.portal.groups.accelerator',
    default_en: 'Accelerator Pages',
    default_fr: 'Pages accélératrices',
    default_de: 'Beschleuniger-Seiten',
    default_pt: 'Páginas do acelerador',
    default_cn: '加速器页面',
    default_es: 'Páginas del acelerador'
  },
  'demo.portal.actions.menu': {
    key: 'demo.portal.actions.menu',
    default_en: 'Menu',
    default_fr: 'Menu',
    default_de: 'Menü',
    default_pt: 'Menu',
    default_cn: '菜单',
    default_es: 'Menú'
  },
  'demo.portal.labels.language': {
    key: 'demo.portal.labels.language',
    default_en: 'Language:',
    default_fr: 'Langue:',
    default_de: 'Sprache:',
    default_pt: 'Idioma:',
    default_cn: '语言:',
    default_es: 'Idioma:'
  },
  'demo.portal.summary.selectedRoute': {
    key: 'demo.portal.summary.selectedRoute',
    default_en: 'Selected Route',
    default_fr: 'Route sélectionnée',
    default_de: 'Ausgewählte Route',
    default_pt: 'Rota selecionada',
    default_cn: '选定的路由',
    default_es: 'Ruta seleccionada'
  },
  'demo.portal.summary.totalRoutes': {
    key: 'demo.portal.summary.totalRoutes',
    default_en: 'Total Routes',
    default_fr: 'Routes totales',
    default_de: 'Gesamtrouten',
    default_pt: 'Rotas totais',
    default_cn: '总路由',
    default_es: 'Rutas totales'
  },
  'demo.portal.summary.noRouteSelected': {
    key: 'demo.portal.summary.noRouteSelected',
    default_en: 'Please select a route from the sidebar',
    default_fr: 'Veuillez sélectionner une route dans la barre latérale',
    default_de: 'Bitte wählen Sie eine Route aus der Seitenleiste',
    default_pt: 'Selecione uma rota na barra lateral',
    default_cn: '请从侧边栏选择路由',
    default_es: 'Seleccione una ruta de la barra lateral'
  }
};

/**
 * Fetch literals from Data Model API
 */
async function fetchLiteralsFromAPI(scope?: string): Promise<LiteralsCache> {
  const baseUrl = import.meta.env.VITE_DATA_MODEL_URL || 'https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io';
  
  try {
    // Build query: if scope provided, filter by key prefix
    const query = scope ? `?key_prefix=${encodeURIComponent(scope)}` : '?limit=1000';
    const url = `${baseUrl}/model/literals/${query}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[useLiterals] API fetch failed: ${response.status}`);
      // Return mock literals for demo.portal scope
      if (scope && scope.startsWith('demo.portal')) {
        return MOCK_LITERALS;
      }
      return {};
    }
    
    const data = await response.json();
    const literals: Literal[] = Array.isArray(data) ? data : data.records || [];
    
    // Convert array to keyed object for fast lookup
    const cache: LiteralsCache = {};
    literals.forEach((lit) => {
      cache[lit.key] = lit;
    });
    
    // Merge with mock literals if empty and scope is demo.portal
    if (Object.keys(cache).length === 0 && scope && scope.startsWith('demo.portal')) {
      return MOCK_LITERALS;
    }
    
    return cache;
  } catch (err) {
    console.error('[useLiterals] Failed to fetch literals:', err);
    // Return mock literals for demo.portal scope
    if (scope && scope.startsWith('demo.portal')) {
      return MOCK_LITERALS;
    }
    return {};
  }
}

/**
 * Interpolate variables into translated text
 * Example: "Welcome, {name}!" + { name: "John" } → "Welcome, John!"
 */
function interpolate(text: string, vars?: Record<string, any>): string {
  if (!vars) return text;
  
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? String(vars[key]) : match;
  });
}

/**
 * Hook for accessing localized literals from L17 layer
 * 
 * @param scope - Optional namespace prefix (e.g., 'projects.create_form')
 * @returns Translation function that resolves keys to localized strings
 * 
 * @example
 * ```tsx
 * // Scoped usage (recommended)
 * const t = useLiterals('projects.create_form');
 * <button>{t('actions.submit')}</button>  // → "Create" (EN) / "Créer" (FR) / etc.
 * 
 * // Unscoped usage (for common literals)
 * const t = useLiterals();
 * <button>{t('common.actions.close')}</button>
 * 
 * // With interpolation
 * const t = useLiterals('projects.detail');
 * <p>{t('welcome', { name: userName })}</p>  // → "Welcome, John!" (EN) / etc.
 * ```
 */
export function useLiterals(scope?: string): TranslationFunction {
  const { lang } = useLang();
  const [literals, setLiterals] = useState<LiteralsCache>({});
  
  // Load literals on mount or when scope changes
  useEffect(() => {
    let cancelled = false;
    
    async function loadLiterals() {
      // FAST PATH: For demo.portal scope, use MOCK_LITERALS directly (no API call)
      if (scope && scope.startsWith('demo.portal')) {
        console.log('[useLiterals] Using MOCK_LITERALS for demo.portal (fast path)');
        if (!cancelled) {
          setLiterals(MOCK_LITERALS);
        }
        return;
      }
      
      // Try localStorage cache first (24-hour TTL)
      const cacheKey = `literals:${scope || 'global'}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          const ttl = 24 * 60 * 60 * 1000; // 24 hours
          
          // Don't trust empty cached data - always fetch fresh
          const hasData = Object.keys(data).length > 0;
          
          if (age < ttl && hasData) {
            if (!cancelled) {
              setLiterals(data);
            }
            return;
          }
        } catch (err) {
          console.warn('[useLiterals] Invalid cache data:', err);
        }
      }
      
      // Fetch from API
      const data = await fetchLiteralsFromAPI(scope);
      
      if (!cancelled) {
        // CRITICAL DEBUG: Log what we got
        const keyCount = Object.keys(data).length;
        console.log(`[useLiterals] Loaded ${keyCount} literals for scope: ${scope || 'global'}`);
        
        // If empty for demo.portal scope, force MOCK_LITERALS
        if (keyCount === 0 && scope && scope.startsWith('demo.portal')) {
          console.warn('[useLiterals] Empty data for demo.portal - forcing MOCK_LITERALS');
          setLiterals(MOCK_LITERALS);
        } else {
          setLiterals(data);
        }
        
        // Update cache (only if we have data)
        if (keyCount > 0) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              data,
              timestamp: Date.now()
            }));
          } catch (err) {
            console.warn('[useLiterals] Failed to cache literals:', err);
          }
        }
      }
    }
    
    loadLiterals();
    
    return () => {
      cancelled = true;
    };
  }, [scope]);
  
  // Translation function
  const t: TranslationFunction = useCallback((key: string, vars?: Record<string, any>) => {
    // Build full key (prepend scope if provided)
    const fullKey = scope ? `${scope}.${key}` : key;
    
    // Lookup literal
    const literal = literals[fullKey];
    
    if (!literal) {
      // No hardcoded fallback text by policy; surface the missing key.
      console.warn(`[useLiterals] Literal not found: ${fullKey}`);
      return `[${fullKey}]`;
    }
    
    // Get translation for current language, fallback to English
    const langKey = `default_${lang}` as keyof Literal;
    const text = (literal[langKey] as string) || literal.default_en || fullKey;
    
    // Interpolate variables if provided
    return interpolate(text, vars);
  }, [scope, literals, lang]);
  
  return t;
}
