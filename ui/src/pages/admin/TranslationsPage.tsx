/**
 * TranslationsPage — ARCH-18-005 remediation
 *
 * Rebuilt with AdminListPage<Translation> from @eva/templates.
 * Zero @fluentui/react-components direct imports.
 * All visible strings via t() from useTranslations().
 * All components from @eva/templates and @eva/ui.
 */
import React from 'react';
import { AdminListPage } from '@eva/templates';
import { EvaButton, EvaBadge, EvaDialog } from '@eva/ui';
import { useTranslations } from '@hooks/useTranslations';
import { useTranslationsData } from '@api/useTranslationsData';
import type { Translation } from '../../types/translations';

export const TranslationsPage: React.FC = () => {
  const { t } = useTranslations();
  const { items, isLoading, error, filters, load, deleteTranslation } = useTranslationsData();

  const columns = [
    {
      columnId: 'key',
      label: t('admin.translationsPage.column.key'),
      renderCell: (item: Translation) => item.key,
    },
    {
      columnId: 'en',
      label: t('admin.translationsPage.column.en'),
      renderCell: (item: Translation) => item.en,
    },
    {
      columnId: 'fr',
      label: t('admin.translationsPage.column.fr'),
      renderCell: (item: Translation) => item.fr,
    },
    {
      columnId: 'category',
      label: t('admin.translationsPage.column.category'),
      renderCell: (item: Translation) =>
        item.category !== undefined ? (
          <EvaBadge variant="neutral">{item.category}</EvaBadge>
        ) : (
          <span>—</span>
        ),
    },
  ];

  // Translate filter labels while keeping onChange callbacks intact
  const translatedFilters = filters.map((f) => ({
    ...f,
    label: t(f.label),
    placeholder: f.placeholder !== undefined ? t(f.placeholder) : undefined,
    options: f.options?.map((o) => ({
      ...o,
      label: o.value === '' ? t(o.label) : o.label,
    })),
  }));

  return (
    <AdminListPage<Translation>
      title={t('admin.translationsPage.title')}
      description={t('admin.translationsPage.description')}
      isLoading={isLoading}
      error={error !== null ? t(error) : null}
      emptyMessage={t('admin.translationsPage.empty')}
      items={items}
      columns={columns}
      getRowId={(item: Translation) => item.key}
      filters={translatedFilters}
      onApplyFilters={() => void load()}
      onResetFilters={() => void load()}
      onRetry={() => void load()}
      primaryAction={{
        label: t('admin.translationsPage.action.add'),
        onClick: () => {
          /* TODO WI-1b: open create dialog */
        },
      }}
      renderRowActions={(item: Translation) => (
        <EvaDialog
          title={t('admin.translationsPage.confirm.delete.title')}
          trigger={
            <EvaButton variant="subtle">
              {t('admin.translationsPage.action.delete')}
            </EvaButton>
          }
          primaryAction={{
            label: t('admin.translationsPage.action.delete'),
            onClick: () => void deleteTranslation(item.key),
          }}
          cancelLabel={t('admin.translationsPage.action.cancel')}
        >
          {t('admin.translationsPage.confirm.delete.body')}
        </EvaDialog>
      )}
    />
  );
};

