'use client';

import { Button } from '@kolab/ui';

import { WorkspaceCard } from '@/components/common/workspace-layout';
import { usePortalPreferences } from '@/contexts/portal-preferences-context';
import type { PortalTheme } from '@/types/portal-preferences';

const THEME_OPTIONS: Array<{ value: PortalTheme; label: string }> = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

export function PortalPreferencesPanel() {
  const {
    preferences,
    setSidebarCollapsed,
    setTheme,
    setCompactWorkspaces,
    setWorkspaceViewState,
    getWorkspaceViewState,
  } = usePortalPreferences();

  return (
    <div className="space-y-4">
      <WorkspaceCard title="Appearance" description="Theme and layout preferences">
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Theme</span>
            <select
              className="bg-background/60 rounded-md border border-white/10 px-2 py-1"
              value={preferences.theme}
              onChange={(event) => setTheme(event.target.value as PortalTheme)}
              aria-label="Portal theme"
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Collapse sidebar on desktop</span>
            <input
              type="checkbox"
              checked={preferences.sidebarCollapsed}
              onChange={(event) => setSidebarCollapsed(event.target.checked)}
              aria-label="Collapse sidebar on desktop"
            />
          </label>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Compact workspace spacing</span>
            <input
              type="checkbox"
              checked={preferences.compactWorkspaces}
              onChange={(event) => setCompactWorkspaces(event.target.checked)}
              aria-label="Compact workspace spacing"
            />
          </label>
        </div>
      </WorkspaceCard>

      <WorkspaceCard title="Workspace views" description="Remember selected tabs and views">
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Saved view: {getWorkspaceViewState('creators') ?? 'Default (none selected yet)'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setWorkspaceViewState('creators', 'list')}
            >
              Save Creators list view
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setWorkspaceViewState('campaigns', 'board')}
            >
              Save Campaigns board view
            </Button>
          </div>
        </div>
      </WorkspaceCard>
    </div>
  );
}
