import {
  buildCreatorLiveTrendSnapshot,
  clampTrendConfidence,
} from './live-intelligence-live-trends.utils';

describe('live-intelligence-live-trends.utils', () => {
  const generatedAt = new Date('2026-07-04T21:00:00.000Z');

  const buildSnapshot = (revenueScore: number, sessionId: string) => ({
    sessionId,
    creatorProfileId: 'creator-1',
    generatedAt: generatedAt.toISOString(),
    sessionHealthScore: revenueScore,
    revenueScore,
    engagementScore: revenueScore,
    consistencyScore: revenueScore,
    gifterQualityScore: revenueScore,
    coachingOpportunityScore: 20,
    overallScore: revenueScore,
    keyStrengths: [],
    keyRisks: [],
    topSignals: [],
    topGifters: [],
    topTriggerTypes: [{ triggerType: 'SONG_STARTED_GIFTS', count: revenueScore >= 80 ? 5 : 1 }],
    bestMoments: [],
    weakMoments: [],
    recommendedNextActions: [],
    dataQualityWarnings: [],
  });

  const buildSession = (
    id: string,
    startedAt: Date,
    revenueScore: number,
    metadata: Record<string, unknown> = {},
  ) => ({
    id,
    startedAt,
    endedAt: new Date(startedAt.getTime() + 3_600_000),
    status: 'ENDED',
    campaignId: null,
    totalViewers: revenueScore * 10,
    peakViewers: revenueScore * 2,
    totalGifts: 5,
    totalGiftValue: { toString: () => `${revenueScore * 100}.00` },
    metadata: {
      intelligenceSnapshot: buildSnapshot(revenueScore, id),
      ...metadata,
    },
  });

  it('clamps confidence scores between 0 and 1', () => {
    expect(clampTrendConfidence(-0.2)).toBe(0);
    expect(clampTrendConfidence(1.5)).toBe(1);
  });

  it('detects improving trends across recent and prior windows', () => {
    const sessions = [
      ...Array.from({ length: 5 }, (_, index) =>
        buildSession(`recent-${index}`, new Date(`2026-07-0${index + 1}T20:00:00.000Z`), 90),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        buildSession(`prior-${index}`, new Date(`2026-06-0${index + 1}T20:00:00.000Z`), 40),
      ),
    ];

    const snapshot = buildCreatorLiveTrendSnapshot({
      creatorProfileId: 'creator-1',
      sessions,
      generatedAt,
    });

    expect(snapshot.overallDirection).toBe('IMPROVING');
    expect(snapshot.revenueTrend.direction).toBe('UP');
    expect(snapshot.positiveMomentum.length).toBeGreaterThan(0);
  });

  it('detects declining trends across recent and prior windows', () => {
    const sessions = [
      ...Array.from({ length: 5 }, (_, index) =>
        buildSession(`recent-${index}`, new Date(`2026-07-0${index + 1}T20:00:00.000Z`), 30),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        buildSession(`prior-${index}`, new Date(`2026-06-0${index + 1}T20:00:00.000Z`), 90),
      ),
    ];

    const snapshot = buildCreatorLiveTrendSnapshot({
      creatorProfileId: 'creator-1',
      sessions,
      generatedAt,
    });

    expect(snapshot.overallDirection).toBe('DECLINING');
    expect(snapshot.revenueTrend.direction).toBe('DOWN');
    expect(snapshot.regressionRisks.length).toBeGreaterThan(0);
  });

  it('detects stable trends when windows are similar', () => {
    const sessions = [
      ...Array.from({ length: 5 }, (_, index) =>
        buildSession(`recent-${index}`, new Date(`2026-07-0${index + 1}T20:00:00.000Z`), 70),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        buildSession(`prior-${index}`, new Date(`2026-06-0${index + 1}T20:00:00.000Z`), 68),
      ),
    ];

    const snapshot = buildCreatorLiveTrendSnapshot({
      creatorProfileId: 'creator-1',
      sessions,
      generatedAt,
    });

    expect(snapshot.overallDirection).toBe('STABLE');
    expect(snapshot.revenueTrend.direction).toBe('FLAT');
  });

  it('returns insufficient data when fewer than three sessions exist', () => {
    const snapshot = buildCreatorLiveTrendSnapshot({
      creatorProfileId: 'creator-1',
      sessions: [
        buildSession('session-1', new Date('2026-07-01T20:00:00.000Z'), 80),
        buildSession('session-2', new Date('2026-06-01T20:00:00.000Z'), 70),
      ],
      generatedAt,
    });

    expect(snapshot.overallDirection).toBe('INSUFFICIENT_DATA');
    expect(snapshot.sessionsAnalyzed).toBe(2);
  });

  it('handles missing session snapshots with warnings and without crashing', () => {
    const snapshot = buildCreatorLiveTrendSnapshot({
      creatorProfileId: 'creator-1',
      sessions: [
        {
          id: 'session-1',
          startedAt: new Date('2026-07-04T20:00:00.000Z'),
          endedAt: new Date('2026-07-04T21:00:00.000Z'),
          status: 'ENDED',
          campaignId: null,
          totalViewers: 500,
          peakViewers: 120,
          totalGifts: 2,
          totalGiftValue: { toString: () => '5000.00' },
          metadata: {},
        },
        buildSession('session-2', new Date('2026-07-03T20:00:00.000Z'), 70),
        buildSession('session-3', new Date('2026-07-02T20:00:00.000Z'), 65),
      ],
      generatedAt,
    });

    expect(
      snapshot.dataQualityWarnings.some((warning) => warning.includes('intelligence snapshots')),
    ).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain('secret chat transcript');
  });

  it('keeps metric confidence scores within bounds', () => {
    const snapshot = buildCreatorLiveTrendSnapshot({
      creatorProfileId: 'creator-1',
      sessions: Array.from({ length: 10 }, (_, index) =>
        buildSession(
          `session-${index}`,
          new Date(`2026-07-${String(index + 1).padStart(2, '0')}T20:00:00.000Z`),
          75,
        ),
      ),
      generatedAt,
    });

    for (const metric of [
      snapshot.revenueTrend,
      snapshot.engagementTrend,
      snapshot.consistencyTrend,
      snapshot.gifterQualityTrend,
      snapshot.triggerEffectivenessTrend,
    ]) {
      expect(metric.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(metric.confidenceScore).toBeLessThanOrEqual(1);
    }
  });
});
