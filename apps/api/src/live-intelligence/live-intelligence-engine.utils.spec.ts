import {
  buildIntelligenceSnapshot,
  clampIntelligenceScore,
} from './live-intelligence-engine.utils';
import { buildSessionTriggerAnalysis } from './live-intelligence-trigger-analysis.utils';

describe('live-intelligence-engine.utils', () => {
  const generatedAt = new Date('2026-07-04T21:00:00.000Z');
  const sessionStartedAt = new Date('2026-07-04T20:00:00.000Z');

  const baseSession = {
    id: 'session-1',
    creatorProfileId: 'creator-1',
    status: 'ENDED' as const,
    startedAt: sessionStartedAt,
    durationSeconds: 3600,
    totalViewers: 500,
    peakViewers: 120,
    totalGifts: 2,
    totalGiftValue: { toString: () => '5050.00' },
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
      id: 'evt-gift',
      eventType: 'GIFT_RECEIVED' as const,
      occurredAt: new Date('2026-07-04T20:01:10.000Z'),
      offsetMs: 70_000,
      externalActorId: 'gifter-1',
      actorDisplayName: 'Whale',
      payload: { giftType: 'UNIVERSE', diamondValue: 5000, text: 'secret chat body' },
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

  const topGifters = [
    {
      gifterProfileId: 'gifter-profile-1',
      externalGifterId: 'gifter-1',
      displayName: 'Whale',
      giftCount: 1,
      giftValue: 5000,
      spendingTier: 'WHALE' as const,
    },
  ];

  it('clamps intelligence scores between 0 and 100', () => {
    expect(clampIntelligenceScore(-10)).toBe(0);
    expect(clampIntelligenceScore(150)).toBe(100);
    expect(clampIntelligenceScore(42.6)).toBe(43);
  });

  it('builds deterministic intelligence snapshots for the same input', () => {
    const triggerAnalysis = buildSessionTriggerAnalysis(
      'session-1',
      baseEvents.map((event) => ({ ...event, metadata: {} })),
      sessionStartedAt,
      generatedAt,
    );

    const input = {
      session: {
        ...baseSession,
        metadata: { triggerAnalysis },
      },
      events: baseEvents,
      topGifters,
      generatedAt,
    };

    expect(buildIntelligenceSnapshot(input)).toEqual(buildIntelligenceSnapshot(input));
  });

  it('includes score bounds, strengths, risks, signals, and next actions', () => {
    const triggerAnalysis = buildSessionTriggerAnalysis(
      'session-1',
      baseEvents.map((event) => ({ ...event, metadata: {} })),
      sessionStartedAt,
      generatedAt,
    );

    const snapshot = buildIntelligenceSnapshot({
      session: {
        ...baseSession,
        metadata: { triggerAnalysis },
      },
      events: baseEvents,
      topGifters,
      generatedAt,
    });

    expect(snapshot.sessionHealthScore).toBeGreaterThanOrEqual(0);
    expect(snapshot.sessionHealthScore).toBeLessThanOrEqual(100);
    expect(snapshot.overallScore).toBeGreaterThanOrEqual(0);
    expect(snapshot.overallScore).toBeLessThanOrEqual(100);
    expect(snapshot.keyStrengths.length).toBeGreaterThan(0);
    expect(snapshot.topSignals.length).toBeGreaterThan(0);
    expect(snapshot.recommendedNextActions.length).toBeGreaterThan(0);
    expect(JSON.stringify(snapshot)).not.toContain('secret chat body');
  });

  it('handles missing trigger analysis, summary, and rollups with data quality warnings', () => {
    const snapshot = buildIntelligenceSnapshot({
      session: baseSession,
      events: baseEvents,
      topGifters: [],
      generatedAt,
    });

    expect(snapshot.dataQualityWarnings.length).toBeGreaterThan(0);
    expect(
      snapshot.dataQualityWarnings.some((warning) => warning.includes('Trigger analysis')),
    ).toBe(true);
    expect(snapshot.keyRisks.length).toBeGreaterThan(0);
  });
});
