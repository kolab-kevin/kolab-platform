import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { CreatorsGoalsService } from './creators-goals.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorGoal: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    creatorGoalProgress: {
      create: jest.fn(),
    },
    creatorProfile: {
      findFirst: jest.fn(),
    },
    liveSession: {
      findMany: jest.fn(),
    },
    campaignCreatorDeliverable: {
      count: jest.fn(),
    },
    gifterSessionStats: {
      findMany: jest.fn(),
    },
    creatorDocument: {
      findMany: jest.fn(),
    },
    creatorContract: {
      findMany: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  CreatorGoalStatus: {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    MISSED: 'MISSED',
    CANCELLED: 'CANCELLED',
    ARCHIVED: 'ARCHIVED',
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
  Prisma: {
    Decimal: class Decimal {
      constructor(public value: string | number) {}
      toString() {
        return String(this.value);
      }
    },
    InputJsonValue: {},
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

const otherOrgToken: AccessTokenPayload = {
  ...managerToken,
  sub: 'manager-2',
  organizationId: 'org-2',
};

const baseCreator = {
  id: 'creator-1',
  organizationId: 'org-1',
  metadata: {
    performanceScore: {
      creatorProfileId: 'creator-1',
      generatedAt: '2026-06-15T12:00:00.000Z',
      overallScore: 76,
      complianceScore: 90,
      consistencyScore: 72,
      revenueScore: 70,
      engagementScore: 68,
      campaignScore: 65,
      liveScore: 74,
      dataQualityWarnings: [],
    },
  },
};

const baseGoal = {
  id: 'goal-1',
  organizationId: 'org-1',
  creatorProfileId: 'creator-1',
  goalType: 'LIVE_HOURS',
  status: 'ACTIVE',
  title: 'June live hours',
  targetValue: { toString: () => '10.00' },
  currentValue: { toString: () => '0.00' },
  periodStart: new Date('2026-06-01T00:00:00.000Z'),
  periodEnd: new Date('2026-06-30T23:59:59.000Z'),
  metadata: {},
  createdByUserId: 'manager-1',
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  updatedAt: new Date('2026-06-01T00:00:00.000Z'),
};

describe('CreatorsGoalsService', () => {
  let service: CreatorsGoalsService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CreatorsGoalsService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(CreatorsGoalsService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(baseCreator);
    (prisma.creatorGoal.findFirst as jest.Mock).mockResolvedValue(baseGoal);
    (prisma.creatorGoal.findMany as jest.Mock).mockResolvedValue([baseGoal]);
    (prisma.liveSession.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'session-1',
        startedAt: new Date('2026-06-10T18:00:00.000Z'),
        endedAt: new Date('2026-06-10T19:30:00.000Z'),
        durationSeconds: 5400,
        totalGifts: 10,
        totalGiftValue: { toString: () => '250.00' },
        status: 'ENDED',
      },
    ]);
    (prisma.campaignCreatorDeliverable.count as jest.Mock).mockResolvedValue(0);
    (prisma.gifterSessionStats.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([{ id: 'doc-1' }]);
    (prisma.creatorContract.findMany as jest.Mock).mockResolvedValue([{ id: 'contract-1' }]);
  });

  it('lists creator goals for the active organization', async () => {
    const result = await service.listCreatorGoals(managerToken, 'creator-1', { limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('goal-1');
    expect(prisma.creatorGoal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          creatorProfileId: 'creator-1',
        }),
      }),
    );
  });

  it('gets a creator goal by id', async () => {
    const result = await service.getCreatorGoal(managerToken, 'creator-1', 'goal-1');

    expect(result.id).toBe('goal-1');
    expect(result.goalType).toBe('LIVE_HOURS');
  });

  it('creates a creator goal and records audit', async () => {
    (prisma.creatorGoal.create as jest.Mock).mockResolvedValue(baseGoal);

    const result = await service.createCreatorGoal(managerToken, 'creator-1', {
      goalType: 'LIVE_HOURS',
      title: 'June live hours',
      targetValue: 10,
      periodStart: '2026-06-01T00:00:00.000Z',
      periodEnd: '2026-06-30T23:59:59.000Z',
    });

    expect(result.id).toBe('goal-1');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_GOAL_CREATED,
        targetType: AUDIT_TARGET_TYPE.CREATOR_GOAL,
        targetId: 'goal-1',
      }),
    );
  });

  it('updates a creator goal and records audit', async () => {
    (prisma.creatorGoal.update as jest.Mock).mockResolvedValue({
      ...baseGoal,
      title: 'Updated title',
    });

    const result = await service.updateCreatorGoal(managerToken, 'creator-1', 'goal-1', {
      title: 'Updated title',
    });

    expect(result.title).toBe('Updated title');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_GOAL_UPDATED,
      }),
    );
  });

  it('updates creator goal status with valid transition', async () => {
    (prisma.creatorGoal.update as jest.Mock).mockResolvedValue({
      ...baseGoal,
      status: 'CANCELLED',
    });

    const result = await service.updateCreatorGoalStatus(managerToken, 'creator-1', 'goal-1', {
      status: 'CANCELLED',
    });

    expect(result.status).toBe('CANCELLED');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_GOAL_STATUS_CHANGED,
        metadata: expect.objectContaining({
          previousStatus: 'ACTIVE',
          nextStatus: 'CANCELLED',
        }),
      }),
    );
  });

  it('rejects invalid status transitions', async () => {
    (prisma.creatorGoal.findFirst as jest.Mock).mockResolvedValue({
      ...baseGoal,
      status: 'COMPLETED',
    });

    await expect(
      service.updateCreatorGoalStatus(managerToken, 'creator-1', 'goal-1', {
        status: 'ACTIVE',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('recalculates live hours progress and records audit', async () => {
    const updatedGoal = {
      ...baseGoal,
      currentValue: { toString: () => '1.50' },
      status: 'ACTIVE',
    };
    const progress = {
      id: 'progress-1',
      organizationId: 'org-1',
      creatorGoalId: 'goal-1',
      currentValue: { toString: () => '1.50' },
      targetValue: { toString: () => '10.00' },
      progressPercent: 15,
      calculationSummary: { source: 'live_sessions' },
      recalculatedAt: new Date('2026-06-20T12:00:00.000Z'),
      metadata: {},
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
    };

    (prisma.$transaction as jest.Mock).mockResolvedValue([updatedGoal, progress]);

    const result = await service.recalculateCreatorGoalProgress(
      managerToken,
      'creator-1',
      'goal-1',
    );

    expect(result.goal.currentValue).toBe('1.50');
    expect(result.progress.progressPercent).toBe(15);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_GOAL_PROGRESS_RECALCULATED,
      }),
    );
  });

  it('recalculates live days goal type', async () => {
    (prisma.creatorGoal.findFirst as jest.Mock).mockResolvedValue({
      ...baseGoal,
      goalType: 'LIVE_DAYS',
      targetValue: { toString: () => '5.00' },
    });

    const updatedGoal = {
      ...baseGoal,
      goalType: 'LIVE_DAYS',
      currentValue: { toString: () => '1.00' },
      targetValue: { toString: () => '5.00' },
      status: 'ACTIVE',
    };
    const progress = {
      id: 'progress-2',
      organizationId: 'org-1',
      creatorGoalId: 'goal-1',
      currentValue: { toString: () => '1.00' },
      targetValue: { toString: () => '5.00' },
      progressPercent: 20,
      calculationSummary: { source: 'live_sessions', distinctLiveDays: 1 },
      recalculatedAt: new Date('2026-06-20T12:00:00.000Z'),
      metadata: {},
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
    };

    (prisma.$transaction as jest.Mock).mockResolvedValue([updatedGoal, progress]);

    const result = await service.recalculateCreatorGoalProgress(
      managerToken,
      'creator-1',
      'goal-1',
    );

    expect(result.goal.goalType).toBe('LIVE_DAYS');
    expect(result.progress.calculationSummary).toEqual(
      expect.objectContaining({ distinctLiveDays: 1 }),
    );
  });

  it('recalculates campaign deliverables goal type', async () => {
    (prisma.creatorGoal.findFirst as jest.Mock).mockResolvedValue({
      ...baseGoal,
      goalType: 'CAMPAIGN_DELIVERABLES',
      targetValue: { toString: () => '3.00' },
    });
    (prisma.campaignCreatorDeliverable.count as jest.Mock).mockResolvedValue(2);

    const updatedGoal = {
      ...baseGoal,
      goalType: 'CAMPAIGN_DELIVERABLES',
      currentValue: { toString: () => '2.00' },
      targetValue: { toString: () => '3.00' },
      status: 'ACTIVE',
    };
    const progress = {
      id: 'progress-3',
      organizationId: 'org-1',
      creatorGoalId: 'goal-1',
      currentValue: { toString: () => '2.00' },
      targetValue: { toString: () => '3.00' },
      progressPercent: 67,
      calculationSummary: { source: 'campaign_creator_deliverables', approvedDeliverables: 2 },
      recalculatedAt: new Date('2026-06-20T12:00:00.000Z'),
      metadata: {},
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
    };

    (prisma.$transaction as jest.Mock).mockResolvedValue([updatedGoal, progress]);

    const result = await service.recalculateCreatorGoalProgress(
      managerToken,
      'creator-1',
      'goal-1',
    );

    expect(result.goal.currentValue).toBe('2.00');
    expect(result.progress.calculationSummary).toEqual(
      expect.objectContaining({ approvedDeliverables: 2 }),
    );
  });

  it('recalculates performance score goal type', async () => {
    (prisma.creatorGoal.findFirst as jest.Mock).mockResolvedValue({
      ...baseGoal,
      goalType: 'PERFORMANCE_SCORE',
      targetValue: { toString: () => '80.00' },
    });

    const updatedGoal = {
      ...baseGoal,
      goalType: 'PERFORMANCE_SCORE',
      currentValue: { toString: () => '76.00' },
      targetValue: { toString: () => '80.00' },
      status: 'ACTIVE',
    };
    const progress = {
      id: 'progress-4',
      organizationId: 'org-1',
      creatorGoalId: 'goal-1',
      currentValue: { toString: () => '76.00' },
      targetValue: { toString: () => '80.00' },
      progressPercent: 95,
      calculationSummary: { source: 'creator_performance_score', overallScore: 76 },
      recalculatedAt: new Date('2026-06-20T12:00:00.000Z'),
      metadata: {},
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
    };

    (prisma.$transaction as jest.Mock).mockResolvedValue([updatedGoal, progress]);

    const result = await service.recalculateCreatorGoalProgress(
      managerToken,
      'creator-1',
      'goal-1',
    );

    expect(result.goal.currentValue).toBe('76.00');
    expect(result.progress.calculationSummary).toEqual(
      expect.objectContaining({ overallScore: 76 }),
    );
  });

  it('returns 404 when creator is outside the organization', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getCreatorGoal(otherOrgToken, 'creator-1', 'goal-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns 404 when goal is outside the organization', async () => {
    (prisma.creatorGoal.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getCreatorGoal(managerToken, 'creator-1', 'goal-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('requires active organization membership', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.listCreatorGoals({ ...managerToken, organizationId: undefined }, 'creator-1', {
        limit: 20,
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
