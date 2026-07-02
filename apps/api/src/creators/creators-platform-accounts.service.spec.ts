import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { CreatorsService } from './creators.service';

jest.mock('@kolab/auth', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorLead: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    creatorProfile: {
      findFirst: jest.fn(),
    },
    creatorPlatformAccount: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;

      constructor(message: string, code: string) {
        super(message);
        this.code = code;
      }
    },
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
  OrganizationRole: { CREATOR: 'CREATOR' },
  Role: { USER: 'USER' },
}));

import type { AccessTokenPayload } from '@kolab/auth';
import { prisma } from '@kolab/database';

const managerToken: AccessTokenPayload = {
  sub: 'manager-1',
  email: 'manager@kolab.test',
  role: 'ADMIN',
  organizationId: 'org-1',
  organizationRole: 'AGENCY_MANAGER',
  sessionId: 'session-1',
  isSystemAdmin: false,
};

const otherOrgToken: AccessTokenPayload = {
  ...managerToken,
  sub: 'manager-2',
  organizationId: 'org-2',
};

const baseCreatorProfile = {
  id: 'creator-1',
  organizationId: 'org-1',
  userId: 'user-1',
  sourceLeadId: 'lead-1',
  displayName: 'Jane Creator',
  bio: null,
  country: 'US',
  languages: ['en'],
  availability: {},
  metadata: {},
  status: 'ACTIVE',
  recruiterUserId: 'recruiter-1',
  createdAt: new Date('2026-06-28T12:00:00.000Z'),
  updatedAt: new Date('2026-06-28T12:00:00.000Z'),
  platformAccounts: [],
  sourceLead: null,
};

const basePlatformAccount = {
  id: 'creator-platform-1',
  organizationId: 'org-1',
  creatorProfileId: 'creator-1',
  platform: 'TIKTOK',
  username: 'janecreates',
  profileUrl: 'https://www.tiktok.com/@janecreates',
  followers: 125000,
  verified: false,
  status: 'ACTIVE',
  metadata: { sourceLeadPlatformAccountId: 'platform-1' },
  createdAt: new Date('2026-06-28T12:00:00.000Z'),
  updatedAt: new Date('2026-06-28T12:00:00.000Z'),
};

describe('CreatorsService platform accounts API', () => {
  let service: CreatorsService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CreatorsService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(CreatorsService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(baseCreatorProfile);
  });

  describe('listCreatorPlatformAccounts', () => {
    it('lists platform accounts for a creator', async () => {
      (prisma.creatorPlatformAccount.findMany as jest.Mock).mockResolvedValue([
        basePlatformAccount,
      ]);

      const result = await service.listCreatorPlatformAccounts(managerToken, 'creator-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.username).toBe('janecreates');
      expect(prisma.creatorPlatformAccount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: 'org-1',
            creatorProfileId: 'creator-1',
          },
        }),
      );
    });

    it('enforces organization isolation', async () => {
      (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.listCreatorPlatformAccounts(otherOrgToken, 'creator-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createCreatorPlatformAccount', () => {
    it('creates a platform account and records audit', async () => {
      (prisma.creatorPlatformAccount.create as jest.Mock).mockResolvedValue({
        ...basePlatformAccount,
        id: 'creator-platform-2',
        platform: 'INSTAGRAM',
        username: 'janecreates_ig',
        metadata: {},
      });

      const result = await service.createCreatorPlatformAccount(managerToken, 'creator-1', {
        platform: 'INSTAGRAM',
        username: 'janecreates_ig',
        followers: 50000,
      });

      expect(result.platform).toBe('INSTAGRAM');
      expect(result.username).toBe('janecreates_ig');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.CREATOR_PLATFORM_ACCOUNT_CREATED,
          targetType: AUDIT_TARGET_TYPE.CREATOR_PLATFORM_ACCOUNT,
        }),
      );
    });

    it('rejects duplicate platform + username in organization', async () => {
      (prisma.creatorPlatformAccount.create as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      );

      await expect(
        service.createCreatorPlatformAccount(managerToken, 'creator-1', {
          platform: 'TIKTOK',
          username: 'janecreates',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateCreatorPlatformAccount', () => {
    beforeEach(() => {
      (prisma.creatorPlatformAccount.findFirst as jest.Mock).mockResolvedValue(basePlatformAccount);
    });

    it('updates a platform account and records audit', async () => {
      (prisma.creatorPlatformAccount.update as jest.Mock).mockResolvedValue({
        ...basePlatformAccount,
        followers: 150000,
        verified: true,
      });

      const result = await service.updateCreatorPlatformAccount(
        managerToken,
        'creator-1',
        'creator-platform-1',
        {
          followers: 150000,
          verified: true,
        },
      );

      expect(result.followers).toBe(150000);
      expect(result.verified).toBe(true);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.CREATOR_PLATFORM_ACCOUNT_UPDATED,
          targetType: AUDIT_TARGET_TYPE.CREATOR_PLATFORM_ACCOUNT,
          targetId: 'creator-platform-1',
        }),
      );
    });

    it('rejects platform account not linked to creator', async () => {
      (prisma.creatorPlatformAccount.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateCreatorPlatformAccount(managerToken, 'creator-1', 'other-account', {
          verified: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCreatorPlatformAccount', () => {
    it('soft-removes an active platform account and records audit', async () => {
      (prisma.creatorPlatformAccount.findFirst as jest.Mock).mockResolvedValue(basePlatformAccount);
      (prisma.creatorPlatformAccount.update as jest.Mock).mockResolvedValue({
        ...basePlatformAccount,
        status: 'REMOVED',
      });

      const result = await service.deleteCreatorPlatformAccount(
        managerToken,
        'creator-1',
        'creator-platform-1',
      );

      expect(result.status).toBe('REMOVED');
      expect(prisma.creatorPlatformAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'creator-platform-1' },
          data: { status: 'REMOVED' },
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.CREATOR_PLATFORM_ACCOUNT_DELETED,
          targetType: AUDIT_TARGET_TYPE.CREATOR_PLATFORM_ACCOUNT,
          targetId: 'creator-platform-1',
        }),
      );
    });

    it('returns already removed account without updating', async () => {
      (prisma.creatorPlatformAccount.findFirst as jest.Mock).mockResolvedValue({
        ...basePlatformAccount,
        status: 'REMOVED',
      });

      const result = await service.deleteCreatorPlatformAccount(
        managerToken,
        'creator-1',
        'creator-platform-1',
      );

      expect(result.status).toBe('REMOVED');
      expect(prisma.creatorPlatformAccount.update).not.toHaveBeenCalled();
    });

    it('rejects users without active organization membership', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deleteCreatorPlatformAccount(otherOrgToken, 'creator-1', 'creator-platform-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
