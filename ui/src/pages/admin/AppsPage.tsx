/**
 * AppsPage — WI-4 implementation
 *
 * Displays and manages the App Registry using AdminListPage<App> from @eva/templates.
 * Zero @fluentui/react-components direct imports.
 * All visible strings via t() from useTranslations().
 * All components from @eva/templates and @eva/ui.
 *
 * Backend: BackendApiClient.getApps() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (brain-v2 App Registry, not yet live):
 *   GET    /apps
 *   POST   /apps/{appId}/disable
 */
import React, { useState } from 'react';
import { AdminListPage } from '@eva/templates';
import { EvaButton, EvaBadge, EvaDialog } from '@eva/ui';
import { useTranslations } from '@hooks/useTranslations';
import { useAppsData } from '@api/useAppsData';
import type { App } from '../../types/apps';

export const AppsPage: React.FC = () => {
  const { t } = useTranslations();
  const { items, isLoading, error, filters, load, disableApp } = useAppsData();

  const [appToDisable, setAppToDisable] = useState<App | null>(null);
  const [isDisabling, setIsDisabling] = useState(false);

  const handleDisableConfirm = async () => {
    if (!appToDisable) return;
    setIsDisabling(true);
    try {
      await disableApp(appToDisable.appId);
    } finally {
      setIsDisabling(false);
      setAppToDisable(null);
    }
  };

  const columns = [
    {
      columnId: 'title',
      label: t('admin.apps.column.title'),
      renderCell: (item: App) => item.title,
    },
    {
      columnId: 'description',
      label: t('admin.apps.column.description'),
      renderCell: (item: App) => item.description ?? '—',
    },
    {
      columnId: 'visibility',
      label: t('admin.apps.column.visibility'),
      renderCell: (item: App) => (
        <EvaBadge
          appearance={item.visibility === 'public' ? 'success' : 'warning'}
          aria-label={
            item.visibility === 'public'
              ? t('admin.apps.badge.public')
              : t('admin.apps.badge.private')
          }
        >
          {item.visibility === 'public'
            ? t('admin.apps.badge.public')
            : t('admin.apps.badge.private')}
        </EvaBadge>
      ),
    },
    {
      columnId: 'costCenter',
      label: t('admin.apps.column.costCenter'),
      renderCell: (item: App) => item.costCenter ?? '—',
    },
    {
      columnId: 'disabled',
      label: t('admin.apps.column.disabled'),
      renderCell: (item: App) => (
        <EvaBadge
          appearance={item.disabled ? 'danger' : 'neutral'}
          aria-label={
            item.disabled
              ? t('admin.apps.badge.disabled')
              : t('admin.apps.badge.active')
          }
        >
          {item.disabled
            ? t('admin.apps.badge.disabled')
            : t('admin.apps.badge.active')}
        </EvaBadge>
      ),
    },
    {
      columnId: 'updatedAt',
      label: t('admin.apps.column.updatedAt'),
      renderCell: (item: App) => item.updatedAt ?? '—',
    },
  ];

  // Translate filter labels while keeping onChange callbacks intact
  const translatedFilters = filters.map((f) => ({
    ...f,
    label: t(f.label),
    placeholder:
      f.placeholder !== undefined ? t(f.placeholder) : undefined,
    options: f.options?.map((o) => ({
      ...o,
      label: t(o.label),
    })),
  }));

  return (
    <>
      <AdminListPage<App>
        title={t('admin.apps.title')}
        description={t('admin.apps.description')}
        isLoading={isLoading}
        error={error !== null ? t(error) : null}
        emptyMessage={t('admin.apps.state.empty')}
        items={items}
        columns={columns}
        getRowId={(item: App) => item.appId}
        filters={translatedFilters}
        onApplyFilters={() => void load()}
        onResetFilters={() => void load()}
        onRetry={() => void load()}
        primaryAction={{
          label: t('admin.apps.action.add'),
          onClick: () => {
            /* TODO WI-4b: open create app dialog */
          },
        }}
        renderRowActions={(item: App) => (
          <>
            <EvaButton
              variant="subtle"
              aria-label={`${t('admin.apps.action.edit')} ${item.title}`}
              onClick={() => {
                /* TODO WI-4b: open edit dialog */
              }}
            >
              {t('admin.apps.action.edit')}
            </EvaButton>
            {!item.disabled && (
              <EvaButton
                variant="danger"
                aria-label={`${t('admin.apps.action.disable')} ${item.title}`}
                onClick={() => setAppToDisable(item)}
              >
                {t('admin.apps.action.disable')}
              </EvaButton>
            )}
          </>
        )}
      />

      <EvaDialog
        open={appToDisable !== null}
        onOpenChange={(_ev: unknown, data: { open: boolean }) => {
          if (!data.open) setAppToDisable(null);
        }}
        title={t('admin.apps.confirm.disable')}
        primaryAction={{
          label: t('admin.apps.action.disable'),
          onClick: () => void handleDisableConfirm(),
          variant: 'danger',
          disabled: isDisabling,
        }}
        cancelLabel={t('admin.apps.action.cancel')}
      >
        {t('admin.apps.confirm.disable.description')}
      </EvaDialog>
    </>
  );
};
