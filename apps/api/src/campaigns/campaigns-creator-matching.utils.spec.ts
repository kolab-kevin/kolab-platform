import type { CampaignType, CreatorPerformanceScore } from '@kolab/types';

import {
  buildCampaignCreatorMatches,
  deriveCreatorComplianceForMatching,
  extractCampaignMatchRequirements,
} from './campaigns-creator-matching.utils';

describe('campaigns-creator-matching.utils', () => {
  const generatedAt = new Date('2026-07-04T21:00:00.000Z');

  const performanceScore: CreatorPerformanceScore = {
    creatorProfileId: 'creator-1',
    generatedAt: generatedAt.toISOString(),
    overallScore: 82,
    scoreBand: 'GOOD',
    reliabilityScore: 80,
    revenueScore: 78,
    engagementScore: 76,
    consistencyScore: 77,
    complianceScore: 92,
    campaignExecutionScore: 85,
    growthScore: 80,
    riskScore: 15,
    strengths: [],
    risks: [],
    recommendedActions: [],
    dataQualityWarnings: [],
  };

  const baseCandidate = {
    creatorProfileId: 'creator-1',
    displayName: 'Creator One',
    country: 'US',
    languages: ['en'],
    metadata: {
      skills: {
        categories: ['beauty'],
        skills: ['makeup'],
        contentTypes: ['live'],
        languages: ['en'],
      },
    },
    availability: { timezone: 'America/New_York' },
    platformAccounts: [{ platform: 'TIKTOK', status: 'ACTIVE' }],
    performanceScore,
    liveTrendSnapshot: {
      creatorProfileId: 'creator-1',
      generatedAt: generatedAt.toISOString(),
      sessionsAnalyzed: 6,
      dateRange: { from: null, to: null },
      revenueTrend: {
        metric: 'revenue',
        direction: 'UP' as const,
        currentValue: 80,
        previousValue: 60,
        percentChange: 33,
        confidenceScore: 0.8,
        evidence: [],
      },
      engagementTrend: {
        metric: 'engagement',
        direction: 'UP' as const,
        currentValue: 75,
        previousValue: 65,
        percentChange: 15,
        confidenceScore: 0.8,
        evidence: [],
      },
      consistencyTrend: {
        metric: 'consistency',
        direction: 'FLAT' as const,
        currentValue: 78,
        previousValue: 76,
        percentChange: 2,
        confidenceScore: 0.8,
        evidence: [],
      },
      gifterQualityTrend: {
        metric: 'gifterQuality',
        direction: 'UP' as const,
        currentValue: 70,
        previousValue: 60,
        percentChange: 16,
        confidenceScore: 0.8,
        evidence: [],
      },
      triggerEffectivenessTrend: {
        metric: 'triggerEffectiveness',
        direction: 'UP' as const,
        currentValue: 40,
        previousValue: 25,
        percentChange: 60,
        confidenceScore: 0.8,
        evidence: [],
      },
      overallDirection: 'IMPROVING' as const,
      trendSignals: [],
      regressionRisks: [],
      positiveMomentum: [],
      recommendedFocusAreas: [],
      dataQualityWarnings: [],
    },
    complianceStatus: 'COMPLIANT' as const,
    completedCampaignCount: 2,
  };

  it('extracts campaign match requirements from requirements and brief metadata', () => {
    const requirements = extractCampaignMatchRequirements(
      { platforms: ['TIKTOK'], skills: ['makeup'], countries: ['US'] },
      { languages: ['en'] },
    );

    expect(requirements.platforms).toEqual(['tiktok']);
    expect(requirements.skills).toEqual(['makeup']);
    expect(requirements.countries).toEqual(['us']);
    expect(requirements.languages).toEqual(['en']);
  });

  it('builds bounded match scores with recommendation bands', () => {
    const snapshot = buildCampaignCreatorMatches({
      campaignId: 'campaign-1',
      campaignType: 'LIVE_STREAM',
      requirements: {
        platforms: ['TIKTOK'],
        skills: ['makeup'],
        countries: ['US'],
        languages: ['en'],
        contentTypes: ['live'],
      },
      brief: {},
      candidates: [baseCandidate],
      generatedAt,
    });

    expect(snapshot.matches[0].score).toBeGreaterThanOrEqual(0);
    expect(snapshot.matches[0].score).toBeLessThanOrEqual(100);
    expect(['STRONG_MATCH', 'GOOD_MATCH']).toContain(snapshot.matches[0].recommendationBand);
    expect(snapshot.matches[0].reasons.length).toBeGreaterThan(0);
    expect(JSON.stringify(snapshot)).not.toContain('secret chat transcript');
  });

  it('strongly penalizes non-compliant creators', () => {
    const compliant = buildCampaignCreatorMatches({
      campaignId: 'campaign-1',
      campaignType: 'BRAND_DEAL',
      requirements: { platforms: ['TIKTOK'] },
      brief: {},
      candidates: [baseCandidate],
      generatedAt,
    });
    const nonCompliant = buildCampaignCreatorMatches({
      campaignId: 'campaign-1',
      campaignType: 'BRAND_DEAL',
      requirements: { platforms: ['TIKTOK'] },
      brief: {},
      candidates: [{ ...baseCandidate, complianceStatus: 'NON_COMPLIANT' }],
      generatedAt,
    });

    expect(nonCompliant.matches[0].score).toBeLessThan(compliant.matches[0].score);
    expect(nonCompliant.matches[0].recommendationBand).toBe('NOT_RECOMMENDED');
  });

  it('prefers creators with matching platforms and skills', () => {
    const strongMatch = buildCampaignCreatorMatches({
      campaignId: 'campaign-1',
      campaignType: 'LIVE_STREAM',
      requirements: { platforms: ['TIKTOK'], skills: ['makeup'], contentTypes: ['live'] },
      brief: {},
      candidates: [baseCandidate],
      generatedAt,
    });
    const weakMatch = buildCampaignCreatorMatches({
      campaignId: 'campaign-1',
      campaignType: 'LIVE_STREAM',
      requirements: { platforms: ['BIGO'], skills: ['gaming'] },
      brief: {},
      candidates: [baseCandidate],
      generatedAt,
    });

    expect(strongMatch.matches[0].score).toBeGreaterThan(weakMatch.matches[0].score);
    expect(strongMatch.matches[0].relevantPlatforms).toContain('TIKTOK');
  });

  it('uses performance score impact when available', () => {
    const withScore = buildCampaignCreatorMatches({
      campaignId: 'campaign-1',
      campaignType: 'BRAND_DEAL' as CampaignType,
      requirements: {},
      brief: {},
      candidates: [baseCandidate],
      generatedAt,
    });
    const withoutScore = buildCampaignCreatorMatches({
      campaignId: 'campaign-1',
      campaignType: 'BRAND_DEAL',
      requirements: {},
      brief: {},
      candidates: [{ ...baseCandidate, performanceScore: null }],
      generatedAt,
    });

    expect(withScore.matches[0].score).toBeGreaterThan(withoutScore.matches[0].score);
    expect(withScore.matches[0].performanceScoreSummary?.overallScore).toBe(82);
    expect(withoutScore.matches[0].missingData).toContain(
      'No stored creator performance score was found.',
    );
  });

  it('derives compliance status from performance score compliance component', () => {
    expect(
      deriveCreatorComplianceForMatching({
        performanceScore: { ...performanceScore, complianceScore: 15 },
        hasApprovedGovernmentId: true,
        hasSignedAgreement: true,
      }),
    ).toBe('NON_COMPLIANT');
    expect(
      deriveCreatorComplianceForMatching({
        performanceScore: null,
        hasApprovedGovernmentId: false,
        hasSignedAgreement: true,
      }),
    ).toBe('NON_COMPLIANT');
  });
});
