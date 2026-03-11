import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@context/LangContext';

/**
 * Literal record from L17 literals layer
 */
interface Literal {
  key: string;
  default_en: string;
  default_fr: string;
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
      return {};
    }
    
    const data = await response.json();
    const literals: Literal[] = Array.isArray(data) ? data : data.records || [];
    
    // Convert array to keyed object for fast lookup
    const cache: LiteralsCache = {};
    literals.forEach((lit) => {
      cache[lit.key] = lit;
    });
    
    return cache;
  } catch (err) {
    console.error('[useLiterals] Failed to fetch literals:', err);
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
      // Try localStorage cache first (24-hour TTL)
      const cacheKey = `literals:${scope || 'global'}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          const ttl = 24 * 60 * 60 * 1000; // 24 hours
          
          if (age < ttl) {
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
        setLiterals(data);
        
        // Update cache
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
      // Not found - return key in brackets for debugging
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
