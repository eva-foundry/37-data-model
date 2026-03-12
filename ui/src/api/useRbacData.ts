/**
 * useRbacData — API-layer data hook for RbacPage (WI-9)
 *
 * Provides items, isLoading, error, and RbacFilter[] shapes for
 * direct use with AdminListPage<UserRole>.
 *
 * Output path: src/api/ (API-calling hooks live here, not src/hooks/).
 *
 * Backend: BackendApiClient.getRbacAssignments() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET  /rbac/assignments
 */
import { useState, useCallback, useEffect } from 'react';
import { BackendApiClient } from '@services/BackendApiClient';

// ---------------------------------------------------------------------------
// Entity type
// ---------------------------------------------------------------------------

export interface UserRole {
  id: string;
  displayName: string;
  email: string;
  role: 'EVA_ADMIN' | 'EVA_EDITOR' | 'EVA_VIEWER';
  scope: string;
  enabled: boolean;
  updatedAt: string;
}

export interface UserRoleFilters {
  role?: 'EVA_ADMIN' | 'EVA_EDITOR' | 'EVA_VIEWER' | '';
  scope?: string;
}

// ---------------------------------------------------------------------------
// Filter shape — mirrors AdminListFilter from @eva/templates (local copy)
// ---------------------------------------------------------------------------

export interface RbacFilter {
  key: string;
  label: string;
  type: 'text' | 'select';
  value: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

export interface UseRbacDataReturn {
  items: UserRole[];
  isLoading: boolean;
  error: string | null;
  filters: RbacFilter[];
  load: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useRbacData = (): UseRbacDataReturn => {
  const [items, setItems] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleValue, setRoleValue] = useState('');
  const [scopeValue, setScopeValue] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (roleValue) params['role'] = roleValue;
      if (scopeValue) params['scope'] = scopeValue;
      const response = await BackendApiClient.getRbacAssignments(params);
      setItems(response.assignments as UserRole[]);
    } catch {
      setError('admin.rbac.error.fetch');
    } finally {
      setIsLoading(false);
    }
  }, [roleValue, scopeValue]);

  // Initial load (no filters)
  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const response = await BackendApiClient.getRbacAssignments({});
        setItems(response.assignments as UserRole[]);
      } catch {
        setError('admin.rbac.error.fetch');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filters: RbacFilter[] = [
    {
      key: 'role',
      label: 'admin.rbac.filter.role',
      type: 'select',
      value: roleValue,
      options: [
        { value: '', label: 'admin.rbac.filter.role.all' },
        { value: 'EVA_ADMIN', label: 'admin.rbac.filter.role.admin' },
        { value: 'EVA_EDITOR', label: 'admin.rbac.filter.role.editor' },
        { value: 'EVA_VIEWER', label: 'admin.rbac.filter.role.viewer' },
      ],
      onChange: setRoleValue,
    },
    {
      key: 'scope',
      label: 'admin.rbac.filter.scope',
      type: 'select',
      value: scopeValue,
      options: [
        { value: '', label: 'admin.rbac.filter.scope.all' },
        { value: 'global', label: 'admin.rbac.filter.scope.global' },
        { value: 'jurisprudence', label: 'admin.rbac.filter.scope.jurisprudence' },
        { value: 'finops', label: 'admin.rbac.filter.scope.finops' },
      ],
      onChange: setScopeValue,
    },
  ];

  return { items, isLoading, error, filters, load };
};
