import { z } from 'zod';

import type { OrganizationRole } from './enums';

export const PermissionSchema = z.enum([
  'org:read',
  'org:update',
  'members:read',
  'members:invite',
  'members:update_role',
  'members:remove',
  'audit:read',
  'sessions:revoke',
]);

export type Permission = z.infer<typeof PermissionSchema>;

export const PERMISSIONS = PermissionSchema.options;

const readOnly: Permission[] = ['org:read', 'members:read'];

const memberManagement: Permission[] = [
  'org:read',
  'org:update',
  'members:read',
  'members:invite',
  'members:update_role',
  'members:remove',
  'audit:read',
  'sessions:revoke',
];

/** Static Release 0.2 role → permission map (mirrors identity architecture). */
export const ORGANIZATION_ROLE_PERMISSIONS: Readonly<
  Record<OrganizationRole, readonly Permission[]>
> = {
  ORG_OWNER: memberManagement,
  ORG_ADMIN: memberManagement,
  AGENCY_MANAGER: [
    'org:read',
    'members:read',
    'members:invite',
    'members:update_role',
    'audit:read',
  ],
  RECRUITER: ['org:read', 'members:read', 'members:invite'],
  CREATOR: ['org:read', 'members:read'],
  MODERATOR: ['org:read', 'members:read', 'audit:read'],
  FINANCE: ['org:read', 'members:read', 'audit:read'],
  SUPPORT: ['org:read', 'members:read', 'audit:read'],
  VIEWER: readOnly,
};

export function permissionsForOrganizationRole(role: OrganizationRole): readonly Permission[] {
  return ORGANIZATION_ROLE_PERMISSIONS[role];
}

export function organizationRoleHasPermission(
  role: OrganizationRole,
  permission: Permission,
): boolean {
  return ORGANIZATION_ROLE_PERMISSIONS[role].includes(permission);
}
