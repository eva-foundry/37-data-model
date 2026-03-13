import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type ViewDensity = 'comfortable' | 'compact';

interface ViewSettingsContextValue {
  density: ViewDensity;
  setDensity: (density: ViewDensity) => void;
}

const DENSITY_STORAGE_KEY = 'eva-ui-density';

const ViewSettingsContext = createContext<ViewSettingsContextValue | undefined>(undefined);

function getInitialDensity(): ViewDensity {
  if (typeof window === 'undefined') {
    return 'comfortable';
  }

  const stored = window.localStorage.getItem(DENSITY_STORAGE_KEY);
  if (stored === 'comfortable' || stored === 'compact') {
    return stored;
  }

  return 'comfortable';
}

export const ViewSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [density, setDensityState] = useState<ViewDensity>(() => getInitialDensity());

  const setDensity = (nextDensity: ViewDensity): void => {
    setDensityState(nextDensity);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DENSITY_STORAGE_KEY, nextDensity);
    }
  };

  const value = useMemo(
    () => ({
      density,
      setDensity,
    }),
    [density]
  );

  return <ViewSettingsContext.Provider value={value}>{children}</ViewSettingsContext.Provider>;
};

export const useViewSettings = (): ViewSettingsContextValue => {
  const context = useContext(ViewSettingsContext);
  if (!context) {
    throw new Error('useViewSettings must be used within ViewSettingsProvider');
  }
  return context;
};
