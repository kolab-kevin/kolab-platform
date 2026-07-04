import type {
  CreatorComplianceOverallStatus,
  CreatorIntelligenceProfile,
  CreatorLiveTrendSnapshot,
} from '@kolab/types';

import type { CreatorSessionInput } from '../live-intelligence/live-intelligence-creator-profile.utils';
import {
  buildCreatorPerformanceScore,
  clampPerformanceScore,
} from './creators-performance-score.utils';

describe('creators-performance-score.utils', () => {
  const generatedAt = new Date('2026-07-04T21:00:00.000Z');

  const intelligenceProfile: CreatorIntelligenceProfile = {
    creatorProfileId: 'creator-1',
    generatedAt: generatedAt.toISOString(),
    sessionsAnalyzed: 10,
    dateRange: { from: '2026-06-01T00:00:00.000Z', to: '2026-07-04T00:00:00.000Z' },
    creatorHealthScore: 82,
    revenueTrendScore: 80,
    engagementTrendScore: 76,
    gifterRetentionScore: 70,
    consistencyScore: 78,
    campaignReadinessScore: 72,
    overallScore: 76,
    strongestTriggerTypes: [],
    weakestTriggerTypes: [],
    topGifters: [],
    bestLivePatterns: [],
    riskSignals: [],
    coachingPriorities: [],
    recommendedNextActions: ['Repeat high-performing live segments.'],
    dataQualityWarnings: [],
  };

  const liveTrendSnapshot: CreatorLiveTrendSnapshot = {
    creatorProfileId: 'creator-1',
    generatedAt: generatedAt.toISOString(),
    sessionsAnalyzed: 10,
    dateRange: { from: '2026-06-01T00:00:00.000Z', to: '2026-07-04T00:00:00.000Z' },
    revenueTrend: {
      metric: 'revenue',
      direction: 'UP',
      currentValue: 80,
      previousValue: 60,
      percentChange: 33.33,
      confidenceScore: 0.85,
      evidence: [],
    },
    engagementTrend: {
      metric: 'engagement',
      direction: 'UP',
      currentValue: 75,
      previousValue: 65,
      percentChange: 15.38,
      confidenceScore: 0.85,
      evidence: [],
    },
    consistencyTrend: {
      metric: 'consistency',
      direction: 'FLAT',
      currentValue: 78,
      previousValue: 76,
      percentChange: 2.63,
      confidenceScore: 0.85,
      evidence: [],
    },
    gifterQualityTrend: {
      metric: 'gifterQuality',
      direction: 'UP',
      currentValue: 70,
      previousValue: 60,
      percentChange: 16.67,
      confidenceScore: 0.85,
      evidence: [],
    },
    triggerEffectivenessTrend: {
      metric: 'triggerEffectiveness',
      direction: 'UP',
      currentValue: 40,
      previousValue: 25,
      percentChange: 60,
      confidenceScore: 0.85,
      evidence: [],
    },
    overallDirection: 'IMPROVING',
    trendSignals: [],
    regressionRisks: [],
    positiveMomentum: ['Engagement shows positive momentum in the recent session window.'],
    recommendedFocusAreas: [],
    dataQualityWarnings: [],
  };

  const sessions: CreatorSessionInput[] = [
    {
      id: 'session-1',
      startedAt: new Date('2026-07-04T20:00:00.000Z'),
      endedAt: new Date('2026-07-04T21:00:00.000Z'),
      status: 'ENDED',
      campaignId: 'campaign-1',
      totalViewers: 500,
      peakViewers: 120,
      totalGifts: 5,
      totalGiftValue: { toString: () => '5000.00' },
      metadata: {},
    },
  ];

  const baseInput = {
    creatorProfileId: 'creator-1',
    intelligenceProfile,
    liveTrendSnapshot,
    sessions,
    complianceStatus: 'COMPLIANT' as CreatorComplianceOverallStatus,
    onboardingStatus: 'COMPLETE' as const,
    campaignAssignments: [{ status: 'COMPLETED' }],
    campaignDeliverables: [{ status: 'APPROVED' }],
    recentActivitySessionCount: 3,
    generatedAt,
  };

  it('clamps performance scores between 0 and 100', () => {
    expect(clampPerformanceScore(-10)).toBe(0);
    expect(clampPerformanceScore(150)).toBe(100);
  });

  it('builds a bounded performance score with score band', () => {
    const score = buildCreatorPerformanceScore(baseInput);

    expect(score.overallScore).toBeGreaterThanOrEqual(0);
    expect(score.overallScore).toBeLessThanOrEqual(100);
    expect(['EXCELLENT', 'GOOD', 'FAIR']).toContain(score.scoreBand);
    expect(score.strengths.length).toBeGreaterThan(0);
    expect(JSON.stringify(score)).not.toContain('secret chat transcript');
  });

  it('assigns score bands based on overall score thresholds', () => {
    const excellent = buildCreatorPerformanceScore({
      ...baseInput,
      intelligenceProfile: {
        ...intelligenceProfile,
        revenueTrendScore: 95,
        engagementTrendScore: 95,
        consistencyScore: 95,
        overallScore: 95,
      },
      complianceStatus: 'COMPLIANT',
      campaignAssignments: [{ status: 'COMPLETED' }, { status: 'COMPLETED' }],
      campaignDeliverables: [{ status: 'APPROVED' }, { status: 'APPROVED' }],
      recentActivitySessionCount: 5,
    });

    expect(excellent.scoreBand).toBe('EXCELLENT');
  });

  it('heavily reduces score when compliance fails', () => {
    const score = buildCreatorPerformanceScore({
      ...baseInput,
      complianceStatus: 'NON_COMPLIANT',
    });

    expect(score.complianceScore).toBeLessThanOrEqual(20);
    expect(score.overallScore).toBeLessThanOrEqual(35);
    expect(['NEEDS_ATTENTION', 'HIGH_RISK']).toContain(score.scoreBand);
    expect(score.risks.some((risk) => risk.includes('Compliance'))).toBe(true);
  });

  it('increases campaign execution score when deliverables are approved', () => {
    const lowExecution = buildCreatorPerformanceScore({
      ...baseInput,
      campaignAssignments: [{ status: 'ASSIGNED' }],
      campaignDeliverables: [{ status: 'ASSIGNED' }],
    });
    const highExecution = buildCreatorPerformanceScore({
      ...baseInput,
      campaignAssignments: [{ status: 'COMPLETED' }, { status: 'COMPLETED' }],
      campaignDeliverables: [{ status: 'APPROVED' }, { status: 'APPROVED' }],
    });

    expect(highExecution.campaignExecutionScore).toBeGreaterThan(
      lowExecution.campaignExecutionScore,
    );
  });

  it('increases growth score when live trends are improving', () => {
    const improving = buildCreatorPerformanceScore(baseInput);
    const declining = buildCreatorPerformanceScore({
      ...baseInput,
      liveTrendSnapshot: {
        ...liveTrendSnapshot,
        overallDirection: 'DECLINING',
        positiveMomentum: [],
        regressionRisks: ['Gift revenue may be weakening compared with the prior session window.'],
      },
    });

    expect(improving.growthScore).toBeGreaterThan(declining.growthScore);
  });

  it('increases risk score when trends decline and compliance is at risk', () => {
    const lowRisk = buildCreatorPerformanceScore(baseInput);
    const highRisk = buildCreatorPerformanceScore({
      ...baseInput,
      complianceStatus: 'AT_RISK',
      liveTrendSnapshot: {
        ...liveTrendSnapshot,
        overallDirection: 'DECLINING',
        regressionRisks: ['Engagement may be weakening compared with the prior session window.'],
      },
      intelligenceProfile: {
        ...intelligenceProfile,
        riskSignals: ['Some analyzed sessions show little or no correlated gift revenue.'],
      },
    });

    expect(highRisk.riskScore).toBeGreaterThan(lowRisk.riskScore);
  });

  it('returns insufficient data band when core inputs are missing', () => {
    const score = buildCreatorPerformanceScore({
      creatorProfileId: 'creator-1',
      intelligenceProfile: null,
      liveTrendSnapshot: null,
      sessions: [],
      complianceStatus: null,
      onboardingStatus: 'INCOMPLETE',
      campaignAssignments: [],
      campaignDeliverables: [],
      recentActivitySessionCount: 0,
      generatedAt,
    });

    expect(score.scoreBand).toBe('INSUFFICIENT_DATA');
    expect(score.dataQualityWarnings.length).toBeGreaterThan(0);
  });

  it('adds warnings when intelligence and trend snapshots are missing', () => {
    const score = buildCreatorPerformanceScore({
      ...baseInput,
      intelligenceProfile: null,
      liveTrendSnapshot: null,
    });

    expect(
      score.dataQualityWarnings.some((warning) => warning.includes('intelligence profile')),
    ).toBe(true);
    expect(
      score.dataQualityWarnings.some((warning) => warning.includes('live trend snapshot')),
    ).toBe(true);
  });
});
