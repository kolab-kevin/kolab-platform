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

  it('grants full CRM permissions to org owners, org admins, and agency managers', () => {
    for (const role of ['ORG_OWNER', 'ORG_ADMIN', 'AGENCY_MANAGER'] as const) {
      expect(organizationRoleHasPermission(role, 'crm:read')).toBe(true);
      expect(organizationRoleHasPermission(role, 'crm:create')).toBe(true);
      expect(organizationRoleHasPermission(role, 'crm:update')).toBe(true);
      expect(organizationRoleHasPermission(role, 'crm:delete')).toBe(true);
      expect(organizationRoleHasPermission(role, 'crm:assign')).toBe(true);
    }
  });

  it('grants recruiters CRM read/create/update/assign but not delete', () => {
    expect(organizationRoleHasPermission('RECRUITER', 'crm:read')).toBe(true);
    expect(organizationRoleHasPermission('RECRUITER', 'crm:create')).toBe(true);
    expect(organizationRoleHasPermission('RECRUITER', 'crm:update')).toBe(true);
    expect(organizationRoleHasPermission('RECRUITER', 'crm:assign')).toBe(true);
    expect(organizationRoleHasPermission('RECRUITER', 'crm:delete')).toBe(false);
  });

  it('grants support and moderators CRM read only', () => {
    for (const role of ['SUPPORT', 'MODERATOR'] as const) {
      expect(organizationRoleHasPermission(role, 'crm:read')).toBe(true);
      expect(organizationRoleHasPermission(role, 'crm:create')).toBe(false);
      expect(organizationRoleHasPermission(role, 'crm:delete')).toBe(false);
    }
  });

  it('denies CRM permissions to viewers, creators, and finance', () => {
    for (const role of ['VIEWER', 'CREATOR', 'FINANCE'] as const) {
      expect(organizationRoleHasPermission(role, 'crm:read')).toBe(false);
      expect(organizationRoleHasPermission(role, 'crm:create')).toBe(false);
      expect(organizationRoleHasPermission(role, 'crm:delete')).toBe(false);
    }
  });

  it('grants full document permissions to org owners, org admins, and agency managers', () => {
    for (const role of ['ORG_OWNER', 'ORG_ADMIN', 'AGENCY_MANAGER'] as const) {
      expect(organizationRoleHasPermission(role, 'documents:read')).toBe(true);
      expect(organizationRoleHasPermission(role, 'documents:write')).toBe(true);
      expect(organizationRoleHasPermission(role, 'documents:review')).toBe(true);
      expect(organizationRoleHasPermission(role, 'documents:download_sensitive')).toBe(true);
    }
  });

  it('grants recruiters document read and write but not review or sensitive download', () => {
    expect(organizationRoleHasPermission('RECRUITER', 'documents:read')).toBe(true);
    expect(organizationRoleHasPermission('RECRUITER', 'documents:write')).toBe(true);
    expect(organizationRoleHasPermission('RECRUITER', 'documents:review')).toBe(false);
    expect(organizationRoleHasPermission('RECRUITER', 'documents:download_sensitive')).toBe(false);
  });

  it('grants support and finance document read only', () => {
    for (const role of ['SUPPORT', 'FINANCE'] as const) {
      expect(organizationRoleHasPermission(role, 'documents:read')).toBe(true);
      expect(organizationRoleHasPermission(role, 'documents:write')).toBe(false);
      expect(organizationRoleHasPermission(role, 'documents:review')).toBe(false);
      expect(organizationRoleHasPermission(role, 'documents:download_sensitive')).toBe(false);
    }
  });

  it('denies document permissions to viewers, creators, and moderators', () => {
    for (const role of ['VIEWER', 'CREATOR', 'MODERATOR'] as const) {
      expect(organizationRoleHasPermission(role, 'documents:read')).toBe(false);
      expect(organizationRoleHasPermission(role, 'documents:write')).toBe(false);
      expect(organizationRoleHasPermission(role, 'documents:review')).toBe(false);
      expect(organizationRoleHasPermission(role, 'documents:download_sensitive')).toBe(false);
    }
  });
});
