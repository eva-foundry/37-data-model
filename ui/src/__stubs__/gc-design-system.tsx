/**
 * gc-design-system stub for vitest
 *
 * GCThemeProvider renders children transparently in test/dev mode.
 * The real package (dist/) is only needed for production builds.
 *
 * Referenced by vite.config.ts resolve.alias when in test mode.
 */
import type { FC, ReactNode } from 'react';

interface GCThemeProviderProps {
  children: ReactNode;
  variant?: 'light' | 'dark';
}

export const GCThemeProvider: FC<GCThemeProviderProps> = ({ children }) => (
  <>{children}</>
);
