export const STUDIO_THEME_KEY = 'kolab.creator-studio.theme';
export const STUDIO_WORKSPACE_PREFS_KEY = 'kolab.creator-studio.workspace-preferences';
export const STUDIO_TAB_PREFS_KEY = 'kolab.creator-studio.workspace-tabs';

export type StudioTheme = 'dark' | 'light';

export type StudioWorkspacePreferences = {
  compactSidebar: boolean;
  showSourceBadges: boolean;
};

export type StudioTabPreferences = Record<string, string>;

const DEFAULT_WORKSPACE_PREFS: StudioWorkspacePreferences = {
  compactSidebar: false,
  showSourceBadges: true,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as T) };
  } catch {
    return fallback;
  }
}

export function readStudioTheme(): StudioTheme {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(STUDIO_THEME_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

export function writeStudioTheme(theme: StudioTheme): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STUDIO_THEME_KEY, theme);
}

export function readStudioWorkspacePreferences(): StudioWorkspacePreferences {
  return readJson(STUDIO_WORKSPACE_PREFS_KEY, DEFAULT_WORKSPACE_PREFS);
}

export function writeStudioWorkspacePreferences(preferences: StudioWorkspacePreferences): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STUDIO_WORKSPACE_PREFS_KEY, JSON.stringify(preferences));
}

export function readStudioTabPreferences(): StudioTabPreferences {
  return readJson<StudioTabPreferences>(STUDIO_TAB_PREFS_KEY, {});
}

export function writeStudioTabPreference(workspaceKey: string, tab: string): void {
  if (typeof window === 'undefined') return;
  const next = { ...readStudioTabPreferences(), [workspaceKey]: tab };
  window.localStorage.setItem(STUDIO_TAB_PREFS_KEY, JSON.stringify(next));
}

export function readStudioTabPreference(workspaceKey: string, fallback: string): string {
  return readStudioTabPreferences()[workspaceKey] ?? fallback;
}
