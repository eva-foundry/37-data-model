/**
 * useAppsData — API-layer data hook for AppsPage (WI-4)
 *
 * Provides items, isLoading, error, AdminListFilter[] shapes, and
 * a disableApp action for direct use with AdminListPage<App>.
 *
 * Output path: src/api/ (per agent output-path rules — hooks that call BackendApiClient
 * live in src/api/, not src/hooks/).
 *
 * Backend: BackendApiClient.getApps() / disableApp() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (brain-v2 App Registry, not yet live):
 *   GET  /apps
 *   POST /apps/{appId}/disable
 */
import { useState, useCallback, useEffect } from 'react';
import type { App, AppFilters } from '../types/apps';
import { BackendApiClient } from '@services/BackendApiClient';

/**
 * Local filter shape — mirrors AdminListFilter from @eva/templates.
 * Defined locally to avoid cross-package type resolution issues while
 * @eva/templates ships without generated .d.ts from tsup.
 */
export interface AppFilter {
  key: string;
  label: string;
  type: 'text' | 'select';
  value: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

export interface UseAppsDataReturn {
  items: App[];
  isLoading: boolean;
  error: string | null;
  filters: AppFilter[];
  load: () => Promise<void>;
  disableApp: (appId: string) => Promise<void>;
}

export const useAppsData = (): UseAppsDataReturn => {
  const [items, setItems] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qValue, setQValue] = useState('');
  const [visibilityValue, setVisibilityValue] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiFilters: AppFilters = {
        q: qValue || undefined,
        visibility: (visibilityValue as AppFilters['visibility']) || undefined,
      };
      const response = await BackendApiClient.getApps(apiFilters);
      setItems(response.apps as App[]);
    } catch {
      setError('admin.apps.error.fetch');
    } finally {
      setIsLoading(false);
    }
  }, [qValue, visibilityValue]);

  // Initial load (no filters)
  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const response = await BackendApiClient.getApps({});
        setItems(response.apps as App[]);
      } catch {
        setError('admin.apps.error.fetch');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const disableApp = useCallback(
    async (appId: string) => {
      await BackendApiClient.disableApp(appId);
      // Re-fetch to reflect updated disabled state
      await load();
    },
    [load],
  );

  const filters: AppFilter[] = [
    {
      key: 'q',
      label: 'admin.apps.filter.q',
      type: 'text',
      value: qValue,
      placeholder: 'admin.apps.filter.q.placeholder',
      onChange: setQValue,
    },
    {
      key: 'visibility',
      label: 'admin.apps.filter.visibility',
      type: 'select',
      value: visibilityValue,
      options: [
        { value: '', label: 'admin.apps.filter.visibility.all' },
        { value: 'public', label: 'admin.apps.filter.visibility.public' },
        { value: 'private', label: 'admin.apps.filter.visibility.private' },
      ],
      onChange: setVisibilityValue,
    },
  ];

  return { items, isLoading, error, filters, load, disableApp };
};
