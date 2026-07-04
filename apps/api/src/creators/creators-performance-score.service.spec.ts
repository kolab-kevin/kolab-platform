import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { CreatorsPerformanceScoreService } from './creators-performance-score.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorProfile: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    liveSession: {
      findMany: jest.fn(),
    },
    creatorPlatformAccount: {
      findMany: jest.fn(),
    },
    creatorDocument: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    creatorContract: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    campaignCreatorAssignment: {
      findMany: jest.fn(),
    },
    campaignCreatorDeliverable: {
      findMany: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
  Prisma: {
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
  userId: 'user-1',
  displayName: 'Creator One',
  country: 'US',
  availability: {},
  metadata: {
    intelligenceProfile: {
      creatorProfileId: 'creator-1',
      generatedAt: '2026-07-04T21:00:00.000Z',
      sessionsAnalyzed: 5,
      dateRange: { from: '2026-06-01T00:00:00.000Z', to: '2026-07-04T00:00:00.000Z' },
      creatorHealthScore: 80,
      revenueTrendScore: 78,
      engagementTrendScore: 74,
      gifterRetentionScore: 70,
      consistencyScore: 76,
      campaignReadinessScore: 72,
      overallScore: 75,
      strongestTriggerTypes: [],
      weakestTriggerTypes: [],
      topGifters: [],
      bestLivePatterns: [],
      riskSignals: [],
      coachingPriorities: [],
      recommendedNextActions: [],
      dataQualityWarnings: [],
    },
    liveTrendSnapshot: {
      creatorProfileId: 'creator-1',
      generatedAt: '2026-07-04T21:00:00.000Z',
      sessionsAnalyzed: 6,
      dateRange: { from: '2026-06-01T00:00:00.000Z', to: '2026-07-04T00:00:00.000Z' },
      revenueTrend: {
        metric: 'revenue',
        direction: 'UP',
        currentValue: 80,
        previousValue: 60,
        percentChange: 33.33,
        confidenceScore: 0.85,
        evidence: [],
      },
      engagementTrend: {
        metric: 'engagement',
        direction: 'UP',
        currentValue: 75,
        previousValue: 65,
        percentChange: 15.38,
        confidenceScore: 0.85,
        evidence: [],
      },
      consistencyTrend: {
        metric: 'consistency',
        direction: 'FLAT',
        currentValue: 78,
        previousValue: 76,
        percentChange: 2.63,
        confidenceScore: 0.85,
        evidence: [],
      },
      gifterQualityTrend: {
        metric: 'gifterQuality',
        direction: 'UP',
        currentValue: 70,
        previousValue: 60,
        percentChange: 16.67,
        confidenceScore: 0.85,
        evidence: [],
      },
      triggerEffectivenessTrend: {
        metric: 'triggerEffectiveness',
        direction: 'UP',
        currentValue: 40,
        previousValue: 25,
        percentChange: 60,
        confidenceScore: 0.85,
        evidence: [],
      },
      overallDirection: 'IMPROVING',
      trendSignals: [],
      regressionRisks: [],
      positiveMomentum: [],
      recommendedFocusAreas: [],
      dataQualityWarnings: [],
    },
  },
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
};

describe('CreatorsPerformanceScoreService', () => {
  let service: CreatorsPerformanceScoreService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsPerformanceScoreService,
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(CreatorsPerformanceScoreService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(baseCreator);
    (prisma.liveSession.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'session-1',
        startedAt: new Date('2026-07-04T20:00:00.000Z'),
        endedAt: new Date('2026-07-04T21:00:00.000Z'),
        status: 'ENDED',
        campaignId: 'campaign-1',
        totalViewers: 500,
        peakViewers: 120,
        totalGifts: 5,
        totalGiftValue: { toString: () => '5000.00' },
        metadata: {},
      },
    ]);
    (prisma.creatorPlatformAccount.findMany as jest.Mock).mockResolvedValue([
      { id: 'account-1', status: 'ACTIVE', platform: 'TIKTOK', username: 'creator' },
    ]);
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue({
      id: 'doc-1',
      status: 'APPROVED',
    });
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([
      { documentType: 'GOVERNMENT_ID' },
    ]);
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue({
      id: 'contract-1',
      status: 'SIGNED',
      signedAt: new Date('2026-06-01T00:00:00.000Z'),
    });
    (prisma.creatorContract.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.campaignCreatorAssignment.findMany as jest.Mock).mockResolvedValue([
      { status: 'COMPLETED' },
    ]);
    (prisma.campaignCreatorDeliverable.findMany as jest.Mock).mockResolvedValue([
      { status: 'APPROVED' },
    ]);
    (prisma.creatorProfile.update as jest.Mock).mockImplementation(async ({ data }) => ({
      ...baseCreator,
      metadata: data.metadata,
    }));
  });

  it('generates creator performance score, stores it on creator metadata, and audits generation', async () => {
    const result = await service.generateCreatorPerformanceScore(managerToken, 'creator-1');

    expect(result.creatorProfileId).toBe('creator-1');
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(prisma.creatorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            performanceScore: expect.objectContaining({ creatorProfileId: 'creator-1' }),
          }),
        }),
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_PERFORMANCE_SCORE_GENERATED,
        targetType: AUDIT_TARGET_TYPE.CREATOR,
        targetId: 'creator-1',
      }),
    );
  });

  it('replaces previous creator performance score on rerun', async () => {
    await service.generateCreatorPerformanceScore(managerToken, 'creator-1');
    await service.generateCreatorPerformanceScore(managerToken, 'creator-1');

    expect(prisma.creatorProfile.update).toHaveBeenCalledTimes(2);
  });

  it('reads stored creator performance score and audits view access', async () => {
    const generated = await service.generateCreatorPerformanceScore(managerToken, 'creator-1');

    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue({
      ...baseCreator,
      metadata: { performanceScore: generated },
    });

    const result = await service.getCreatorPerformanceScore(managerToken, 'creator-1');

    expect(result.generatedAt).toBe(generated.generatedAt);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_PERFORMANCE_SCORE_VIEWED,
        targetType: AUDIT_TARGET_TYPE.CREATOR,
        targetId: 'creator-1',
      }),
    );
  });

  it('throws when creator performance score has not been generated', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue({
      ...baseCreator,
      metadata: {},
    });

    await expect(service.getCreatorPerformanceScore(managerToken, 'creator-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws when creator is outside the active organization', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.generateCreatorPerformanceScore(otherOrgToken, 'creator-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when organization membership is inactive', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.generateCreatorPerformanceScore(managerToken, 'creator-1'),
    ).rejects.toThrow(ForbiddenException);
  });
});
