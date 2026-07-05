'use client';

import * as React from 'react';

import { readStudioTheme, type StudioTheme, writeStudioTheme } from '@/lib/studio-preferences';

type ThemeContextValue = {
  theme: StudioTheme;
  setTheme: (theme: StudioTheme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<StudioTheme>('dark');

  React.useEffect(() => {
    setThemeState(readStudioTheme());
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    writeStudioTheme(theme);
  }, [theme]);

  const setTheme = React.useCallback((next: StudioTheme) => {
    setThemeState(next);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
