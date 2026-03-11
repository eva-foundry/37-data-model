/**
 * Language Context - Session 45 Part 8
 * 
 * Provides current language selection to all components via React Context.
 * Supports 5 languages: EN, FR, PT, CN, ES
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SupportedLanguage = 'en' | 'fr' | 'pt' | 'cn' | 'es';

interface LangContextValue {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
}

const LangContext = createContext<LangContextValue | undefined>(undefined);

interface LangProviderProps {
  children: ReactNode;
  defaultLang?: SupportedLanguage;
}

export const LangProvider: React.FC<LangProviderProps> = ({ children, defaultLang = 'en' }) => {
  const [lang, setLang] = useState<SupportedLanguage>(defaultLang);
  
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
};

export function useLang(): LangContextValue {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
}
