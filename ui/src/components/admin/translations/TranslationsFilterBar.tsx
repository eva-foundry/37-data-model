// EVA-FEATURE: F31-UI
// EVA-STORY: F31-UI-001
/**
 * TranslationsFilterBar Component
 * 
 * Provides filtering UI for translations table.
 * Handles category and key search filters.
 */

import { useState, useCallback } from 'react';
import { TranslationFilters } from '../../types/translations';
import { Button, Dropdown, DropdownOption, Field, Input } from '@ui';
import { useTranslations } from '@hooks/useTranslations';
import { telemetry } from '@services/TelemetryService';
import styles from './TranslationsFilterBar.module.css';

interface TranslationsFilterBarProps {
  categories: string[];
  onApplyFilters: (filters: TranslationFilters) => void;
}

export const TranslationsFilterBar: React.FC<TranslationsFilterBarProps> = ({
  categories,
  onApplyFilters,
}) => {
  const { t } = useTranslations();
  const [filterDraft, setFilterDraft] = useState<TranslationFilters>({});

  const handleFilterChange = useCallback((field: keyof TranslationFilters, value: string) => {
    setFilterDraft((prev) => {
      const next: TranslationFilters = { ...prev };
      if (value) {
        next[field] = value;
      } else {
        delete next[field];
      }
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    const nextFilters: TranslationFilters = {};
    if (filterDraft.category) {
      nextFilters.category = filterDraft.category;
    }
    if (filterDraft.keyContains) {
      nextFilters.keyContains = filterDraft.keyContains;
    }
    onApplyFilters(nextFilters);
    telemetry.track('filter', { ...nextFilters });
  }, [filterDraft, onApplyFilters]);

  const handleReset = useCallback(() => {
    setFilterDraft({});
    onApplyFilters({});
    telemetry.track('filter', { action: 'reset' });
  }, [onApplyFilters]);

  return (
    <section className={styles.filtersSection}>
      <form className={styles.filters} aria-label={t('admin.translationsPage.filters.ariaLabel')}>
        <Field label={t('admin.translationsPage.filters.category')}>
          <Dropdown
            selectedOptions={filterDraft.category ? [filterDraft.category] : []}
            onOptionSelect={(_, data) => handleFilterChange('category', data.optionValue || '')}
            placeholder={t('admin.translationsPage.filters.categoryPlaceholder')}
            aria-label={t('admin.translationsPage.filters.category')}
          >
            <DropdownOption key="all" text={t('admin.translationsPage.filters.categoryAll')} value="">
              {t('admin.translationsPage.filters.categoryAll')}
            </DropdownOption>
            {categories.map((category) => (
              <DropdownOption key={category} value={category} text={category}>
                {category}
              </DropdownOption>
            ))}
          </Dropdown>
        </Field>
        
        <Field label={t('admin.translationsPage.filters.key')}>
          <Input
            value={filterDraft.keyContains ?? ''}
            onChange={(_, data) => handleFilterChange('keyContains', data.value)}
            placeholder={t('admin.translationsPage.filters.keyPlaceholder')}
          />
        </Field>
        
        <div className={styles.filterButtons}>
          <Button appearance="primary" type="button" onClick={handleApply}>
            {t('admin.translationsPage.filters.apply')}
          </Button>
          <Button appearance="secondary" type="button" onClick={handleReset}>
            {t('admin.translationsPage.filters.reset')}
          </Button>
        </div>
      </form>
    </section>
  );
};
