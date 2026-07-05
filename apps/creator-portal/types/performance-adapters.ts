import type { CreatorPerformanceScore, LiveTrendOverallDirection } from '@kolab/types';

export type PerformanceWorkspaceData = CreatorPerformanceScore & {
  trendDirection?: LiveTrendOverallDirection | null;
};

export type PerformanceComponentScore = {
  key: keyof Pick<
    CreatorPerformanceScore,
    | 'reliabilityScore'
    | 'revenueScore'
    | 'engagementScore'
    | 'consistencyScore'
    | 'complianceScore'
    | 'campaignExecutionScore'
    | 'growthScore'
    | 'riskScore'
  >;
  label: string;
  value: number;
};

export function toPerformanceComponentScores(
  score: CreatorPerformanceScore,
): PerformanceComponentScore[] {
  return [
    { key: 'reliabilityScore', label: 'Reliability', value: score.reliabilityScore },
    { key: 'revenueScore', label: 'Revenue', value: score.revenueScore },
    { key: 'engagementScore', label: 'Engagement', value: score.engagementScore },
    { key: 'consistencyScore', label: 'Consistency', value: score.consistencyScore },
    { key: 'complianceScore', label: 'Compliance', value: score.complianceScore },
    {
      key: 'campaignExecutionScore',
      label: 'Campaign Execution',
      value: score.campaignExecutionScore,
    },
    { key: 'growthScore', label: 'Growth', value: score.growthScore },
    { key: 'riskScore', label: 'Risk', value: score.riskScore },
  ];
}

export function formatScoreBand(band: CreatorPerformanceScore['scoreBand']): string {
  return band.replaceAll('_', ' ');
}

export function formatTrendDirection(
  direction: LiveTrendOverallDirection | null | undefined,
): string {
  if (!direction) return 'Not available';
  return direction.replaceAll('_', ' ');
}
