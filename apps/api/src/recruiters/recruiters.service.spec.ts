import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { RecruitersService } from './recruiters.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    recruiterProfile: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;

      constructor(message: string, options: { code: string; clientVersion: string }) {
        super(message);
        this.code = options.code;
      }
    },
  },
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

const recruiterToken: AccessTokenPayload = {
  ...managerToken,
  sub: 'recruiter-1',
  email: 'recruiter@kolab.test',
  organizationRole: 'RECRUITER',
};

const viewerToken: AccessTokenPayload = {
  ...managerToken,
  sub: 'viewer-1',
  email: 'viewer@kolab.test',
  organizationRole: 'VIEWER',
};

const baseProfile = {
  id: 'profile-1',
  organizationId: 'org-1',
  userId: 'recruiter-2',
  displayName: 'Alex Recruiter',
  nickname: 'alexrecruits',
  territory: 'West',
  languages: ['en'],
  hireDate: new Date('2026-01-15T00:00:00.000Z'),
  commissionPlan: 'STANDARD',
  monthlyLeadGoal: 20,
  monthlyCreatorGoal: 5,
  availability: { timezone: 'America/Los_Angeles' },
  managerUserId: 'manager-1',
  status: 'ACTIVE',
  metadata: {},
  createdAt: new Date('2026-06-01T08:00:00.000Z'),
  updatedAt: new Date('2026-06-01T08:00:00.000Z'),
};

describe('RecruitersService', () => {
  let service: RecruitersService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RecruitersService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(RecruitersService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockImplementation(({ where }) => {
      const userId = where.organizationId_userId.userId;

      if (userId === managerToken.sub) {
        return Promise.resolve({ status: 'ACTIVE', role: 'AGENCY_MANAGER' });
      }

      if (userId === recruiterToken.sub) {
        return Promise.resolve({ status: 'ACTIVE', role: 'RECRUITER' });
      }

      if (userId === viewerToken.sub) {
        return Promise.resolve({ status: 'ACTIVE', role: 'VIEWER' });
      }

      if (userId === 'recruiter-2') {
        return Promise.resolve({ status: 'ACTIVE', role: 'RECRUITER' });
      }

      if (userId === 'suspended-user') {
        return Promise.resolve({ status: 'SUSPENDED', role: 'RECRUITER' });
      }

      return Promise.resolve(null);
    });
  });

  describe('listRecruiters', () => {
    it('lists recruiter profiles for the organization', async () => {
      (prisma.recruiterProfile.findMany as jest.Mock).mockResolvedValue([baseProfile]);

      const result = await service.listRecruiters(managerToken, { limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.displayName).toBe('Alex Recruiter');
      expect(prisma.recruiterProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org-1' }),
        }),
      );
    });
  });

  describe('getRecruiter', () => {
    it('returns recruiter profile detail without user private fields', async () => {
      (prisma.recruiterProfile.findFirst as jest.Mock).mockResolvedValue(baseProfile);

      const result = await service.getRecruiter(managerToken, 'profile-1');

      expect(result.id).toBe('profile-1');
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('returns 404 for missing profile', async () => {
      (prisma.recruiterProfile.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getRecruiter(managerToken, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createRecruiterProfile', () => {
    it('creates a recruiter profile and records audit', async () => {
      (prisma.recruiterProfile.create as jest.Mock).mockResolvedValue(baseProfile);

      const result = await service.createRecruiterProfile(managerToken, {
        userId: 'recruiter-2',
        displayName: 'Alex Recruiter',
        managerUserId: 'manager-1',
      });

      expect(result.userId).toBe('recruiter-2');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.RECRUITER_CREATED,
          targetType: AUDIT_TARGET_TYPE.RECRUITER,
        }),
      );
    });

    it('rejects duplicate profiles', async () => {
      (prisma.recruiterProfile.create as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      );

      await expect(
        service.createRecruiterProfile(managerToken, { userId: 'recruiter-2' }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects non-members', async () => {
      await expect(
        service.createRecruiterProfile(managerToken, { userId: 'missing-user' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects suspended members', async () => {
      await expect(
        service.createRecruiterProfile(managerToken, { userId: 'suspended-user' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects viewers as profile subjects', async () => {
      await expect(
        service.createRecruiterProfile(managerToken, { userId: viewerToken.sub }),
      ).rejects.toThrow(BadRequestException);
    });

    it('validates manager membership', async () => {
      await expect(
        service.createRecruiterProfile(managerToken, {
          userId: 'recruiter-2',
          managerUserId: 'missing-user',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('denies recruiters from creating profiles', async () => {
      await expect(
        service.createRecruiterProfile(recruiterToken, { userId: 'recruiter-2' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateRecruiterProfile', () => {
    it('updates a recruiter profile and records audit', async () => {
      (prisma.recruiterProfile.findFirst as jest.Mock).mockResolvedValue(baseProfile);
      (prisma.recruiterProfile.update as jest.Mock).mockResolvedValue({
        ...baseProfile,
        territory: 'East',
      });

      const result = await service.updateRecruiterProfile(managerToken, 'profile-1', {
        territory: 'East',
      });

      expect(result.territory).toBe('East');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.RECRUITER_UPDATED,
          targetType: AUDIT_TARGET_TYPE.RECRUITER,
        }),
      );
    });

    it('denies recruiters from updating profiles', async () => {
      await expect(
        service.updateRecruiterProfile(recruiterToken, 'profile-1', { territory: 'East' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
