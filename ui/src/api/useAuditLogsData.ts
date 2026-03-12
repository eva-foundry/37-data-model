/**
 * useAuditLogsData — API-layer data hook for AuditLogsPage (WI-10)
 *
 * Provides items, isLoading, error, and AuditLogFilter[] shapes for
 * direct use with AdminListPage<AuditLog>.
 *
 * Output path: src/api/ (API-calling hooks live here, not src/hooks/).
 *
 * Backend: BackendApiClient.getAuditEvents() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET  /audit/events
 */
import { useState, useCallback, useEffect } from 'react';
import { BackendApiClient } from '@services/BackendApiClient';

// ---------------------------------------------------------------------------
// Entity type
// ---------------------------------------------------------------------------

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  entityType: string;
  action: string;
  outcome: 'success' | 'failure';
  details: string;
}

// ---------------------------------------------------------------------------
// Filter shape — mirrors AdminListFilter from @eva/templates (local copy)
// ---------------------------------------------------------------------------

export interface AuditLogFilter {
  key: string;
  label: string;
  type: 'text' | 'select';
  value: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

export interface UseAuditLogsDataReturn {
  items: AuditLog[];
  isLoading: boolean;
  error: string | null;
  filters: AuditLogFilter[];
  load: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useAuditLogsData = (): UseAuditLogsDataReturn => {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityTypeValue, setEntityTypeValue] = useState('');
  const [outcomeValue, setOutcomeValue] = useState('');
  const [actorValue, setActorValue] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (entityTypeValue) params['entityType'] = entityTypeValue;
      if (outcomeValue) params['outcome'] = outcomeValue;
      if (actorValue) params['actor'] = actorValue;
      const response = await BackendApiClient.getAuditEvents(params);
      setItems(response.events as AuditLog[]);
    } catch {
      setError('admin.auditLogs.error.fetch');
    } finally {
      setIsLoading(false);
    }
  }, [entityTypeValue, outcomeValue, actorValue]);

  // Initial load (no filters)
  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const response = await BackendApiClient.getAuditEvents({});
        setItems(response.events as AuditLog[]);
      } catch {
        setError('admin.auditLogs.error.fetch');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filters: AuditLogFilter[] = [
    {
      key: 'entityType',
      label: 'admin.auditLogs.filter.entityType',
      type: 'select',
      value: entityTypeValue,
      options: [
        { value: '', label: 'admin.auditLogs.filter.entityType.all' },
        { value: 'App', label: 'admin.auditLogs.filter.entityType.app' },
        { value: 'Setting', label: 'admin.auditLogs.filter.entityType.setting' },
        { value: 'RBAC', label: 'admin.auditLogs.filter.entityType.rbac' },
      ],
      onChange: setEntityTypeValue,
    },
    {
      key: 'outcome',
      label: 'admin.auditLogs.filter.outcome',
      type: 'select',
      value: outcomeValue,
      options: [
        { value: '', label: 'admin.auditLogs.filter.outcome.all' },
        { value: 'success', label: 'admin.auditLogs.filter.outcome.success' },
        { value: 'failure', label: 'admin.auditLogs.filter.outcome.failure' },
      ],
      onChange: setOutcomeValue,
    },
    {
      key: 'actor',
      label: 'admin.auditLogs.filter.actor',
      type: 'text',
      value: actorValue,
      placeholder: 'admin.auditLogs.filter.actor.placeholder',
      onChange: setActorValue,
    },
  ];

  return { items, isLoading, error, filters, load };
};
