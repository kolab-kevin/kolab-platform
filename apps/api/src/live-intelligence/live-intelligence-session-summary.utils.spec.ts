import { buildLiveSessionSummary } from './live-intelligence-session-summary.utils';
import { buildSessionTriggerAnalysis } from './live-intelligence-trigger-analysis.utils';

describe('live-intelligence-session-summary.utils', () => {
  const sessionStartedAt = new Date('2026-07-04T20:00:00.000Z');
  const generatedAt = new Date('2026-07-04T21:00:00.000Z');

  const baseSession = {
    id: 'session-1',
    status: 'ENDED' as const,
    startedAt: sessionStartedAt,
    durationSeconds: 3600,
    totalViewers: 500,
    peakViewers: 120,
    totalGifts: 12,
    totalGiftValue: { toString: () => '6500.00' },
    metadata: {},
  };

  const baseEvents = [
    {
      id: 'evt-start',
      eventType: 'SESSION_STARTED' as const,
      occurredAt: new Date('2026-07-04T20:00:00.000Z'),
      offsetMs: 0,
      externalActorId: null,
      actorDisplayName: null,
      payload: {},
    },
    {
      id: 'evt-song',
      eventType: 'SONG_STARTED' as const,
      occurredAt: new Date('2026-07-04T20:01:00.000Z'),
      offsetMs: 60_000,
      externalActorId: null,
      actorDisplayName: null,
      payload: {},
    },
    {
      id: 'evt-gift-high',
      eventType: 'GIFT_RECEIVED' as const,
      occurredAt: new Date('2026-07-04T20:01:10.000Z'),
      offsetMs: 70_000,
      externalActorId: 'gifter-1',
      actorDisplayName: 'Whale',
      payload: { giftType: 'UNIVERSE', diamondValue: 5000 },
    },
    {
      id: 'evt-gift-low',
      eventType: 'GIFT_RECEIVED' as const,
      occurredAt: new Date('2026-07-04T20:01:20.000Z'),
      offsetMs: 80_000,
      externalActorId: 'gifter-2',
      actorDisplayName: 'Fan',
      payload: { giftType: 'ROSE', diamondValue: 50 },
    },
    {
      id: 'evt-chat',
      eventType: 'CHAT_MESSAGE' as const,
      occurredAt: new Date('2026-07-04T20:01:30.000Z'),
      offsetMs: 90_000,
      externalActorId: 'viewer-1',
      actorDisplayName: 'Viewer',
      payload: { text: 'secret chat body should not appear in summary' },
    },
    {
      id: 'evt-end',
      eventType: 'SESSION_ENDED' as const,
      occurredAt: new Date('2026-07-04T21:00:00.000Z'),
      offsetMs: 3_600_000,
      externalActorId: null,
      actorDisplayName: null,
      payload: {},
    },
  ];

  it('builds summary with top moments, gift events, trigger summary, and coaching notes', () => {
    const triggerAnalysis = buildSessionTriggerAnalysis(
      'session-1',
      baseEvents.map((event) => ({ ...event, metadata: {} })),
      sessionStartedAt,
    );
    const summary = buildLiveSessionSummary({
      session: {
        ...baseSession,
        metadata: {
          triggerAnalysis,
          gifterRollup: {
            processedEventIds: ['evt-gift-high'],
            lastProcessedAt: generatedAt.toISOString(),
          },
        },
      },
      events: baseEvents,
      topGifters: [
        {
          gifterProfileId: 'gifter-profile-1',
          externalGifterId: 'gifter-1',
          displayName: 'Whale',
          giftCount: 1,
          giftValue: 5000,
          spendingTier: 'WHALE',
        },
      ],
      generatedAt,
    });

    expect(summary.sessionId).toBe('session-1');
    expect(summary.topMoments.length).toBeGreaterThan(0);
    expect(summary.topGiftEvents[0]?.eventId).toBe('evt-gift-high');
    expect(summary.topGifters[0]?.gifterProfileId).toBe('gifter-profile-1');
    expect(summary.triggerSummary?.totalTriggers).toBeGreaterThan(0);
    expect(summary.coachingNotes.length).toBeGreaterThan(0);
    expect(summary.timelineHealth.status).toBe('HEALTHY');
    expect(JSON.stringify(summary)).not.toContain('secret chat body should not appear in summary');
  });

  it('adds compliance warnings when rollups and trigger analysis are missing', () => {
    const summary = buildLiveSessionSummary({
      session: baseSession,
      events: baseEvents,
      topGifters: [],
      generatedAt,
    });

    expect(summary.triggerSummary).toBeNull();
    expect(summary.complianceWarnings).toEqual(
      expect.arrayContaining([
        'Gifter rollups have not been processed for this session.',
        'Trigger analysis has not been generated; triggerSummary is omitted.',
      ]),
    );
  });
});
