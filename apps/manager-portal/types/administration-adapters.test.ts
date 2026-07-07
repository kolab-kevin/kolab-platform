import { describe, expect, it } from 'vitest';

import {
  buildAuditCenter,
  buildOrganizationProfile,
  buildUserManagement,
} from '@/types/administration-adapters';

describe('administration adapters', () => {
  it('builds organization profile from agency and member inputs', () => {
    const profile = buildOrganizationProfile({
      organization: {
        id: 'org_1',
        name: 'Test Agency',
        slug: 'test-agency',
        type: 'AGENCY',
        status: 'ACTIVE',
        settings: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      agencyProfile: {
        description: null,
        logoUrl: null,
        website: null,
        primaryContact: 'Alex Morgan',
        phone: '+1 555 0100',
        country: 'US',
        timezone: 'America/Los_Angeles',
        supportedLanguages: ['en'],
        socialLinks: {},
        businessSettings: {},
      },
      members: [
        {
          organizationId: 'org_1',
          userId: 'user_1',
          role: 'ORG_ADMIN',
          status: 'ACTIVE',
          joinedAt: new Date().toISOString(),
          email: 'admin@example.com',
          displayName: 'Admin User',
        },
      ],
      invitations: [],
    });

    expect(profile.name).toBe('Test Agency');
    expect(profile.timezone).toBe('America/Los_Angeles');
    expect(profile.statistics.length).toBeGreaterThan(0);
  });

  it('maps members and invitations for user management', () => {
    const userManagement = buildUserManagement({
      members: [
        {
          organizationId: 'org_1',
          userId: 'user_1',
          role: 'RECRUITER',
          status: 'ACTIVE',
          joinedAt: new Date().toISOString(),
          email: 'recruiter@example.com',
          displayName: 'Recruiter One',
        },
      ],
      invitations: [
        {
          id: 'invite_1',
          organizationId: 'org_1',
          email: 'pending@example.com',
          role: 'AGENCY_MANAGER',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          acceptedAt: null,
          invitedBy: 'user_1',
        },
      ],
    });

    expect(userManagement.users).toHaveLength(1);
    expect(userManagement.invitations).toHaveLength(1);
    expect(userManagement.users[0]?.role).toContain('Recruiter');
  });

  it('groups audit entries by category', () => {
    const auditCenter = buildAuditCenter([
      {
        id: 'audit_1',
        organizationId: 'org_1',
        actorUserId: 'user_1',
        action: 'member.invited',
        targetType: 'invitation',
        targetId: 'invite_1',
        metadata: {},
        createdAt: new Date().toISOString(),
      },
      {
        id: 'audit_2',
        organizationId: 'org_1',
        actorUserId: null,
        action: 'session.revoked',
        targetType: 'session',
        targetId: 'session_1',
        metadata: {},
        createdAt: new Date().toISOString(),
      },
    ]);

    expect(auditCenter.auditLog).toHaveLength(2);
    expect(auditCenter.recentAdminActions.length).toBeGreaterThan(0);
    expect(auditCenter.securityEvents.length).toBeGreaterThan(0);
  });
});
