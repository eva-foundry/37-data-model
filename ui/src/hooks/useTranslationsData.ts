/**
 * useTranslationsData Hook
 * 
 * Encapsulates all data fetching and CRUD operations for translations.
 * Separates business logic from UI rendering.
 */

import { useState, useCallback } from 'react';
import { Translation, TranslationFilters } from '../types/translations';
import { BackendApiClient } from '@services/BackendApiClient';
import { telemetry } from '@services/TelemetryService';

interface StatusMessage {
  tone: 'success' | 'error' | 'info';
  messageKey: string;
}

export const useTranslationsData = () => {
  const [rows, setRows] = useState<Translation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchErrorKey, setFetchErrorKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Load translations with optional filters
   */
  const loadRows = useCallback(async (filters: TranslationFilters) => {
    setIsLoading(true);
    setFetchErrorKey(null);
    try {
      const response = await BackendApiClient.getTranslations(filters);
      setRows(response.translations);
    } catch (error) {
      console.error('Failed to load translations', error);
      setFetchErrorKey('admin.translationsPage.status.loadError');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save a translation (create or update)
   */
  const saveTranslation = useCallback(async (translation: Translation, originalKey?: string) => {
    setIsSaving(true);
    const activeKey = originalKey ?? translation.key;
    
    try {
      await BackendApiClient.bulkUpsertTranslations([translation]);
      telemetry.track('save', { key: translation.key });
      
      setStatusMessage({ 
        tone: 'success', 
        messageKey: 'admin.translationsPage.status.saveSuccess' 
      });
      
      // Update local state
      setRows((prev) =>
        prev.map((row) => (row.key === activeKey ? { ...row, ...translation } : row))
      );
      
      return true;
    } catch (error) {
      console.error('Failed to save translation', error);
      setStatusMessage({ 
        tone: 'error', 
        messageKey: 'admin.translationsPage.status.saveError' 
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * Import translations from CSV array
   */
  const importTranslations = useCallback(async (
    translations: Translation[], 
    currentFilters: TranslationFilters
  ) => {
    try {
      await BackendApiClient.bulkUpsertTranslations(translations);
      telemetry.track('import', { count: translations.length });
      
      setStatusMessage({ 
        tone: 'success', 
        messageKey: 'admin.translationsPage.status.importSuccess' 
      });
      
      // Reload with current filters
      await loadRows(currentFilters);
      return true;
    } catch (error) {
      console.error('Import failed', error);
      setStatusMessage({ 
        tone: 'error', 
        messageKey: 'admin.translationsPage.status.importError' 
      });
      return false;
    }
  }, [loadRows]);

  /**
   * Clear status message
   */
  const clearStatusMessage = useCallback(() => {
    setStatusMessage(null);
  }, []);

  return {
    rows,
    isLoading,
    fetchErrorKey,
    statusMessage,
    isSaving,
    loadRows,
    saveTranslation,
    importTranslations,
    clearStatusMessage,
  };
};
