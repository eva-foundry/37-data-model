/**
 * useSettingsData — API-layer data hook for SettingsPage (WI-3)
 *
 * Provides items, isLoading, error, and AdminListFilter[] shapes
 * for direct use with AdminListPage<Setting>.
 *
 * Output path: src/api/ (per agent output-path rules — hooks that call BackendApiClient
 * live in src/api/, not src/hooks/).
 *
 * Backend: BackendApiClient.getSettings() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (brain-v2 Sprint 5, not yet live):
 *   GET   /settings
 *   PATCH /settings/{key}
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Setting, SettingFilters } from '../types/settings';
import { BackendApiClient } from '@services/BackendApiClient';

/**
 * Local filter shape — mirrors AdminListFilter from @eva/templates.
 * Defined locally to avoid cross-package type resolution issues while
 * @eva/templates ships without generated .d.ts from tsup.
 */
export interface SettingFilter {
  key: string;
  label: string;
  type: 'text' | 'select';
  value: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

export interface UseSettingsDataReturn {
  items: Setting[];
  isLoading: boolean;
  error: string | null;
  filters: SettingFilter[];
  load: () => Promise<void>;
}

export const useSettingsData = (): UseSettingsDataReturn => {
  const [items, setItems] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryValue, setCategoryValue] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiFilters: SettingFilters = {
        category: categoryValue || undefined,
      };
      const response = await BackendApiClient.getSettings(apiFilters);
      setItems(response.settings as Setting[]);
    } catch {
      setError('admin.settings.error.fetch');
    } finally {
      setIsLoading(false);
    }
  }, [categoryValue]);

  // Initial load (no filters)
  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const response = await BackendApiClient.getSettings({});
        setItems(response.settings as Setting[]);
      } catch {
        setError('admin.settings.error.fetch');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive unique category options from loaded items
  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'admin.settings.filter.category.all' },
      ...[
        ...new Set(
          items
            .map((s) => s.category)
            .filter((c): c is string => Boolean(c)),
        ),
      ].map((c) => ({ value: c, label: c })),
    ],
    [items],
  );

  const filters: SettingFilter[] = [
    {
      key: 'category',
      label: 'admin.settings.filter.category',
      type: 'select',
      value: categoryValue,
      options: categoryOptions,
      onChange: setCategoryValue,
    },
  ];

  return { items, isLoading, error, filters, load };
};
