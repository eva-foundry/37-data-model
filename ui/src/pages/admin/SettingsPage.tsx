/**
 * SettingsPage — WI-3 implementation
 *
 * Displays and filters admin settings using AdminListPage<Setting> from @eva/templates.
 * Zero @fluentui/react-components direct imports.
 * All visible strings via t() from useTranslations().
 * All components from @eva/templates and @eva/ui.
 *
 * Backend: BackendApiClient.getSettings() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoint: GET /settings, PATCH /settings/{key} — brain-v2 Sprint 5 (not yet live).
 */
import React from 'react';
import { AdminListPage } from '@eva/templates';
import { EvaButton, EvaBadge } from '@eva/ui';
import { useTranslations } from '@hooks/useTranslations';
import { useSettingsData } from '@api/useSettingsData';
import type { Setting } from '../../types/settings';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslations();
  const { items, isLoading, error, filters, load } = useSettingsData();

  const columns = [
    {
      columnId: 'category',
      label: t('admin.settings.column.category'),
      renderCell: (item: Setting) => item.category,
    },
    {
      columnId: 'key',
      label: t('admin.settings.column.key'),
      renderCell: (item: Setting) => item.key,
    },
    {
      columnId: 'description',
      label: t('admin.settings.column.description'),
      renderCell: (item: Setting) => item.description ?? '—',
    },
    {
      columnId: 'value',
      label: t('admin.settings.column.value'),
      renderCell: (item: Setting) => item.value,
    },
    {
      columnId: 'valueType',
      label: t('admin.settings.column.valueType'),
      renderCell: (item: Setting) => (
        <EvaBadge variant="neutral">{item.valueType}</EvaBadge>
      ),
    },
    {
      columnId: 'isPublic',
      label: t('admin.settings.column.isPublic'),
      renderCell: (item: Setting) => (
        <EvaBadge
          appearance={item.isPublic ? 'success' : 'neutral'}
          aria-label={
            item.isPublic
              ? t('admin.settings.badge.public')
              : t('admin.settings.badge.internal')
          }
        >
          {item.isPublic
            ? t('admin.settings.badge.public')
            : t('admin.settings.badge.internal')}
        </EvaBadge>
      ),
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
      label: o.value === '' ? t(o.label) : o.label,
    })),
  }));

  return (
    <AdminListPage<Setting>
      title={t('admin.settings.title')}
      description={t('admin.settings.description')}
      isLoading={isLoading}
      error={error !== null ? t(error) : null}
      emptyMessage={t('admin.settings.state.empty')}
      items={items}
      columns={columns}
      getRowId={(item: Setting) => item.key}
      filters={translatedFilters}
      onApplyFilters={() => void load()}
      onResetFilters={() => void load()}
      onRetry={() => void load()}
      renderRowActions={(item: Setting) => (
        <EvaButton
          variant="subtle"
          aria-label={`${t('admin.settings.action.edit')} ${item.key}`}
          onClick={() => {
            /* TODO WI-3b: open edit dialog */
          }}
        >
          {t('admin.settings.action.edit')}
        </EvaButton>
      )}
    />
  );
};
