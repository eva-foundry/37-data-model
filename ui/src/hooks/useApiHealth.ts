import { useState, useEffect } from 'react';

export type ApiHealthStatus = 'healthy' | 'degraded' | 'unavailable' | 'checking';

export interface ApiHealthState {
  status: ApiHealthStatus;
  message: string;
  lastChecked: Date | null;
  endpoint: string;
}

/**
 * Hook to monitor Data Model API health
 * Checks API availability and returns status for user notification
 * 
 * Screen Machine Pattern: All generated pages should use this for graceful degradation
 */
export function useApiHealth(): ApiHealthState {
  const [health, setHealth] = useState<ApiHealthState>({
    status: 'checking',
    message: 'Checking API status...',
    lastChecked: null,
    endpoint: '',
  });

  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    async function checkHealth() {
      const endpoint = import.meta.env.VITE_DATA_MODEL_URL || 
        'https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io';

      try {
        // Use /health or /model/layers endpoint as health check
        const controller = new AbortController();
        const timeoutMs = 5000; // 5 second timeout
        const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(`${endpoint}/health`, {
          signal: controller.signal,
          method: 'GET',
        });

        clearTimeout(timeoutHandle);

        if (!cancelled) {
          if (response.ok) {
            setHealth({
              status: 'healthy',
              message: 'Data Model API is operational',
              lastChecked: new Date(),
              endpoint,
            });
          } else {
            setHealth({
              status: 'degraded',
              message: `Data Model API returned ${response.status}. Some features may not work.`,
              lastChecked: new Date(),
              endpoint,
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          const isTimeout = err instanceof Error && err.name === 'AbortError';
          setHealth({
            status: 'unavailable',
            message: isTimeout
              ? 'Data Model API is not responding. UI will work with cached/mock data only.'
              : 'Data Model API is unreachable. Displaying demo with mock data.',
            lastChecked: new Date(),
            endpoint,
          });
        }
      }
    }

    // Initial check
    checkHealth();

    // Recheck every 60 seconds
    timeoutId = setInterval(checkHealth, 60000);

    return () => {
      cancelled = true;
      clearInterval(timeoutId);
    };
  }, []);

  return health;
}
