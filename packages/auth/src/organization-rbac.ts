import type { OrganizationRole, Permission, Role } from '@kolab/types';

import type { AccessTokenPayload } from './jwt';
import { userHasPermission } from './permissions';
import { hasAnyRole } from './rbac';

/**
 * Maps organization roles to the closest Phase 1 legacy role for @Roles() compatibility.
 */
export const ORGANIZATION_ROLE_LEGACY_EQUIVALENT: Readonly<Record<OrganizationRole, Role>> = {
  ORG_OWNER: 'ADMIN',
  ORG_ADMIN: 'ADMIN',
  AGENCY_MANAGER: 'ADMIN',
  RECRUITER: 'USER',
  CREATOR: 'CREATOR',
  MODERATOR: 'MODERATOR',
  FINANCE: 'USER',
  SUPPORT: 'USER',
  VIEWER: 'USER',
};

export function hasAnyOrganizationRole(
  organizationRole: OrganizationRole,
  allowedRoles: readonly OrganizationRole[],
): boolean {
  return allowedRoles.includes(organizationRole);
}

export function satisfiesLegacyRoles(
  user: Pick<AccessTokenPayload, 'role' | 'organizationRole'>,
  requiredRoles: readonly Role[],
): boolean {
  if (hasAnyRole(user.role, [...requiredRoles])) {
    return true;
  }

  if (user.organizationRole) {
    const equivalent = ORGANIZATION_ROLE_LEGACY_EQUIVALENT[user.organizationRole];
    return hasAnyRole(equivalent, [...requiredRoles]);
  }

  return false;
}

export function assertOrganizationRole(
  organizationRole: OrganizationRole,
  allowedRoles: readonly OrganizationRole[],
): void {
  if (!hasAnyOrganizationRole(organizationRole, allowedRoles)) {
    throw new Error('Insufficient organization role');
  }
}

export function assertPermission(
  user: Pick<AccessTokenPayload, 'role' | 'organizationRole' | 'isSystemAdmin'>,
  permission: Permission,
): void {
  if (!userHasPermission(user, permission)) {
    throw new Error('Insufficient permissions');
  }
}
