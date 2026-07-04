import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { LiveIntelligenceTimelineService } from './live-intelligence-timeline.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    liveSession: {
      findFirst: jest.fn(),
    },
    liveEvent: {
      findMany: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
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
    id: 'evt-1',
    organizationId: 'org-1',
    liveSessionId: 'session-1',
    creatorProfileId: 'creator-1',
    eventType: 'VIEWER_JOINED',
    occurredAt: new Date('2026-07-04T20:00:10.000Z'),
    offsetMs: 10_000,
    platform: 'TIKTOK',
    platformEventId: null,
    externalActorId: 'viewer-1',
    actorDisplayName: 'Viewer',
    payload: {},
    metadata: {},
    createdAt: new Date('2026-07-04T20:00:10.000Z'),
  },
  {
    id: 'evt-2',
    organizationId: 'org-1',
    liveSessionId: 'session-1',
    creatorProfileId: 'creator-1',
    eventType: 'GIFT_RECEIVED',
    occurredAt: new Date('2026-07-04T20:00:30.000Z'),
    offsetMs: 30_000,
    platform: 'TIKTOK',
    platformEventId: null,
    externalActorId: 'gifter-1',
    actorDisplayName: 'Fan',
    payload: { giftType: 'ROSE', quantity: 1, diamondValue: 150 },
    metadata: {},
    createdAt: new Date('2026-07-04T20:00:30.000Z'),
  },
  {
    id: 'evt-3',
    organizationId: 'org-1',
    liveSessionId: 'session-1',
    creatorProfileId: 'creator-1',
    eventType: 'PK_STARTED',
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
];

describe('LiveIntelligenceTimelineService', () => {
  let service: LiveIntelligenceTimelineService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveIntelligenceTimelineService,
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(LiveIntelligenceTimelineService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(baseSession);
    (prisma.liveEvent.findMany as jest.Mock).mockResolvedValue(baseEvents);
  });

  it('returns timeline events in chronological order with pagination', async () => {
    (prisma.liveEvent.findMany as jest.Mock).mockResolvedValue([
      ...baseEvents,
      { ...baseEvents[2], id: 'evt-4' },
    ]);

    const result = await service.getSessionTimeline(managerToken, 'session-1', {
      limit: 2,
    });

    expect(result.liveSessionId).toBe('session-1');
    expect(result.items).toHaveLength(2);
    expect(result.items.map((event) => event.id)).toEqual(['evt-1', 'evt-2']);
    expect(result.nextCursor).toBe('evt-2');
    expect(prisma.liveEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ occurredAt: 'asc' }, { offsetMs: 'asc' }, { id: 'asc' }],
        take: 3,
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_TIMELINE_VIEWED,
        targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
        targetId: 'session-1',
      }),
    );
  });

  it('applies timeline filters for event type, actor, and offset range', async () => {
    await service.getSessionTimeline(managerToken, 'session-1', {
      limit: 100,
      eventType: 'GIFT_RECEIVED',
      actorId: 'gifter-1',
      fromOffsetMs: 20_000,
      toOffsetMs: 40_000,
    });

    expect(prisma.liveEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 'org-1',
          liveSessionId: 'session-1',
          eventType: 'GIFT_RECEIVED',
          externalActorId: 'gifter-1',
          offsetMs: {
            gte: 20_000,
            lte: 40_000,
          },
        },
      }),
    );
  });

  it('returns replay segments grouped by offset windows', async () => {
    const result = await service.getSessionReplay(managerToken, 'session-1');

    expect(result.liveSessionId).toBe('session-1');
    expect(result.segmentDurationMs).toBe(60_000);
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0]?.events.map((event) => event.id)).toEqual(['evt-1', 'evt-2']);
    expect(result.segments[1]?.events.map((event) => event.id)).toEqual(['evt-3']);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_REPLAY_VIEWED,
        targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
        targetId: 'session-1',
      }),
    );
  });

  it('returns deterministic session highlights', async () => {
    const result = await service.getSessionHighlights(managerToken, 'session-1');

    expect(result.liveSessionId).toBe('session-1');
    expect(result.items.map((item) => item.type)).toContain('PK_STARTED');
  });

  it('throws when session is outside the active organization', async () => {
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.getSessionTimeline(otherOrgToken, 'session-1', { limit: 20 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when organization membership is inactive', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.getSessionReplay(managerToken, 'session-1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
