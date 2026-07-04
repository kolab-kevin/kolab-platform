import { Prisma } from '@kolab/database';

import {
  applyRollupEvent,
  calculateSpendingTier,
  createInitialAccumulator,
  parseGifterRollupCheckpoint,
  parseGiftPayload,
} from './live-intelligence-gifter-rollups.utils';

describe('live-intelligence-gifter-rollups.utils', () => {
  const occurredAt = new Date('2026-07-04T20:05:00.000Z');
  const sessionId = 'session-1';

  it('calculates spending tiers from total gift value', () => {
    expect(calculateSpendingTier(new Prisma.Decimal(0))).toBe('UNKNOWN');
    expect(calculateSpendingTier(new Prisma.Decimal(50))).toBe('LOW');
    expect(calculateSpendingTier(new Prisma.Decimal(500))).toBe('MEDIUM');
    expect(calculateSpendingTier(new Prisma.Decimal(5000))).toBe('HIGH');
    expect(calculateSpendingTier(new Prisma.Decimal(25000))).toBe('WHALE');
    expect(calculateSpendingTier(new Prisma.Decimal(75000))).toBe('VIP');
  });

  it('parses gift payload without storing chat text', () => {
    const parsed = parseGiftPayload({
      giftType: 'ROSE',
      quantity: 3,
      diamondValue: 150,
      message: 'hello there',
    });

    expect(parsed.giftType).toBe('ROSE');
    expect(parsed.giftCount).toBe(3);
    expect(parsed.giftValue.toNumber()).toBe(150);
  });

  it('processes gift, chat, and viewer events into rollups', () => {
    let accumulator = createInitialAccumulator('Fan123', occurredAt);

    accumulator = applyRollupEvent(
      accumulator,
      {
        id: 'evt-gift',
        eventType: 'GIFT_RECEIVED',
        occurredAt,
        creatorProfileId: 'creator-1',
        externalActorId: 'gifter-1',
        actorDisplayName: 'Fan123',
        payload: { giftType: 'ROSE', quantity: 2, diamondValue: 250 },
      },
      sessionId,
    );

    accumulator = applyRollupEvent(
      accumulator,
      {
        id: 'evt-chat',
        eventType: 'CHAT_MESSAGE',
        occurredAt: new Date('2026-07-04T20:06:00.000Z'),
        creatorProfileId: 'creator-1',
        externalActorId: 'gifter-1',
        actorDisplayName: 'Fan123',
        payload: { text: 'great stream!' },
      },
      sessionId,
    );

    accumulator = applyRollupEvent(
      accumulator,
      {
        id: 'evt-join',
        eventType: 'VIEWER_JOINED',
        occurredAt: new Date('2026-07-04T20:00:00.000Z'),
        creatorProfileId: 'creator-1',
        externalActorId: 'gifter-1',
        actorDisplayName: 'Fan123',
        payload: {},
      },
      sessionId,
    );

    accumulator = applyRollupEvent(
      accumulator,
      {
        id: 'evt-leave',
        eventType: 'VIEWER_LEFT',
        occurredAt: new Date('2026-07-04T20:30:00.000Z'),
        creatorProfileId: 'creator-1',
        externalActorId: 'gifter-1',
        actorDisplayName: 'Fan123',
        payload: {},
      },
      sessionId,
    );

    expect(accumulator.totalGiftCount).toBe(2);
    expect(accumulator.totalGiftValue.toNumber()).toBe(250);
    expect(accumulator.totalSessions).toBe(1);
    expect(accumulator.favoriteGiftType).toBe('ROSE');
    expect(accumulator.favoriteCreatorProfileId).toBe('creator-1');
    expect(accumulator.sessionStats.chatMessageCount).toBe(1);
    expect(accumulator.sessionStats.giftCount).toBe(2);
    expect(accumulator.sessionStats.firstSeenAt?.toISOString()).toBe('2026-07-04T20:00:00.000Z');
    expect(accumulator.sessionStats.lastSeenAt?.toISOString()).toBe('2026-07-04T20:30:00.000Z');
    expect(calculateSpendingTier(accumulator.totalGiftValue)).toBe('MEDIUM');
  });

  it('parses rollup checkpoint metadata', () => {
    expect(
      parseGifterRollupCheckpoint({
        gifterRollup: {
          processedEventIds: ['evt-1', 'evt-2'],
          lastProcessedAt: '2026-07-04T20:05:00.000Z',
        },
      }),
    ).toEqual({
      processedEventIds: ['evt-1', 'evt-2'],
      lastProcessedAt: '2026-07-04T20:05:00.000Z',
    });
  });
});
