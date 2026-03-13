/**
 * useTranslationsData — API-layer data hook for TranslationsPage
 *
 * Provides items, isLoading, error, and AdminListFilter[] shapes
 * for direct use with AdminListPage<Translation>.
 *
 * Output path: src/api/ (per agent output-path rules — hooks that call BackendApiClient
 * live in src/api/, not src/hooks/).
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Translation, TranslationFilters } from '../types/translations';

/**
 * Local filter shape — mirrors AdminListFilter from @eva/templates.
 * Defined locally to avoid cross-package type resolution issues while
 * @eva/templates ships without generated .d.ts from tsup.
 */
export interface TranslationFilter {
  key: string;
  label: string;
  type: 'text' | 'select';
  value: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}
import { BackendApiClient } from '@services/BackendApiClient';
import { telemetry } from '@services/TelemetryService';

export interface UseTranslationsDataReturn {
  items: Translation[];
  isLoading: boolean;
  error: string | null;
  filters: TranslationFilter[];
  load: () => Promise<void>;
  deleteTranslation: (key: string) => Promise<void>;
}

export const useTranslationsData = (): UseTranslationsDataReturn => {
  const [items, setItems] = useState<Translation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [categoryValue, setCategoryValue] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: TranslationFilters = {
        keyContains: searchValue || undefined,
        category: categoryValue || undefined,
      };
      const response = await BackendApiClient.getTranslations(filters);
      setItems(response.translations);
    } catch {
      setError('admin.translationsPage.status.loadError');
    } finally {
      setIsLoading(false);
    }
  }, [searchValue, categoryValue]);

  // Initial load (no filters)
  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const response = await BackendApiClient.getTranslations({});
        setItems(response.translations);
      } catch {
        setError('admin.translationsPage.status.loadError');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'admin.translationsPage.filters.categoryAll' },
      ...[...new Set(items.map((i) => i.category).filter((c): c is string => Boolean(c)))].map(
        (c) => ({ value: c, label: c }),
      ),
    ],
    [items],
  );

  const filters: TranslationFilter[] = [
    {
      key: 'search',
      label: 'admin.translationsPage.filters.key',
      type: 'text',
      value: searchValue,
      placeholder: 'admin.translationsPage.filters.keyPlaceholder',
      onChange: setSearchValue,
    },
    {
      key: 'category',
      label: 'admin.translationsPage.filters.category',
      type: 'select',
      value: categoryValue,
      options: categoryOptions,
      onChange: setCategoryValue,
    },
  ];

  const deleteTranslation = useCallback(async (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
    telemetry.track('translation_delete', { key });
  }, []);

  return { items, isLoading, error, filters, load, deleteTranslation };
};
