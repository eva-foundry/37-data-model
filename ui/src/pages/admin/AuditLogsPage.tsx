/**
 * AuditLogsPage — WI-10 implementation
 *
 * Displays audit log entries using AdminListPage<AuditLog> from @eva/templates.
 * Zero @fluentui/react-components direct imports.
 * All visible strings via t() from useTranslations().
 * All components from @eva/templates and @eva/ui.
 *
 * Read-only view: no primaryAction, no renderRowActions.
 *
 * Backend: BackendApiClient.getAuditEvents() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET  /audit/events
 */
import React from 'react';
import { AdminListPage } from '@eva/templates';
import { EvaBadge } from '@eva/ui';
import { useTranslations } from '@hooks/useTranslations';
import { useAuditLogsData } from '@api/useAuditLogsData';
import type { AuditLog } from '@api/useAuditLogsData';

export const AuditLogsPage: React.FC = () => {
  const { t } = useTranslations();
  const { items, isLoading, error, filters, load } = useAuditLogsData();

  const columns = [
    {
      columnId: 'timestamp',
      label: t('admin.auditLogs.column.timestamp'),
      renderCell: (item: AuditLog) => item.timestamp,
    },
    {
      columnId: 'actor',
      label: t('admin.auditLogs.column.actor'),
      renderCell: (item: AuditLog) => item.actor,
    },
    {
      columnId: 'entityType',
      label: t('admin.auditLogs.column.entityType'),
      renderCell: (item: AuditLog) => item.entityType,
    },
    {
      columnId: 'action',
      label: t('admin.auditLogs.column.action'),
      renderCell: (item: AuditLog) => item.action,
    },
    {
      columnId: 'outcome',
      label: t('admin.auditLogs.column.outcome'),
      renderCell: (item: AuditLog) => (
        <EvaBadge
          appearance={item.outcome === 'success' ? 'success' : 'danger'}
          aria-label={
            item.outcome === 'success'
              ? t('admin.auditLogs.badge.success')
              : t('admin.auditLogs.badge.failure')
          }
        >
          {item.outcome === 'success'
            ? t('admin.auditLogs.badge.success')
            : t('admin.auditLogs.badge.failure')}
        </EvaBadge>
      ),
    },
  ];

  const translatedFilters = filters.map((f) => ({
    ...f,
    label: t(f.label),
    placeholder: f.placeholder !== undefined ? t(f.placeholder) : undefined,
    options: f.options?.map((o) => ({ ...o, label: t(o.label) })),
  }));

  return (
    <AdminListPage<AuditLog>
      title={t('admin.auditLogs.title')}
      description={t('admin.auditLogs.description')}
      isLoading={isLoading}
      error={error !== null ? t(error) : null}
      emptyMessage={t('admin.auditLogs.state.empty')}
      items={items}
      columns={columns}
      getRowId={(item: AuditLog) => item.id}
      filters={translatedFilters}
      onApplyFilters={() => void load()}
      onResetFilters={() => void load()}
      onRetry={() => void load()}
    />
  );
};
