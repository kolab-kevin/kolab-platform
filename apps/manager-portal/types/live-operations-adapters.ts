import type {
  ListCreatorsResponse,
  LiveSession,
  SessionCoachAlertsResponse,
  SessionIntelligenceSnapshot,
  SessionRecommendationsResponse,
  SessionTimelineResponse,
} from '@kolab/types';

import type {
  ManagerAgencyMonitoring,
  ManagerCoachQueueItem,
  ManagerLiveSessionHealth,
  ManagerLiveSessionItem,
  ManagerTimelineEventItem,
} from '@/types/live-operations';

const HEALTH_BANDS: Array<{ min: number; health: ManagerLiveSessionHealth }> = [
  { min: 85, health: 'EXCELLENT' },
  { min: 70, health: 'GOOD' },
  { min: 50, health: 'WARNING' },
  { min: 0, health: 'CRITICAL' },
];

export function mapHealthFromScore(score: number | null | undefined): ManagerLiveSessionHealth {
  if (score == null) return 'UNKNOWN';
  return HEALTH_BANDS.find((band) => score >= band.min)?.health ?? 'UNKNOWN';
}

export function formatDurationLabel(durationSeconds: number | null | undefined): string {
  if (durationSeconds == null) return '—';
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatLiveDuration(session: LiveSession, now = Date.now()): string {
  if (session.durationSeconds != null) {
    return formatDurationLabel(session.durationSeconds);
  }

  if (session.status === 'LIVE' && session.startedAt) {
    const elapsedSeconds = Math.max(
      0,
      Math.floor((now - new Date(session.startedAt).getTime()) / 1000),
    );
    return formatDurationLabel(elapsedSeconds);
  }

  return '—';
}

export function buildCreatorNameMap(creators: ListCreatorsResponse): Map<string, string> {
  return new Map(creators.items.map((creator) => [creator.id, creator.displayName]));
}

export function mapLiveSessionToManagerItem(
  session: LiveSession,
  creatorNames: Map<string, string>,
  intelligence: SessionIntelligenceSnapshot | null,
): ManagerLiveSessionItem {
  const healthScore = intelligence?.sessionHealthScore ?? null;

  return {
    id: session.id,
    creatorProfileId: session.creatorProfileId,
    creatorDisplayName: creatorNames.get(session.creatorProfileId) ?? session.title,
    title: session.title,
    platform: session.platform,
    status: session.status,
    viewerCount: session.peakViewers ?? session.totalViewers,
    giftRevenue: session.totalGiftValue,
    durationLabel: formatLiveDuration(session),
    health: mapHealthFromScore(healthScore),
    healthScore,
    startedAt: session.startedAt,
  };
}

export function mapTimelineResponse(
  timeline: SessionTimelineResponse | null,
): ManagerTimelineEventItem[] {
  if (!timeline) return [];

  return timeline.items.map((event) => ({
    id: event.id,
    occurredAt: event.occurredAt,
    eventType: event.eventType,
    label: formatTimelineLabel(event.eventType),
    detail:
      typeof event.payload?.title === 'string'
        ? event.payload.title
        : (event.actorDisplayName ?? null),
    category: mapTimelineCategory(event.eventType),
  }));
}

function formatTimelineLabel(eventType: string): string {
  return eventType
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function mapTimelineCategory(eventType: string): ManagerTimelineEventItem['category'] {
  if (eventType.startsWith('PK_')) return 'PK';
  if (eventType === 'GIFT_RECEIVED') return 'GIFT';
  if (eventType === 'PERFORMANCE_MOMENT' || eventType === 'SESSION_STARTED') {
    return 'MILESTONE';
  }
  if (
    eventType === 'VIEWER_JOINED' ||
    eventType === 'SONG_STARTED' ||
    eventType === 'COHOST_JOINED'
  ) {
    return 'KEY';
  }
  return 'OTHER';
}

export function mapCoachQueueItems(
  sessionId: string,
  creatorDisplayName: string,
  alerts: SessionCoachAlertsResponse | null,
  recommendations: SessionRecommendationsResponse | null,
): ManagerCoachQueueItem[] {
  const alertItems: ManagerCoachQueueItem[] =
    alerts?.alerts
      .filter((alert) => alert.priority === 'HIGH' || alert.priority === 'MEDIUM')
      .map((alert) => ({
        id: alert.id,
        sessionId,
        creatorDisplayName,
        priority: alert.priority,
        kind: 'ALERT' as const,
        title: alert.title,
        summary: alert.message,
        recommendedAction: alert.recommendedAction,
        needsReview: alert.priority === 'HIGH',
      })) ?? [];

  const recommendationItems: ManagerCoachQueueItem[] =
    recommendations?.recommendations
      .filter((item) => item.priority === 'HIGH')
      .map((item) => ({
        id: item.id,
        sessionId,
        creatorDisplayName,
        priority: item.priority,
        kind: 'RECOMMENDATION' as const,
        title: item.title,
        summary: item.description,
        recommendedAction: null,
        needsReview: true,
      })) ?? [];

  return [...alertItems, ...recommendationItems];
}

export function buildAgencyMonitoring(
  sessions: ManagerLiveSessionItem[],
  coachQueue: ManagerCoachQueueItem[],
  timeline: ManagerTimelineEventItem[],
): ManagerAgencyMonitoring {
  const liveSessions = sessions.filter((session) => session.status === 'LIVE');
  const alerts = coachQueue
    .filter((item) => item.kind === 'ALERT')
    .map((item) => ({
      id: item.id,
      sessionId: item.sessionId,
      creatorDisplayName: item.creatorDisplayName,
      title: item.title,
      message: item.summary,
      priority: item.priority,
      alertType: item.kind,
    }));

  return {
    creatorsLiveNow: liveSessions.length,
    openAlerts: alerts.filter((alert) => alert.priority === 'HIGH').length,
    viewerSpikes: timeline.filter((event) => event.eventType === 'VIEWER_JOINED').length,
    giftSpikes: timeline.filter((event) => event.eventType === 'GIFT_RECEIVED').length,
    connectionIssues: coachQueue.filter((item) => item.title.toLowerCase().includes('connection'))
      .length,
    streamQualityIssues: coachQueue.filter((item) => item.title.toLowerCase().includes('quality'))
      .length,
    liveCreators: liveSessions.map((session) => ({
      sessionId: session.id,
      creatorDisplayName: session.creatorDisplayName,
      title: session.title,
      platform: session.platform,
      viewerCount: session.viewerCount,
    })),
    alerts,
  };
}
