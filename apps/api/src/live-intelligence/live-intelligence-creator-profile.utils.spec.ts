import { buildCreatorIntelligenceProfile } from './live-intelligence-creator-profile.utils';
import { clampIntelligenceScore } from './live-intelligence-engine.utils';

describe('live-intelligence-creator-profile.utils', () => {
  const generatedAt = new Date('2026-07-04T21:00:00.000Z');

  const intelligenceSnapshot = {
    sessionId: 'session-1',
    creatorProfileId: 'creator-1',
    generatedAt: generatedAt.toISOString(),
    sessionHealthScore: 88,
    revenueScore: 85,
    engagementScore: 72,
    consistencyScore: 80,
    gifterQualityScore: 70,
    coachingOpportunityScore: 24,
    overallScore: 78,
    keyStrengths: ['Gift revenue correlated strongly with captured timeline activity.'],
    keyRisks: ['Gift velocity may have declined during the session window.'],
    topSignals: [
      {
        signalType: 'HIGH_VALUE_GIFT',
        label: 'High-value gift received',
        value: 5000,
        relatedEventIds: ['evt-gift'],
      },
    ],
    topGifters: [
      {
        gifterProfileId: 'gifter-profile-1',
        externalGifterId: 'gifter-1',
        displayName: 'Whale',
        giftCount: 2,
        giftValue: 6000,
        spendingTier: 'WHALE',
      },
    ],
    topTriggerTypes: [{ triggerType: 'SONG_STARTED_GIFTS', count: 2 }],
    bestMoments: [
      {
        type: 'HIGH_VALUE_GIFT',
        label: 'High-value gift moment',
        offsetMs: 70_000,
        eventIds: ['evt-gift'],
      },
    ],
    weakMoments: [
      {
        type: 'LOW_GIFT_ACTIVITY',
        label: 'No gift events captured in timeline',
        offsetMs: null,
        eventIds: [],
      },
    ],
    recommendedNextActions: ['Repeat music segments that drove gifts.'],
    dataQualityWarnings: [],
  };

  it('clamps creator intelligence scores between 0 and 100', () => {
    expect(clampIntelligenceScore(-5)).toBe(0);
    expect(clampIntelligenceScore(120)).toBe(100);
  });

  it('aggregates multiple sessions into a creator profile', () => {
    const profile = buildCreatorIntelligenceProfile({
      creatorProfileId: 'creator-1',
      sessions: [
        {
          id: 'session-1',
          startedAt: new Date('2026-06-01T20:00:00.000Z'),
          endedAt: new Date('2026-06-01T21:00:00.000Z'),
          status: 'ENDED',
          campaignId: 'campaign-1',
          totalViewers: 400,
          peakViewers: 100,
          totalGifts: 5,
          totalGiftValue: { toString: () => '3000.00' },
          metadata: { intelligenceSnapshot },
        },
        {
          id: 'session-2',
          startedAt: new Date('2026-07-01T20:00:00.000Z'),
          endedAt: new Date('2026-07-01T21:00:00.000Z'),
          status: 'ENDED',
          campaignId: null,
          totalViewers: 600,
          peakViewers: 150,
          totalGifts: 8,
          totalGiftValue: { toString: () => '7000.00' },
          metadata: {
            intelligenceSnapshot: {
              ...intelligenceSnapshot,
              sessionId: 'session-2',
              revenueScore: 90,
              engagementScore: 80,
              overallScore: 82,
            },
          },
        },
      ],
      gifterAggregates: [
        {
          gifterProfileId: 'gifter-profile-1',
          externalGifterId: 'gifter-1',
          displayName: 'Whale',
          giftCount: 10,
          giftValue: 12_000,
          spendingTier: 'WHALE',
          sessionCount: 2,
        },
      ],
      generatedAt,
    });

    expect(profile.sessionsAnalyzed).toBe(2);
    expect(profile.overallScore).toBeGreaterThanOrEqual(0);
    expect(profile.overallScore).toBeLessThanOrEqual(100);
    expect(profile.topGifters[0]?.sessionCount).toBe(2);
    expect(profile.strongestTriggerTypes.length).toBeGreaterThan(0);
    expect(profile.recommendedNextActions.length).toBeGreaterThan(0);
    expect(profile.riskSignals.length + profile.coachingPriorities.length).toBeGreaterThan(0);
  });

  it('handles no sessions with warnings and low scores', () => {
    const profile = buildCreatorIntelligenceProfile({
      creatorProfileId: 'creator-1',
      sessions: [],
      gifterAggregates: [],
      generatedAt,
    });

    expect(profile.sessionsAnalyzed).toBe(0);
    expect(profile.overallScore).toBe(0);
    expect(profile.dataQualityWarnings).toContain('No live sessions were found for this creator.');
    expect(profile.recommendedNextActions[0]).toContain('Schedule and ingest live sessions');
  });

  it('handles missing session snapshots with data quality warnings', () => {
    const profile = buildCreatorIntelligenceProfile({
      creatorProfileId: 'creator-1',
      sessions: [
        {
          id: 'session-1',
          startedAt: new Date('2026-07-01T20:00:00.000Z'),
          endedAt: new Date('2026-07-01T21:00:00.000Z'),
          status: 'ENDED',
          campaignId: null,
          totalViewers: 100,
          peakViewers: 20,
          totalGifts: 1,
          totalGiftValue: { toString: () => '500.00' },
          metadata: {},
        },
      ],
      gifterAggregates: [],
      generatedAt,
    });

    expect(
      profile.dataQualityWarnings.some((warning) => warning.includes('intelligence snapshots')),
    ).toBe(true);
    expect(JSON.stringify(profile)).not.toContain('secret chat');
  });
});
