import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { LiveIntelligenceEventsService } from './live-intelligence-events.service';
import { assertSafeLiveEventPayload } from './live-intelligence-events.utils';

jest.mock('@kolab/database', () => ({
  prisma: {
    liveSession: {
      findFirst: jest.fn(),
    },
    liveEvent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;

      constructor(message: string, code: string) {
        super(message);
        this.code = code;
      }
    },
  },
}));

import type { AccessTokenPayload } from '@kolab/auth';
import { prisma } from '@kolab/database';
import { BatchIngestLiveEventsSchema } from '@kolab/types';

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

const baseEvent = {
  id: 'event-1',
  organizationId: 'org-1',
  liveSessionId: 'session-1',
  creatorProfileId: 'creator-1',
  eventType: 'GIFT_RECEIVED',
  occurredAt: new Date('2026-07-04T20:05:00.000Z'),
  offsetMs: 300000,
  platform: 'TIKTOK',
  platformEventId: 'tt-gift-1',
  externalActorId: 'gifter-1',
  actorDisplayName: 'Fan123',
  payload: { giftType: 'ROSE', quantity: 5 },
  metadata: {},
  createdAt: new Date('2026-07-04T20:05:01.000Z'),
};

const ingestInput = {
  creatorProfileId: 'creator-1',
  eventType: 'GIFT_RECEIVED' as const,
  occurredAt: '2026-07-04T20:05:00.000Z',
  offsetMs: 300000,
  platformEventId: 'tt-gift-1',
  externalActorId: 'gifter-1',
  actorDisplayName: 'Fan123',
  payload: { giftType: 'ROSE', quantity: 5 },
};

describe('LiveIntelligenceEventsService', () => {
  let service: LiveIntelligenceEventsService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [LiveIntelligenceEventsService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(LiveIntelligenceEventsService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(baseSession);
  });

  it('ingests a single event and records audit metadata', async () => {
    (prisma.liveEvent.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.liveEvent.create as jest.Mock).mockResolvedValue(baseEvent);

    const result = await service.ingestEvent(managerToken, 'session-1', ingestInput);

    expect(result.created).toBe(true);
    expect(result.event.platformEventId).toBe('tt-gift-1');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_EVENT_INGESTED,
        targetType: AUDIT_TARGET_TYPE.LIVE_EVENT,
        targetId: 'event-1',
      }),
    );
  });

  it('returns existing event idempotently for duplicate platformEventId', async () => {
    (prisma.liveEvent.findUnique as jest.Mock).mockResolvedValue(baseEvent);

    const result = await service.ingestEvent(managerToken, 'session-1', ingestInput);

    expect(result.created).toBe(false);
    expect(result.event.id).toBe('event-1');
    expect(prisma.liveEvent.create).not.toHaveBeenCalled();
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('ingests batch events in order and records batch audit', async () => {
    (prisma.liveEvent.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.liveEvent.create as jest.Mock)
      .mockResolvedValueOnce({ ...baseEvent, id: 'event-1', platformEventId: 'gift-1' })
      .mockResolvedValueOnce({
        ...baseEvent,
        id: 'event-2',
        platformEventId: 'gift-2',
        eventType: 'CHAT_MESSAGE',
        payload: { text: 'hello' },
      });

    const result = await service.ingestEventBatch(managerToken, 'session-1', {
      events: [
        ingestInput,
        {
          ...ingestInput,
          platformEventId: 'gift-2',
          eventType: 'CHAT_MESSAGE',
          payload: { text: 'hello' },
        },
      ],
    });

    expect(result.items).toHaveLength(2);
    expect(result.createdCount).toBe(2);
    expect(result.duplicateCount).toBe(0);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_EVENT_BATCH_INGESTED,
        targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
        metadata: expect.objectContaining({ createdCount: 2, duplicateCount: 0 }),
      }),
    );
  });

  it('lists session timeline ordered for replay', async () => {
    (prisma.liveEvent.findMany as jest.Mock).mockResolvedValue([baseEvent]);

    const result = await service.listSessionEvents(managerToken, 'session-1', { limit: 100 });

    expect(result.items).toHaveLength(1);
    expect(prisma.liveEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          liveSessionId: 'session-1',
        }),
        orderBy: [{ occurredAt: 'asc' }, { offsetMs: 'asc' }, { id: 'asc' }],
      }),
    );
  });

  it('rejects cross-organization session access', async () => {
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.ingestEvent(otherOrgToken, 'session-1', ingestInput)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects mismatched creatorProfileId', async () => {
    await expect(
      service.ingestEvent(managerToken, 'session-1', {
        ...ingestInput,
        creatorProfileId: 'creator-2',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects mismatched platform without explicit override', async () => {
    await expect(
      service.ingestEvent(managerToken, 'session-1', {
        ...ingestInput,
        platform: 'BIGO',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows mismatched platform when allowPlatformMismatch is true', async () => {
    (prisma.liveEvent.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.liveEvent.create as jest.Mock).mockResolvedValue({
      ...baseEvent,
      platform: 'BIGO',
    });

    const result = await service.ingestEvent(managerToken, 'session-1', {
      ...ingestInput,
      platform: 'BIGO',
      allowPlatformMismatch: true,
    });

    expect(result.created).toBe(true);
    expect(result.event.platform).toBe('BIGO');
  });

  it('requires active organization membership', async () => {
    await expect(
      service.listSessionEvents({ ...managerToken, organizationId: undefined }, 'session-1', {
        limit: 100,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects batch ingest over 100 events at validation layer', () => {
    const result = BatchIngestLiveEventsSchema.safeParse({
      events: Array.from({ length: 101 }, () => ingestInput),
    });

    expect(result.success).toBe(false);
  });
});

describe('live event payload safety', () => {
  it('rejects raw audio data URLs and base64 blobs', () => {
    expect(() =>
      assertSafeLiveEventPayload({
        clip: 'data:audio/wav;base64,abc',
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      assertSafeLiveEventPayload({
        blob: 'A'.repeat(5000),
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      assertSafeLiveEventPayload({
        nested: { audioData: 'secret' },
      }),
    ).toThrow(BadRequestException);
  });
});
