import { RoleBadge } from '@/components/admin/role-badge';
import { WorkspaceCard } from '@/components/common/workspace-layout';
import type { ManagerUserManagement } from '@/types/administration-workspace';

type UserManagementPanelProps = {
  userManagement: ManagerUserManagement;
};

export function UserManagementPanel({ userManagement }: UserManagementPanelProps) {
  return (
    <WorkspaceCard
      title="User management"
      description={`${userManagement.users.length} users · ${userManagement.invitations.length} invitations`}
    >
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="pb-2 pr-4">User</th>
                <th className="pb-2 pr-4">Role</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {userManagement.users.map((user) => (
                <tr key={user.id} className="border-t border-white/10">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-muted-foreground text-xs">{user.email}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="py-3 pr-4">{user.status}</td>
                  <td className="text-muted-foreground py-3">{user.lastLoginLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {userManagement.invitations.length > 0 ? (
          <div>
            <div className="mb-2 text-sm font-medium">Pending invitations</div>
            <div className="space-y-2">
              {userManagement.invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
                >
                  <div>
                    <div>{invitation.email}</div>
                    <div className="text-muted-foreground text-xs">
                      Expires {invitation.expiresLabel}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RoleBadge role={invitation.role} />
                    <span className="text-muted-foreground text-xs">{invitation.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </WorkspaceCard>
  );
}
