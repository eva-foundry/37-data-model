/**
 * IngestionRunsPage — WI-12 implementation (2026-02-20 15:53 ET)
 *
 * Displays document ingestion runs using AdminListPage<IngestionRun>.
 * Status badges: pending/running/completed/failed/cancelled.
 * Actions: "Trigger Run" (confirm dialog), "Cancel" (running only).
 *
 * Zero @fluentui/react-components direct imports.
 * All visible strings via t() from useTranslations().
 *
 * Backend: BackendApiClient.getIngestionRuns() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET   /v1/admin/ingestion/runs
 *   POST  /v1/admin/ingestion/runs
 *   PATCH /v1/admin/ingestion/runs/{runId}
 */
import React, { useState } from 'react';
import { AdminListPage } from '@eva/templates';
import { EvaBadge, EvaButton, EvaDialog } from '@eva/ui';
import { useTranslations } from '@hooks/useTranslations';
import { useIngestionRunsData } from '@api/useIngestionRunsData';
import type { IngestionRun, IngestionRunStatus } from '@api/useIngestionRunsData';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusAppearance = (
  status: IngestionRunStatus,
): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (status) {
    case 'completed': return 'success';
    case 'running':   return 'warning';
    case 'failed':    return 'danger';
    default:          return 'neutral';
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const IngestionRunsPage: React.FC = () => {
  const { t } = useTranslations();
  const { items, isLoading, error, load, triggerRun, cancelRun } = useIngestionRunsData();
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);

  const handleTriggerConfirm = async () => {
    setTriggerDialogOpen(false);
    await triggerRun();
  };

  const columns = [
    {
      columnId: 'runId',
      label: t('admin.ingestionRuns.column.runId'),
      renderCell: (item: IngestionRun) => item.runId,
    },
    {
      columnId: 'status',
      label: t('admin.ingestionRuns.column.status'),
      renderCell: (item: IngestionRun) => (
        <EvaBadge appearance={statusAppearance(item.status)}>
          {t(`admin.ingestionRuns.status.${item.status}`)}
        </EvaBadge>
      ),
    },
    {
      columnId: 'startedAt',
      label: t('admin.ingestionRuns.column.startedAt'),
      renderCell: (item: IngestionRun) => item.startedAt,
    },
    {
      columnId: 'completedAt',
      label: t('admin.ingestionRuns.column.completedAt'),
      renderCell: (item: IngestionRun) => item.completedAt ?? '—',
    },
    {
      columnId: 'documentCount',
      label: t('admin.ingestionRuns.column.documentCount'),
      renderCell: (item: IngestionRun) => String(item.documentCount),
    },
    {
      columnId: 'actions',
      label: t('admin.ingestionRuns.column.actions'),
      renderCell: (item: IngestionRun) =>
        item.status === 'running' ? (
          <EvaButton
            appearance="subtle"
            aria-label={t('admin.ingestionRuns.action.cancel')}
            onClick={() => void cancelRun(item.runId)}
          >
            {t('admin.ingestionRuns.action.cancel')}
          </EvaButton>
        ) : null,
    },
  ];

  return (
    <>
      <AdminListPage<IngestionRun>
        title={t('admin.ingestionRuns.title')}
        description={t('admin.ingestionRuns.description')}
        isLoading={isLoading}
        error={error !== null ? t(error) : null}
        emptyMessage={t('admin.ingestionRuns.state.empty')}
        items={items}
        columns={columns}
        getRowId={(item: IngestionRun) => item.runId}
        filters={[]}
        primaryAction={{
          label: t('admin.ingestionRuns.action.trigger'),
          onClick: () => setTriggerDialogOpen(true),
        }}
        onApplyFilters={() => void load()}
        onResetFilters={() => void load()}
        onRetry={() => void load()}
      />

      {triggerDialogOpen && (
        <EvaDialog
          title={t('admin.ingestionRuns.dialog.trigger.title')}
          open={triggerDialogOpen}
          onOpenChange={(open: boolean) => setTriggerDialogOpen(open)}
          actions={[
            {
              label: t('admin.ingestionRuns.dialog.trigger.confirm'),
              appearance: 'primary' as const,
              onClick: () => void handleTriggerConfirm(),
            },
            {
              label: t('admin.ingestionRuns.dialog.trigger.cancel'),
              appearance: 'secondary' as const,
              onClick: () => setTriggerDialogOpen(false),
            },
          ]}
        >
          {t('admin.ingestionRuns.dialog.trigger.body')}
        </EvaDialog>
      )}
    </>
  );
};
