/**
 * FeatureFlagsPage — WI-15 implementation (2026-02-20 15:53 ET)
 *
 * Displays feature flags using AdminListPage<FeatureFlag>.
 * Toggle per flag via EvaButton (optimistic update + rollback on failure).
 * History tab available in detail drawer (future WI-15-live).
 *
 * Zero @fluentui/react-components direct imports.
 * All visible strings via t() from useTranslations().
 *
 * Backend: BackendApiClient.getFeatureFlags() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET   /v1/admin/feature-flags
 *   PATCH /v1/admin/feature-flags/{flagKey}
 */
import React from 'react';
import { AdminListPage } from '@eva/templates';
import { EvaBadge, EvaButton } from '@eva/ui';
import { useTranslations } from '@hooks/useTranslations';
import { useFeatureFlagsData } from '@api/useFeatureFlagsData';
import type { FeatureFlag } from '@api/useFeatureFlagsData';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const FeatureFlagsPage: React.FC = () => {
  const { t } = useTranslations();
  const { items, isLoading, error, load, toggleFlag } = useFeatureFlagsData();

  const columns = [
    {
      columnId: 'flagKey',
      label: t('admin.featureFlags.column.flagKey'),
      renderCell: (item: FeatureFlag) => item.flagKey,
    },
    {
      columnId: 'label',
      label: t('admin.featureFlags.column.label'),
      renderCell: (item: FeatureFlag) => item.label,
    },
    {
      columnId: 'enabled',
      label: t('admin.featureFlags.column.enabled'),
      renderCell: (item: FeatureFlag) => (
        <EvaBadge appearance={item.enabled ? 'success' : 'neutral'}>
          {item.enabled
            ? t('admin.featureFlags.badge.enabled')
            : t('admin.featureFlags.badge.disabled')}
        </EvaBadge>
      ),
    },
    {
      columnId: 'description',
      label: t('admin.featureFlags.column.description'),
      renderCell: (item: FeatureFlag) => item.description,
    },
    {
      columnId: 'modifiedBy',
      label: t('admin.featureFlags.column.modifiedBy'),
      renderCell: (item: FeatureFlag) => item.modifiedBy,
    },
    {
      columnId: 'actions',
      label: t('admin.featureFlags.column.actions'),
      renderCell: (item: FeatureFlag) => (
        <EvaButton
          appearance={item.enabled ? 'secondary' : 'primary'}
          aria-label={
            item.enabled
              ? t('admin.featureFlags.action.disable')
              : t('admin.featureFlags.action.enable')
          }
          aria-pressed={item.enabled}
          onClick={() => void toggleFlag(item.flagKey, !item.enabled)}
        >
          {item.enabled
            ? t('admin.featureFlags.action.disable')
            : t('admin.featureFlags.action.enable')}
        </EvaButton>
      ),
    },
  ];

  return (
    <AdminListPage<FeatureFlag>
      title={t('admin.featureFlags.title')}
      description={t('admin.featureFlags.description')}
      isLoading={isLoading}
      error={error !== null ? t(error) : null}
      emptyMessage={t('admin.featureFlags.state.empty')}
      items={items}
      columns={columns}
      getRowId={(item: FeatureFlag) => item.flagKey}
      filters={[]}
      onApplyFilters={() => void load()}
      onResetFilters={() => void load()}
      onRetry={() => void load()}
    />
  );
};
