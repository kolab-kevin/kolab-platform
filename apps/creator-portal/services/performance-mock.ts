import type { PerformanceWorkspaceData } from '@/types/performance-adapters';

export function createMockPerformanceScore(creatorProfileId: string): PerformanceWorkspaceData {
  return {
    creatorProfileId,
    generatedAt: new Date().toISOString(),
    overallScore: 78,
    scoreBand: 'GOOD',
    reliabilityScore: 80,
    revenueScore: 76,
    engagementScore: 74,
    consistencyScore: 77,
    complianceScore: 92,
    campaignExecutionScore: 85,
    growthScore: 82,
    riskScore: 18,
    strengths: ['Consistency signals appear strong across recent live sessions.'],
    risks: ['Campaign deliverable timeliness could improve.'],
    recommendedActions: [
      'Maintain current live and campaign patterns while monitoring correlated performance signals.',
    ],
    dataQualityWarnings: [],
    trendDirection: 'IMPROVING',
  };
}
