import type { AccessTokenPayload } from '@kolab/auth';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { OrganizationService } from './organization.service';

const mockSignAccessToken = jest.fn();

jest.mock('@kolab/auth', () => ({
  signAccessToken: (...args: unknown[]) => mockSignAccessToken(...args),
  parseDurationToMs: () => 604800000,
}));

jest.mock('@kolab/database', () => ({
  prisma: {
    organization: {
      findUnique: jest.fn(),
    },
    organizationMembership: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    session: {
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
  OrganizationRole: {
    ORG_OWNER: 'ORG_OWNER',
    ORG_ADMIN: 'ORG_ADMIN',
    VIEWER: 'VIEWER',
    RECRUITER: 'RECRUITER',
  },
}));

jest.mock('@kolab/config', () => ({
  apiEnvSchema: {},
  parseEnv: () => ({
    JWT_SECRET: 'test-secret-key-minimum-32-characters-long',
    JWT_ACCESS_EXPIRY: '15m',
  }),
}));

import { prisma } from '@kolab/database';

const organization = {
  id: 'org-1',
  name: 'KOLAB Dev',
  slug: 'kolab-dev',
  type: 'STANDARD',
  status: 'ACTIVE',
  settings: {},
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

const membership = {
  organizationId: 'org-1',
  userId: 'user-1',
  role: 'ORG_ADMIN',
  status: 'ACTIVE',
  invitedBy: null,
  joinedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const userToken: AccessTokenPayload = {
  sub: 'user-1',
  email: 'admin@kolab.test',
  role: 'ADMIN',
  organizationId: 'org-1',
  organizationRole: 'ORG_ADMIN',
  sessionId: 'session-1',
  isSystemAdmin: false,
};

describe('OrganizationService', () => {
  let service: OrganizationService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(OrganizationService);
    jest.clearAllMocks();
    mockSignAccessToken.mockReturnValue({ token: 'new-access-token', expiresIn: 900 });
  });

  describe('getCurrentOrganization', () => {
    it('returns the active organization from JWT context', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(membership);
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(organization);

      const result = await service.getCurrentOrganization(userToken);

      expect(result.organization.id).toBe('org-1');
      expect(result.membership.role).toBe('ORG_ADMIN');
    });

    it('requires organization context in JWT', async () => {
      await expect(
        service.getCurrentOrganization({ ...userToken, organizationId: undefined }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listOrganizations', () => {
    it('returns all organizations for the user', async () => {
      (prisma.organizationMembership.findMany as jest.Mock).mockResolvedValue([
        { ...membership, organization },
        {
          ...membership,
          organizationId: 'org-2',
          role: 'VIEWER',
          organization: { ...organization, id: 'org-2', name: 'Other Org', slug: 'other-org' },
        },
      ]);

      const result = await service.listOrganizations('user-1');

      expect(result.organizations).toHaveLength(2);
      expect(result.organizations[1]?.organization.slug).toBe('other-org');
    });
  });

  describe('switchOrganization', () => {
    it('switches organization and issues a refreshed access token', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(membership);
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(organization);
      (prisma.session.update as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'admin@kolab.test',
        role: 'ADMIN',
        isSystemAdmin: false,
      });

      const result = await service.switchOrganization(userToken, 'org-1');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.organization.id).toBe('org-1');
      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-1' },
          data: { organizationId: 'org-1' },
        }),
      );
      expect(mockSignAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          organizationRole: 'ORG_ADMIN',
          sessionId: 'session-1',
        }),
        expect.any(Object),
      );
    });

    it('rejects switching to an organization without active membership', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.switchOrganization(userToken, 'org-999')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('listMembers', () => {
    it('returns members for the active organization', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(membership);
      (prisma.organizationMembership.findMany as jest.Mock).mockResolvedValue([
        {
          ...membership,
          user: {
            email: 'admin@kolab.test',
            profile: { displayName: 'Dev Admin' },
          },
        },
      ]);

      const result = await service.listMembers(userToken);

      expect(result.members).toHaveLength(1);
      expect(result.members[0]?.email).toBe('admin@kolab.test');
    });
  });

  describe('updateMember', () => {
    it('updates a member role', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
        ...membership,
        userId: 'user-2',
        role: 'VIEWER',
        user: { email: 'user@kolab.test', profile: { displayName: 'Dev User' } },
      });
      (prisma.organizationMembership.update as jest.Mock).mockResolvedValue({
        ...membership,
        userId: 'user-2',
        role: 'RECRUITER',
        user: { email: 'user@kolab.test', profile: { displayName: 'Dev User' } },
      });

      const result = await service.updateMember(userToken, 'user-2', { role: 'RECRUITER' });

      expect(result.member.role).toBe('RECRUITER');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'membership.updated',
          targetType: 'membership',
          targetId: 'user-2',
        }),
      );
    });

    it('throws when member is not found', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock)
        .mockResolvedValueOnce(membership)
        .mockResolvedValueOnce(null);

      await expect(
        service.updateMember(userToken, 'missing-user', { role: 'VIEWER' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('prevents non-owners from assigning ORG_OWNER', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
        ...membership,
        userId: 'user-2',
        role: 'VIEWER',
        user: { email: 'user@kolab.test', profile: null },
      });

      await expect(
        service.updateMember({ ...userToken, organizationRole: 'ORG_ADMIN' }, 'user-2', {
          role: 'ORG_OWNER',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
