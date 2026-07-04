import type {
  CreatorLiveTrendSnapshot,
  LiveTrendMetric,
  LiveTrendMetricDirection,
  LiveTrendOverallDirection,
  SessionIntelligenceSnapshot,
} from '@kolab/types';
import { CreatorLiveTrendSnapshotSchema } from '@kolab/types';

import type { CreatorSessionInput } from './live-intelligence-creator-profile.utils';
import { parseIntelligenceSnapshot } from './live-intelligence-engine.utils';
import { parseSessionTriggerAnalysis } from './live-intelligence-trigger-analysis.utils';

export const CREATOR_LIVE_TREND_SNAPSHOT_METADATA_KEY = 'liveTrendSnapshot';
export const LIVE_TREND_RECENT_WINDOW_SIZE = 5;
export const LIVE_TREND_PRIOR_WINDOW_SIZE = 5;
export const LIVE_TREND_SESSION_LIMIT =
  LIVE_TREND_RECENT_WINDOW_SIZE + LIVE_TREND_PRIOR_WINDOW_SIZE;
export const LIVE_TREND_MIN_SESSIONS_FOR_OVERALL = 3;

const TREND_DELTA_THRESHOLD = 5;
const TREND_PERCENT_THRESHOLD = 5;

export type BuildCreatorLiveTrendSnapshotInput = {
  creatorProfileId: string;
  sessions: CreatorSessionInput[];
  generatedAt?: Date;
};

type SessionTrendContext = {
  session: CreatorSessionInput;
  snapshot: SessionIntelligenceSnapshot | null;
  revenueValue: number;
  engagementValue: number;
  consistencyValue: number;
  gifterQualityValue: number;
  triggerEffectivenessValue: number;
};

export function buildCreatorLiveTrendSnapshot(
  input: BuildCreatorLiveTrendSnapshotInput,
): CreatorLiveTrendSnapshot {
  const generatedAt = input.generatedAt ?? new Date();
  const sessions = [...input.sessions]
    .sort((left, right) => getSessionTimestamp(right) - getSessionTimestamp(left))
    .slice(0, LIVE_TREND_SESSION_LIMIT);
  const contexts = sessions.map((session) => buildSessionTrendContext(session));
  const recentContexts = contexts.slice(0, LIVE_TREND_RECENT_WINDOW_SIZE);
  const priorContexts = contexts.slice(
    LIVE_TREND_RECENT_WINDOW_SIZE,
    LIVE_TREND_RECENT_WINDOW_SIZE + LIVE_TREND_PRIOR_WINDOW_SIZE,
  );

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

  if (priorContexts.length === 0 && sessions.length >= LIVE_TREND_MIN_SESSIONS_FOR_OVERALL) {
    warnings.push(
      'Fewer than six sessions are available, so prior-window comparisons may be limited.',
    );
  }

  const revenueTrend = buildTrendMetric({
    metric: 'revenue',
    recentContexts,
    priorContexts,
    getValue: (context) => context.revenueValue,
    usePercentChange: true,
    buildEvidence: (direction, current, previous) =>
      buildMetricEvidence('Gift revenue', direction, current, previous, true),
  });
  const engagementTrend = buildTrendMetric({
    metric: 'engagement',
    recentContexts,
    priorContexts,
    getValue: (context) => context.engagementValue,
    buildEvidence: (direction, current, previous) =>
      buildMetricEvidence('Engagement', direction, current, previous, false),
  });
  const consistencyTrend = buildTrendMetric({
    metric: 'consistency',
    recentContexts,
    priorContexts,
    getValue: (context) => context.consistencyValue,
    buildEvidence: (direction, current, previous) =>
      buildMetricEvidence('Session consistency', direction, current, previous, false),
  });
  const gifterQualityTrend = buildTrendMetric({
    metric: 'gifterQuality',
    recentContexts,
    priorContexts,
    getValue: (context) => context.gifterQualityValue,
    buildEvidence: (direction, current, previous) =>
      buildMetricEvidence('Gifter quality', direction, current, previous, false),
  });
  const triggerEffectivenessTrend = buildTrendMetric({
    metric: 'triggerEffectiveness',
    recentContexts,
    priorContexts,
    getValue: (context) => context.triggerEffectivenessValue,
    buildEvidence: (direction, current, previous) =>
      buildMetricEvidence('Trigger effectiveness', direction, current, previous, false),
  });

  const metrics = [
    revenueTrend,
    engagementTrend,
    consistencyTrend,
    gifterQualityTrend,
    triggerEffectivenessTrend,
  ];
  const overallDirection = computeOverallDirection(sessions.length, metrics);
  const trendSignals = buildTrendSignals(metrics, overallDirection);
  const regressionRisks = buildRegressionRisks(metrics);
  const positiveMomentum = buildPositiveMomentum(metrics);
  const recommendedFocusAreas = buildRecommendedFocusAreas(metrics, regressionRisks);

  return {
    creatorProfileId: input.creatorProfileId,
    generatedAt: generatedAt.toISOString(),
    sessionsAnalyzed: sessions.length,
    dateRange: buildDateRange(sessions),
    revenueTrend,
    engagementTrend,
    consistencyTrend,
    gifterQualityTrend,
    triggerEffectivenessTrend,
    overallDirection,
    trendSignals,
    regressionRisks,
    positiveMomentum,
    recommendedFocusAreas,
    dataQualityWarnings: [...new Set(warnings)].slice(0, 8),
  };
}

export function parseCreatorLiveTrendSnapshot(
  creatorProfileId: string,
  metadata: unknown,
): CreatorLiveTrendSnapshot | null {
  const record = toRecord(metadata);
  const snapshot = record[CREATOR_LIVE_TREND_SNAPSHOT_METADATA_KEY];

  if (typeof snapshot !== 'object' || snapshot === null || Array.isArray(snapshot)) {
    return null;
  }

  const parsed = CreatorLiveTrendSnapshotSchema.safeParse({
    ...snapshot,
    creatorProfileId,
  });

  if (!parsed.success || parsed.data.creatorProfileId !== creatorProfileId) {
    return null;
  }

  return parsed.data;
}

export function clampTrendConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function buildSessionTrendContext(session: CreatorSessionInput): SessionTrendContext {
  const snapshot = parseIntelligenceSnapshot(session.id, session.metadata);
  const revenueValue =
    snapshot?.revenueScore ?? Math.min(100, resolveSessionRevenueProxy(session) / 50);
  const engagementValue = snapshot?.engagementScore ?? computeEngagementFallback(session);
  const consistencyValue = snapshot?.consistencyScore ?? (session.status === 'ENDED' ? 75 : 35);
  const gifterQualityValue = snapshot?.gifterQualityScore ?? 0;
  const triggerEffectivenessValue = computeTriggerEffectiveness(session, snapshot);

  return {
    session,
    snapshot,
    revenueValue,
    engagementValue,
    consistencyValue,
    gifterQualityValue,
    triggerEffectivenessValue,
  };
}

function buildTrendMetric(input: {
  metric: string;
  recentContexts: SessionTrendContext[];
  priorContexts: SessionTrendContext[];
  getValue: (context: SessionTrendContext) => number;
  usePercentChange?: boolean;
  buildEvidence: (
    direction: LiveTrendMetricDirection,
    current: number,
    previous: number,
  ) => string[];
}): LiveTrendMetric {
  const currentValue = roundMetric(averageNumber(input.recentContexts.map(input.getValue)));
  const previousValue = roundMetric(averageNumber(input.priorContexts.map(input.getValue)));
  const canCompare = input.recentContexts.length > 0 && input.priorContexts.length > 0;
  const direction = canCompare
    ? computeMetricDirection(currentValue, previousValue, input.usePercentChange ?? false)
    : 'INSUFFICIENT_DATA';
  const percentChange =
    canCompare && previousValue !== 0
      ? roundMetric(((currentValue - previousValue) / Math.abs(previousValue)) * 100)
      : canCompare && previousValue === 0 && currentValue > 0
        ? 100
        : null;
  const confidenceScore = clampTrendConfidence(
    computeMetricConfidence(input.recentContexts, input.priorContexts),
  );

  return {
    metric: input.metric,
    direction,
    currentValue,
    previousValue,
    percentChange,
    confidenceScore,
    evidence: canCompare
      ? input.buildEvidence(direction, currentValue, previousValue)
      : ['Insufficient session history to compare recent and prior live windows.'],
  };
}

function computeMetricDirection(
  currentValue: number,
  previousValue: number,
  usePercentChange: boolean,
): LiveTrendMetricDirection {
  if (usePercentChange) {
    if (previousValue === 0) {
      return currentValue > 0 ? 'UP' : 'FLAT';
    }

    const percentChange = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
    if (percentChange >= TREND_PERCENT_THRESHOLD) {
      return 'UP';
    }
    if (percentChange <= -TREND_PERCENT_THRESHOLD) {
      return 'DOWN';
    }
    return 'FLAT';
  }

  const delta = currentValue - previousValue;
  if (delta >= TREND_DELTA_THRESHOLD) {
    return 'UP';
  }
  if (delta <= -TREND_DELTA_THRESHOLD) {
    return 'DOWN';
  }
  return 'FLAT';
}

function computeMetricConfidence(
  recentContexts: SessionTrendContext[],
  priorContexts: SessionTrendContext[],
): number {
  const recentCoverage = recentContexts.length / LIVE_TREND_RECENT_WINDOW_SIZE;
  const priorCoverage = priorContexts.length / LIVE_TREND_PRIOR_WINDOW_SIZE;
  const allContexts = [...recentContexts, ...priorContexts];
  const snapshotRatio =
    allContexts.length === 0
      ? 0
      : allContexts.filter((context) => context.snapshot !== null).length / allContexts.length;

  if (priorContexts.length === 0) {
    return snapshotRatio * recentCoverage * 0.35;
  }

  return snapshotRatio * (recentCoverage * 0.5 + priorCoverage * 0.5);
}

function computeOverallDirection(
  sessionCount: number,
  metrics: LiveTrendMetric[],
): LiveTrendOverallDirection {
  if (sessionCount < LIVE_TREND_MIN_SESSIONS_FOR_OVERALL) {
    return 'INSUFFICIENT_DATA';
  }

  const comparable = metrics.filter((metric) => metric.direction !== 'INSUFFICIENT_DATA');
  if (comparable.length === 0) {
    return 'INSUFFICIENT_DATA';
  }

  const upCount = comparable.filter((metric) => metric.direction === 'UP').length;
  const downCount = comparable.filter((metric) => metric.direction === 'DOWN').length;

  if (upCount > downCount) {
    return 'IMPROVING';
  }
  if (downCount > upCount) {
    return 'DECLINING';
  }
  return 'STABLE';
}

function buildTrendSignals(
  metrics: LiveTrendMetric[],
  overallDirection: LiveTrendOverallDirection,
): string[] {
  const signals: string[] = [];

  for (const metric of metrics) {
    if (metric.direction === 'UP') {
      signals.push(
        `${formatMetricLabel(metric.metric)} appears to be trending upward across recent live sessions.`,
      );
    } else if (metric.direction === 'DOWN') {
      signals.push(
        `${formatMetricLabel(metric.metric)} appears to be trending downward across recent live sessions.`,
      );
    }
  }

  if (overallDirection === 'IMPROVING') {
    signals.push('Recent live sessions show more upward than downward correlated signals.');
  } else if (overallDirection === 'DECLINING') {
    signals.push('Recent live sessions show more downward than upward correlated signals.');
  } else if (overallDirection === 'STABLE') {
    signals.push('Recent live session metrics appear relatively stable between windows.');
  }

  return [...new Set(signals)].slice(0, 8);
}

function buildRegressionRisks(metrics: LiveTrendMetric[]): string[] {
  return metrics
    .filter((metric) => metric.direction === 'DOWN')
    .map(
      (metric) =>
        `${formatMetricLabel(metric.metric)} may be weakening compared with the prior session window.`,
    )
    .slice(0, 5);
}

function buildPositiveMomentum(metrics: LiveTrendMetric[]): string[] {
  return metrics
    .filter((metric) => metric.direction === 'UP')
    .map(
      (metric) =>
        `${formatMetricLabel(metric.metric)} shows positive momentum in the recent session window.`,
    )
    .slice(0, 5);
}

function buildRecommendedFocusAreas(
  metrics: LiveTrendMetric[],
  regressionRisks: string[],
): string[] {
  const focusAreas = new Set<string>();

  for (const metric of metrics) {
    if (metric.direction === 'DOWN') {
      focusAreas.add(
        `Review live patterns correlated with ${formatMetricLabel(metric.metric).toLowerCase()}.`,
      );
    }
  }

  if (metrics.some((metric) => metric.metric === 'consistency' && metric.direction !== 'UP')) {
    focusAreas.add('Improve session scheduling consistency before scaling live activity.');
  }

  if (regressionRisks.length === 0 && focusAreas.size === 0) {
    focusAreas.add('Maintain current live patterns while monitoring correlated session signals.');
  }

  return [...focusAreas].slice(0, 5);
}

function buildMetricEvidence(
  label: string,
  direction: LiveTrendMetricDirection,
  current: number,
  previous: number,
  isRevenue: boolean,
): string[] {
  const formattedCurrent = isRevenue ? current.toFixed(2) : current.toFixed(1);
  const formattedPrevious = isRevenue ? previous.toFixed(2) : previous.toFixed(1);

  if (direction === 'UP') {
    return [
      `${label} averaged ${formattedCurrent} in the recent window versus ${formattedPrevious} in the prior window.`,
    ];
  }
  if (direction === 'DOWN') {
    return [
      `${label} averaged ${formattedCurrent} in the recent window versus ${formattedPrevious} in the prior window.`,
    ];
  }

  return [
    `${label} remained relatively flat between recent (${formattedCurrent}) and prior (${formattedPrevious}) windows.`,
  ];
}

function computeTriggerEffectiveness(
  session: CreatorSessionInput,
  snapshot: SessionIntelligenceSnapshot | null,
): number {
  const triggerTypes =
    snapshot?.topTriggerTypes ??
    parseSessionTriggerAnalysis(session.id, session.metadata)?.summary.topTriggerTypes ??
    [];
  const triggerCount = triggerTypes.reduce((sum, entry) => sum + entry.count, 0);
  return Math.min(100, triggerCount * 10);
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

function buildDateRange(sessions: CreatorSessionInput[]): CreatorLiveTrendSnapshot['dateRange'] {
  const timestamps = sessions
    .map((session) => session.startedAt)
    .filter((value): value is Date => value instanceof Date)
    .sort((left, right) => left.getTime() - right.getTime());

  return {
    from: timestamps[0]?.toISOString() ?? null,
    to: timestamps[timestamps.length - 1]?.toISOString() ?? null,
  };
}

function formatMetricLabel(metric: string): string {
  switch (metric) {
    case 'revenue':
      return 'Gift revenue';
    case 'engagement':
      return 'Engagement';
    case 'consistency':
      return 'Consistency';
    case 'gifterQuality':
      return 'Gifter quality';
    case 'triggerEffectiveness':
      return 'Trigger effectiveness';
    default:
      return metric;
  }
}

function averageNumber(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
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
