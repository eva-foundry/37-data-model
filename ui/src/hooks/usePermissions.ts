/**
 * usePermissions.ts — portal-face
 *
 * Derive permission booleans from the resolved EVAUser in AuthContext.
 * Use this hook (or <PermissionGate>) — never compare role strings inline.
 */

import { useAuth } from '@context/AuthContext';
import type { Permission, Persona } from '@context/AuthContext';

export type { Permission, Persona };

export interface UsePermissionsReturn {
  /** True when the user has the specific permission. */
  can:     (permission: Permission) => boolean;
  /** True when the user has at least one of the listed permissions. */
  canAny:  (permissions: Permission[]) => boolean;
  /** True when the user has every listed permission. */
  canAll:  (permissions: Permission[]) => boolean;
  /** The resolved persona, or undefined while loading. */
  persona: Persona | undefined;
  /** True while auth is still resolving. */
  loading: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, loading } = useAuth();

  const can = (permission: Permission): boolean =>
    user?.permissions.includes(permission) ?? false;

  const canAny = (permissions: Permission[]): boolean =>
    permissions.some(p => can(p));

  const canAll = (permissions: Permission[]): boolean =>
    permissions.every(p => can(p));

  return { can, canAny, canAll, persona: user?.persona, loading };
}
