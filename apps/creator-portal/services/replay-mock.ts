import type {
  ListSessionGiftersResponse,
  SessionHighlightsResponse,
  SessionReplayResponse,
  SessionTriggerAnalysisResponse,
} from '@kolab/types';

import { createMockSessionIntelligence } from '@/services/coach-mock';
import { createMockSessionTimeline, MOCK_LIVE_SESSION_ID } from '@/services/live-mock';

const now = new Date();
const iso = (offsetMinutes: number) =>
  new Date(now.getTime() + offsetMinutes * 60 * 1000).toISOString();

export function createMockSessionReplay(
  creatorProfileId: string,
  sessionId: string = MOCK_LIVE_SESSION_ID,
): SessionReplayResponse {
  const timeline = createMockSessionTimeline(creatorProfileId, sessionId);

  return {
    liveSessionId: sessionId,
    segmentDurationMs: 900000,
    segments: [
      {
        startOffsetMs: 0,
        endOffsetMs: 900000,
        eventCount: 4,
        dominantEventType: 'GIFT_RECEIVED',
        viewerActivity: { joins: 52, leaves: 11 },
        giftActivity: { giftCount: 8, giftValue: 220 },
        events: timeline.items.slice(0, 4),
      },
      {
        startOffsetMs: 900000,
        endOffsetMs: 1800000,
        eventCount: 3,
        dominantEventType: 'PK_STARTED',
        viewerActivity: { joins: 38, leaves: 9 },
        giftActivity: { giftCount: 12, giftValue: 480 },
        events: timeline.items.slice(4, 7),
      },
      {
        startOffsetMs: 1800000,
        endOffsetMs: 3600000,
        eventCount: 1,
        dominantEventType: 'SESSION_ENDED',
        viewerActivity: { joins: 14, leaves: 22 },
        giftActivity: { giftCount: 2, giftValue: 40 },
        events: timeline.items.slice(7),
      },
    ],
  };
}

export function createMockSessionHighlights(
  sessionId: string = MOCK_LIVE_SESSION_ID,
): SessionHighlightsResponse {
  return {
    liveSessionId: sessionId,
    items: [
      {
        type: 'SESSION_STARTED',
        label: 'Session opened strong',
        occurredAt: iso(-180),
        offsetMs: 0,
        eventIds: ['event_1'],
        metadata: {},
      },
      {
        type: 'GIFT_SPIKE',
        label: 'Gift spike during opening segment',
        occurredAt: iso(-165),
        offsetMs: 900000,
        eventIds: ['event_4'],
        metadata: {},
      },
      {
        type: 'VIEWER_SPIKE',
        label: 'Viewer spike after song start',
        occurredAt: iso(-173),
        offsetMs: 420000,
        eventIds: ['event_3'],
        metadata: {},
      },
      {
        type: 'HIGH_VALUE_GIFT',
        label: 'High value gift from LunaStar',
        occurredAt: iso(-165),
        offsetMs: 900000,
        eventIds: ['event_4'],
        metadata: { giftValue: '120.00' },
      },
      {
        type: 'PK_STARTED',
        label: 'PK battle started',
        occurredAt: iso(-160),
        offsetMs: 1200000,
        eventIds: ['event_5'],
        metadata: {},
      },
      {
        type: 'SONG_STARTED',
        label: 'Opening track started',
        occurredAt: iso(-175),
        offsetMs: 300000,
        eventIds: ['event_2'],
        metadata: {},
      },
      {
        type: 'PERFORMANCE_MOMENT',
        label: 'Performance moment highlight',
        occurredAt: iso(-155),
        offsetMs: 1500000,
        eventIds: ['event_6'],
        metadata: {},
      },
    ],
  };
}

export function createMockSessionTriggerAnalysis(
  sessionId: string = MOCK_LIVE_SESSION_ID,
): SessionTriggerAnalysisResponse {
  return {
    liveSessionId: sessionId,
    summary: {
      totalTriggers: 2,
      topTriggerTypes: [
        { triggerType: 'GIFT_SPIKE', count: 1 },
        { triggerType: 'SONG_STARTED_GIFTS', count: 1 },
      ],
      totalGiftValueAttributed: 420,
      generatedAt: iso(-119),
    },
    items: [
      {
        id: 'trigger_1',
        triggerType: 'GIFT_SPIKE',
        label: 'Gift spike after song start',
        windowStartOffsetMs: 300000,
        windowEndOffsetMs: 960000,
        relatedEventIds: ['event_2', 'event_4'],
        giftCount: 6,
        giftValue: 220,
        viewerDelta: 42,
        confidenceScore: 0.84,
        evidence: { songTitle: 'Sunset Drive', giftCount: 6 },
        disclaimer: 'Correlation does not imply causation. Review context before acting.',
      },
      {
        id: 'trigger_2',
        triggerType: 'PK_STARTED_GIFTS',
        label: 'PK segment gift lift',
        windowStartOffsetMs: 1200000,
        windowEndOffsetMs: 1800000,
        relatedEventIds: ['event_5', 'event_6'],
        giftCount: 4,
        giftValue: 180,
        viewerDelta: 18,
        confidenceScore: 0.71,
        evidence: { pkDurationMinutes: 10 },
        disclaimer: 'Trigger attribution is observational only.',
      },
    ],
  };
}

export function createMockSessionGifters(
  creatorProfileId: string,
  sessionId: string = MOCK_LIVE_SESSION_ID,
): ListSessionGiftersResponse {
  return {
    nextCursor: null,
    items: [
      {
        profile: {
          id: 'gifter_1',
          organizationId: 'org_mock_001',
          platform: 'TIKTOK',
          externalGifterId: 'ext_gifter_1',
          displayName: 'LunaStar',
          avatarUrl: null,
          spendingTier: 'WHALE',
          totalGiftCount: 48,
          totalGiftValue: '1260.00',
          totalSessions: 6,
          firstSeenAt: iso(-24 * 60),
          lastSeenAt: iso(-120),
          favoriteCreatorProfileId: creatorProfileId,
          favoriteGiftType: 'ROSE',
          triggerProfile: {},
          retentionProfile: {},
          metadata: {},
          createdAt: iso(-24 * 60),
          updatedAt: iso(-120),
        },
        sessionStats: {
          id: 'gifter_stats_1',
          organizationId: 'org_mock_001',
          gifterProfileId: 'gifter_1',
          liveSessionId: sessionId,
          creatorProfileId,
          giftCount: 12,
          giftValue: '420.00',
          firstGiftAt: iso(-170),
          lastGiftAt: iso(-130),
          firstSeenAt: iso(-180),
          lastSeenAt: iso(-120),
          chatMessageCount: 8,
          metadata: {},
          createdAt: iso(-170),
          updatedAt: iso(-130),
        },
      },
      {
        profile: {
          id: 'gifter_2',
          organizationId: 'org_mock_001',
          platform: 'TIKTOK',
          externalGifterId: 'ext_gifter_2',
          displayName: 'NovaVIP',
          avatarUrl: null,
          spendingTier: 'VIP',
          totalGiftCount: 22,
          totalGiftValue: '540.00',
          totalSessions: 4,
          firstSeenAt: iso(-12 * 60),
          lastSeenAt: iso(-125),
          favoriteCreatorProfileId: creatorProfileId,
          favoriteGiftType: 'GALAXY',
          triggerProfile: {},
          retentionProfile: {},
          metadata: {},
          createdAt: iso(-12 * 60),
          updatedAt: iso(-125),
        },
        sessionStats: {
          id: 'gifter_stats_2',
          organizationId: 'org_mock_001',
          gifterProfileId: 'gifter_2',
          liveSessionId: sessionId,
          creatorProfileId,
          giftCount: 6,
          giftValue: '180.00',
          firstGiftAt: iso(-168),
          lastGiftAt: iso(-125),
          firstSeenAt: iso(-175),
          lastSeenAt: iso(-125),
          chatMessageCount: 4,
          metadata: {},
          createdAt: iso(-168),
          updatedAt: iso(-125),
        },
      },
      {
        profile: {
          id: 'gifter_3',
          organizationId: 'org_mock_001',
          platform: 'TIKTOK',
          externalGifterId: 'ext_gifter_3',
          displayName: 'Fan42',
          avatarUrl: null,
          spendingTier: 'HIGH',
          totalGiftCount: 10,
          totalGiftValue: '120.00',
          totalSessions: 2,
          firstSeenAt: iso(-6 * 60),
          lastSeenAt: iso(-150),
          favoriteCreatorProfileId: creatorProfileId,
          favoriteGiftType: 'HEART',
          triggerProfile: {},
          retentionProfile: {},
          metadata: {},
          createdAt: iso(-6 * 60),
          updatedAt: iso(-150),
        },
        sessionStats: {
          id: 'gifter_stats_3',
          organizationId: 'org_mock_001',
          gifterProfileId: 'gifter_3',
          liveSessionId: sessionId,
          creatorProfileId,
          giftCount: 3,
          giftValue: '65.00',
          firstGiftAt: iso(-160),
          lastGiftAt: iso(-150),
          firstSeenAt: iso(-170),
          lastSeenAt: iso(-150),
          chatMessageCount: 6,
          metadata: {},
          createdAt: iso(-160),
          updatedAt: iso(-150),
        },
      },
    ],
  };
}

export function createMockReplayIntelligence(
  creatorProfileId: string,
  sessionId: string = MOCK_LIVE_SESSION_ID,
) {
  return createMockSessionIntelligence(creatorProfileId, sessionId);
}
