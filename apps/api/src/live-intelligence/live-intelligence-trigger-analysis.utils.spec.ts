import {
  buildSessionTriggerAnalysis,
  TRIGGER_ANALYSIS_DISCLAIMER,
} from './live-intelligence-trigger-analysis.utils';

describe('live-intelligence-trigger-analysis.utils', () => {
  const sessionStartedAt = new Date('2026-07-04T20:00:00.000Z');
  const generatedAt = new Date('2026-07-04T21:00:00.000Z');

  it('detects song, dance, performance, and PK correlated gift windows', () => {
    const analysis = buildSessionTriggerAnalysis(
      'session-1',
      [
        {
          id: 'evt-song',
          eventType: 'SONG_STARTED',
          occurredAt: new Date('2026-07-04T20:01:00.000Z'),
          offsetMs: 60_000,
          payload: {},
          metadata: {},
        },
        {
          id: 'evt-dance',
          eventType: 'DANCE_MOMENT',
          occurredAt: new Date('2026-07-04T20:02:00.000Z'),
          offsetMs: 120_000,
          payload: {},
          metadata: {},
        },
        {
          id: 'evt-performance',
          eventType: 'PERFORMANCE_MOMENT',
          occurredAt: new Date('2026-07-04T20:03:00.000Z'),
          offsetMs: 180_000,
          payload: {},
          metadata: {},
        },
        {
          id: 'evt-pk',
          eventType: 'PK_STARTED',
          occurredAt: new Date('2026-07-04T20:04:00.000Z'),
          offsetMs: 240_000,
          payload: {},
          metadata: {},
        },
        {
          id: 'evt-gift-song',
          eventType: 'GIFT_RECEIVED',
          occurredAt: new Date('2026-07-04T20:01:10.000Z'),
          offsetMs: 70_000,
          payload: { giftType: 'ROSE', diamondValue: 50 },
          metadata: {},
        },
        {
          id: 'evt-gift-dance',
          eventType: 'GIFT_RECEIVED',
          occurredAt: new Date('2026-07-04T20:02:05.000Z'),
          offsetMs: 125_000,
          payload: { giftType: 'ROSE', diamondValue: 75 },
          metadata: {},
        },
        {
          id: 'evt-gift-performance',
          eventType: 'GIFT_RECEIVED',
          occurredAt: new Date('2026-07-04T20:03:05.000Z'),
          offsetMs: 185_000,
          payload: { giftType: 'ROSE', diamondValue: 80 },
          metadata: {},
        },
        {
          id: 'evt-gift-pk',
          eventType: 'GIFT_RECEIVED',
          occurredAt: new Date('2026-07-04T20:04:05.000Z'),
          offsetMs: 245_000,
          payload: { giftType: 'ROSE', diamondValue: 90 },
          metadata: {},
        },
      ],
      sessionStartedAt,
      generatedAt,
    );

    expect(analysis.items.map((item) => item.triggerType)).toEqual(
      expect.arrayContaining([
        'SONG_STARTED_GIFTS',
        'DANCE_MOMENT_GIFTS',
        'PERFORMANCE_MOMENT_GIFTS',
        'PK_STARTED_GIFTS',
      ]),
    );
    expect(analysis.items.every((item) => item.disclaimer === TRIGGER_ANALYSIS_DISCLAIMER)).toBe(
      true,
    );
  });

  it('detects acknowledgement, gift spike, and high value gift triggers', () => {
    const analysis = buildSessionTriggerAnalysis(
      'session-1',
      [
        {
          id: 'evt-ack',
          eventType: 'PERFORMANCE_MOMENT',
          occurredAt: new Date('2026-07-04T20:05:00.000Z'),
          offsetMs: 300_000,
          payload: { momentType: 'ACKNOWLEDGEMENT' },
          metadata: {},
        },
        {
          id: 'evt-gift-ack',
          eventType: 'GIFT_RECEIVED',
          occurredAt: new Date('2026-07-04T20:05:10.000Z'),
          offsetMs: 310_000,
          payload: { giftType: 'ROSE', diamondValue: 40 },
          metadata: {},
        },
        {
          id: 'evt-gift-spike-1',
          eventType: 'GIFT_RECEIVED',
          occurredAt: new Date('2026-07-04T20:06:00.000Z'),
          offsetMs: 360_000,
          payload: { giftType: 'ROSE', diamondValue: 10 },
          metadata: {},
        },
        {
          id: 'evt-gift-spike-2',
          eventType: 'GIFT_RECEIVED',
          occurredAt: new Date('2026-07-04T20:06:10.000Z'),
          offsetMs: 370_000,
          payload: { giftType: 'ROSE', diamondValue: 20 },
          metadata: {},
        },
        {
          id: 'evt-gift-spike-3',
          eventType: 'GIFT_RECEIVED',
          occurredAt: new Date('2026-07-04T20:06:20.000Z'),
          offsetMs: 380_000,
          payload: { giftType: 'ROSE', diamondValue: 30 },
          metadata: {},
        },
        {
          id: 'evt-gift-whale',
          eventType: 'GIFT_RECEIVED',
          occurredAt: new Date('2026-07-04T20:07:00.000Z'),
          offsetMs: 420_000,
          payload: { giftType: 'UNIVERSE', diamondValue: 5000 },
          metadata: {},
        },
      ],
      sessionStartedAt,
      generatedAt,
    );

    expect(analysis.items.map((item) => item.triggerType)).toEqual(
      expect.arrayContaining(['ACTOR_ACKNOWLEDGEMENT_GIFTS', 'GIFT_SPIKE', 'HIGH_VALUE_GIFT']),
    );
  });

  it('keeps confidence scores within 0-1 bounds', () => {
    const analysis = buildSessionTriggerAnalysis(
      'session-1',
      [
        {
          id: 'evt-song',
          eventType: 'SONG_STARTED',
          occurredAt: new Date('2026-07-04T20:01:00.000Z'),
          offsetMs: 60_000,
          payload: {},
          metadata: {},
        },
        ...Array.from({ length: 6 }, (_, index) => ({
          id: `evt-gift-${index}`,
          eventType: 'GIFT_RECEIVED' as const,
          occurredAt: new Date(`2026-07-04T20:01:${String(index + 1).padStart(2, '0')}.000Z`),
          offsetMs: 61_000 + index * 1000,
          payload: { giftType: 'ROSE', diamondValue: 1000 + index * 1000 },
          metadata: {},
        })),
      ],
      sessionStartedAt,
      generatedAt,
    );

    for (const item of analysis.items) {
      expect(item.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(item.confidenceScore).toBeLessThanOrEqual(1);
    }
  });
});
