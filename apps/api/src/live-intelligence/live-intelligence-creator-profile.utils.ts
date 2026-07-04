import type { CreatorIntelligenceProfile, SessionIntelligenceSnapshot } from '@kolab/types';
import { CreatorIntelligenceProfileSchema } from '@kolab/types';

import { parseSessionCoachAlerts } from './live-intelligence-coach-alerts.utils';
import {
  clampIntelligenceScore,
  parseIntelligenceSnapshot,
} from './live-intelligence-engine.utils';
import { parseSessionRecommendations } from './live-intelligence-recommendations.utils';
import { parseSessionTriggerAnalysis } from './live-intelligence-trigger-analysis.utils';

export const CREATOR_INTELLIGENCE_PROFILE_METADATA_KEY = 'intelligenceProfile';
export const CREATOR_INTELLIGENCE_SESSION_LIMIT = 20;

export type CreatorSessionInput = {
  id: string;
  startedAt: Date | null;
  endedAt: Date | null;
  status: string;
  campaignId: string | null;
  totalViewers: number | null;
  peakViewers: number | null;
  totalGifts: number | null;
  totalGiftValue: { toString: () => string } | null;
  metadata: unknown;
};

export type CreatorGifterAggregateInput = {
  gifterProfileId: string;
  externalGifterId: string;
  displayName: string | null;
  giftCount: number;
  giftValue: number;
  spendingTier: string | null;
  sessionCount: number;
};

export type BuildCreatorIntelligenceProfileInput = {
  creatorProfileId: string;
  sessions: CreatorSessionInput[];
  gifterAggregates: CreatorGifterAggregateInput[];
  generatedAt?: Date;
};

type SessionAnalysisContext = {
  session: CreatorSessionInput;
  snapshot: SessionIntelligenceSnapshot | null;
  revenueProxy: number;
};

export function buildCreatorIntelligenceProfile(
  input: BuildCreatorIntelligenceProfileInput,
): CreatorIntelligenceProfile {
  const generatedAt = input.generatedAt ?? new Date();
  const sessions = [...input.sessions]
    .sort((left, right) => getSessionTimestamp(right) - getSessionTimestamp(left))
    .slice(0, CREATOR_INTELLIGENCE_SESSION_LIMIT);
  const contexts = sessions.map((session) => buildSessionAnalysisContext(session));
  const snapshots = contexts
    .map((context) => context.snapshot)
    .filter((snapshot): snapshot is SessionIntelligenceSnapshot => snapshot !== null);

  const warnings: string[] = [];
  if (sessions.length === 0) {
    warnings.push('No live sessions were found for this creator.');
  }

  const missingSnapshots = contexts.filter((context) => context.snapshot === null).length;
  if (missingSnapshots > 0) {
    warnings.push(
      `${missingSnapshots} session(s) lacked stored intelligence snapshots; session rollups were used where available.`,
    );
  }

  const creatorHealthScore = averageScore(
    snapshots.map((snapshot) => snapshot.sessionHealthScore),
    sessions.length === 0 ? 0 : 25,
  );
  const revenueTrendScore = computeRevenueTrendScore(contexts);
  const engagementTrendScore = averageScore(
    snapshots.map((snapshot) => snapshot.engagementScore),
    computeEngagementFallback(contexts),
  );
  const gifterRetentionScore = computeGifterRetentionScore(input.gifterAggregates);
  const consistencyScore = averageScore(
    snapshots.map((snapshot) => snapshot.consistencyScore),
    computeConsistencyFallback(sessions),
  );
  const campaignReadinessScore = computeCampaignReadinessScore(sessions, snapshots);
  const overallScore = clampIntelligenceScore(
    (creatorHealthScore +
      revenueTrendScore +
      engagementTrendScore +
      gifterRetentionScore +
      consistencyScore +
      campaignReadinessScore) /
      6,
  );

  const triggerRollup = aggregateTriggerTypes(contexts);
  const strongestTriggerTypes = [...triggerRollup]
    .sort(
      (left, right) =>
        right.count - left.count || (right.averageGiftValue ?? 0) - (left.averageGiftValue ?? 0),
    )
    .slice(0, 5);
  const weakestTriggerTypes = [...triggerRollup]
    .filter((entry) => entry.count > 0)
    .sort(
      (left, right) =>
        left.count - right.count || (left.averageGiftValue ?? 0) - (right.averageGiftValue ?? 0),
    )
    .slice(0, 3);

  const profile: CreatorIntelligenceProfile = {
    creatorProfileId: input.creatorProfileId,
    generatedAt: generatedAt.toISOString(),
    sessionsAnalyzed: sessions.length,
    dateRange: buildDateRange(sessions),
    creatorHealthScore,
    revenueTrendScore,
    engagementTrendScore,
    gifterRetentionScore,
    consistencyScore,
    campaignReadinessScore,
    overallScore,
    strongestTriggerTypes,
    weakestTriggerTypes,
    topGifters: buildTopGifters(input.gifterAggregates),
    bestLivePatterns: buildBestLivePatterns(contexts),
    riskSignals: buildRiskSignals(snapshots, contexts),
    coachingPriorities: buildCoachingPriorities(contexts),
    recommendedNextActions: buildRecommendedNextActions(snapshots, contexts),
    dataQualityWarnings: [...new Set([...warnings, ...collectSnapshotWarnings(snapshots)])].slice(
      0,
      8,
    ),
  };

  return profile;
}

export function parseCreatorIntelligenceProfile(
  creatorProfileId: string,
  metadata: unknown,
): CreatorIntelligenceProfile | null {
  const record = toRecord(metadata);
  const snapshot = record[CREATOR_INTELLIGENCE_PROFILE_METADATA_KEY];

  if (typeof snapshot !== 'object' || snapshot === null || Array.isArray(snapshot)) {
    return null;
  }

  const parsed = CreatorIntelligenceProfileSchema.safeParse({
    ...snapshot,
    creatorProfileId,
  });

  if (!parsed.success || parsed.data.creatorProfileId !== creatorProfileId) {
    return null;
  }

  return parsed.data;
}

function buildSessionAnalysisContext(session: CreatorSessionInput): SessionAnalysisContext {
  return {
    session,
    snapshot: parseIntelligenceSnapshot(session.id, session.metadata),
    revenueProxy: resolveSessionRevenueProxy(session),
  };
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

function computeRevenueTrendScore(contexts: SessionAnalysisContext[]): number {
  if (contexts.length === 0) {
    return 0;
  }

  if (contexts.length === 1) {
    return clampIntelligenceScore(
      contexts[0].snapshot?.revenueScore ?? Math.min(100, 20 + contexts[0].revenueProxy / 100),
    );
  }

  const midpoint = Math.ceil(contexts.length / 2);
  const recent = contexts.slice(0, midpoint);
  const older = contexts.slice(midpoint);
  const recentAverage = averageNumber(
    recent.map(
      (context) => context.snapshot?.revenueScore ?? Math.min(100, context.revenueProxy / 50),
    ),
  );
  const olderAverage = averageNumber(
    older.map(
      (context) => context.snapshot?.revenueScore ?? Math.min(100, context.revenueProxy / 50),
    ),
  );
  const delta = recentAverage - olderAverage;

  return clampIntelligenceScore(50 + delta);
}

function computeEngagementFallback(contexts: SessionAnalysisContext[]): number {
  if (contexts.length === 0) {
    return 0;
  }

  let score = 0;
  for (const context of contexts) {
    if (context.session.peakViewers !== null) {
      score += Math.min(40, context.session.peakViewers / 5);
    }
    if (context.session.totalViewers !== null) {
      score += Math.min(30, context.session.totalViewers / 20);
    }
  }

  return clampIntelligenceScore(score / contexts.length);
}

function computeConsistencyFallback(sessions: CreatorSessionInput[]): number {
  if (sessions.length === 0) {
    return 0;
  }

  const endedSessions = sessions.filter((session) => session.status === 'ENDED').length;
  return clampIntelligenceScore(
    (endedSessions / sessions.length) * 70 + Math.min(20, sessions.length * 2),
  );
}

function computeGifterRetentionScore(gifters: CreatorGifterAggregateInput[]): number {
  if (gifters.length === 0) {
    return 0;
  }

  const returningGifters = gifters.filter((gifter) => gifter.sessionCount >= 2).length;
  const premiumGifters = gifters.filter((gifter) =>
    gifter.spendingTier ? ['WHALE', 'VIP'].includes(gifter.spendingTier) : false,
  ).length;

  const retentionRatio = returningGifters / gifters.length;
  const premiumRatio = premiumGifters / gifters.length;

  return clampIntelligenceScore(retentionRatio * 70 + premiumRatio * 30);
}

function computeCampaignReadinessScore(
  sessions: CreatorSessionInput[],
  snapshots: SessionIntelligenceSnapshot[],
): number {
  const campaignSessions = sessions.filter((session) => session.campaignId !== null);
  if (campaignSessions.length === 0) {
    return snapshots.length > 0 ? 35 : 0;
  }

  const campaignSnapshots = snapshots.filter((snapshot) =>
    campaignSessions.some((session) => session.id === snapshot.sessionId),
  );
  const averageCampaignScore = averageScore(
    campaignSnapshots.map((snapshot) => snapshot.overallScore),
    40,
  );
  const linkedRatio = campaignSessions.length / Math.max(sessions.length, 1);

  return clampIntelligenceScore(averageCampaignScore * 0.7 + linkedRatio * 30);
}

function aggregateTriggerTypes(contexts: SessionAnalysisContext[]) {
  const totals = new Map<string, { count: number; giftValueTotal: number }>();

  for (const context of contexts) {
    const triggerTypes =
      context.snapshot?.topTriggerTypes ??
      parseSessionTriggerAnalysis(context.session.id, context.session.metadata)?.summary
        .topTriggerTypes ??
      [];

    for (const entry of triggerTypes) {
      const existing = totals.get(entry.triggerType) ?? { count: 0, giftValueTotal: 0 };
      totals.set(entry.triggerType, {
        count: existing.count + entry.count,
        giftValueTotal: existing.giftValueTotal,
      });
    }

    for (const item of parseSessionTriggerAnalysis(context.session.id, context.session.metadata)
      ?.items ?? []) {
      const existing = totals.get(item.triggerType) ?? { count: 0, giftValueTotal: 0 };
      totals.set(item.triggerType, {
        count: existing.count + 1,
        giftValueTotal: existing.giftValueTotal + item.giftValue,
      });
    }
  }

  return [...totals.entries()].map(([triggerType, value]) => ({
    triggerType,
    count: value.count,
    averageGiftValue: value.count > 0 ? Math.round(value.giftValueTotal / value.count) : null,
  }));
}

function buildTopGifters(
  gifters: CreatorGifterAggregateInput[],
): CreatorIntelligenceProfile['topGifters'] {
  return [...gifters]
    .sort((left, right) => right.giftValue - left.giftValue || right.giftCount - left.giftCount)
    .slice(0, 5)
    .map((gifter) => ({
      gifterProfileId: gifter.gifterProfileId,
      externalGifterId: gifter.externalGifterId,
      displayName: gifter.displayName,
      giftCount: gifter.giftCount,
      giftValue: gifter.giftValue,
      spendingTier:
        gifter.spendingTier as CreatorIntelligenceProfile['topGifters'][number]['spendingTier'],
      sessionCount: gifter.sessionCount,
    }));
}

function buildBestLivePatterns(
  contexts: SessionAnalysisContext[],
): CreatorIntelligenceProfile['bestLivePatterns'] {
  const patternCounts = new Map<string, { label: string; sessionCount: number }>();

  for (const context of contexts) {
    const recommendations = parseSessionRecommendations(
      context.session.id,
      context.session.metadata,
    );
    for (const recommendation of recommendations?.recommendations ?? []) {
      const existing = patternCounts.get(recommendation.recommendationType) ?? {
        label: recommendation.title,
        sessionCount: 0,
      };
      patternCounts.set(recommendation.recommendationType, {
        label: existing.label,
        sessionCount: existing.sessionCount + 1,
      });
    }

    for (const triggerType of context.snapshot?.topTriggerTypes ?? []) {
      const existing = patternCounts.get(triggerType.triggerType) ?? {
        label: `${triggerType.triggerType} correlated with gifts`,
        sessionCount: 0,
      };
      patternCounts.set(triggerType.triggerType, {
        label: existing.label,
        sessionCount: existing.sessionCount + triggerType.count,
      });
    }
  }

  return [...patternCounts.entries()]
    .sort((left, right) => right[1].sessionCount - left[1].sessionCount)
    .slice(0, 5)
    .map(([patternType, value]) => ({
      patternType,
      label: value.label,
      sessionCount: value.sessionCount,
    }));
}

function buildRiskSignals(
  snapshots: SessionIntelligenceSnapshot[],
  contexts: SessionAnalysisContext[],
): string[] {
  const risks = new Set<string>();

  for (const snapshot of snapshots) {
    for (const risk of snapshot.keyRisks) {
      risks.add(risk);
    }
  }

  if (contexts.some((context) => context.revenueProxy <= 0)) {
    risks.add('Some analyzed sessions show little or no correlated gift revenue.');
  }

  if (contexts.filter((context) => context.snapshot === null).length > 0) {
    risks.add('Incomplete session intelligence snapshots may reduce long-term profile confidence.');
  }

  return [...risks].slice(0, 5);
}

function buildCoachingPriorities(contexts: SessionAnalysisContext[]): string[] {
  const priorities = new Map<string, number>();

  for (const context of contexts) {
    const recommendations = parseSessionRecommendations(
      context.session.id,
      context.session.metadata,
    );
    for (const recommendation of recommendations?.recommendations ?? []) {
      priorities.set(recommendation.title, (priorities.get(recommendation.title) ?? 0) + 1);
    }

    const alerts = parseSessionCoachAlerts(context.session.id, context.session.metadata);
    for (const alert of alerts?.alerts ?? []) {
      priorities.set(alert.title, (priorities.get(alert.title) ?? 0) + 1);
    }
  }

  return [...priorities.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([title]) => title);
}

function buildRecommendedNextActions(
  snapshots: SessionIntelligenceSnapshot[],
  contexts: SessionAnalysisContext[],
): string[] {
  const actions = new Set<string>();

  for (const snapshot of snapshots) {
    for (const action of snapshot.recommendedNextActions) {
      actions.add(action);
    }
  }

  if (actions.size === 0) {
    for (const context of contexts) {
      const recommendations = parseSessionRecommendations(
        context.session.id,
        context.session.metadata,
      );
      for (const recommendation of recommendations?.recommendations ?? []) {
        actions.add(recommendation.description);
      }
    }
  }

  if (actions.size === 0 && contexts.length === 0) {
    actions.add(
      'Schedule and ingest live sessions before generating a long-term intelligence profile.',
    );
  }

  return [...actions].slice(0, 8);
}

function collectSnapshotWarnings(snapshots: SessionIntelligenceSnapshot[]): string[] {
  const warnings = new Set<string>();
  for (const snapshot of snapshots) {
    for (const warning of snapshot.dataQualityWarnings) {
      warnings.add(warning);
    }
  }
  return [...warnings];
}

function buildDateRange(sessions: CreatorSessionInput[]): CreatorIntelligenceProfile['dateRange'] {
  const timestamps = sessions
    .map((session) => session.startedAt)
    .filter((value): value is Date => value instanceof Date)
    .sort((left, right) => left.getTime() - right.getTime());

  return {
    from: timestamps[0]?.toISOString() ?? null,
    to: timestamps[timestamps.length - 1]?.toISOString() ?? null,
  };
}

function averageScore(values: number[], fallback: number): number {
  if (values.length === 0) {
    return clampIntelligenceScore(fallback);
  }

  return clampIntelligenceScore(averageNumber(values));
}

function averageNumber(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getSessionTimestamp(session: CreatorSessionInput): number {
  return session.startedAt?.getTime() ?? session.endedAt?.getTime() ?? 0;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
