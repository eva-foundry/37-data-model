/**
 * useRbacRolesData — API-layer data hook for RbacRolesPage (WI-16)
 *
 * Provides roles[], isLoading, error, createRole(), updateRole(), deleteRole() for
 * direct use with AdminListPage<Role>.
 *
 * Backend: BackendApiClient.getRbacRoles() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET    /v1/admin/rbac/roles
 *   POST   /v1/admin/rbac/roles
 *   PATCH  /v1/admin/rbac/roles/{roleId}
 *   DELETE /v1/admin/rbac/roles/{roleId}
 */
import { useState, useCallback, useEffect } from 'react';
import { BackendApiClient } from '@services/BackendApiClient';

// ---------------------------------------------------------------------------
// Entity type
// ---------------------------------------------------------------------------

export interface Role {
  roleId: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export type CreateRoleRequest = Omit<Role, 'roleId' | 'userCount'>;
export type UpdateRoleRequest = Partial<Omit<Role, 'roleId' | 'userCount'>>;

export interface UseRbacRolesDataReturn {
  items: Role[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  createRole: (data: CreateRoleRequest) => Promise<void>;
  updateRole: (roleId: string, data: UpdateRoleRequest) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useRbacRolesData = (): UseRbacRolesDataReturn => {
  const [items, setItems] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await BackendApiClient.getRbacRoles();
      setItems(response.roles as Role[]);
    } catch {
      setError('admin.rbacRoles.error.fetch');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRole = useCallback(async (data: CreateRoleRequest) => {
    try {
      const response = await BackendApiClient.createRbacRole(data);
      setItems((prev) => [...prev, response.role as Role]);
    } catch {
      setError('admin.rbacRoles.error.create');
    }
  }, []);

  const updateRole = useCallback(async (roleId: string, data: UpdateRoleRequest) => {
    try {
      await BackendApiClient.updateRbacRole(roleId, data);
      setItems((prev) =>
        prev.map((r) => (r.roleId === roleId ? { ...r, ...data } : r)),
      );
    } catch {
      setError('admin.rbacRoles.error.update');
    }
  }, []);

  const deleteRole = useCallback(async (roleId: string) => {
    try {
      await BackendApiClient.deleteRbacRole(roleId);
      setItems((prev) => prev.filter((r) => r.roleId !== roleId));
    } catch {
      setError('admin.rbacRoles.error.delete');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, isLoading, error, load, createRole, updateRole, deleteRole };
};
