import type {
  CreatorIntelligenceProfile,
  LiveCoachAlertItem,
  LiveCoachAlertPriority,
  LiveRecommendationItem,
  LiveRecommendationPriority,
  SessionCoachAlertsResponse,
  SessionIntelligenceSnapshot,
  SessionRecommendationsResponse,
} from '@kolab/types';

export type CoachWorkspaceView = 'summary' | 'recommendations' | 'alerts' | 'intelligence';

export type RecommendationDisplayModel = LiveRecommendationItem;

export type AlertDisplayModel = LiveCoachAlertItem;

export type GroupedRecommendations = Record<
  LiveRecommendationPriority,
  RecommendationDisplayModel[]
>;

export type GroupedAlerts = Record<LiveCoachAlertPriority, AlertDisplayModel[]>;

export type CoachOverviewDisplayModel = {
  currentPriority: string | null;
  todaysFocus: string | null;
  overallIntelligenceScore: number | null;
  coachingStatus: string;
  lastUpdated: string | null;
  sessionId: string | null;
};

export type CoachWorkspaceData = {
  overview: CoachOverviewDisplayModel;
  recommendations: GroupedRecommendations;
  alerts: GroupedAlerts;
  sessionIntelligence: SessionIntelligenceSnapshot | null;
  creatorIntelligence: CreatorIntelligenceProfile | null;
  recommendationsResponse: SessionRecommendationsResponse | null;
  alertsResponse: SessionCoachAlertsResponse | null;
};

const PRIORITY_ORDER: Record<LiveRecommendationPriority | LiveCoachAlertPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

export function formatCoachLabel(value: string): string {
  return value.replaceAll('_', ' ');
}

export function formatConfidenceScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function sortByPriority<
  T extends { priority: LiveRecommendationPriority | LiveCoachAlertPriority },
>(items: T[]): T[] {
  return [...items].sort(
    (left, right) => PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority],
  );
}

export function groupRecommendationsByPriority(
  items: LiveRecommendationItem[],
): GroupedRecommendations {
  const grouped: GroupedRecommendations = {
    HIGH: [],
    MEDIUM: [],
    LOW: [],
  };

  for (const item of sortByPriority(items)) {
    grouped[item.priority].push(item);
  }

  return grouped;
}

export function groupAlertsByPriority(items: LiveCoachAlertItem[]): GroupedAlerts {
  const grouped: GroupedAlerts = {
    HIGH: [],
    MEDIUM: [],
    LOW: [],
  };

  for (const item of sortByPriority(items)) {
    grouped[item.priority].push(item);
  }

  return grouped;
}

export function buildCoachOverview(input: {
  sessionId: string | null;
  recommendations: LiveRecommendationItem[];
  alerts: LiveCoachAlertItem[];
  sessionIntelligence: SessionIntelligenceSnapshot | null;
  creatorIntelligence: CreatorIntelligenceProfile | null;
  topCoachingPriorities: string[];
}): CoachOverviewDisplayModel {
  const sortedRecommendations = sortByPriority(input.recommendations);
  const sortedAlerts = sortByPriority(input.alerts);
  const timestamps = [
    input.sessionIntelligence?.generatedAt,
    input.creatorIntelligence?.generatedAt,
    sortedRecommendations[0]?.generatedAt,
    sortedAlerts[0]?.generatedAt,
  ].filter((value): value is string => Boolean(value));

  const currentPriority =
    input.creatorIntelligence?.coachingPriorities[0] ??
    input.topCoachingPriorities[0] ??
    sortedAlerts[0]?.title ??
    null;

  const todaysFocus =
    sortedRecommendations[0]?.title ?? input.creatorIntelligence?.recommendedNextActions[0] ?? null;

  const overallIntelligenceScore =
    input.creatorIntelligence?.overallScore ?? input.sessionIntelligence?.overallScore ?? null;

  const coachingStatus =
    input.alerts.length === 0 && input.recommendations.length === 0
      ? 'No active coaching signals'
      : `${input.alerts.length} alert${input.alerts.length === 1 ? '' : 's'} · ${input.recommendations.length} recommendation${input.recommendations.length === 1 ? '' : 's'}`;

  return {
    currentPriority,
    todaysFocus,
    overallIntelligenceScore,
    coachingStatus,
    lastUpdated: timestamps.sort().at(-1) ?? null,
    sessionId: input.sessionId,
  };
}

export function buildCoachWorkspaceData(input: {
  sessionId: string | null;
  recommendations: SessionRecommendationsResponse | null;
  alerts: SessionCoachAlertsResponse | null;
  sessionIntelligence: SessionIntelligenceSnapshot | null;
  creatorIntelligence: CreatorIntelligenceProfile | null;
  topCoachingPriorities?: string[];
}): CoachWorkspaceData {
  const recommendationItems = input.recommendations?.recommendations ?? [];
  const alertItems = input.alerts?.alerts ?? [];

  return {
    overview: buildCoachOverview({
      sessionId: input.sessionId,
      recommendations: recommendationItems,
      alerts: alertItems,
      sessionIntelligence: input.sessionIntelligence,
      creatorIntelligence: input.creatorIntelligence,
      topCoachingPriorities: input.topCoachingPriorities ?? [],
    }),
    recommendations: groupRecommendationsByPriority(recommendationItems),
    alerts: groupAlertsByPriority(alertItems),
    sessionIntelligence: input.sessionIntelligence,
    creatorIntelligence: input.creatorIntelligence,
    recommendationsResponse: input.recommendations,
    alertsResponse: input.alerts,
  };
}

export function createEmptyCoachWorkspaceData(): CoachWorkspaceData {
  return buildCoachWorkspaceData({
    sessionId: null,
    recommendations: null,
    alerts: null,
    sessionIntelligence: null,
    creatorIntelligence: null,
    topCoachingPriorities: [],
  });
}
