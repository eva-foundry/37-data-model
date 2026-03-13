/**
 * useFeatureFlagsData — API-layer data hook for FeatureFlagsPage (WI-15)
 *
 * Provides flags[], isLoading, error, toggleFlag() with optimistic update + rollback for
 * direct use with AdminListPage<FeatureFlag>.
 *
 * Backend: BackendApiClient.getFeatureFlags() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET   /v1/admin/feature-flags
 *   PATCH /v1/admin/feature-flags/{flagKey}
 */
import { useState, useCallback, useEffect } from 'react';
import { BackendApiClient } from '@services/BackendApiClient';

// ---------------------------------------------------------------------------
// Entity type
// ---------------------------------------------------------------------------

export interface FeatureFlag {
  flagKey: string;
  label: string;
  enabled: boolean;
  description: string;
  lastModified: string;
  modifiedBy: string;
}

export interface UseFlagDataReturn {
  items: FeatureFlag[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  toggleFlag: (flagKey: string, enabled: boolean) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useFeatureFlagsData = (): UseFlagDataReturn => {
  const [items, setItems] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await BackendApiClient.getFeatureFlags();
      setItems(response.flags as FeatureFlag[]);
    } catch {
      setError('admin.featureFlags.error.fetch');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleFlag = useCallback(async (flagKey: string, enabled: boolean) => {
    // Optimistic update
    const previous = items.find((f) => f.flagKey === flagKey);
    setItems((prev) =>
      prev.map((f) => (f.flagKey === flagKey ? { ...f, enabled } : f)),
    );
    try {
      await BackendApiClient.toggleFeatureFlag(flagKey, enabled);
    } catch {
      // Revert on failure
      if (previous !== undefined) {
        setItems((prev) =>
          prev.map((f) => (f.flagKey === flagKey ? { ...f, enabled: previous.enabled } : f)),
        );
      }
      setError('admin.featureFlags.error.toggle');
    }
  }, [items]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, isLoading, error, load, toggleFlag };
};
