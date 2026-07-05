'use client';

import { Button } from '@kolab/ui';

import { InlineLoading } from '@/components/common/global-loading';
import { WorkspaceError } from '@/components/common/workspace-error';
import { SettingsAppearanceSection } from '@/components/settings/settings-appearance-section';
import { SettingsGeneralSection } from '@/components/settings/settings-general-section';
import { SettingsNotificationsSection } from '@/components/settings/settings-notifications-section';
import { SettingsSystemSection } from '@/components/settings/settings-system-section';
import { SettingsWorkspacePreferencesSection } from '@/components/settings/settings-workspace-preferences-section';
import { useSettingsWorkspace } from '@/hooks/use-settings-workspace';

function sourceLabel(
  source: NonNullable<ReturnType<typeof useSettingsWorkspace>['source']>,
): string {
  switch (source) {
    case 'mock':
      return 'Mock data';
    case 'live':
      return 'Live API';
    case 'empty':
      return 'No account profile yet';
    case 'partial':
      return 'Partial API data';
    default:
      return source;
  }
}

export function SettingsWorkspace() {
  const { data, loading, error, source, refresh } = useSettingsWorkspace();

  if (loading) {
    return <InlineLoading label="Loading settings…" />;
  }

  if (error) {
    return (
      <WorkspaceError
        title="Unable to load settings"
        message={error}
        onRetry={() => void refresh()}
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Account and workspace preferences
            {source ? ` · ${sourceLabel(source)}` : null}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {source === 'partial' ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Some settings could not be loaded from the API. Showing available preferences.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <SettingsGeneralSection general={data.general} />
        <SettingsAppearanceSection />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SettingsNotificationsSection />
        <SettingsWorkspacePreferencesSection />
      </div>

      <SettingsSystemSection
        mockMode={data.mockMode}
        version={data.version}
        environment={data.environment}
      />
    </div>
  );
}
