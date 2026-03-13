/**
 * useSearchHealthData — API-layer data hook for SearchHealthPage (WI-13)
 *
 * Provides indexes[], isLoading, error, triggerReindex() for
 * direct use with AdminListPage<SearchIndex>.
 *
 * Backend: BackendApiClient.getSearchHealth() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET  /v1/admin/search/health
 *   POST /v1/admin/search/reindex
 */
import { useState, useCallback, useEffect } from 'react';
import { BackendApiClient } from '@services/BackendApiClient';

// ---------------------------------------------------------------------------
// Entity type
// ---------------------------------------------------------------------------

export type SearchIndexStatus = 'healthy' | 'degraded' | 'error';

export interface SearchIndex {
  indexName: string;
  status: SearchIndexStatus;
  docCount: number;
  lastIndexed: string;
  healthScore: number; // 0–100
}

export interface UseSearchHealthDataReturn {
  items: SearchIndex[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  triggerReindex: (indexName: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useSearchHealthData = (): UseSearchHealthDataReturn => {
  const [items, setItems] = useState<SearchIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await BackendApiClient.getSearchHealth();
      setItems(response.indexes as SearchIndex[]);
    } catch {
      setError('admin.searchHealth.error.fetch');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerReindex = useCallback(async (indexName: string) => {
    try {
      await BackendApiClient.triggerReindex(indexName);
    } catch {
      setError('admin.searchHealth.error.reindex');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, isLoading, error, load, triggerReindex };
};
