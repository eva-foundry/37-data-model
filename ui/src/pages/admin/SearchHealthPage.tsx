/**
 * SearchHealthPage — WI-13 implementation (2026-02-20 15:53 ET)
 *
 * Displays search index health using AdminListPage<SearchIndex>.
 * Health score colour: green ≥80, amber 50–79, red <50.
 * Action: "Reindex" per row → confirm dialog.
 *
 * Zero @fluentui/react-components direct imports.
 * All visible strings via t() from useTranslations().
 *
 * Backend: BackendApiClient.getSearchHealth() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET  /v1/admin/search/health
 *   POST /v1/admin/search/reindex
 */
import React, { useState } from 'react';
import { AdminListPage } from '@eva/templates';
import { EvaBadge, EvaButton, EvaDialog } from '@eva/ui';
import { useTranslations } from '@hooks/useTranslations';
import { useSearchHealthData } from '@api/useSearchHealthData';
import type { SearchIndex } from '@api/useSearchHealthData';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const scoreAppearance = (score: number): 'success' | 'warning' | 'danger' => {
  if (score >= 80) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SearchHealthPage: React.FC = () => {
  const { t } = useTranslations();
  const { items, isLoading, error, load, triggerReindex } = useSearchHealthData();
  const [reindexTarget, setReindexTarget] = useState<string | null>(null);

  const handleReindexConfirm = async () => {
    if (reindexTarget !== null) {
      await triggerReindex(reindexTarget);
    }
    setReindexTarget(null);
  };

  const columns = [
    {
      columnId: 'indexName',
      label: t('admin.searchHealth.column.indexName'),
      renderCell: (item: SearchIndex) => item.indexName,
    },
    {
      columnId: 'status',
      label: t('admin.searchHealth.column.status'),
      renderCell: (item: SearchIndex) => (
        <EvaBadge appearance={scoreAppearance(item.healthScore)}>
          {t(`admin.searchHealth.status.${item.status}`)}
        </EvaBadge>
      ),
    },
    {
      columnId: 'healthScore',
      label: t('admin.searchHealth.column.healthScore'),
      renderCell: (item: SearchIndex) => (
        <EvaBadge appearance={scoreAppearance(item.healthScore)} aria-label={`${item.healthScore}/100`}>
          {`${item.healthScore} / 100`}
        </EvaBadge>
      ),
    },
    {
      columnId: 'docCount',
      label: t('admin.searchHealth.column.docCount'),
      renderCell: (item: SearchIndex) => String(item.docCount),
    },
    {
      columnId: 'lastIndexed',
      label: t('admin.searchHealth.column.lastIndexed'),
      renderCell: (item: SearchIndex) => item.lastIndexed,
    },
    {
      columnId: 'actions',
      label: t('admin.searchHealth.column.actions'),
      renderCell: (item: SearchIndex) => (
        <EvaButton
          appearance="subtle"
          aria-label={t('admin.searchHealth.action.reindex')}
          onClick={() => setReindexTarget(item.indexName)}
        >
          {t('admin.searchHealth.action.reindex')}
        </EvaButton>
      ),
    },
  ];

  return (
    <>
      <AdminListPage<SearchIndex>
        title={t('admin.searchHealth.title')}
        description={t('admin.searchHealth.description')}
        isLoading={isLoading}
        error={error !== null ? t(error) : null}
        emptyMessage={t('admin.searchHealth.state.empty')}
        items={items}
        columns={columns}
        getRowId={(item: SearchIndex) => item.indexName}
        filters={[]}
        onApplyFilters={() => void load()}
        onResetFilters={() => void load()}
        onRetry={() => void load()}
      />

      {reindexTarget !== null && (
        <EvaDialog
          title={t('admin.searchHealth.dialog.reindex.title')}
          open={reindexTarget !== null}
          onOpenChange={(open: boolean) => { if (!open) setReindexTarget(null); }}
          actions={[
            {
              label: t('admin.searchHealth.dialog.reindex.confirm'),
              appearance: 'primary' as const,
              onClick: () => void handleReindexConfirm(),
            },
            {
              label: t('admin.searchHealth.dialog.reindex.cancel'),
              appearance: 'secondary' as const,
              onClick: () => setReindexTarget(null),
            },
          ]}
        >
          {t('admin.searchHealth.dialog.reindex.body')}
        </EvaDialog>
      )}
    </>
  );
};
