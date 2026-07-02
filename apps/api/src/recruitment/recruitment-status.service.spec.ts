import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { RecruitmentService } from './recruitment.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorLead: {
      findFirst: jest.fn(),
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
  nickname: null,
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

const statusHistoryEntry = {
  id: 'history-1',
  organizationId: 'org-1',
  leadId: 'lead-1',
  previousStatus: 'NEW',
  newStatus: 'CONTACTED',
  changedById: 'user-1',
  changedAt: new Date('2026-06-21T08:00:00.000Z'),
  reason: 'Initial outreach',
};

describe('RecruitmentService updateLeadStatus', () => {
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

  it('updates lead status on a valid transition and appends history', async () => {
    (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(baseLead);
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
      callback({
        creatorLead: {
          update: jest.fn().mockResolvedValue({ ...baseLead, status: 'CONTACTED' }),
        },
        leadStatusHistory: {
          create: jest.fn().mockResolvedValue(statusHistoryEntry),
        },
      }),
    );

    const result = await service.updateLeadStatus(userToken, 'lead-1', {
      status: 'CONTACTED',
      reason: 'Initial outreach',
    });

    expect(result.lead.status).toBe('CONTACTED');
    expect(result.statusHistory.newStatus).toBe('CONTACTED');
    expect(result.statusHistory.previousStatus).toBe('NEW');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LEAD_STATUS_CHANGED,
        targetType: AUDIT_TARGET_TYPE.LEAD,
        metadata: expect.objectContaining({
          previousStatus: 'NEW',
          newStatus: 'CONTACTED',
        }),
      }),
    );
  });

  it('rejects invalid status transitions', async () => {
    (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(baseLead);

    await expect(
      service.updateLeadStatus(userToken, 'lead-1', { status: 'SIGNED' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects soft-deleted leads', async () => {
    (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.updateLeadStatus(userToken, 'lead-1', { status: 'CONTACTED' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('scopes status updates to the active organization', async () => {
    (prisma.creatorLead.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.updateLeadStatus(otherOrgToken, 'lead-1', { status: 'CONTACTED' }),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.creatorLead.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-2' }),
      }),
    );
  });

  it('rejects requests without organization context', async () => {
    const tokenWithoutOrg = { ...userToken, organizationId: undefined };

    await expect(
      service.updateLeadStatus(tokenWithoutOrg, 'lead-1', { status: 'CONTACTED' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
