import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { LiveIntelligenceGifterRollupsService } from './live-intelligence-gifter-rollups.service';

const tx = {
  gifterProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  gifterSessionStats: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  liveSession: {
    update: jest.fn(),
  },
};

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
    $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx)),
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
  Prisma: {
    Decimal: class Decimal {
      private value: number;

      constructor(value: number | string) {
        this.value = Number(value);
      }

      add(other: { toNumber?: () => number } | number | string) {
        const otherValue =
          typeof other === 'object' && other !== null && typeof other.toNumber === 'function'
            ? other.toNumber()
            : Number(other);
        return new (this.constructor as typeof Decimal)(this.value + otherValue);
      }

      toNumber() {
        return this.value;
      }

      toString() {
        return this.value.toString();
      }
    },
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
  totalGifts: 0,
  totalGiftValue: { toString: () => '0', toNumber: () => 0 },
  status: 'LIVE',
  metadata: {},
  createdAt: new Date('2026-07-03T12:00:00.000Z'),
  updatedAt: new Date('2026-07-03T12:00:00.000Z'),
};

describe('LiveIntelligenceGifterRollupsService', () => {
  let service: LiveIntelligenceGifterRollupsService;
  let auditService: jest.Mocked<AuditService>;
  let profileState: Record<string, unknown> | null;
  let sessionStatsState: Record<string, unknown> | null;

  beforeEach(async () => {
    profileState = null;
    sessionStatsState = null;

    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveIntelligenceGifterRollupsService,
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(LiveIntelligenceGifterRollupsService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(baseSession);

    tx.gifterProfile.findUnique.mockImplementation(async () => profileState);
    tx.gifterSessionStats.findUnique.mockImplementation(async () => sessionStatsState);
    tx.gifterProfile.create.mockImplementation(async ({ data }) => {
      profileState = { id: 'gifter-1', metadata: {}, ...data };
      return profileState;
    });
    tx.gifterProfile.update.mockImplementation(async ({ data }) => {
      profileState = { ...profileState, ...data };
      return profileState;
    });
    tx.gifterSessionStats.create.mockImplementation(async ({ data }) => {
      sessionStatsState = { id: 'stats-1', ...data };
      return sessionStatsState;
    });
    tx.gifterSessionStats.update.mockImplementation(async ({ data }) => {
      sessionStatsState = { ...sessionStatsState, ...data };
      return sessionStatsState;
    });
    tx.liveSession.update.mockResolvedValue(baseSession);
  });

  it('processes gift, chat, and viewer events into profile and session stats', async () => {
    (prisma.liveEvent.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'evt-join',
        eventType: 'VIEWER_JOINED',
        occurredAt: new Date('2026-07-04T20:00:00.000Z'),
        creatorProfileId: 'creator-1',
        externalActorId: 'gifter-1',
        actorDisplayName: 'Fan123',
        payload: {},
      },
      {
        id: 'evt-gift',
        eventType: 'GIFT_RECEIVED',
        occurredAt: new Date('2026-07-04T20:05:00.000Z'),
        creatorProfileId: 'creator-1',
        externalActorId: 'gifter-1',
        actorDisplayName: 'Fan123',
        payload: { giftType: 'ROSE', quantity: 2, diamondValue: 250 },
      },
      {
        id: 'evt-chat',
        eventType: 'CHAT_MESSAGE',
        occurredAt: new Date('2026-07-04T20:06:00.000Z'),
        creatorProfileId: 'creator-1',
        externalActorId: 'gifter-1',
        actorDisplayName: 'Fan123',
        payload: { text: 'great stream!' },
      },
      {
        id: 'evt-leave',
        eventType: 'VIEWER_LEFT',
        occurredAt: new Date('2026-07-04T20:30:00.000Z'),
        creatorProfileId: 'creator-1',
        externalActorId: 'gifter-1',
        actorDisplayName: 'Fan123',
        payload: {},
      },
    ]);

    const result = await service.processGifterRollups(managerToken, 'session-1');

    expect(result.processedEventCount).toBe(4);
    expect(result.skippedEventCount).toBe(0);
    expect(result.profilesUpdated).toBe(4);
    expect(result.sessionStatsUpdated).toBe(4);
    expect(profileState).toEqual(
      expect.objectContaining({
        totalGiftCount: 2,
        spendingTier: 'MEDIUM',
        favoriteGiftType: 'ROSE',
        favoriteCreatorProfileId: 'creator-1',
        totalSessions: 1,
      }),
    );
    expect(sessionStatsState).toEqual(
      expect.objectContaining({
        chatMessageCount: 1,
        giftCount: 2,
      }),
    );
    expect(tx.liveSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalGifts: 2,
          metadata: expect.objectContaining({
            gifterRollup: expect.objectContaining({
              processedEventIds: ['evt-join', 'evt-gift', 'evt-chat', 'evt-leave'],
            }),
          }),
        }),
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.LIVE_GIFTER_ROLLUP_PROCESSED,
        targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
        targetId: 'session-1',
      }),
    );
  });

  it('is idempotent when rerunning with the same checkpoint', async () => {
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue({
      ...baseSession,
      metadata: {
        gifterRollup: {
          processedEventIds: ['evt-gift'],
          lastProcessedAt: '2026-07-04T20:05:00.000Z',
        },
      },
    });
    (prisma.liveEvent.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'evt-gift',
        eventType: 'GIFT_RECEIVED',
        occurredAt: new Date('2026-07-04T20:05:00.000Z'),
        creatorProfileId: 'creator-1',
        externalActorId: 'gifter-1',
        actorDisplayName: 'Fan123',
        payload: { giftType: 'ROSE', quantity: 2, diamondValue: 250 },
      },
    ]);

    const result = await service.processGifterRollups(managerToken, 'session-1');

    expect(result.processedEventCount).toBe(0);
    expect(result.skippedEventCount).toBe(1);
    expect(tx.gifterProfile.create).not.toHaveBeenCalled();
    expect(tx.gifterProfile.update).not.toHaveBeenCalled();
  });

  it('does not store raw chat text in profile metadata', async () => {
    (prisma.liveEvent.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'evt-chat',
        eventType: 'CHAT_MESSAGE',
        occurredAt: new Date('2026-07-04T20:06:00.000Z'),
        creatorProfileId: 'creator-1',
        externalActorId: 'gifter-1',
        actorDisplayName: 'Fan123',
        payload: { text: 'secret message body' },
      },
    ]);

    await service.processGifterRollups(managerToken, 'session-1');

    const createCall = tx.gifterProfile.create.mock.calls.at(-1)?.[0];
    expect(JSON.stringify(createCall?.data.metadata ?? {})).not.toContain('secret message body');
  });

  it('throws when session is outside the active organization', async () => {
    (prisma.liveSession.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.processGifterRollups(otherOrgToken, 'session-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws when organization membership is inactive', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.processGifterRollups(managerToken, 'session-1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
