'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';
import * as React from 'react';

const WORKSPACE_PREFS_KEY = 'kolab.creator-studio.workspace-preferences';

type WorkspacePreferences = {
  compactSidebar: boolean;
  showSourceBadges: boolean;
};

const DEFAULT_PREFS: WorkspacePreferences = {
  compactSidebar: false,
  showSourceBadges: true,
};

function readPreferences(): WorkspacePreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS;

  try {
    const raw = window.localStorage.getItem(WORKSPACE_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as WorkspacePreferences) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function SettingsWorkspacePreferencesSection() {
  const [preferences, setPreferences] = React.useState<WorkspacePreferences>(DEFAULT_PREFS);

  React.useEffect(() => {
    setPreferences(readPreferences());
  }, []);

  const updatePreference = (key: keyof WorkspacePreferences, value: boolean) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    window.localStorage.setItem(WORKSPACE_PREFS_KEY, JSON.stringify(next));
  };

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Workspace preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <div>
            <p className="font-medium">Compact sidebar</p>
            <p className="text-muted-foreground text-xs">Reduce sidebar spacing on desktop.</p>
          </div>
          <Button
            variant={preferences.compactSidebar ? 'default' : 'outline'}
            size="sm"
            onClick={() => updatePreference('compactSidebar', !preferences.compactSidebar)}
          >
            {preferences.compactSidebar ? 'On' : 'Off'}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <div>
            <p className="font-medium">Show data source badges</p>
            <p className="text-muted-foreground text-xs">
              Display mock/live indicators in workspaces.
            </p>
          </div>
          <Button
            variant={preferences.showSourceBadges ? 'default' : 'outline'}
            size="sm"
            onClick={() => updatePreference('showSourceBadges', !preferences.showSourceBadges)}
          >
            {preferences.showSourceBadges ? 'On' : 'Off'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
