import { describe, expect, it } from 'vitest';

import type { AccessTokenPayload } from './jwt';
import {
  legacyRoleHasPermission,
  organizationRoleHasPermission,
  permissionsForOrganizationRole,
  resolveUserPermissions,
  userHasAllPermissions,
  userHasPermission,
} from './permissions';

describe('permissions', () => {
  it('grants full management permissions to ORG_OWNER and ORG_ADMIN', () => {
    for (const role of ['ORG_OWNER', 'ORG_ADMIN'] as const) {
      expect(organizationRoleHasPermission(role, 'members:invite')).toBe(true);
      expect(organizationRoleHasPermission(role, 'sessions:revoke')).toBe(true);
    }
  });

  it('grants recruiter invite permissions only', () => {
    expect(organizationRoleHasPermission('RECRUITER', 'members:invite')).toBe(true);
    expect(organizationRoleHasPermission('RECRUITER', 'members:update_role')).toBe(false);
  });

  it('denies viewer write permissions', () => {
    expect(organizationRoleHasPermission('VIEWER', 'org:read')).toBe(true);
    expect(organizationRoleHasPermission('VIEWER', 'org:update')).toBe(false);
    expect(organizationRoleHasPermission('VIEWER', 'members:invite')).toBe(false);
  });

  it('uses organizationRole from JWT when resolving permissions', () => {
    const permissions = resolveUserPermissions({
      role: 'USER',
      organizationRole: 'ORG_ADMIN',
    });

    expect(permissions).toEqual(permissionsForOrganizationRole('ORG_ADMIN'));
    expect(legacyRoleHasPermission('USER', 'members:invite')).toBe(false);
  });

  it('falls back to legacy role permissions when organizationRole is missing', () => {
    expect(resolveUserPermissions({ role: 'ADMIN' })).toContain('members:invite');
    expect(resolveUserPermissions({ role: 'USER' })).not.toContain('members:invite');
  });

  it('allows system administrator override for any permission', () => {
    const user: Pick<AccessTokenPayload, 'role' | 'organizationRole' | 'isSystemAdmin'> = {
      role: 'USER',
      organizationRole: 'VIEWER',
      isSystemAdmin: true,
    };

    expect(userHasPermission(user, 'members:remove')).toBe(true);
    expect(userHasAllPermissions(user, ['org:update', 'audit:read'])).toBe(true);
  });
});
