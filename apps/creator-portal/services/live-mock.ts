import type {
  LiveEvent,
  LiveSession,
  LiveSessionSummaryResponse,
  SessionTimelineResponse,
} from '@kolab/types';

const now = new Date();
const iso = (offsetMinutes: number) =>
  new Date(now.getTime() + offsetMinutes * 60 * 1000).toISOString();

export const MOCK_LIVE_SESSION_ID = 'session_1';

function baseEvent(
  partial: Pick<LiveEvent, 'id' | 'eventType' | 'offsetMs'> & {
    occurredAtOffsetMinutes: number;
    actorDisplayName?: string | null;
    payload?: Record<string, unknown>;
  },
  sessionId: string,
  creatorProfileId: string,
): LiveEvent {
  return {
    id: partial.id,
    organizationId: 'org_mock_001',
    liveSessionId: sessionId,
    creatorProfileId,
    eventType: partial.eventType,
    occurredAt: iso(partial.occurredAtOffsetMinutes),
    offsetMs: partial.offsetMs,
    platform: 'TIKTOK',
    platformEventId: null,
    externalActorId: null,
    actorDisplayName: partial.actorDisplayName ?? null,
    payload: partial.payload ?? {},
    metadata: {},
    createdAt: iso(partial.occurredAtOffsetMinutes),
  };
}

export function createMockLiveSession(
  creatorProfileId: string,
  sessionId: string = MOCK_LIVE_SESSION_ID,
): LiveSession {
  return {
    id: sessionId,
    organizationId: 'org_mock_001',
    creatorProfileId,
    campaignId: 'camp_1',
    platform: 'TIKTOK',
    platformSessionId: 'tiktok_live_001',
    title: 'Evening Q&A',
    description: 'Weekly Q&A live session.',
    startedAt: iso(-180),
    endedAt: iso(-120),
    scheduledStart: iso(-190),
    scheduledEnd: iso(-110),
    durationSeconds: 3600,
    peakViewers: 842,
    totalViewers: 615,
    totalGifts: 48,
    totalGiftValue: '1250.00',
    status: 'ENDED',
    metadata: {},
    createdAt: iso(-200),
    updatedAt: iso(-120),
  };
}

export function createMockSessionTimeline(
  creatorProfileId: string,
  sessionId: string = MOCK_LIVE_SESSION_ID,
): SessionTimelineResponse {
  return {
    liveSessionId: sessionId,
    nextCursor: null,
    items: [
      baseEvent(
        {
          id: 'event_1',
          eventType: 'SESSION_STARTED',
          offsetMs: 0,
          occurredAtOffsetMinutes: -180,
          payload: { title: 'Session started' },
        },
        sessionId,
        creatorProfileId,
      ),
      baseEvent(
        {
          id: 'event_2',
          eventType: 'SONG_STARTED',
          offsetMs: 300000,
          occurredAtOffsetMinutes: -175,
          payload: { title: 'Opening track started', songTitle: 'Sunset Drive' },
        },
        sessionId,
        creatorProfileId,
      ),
      baseEvent(
        {
          id: 'event_3',
          eventType: 'VIEWER_JOINED',
          offsetMs: 420000,
          occurredAtOffsetMinutes: -173,
          payload: { title: 'Viewer spike detected', viewerDelta: 42 },
        },
        sessionId,
        creatorProfileId,
      ),
      baseEvent(
        {
          id: 'event_4',
          eventType: 'GIFT_RECEIVED',
          offsetMs: 900000,
          occurredAtOffsetMinutes: -165,
          actorDisplayName: 'LunaStar',
          payload: { title: 'Gift spike', giftValue: '120.00' },
        },
        sessionId,
        creatorProfileId,
      ),
      baseEvent(
        {
          id: 'event_5',
          eventType: 'PK_STARTED',
          offsetMs: 1200000,
          occurredAtOffsetMinutes: -160,
          payload: { title: 'PK battle started' },
        },
        sessionId,
        creatorProfileId,
      ),
      baseEvent(
        {
          id: 'event_6',
          eventType: 'PERFORMANCE_MOMENT',
          offsetMs: 1500000,
          occurredAtOffsetMinutes: -155,
          payload: { title: 'Performance moment highlight' },
        },
        sessionId,
        creatorProfileId,
      ),
      baseEvent(
        {
          id: 'event_7',
          eventType: 'CHAT_MESSAGE',
          offsetMs: 1800000,
          occurredAtOffsetMinutes: -150,
          actorDisplayName: 'Fan42',
          payload: { title: 'Supporter acknowledgement posted' },
        },
        sessionId,
        creatorProfileId,
      ),
      baseEvent(
        {
          id: 'event_8',
          eventType: 'SESSION_ENDED',
          offsetMs: 3600000,
          occurredAtOffsetMinutes: -120,
          payload: { title: 'Session ended' },
        },
        sessionId,
        creatorProfileId,
      ),
    ],
  };
}

export function createMockSessionSummary(
  sessionId: string = MOCK_LIVE_SESSION_ID,
): LiveSessionSummaryResponse {
  return {
    sessionId,
    generatedAt: iso(-119),
    status: 'ENDED',
    durationSeconds: 3600,
    totalViewers: 615,
    peakViewers: 842,
    totalGifts: 48,
    totalGiftValue: '1250.00',
    topMoments: [
      {
        type: 'PERFORMANCE_MOMENT',
        label: 'Opening performance segment',
        occurredAt: iso(-175),
        offsetMs: 300000,
        eventIds: ['event_6'],
      },
    ],
    topGiftEvents: [
      {
        eventId: 'event_4',
        occurredAt: iso(-165),
        offsetMs: 900000,
        giftType: 'ROSE',
        giftCount: 3,
        giftValue: 120,
        externalActorId: 'ext_gifter_1',
        actorDisplayName: 'LunaStar',
      },
    ],
    topGifters: [
      {
        gifterProfileId: 'gifter_1',
        externalGifterId: 'ext_gifter_1',
        displayName: 'LunaStar',
        giftCount: 12,
        giftValue: 420,
        spendingTier: 'WHALE',
      },
    ],
    triggerSummary: {
      totalTriggers: 5,
      topTriggerTypes: [{ triggerType: 'GIFT', count: 3 }],
      totalGiftValueAttributed: 420,
      generatedAt: iso(-119),
    },
    timelineHealth: {
      totalEvents: 8,
      eventsWithOffsetMs: 8,
      missingOffsetMsCount: 0,
      hasSessionStartedEvent: true,
      hasSessionEndedEvent: true,
      gifterRollupProcessed: true,
      triggerAnalysisAvailable: true,
      status: 'HEALTHY',
    },
    coachingNotes: ['Strong opening engagement', 'Follow up with LunaStar after the session'],
    complianceWarnings: [],
  };
}
