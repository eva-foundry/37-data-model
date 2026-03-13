// Language context — data-model-ui
// Provides { lang, setLang } to all components.
// Default: 'en'. 6-language support: EN/FR/ES/DE/PT/CN.

import React, { createContext, useContext, useState } from 'react';

export type Lang = 'en' | 'fr' | 'es' | 'de' | 'pt' | 'cn';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({ lang: 'en', setLang: () => undefined });

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>('en');
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
};

export function useLang(): LangContextValue {
  return useContext(LangContext);
}
