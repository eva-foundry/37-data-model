/**
 * useTranslations Hook (admin-face)
 *
 * Provides `t(key)` lookup backed by the mock translation service.
 * Returns the same shape as the chat-face hook so components are portable.
 */

import { useState, useCallback, useEffect } from 'react';
import { mockBackendService } from '@services/MockBackendService';

type Lang = 'en' | 'fr';
type LocaleMap = Record<string, { en: string; fr: string }>;

export const useTranslations = () => {
  const [lang, setLangState] = useState<Lang>('en');
  const [map, setMap] = useState<LocaleMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mockBackendService
      .getTranslations()
      .then((resp) => {
        const m: LocaleMap = {};
        for (const item of resp.translations) {
          m[item.key] = { en: item.en || item.key, fr: item.fr || item.key };
        }
        setMap(m);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const t = useCallback(
    (key: string): string => {
      const entry = map[key];
      return entry ? entry[lang] : key;
    },
    [map, lang]
  );

  const setLang = useCallback((newLang: string) => {
    setLangState(newLang as Lang);
  }, []);

  return { t, lang, setLang, isLoading };
};
