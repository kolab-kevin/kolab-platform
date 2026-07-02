import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { RecruitmentService } from './recruitment.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorLead: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    leadAssignment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    leadStatusHistory: {
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

const otherRecruiterToken: AccessTokenPayload = {
  ...recruiterToken,
  sub: 'recruiter-2',
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
  assignedRecruiterId: null,
  assignedAt: null,
  nextFollowUpAt: null,
  commissionPlan: 'STANDARD',
  convertedUserId: null,
  convertedAt: null,
  notesSummary: null,
  metadata: {},
  createdAt: new Date('2026-06-20T08:00:00.000Z'),
  updatedAt: new Date('2026-06-20T08:00:00.000Z'),
};

const activeAssignment = {
  id: 'assignment-1',
  organizationId: 'org-1',
  leadId: 'lead-1',
  recruiterId: 'recruiter-1',
  assignedById: 'recruiter-1',
  assignedAt: new Date('2026-06-21T08:00:00.000Z'),
  unassignedAt: null,
  reason: 'Claimed by recruiter',
  createdAt: new Date('2026-06-21T08:00:00.000Z'),
};

describe('RecruitmentService assignment workflow', () => {
  let service: RecruitmentService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RecruitmentService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(RecruitmentService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
      role: 'RECRUITER',
    });
  });

  describe('claimLead', () => {
    it('allows the first recruiter to claim an unassigned lead', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          creatorLead: {
            findFirst: jest.fn().mockResolvedValue(baseLead),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUniqueOrThrow: jest.fn().mockResolvedValue({
              ...baseLead,
              assignedRecruiterId: 'recruiter-1',
              assignedAt: new Date('2026-06-21T08:00:00.000Z'),
            }),
          },
          leadAssignment: {
            create: jest.fn().mockResolvedValue(activeAssignment),
          },
        }),
      );

      const result = await service.claimLead(recruiterToken, 'lead-1');

      expect(result.lead.assignedRecruiterId).toBe('recruiter-1');
      expect(result.assignment.recruiterId).toBe('recruiter-1');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.LEAD_CLAIMED,
          targetType: AUDIT_TARGET_TYPE.LEAD,
        }),
      );
    });

    it('rejects a second claim when the lead is already owned', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          creatorLead: {
            findFirst: jest.fn().mockResolvedValue({
              ...baseLead,
              assignedRecruiterId: 'recruiter-1',
            }),
            updateMany: jest.fn(),
            findUniqueOrThrow: jest.fn(),
          },
          leadAssignment: {
            create: jest.fn(),
            findFirst: jest.fn(),
          },
        }),
      );

      await expect(service.claimLead(otherRecruiterToken, 'lead-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects concurrent claims when updateMany affects zero rows', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          creatorLead: {
            findFirst: jest.fn().mockResolvedValue(baseLead),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            findUniqueOrThrow: jest.fn(),
          },
          leadAssignment: {
            create: jest.fn(),
          },
        }),
      );

      await expect(service.claimLead(recruiterToken, 'lead-1')).rejects.toThrow(ConflictException);
    });

    it('rejects claiming deleted leads', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          creatorLead: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        }),
      );

      await expect(service.claimLead(recruiterToken, 'lead-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reassignLead', () => {
    it('allows managers to reassign a lead', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
        status: 'ACTIVE',
        role: 'RECRUITER',
      });
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          creatorLead: {
            findFirst: jest.fn().mockResolvedValue({
              ...baseLead,
              assignedRecruiterId: 'recruiter-1',
            }),
            update: jest.fn().mockResolvedValue({
              ...baseLead,
              assignedRecruiterId: 'recruiter-2',
            }),
          },
          leadAssignment: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            create: jest.fn().mockResolvedValue({
              ...activeAssignment,
              id: 'assignment-2',
              recruiterId: 'recruiter-2',
              assignedById: 'manager-1',
            }),
          },
        }),
      );

      const result = await service.reassignLead(managerToken, 'lead-1', {
        recruiterUserId: 'recruiter-2',
        reason: 'Territory change',
      });

      expect(result.lead.assignedRecruiterId).toBe('recruiter-2');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.LEAD_REASSIGNED,
        }),
      );
    });

    it('denies recruiters from reassigning leads', async () => {
      await expect(
        service.reassignLead(recruiterToken, 'lead-1', {
          recruiterUserId: 'recruiter-2',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects reassigning to viewers and creators', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
        status: 'ACTIVE',
        role: 'VIEWER',
      });

      await expect(
        service.reassignLead(managerToken, 'lead-1', {
          recruiterUserId: 'viewer-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects reassigning to suspended members', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockImplementation(({ where }) => {
        if (where.organizationId_userId.userId === managerToken.sub) {
          return { status: 'ACTIVE', role: 'AGENCY_MANAGER' };
        }

        return { status: 'SUSPENDED', role: 'RECRUITER' };
      });

      await expect(
        service.reassignLead(managerToken, 'lead-1', {
          recruiterUserId: 'recruiter-2',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('unassignLead', () => {
    it('allows managers to unassign a lead', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback({
          creatorLead: {
            findFirst: jest.fn().mockResolvedValue({
              ...baseLead,
              assignedRecruiterId: 'recruiter-1',
            }),
            update: jest.fn().mockResolvedValue({
              ...baseLead,
              assignedRecruiterId: null,
              assignedAt: null,
            }),
          },
          leadAssignment: {
            findFirst: jest.fn().mockResolvedValue(activeAssignment),
            update: jest.fn().mockResolvedValue({
              ...activeAssignment,
              unassignedAt: new Date('2026-06-22T08:00:00.000Z'),
            }),
          },
        }),
      );

      const result = await service.unassignLead(managerToken, 'lead-1', {
        reason: 'Returned to pool',
      });

      expect(result.lead.assignedRecruiterId).toBeNull();
      expect(result.assignment.unassignedAt).not.toBeNull();
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.LEAD_UNASSIGNED,
        }),
      );
    });

    it('denies recruiters from unassigning leads', async () => {
      await expect(service.unassignLead(recruiterToken, 'lead-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('listMyLeads', () => {
    it('returns leads assigned to the authenticated recruiter', async () => {
      (prisma.creatorLead.findMany as jest.Mock).mockResolvedValue([
        {
          ...baseLead,
          assignedRecruiterId: 'recruiter-1',
        },
      ]);

      const result = await service.listMyLeads(recruiterToken, { limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(prisma.creatorLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedRecruiterId: 'recruiter-1',
            organizationId: 'org-1',
          }),
        }),
      );
    });
  });
});
