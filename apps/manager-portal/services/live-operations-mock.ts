import type { LiveSession, SessionTimelineResponse } from '@kolab/types';

import type { ManagerLiveOperationsWorkspace } from '@/types/live-operations';

const now = new Date();
const iso = (offsetMinutes: number) =>
  new Date(now.getTime() + offsetMinutes * 60 * 1000).toISOString();

export const MOCK_LIVE_SESSION_PRIMARY = 'live_session_mock_001';
export const MOCK_LIVE_SESSION_SECONDARY = 'live_session_mock_002';

export function createMockLiveOperationsWorkspace(
  organizationId: string,
): ManagerLiveOperationsWorkspace {
  const sessions = [
    {
      id: MOCK_LIVE_SESSION_PRIMARY,
      creatorProfileId: 'creator_mock_001',
      creatorDisplayName: 'Alex Rivera',
      title: 'Friday Night Live',
      platform: 'TIKTOK',
      status: 'LIVE',
      viewerCount: 1240,
      giftRevenue: '842.50',
      durationLabel: '1h 12m',
      health: 'GOOD' as const,
      healthScore: 78,
      startedAt: iso(-72),
    },
    {
      id: MOCK_LIVE_SESSION_SECONDARY,
      creatorProfileId: 'creator_mock_002',
      creatorDisplayName: 'Maya Chen',
      title: 'Product Launch Stream',
      platform: 'TIKTOK',
      status: 'LIVE',
      viewerCount: 890,
      giftRevenue: '1260.00',
      durationLabel: '45m',
      health: 'EXCELLENT' as const,
      healthScore: 91,
      startedAt: iso(-45),
    },
    {
      id: 'live_session_mock_003',
      creatorProfileId: 'creator_mock_003',
      creatorDisplayName: 'Sam Ortiz',
      title: 'Community Hangout',
      platform: 'BIGO',
      status: 'SCHEDULED',
      viewerCount: null,
      giftRevenue: null,
      durationLabel: '—',
      health: 'UNKNOWN' as const,
      healthScore: null,
      startedAt: null,
    },
    {
      id: 'live_session_mock_004',
      creatorProfileId: 'creator_mock_005',
      creatorDisplayName: 'Jordan Blake',
      title: 'Morning Check-in',
      platform: 'TIKTOK',
      status: 'ENDED',
      viewerCount: 540,
      giftRevenue: '210.00',
      durationLabel: '58m',
      health: 'WARNING' as const,
      healthScore: 62,
      startedAt: iso(-240),
    },
  ];

  const coachQueue = [
    {
      id: 'coach_alert_001',
      sessionId: MOCK_LIVE_SESSION_PRIMARY,
      creatorDisplayName: 'Alex Rivera',
      priority: 'HIGH',
      kind: 'ALERT' as const,
      title: 'Viewer spike detected',
      summary: 'Concurrent viewers increased 38% in the last 5 minutes.',
      recommendedAction: 'Review engagement prompts and acknowledge new viewers.',
      needsReview: true,
    },
    {
      id: 'coach_alert_002',
      sessionId: MOCK_LIVE_SESSION_SECONDARY,
      creatorDisplayName: 'Maya Chen',
      priority: 'HIGH',
      kind: 'ALERT' as const,
      title: 'Gift spike detected',
      summary: 'Gift velocity is 2.4x the session average.',
      recommendedAction: 'Coach creator to thank top supporters on stream.',
      needsReview: true,
    },
    {
      id: 'coach_rec_001',
      sessionId: MOCK_LIVE_SESSION_PRIMARY,
      creatorDisplayName: 'Alex Rivera',
      priority: 'HIGH',
      kind: 'RECOMMENDATION' as const,
      title: 'Launch a short PK segment',
      summary: 'PK segments historically lift engagement for this creator.',
      recommendedAction: null,
      needsReview: true,
    },
    {
      id: 'coach_alert_003',
      sessionId: MOCK_LIVE_SESSION_PRIMARY,
      creatorDisplayName: 'Alex Rivera',
      priority: 'MEDIUM',
      kind: 'ALERT' as const,
      title: 'Stream quality warning',
      summary: 'Bitrate dropped below target twice in the last 10 minutes.',
      recommendedAction: 'Confirm network stability with the creator.',
      needsReview: false,
    },
  ];

  const timeline = [
    {
      id: 'timeline_001',
      occurredAt: iso(-70),
      eventType: 'SESSION_STARTED',
      label: 'Session Started',
      detail: 'Friday Night Live went live',
      category: 'MILESTONE' as const,
    },
    {
      id: 'timeline_002',
      occurredAt: iso(-55),
      eventType: 'VIEWER_JOINED',
      label: 'Viewer Joined',
      detail: 'Viewer spike detected (+420 viewers)',
      category: 'KEY' as const,
    },
    {
      id: 'timeline_003',
      occurredAt: iso(-40),
      eventType: 'GIFT_RECEIVED',
      label: 'Gift Received',
      detail: 'LunaStar sent a high-value gift',
      category: 'GIFT' as const,
    },
    {
      id: 'timeline_004',
      occurredAt: iso(-30),
      eventType: 'PK_STARTED',
      label: 'Pk Started',
      detail: 'PK battle started with rival creator',
      category: 'PK' as const,
    },
    {
      id: 'timeline_005',
      occurredAt: iso(-15),
      eventType: 'PERFORMANCE_MOMENT',
      label: 'Performance Moment',
      detail: 'Highlight-worthy performance segment',
      category: 'MILESTONE' as const,
    },
  ];

  return {
    organizationId,
    generatedAt: now.toISOString(),
    sessions,
    agencyMonitoring: {
      creatorsLiveNow: 2,
      openAlerts: 2,
      viewerSpikes: 1,
      giftSpikes: 1,
      connectionIssues: 0,
      streamQualityIssues: 1,
      liveCreators: sessions
        .filter((session) => session.status === 'LIVE')
        .map((session) => ({
          sessionId: session.id,
          creatorDisplayName: session.creatorDisplayName,
          title: session.title,
          platform: session.platform,
          viewerCount: session.viewerCount,
        })),
      alerts: coachQueue
        .filter((item) => item.kind === 'ALERT')
        .map((item) => ({
          id: item.id,
          sessionId: item.sessionId,
          creatorDisplayName: item.creatorDisplayName,
          title: item.title,
          message: item.summary,
          priority: item.priority,
          alertType: item.kind,
        })),
    },
    coachQueue,
    timeline,
    selectedSessionId: MOCK_LIVE_SESSION_PRIMARY,
  };
}

export function getMockLiveOperationsWorkspace(): ManagerLiveOperationsWorkspace {
  return createMockLiveOperationsWorkspace('org_mock_001');
}

export function createMockLiveSessionItem(sessionId: string): LiveSession {
  const workspace = createMockLiveOperationsWorkspace('org_mock_001');
  const session = workspace.sessions.find((item) => item.id === sessionId);

  return {
    id: sessionId,
    organizationId: 'org_mock_001',
    creatorProfileId: session?.creatorProfileId ?? 'creator_mock_001',
    campaignId: 'camp_mock_001',
    platform: (session?.platform ?? 'TIKTOK') as LiveSession['platform'],
    platformSessionId: 'platform_session_mock',
    title: session?.title ?? 'Mock Live Session',
    description: 'Mock live session for manager portal.',
    startedAt: session?.startedAt ?? iso(-60),
    endedAt: session?.status === 'ENDED' ? iso(-5) : null,
    scheduledStart: iso(-65),
    scheduledEnd: iso(120),
    durationSeconds: session?.status === 'LIVE' ? 4320 : 3480,
    peakViewers: session?.viewerCount ?? null,
    totalViewers: session?.viewerCount ?? null,
    totalGifts: 42,
    totalGiftValue: session?.giftRevenue ?? null,
    status: (session?.status ?? 'LIVE') as LiveSession['status'],
    metadata: {},
    createdAt: iso(-120),
    updatedAt: iso(-5),
  };
}

export function createMockSessionTimeline(sessionId: string): SessionTimelineResponse {
  const workspace = createMockLiveOperationsWorkspace('org_mock_001');
  const session = workspace.sessions.find((item) => item.id === sessionId);

  return {
    liveSessionId: sessionId,
    nextCursor: null,
    items: workspace.timeline.map((event) => ({
      id: event.id,
      organizationId: 'org_mock_001',
      liveSessionId: sessionId,
      creatorProfileId: session?.creatorProfileId ?? 'creator_mock_001',
      eventType: event.eventType as SessionTimelineResponse['items'][number]['eventType'],
      occurredAt: event.occurredAt,
      offsetMs: 0,
      platform: 'TIKTOK',
      platformEventId: null,
      externalActorId: null,
      actorDisplayName: event.detail,
      payload: { title: event.detail ?? event.label },
      metadata: {},
      createdAt: event.occurredAt,
    })),
  };
}
