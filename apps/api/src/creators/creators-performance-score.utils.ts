import type {
  CreatorComplianceOverallStatus,
  CreatorIntelligenceProfile,
  CreatorLiveTrendSnapshot,
  CreatorOnboardingOverallStatus,
  CreatorPerformanceScore,
  CreatorPerformanceScoreBand,
} from '@kolab/types';
import { CreatorPerformanceScoreSchema } from '@kolab/types';

import type { CreatorSessionInput } from '../live-intelligence/live-intelligence-creator-profile.utils';
import { clampIntelligenceScore } from '../live-intelligence/live-intelligence-engine.utils';

export const CREATOR_PERFORMANCE_SCORE_METADATA_KEY = 'performanceScore';

export type CampaignAssignmentInput = {
  status: string;
};

export type CampaignDeliverableInput = {
  status: string;
};

export type BuildCreatorPerformanceScoreInput = {
  creatorProfileId: string;
  intelligenceProfile: CreatorIntelligenceProfile | null;
  liveTrendSnapshot: CreatorLiveTrendSnapshot | null;
  sessions: CreatorSessionInput[];
  complianceStatus: CreatorComplianceOverallStatus | null;
  onboardingStatus: CreatorOnboardingOverallStatus | null;
  campaignAssignments: CampaignAssignmentInput[];
  campaignDeliverables: CampaignDeliverableInput[];
  recentActivitySessionCount: number;
  generatedAt?: Date;
};

export function buildCreatorPerformanceScore(
  input: BuildCreatorPerformanceScoreInput,
): CreatorPerformanceScore {
  const generatedAt = input.generatedAt ?? new Date();
  const warnings: string[] = [];

  if (!input.intelligenceProfile) {
    warnings.push(
      'No stored creator intelligence profile was found; session rollups were used where available.',
    );
  }

  if (!input.liveTrendSnapshot) {
    warnings.push(
      'No stored live trend snapshot was found; growth and risk signals may be limited.',
    );
  }

  if (input.sessions.length === 0) {
    warnings.push('No live session history was found for this creator.');
  }

  if (input.complianceStatus === null) {
    warnings.push('Compliance status could not be fully evaluated.');
  }

  if (input.campaignAssignments.length === 0) {
    warnings.push('No campaign assignments were found for this creator.');
  }

  const reliabilityScore = computeReliabilityScore(input, warnings);
  const revenueScore = computeRevenueScore(input);
  const engagementScore = computeEngagementScore(input);
  const consistencyScore = computeConsistencyScore(input);
  const complianceScore = computeComplianceScore(input.complianceStatus, warnings);
  const campaignExecutionScore = computeCampaignExecutionScore(
    input.campaignAssignments,
    input.campaignDeliverables,
    warnings,
  );
  const growthScore = computeGrowthScore(input.liveTrendSnapshot, warnings);
  const riskScore = computeRiskScore(input);

  let overallScore = clampPerformanceScore(
    Math.round(
      reliabilityScore * 0.12 +
        revenueScore * 0.14 +
        engagementScore * 0.12 +
        consistencyScore * 0.12 +
        complianceScore * 0.2 +
        campaignExecutionScore * 0.12 +
        growthScore * 0.1 +
        (100 - riskScore) * 0.08,
    ),
  );

  if (input.complianceStatus === 'NON_COMPLIANT') {
    overallScore = Math.min(overallScore, 35);
  }

  const insufficientData = isInsufficientData(input);
  const scoreBand = deriveScoreBand(overallScore, insufficientData, input.complianceStatus);

  return {
    creatorProfileId: input.creatorProfileId,
    generatedAt: generatedAt.toISOString(),
    overallScore: insufficientData ? 0 : overallScore,
    scoreBand,
    reliabilityScore,
    revenueScore,
    engagementScore,
    consistencyScore,
    complianceScore,
    campaignExecutionScore,
    growthScore,
    riskScore,
    strengths: buildStrengths(input, {
      reliabilityScore,
      revenueScore,
      engagementScore,
      consistencyScore,
      complianceScore,
      campaignExecutionScore,
      growthScore,
    }),
    risks: buildRisks(input, riskScore),
    recommendedActions: buildRecommendedActions(input, {
      complianceScore,
      campaignExecutionScore,
      growthScore,
      riskScore,
    }),
    dataQualityWarnings: [...new Set(warnings)].slice(0, 10),
  };
}

export function parseCreatorPerformanceScore(
  creatorProfileId: string,
  metadata: unknown,
): CreatorPerformanceScore | null {
  const record = toRecord(metadata);
  const snapshot = record[CREATOR_PERFORMANCE_SCORE_METADATA_KEY];

  if (typeof snapshot !== 'object' || snapshot === null || Array.isArray(snapshot)) {
    return null;
  }

  const parsed = CreatorPerformanceScoreSchema.safeParse({
    ...snapshot,
    creatorProfileId,
  });

  if (!parsed.success || parsed.data.creatorProfileId !== creatorProfileId) {
    return null;
  }

  return parsed.data;
}

export function clampPerformanceScore(value: number): number {
  return clampIntelligenceScore(value);
}

function computeReliabilityScore(
  input: BuildCreatorPerformanceScoreInput,
  warnings: string[],
): number {
  const consistencyBase =
    input.intelligenceProfile?.consistencyScore ??
    computeSessionConsistencyFallback(input.sessions);
  const onboardingBoost =
    input.onboardingStatus === 'COMPLETE' ? 12 : input.onboardingStatus === 'WARNING' ? 4 : 0;
  const activityBoost = Math.min(18, input.recentActivitySessionCount * 4);

  if (input.onboardingStatus === 'INCOMPLETE') {
    warnings.push('Incomplete onboarding may correlate with lower reliability signals.');
  }

  return clampPerformanceScore(consistencyBase * 0.65 + onboardingBoost + activityBoost);
}

function computeRevenueScore(input: BuildCreatorPerformanceScoreInput): number {
  if (input.intelligenceProfile) {
    return clampPerformanceScore(input.intelligenceProfile.revenueTrendScore);
  }

  if (input.sessions.length === 0) {
    return 0;
  }

  const averageRevenue =
    input.sessions.reduce((sum, session) => sum + resolveSessionRevenueProxy(session), 0) /
    input.sessions.length;

  return clampPerformanceScore(Math.min(100, averageRevenue / 50));
}

function computeEngagementScore(input: BuildCreatorPerformanceScoreInput): number {
  if (input.intelligenceProfile) {
    return clampPerformanceScore(input.intelligenceProfile.engagementTrendScore);
  }

  if (input.sessions.length === 0) {
    return 0;
  }

  const averageEngagement =
    input.sessions.reduce((sum, session) => sum + computeEngagementFallback(session), 0) /
    input.sessions.length;

  return clampPerformanceScore(averageEngagement);
}

function computeConsistencyScore(input: BuildCreatorPerformanceScoreInput): number {
  if (input.intelligenceProfile) {
    return clampPerformanceScore(input.intelligenceProfile.consistencyScore);
  }

  return computeSessionConsistencyFallback(input.sessions);
}

function computeComplianceScore(
  complianceStatus: CreatorComplianceOverallStatus | null,
  warnings: string[],
): number {
  switch (complianceStatus) {
    case 'COMPLIANT':
      return 92;
    case 'AT_RISK':
      return 58;
    case 'NON_COMPLIANT':
      warnings.push('Compliance failures are heavily reducing the creator performance score.');
      return 15;
    default:
      return 40;
  }
}

function computeCampaignExecutionScore(
  assignments: CampaignAssignmentInput[],
  deliverables: CampaignDeliverableInput[],
  warnings: string[],
): number {
  if (assignments.length === 0) {
    return 45;
  }

  const completedAssignments = assignments.filter((assignment) =>
    ['COMPLETED'].includes(assignment.status),
  ).length;
  const activeAssignments = assignments.filter((assignment) =>
    ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(assignment.status),
  ).length;
  const assignmentRatio = completedAssignments / assignments.length;

  if (deliverables.length === 0) {
    warnings.push('Campaign assignments exist but no deliverables were found.');
    return clampPerformanceScore(assignmentRatio * 70 + (activeAssignments > 0 ? 10 : 0));
  }

  const approvedDeliverables = deliverables.filter(
    (deliverable) => deliverable.status === 'APPROVED',
  ).length;
  const submittedDeliverables = deliverables.filter((deliverable) =>
    ['SUBMITTED', 'APPROVED'].includes(deliverable.status),
  ).length;
  const deliverableRatio = approvedDeliverables / deliverables.length;
  const submissionRatio = submittedDeliverables / deliverables.length;

  return clampPerformanceScore(assignmentRatio * 40 + deliverableRatio * 45 + submissionRatio * 15);
}

function computeGrowthScore(
  liveTrendSnapshot: CreatorLiveTrendSnapshot | null,
  warnings: string[],
): number {
  if (!liveTrendSnapshot) {
    return 45;
  }

  switch (liveTrendSnapshot.overallDirection) {
    case 'IMPROVING':
      return clampPerformanceScore(
        78 + Math.min(12, liveTrendSnapshot.positiveMomentum.length * 3),
      );
    case 'STABLE':
      return 58;
    case 'DECLINING':
      warnings.push('Recent live trend signals suggest declining correlated performance.');
      return 32;
    case 'INSUFFICIENT_DATA':
      warnings.push('Live trend snapshot had insufficient data for growth scoring.');
      return 45;
    default:
      return 45;
  }
}

function computeRiskScore(input: BuildCreatorPerformanceScoreInput): number {
  let risk = 0;

  if (input.complianceStatus === 'NON_COMPLIANT') {
    risk += 45;
  } else if (input.complianceStatus === 'AT_RISK') {
    risk += 22;
  }

  if (input.liveTrendSnapshot?.overallDirection === 'DECLINING') {
    risk += 28;
  } else if (input.liveTrendSnapshot?.overallDirection === 'INSUFFICIENT_DATA') {
    risk += 8;
  }

  risk += Math.min(20, (input.liveTrendSnapshot?.regressionRisks.length ?? 0) * 5);
  risk += Math.min(15, (input.intelligenceProfile?.riskSignals.length ?? 0) * 4);

  if (input.recentActivitySessionCount === 0 && input.sessions.length > 0) {
    risk += 10;
  }

  return clampPerformanceScore(risk);
}

function deriveScoreBand(
  overallScore: number,
  insufficientData: boolean,
  complianceStatus: CreatorComplianceOverallStatus | null,
): CreatorPerformanceScoreBand {
  if (insufficientData) {
    return 'INSUFFICIENT_DATA';
  }

  if (complianceStatus === 'NON_COMPLIANT') {
    return overallScore < 25 ? 'HIGH_RISK' : 'NEEDS_ATTENTION';
  }

  if (overallScore >= 85) {
    return 'EXCELLENT';
  }
  if (overallScore >= 70) {
    return 'GOOD';
  }
  if (overallScore >= 55) {
    return 'FAIR';
  }
  if (overallScore >= 40) {
    return 'NEEDS_ATTENTION';
  }
  return 'HIGH_RISK';
}

function isInsufficientData(input: BuildCreatorPerformanceScoreInput): boolean {
  return (
    input.sessions.length === 0 &&
    input.campaignAssignments.length === 0 &&
    input.intelligenceProfile === null &&
    input.liveTrendSnapshot === null &&
    input.onboardingStatus === 'INCOMPLETE'
  );
}

function buildStrengths(
  input: BuildCreatorPerformanceScoreInput,
  scores: Record<string, number>,
): string[] {
  const strengths = new Set<string>();

  if (scores.complianceScore >= 90) {
    strengths.add('Compliance signals appear strong across onboarding and documentation checks.');
  }
  if (scores.campaignExecutionScore >= 75) {
    strengths.add(
      'Campaign execution signals correlate with completed assignments and deliverables.',
    );
  }
  if (scores.growthScore >= 75) {
    strengths.add('Recent live trends suggest positive momentum across analyzed sessions.');
  }
  if (scores.revenueScore >= 75) {
    strengths.add('Gift revenue signals are comparatively strong in recent live activity.');
  }
  if (scores.reliabilityScore >= 75) {
    strengths.add(
      'Reliability signals correlate with consistent live activity and onboarding readiness.',
    );
  }

  for (const momentum of input.liveTrendSnapshot?.positiveMomentum ?? []) {
    strengths.add(momentum);
  }

  if (strengths.size === 0 && input.intelligenceProfile) {
    for (const action of input.intelligenceProfile.recommendedNextActions.slice(0, 1)) {
      strengths.add(`Existing intelligence profile suggests maintaining: ${action}`);
    }
  }

  return [...strengths].slice(0, 6);
}

function buildRisks(input: BuildCreatorPerformanceScoreInput, riskScore: number): string[] {
  const risks = new Set<string>();

  if (input.complianceStatus === 'NON_COMPLIANT') {
    risks.add('Compliance failures may correlate with elevated operational risk.');
  } else if (input.complianceStatus === 'AT_RISK') {
    risks.add('Compliance signals appear at risk and may require attention.');
  }

  for (const risk of input.liveTrendSnapshot?.regressionRisks ?? []) {
    risks.add(risk);
  }

  for (const signal of input.intelligenceProfile?.riskSignals ?? []) {
    risks.add(signal);
  }

  if (riskScore >= 60) {
    risks.add('Combined risk signals are elevated across compliance, trends, and live activity.');
  }

  return [...risks].slice(0, 6);
}

function buildRecommendedActions(
  input: BuildCreatorPerformanceScoreInput,
  scores: Record<string, number>,
): string[] {
  const actions = new Set<string>();

  if (scores.complianceScore < 60) {
    actions.add(
      'Review compliance gaps such as missing documents, expired contracts, or incomplete onboarding.',
    );
  }
  if (scores.campaignExecutionScore < 60) {
    actions.add('Review open campaign assignments and deliverables for stalled execution signals.');
  }
  if (scores.growthScore < 50) {
    actions.add(
      'Review recent live session patterns that may correlate with declining growth signals.',
    );
  }
  if (scores.riskScore >= 50) {
    actions.add(
      'Prioritize risk mitigation across compliance, live consistency, and campaign follow-through.',
    );
  }

  for (const action of input.intelligenceProfile?.recommendedNextActions ?? []) {
    actions.add(action);
  }

  for (const focus of input.liveTrendSnapshot?.recommendedFocusAreas ?? []) {
    actions.add(focus);
  }

  if (actions.size === 0) {
    actions.add(
      'Maintain current live and campaign patterns while monitoring correlated performance signals.',
    );
  }

  return [...actions].slice(0, 8);
}

function computeSessionConsistencyFallback(sessions: CreatorSessionInput[]): number {
  if (sessions.length === 0) {
    return 0;
  }

  const endedSessions = sessions.filter((session) => session.status === 'ENDED').length;
  return clampPerformanceScore(
    (endedSessions / sessions.length) * 70 + Math.min(20, sessions.length * 2),
  );
}

function resolveSessionRevenueProxy(session: CreatorSessionInput): number {
  if (session.totalGiftValue) {
    const parsed = Number(session.totalGiftValue.toString());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function computeEngagementFallback(session: CreatorSessionInput): number {
  let score = 0;
  if (session.peakViewers !== null) {
    score += Math.min(50, session.peakViewers / 4);
  }
  if (session.totalViewers !== null) {
    score += Math.min(50, session.totalViewers / 10);
  }
  return Math.min(100, score);
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
