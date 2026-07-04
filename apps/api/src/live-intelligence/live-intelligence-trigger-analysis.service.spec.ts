import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { LiveIntelligenceTriggerAnalysisService } from './live-intelligence-trigger-analysis.service';
import { TRIGGER_ANALYSIS_DISCLAIMER } from './live-intelligence-trigger-analysis.utils';

jest.mock('@kolab/database', () => ({
  prisma: {
    liveSession: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    liveEvent: {
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
  endedAt: null,
  scheduledStart: null,
  scheduledEnd: null,
  durationSeconds: null,
  peakViewers: null,
  totalViewers: null,
  totalGifts: null,
  totalGiftValue: null,
  status: 'LIVE',
  metadata: {},
  createdAt: new Date('2026-07-03T12:00:00.000Z'),
  updatedAt: new Date('2026-07-03T12:00:00.000Z'),
};

const baseEvents = [
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
    actorDisplayName: 'Fan',
    payload: { giftType: 'ROSE', diamondValue: 1500 },
    metadata: {},
    createdAt: new Date('2026-07-04T20:01:10.000Z'),
  },
];

describe('LiveIntelligenceTriggerAnalysisService', () => {
  let service: LiveIntelligenceTriggerAnalysisService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveIntelligenceTriggerAnalysisService,
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(LiveIntelligenceTriggerAnalysisService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(baseSession);
    (prisma.liveEvent.findMany as jest.Mock).mockResolvedValue(baseEvents);
    (prisma.liveSession.update as jest.Mock).mockImplementation(async ({ data }) => ({
      ...baseSession,
      metadata: data.metadata,
    }));
  });

  it('generates trigger analysis, stores it on session metadata, and audits generation', async () => {
    const result = await service.generateSessionTriggerAnalysis(managerToken, 'session-1');

    expect(result.liveSessionId).toBe('session-1');
    expect(result.summary.totalTriggers).toBeGreaterThan(0);
    expect(result.items.some((item) => item.triggerType === 'SONG_STARTED_GIFTS')).toBe(true);
    expect(result.items.every((item) => item.disclaimer === TRIGGER_ANALYSIS_DISCLAIMER)).toBe(
      true,
    );
    expect(prisma.liveSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            triggerAnalysis: expect.objectContaining({
              liveSessionId: 'session-1',
            }),
          }),
        }),
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_TRIGGER_ANALYSIS_GENERATED,
        targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
        targetId: 'session-1',
      }),
    );
  });

  it('replaces previous analysis on rerun', async () => {
    await service.generateSessionTriggerAnalysis(managerToken, 'session-1');
    await service.generateSessionTriggerAnalysis(managerToken, 'session-1');

    expect(prisma.liveSession.update).toHaveBeenCalledTimes(2);
    const firstMetadata = (prisma.liveSession.update as jest.Mock).mock.calls[0]?.[0]?.data
      ?.metadata;
    const secondMetadata = (prisma.liveSession.update as jest.Mock).mock.calls[1]?.[0]?.data
      ?.metadata;
    expect(firstMetadata.triggerAnalysis).toBeDefined();
    expect(secondMetadata.triggerAnalysis).toBeDefined();
  });

  it('reads stored trigger analysis and audits view access', async () => {
    const generated = await service.generateSessionTriggerAnalysis(managerToken, 'session-1');

    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue({
      ...baseSession,
      metadata: {
        triggerAnalysis: generated,
      },
    });

    const result = await service.getSessionTriggerAnalysis(managerToken, 'session-1');

    expect(result.summary.totalTriggers).toBe(generated.summary.totalTriggers);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_TRIGGER_ANALYSIS_VIEWED,
        targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
        targetId: 'session-1',
      }),
    );
  });

  it('throws when trigger analysis has not been generated', async () => {
    await expect(service.getSessionTriggerAnalysis(managerToken, 'session-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws when session is outside the active organization', async () => {
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.generateSessionTriggerAnalysis(otherOrgToken, 'session-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when organization membership is inactive', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.generateSessionTriggerAnalysis(managerToken, 'session-1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
