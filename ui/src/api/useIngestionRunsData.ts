/**
 * useIngestionRunsData — API-layer data hook for IngestionRunsPage (WI-12)
 *
 * Provides runs[], isLoading, error, triggerRun(), cancelRun() for
 * direct use with AdminListPage<IngestionRun>.
 *
 * Backend: BackendApiClient.getIngestionRuns() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET   /v1/admin/ingestion/runs
 *   POST  /v1/admin/ingestion/runs
 *   PATCH /v1/admin/ingestion/runs/{runId}
 */
import { useState, useCallback, useEffect } from 'react';
import { BackendApiClient } from '@services/BackendApiClient';

// ---------------------------------------------------------------------------
// Entity type
// ---------------------------------------------------------------------------

export type IngestionRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface IngestionRun {
  runId: string;
  status: IngestionRunStatus;
  startedAt: string;
  completedAt: string | null;
  documentCount: number;
}

export interface UseIngestionRunsDataReturn {
  items: IngestionRun[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  triggerRun: () => Promise<void>;
  cancelRun: (runId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useIngestionRunsData = (): UseIngestionRunsDataReturn => {
  const [items, setItems] = useState<IngestionRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await BackendApiClient.getIngestionRuns();
      setItems(response.runs as IngestionRun[]);
    } catch {
      setError('admin.ingestionRuns.error.fetch');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerRun = useCallback(async () => {
    try {
      const response = await BackendApiClient.triggerIngestionRun();
      setItems((prev) => [response.run as IngestionRun, ...prev]);
    } catch {
      setError('admin.ingestionRuns.error.trigger');
    }
  }, []);

  const cancelRun = useCallback(async (runId: string) => {
    try {
      await BackendApiClient.cancelIngestionRun(runId);
      setItems((prev) =>
        prev.map((r) => (r.runId === runId ? { ...r, status: 'cancelled' as const } : r)),
      );
    } catch {
      setError('admin.ingestionRuns.error.cancel');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, isLoading, error, load, triggerRun, cancelRun };
};
