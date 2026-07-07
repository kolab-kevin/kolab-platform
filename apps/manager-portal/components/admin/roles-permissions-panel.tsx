import { RoleBadge } from '@/components/admin/role-badge';
import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerRolesPermissions } from '@/types/administration-workspace';

type RolesPermissionsPanelProps = {
  rolesPermissions: ManagerRolesPermissions;
};

export function RolesPermissionsPanel({ rolesPermissions }: RolesPermissionsPanelProps) {
  const matrixRoles = rolesPermissions.permissionMatrix[0]
    ? Object.keys(rolesPermissions.permissionMatrix[0].roles)
    : [];

  return (
    <WorkspaceCard
      title="Roles & permissions"
      description={rolesPermissions.organizationAccessLabel}
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {rolesPermissions.roles.map((role) => (
            <div
              key={role.role}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <RoleBadge role={role.label} />
                <span className="text-muted-foreground text-xs">{role.memberCount} members</span>
              </div>
              <div className="mt-2 text-sm">{role.permissionSummary}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">Permission matrix (read-only)</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="pb-2 pr-4">Permission</th>
                  {matrixRoles.slice(0, 6).map((role) => (
                    <th key={role} className="pb-2 pr-2">
                      {role.replace('ORG_', '').replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rolesPermissions.permissionMatrix.map((row) => (
                  <tr key={row.permission} className="border-t border-white/10">
                    <td className="py-2 pr-4 font-mono">{row.permission}</td>
                    {matrixRoles.slice(0, 6).map((role) => (
                      <td key={role} className="py-2 pr-2">
                        {row.roles[role] ? '✓' : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WorkspaceCard>
  );
}
