import type {
  CreatorDashboardResponse,
  LiveEvent,
  LiveSession,
  LiveSessionSummaryResponse,
  SessionIntelligenceSnapshot,
  SessionTimelineResponse,
} from '@kolab/types';

export type LiveWorkspaceData = {
  sessionId: string | null;
  session: LiveSession | null;
  overview: LiveSessionOverviewDisplayModel;
  timeline: TimelineEventDisplayModel[];
  timelineNextCursor: string | null;
  summary: LiveSessionSummaryResponse | null;
  intelligence: SessionIntelligenceSnapshot | null;
};

export type LiveSessionOverviewDisplayModel = {
  title: string | null;
  status: string | null;
  startTime: string | null;
  durationSeconds: number | null;
  currentViewers: number | null;
  peakViewers: number | null;
  giftValue: string | null;
  sessionHealthScore: number | null;
  lastUpdated: string | null;
};

export type TimelineEventDisplayModel = {
  event: LiveEvent;
  category: string;
  label: string;
};

const EVENT_CATEGORY_MAP: Partial<Record<LiveEvent['eventType'], string>> = {
  SESSION_STARTED: 'Session started',
  SESSION_ENDED: 'Session ended',
  SONG_STARTED: 'Songs',
  SONG_ENDED: 'Songs',
  PK_STARTED: 'PK',
  PK_ENDED: 'PK',
  PERFORMANCE_MOMENT: 'Performance moments',
  DANCE_MOMENT: 'Performance moments',
  VIEWER_JOINED: 'Viewer spikes',
  VIEWER_LEFT: 'Viewer spikes',
  GIFT_RECEIVED: 'Gift spikes',
  CHAT_MESSAGE: 'Acknowledgements',
  SYSTEM_EVENT: 'Acknowledgements',
};

export function formatLiveLabel(value: string): string {
  return value.replaceAll('_', ' ');
}

export function getTimelineEventCategory(eventType: LiveEvent['eventType']): string {
  return EVENT_CATEGORY_MAP[eventType] ?? 'Other events';
}

export function toTimelineEventDisplayModel(event: LiveEvent): TimelineEventDisplayModel {
  const payloadTitle = event.payload.title;
  const label =
    typeof payloadTitle === 'string'
      ? payloadTitle
      : event.actorDisplayName
        ? `${formatLiveLabel(event.eventType)} · ${event.actorDisplayName}`
        : formatLiveLabel(event.eventType);

  return {
    event,
    category: getTimelineEventCategory(event.eventType),
    label,
  };
}

export function buildTimelineDisplayModels(timeline: SessionTimelineResponse | null): {
  items: TimelineEventDisplayModel[];
  nextCursor: string | null;
} {
  if (!timeline) {
    return { items: [], nextCursor: null };
  }

  return {
    items: timeline.items.map(toTimelineEventDisplayModel),
    nextCursor: timeline.nextCursor,
  };
}

export function buildLiveSessionOverview(input: {
  session: LiveSession | null;
  summary: LiveSessionSummaryResponse | null;
  intelligence: SessionIntelligenceSnapshot | null;
  dashboardLiveActivity: CreatorDashboardResponse['liveActivity'];
}): LiveSessionOverviewDisplayModel {
  const latestSession = input.dashboardLiveActivity.latestLiveSession;
  const timestamps = [
    input.session?.updatedAt,
    input.summary?.generatedAt,
    input.intelligence?.generatedAt,
  ].filter((value): value is string => Boolean(value));

  return {
    title: input.session?.title ?? latestSession?.title ?? null,
    status: input.session?.status ?? latestSession?.status ?? null,
    startTime: input.session?.startedAt ?? latestSession?.startedAt ?? null,
    durationSeconds:
      input.session?.durationSeconds ??
      input.summary?.durationSeconds ??
      latestSession?.durationSeconds ??
      input.dashboardLiveActivity.sessionDuration,
    currentViewers: input.session?.totalViewers ?? input.summary?.totalViewers ?? null,
    peakViewers: input.session?.peakViewers ?? input.summary?.peakViewers ?? null,
    giftValue:
      input.session?.totalGiftValue ??
      input.summary?.totalGiftValue ??
      latestSession?.totalGiftValue ??
      input.dashboardLiveActivity.latestRevenue,
    sessionHealthScore: input.intelligence?.sessionHealthScore ?? null,
    lastUpdated: timestamps.sort().at(-1) ?? null,
  };
}

export function buildLiveWorkspaceData(input: {
  sessionId: string | null;
  session: LiveSession | null;
  timeline: SessionTimelineResponse | null;
  summary: LiveSessionSummaryResponse | null;
  intelligence: SessionIntelligenceSnapshot | null;
  dashboardLiveActivity: CreatorDashboardResponse['liveActivity'];
}): LiveWorkspaceData {
  const timelineDisplay = buildTimelineDisplayModels(input.timeline);

  return {
    sessionId: input.sessionId,
    session: input.session,
    overview: buildLiveSessionOverview({
      session: input.session,
      summary: input.summary,
      intelligence: input.intelligence,
      dashboardLiveActivity: input.dashboardLiveActivity,
    }),
    timeline: timelineDisplay.items,
    timelineNextCursor: timelineDisplay.nextCursor,
    summary: input.summary,
    intelligence: input.intelligence,
  };
}

export function createEmptyLiveWorkspaceData(): LiveWorkspaceData {
  return buildLiveWorkspaceData({
    sessionId: null,
    session: null,
    timeline: null,
    summary: null,
    intelligence: null,
    dashboardLiveActivity: {
      latestLiveSession: null,
      nextScheduledLive: null,
      lastPerformanceScore: null,
      sessionDuration: null,
      latestRevenue: null,
    },
  });
}
