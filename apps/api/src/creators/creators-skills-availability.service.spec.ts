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
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    creatorProfile: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
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

const baseCreatorProfile = {
  id: 'creator-1',
  organizationId: 'org-1',
  userId: 'user-1',
  sourceLeadId: 'lead-1',
  displayName: 'Jane Creator',
  bio: null,
  country: 'US',
  languages: ['en'],
  availability: {
    timezone: 'America/New_York',
    weeklySchedule: [{ weekday: 1, start: '09:00', end: '17:00' }],
    preferredLiveTimes: ['18:00-21:00'],
    blackoutDates: ['2026-07-04'],
    notes: null,
  },
  metadata: {
    skills: {
      categories: ['beauty'],
      skills: ['makeup'],
      contentTypes: ['live'],
      languages: ['en'],
      experienceLevel: 'ADVANCED',
      notes: 'Specializes in live commerce',
    },
  },
  status: 'ACTIVE',
  recruiterUserId: 'recruiter-1',
  createdAt: new Date('2026-06-28T12:00:00.000Z'),
  updatedAt: new Date('2026-06-28T12:00:00.000Z'),
  platformAccounts: [],
  sourceLead: null,
};

describe('CreatorsService skills and availability API', () => {
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
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
      callback({
        creatorProfile: {
          update: jest.fn().mockResolvedValue(baseCreatorProfile),
        },
        creatorLead: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'lead-1',
            metadata: {
              creatorProfile: {
                id: 'creator-1',
                userId: 'user-1',
                sourceLeadId: 'lead-1',
                displayName: 'Jane Creator',
                email: 'jane@example.com',
                phone: null,
                country: 'US',
                languages: ['en'],
                assignedRecruiterId: 'recruiter-1',
                commissionPlan: 'STANDARD',
                createdAt: '2026-06-28T12:00:00.000Z',
                updatedAt: '2026-06-28T12:00:00.000Z',
              },
            },
          }),
          update: jest.fn().mockResolvedValue({}),
        },
      }),
    );
  });

  describe('getCreatorSkills', () => {
    it('returns structured skills from profile metadata', async () => {
      const result = await service.getCreatorSkills(managerToken, 'creator-1');

      expect(result.categories).toEqual(['beauty']);
      expect(result.skills).toEqual(['makeup']);
      expect(result.experienceLevel).toBe('ADVANCED');
      expect(result.languages).toEqual(['en']);
    });

    it('enforces organization isolation', async () => {
      (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getCreatorSkills(otherOrgToken, 'creator-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCreatorSkills', () => {
    it('updates skills metadata and records audit', async () => {
      const result = await service.updateCreatorSkills(managerToken, 'creator-1', {
        categories: ['beauty', 'fashion'],
        skills: ['makeup', 'styling'],
      });

      expect(result.categories).toEqual(['beauty', 'fashion']);
      expect(result.skills).toEqual(['makeup', 'styling']);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.CREATOR_SKILLS_UPDATED,
          targetType: AUDIT_TARGET_TYPE.CREATOR,
          targetId: 'creator-1',
        }),
      );
    });

    it('rejects users without active organization membership', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateCreatorSkills(otherOrgToken, 'creator-1', {
          skills: ['makeup'],
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getCreatorAvailability', () => {
    it('returns structured availability from profile', async () => {
      const result = await service.getCreatorAvailability(managerToken, 'creator-1');

      expect(result.timezone).toBe('America/New_York');
      expect(result.weeklySchedule).toHaveLength(1);
      expect(result.preferredLiveTimes).toEqual(['18:00-21:00']);
      expect(result.blackoutDates).toEqual(['2026-07-04']);
    });
  });

  describe('updateCreatorAvailability', () => {
    it('updates availability and records audit', async () => {
      const result = await service.updateCreatorAvailability(managerToken, 'creator-1', {
        timezone: 'America/Los_Angeles',
        notes: 'Available for evening live streams',
      });

      expect(result.timezone).toBe('America/Los_Angeles');
      expect(result.notes).toBe('Available for evening live streams');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.CREATOR_AVAILABILITY_UPDATED,
          targetType: AUDIT_TARGET_TYPE.CREATOR,
          targetId: 'creator-1',
        }),
      );
    });
  });
});
