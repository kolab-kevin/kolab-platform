import { describe, expect, it } from 'vitest';

import { hasAnyOrganizationRole, satisfiesLegacyRoles } from './organization-rbac';

describe('organization-rbac', () => {
  it('maps organization admin roles to legacy ADMIN checks', () => {
    expect(satisfiesLegacyRoles({ role: 'USER', organizationRole: 'ORG_ADMIN' }, ['ADMIN'])).toBe(
      true,
    );
    expect(satisfiesLegacyRoles({ role: 'USER', organizationRole: 'ORG_OWNER' }, ['ADMIN'])).toBe(
      true,
    );
  });

  it('preserves legacy role compatibility without organizationRole', () => {
    expect(satisfiesLegacyRoles({ role: 'MODERATOR' }, ['MODERATOR', 'ADMIN'])).toBe(true);
    expect(satisfiesLegacyRoles({ role: 'USER' }, ['ADMIN'])).toBe(false);
  });

  it('checks organization roles directly', () => {
    expect(hasAnyOrganizationRole('MODERATOR', ['MODERATOR', 'ORG_ADMIN'])).toBe(true);
    expect(hasAnyOrganizationRole('VIEWER', ['ORG_ADMIN'])).toBe(false);
  });

  it('maps recruiter organization role to USER legacy equivalent', () => {
    expect(satisfiesLegacyRoles({ role: 'USER', organizationRole: 'RECRUITER' }, ['USER'])).toBe(
      true,
    );
    expect(satisfiesLegacyRoles({ role: 'USER', organizationRole: 'RECRUITER' }, ['ADMIN'])).toBe(
      false,
    );
  });
});
