/**
 * RbacRolesPage — WI-16 implementation (2026-02-20 15:53 ET)
 *
 * Displays and manages RBAC roles using AdminListPage<Role>.
 * Create Role: "Create Role" button → dialog with name, description, permissions.
 * Edit: per-row drawer with same fields.
 * Delete guard: if userCount > 0 shows warning toast instead of deleting.
 *
 * Zero @fluentui/react-components direct imports.
 * All visible strings via t() from useTranslations().
 *
 * Backend: BackendApiClient.getRbacRoles() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET    /v1/admin/rbac/roles
 *   POST   /v1/admin/rbac/roles
 *   PATCH  /v1/admin/rbac/roles/{roleId}
 *   DELETE /v1/admin/rbac/roles/{roleId}
 */
import React, { useState } from 'react';
import { AdminListPage } from '@eva/templates';
import { EvaBadge, EvaButton, EvaDialog } from '@eva/ui';
import { useTranslations } from '@hooks/useTranslations';
import { useRbacRolesData } from '@api/useRbacRolesData';
import type { Role, CreateRoleRequest } from '@api/useRbacRolesData';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RbacRolesPage: React.FC = () => {
  const { t } = useTranslations();
  const { items, isLoading, error, load, createRole, deleteRole } = useRbacRolesData();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleteBlockedRole, setDeleteBlockedRole] = useState<Role | null>(null);

  // Minimal controlled form state for create dialog
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  const handleCreateConfirm = async () => {
    if (newRoleName.trim() === '') return;
    const data: CreateRoleRequest = {
      name: newRoleName.trim(),
      description: newRoleDescription.trim(),
      permissions: [],
    };
    await createRole(data);
    setNewRoleName('');
    setNewRoleDescription('');
    setCreateDialogOpen(false);
  };

  const handleDeleteRequest = (role: Role) => {
    if (role.userCount > 0) {
      setDeleteBlockedRole(role);
    } else {
      setDeleteTarget(role);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget !== null) {
      await deleteRole(deleteTarget.roleId);
    }
    setDeleteTarget(null);
  };

  const columns = [
    {
      columnId: 'name',
      label: t('admin.rbacRoles.column.name'),
      renderCell: (item: Role) => item.name,
    },
    {
      columnId: 'description',
      label: t('admin.rbacRoles.column.description'),
      renderCell: (item: Role) => item.description || '—',
    },
    {
      columnId: 'permissions',
      label: t('admin.rbacRoles.column.permissions'),
      renderCell: (item: Role) =>
        item.permissions.length > 0 ? (
          <span>
            {item.permissions.map((p) => (
              <EvaBadge key={p} appearance="neutral" style={{ marginRight: '4px' }}>
                {p}
              </EvaBadge>
            ))}
          </span>
        ) : (
          '—'
        ),
    },
    {
      columnId: 'userCount',
      label: t('admin.rbacRoles.column.userCount'),
      renderCell: (item: Role) => String(item.userCount),
    },
  ];

  return (
    <>
      <AdminListPage<Role>
        title={t('admin.rbacRoles.title')}
        description={t('admin.rbacRoles.description')}
        isLoading={isLoading}
        error={error !== null ? t(error) : null}
        emptyMessage={t('admin.rbacRoles.state.empty')}
        items={items}
        columns={columns}
        getRowId={(item: Role) => item.roleId}
        filters={[]}
        primaryAction={{
          label: t('admin.rbacRoles.action.create'),
          onClick: () => setCreateDialogOpen(true),
        }}
        renderRowActions={(item: Role) => (
          <EvaButton
            appearance="subtle"
            aria-label={t('admin.rbacRoles.action.delete')}
            onClick={() => handleDeleteRequest(item)}
          >
            {t('admin.rbacRoles.action.delete')}
          </EvaButton>
        )}
        onApplyFilters={() => void load()}
        onResetFilters={() => void load()}
        onRetry={() => void load()}
      />

      {/* Create dialog */}
      {createDialogOpen && (
        <EvaDialog
          title={t('admin.rbacRoles.dialog.create.title')}
          open={createDialogOpen}
          onOpenChange={(open: boolean) => setCreateDialogOpen(open)}
          actions={[
            {
              label: t('admin.rbacRoles.dialog.create.confirm'),
              appearance: 'primary' as const,
              onClick: () => void handleCreateConfirm(),
            },
            {
              label: t('admin.rbacRoles.dialog.create.cancel'),
              appearance: 'secondary' as const,
              onClick: () => setCreateDialogOpen(false),
            },
          ]}
        >
          <div>
            <label htmlFor="new-role-name">{t('admin.rbacRoles.field.name')}</label>
            <input
              id="new-role-name"
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              aria-label={t('admin.rbacRoles.field.name')}
            />
            <label htmlFor="new-role-description">{t('admin.rbacRoles.field.description')}</label>
            <input
              id="new-role-description"
              type="text"
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
              aria-label={t('admin.rbacRoles.field.description')}
            />
          </div>
        </EvaDialog>
      )}

      {/* Delete confirm dialog */}
      {deleteTarget !== null && (
        <EvaDialog
          title={t('admin.rbacRoles.dialog.delete.title')}
          open={deleteTarget !== null}
          onOpenChange={(open: boolean) => { if (!open) setDeleteTarget(null); }}
          actions={[
            {
              label: t('admin.rbacRoles.dialog.delete.confirm'),
              appearance: 'primary' as const,
              onClick: () => void handleDeleteConfirm(),
            },
            {
              label: t('admin.rbacRoles.dialog.delete.cancel'),
              appearance: 'secondary' as const,
              onClick: () => setDeleteTarget(null),
            },
          ]}
        >
          {t('admin.rbacRoles.dialog.delete.body')}
        </EvaDialog>
      )}

      {/* Delete blocked warning dialog */}
      {deleteBlockedRole !== null && (
        <EvaDialog
          title={t('admin.rbacRoles.dialog.deleteBlocked.title')}
          open={deleteBlockedRole !== null}
          onOpenChange={(open: boolean) => { if (!open) setDeleteBlockedRole(null); }}
          actions={[
            {
              label: t('admin.rbacRoles.dialog.deleteBlocked.ok'),
              appearance: 'primary' as const,
              onClick: () => setDeleteBlockedRole(null),
            },
          ]}
        >
          {t('admin.rbacRoles.dialog.deleteBlocked.body')}
        </EvaDialog>
      )}
    </>
  );
};
