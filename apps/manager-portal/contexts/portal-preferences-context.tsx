'use client';

import * as React from 'react';

import { PORTAL_STORAGE_KEYS, readPortalStorage, writePortalStorage } from '@/lib/portal-storage';
import {
  DEFAULT_PORTAL_PREFERENCES,
  type PortalPreferences,
  PortalPreferencesSchema,
  type PortalTheme,
} from '@/types/portal-preferences';

type PortalPreferencesContextValue = {
  preferences: PortalPreferences;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: PortalTheme) => void;
  setCompactWorkspaces: (compact: boolean) => void;
  setWorkspaceViewState: (workspaceId: string, viewId: string) => void;
  getWorkspaceViewState: (workspaceId: string) => string | undefined;
};

const PortalPreferencesContext = React.createContext<PortalPreferencesContextValue | null>(null);

function resolveTheme(theme: PortalTheme): 'dark' | 'light' {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return theme;
}

function applyTheme(theme: PortalTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = resolveTheme(theme);
}

export function PortalPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = React.useState<PortalPreferences>(() => {
    const stored = readPortalStorage(PORTAL_STORAGE_KEYS.preferences, DEFAULT_PORTAL_PREFERENCES);
    const parsed = PortalPreferencesSchema.safeParse(stored);
    return parsed.success ? parsed.data : DEFAULT_PORTAL_PREFERENCES;
  });

  const updatePreferences = React.useCallback((next: PortalPreferences) => {
    setPreferences(next);
    writePortalStorage(PORTAL_STORAGE_KEYS.preferences, next);
  }, []);

  React.useEffect(() => {
    applyTheme(preferences.theme);
  }, [preferences.theme]);

  React.useEffect(() => {
    if (preferences.theme !== 'system' || typeof window === 'undefined') return;

    const media = window.matchMedia('(prefers-color-scheme: light)');
    const listener = () => applyTheme('system');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [preferences.theme]);

  const value = React.useMemo<PortalPreferencesContextValue>(
    () => ({
      preferences,
      setSidebarCollapsed: (sidebarCollapsed) =>
        updatePreferences({ ...preferences, sidebarCollapsed }),
      setTheme: (theme) => updatePreferences({ ...preferences, theme }),
      setCompactWorkspaces: (compactWorkspaces) =>
        updatePreferences({ ...preferences, compactWorkspaces }),
      setWorkspaceViewState: (workspaceId, viewId) =>
        updatePreferences({
          ...preferences,
          workspaceViewState: {
            ...preferences.workspaceViewState,
            [workspaceId]: viewId,
          },
        }),
      getWorkspaceViewState: (workspaceId) => preferences.workspaceViewState[workspaceId],
    }),
    [preferences, updatePreferences],
  );

  return (
    <PortalPreferencesContext.Provider value={value}>{children}</PortalPreferencesContext.Provider>
  );
}

export function usePortalPreferences(): PortalPreferencesContextValue {
  const ctx = React.useContext(PortalPreferencesContext);
  if (!ctx) {
    throw new Error('usePortalPreferences must be used within PortalPreferencesProvider');
  }
  return ctx;
}
