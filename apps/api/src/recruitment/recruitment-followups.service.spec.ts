import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { RecruitmentFollowUpsService } from './recruitment-followups.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorLead: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    leadNote: {
      create: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
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

const baseLead = {
  id: 'lead-1',
  organizationId: 'org-1',
  name: 'Jane Creator',
  nickname: 'janecreates',
  email: 'jane@example.com',
  phone: null,
  country: null,
  languages: [],
  source: 'MANUAL',
  status: 'NEW',
  score: 50,
  assignedRecruiterId: 'recruiter-1',
  assignedAt: new Date('2026-06-21T08:00:00.000Z'),
  nextFollowUpAt: new Date('2026-06-25T10:00:00.000Z'),
  commissionPlan: 'STANDARD',
  convertedUserId: null,
  convertedAt: null,
  notesSummary: null,
  metadata: {},
  createdAt: new Date('2026-06-20T08:00:00.000Z'),
  updatedAt: new Date('2026-06-20T08:00:00.000Z'),
};

describe('RecruitmentFollowUpsService', () => {
  let service: RecruitmentFollowUpsService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RecruitmentFollowUpsService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(RecruitmentFollowUpsService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(baseLead);
  });

  describe('listFollowUps', () => {
    it('lists due follow-ups for the current recruiter', async () => {
      (prisma.creatorLead.findMany as jest.Mock).mockResolvedValue([baseLead]);

      const result = await service.listFollowUps(recruiterToken, {
        limit: 20,
        overdueOnly: false,
        dueBefore: '2026-06-30T00:00:00.000Z',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.id).toBe('lead-1');
      expect(prisma.creatorLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedRecruiterId: 'recruiter-1',
            nextFollowUpAt: expect.objectContaining({
              not: null,
              lte: new Date('2026-06-30T00:00:00.000Z'),
            }),
          }),
        }),
      );
    });

    it('filters overdue follow-ups only', async () => {
      (prisma.creatorLead.findMany as jest.Mock).mockResolvedValue([baseLead]);

      await service.listFollowUps(recruiterToken, {
        limit: 20,
        overdueOnly: true,
      });

      expect(prisma.creatorLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nextFollowUpAt: expect.objectContaining({
              lt: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe('updateLeadFollowUp', () => {
    beforeEach(() => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          creatorLead: {
            update: jest.fn().mockResolvedValue({
              ...baseLead,
              nextFollowUpAt: new Date('2026-06-28T12:00:00.000Z'),
              metadata: {
                followUpHistory: [
                  {
                    updatedAt: '2026-06-22T12:00:00.000Z',
                    updatedBy: 'recruiter-1',
                    previousFollowUpAt: '2026-06-25T10:00:00.000Z',
                    nextFollowUpAt: '2026-06-28T12:00:00.000Z',
                  },
                ],
              },
            }),
          },
          leadNote: {
            create: jest.fn(),
          },
        }),
      );
    });

    it('allows recruiters to set follow-up on their own lead', async () => {
      const result = await service.updateLeadFollowUp(recruiterToken, 'lead-1', {
        nextFollowUpAt: '2026-06-28T12:00:00.000Z',
      });

      expect(result.lead.nextFollowUpAt).toBe('2026-06-28T12:00:00.000Z');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.LEAD_FOLLOWUP_UPDATED,
          targetType: AUDIT_TARGET_TYPE.LEAD,
          targetId: 'lead-1',
        }),
      );
    });

    it('rejects recruiters updating another recruiter lead', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue({
        ...baseLead,
        assignedRecruiterId: 'recruiter-2',
      });

      await expect(
        service.updateLeadFollowUp(recruiterToken, 'lead-1', {
          nextFollowUpAt: '2026-06-28T12:00:00.000Z',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows managers to update any lead in the org', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue({
        ...baseLead,
        assignedRecruiterId: 'recruiter-2',
      });

      const result = await service.updateLeadFollowUp(managerToken, 'lead-1', {
        nextFollowUpAt: '2026-06-28T12:00:00.000Z',
      });

      expect(result.lead.nextFollowUpAt).toBe('2026-06-28T12:00:00.000Z');
    });

    it('clears follow-up when nextFollowUpAt is null', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          creatorLead: {
            update: jest.fn().mockResolvedValue({
              ...baseLead,
              nextFollowUpAt: null,
            }),
          },
          leadNote: {
            create: jest.fn(),
          },
        }),
      );

      const result = await service.updateLeadFollowUp(recruiterToken, 'lead-1', {
        nextFollowUpAt: null,
      });

      expect(result.lead.nextFollowUpAt).toBeNull();
    });

    it('rejects setting follow-up on rejected leads', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue({
        ...baseLead,
        status: 'REJECTED',
      });

      await expect(
        service.updateLeadFollowUp(recruiterToken, 'lead-1', {
          nextFollowUpAt: '2026-06-28T12:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects follow-up updates on deleted leads', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateLeadFollowUp(recruiterToken, 'lead-1', {
          nextFollowUpAt: '2026-06-28T12:00:00.000Z',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a note when note is provided', async () => {
      const createdNote = {
        id: 'note-1',
        organizationId: 'org-1',
        leadId: 'lead-1',
        authorId: 'recruiter-1',
        contactType: 'OTHER',
        note: 'Reschedule after vacation',
        createdAt: new Date('2026-06-22T12:00:00.000Z'),
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          creatorLead: {
            update: jest.fn().mockResolvedValue({
              ...baseLead,
              nextFollowUpAt: new Date('2026-06-28T12:00:00.000Z'),
              metadata: {
                followUpHistory: [
                  {
                    updatedAt: '2026-06-22T12:00:00.000Z',
                    updatedBy: 'recruiter-1',
                    previousFollowUpAt: '2026-06-25T10:00:00.000Z',
                    nextFollowUpAt: '2026-06-28T12:00:00.000Z',
                    note: 'Reschedule after vacation',
                  },
                ],
              },
            }),
          },
          leadNote: {
            create: jest.fn().mockResolvedValue(createdNote),
          },
        }),
      );

      const result = await service.updateLeadFollowUp(recruiterToken, 'lead-1', {
        nextFollowUpAt: '2026-06-28T12:00:00.000Z',
        note: 'Reschedule after vacation',
      });

      expect(result.note?.note).toBe('Reschedule after vacation');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ noteAdded: true }),
        }),
      );
    });

    it('allows clearing follow-up on rejected leads', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue({
        ...baseLead,
        status: 'REJECTED',
      });
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          creatorLead: {
            update: jest.fn().mockResolvedValue({
              ...baseLead,
              status: 'REJECTED',
              nextFollowUpAt: null,
            }),
          },
          leadNote: {
            create: jest.fn(),
          },
        }),
      );

      const result = await service.updateLeadFollowUp(recruiterToken, 'lead-1', {
        nextFollowUpAt: null,
      });

      expect(result.lead.nextFollowUpAt).toBeNull();
    });
  });
});
