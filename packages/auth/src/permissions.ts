import type { OrganizationRole, Permission, Role } from '@kolab/types';

import type { AccessTokenPayload } from './jwt';

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

const readOnly: Permission[] = ['org:read', 'members:read'];

/** Release 0.2 static organization role → permission map. */
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
  CREATOR: readOnly,
  MODERATOR: ['org:read', 'members:read', 'audit:read'],
  FINANCE: ['org:read', 'members:read', 'audit:read'],
  SUPPORT: ['org:read', 'members:read', 'audit:read'],
  VIEWER: readOnly,
};

/** Phase 1 fallback when JWT has no organizationRole (migration window). */
export const LEGACY_ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  USER: readOnly,
  CREATOR: readOnly,
  MODERATOR: ['org:read', 'members:read', 'audit:read'],
  ADMIN: memberManagement,
  SUPER_ADMIN: memberManagement,
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

export function legacyRoleHasPermission(role: Role, permission: Permission): boolean {
  return LEGACY_ROLE_PERMISSIONS[role].includes(permission);
}

export function resolveUserPermissions(
  user: Pick<AccessTokenPayload, 'role' | 'organizationRole'>,
): readonly Permission[] {
  if (user.organizationRole) {
    return permissionsForOrganizationRole(user.organizationRole);
  }

  return LEGACY_ROLE_PERMISSIONS[user.role];
}

export function userHasPermission(
  user: Pick<AccessTokenPayload, 'role' | 'organizationRole' | 'isSystemAdmin'>,
  permission: Permission,
): boolean {
  if (user.isSystemAdmin) {
    return true;
  }

  return resolveUserPermissions(user).includes(permission);
}

export function userHasAllPermissions(
  user: Pick<AccessTokenPayload, 'role' | 'organizationRole' | 'isSystemAdmin'>,
  permissions: readonly Permission[],
): boolean {
  if (user.isSystemAdmin) {
    return true;
  }

  const granted = new Set(resolveUserPermissions(user));
  return permissions.every((permission) => granted.has(permission));
}

export function userHasAnyPermission(
  user: Pick<AccessTokenPayload, 'role' | 'organizationRole' | 'isSystemAdmin'>,
  permissions: readonly Permission[],
): boolean {
  if (user.isSystemAdmin) {
    return true;
  }

  const granted = new Set(resolveUserPermissions(user));
  return permissions.some((permission) => granted.has(permission));
}

export function isSystemAdminUser(user: Pick<AccessTokenPayload, 'isSystemAdmin'>): boolean {
  return user.isSystemAdmin === true;
}
