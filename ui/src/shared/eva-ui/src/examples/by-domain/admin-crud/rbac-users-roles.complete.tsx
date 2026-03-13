// EVA-FEATURE: F31-UI
// EVA-STORY: F31-UI-003
// EVA-STORY: F31-UI-010
/**
 * Admin CRUD: RBAC Users & Roles Screen
 * YAML mapping: screen_id: rbac.users_roles
 */

import React from 'react';
import { EvaBadge, EvaButton, EvaDataGrid, EvaDrawer, EvaSelect } from '@eva/ui';
import type { EvaColumn } from '@eva/ui';
import { AsyncStateRenderer } from '../../by-pattern/feedback/loading-states.pattern';
import { useRbacAssignments, type UserRoleAssignment } from './useRbacAssignments';

export const RbacUsersRolesScreen = () => {
  const { assignments, loading, refresh, updateRole, toggleEnabled } = useRbacAssignments();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selected = assignments.find((item) => item.id === selectedId) ?? null;

  const columns: EvaColumn<UserRoleAssignment>[] = [
    { columnId: 'displayName', label: 'User', renderCell: (row) => row.displayName },
    { columnId: 'email', label: 'Email', renderCell: (row) => row.email },
    { columnId: 'role', label: 'Role', renderCell: (row) => row.role },
    { columnId: 'scope', label: 'Scope', renderCell: (row) => row.scope },
    {
      columnId: 'enabled',
      label: 'Status',
      renderCell: (row) => (
        <EvaBadge variant={row.enabled ? 'success' : 'warning'}>
          {row.enabled ? 'Enabled' : 'Disabled'}
        </EvaBadge>
      ),
    },
    {
      columnId: 'actions',
      label: 'Actions',
      renderCell: (row) => (
        <EvaButton variant="subtle" onClick={() => setSelectedId(row.id)}>
          Open
        </EvaButton>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>RBAC Users & Roles</h1>

      <AsyncStateRenderer loading={loading} isEmpty={assignments.length === 0} emptyMessage="No assignments found.">
        <EvaDataGrid items={assignments} columns={columns} getRowId={(row) => row.id} />
      </AsyncStateRenderer>

      <EvaButton variant="secondary" onClick={() => void refresh()}>
        Refresh
      </EvaButton>

      {selected && (
        <EvaDrawer open position="end" size="medium" title={`Role details: ${selected.displayName}`} onClose={() => setSelectedId(null)}>
          <div style={{ display: 'grid', gap: 12 }}>
            <p><strong>User ID:</strong> {selected.userId}</p>
            <p><strong>Email:</strong> {selected.email}</p>
            <p><strong>Scope:</strong> {selected.scope}</p>

            <EvaSelect
              label="Role"
              value={selected.role}
              options={[
                { value: 'EVA_ADMIN', label: 'EVA_ADMIN' },
                { value: 'EVA_EDITOR', label: 'EVA_EDITOR' },
                { value: 'EVA_VIEWER', label: 'EVA_VIEWER' },
              ]}
              onOptionSelect={(_, data) => {
                if (typeof data.optionValue === 'string') {
                  updateRole(selected.id, data.optionValue as UserRoleAssignment['role']);
                }
              }}
            />

            <EvaButton variant="outline" onClick={() => toggleEnabled(selected.id)}>
              {selected.enabled ? 'Disable access' : 'Enable access'}
            </EvaButton>
          </div>
        </EvaDrawer>
      )}
    </div>
  );
};
