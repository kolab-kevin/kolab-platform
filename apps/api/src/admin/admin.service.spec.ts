import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AdminService } from './admin.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    organization: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    invitation: {
      count: jest.fn(),
    },
    session: {
      count: jest.fn(),
    },
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
}));

import type { AccessTokenPayload } from '@kolab/auth';
import { prisma } from '@kolab/database';

const adminToken: AccessTokenPayload = {
  sub: 'admin-1',
  email: 'admin@kolab.test',
  role: 'SUPER_ADMIN',
  organizationId: 'org-1',
  organizationRole: 'ORG_OWNER',
  sessionId: 'session-1',
  isSystemAdmin: true,
};

const listUser = {
  id: 'user-1',
  email: 'user@kolab.test',
  passwordHash: 'secret-hash',
  role: 'USER',
  platforms: [],
  isSystemAdmin: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  profile: { displayName: 'Dev User' },
  _count: {
    memberships: 2,
    sessions: 1,
  },
};

describe('AdminService', () => {
  let service: AdminService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(AdminService);
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('returns paginated users without sensitive fields', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([listUser]);

      const result = await service.listUsers({ limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: 'user-1',
        email: 'user@kolab.test',
        role: 'USER',
        isSystemAdmin: false,
        createdAt: listUser.createdAt.toISOString(),
        organizationCount: 2,
        activeSessionCount: 1,
      });
      expect(JSON.stringify(result)).not.toContain('passwordHash');
    });

    it('supports search and cursor pagination', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { ...listUser, id: 'user-2' },
        listUser,
      ]);

      const result = await service.listUsers({
        limit: 1,
        search: 'dev',
        role: 'USER',
        organizationId: 'org-1',
        cursor: 'cursor-user',
      });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBe('user-2');
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'USER',
            memberships: { some: { organizationId: 'org-1' } },
            OR: expect.any(Array),
          }),
          cursor: { id: 'cursor-user' },
          skip: 1,
          take: 2,
        }),
      );
    });
  });

  describe('getUser', () => {
    it('returns user detail with profile, memberships, and active sessions', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...listUser,
        profile: {
          userId: 'user-1',
          displayName: 'Dev User',
          avatarUrl: null,
          bio: null,
          language: 'en',
          timezone: 'UTC',
          country: null,
        },
        memberships: [
          {
            organizationId: 'org-1',
            userId: 'user-1',
            role: 'VIEWER',
            status: 'ACTIVE',
            joinedAt: new Date('2026-01-01T00:00:00.000Z'),
            organization: {
              id: 'org-1',
              name: 'KOLAB Dev',
              slug: 'kolab-dev',
            },
          },
        ],
        sessions: [
          {
            id: 'session-1',
            organizationId: 'org-1',
            ipAddress: '127.0.0.1',
            userAgent: 'jest',
            expiresAt: new Date(Date.now() + 86_400_000),
            revokedAt: null,
            refreshTokenHash: 'secret-hash',
          },
        ],
      });

      const result = await service.getUser('user-1');

      expect(result.user.email).toBe('user@kolab.test');
      expect(result.memberships).toHaveLength(1);
      expect(result.sessions).toHaveLength(1);
      expect(JSON.stringify(result)).not.toContain('passwordHash');
      expect(JSON.stringify(result)).not.toContain('refreshTokenHash');
    });

    it('throws when user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getUser('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('updates role and records audit event', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(listUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...listUser,
        role: 'ADMIN',
      });

      const result = await service.updateUser(adminToken, 'user-1', { role: 'ADMIN' });

      expect(result.user.role).toBe('ADMIN');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'admin.user.updated',
          targetType: 'user',
          targetId: 'user-1',
          organizationId: null,
        }),
      );
    });

    it('updates system admin flag and records audit event', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(listUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...listUser,
        isSystemAdmin: true,
      });

      const result = await service.updateUser(adminToken, 'user-1', { isSystemAdmin: true });

      expect(result.user.isSystemAdmin).toBe(true);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            previousIsSystemAdmin: false,
            newIsSystemAdmin: true,
          }),
        }),
      );
    });
  });

  describe('listOrganizations', () => {
    it('returns paginated organizations with member counts', async () => {
      (prisma.organization.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'org-1',
          name: 'KOLAB Dev',
          slug: 'kolab-dev',
          type: 'STANDARD',
          status: 'ACTIVE',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          _count: { memberships: 3 },
        },
      ]);

      const result = await service.listOrganizations({ limit: 20 });

      expect(result.items[0]?.memberCount).toBe(3);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe('getDashboard', () => {
    it('returns platform statistics', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValueOnce(10).mockResolvedValueOnce(2);
      (prisma.organization.count as jest.Mock).mockResolvedValueOnce(4).mockResolvedValueOnce(3);
      (prisma.invitation.count as jest.Mock).mockResolvedValue(5);
      (prisma.session.count as jest.Mock).mockResolvedValue(7);

      const result = await service.getDashboard();

      expect(result).toEqual({
        totalUsers: 10,
        totalOrganizations: 4,
        activeOrganizations: 3,
        pendingInvitations: 5,
        activeSessions: 7,
        systemAdmins: 2,
      });
    });
  });
});
