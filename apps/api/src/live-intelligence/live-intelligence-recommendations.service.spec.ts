import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { LiveIntelligenceRecommendationsService } from './live-intelligence-recommendations.service';
import type { TriggerAnalysisEventInput } from './live-intelligence-trigger-analysis.utils';
import { buildSessionTriggerAnalysis } from './live-intelligence-trigger-analysis.utils';

jest.mock('@kolab/database', () => ({
  prisma: {
    liveSession: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    liveEvent: {
      findMany: jest.fn(),
    },
    gifterSessionStats: {
      findMany: jest.fn(),
    },
    gifterProfile: {
      findMany: jest.fn(),
    },
    creatorLiveSchedule: {
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

const baseSession = {
  id: 'session-1',
  organizationId: 'org-1',
  creatorProfileId: 'creator-1',
  campaignId: null,
  platform: 'TIKTOK',
  platformSessionId: 'tt-live-123',
  title: 'Evening Live',
  description: null,
  startedAt: new Date('2026-07-04T20:00:00.000Z'),
  endedAt: new Date('2026-07-04T21:00:00.000Z'),
  scheduledStart: null,
  scheduledEnd: null,
  durationSeconds: 3600,
  peakViewers: 120,
  totalViewers: 500,
  totalGifts: 2,
  totalGiftValue: { toString: () => '5050.00' },
  status: 'ENDED',
  metadata: {},
  createdAt: new Date('2026-07-03T12:00:00.000Z'),
  updatedAt: new Date('2026-07-04T21:00:00.000Z'),
};

const baseEvents = [
  {
    id: 'evt-start',
    organizationId: 'org-1',
    liveSessionId: 'session-1',
    creatorProfileId: 'creator-1',
    eventType: 'SESSION_STARTED',
    occurredAt: new Date('2026-07-04T20:00:00.000Z'),
    offsetMs: 0,
    platform: 'TIKTOK',
    platformEventId: null,
    externalActorId: null,
    actorDisplayName: null,
    payload: {},
    metadata: {},
    createdAt: new Date('2026-07-04T20:00:00.000Z'),
  },
  {
    id: 'evt-song',
    organizationId: 'org-1',
    liveSessionId: 'session-1',
    creatorProfileId: 'creator-1',
    eventType: 'SONG_STARTED',
    occurredAt: new Date('2026-07-04T20:01:00.000Z'),
    offsetMs: 60_000,
    platform: 'TIKTOK',
    platformEventId: null,
    externalActorId: null,
    actorDisplayName: null,
    payload: {},
    metadata: {},
    createdAt: new Date('2026-07-04T20:01:00.000Z'),
  },
  {
    id: 'evt-gift',
    organizationId: 'org-1',
    liveSessionId: 'session-1',
    creatorProfileId: 'creator-1',
    eventType: 'GIFT_RECEIVED',
    occurredAt: new Date('2026-07-04T20:01:10.000Z'),
    offsetMs: 70_000,
    platform: 'TIKTOK',
    platformEventId: null,
    externalActorId: 'gifter-1',
    actorDisplayName: 'Whale',
    payload: { giftType: 'UNIVERSE', diamondValue: 5000, text: 'hidden chat' },
    metadata: {},
    createdAt: new Date('2026-07-04T20:01:10.000Z'),
  },
  {
    id: 'evt-end',
    organizationId: 'org-1',
    liveSessionId: 'session-1',
    creatorProfileId: 'creator-1',
    eventType: 'SESSION_ENDED',
    occurredAt: new Date('2026-07-04T21:00:00.000Z'),
    offsetMs: 3_600_000,
    platform: 'TIKTOK',
    platformEventId: null,
    externalActorId: null,
    actorDisplayName: null,
    payload: {},
    metadata: {},
    createdAt: new Date('2026-07-04T21:00:00.000Z'),
  },
];

describe('LiveIntelligenceRecommendationsService', () => {
  let service: LiveIntelligenceRecommendationsService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveIntelligenceRecommendationsService,
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(LiveIntelligenceRecommendationsService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(baseSession);
    (prisma.liveEvent.findMany as jest.Mock).mockResolvedValue(baseEvents);
    (prisma.gifterSessionStats.findMany as jest.Mock).mockResolvedValue([
      {
        gifterProfileId: 'gifter-profile-1',
        giftCount: 1,
        giftValue: { toString: () => '5000' },
        gifterProfile: {
          externalGifterId: 'gifter-1',
          displayName: 'Whale',
          spendingTier: 'WHALE',
        },
      },
    ]);
    (prisma.liveSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.creatorLiveSchedule.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.gifterProfile.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.liveSession.update as jest.Mock).mockImplementation(async ({ data }) => ({
      ...baseSession,
      metadata: data.metadata,
    }));
  });

  it('generates recommendations, stores them on session metadata, and audits generation', async () => {
    const triggerAnalysis = buildSessionTriggerAnalysis(
      'session-1',
      baseEvents.map((event) => ({
        id: event.id,
        eventType: event.eventType as TriggerAnalysisEventInput['eventType'],
        occurredAt: event.occurredAt,
        offsetMs: event.offsetMs,
        externalActorId: event.externalActorId,
        actorDisplayName: event.actorDisplayName,
        payload: event.payload,
        metadata: event.metadata,
      })),
      baseSession.startedAt,
    );

    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue({
      ...baseSession,
      metadata: { triggerAnalysis },
    });

    const result = await service.generateSessionRecommendations(managerToken, 'session-1');

    expect(result.sessionId).toBe('session-1');
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0]?.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.recommendations[0]?.confidenceScore).toBeLessThanOrEqual(1);
    expect(JSON.stringify(result)).not.toContain('hidden chat');
    expect(prisma.liveSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            recommendations: expect.objectContaining({ sessionId: 'session-1' }),
          }),
        }),
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_RECOMMENDATIONS_GENERATED,
        targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
        targetId: 'session-1',
      }),
    );
  });

  it('replaces previous recommendations on rerun', async () => {
    await service.generateSessionRecommendations(managerToken, 'session-1');
    await service.generateSessionRecommendations(managerToken, 'session-1');

    expect(prisma.liveSession.update).toHaveBeenCalledTimes(2);
  });

  it('reads stored recommendations and audits view access', async () => {
    const generated = await service.generateSessionRecommendations(managerToken, 'session-1');

    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue({
      ...baseSession,
      metadata: { recommendations: generated },
    });

    const result = await service.getSessionRecommendations(managerToken, 'session-1');

    expect(result.generatedAt).toBe(generated.generatedAt);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_RECOMMENDATIONS_VIEWED,
        targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
        targetId: 'session-1',
      }),
    );
  });

  it('throws when recommendations have not been generated', async () => {
    await expect(service.getSessionRecommendations(managerToken, 'session-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws when session is outside the active organization', async () => {
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.generateSessionRecommendations(otherOrgToken, 'session-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when organization membership is inactive', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.generateSessionRecommendations(managerToken, 'session-1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
