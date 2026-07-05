'use client';

import { PartialWorkspaceNotice, WorkspacePage } from '@/components/common/workspace-page';
import { SettingsAppearanceSection } from '@/components/settings/settings-appearance-section';
import { SettingsGeneralSection } from '@/components/settings/settings-general-section';
import { SettingsNotificationsSection } from '@/components/settings/settings-notifications-section';
import { SettingsSystemSection } from '@/components/settings/settings-system-section';
import { SettingsWorkspacePreferencesSection } from '@/components/settings/settings-workspace-preferences-section';
import { useSettingsWorkspace } from '@/hooks/use-settings-workspace';
import { WORKSPACE_GRID_CLASS } from '@/lib/studio-ui';

export function SettingsWorkspace() {
  const { data, loading, error, source, refresh } = useSettingsWorkspace();

  if (!data && !loading && !error) {
    return null;
  }

  return (
    <WorkspacePage
      title="Settings"
      description="Account and workspace preferences"
      source={source}
      loading={loading}
      loadingLabel="Loading settings…"
      error={error}
      errorTitle="Unable to load settings"
      onRetry={() => void refresh()}
      partialNotice={
        source === 'partial' ? (
          <PartialWorkspaceNotice message="Some settings could not be loaded from the API. Showing available preferences." />
        ) : null
      }
    >
      <div className={WORKSPACE_GRID_CLASS}>
        <SettingsGeneralSection general={data?.general ?? null} />
        <SettingsAppearanceSection />
      </div>

      <div className={WORKSPACE_GRID_CLASS}>
        <SettingsNotificationsSection />
        <SettingsWorkspacePreferencesSection />
      </div>

      {data ? (
        <SettingsSystemSection
          mockMode={data.mockMode}
          version={data.version}
          environment={data.environment}
        />
      ) : null}
    </WorkspacePage>
  );
}
