import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { LiveIntelligenceCreatorProfileService } from './live-intelligence-creator-profile.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorProfile: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    liveSession: {
      findMany: jest.fn(),
    },
    gifterSessionStats: {
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

const intelligenceSnapshot = {
  sessionId: 'session-1',
  creatorProfileId: 'creator-1',
  generatedAt: '2026-07-04T21:00:00.000Z',
  sessionHealthScore: 88,
  revenueScore: 85,
  engagementScore: 72,
  consistencyScore: 80,
  gifterQualityScore: 70,
  coachingOpportunityScore: 24,
  overallScore: 78,
  keyStrengths: ['Gift revenue correlated strongly with captured timeline activity.'],
  keyRisks: [],
  topSignals: [],
  topGifters: [],
  topTriggerTypes: [{ triggerType: 'SONG_STARTED_GIFTS', count: 1 }],
  bestMoments: [],
  weakMoments: [],
  recommendedNextActions: ['Repeat music segments that drove gifts.'],
  dataQualityWarnings: [],
};

describe('LiveIntelligenceCreatorProfileService', () => {
  let service: LiveIntelligenceCreatorProfileService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveIntelligenceCreatorProfileService,
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(LiveIntelligenceCreatorProfileService);
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
        campaignId: null,
        totalViewers: 500,
        peakViewers: 120,
        totalGifts: 2,
        totalGiftValue: { toString: () => '5050.00' },
        metadata: { intelligenceSnapshot },
      },
    ]);
    (prisma.gifterSessionStats.findMany as jest.Mock).mockResolvedValue([
      {
        gifterProfileId: 'gifter-profile-1',
        liveSessionId: 'session-1',
        giftCount: 2,
        giftValue: { toString: () => '5050' },
        gifterProfile: {
          externalGifterId: 'gifter-1',
          displayName: 'Whale',
          spendingTier: 'WHALE',
        },
      },
    ]);
    (prisma.creatorProfile.update as jest.Mock).mockImplementation(async ({ data }) => ({
      ...baseCreator,
      metadata: data.metadata,
    }));
  });

  it('generates creator intelligence profile, stores it on creator metadata, and audits generation', async () => {
    const result = await service.generateCreatorIntelligence(managerToken, 'creator-1');

    expect(result.creatorProfileId).toBe('creator-1');
    expect(result.sessionsAnalyzed).toBe(1);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(prisma.creatorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            intelligenceProfile: expect.objectContaining({ creatorProfileId: 'creator-1' }),
          }),
        }),
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_INTELLIGENCE_PROFILE_GENERATED,
        targetType: AUDIT_TARGET_TYPE.CREATOR,
        targetId: 'creator-1',
      }),
    );
  });

  it('replaces previous creator intelligence profile on rerun', async () => {
    await service.generateCreatorIntelligence(managerToken, 'creator-1');
    await service.generateCreatorIntelligence(managerToken, 'creator-1');

    expect(prisma.creatorProfile.update).toHaveBeenCalledTimes(2);
  });

  it('reads stored creator intelligence profile and audits view access', async () => {
    const generated = await service.generateCreatorIntelligence(managerToken, 'creator-1');

    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue({
      ...baseCreator,
      metadata: { intelligenceProfile: generated },
    });

    const result = await service.getCreatorIntelligence(managerToken, 'creator-1');

    expect(result.generatedAt).toBe(generated.generatedAt);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_INTELLIGENCE_PROFILE_VIEWED,
        targetType: AUDIT_TARGET_TYPE.CREATOR,
        targetId: 'creator-1',
      }),
    );
  });

  it('throws when creator intelligence profile has not been generated', async () => {
    await expect(service.getCreatorIntelligence(managerToken, 'creator-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws when creator is outside the active organization', async () => {
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.generateCreatorIntelligence(otherOrgToken, 'creator-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws when organization membership is inactive', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.generateCreatorIntelligence(managerToken, 'creator-1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
