import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userProfile: {
      upsert: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    leadStatusHistory: {
      create: jest.fn(),
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

const viewerToken: AccessTokenPayload = {
  ...managerToken,
  sub: 'viewer-1',
  organizationRole: 'VIEWER',
};

const otherOrgToken: AccessTokenPayload = {
  ...managerToken,
  sub: 'manager-2',
  organizationId: 'org-2',
};

const leadPlatformAccount = {
  id: 'platform-1',
  organizationId: 'org-1',
  leadId: 'lead-1',
  platform: 'TIKTOK',
  username: 'janecreates',
  profileUrl: 'https://www.tiktok.com/@janecreates',
  followers: 125000,
  verified: false,
  status: 'ACTIVE',
  metadata: {},
  createdAt: new Date('2026-06-20T08:00:00.000Z'),
  updatedAt: new Date('2026-06-20T08:00:00.000Z'),
};

const baseLead = {
  id: 'lead-1',
  organizationId: 'org-1',
  name: 'Jane Creator',
  nickname: 'janecreates',
  email: 'jane@example.com',
  phone: '+15551234567',
  country: 'US',
  languages: ['en'],
  source: 'MANUAL',
  status: 'SIGNED',
  score: 50,
  assignedRecruiterId: 'recruiter-1',
  assignedAt: new Date('2026-06-21T08:00:00.000Z'),
  nextFollowUpAt: null,
  commissionPlan: 'STANDARD',
  convertedUserId: null,
  convertedAt: null,
  notesSummary: null,
  metadata: {},
  createdAt: new Date('2026-06-20T08:00:00.000Z'),
  updatedAt: new Date('2026-06-20T08:00:00.000Z'),
  platformAccounts: [leadPlatformAccount],
};

describe('CreatorsService', () => {
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
    (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(baseLead);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'jane@example.com',
    });
  });

  describe('convertLeadFromRecruitment', () => {
    beforeEach(() => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          userProfile: { upsert: jest.fn().mockResolvedValue({}) },
          organizationMembership: { upsert: jest.fn().mockResolvedValue({}) },
          creatorLead: {
            update: jest.fn().mockResolvedValue({
              ...baseLead,
              status: 'ACTIVE_CREATOR',
              convertedUserId: 'user-1',
              convertedAt: new Date('2026-06-28T12:00:00.000Z'),
              metadata: {
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
                    profileUrl: 'https://www.tiktok.com/@janecreates',
                    followers: 125000,
                    verified: false,
                    status: 'ACTIVE',
                    sourceLeadPlatformAccountId: 'platform-1',
                    createdAt: '2026-06-28T12:00:00.000Z',
                    updatedAt: '2026-06-28T12:00:00.000Z',
                  },
                ],
                conversionHistory: [
                  {
                    convertedAt: '2026-06-28T12:00:00.000Z',
                    convertedBy: 'manager-1',
                    creatorId: 'creator-1',
                    userId: 'user-1',
                  },
                ],
              },
            }),
          },
          leadStatusHistory: { create: jest.fn().mockResolvedValue({}) },
        }),
      );
    });

    it('converts a signed lead successfully', async () => {
      const result = await service.convertLeadFromRecruitment(managerToken, 'lead-1');

      expect(result.alreadyConverted).toBe(false);
      expect(result.lead.status).toBe('ACTIVE_CREATOR');
      expect(result.lead.convertedUserId).toBe('user-1');
      expect(result.creator.platformAccounts).toHaveLength(1);
      expect(result.creator.platformAccounts[0]?.username).toBe('janecreates');
    });

    it('returns existing creator on idempotent conversion', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue({
        ...baseLead,
        status: 'ACTIVE_CREATOR',
        convertedUserId: 'user-1',
        convertedAt: new Date('2026-06-28T12:00:00.000Z'),
        metadata: {
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
        },
      });

      const result = await service.convertLeadFromRecruitment(managerToken, 'lead-1');

      expect(result.alreadyConverted).toBe(true);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('rejects invalid lead status', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue({
        ...baseLead,
        status: 'NEW',
      });

      await expect(service.convertLeadFromRecruitment(managerToken, 'lead-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects deleted leads', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.convertLeadFromRecruitment(managerToken, 'lead-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('enforces organization isolation', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.convertLeadFromRecruitment(otherOrgToken, 'lead-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('records creator.created and lead.converted audit events', async () => {
      await service.convertLeadFromRecruitment(managerToken, 'lead-1');

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.CREATOR_CREATED,
          targetType: AUDIT_TARGET_TYPE.CREATOR,
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.LEAD_CONVERTED,
          targetType: AUDIT_TARGET_TYPE.LEAD,
          targetId: 'lead-1',
        }),
      );
    });

    it('copies lead platform accounts into creator platform accounts', async () => {
      const result = await service.convertLeadFromRecruitment(managerToken, 'lead-1');

      expect(result.creator.platformAccounts[0]).toEqual(
        expect.objectContaining({
          platform: 'TIKTOK',
          username: 'janecreates',
          sourceLeadPlatformAccountId: 'platform-1',
        }),
      );
    });

    it('rejects conversion without organization membership', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.convertLeadFromRecruitment(viewerToken, 'lead-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
