'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@kolab/ui';

import { useStudioPreferences } from '@/hooks/use-studio-preferences';

export function SettingsWorkspacePreferencesSection() {
  const [preferences, updatePreferences] = useStudioPreferences();

  return (
    <Card className="border-white/10 bg-white/[0.03] shadow-sm">
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
            onClick={() =>
              updatePreferences({
                ...preferences,
                compactSidebar: !preferences.compactSidebar,
              })
            }
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
            onClick={() =>
              updatePreferences({
                ...preferences,
                showSourceBadges: !preferences.showSourceBadges,
              })
            }
          >
            {preferences.showSourceBadges ? 'On' : 'Off'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
