import type { Role } from '@kolab/types';

const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  CREATOR: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

export function hasAnyRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export function assertRole(userRole: Role, allowedRoles: Role[]): void {
  if (!hasAnyRole(userRole, allowedRoles)) {
    throw new Error('Insufficient permissions');
  }
}

export const APP_ALLOWED_ROLES = {
  web: ['USER', 'CREATOR', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'] as Role[],
  admin: ['ADMIN', 'SUPER_ADMIN'] as Role[],
  creatorPortal: ['CREATOR', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'] as Role[],
  moderator: ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'] as Role[],
} as const;
