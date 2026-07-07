'use client';

import { Button } from '@kolab/ui';

import { AuditCenterPanel } from '@/components/admin/audit-center-panel';
import { IntegrationsPanel } from '@/components/admin/integrations-panel';
import { OrganizationProfilePanel } from '@/components/admin/organization-profile-panel';
import { OrganizationSettingsPanel } from '@/components/admin/organization-settings-panel';
import { QuickActionsPanel } from '@/components/admin/quick-actions-panel';
import { RolesPermissionsPanel } from '@/components/admin/roles-permissions-panel';
import { SystemHealthPanel } from '@/components/admin/system-health-panel';
import { UserManagementPanel } from '@/components/admin/user-management-panel';
import { WorkspaceSection } from '@/components/common/workspace-layout';
import { EmptyWorkspaceState, WorkspacePage } from '@/components/common/workspace-page';
import { useAdministrationWorkspace } from '@/hooks/use-administration-workspace';

export function AdministrationWorkspace() {
  const { workspace, loading, error, source, refresh } = useAdministrationWorkspace();

  const sourceLabel =
    source === 'mock'
      ? 'Mock data'
      : source === 'partial'
        ? 'Partial API data'
        : source === 'live'
          ? 'Live API data'
          : undefined;

  return (
    <WorkspacePage
      title="Administration"
      description={
        workspace
          ? `${workspace.userManagement.users.length} team members${sourceLabel ? ` · ${sourceLabel}` : ''}`
          : 'Organization administration and system status'
      }
      loading={loading}
      loadingLabel="Loading administration workspace…"
      error={error}
      errorTitle="Unable to load administration workspace"
      onRetry={() => void refresh()}
      actions={
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      }
      emptyNotice={
        source === 'empty' ? (
          <EmptyWorkspaceState message="No administration data is available in this organization yet." />
        ) : null
      }
    >
      {workspace ? (
        <div className="space-y-6">
          <WorkspaceSection title="Quick actions">
            <QuickActionsPanel onRefresh={() => void refresh()} />
          </WorkspaceSection>

          <OrganizationProfilePanel profile={workspace.organizationProfile} />

          <div className="grid gap-4 xl:grid-cols-2">
            <UserManagementPanel userManagement={workspace.userManagement} />
            <RolesPermissionsPanel rolesPermissions={workspace.rolesPermissions} />
          </div>

          <OrganizationSettingsPanel settings={workspace.organizationSettings} />

          <AuditCenterPanel auditCenter={workspace.auditCenter} />

          <div className="grid gap-4 xl:grid-cols-2">
            <SystemHealthPanel systemHealth={workspace.systemHealth} />
            <IntegrationsPanel integrations={workspace.integrations} />
          </div>
        </div>
      ) : null}
    </WorkspacePage>
  );
}
