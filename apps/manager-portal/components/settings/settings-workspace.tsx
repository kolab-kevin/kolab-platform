'use client';

import { WorkspaceDataPage } from '@/components/common/workspace-data-page';
import { WorkspaceSection } from '@/components/common/workspace-layout';
import { PortalPreferencesPanel } from '@/components/settings/portal-preferences-panel';

export function SettingsWorkspace() {
  return (
    <WorkspaceDataPage
      title="Settings"
      fallbackDescription="Portal preferences and account settings"
      loading={false}
      loadingLabel="Loading settings…"
      error={null}
      errorTitle="Unable to load settings"
      source={null}
      emptyMessage=""
      onRefresh={() => undefined}
    >
      <WorkspaceSection title="Preferences">
        <PortalPreferencesPanel />
      </WorkspaceSection>
    </WorkspaceDataPage>
  );
}
