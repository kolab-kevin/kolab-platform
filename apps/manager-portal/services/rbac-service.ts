import { ORGANIZATION_ROLE_PERMISSIONS } from '@kolab/auth';
import type { OrganizationMember, OrganizationRole } from '@kolab/types';

import type {
  ManagerPermissionMatrixRow,
  ManagerRolesPermissions,
  ManagerRoleSummary,
} from '@/types/administration-workspace';

const ROLE_LABELS: Record<OrganizationRole, string> = {
  ORG_OWNER: 'Organization owner',
  ORG_ADMIN: 'Organization admin',
  AGENCY_MANAGER: 'Agency manager',
  RECRUITER: 'Recruiter',
  CREATOR: 'Creator',
  MODERATOR: 'Moderator',
  FINANCE: 'Finance',
  SUPPORT: 'Support',
  VIEWER: 'Viewer',
};

const MATRIX_PERMISSIONS = [
  'org:read',
  'org:update',
  'members:read',
  'members:invite',
  'members:update_role',
  'audit:read',
  'crm:read',
  'crm:update',
] as const;

function summarizePermissions(role: OrganizationRole): string {
  const permissions = ORGANIZATION_ROLE_PERMISSIONS[role];
  if (permissions.length >= 10) {
    return `${permissions.length} permissions · full workspace access`;
  }
  if (permissions.includes('members:invite')) {
    return `${permissions.length} permissions · team and CRM access`;
  }
  return `${permissions.length} permissions · read-focused access`;
}

export function buildRolesPermissions(members: OrganizationMember[]): ManagerRolesPermissions {
  const roleCounts = new Map<OrganizationRole, number>();

  for (const member of members) {
    roleCounts.set(member.role, (roleCounts.get(member.role) ?? 0) + 1);
  }

  const roles: ManagerRoleSummary[] = (
    Object.keys(ORGANIZATION_ROLE_PERMISSIONS) as OrganizationRole[]
  )
    .filter(
      (role) =>
        (roleCounts.get(role) ?? 0) > 0 || role === 'ORG_ADMIN' || role === 'AGENCY_MANAGER',
    )
    .map((role) => ({
      role,
      label: ROLE_LABELS[role],
      memberCount: roleCounts.get(role) ?? 0,
      permissionSummary: summarizePermissions(role),
    }));

  const permissionMatrix: ManagerPermissionMatrixRow[] = MATRIX_PERMISSIONS.map((permission) => ({
    permission,
    roles: Object.fromEntries(
      (Object.keys(ORGANIZATION_ROLE_PERMISSIONS) as OrganizationRole[]).map((role) => [
        role,
        ORGANIZATION_ROLE_PERMISSIONS[role].includes(permission),
      ]),
    ),
  }));

  const activeRoles = roles.filter((role) => role.memberCount > 0).length;

  return {
    roles,
    permissionMatrix,
    organizationAccessLabel: `${activeRoles} active roles · read-only permission matrix`,
  };
}
