import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { RecruitmentService } from './recruitment.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorLead: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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

const userToken: AccessTokenPayload = {
  sub: 'user-1',
  email: 'admin@kolab.test',
  role: 'ADMIN',
  organizationId: 'org-1',
  organizationRole: 'ORG_ADMIN',
  sessionId: 'session-1',
  isSystemAdmin: false,
};

const otherOrgToken: AccessTokenPayload = {
  ...userToken,
  sub: 'user-2',
  organizationId: 'org-2',
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

describe('RecruitmentService', () => {
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
    });
  });

  describe('createLead', () => {
    it('creates a lead with defaults and records audit', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        (prisma.creatorLead.create as jest.Mock).mockResolvedValue(baseLead);
        (prisma.leadStatusHistory.create as jest.Mock).mockResolvedValue({});
        return callback(prisma);
      });

      const result = await service.createLead(userToken, {
        name: 'Jane Creator',
      });

      expect(result.status).toBe('NEW');
      expect(result.commissionPlan).toBe('STANDARD');
      expect(result.score).toBe(50);
      expect(prisma.creatorLead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-1',
            status: 'NEW',
            score: 50,
            commissionPlan: 'STANDARD',
          }),
        }),
      );
      expect(prisma.leadStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-1',
            leadId: 'lead-1',
            newStatus: 'NEW',
            changedById: 'user-1',
          }),
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.LEAD_CREATED,
          targetType: AUDIT_TARGET_TYPE.LEAD,
          targetId: 'lead-1',
        }),
      );
    });
  });

  describe('listLeads', () => {
    it('returns paginated lead summaries', async () => {
      (prisma.creatorLead.findMany as jest.Mock).mockResolvedValue([baseLead]);

      const result = await service.listLeads(userToken, { limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe('Jane Creator');
      expect(result.nextCursor).toBeNull();
      expect(prisma.creatorLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            NOT: {
              metadata: {
                path: ['deleted'],
                equals: true,
              },
            },
          }),
        }),
      );
    });

    it('applies search and filters', async () => {
      (prisma.creatorLead.findMany as jest.Mock).mockResolvedValue([]);

      await service.listLeads(userToken, {
        limit: 10,
        search: 'jane',
        status: 'NEW',
        source: 'SOCIAL',
        recruiterId: 'recruiter-1',
        platform: 'TIKTOK',
        scoreMin: 40,
        scoreMax: 80,
      });

      expect(prisma.creatorLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'NEW',
            source: 'SOCIAL',
            assignedRecruiterId: 'recruiter-1',
            score: { gte: 40, lte: 80 },
            platformAccounts: { some: { platform: 'TIKTOK' } },
            OR: expect.arrayContaining([expect.objectContaining({ name: expect.any(Object) })]),
          }),
        }),
      );
    });

    it('returns next cursor when more results exist', async () => {
      (prisma.creatorLead.findMany as jest.Mock).mockResolvedValue([
        { ...baseLead, id: 'lead-1' },
        { ...baseLead, id: 'lead-2' },
      ]);

      const result = await service.listLeads(userToken, { limit: 1 });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBe('lead-1');
    });
  });

  describe('getLead', () => {
    it('returns lead detail with related records', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue({
        ...baseLead,
        platformAccounts: [],
        assignments: [
          {
            id: 'assignment-1',
            organizationId: 'org-1',
            leadId: 'lead-1',
            recruiterId: 'recruiter-1',
            assignedById: 'user-1',
            assignedAt: new Date('2026-06-21T08:00:00.000Z'),
            unassignedAt: null,
            reason: null,
            createdAt: new Date('2026-06-21T08:00:00.000Z'),
          },
        ],
        notes: [],
        statusHistory: [],
      });

      const result = await service.getLead(userToken, 'lead-1');

      expect(result.lead.id).toBe('lead-1');
      expect(result.currentAssignment?.recruiterId).toBe('recruiter-1');
      expect(result.assignmentHistory).toHaveLength(1);
    });

    it('returns 404 for missing lead', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getLead(userToken, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateLead', () => {
    it('updates lead fields and records audit', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(baseLead);
      (prisma.creatorLead.update as jest.Mock).mockResolvedValue({
        ...baseLead,
        name: 'Updated Name',
      });

      const result = await service.updateLead(userToken, 'lead-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.LEAD_UPDATED,
          targetType: AUDIT_TARGET_TYPE.LEAD,
        }),
      );
    });
  });

  describe('deleteLead', () => {
    it('soft deletes lead via metadata and records audit', async () => {
      (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(baseLead);
      (prisma.creatorLead.update as jest.Mock).mockResolvedValue({
        ...baseLead,
        metadata: { deleted: true },
      });

      const result = await service.deleteLead(userToken, 'lead-1');

      expect(result).toEqual({ id: 'lead-1', deleted: true });
      expect(prisma.creatorLead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              deleted: true,
              deletedBy: 'user-1',
            }),
          }),
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTION.LEAD_DELETED,
          targetType: AUDIT_TARGET_TYPE.LEAD,
        }),
      );
    });
  });

  describe('organization isolation', () => {
    it('scopes list queries to the active organization', async () => {
      (prisma.creatorLead.findMany as jest.Mock).mockResolvedValue([]);

      await service.listLeads(otherOrgToken, { limit: 20 });

      expect(prisma.creatorLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org-2' }),
        }),
      );
    });

    it('rejects requests without organization context', async () => {
      const tokenWithoutOrg = { ...userToken, organizationId: undefined };

      await expect(service.listLeads(tokenWithoutOrg, { limit: 20 })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects inactive membership', async () => {
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.listLeads(userToken, { limit: 20 })).rejects.toThrow(ForbiddenException);
    });
  });
});
