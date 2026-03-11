/**
 * RbacPage — WI-9 implementation
 *
 * Displays role assignments using AdminListPage<UserRole> from @eva/templates.
 * Zero @fluentui/react-components direct imports.
 * All visible strings via t() from useTranslations().
 * All components from @eva/templates and @eva/ui.
 *
 * Backend: BackendApiClient.getRbacAssignments() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET  /rbac/assignments
 */
import React from 'react';
import { AdminListPage } from '@eva/templates';
import { EvaBadge, EvaButton } from '@eva/ui';
import { useTranslations } from '@hooks/useTranslations';
import { useRbacData } from '@api/useRbacData';
import type { UserRole } from '@api/useRbacData';

export const RbacPage: React.FC = () => {
  const { t } = useTranslations();
  const { items, isLoading, error, filters, load } = useRbacData();

  const roleBadgeAppearance = (role: UserRole['role']): 'danger' | 'warning' | 'neutral' => {
    if (role === 'EVA_ADMIN') return 'danger';
    if (role === 'EVA_EDITOR') return 'warning';
    return 'neutral';
  };

  const roleBadgeLabel = (role: UserRole['role']): string => {
    if (role === 'EVA_ADMIN') return t('admin.rbac.badge.admin');
    if (role === 'EVA_EDITOR') return t('admin.rbac.badge.editor');
    return t('admin.rbac.badge.viewer');
  };

  const columns = [
    {
      columnId: 'displayName',
      label: t('admin.rbac.column.displayName'),
      renderCell: (item: UserRole) => item.displayName,
    },
    {
      columnId: 'email',
      label: t('admin.rbac.column.email'),
      renderCell: (item: UserRole) => item.email,
    },
    {
      columnId: 'role',
      label: t('admin.rbac.column.role'),
      renderCell: (item: UserRole) => (
        <EvaBadge
          appearance={roleBadgeAppearance(item.role)}
          aria-label={roleBadgeLabel(item.role)}
        >
          {roleBadgeLabel(item.role)}
        </EvaBadge>
      ),
    },
    {
      columnId: 'scope',
      label: t('admin.rbac.column.scope'),
      renderCell: (item: UserRole) => item.scope,
    },
    {
      columnId: 'enabled',
      label: t('admin.rbac.column.enabled'),
      renderCell: (item: UserRole) => (
        <EvaBadge
          appearance={item.enabled ? 'success' : 'neutral'}
          aria-label={item.enabled ? t('admin.rbac.badge.enabled') : t('admin.rbac.badge.disabled')}
        >
          {item.enabled ? t('admin.rbac.badge.enabled') : t('admin.rbac.badge.disabled')}
        </EvaBadge>
      ),
    },
    {
      columnId: 'updatedAt',
      label: t('admin.rbac.column.updatedAt'),
      renderCell: (item: UserRole) => item.updatedAt,
    },
  ];

  const translatedFilters = filters.map((f) => ({
    ...f,
    label: t(f.label),
    placeholder: f.placeholder !== undefined ? t(f.placeholder) : undefined,
    options: f.options?.map((o) => ({ ...o, label: t(o.label) })),
  }));

  return (
    <AdminListPage<UserRole>
      title={t('admin.rbac.title')}
      description={t('admin.rbac.description')}
      isLoading={isLoading}
      error={error !== null ? t(error) : null}
      emptyMessage={t('admin.rbac.state.empty')}
      items={items}
      columns={columns}
      getRowId={(item: UserRole) => item.id}
      filters={translatedFilters}
      onApplyFilters={() => void load()}
      onResetFilters={() => void load()}
      onRetry={() => void load()}
      primaryAction={{
        label: t('admin.rbac.action.assign'),
        onClick: () => {
          /* TODO WI-9b: open assign-role dialog */
        },
      }}
      renderRowActions={(item: UserRole) => (
        <EvaButton
          variant="subtle"
          aria-label={`${t('admin.rbac.action.edit')} ${item.displayName}`}
          onClick={() => {
            /* TODO WI-9b: open edit role dialog */
          }}
        >
          {t('admin.rbac.action.edit')}
        </EvaButton>
      )}
    />
  );
};
