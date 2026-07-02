import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    creatorProfile: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    creatorPlatformAccount: {
      upsert: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    recruiterProfile: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
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

const creatorMetadata = {
  creatorProfile: {
    id: 'creator-1',
    userId: 'user-1',
    sourceLeadId: 'lead-1',
    displayName: 'Jane Creator',
    email: 'jane@example.com',
    phone: '+15551234567',
    country: 'US',
    languages: ['en'],
    assignedRecruiterId: 'recruiter-1',
    commissionPlan: 'STANDARD',
    bio: null,
    availability: {},
    metadata: {},
    createdAt: '2026-06-28T12:00:00.000Z',
    updatedAt: '2026-06-28T12:00:00.000Z',
  },
  creatorPlatformAccounts: [
    {
      id: 'creator-platform-1',
      organizationId: 'org-1',
      creatorId: 'creator-1',
      platform: 'TIKTOK',
      username: 'janecreates',
      profileUrl: null,
      followers: 125000,
      verified: false,
      status: 'ACTIVE',
      sourceLeadPlatformAccountId: 'platform-1',
      createdAt: '2026-06-28T12:00:00.000Z',
      updatedAt: '2026-06-28T12:00:00.000Z',
    },
  ],
};

const convertedLead = {
  id: 'lead-1',
  organizationId: 'org-1',
  name: 'Jane Creator',
  email: 'jane@example.com',
  phone: '+15551234567',
  country: 'US',
  languages: ['en'],
  status: 'ACTIVE_CREATOR',
  convertedUserId: 'user-1',
  convertedAt: new Date('2026-06-28T12:00:00.000Z'),
  assignedRecruiterId: 'recruiter-1',
  commissionPlan: 'STANDARD',
  metadata: creatorMetadata,
  platformAccounts: [],
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
  platformAccounts: [
    {
      id: 'creator-platform-1',
      organizationId: 'org-1',
      creatorProfileId: 'creator-1',
      platform: 'TIKTOK',
      username: 'janecreates',
      profileUrl: null,
      followers: 125000,
      verified: false,
      status: 'ACTIVE',
      metadata: { sourceLeadPlatformAccountId: 'platform-1' },
      createdAt: new Date('2026-06-28T12:00:00.000Z'),
      updatedAt: new Date('2026-06-28T12:00:00.000Z'),
    },
  ],
  sourceLead: convertedLead,
};

describe('CreatorsService management API', () => {
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
    (prisma.creatorLead.findMany as jest.Mock).mockResolvedValue([]);
  });

  describe('listCreators', () => {
    it('lists creators from CreatorProfile for the organization', async () => {
      (prisma.creatorProfile.findMany as jest.Mock).mockResolvedValue([baseCreatorProfile]);
      (prisma.organizationMembership.findMany as jest.Mock).mockResolvedValue([
        { userId: 'user-1', status: 'ACTIVE' },
      ]);

      const result = await service.listCreators(managerToken, { limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.id).toBe('creator-1');
      expect(result.items[0]?.platformCount).toBe(1);
      expect(prisma.creatorProfile.findMany).toHaveBeenCalled();
    });

    it('supports search and platform filters on CreatorProfile', async () => {
      (prisma.creatorProfile.findMany as jest.Mock).mockResolvedValue([baseCreatorProfile]);
      (prisma.organizationMembership.findMany as jest.Mock).mockResolvedValue([]);

      await service.listCreators(managerToken, {
        limit: 20,
        search: 'jane',
        platform: 'TIKTOK',
        recruiterId: 'recruiter-1',
        country: 'US',
        language: 'en',
      });

      expect(prisma.creatorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            recruiterUserId: 'recruiter-1',
            country: 'US',
            languages: { has: 'en' },
            platformAccounts: expect.objectContaining({
              some: expect.objectContaining({ platform: 'TIKTOK' }),
            }),
          }),
        }),
      );
    });

    it('returns empty list when status filter matches no memberships', async () => {
      (prisma.organizationMembership.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.listCreators(managerToken, {
        limit: 20,
        status: 'SUSPENDED',
      });

      expect(result.items).toEqual([]);
      expect(prisma.creatorProfile.findMany).not.toHaveBeenCalled();
    });

    it('paginates with creator profile id cursor', async () => {
      (prisma.creatorProfile.findMany as jest.Mock).mockResolvedValue([baseCreatorProfile]);
      (prisma.organizationMembership.findMany as jest.Mock).mockResolvedValue([]);

      await service.listCreators(managerToken, {
        limit: 1,
        cursor: 'creator-1',
      });

      expect(prisma.creatorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'creator-1' },
          skip: 1,
        }),
      );
    });
  });

  describe('getCreator', () => {
    beforeEach(() => {
      (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(baseCreatorProfile);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'jane@example.com',
      });
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue({
        displayName: 'Jane Creator',
        avatarUrl: null,
        bio: null,
      });
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: 'org-1',
        name: 'Kolab Agency',
        slug: 'kolab-agency',
        type: 'AGENCY',
        status: 'ACTIVE',
      });
      (prisma.recruiterProfile.findFirst as jest.Mock).mockResolvedValue({
        id: 'recruiter-profile-1',
        userId: 'recruiter-1',
        displayName: 'Recruiter One',
        nickname: 'rec1',
        territory: 'US',
        status: 'ACTIVE',
      });
      (prisma.organizationMembership.findUnique as jest.Mock).mockImplementation(
        async ({ where }: { where: { organizationId_userId: { userId: string } } }) => {
          if (where.organizationId_userId.userId === 'user-1') {
            return { status: 'ACTIVE' };
          }

          return { status: 'ACTIVE' };
        },
      );
    });

    it('returns creator detail with platform accounts from CreatorPlatformAccount', async () => {
      const result = await service.getCreator(managerToken, 'creator-1');

      expect(result.creator.id).toBe('creator-1');
      expect(result.user.email).toBe('jane@example.com');
      expect(result.recruiter?.id).toBe('recruiter-profile-1');
      expect(result.organization.name).toBe('Kolab Agency');
      expect(result.platformAccounts).toHaveLength(1);
      expect(result.platformAccounts[0]?.username).toBe('janecreates');
    });

    it('lazy backfills metadata-only converted leads on read', async () => {
      (prisma.creatorProfile.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(baseCreatorProfile);
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(convertedLead);
      (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          creatorProfile: {
            upsert: jest.fn().mockResolvedValue(baseCreatorProfile),
          },
          creatorPlatformAccount: {
            upsert: jest.fn().mockResolvedValue({}),
          },
        }),
      );

      const result = await service.getCreator(managerToken, 'creator-1');

      expect(result.creator.id).toBe('creator-1');
      expect(prisma.creatorLead.findFirst).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('enforces organization isolation', async () => {
      (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getCreator(otherOrgToken, 'creator-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns not found for invalid creator id', async () => {
      (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getCreator(managerToken, 'missing-creator')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCreator', () => {
    const updatedCreatorProfile = {
      ...baseCreatorProfile,
      displayName: 'Jane Updated',
      bio: 'Live commerce creator',
      updatedAt: new Date('2026-06-29T12:00:00.000Z'),
    };

    beforeEach(() => {
      (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(baseCreatorProfile);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          creatorProfile: {
            update: jest.fn().mockResolvedValue(updatedCreatorProfile),
          },
          creatorLead: {
            findUnique: jest.fn().mockResolvedValue(convertedLead),
            update: jest.fn().mockResolvedValue(convertedLead),
          },
          userProfile: {
            upsert: jest.fn().mockResolvedValue({}),
          },
        }),
      );
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'jane@example.com',
      });
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue({
        displayName: 'Jane Updated',
        avatarUrl: null,
        bio: 'Live commerce creator',
      });
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: 'org-1',
        name: 'Kolab Agency',
        slug: 'kolab-agency',
        type: 'AGENCY',
        status: 'ACTIVE',
      });
      (prisma.recruiterProfile.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
        status: 'ACTIVE',
      });
    });

    it('updates CreatorProfile and records audit', async () => {
      (prisma.creatorProfile.findFirst as jest.Mock)
        .mockResolvedValueOnce(baseCreatorProfile)
        .mockResolvedValueOnce(updatedCreatorProfile);

      const result = await service.updateCreator(managerToken, 'creator-1', {
        displayName: 'Jane Updated',
        bio: 'Live commerce creator',
      });

      expect(result.creator.displayName).toBe('Jane Updated');
      expect(result.creator.bio).toBe('Live commerce creator');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.CREATOR_UPDATED,
          targetType: AUDIT_TARGET_TYPE.CREATOR,
          targetId: 'creator-1',
        }),
      );
    });

    it('rejects invalid creator id', async () => {
      (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateCreator(managerToken, 'missing-creator', {
          displayName: 'Jane Updated',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects users without active organization membership', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateCreator(otherOrgToken, 'creator-1', {
          displayName: 'Jane Updated',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
