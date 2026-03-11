/**
 * Language Context - 5 Language Support
 * Supports: English, French, Spanish, German, Portuguese
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { loadLanguagePreference, saveLanguagePreference } from '@api/languagePreferencesApi';

export type Lang = 'en' | 'fr' | 'es' | 'de' | 'pt';

const LANG_STORAGE_KEY = 'eva-ui-lang';
const DEFAULT_USER_ID = import.meta.env.VITE_LANGUAGE_PREFERENCE_USER_ID || 'demo-user';

function getInitialLang(initialLang?: Lang): Lang {
  if (initialLang) return initialLang;

  if (typeof window === 'undefined') {
    return 'en';
  }

  const savedLang = window.localStorage.getItem(LANG_STORAGE_KEY);
  if (savedLang === 'en' || savedLang === 'fr' || savedLang === 'es' || savedLang === 'de' || savedLang === 'pt') {
    return savedLang;
  }

  return 'en';
}

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue | undefined>(undefined);

export const LangProvider: React.FC<{ children: ReactNode; initialLang?: Lang }> = ({ children, initialLang }) => {
  const [lang, setLangState] = useState<Lang>(() => getInitialLang(initialLang));

  React.useEffect(() => {
    // Respect explicit test/setup language and skip async override when provided.
    if (initialLang) {
      return;
    }

    let cancelled = false;

    async function hydrateLanguagePreference(): Promise<void> {
      const apiLang = await loadLanguagePreference(DEFAULT_USER_ID);
      if (apiLang && !cancelled) {
        setLangState(apiLang);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(LANG_STORAGE_KEY, apiLang);
        }
      }
    }

    hydrateLanguagePreference();

    return () => {
      cancelled = true;
    };
  }, [initialLang]);

  const setLang = (nextLang: Lang): void => {
    setLangState(nextLang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANG_STORAGE_KEY, nextLang);
    }

    void saveLanguagePreference(DEFAULT_USER_ID, nextLang);
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = (): LangContextValue => {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used within LangProvider');
  }
  return context;
};
