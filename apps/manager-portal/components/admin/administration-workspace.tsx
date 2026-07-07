'use client';

import dynamic from 'next/dynamic';

import { OrganizationProfilePanel } from '@/components/admin/organization-profile-panel';
import { QuickActionsPanel } from '@/components/admin/quick-actions-panel';
import { GlobalLoading } from '@/components/common/global-loading';
import { WorkspaceDataPage } from '@/components/common/workspace-data-page';
import { WorkspaceSection } from '@/components/common/workspace-layout';
import { useAdministrationWorkspace } from '@/hooks/use-administration-workspace';
import { PORTAL_GRID_CLASS } from '@/lib/portal-ui';

const UserManagementPanel = dynamic(
  () =>
    import('@/components/admin/user-management-panel').then((module) => module.UserManagementPanel),
  { loading: () => <GlobalLoading label="Loading user management…" /> },
);

const RolesPermissionsPanel = dynamic(
  () =>
    import('@/components/admin/roles-permissions-panel').then(
      (module) => module.RolesPermissionsPanel,
    ),
  { loading: () => <GlobalLoading label="Loading roles and permissions…" /> },
);

const OrganizationSettingsPanel = dynamic(
  () =>
    import('@/components/admin/organization-settings-panel').then(
      (module) => module.OrganizationSettingsPanel,
    ),
  { loading: () => <GlobalLoading label="Loading organization settings…" /> },
);

const AuditCenterPanel = dynamic(
  () => import('@/components/admin/audit-center-panel').then((module) => module.AuditCenterPanel),
  { loading: () => <GlobalLoading label="Loading audit center…" /> },
);

const SystemHealthPanel = dynamic(
  () => import('@/components/admin/system-health-panel').then((module) => module.SystemHealthPanel),
  { loading: () => <GlobalLoading label="Loading system health…" /> },
);

const IntegrationsPanel = dynamic(
  () => import('@/components/admin/integrations-panel').then((module) => module.IntegrationsPanel),
  { loading: () => <GlobalLoading label="Loading integrations…" /> },
);

export function AdministrationWorkspace() {
  const { workspace, loading, error, source, refresh } = useAdministrationWorkspace();

  return (
    <WorkspaceDataPage
      title="Administration"
      fallbackDescription="Organization administration and system status"
      loadedDescription={
        workspace ? `${workspace.userManagement.users.length} team members` : undefined
      }
      loading={loading}
      loadingLabel="Loading administration workspace…"
      error={error}
      errorTitle="Unable to load administration workspace"
      source={source}
      emptyMessage="No administration data is available in this organization yet."
      onRefresh={refresh}
    >
      {workspace ? (
        <div className="space-y-6">
          <WorkspaceSection title="Quick actions">
            <QuickActionsPanel onRefresh={() => void refresh()} />
          </WorkspaceSection>

          <OrganizationProfilePanel profile={workspace.organizationProfile} />

          <div className={PORTAL_GRID_CLASS}>
            <UserManagementPanel userManagement={workspace.userManagement} />
            <RolesPermissionsPanel rolesPermissions={workspace.rolesPermissions} />
          </div>

          <OrganizationSettingsPanel settings={workspace.organizationSettings} />

          <AuditCenterPanel auditCenter={workspace.auditCenter} />

          <div className={PORTAL_GRID_CLASS}>
            <SystemHealthPanel systemHealth={workspace.systemHealth} />
            <IntegrationsPanel integrations={workspace.integrations} />
          </div>
        </div>
      ) : null}
    </WorkspaceDataPage>
  );
}
