import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { LiveIntelligenceLiveTrendsService } from './live-intelligence-live-trends.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorProfile: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    liveSession: {
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
  displayName: 'Creator One',
  metadata: {},
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
};

const intelligenceSnapshot = (sessionId: string, revenueScore: number) => ({
  sessionId,
  creatorProfileId: 'creator-1',
  generatedAt: '2026-07-04T21:00:00.000Z',
  sessionHealthScore: revenueScore,
  revenueScore,
  engagementScore: revenueScore,
  consistencyScore: revenueScore,
  gifterQualityScore: revenueScore,
  coachingOpportunityScore: 24,
  overallScore: revenueScore,
  keyStrengths: [],
  keyRisks: [],
  topSignals: [],
  topGifters: [],
  topTriggerTypes: [{ triggerType: 'SONG_STARTED_GIFTS', count: 2 }],
  bestMoments: [],
  weakMoments: [],
  recommendedNextActions: [],
  dataQualityWarnings: [],
});

const buildSession = (id: string, startedAt: Date, revenueScore: number) => ({
  id,
  startedAt,
  endedAt: new Date(startedAt.getTime() + 3_600_000),
  status: 'ENDED',
  campaignId: null,
  totalViewers: 500,
  peakViewers: 120,
  totalGifts: 2,
  totalGiftValue: { toString: () => `${revenueScore * 100}.00` },
  metadata: { intelligenceSnapshot: intelligenceSnapshot(id, revenueScore) },
});

describe('LiveIntelligenceLiveTrendsService', () => {
  let service: LiveIntelligenceLiveTrendsService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveIntelligenceLiveTrendsService,
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(LiveIntelligenceLiveTrendsService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(baseCreator);
    (prisma.liveSession.findMany as jest.Mock).mockResolvedValue([
      buildSession('session-1', new Date('2026-07-05T20:00:00.000Z'), 90),
      buildSession('session-2', new Date('2026-07-04T20:00:00.000Z'), 88),
      buildSession('session-3', new Date('2026-07-03T20:00:00.000Z'), 85),
      buildSession('session-4', new Date('2026-06-03T20:00:00.000Z'), 40),
      buildSession('session-5', new Date('2026-06-02T20:00:00.000Z'), 38),
      buildSession('session-6', new Date('2026-06-01T20:00:00.000Z'), 35),
    ]);
    (prisma.creatorProfile.update as jest.Mock).mockImplementation(async ({ data }) => ({
      ...baseCreator,
      metadata: data.metadata,
    }));
  });

  it('generates creator live trend snapshot, stores it on creator metadata, and audits generation', async () => {
    const result = await service.generateCreatorLiveTrends(managerToken, 'creator-1');

    expect(result.creatorProfileId).toBe('creator-1');
    expect(result.sessionsAnalyzed).toBe(6);
    expect(prisma.creatorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            liveTrendSnapshot: expect.objectContaining({ creatorProfileId: 'creator-1' }),
          }),
        }),
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_LIVE_TRENDS_GENERATED,
        targetType: AUDIT_TARGET_TYPE.CREATOR,
        targetId: 'creator-1',
      }),
    );
  });

  it('replaces previous live trend snapshot on rerun', async () => {
    await service.generateCreatorLiveTrends(managerToken, 'creator-1');
    await service.generateCreatorLiveTrends(managerToken, 'creator-1');

    expect(prisma.creatorProfile.update).toHaveBeenCalledTimes(2);
  });

  it('reads stored live trend snapshot and audits view access', async () => {
    const generated = await service.generateCreatorLiveTrends(managerToken, 'creator-1');

    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue({
      ...baseCreator,
      metadata: { liveTrendSnapshot: generated },
    });

    const result = await service.getCreatorLiveTrends(managerToken, 'creator-1');

    expect(result.generatedAt).toBe(generated.generatedAt);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_LIVE_TRENDS_VIEWED,
        targetType: AUDIT_TARGET_TYPE.CREATOR,
        targetId: 'creator-1',
      }),
    );
  });

  it('throws when live trend snapshot has not been generated', async () => {
    await expect(service.getCreatorLiveTrends(managerToken, 'creator-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws when creator is outside the active organization', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.generateCreatorLiveTrends(otherOrgToken, 'creator-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws when organization membership is inactive', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.generateCreatorLiveTrends(managerToken, 'creator-1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
