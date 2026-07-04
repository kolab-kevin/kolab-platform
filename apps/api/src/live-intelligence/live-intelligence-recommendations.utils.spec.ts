import {
  buildSessionRecommendations,
  clampConfidenceScore,
  deriveRecommendationPriority,
} from './live-intelligence-recommendations.utils';
import { buildSessionTriggerAnalysis } from './live-intelligence-trigger-analysis.utils';

describe('live-intelligence-recommendations.utils', () => {
  const generatedAt = new Date('2026-07-04T21:00:00.000Z');
  const sessionStartedAt = new Date('2026-07-04T20:00:00.000Z');

  const baseSession = {
    id: 'session-1',
    creatorProfileId: 'creator-1',
    campaignId: null as string | null,
    status: 'ENDED' as const,
    startedAt: sessionStartedAt,
    durationSeconds: 3600,
    metadata: {},
  };

  const songGiftEvents = [
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
      payload: { giftType: 'UNIVERSE', diamondValue: 5000 },
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

  it('clamps confidence scores between 0 and 1', () => {
    expect(clampConfidenceScore(-0.5)).toBe(0);
    expect(clampConfidenceScore(1.5)).toBe(1);
    expect(clampConfidenceScore(0.4567)).toBe(0.46);
  });

  it('derives priority from confidence and recommendation impact', () => {
    expect(deriveRecommendationPriority(0.9, 'TRY_MUSIC')).toBe('HIGH');
    expect(deriveRecommendationPriority(0.5, 'IMPROVE_CONSISTENCY')).toBe('LOW');
    expect(deriveRecommendationPriority(0.55, 'THANK_TOP_SUPPORTERS')).toBe('MEDIUM');
  });

  it('builds deterministic recommendations for the same input', () => {
    const triggerAnalysis = buildSessionTriggerAnalysis(
      'session-1',
      songGiftEvents.map((event) => ({ ...event, metadata: {} })),
      sessionStartedAt,
      generatedAt,
    );

    const input = {
      session: {
        ...baseSession,
        metadata: { triggerAnalysis },
      },
      events: songGiftEvents,
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
      recentSessions: [],
      schedules: [],
      absentWhales: [],
      generatedAt,
    };

    const first = buildSessionRecommendations(input);
    const second = buildSessionRecommendations(input);

    expect(first).toEqual(second);
    expect(first.recommendations.length).toBeGreaterThan(0);
    expect(first.recommendations.every((item) => item.confidenceScore >= 0)).toBe(true);
    expect(first.recommendations.every((item) => item.confidenceScore <= 1)).toBe(true);
  });

  it('includes TRY_MUSIC and THANK_TOP_SUPPORTERS from trigger and whale rollups', () => {
    const triggerAnalysis = buildSessionTriggerAnalysis(
      'session-1',
      songGiftEvents.map((event) => ({ ...event, metadata: {} })),
      sessionStartedAt,
      generatedAt,
    );

    const result = buildSessionRecommendations({
      session: {
        ...baseSession,
        metadata: { triggerAnalysis },
      },
      events: songGiftEvents,
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
      recentSessions: [],
      schedules: [],
      absentWhales: [],
      generatedAt,
    });

    const types = result.recommendations.map((item) => item.recommendationType);
    expect(types).toContain('TRY_MUSIC');
    expect(types).toContain('THANK_TOP_SUPPORTERS');
  });

  it('includes RUN_CAMPAIGN_PROMOTION when campaign is linked but no campaign moments exist', () => {
    const result = buildSessionRecommendations({
      session: {
        ...baseSession,
        campaignId: 'campaign-1',
      },
      events: songGiftEvents,
      topGifters: [],
      recentSessions: [],
      schedules: [],
      absentWhales: [],
      generatedAt,
    });

    expect(result.recommendations.map((item) => item.recommendationType)).toContain(
      'RUN_CAMPAIGN_PROMOTION',
    );
  });

  it('includes FOLLOW_UP_WITH_WHALES when absent whales are provided', () => {
    const result = buildSessionRecommendations({
      session: baseSession,
      events: songGiftEvents,
      topGifters: [],
      recentSessions: [],
      schedules: [],
      absentWhales: [
        {
          gifterProfileId: 'whale-1',
          externalGifterId: 'whale-ext-1',
          displayName: 'Absent Whale',
          lastSessionId: 'session-prev',
          lastGiftValue: 2500,
        },
      ],
      generatedAt,
    });

    const recommendation = result.recommendations.find(
      (item) => item.recommendationType === 'FOLLOW_UP_WITH_WHALES',
    );

    expect(recommendation?.supportingEvidence.join(' ')).toContain('Absent Whale');
  });
});
