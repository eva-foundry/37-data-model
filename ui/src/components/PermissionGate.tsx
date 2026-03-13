/**
 * PermissionGate.tsx — portal-face
 *
 * Inline component guard: renders children only if the current user
 * has the required permission(s). Renders `fallback` (default: null)
 * when unauthorized.
 *
 * @example
 *   <PermissionGate requires="view:devops">
 *     <SprintBoardLink />
 *   </PermissionGate>
 *
 *   <PermissionGate requires="view:finops" fallback={<p>Access restricted</p>}>
 *     <FinOpsPanel />
 *   </PermissionGate>
 */

import React from 'react';
import { usePermissions } from '@hooks/usePermissions';
import type { Permission } from '@context/AuthContext';

interface PermissionGateProps {
  /** Permission or list of permissions to check. */
  requires:   Permission | Permission[];
  /** When true, ALL permissions must be satisfied (default: false = any). */
  requireAll?: boolean;
  /** Rendered when unauthorized. Default: null (renders nothing). */
  fallback?:  React.ReactNode;
  children:   React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  requires,
  requireAll = false,
  fallback   = null,
  children,
}) => {
  const { canAny, canAll, loading } = usePermissions();

  // While auth is resolving, render nothing to avoid flash of wrong content.
  if (loading) return null;

  const permissions = Array.isArray(requires) ? requires : [requires];
  const authorized  = requireAll ? canAll(permissions) : canAny(permissions);

  return authorized ? <>{children}</> : <>{fallback}</>;
};
