import { describe, expect, it } from 'vitest';

import {
  buildAgencyMonitoring,
  mapHealthFromScore,
  mapTimelineResponse,
} from '@/types/live-operations-adapters';

describe('live operations adapters', () => {
  it('maps health from API score bands', () => {
    expect(mapHealthFromScore(90)).toBe('EXCELLENT');
    expect(mapHealthFromScore(72)).toBe('GOOD');
    expect(mapHealthFromScore(null)).toBe('UNKNOWN');
  });

  it('maps timeline response items', () => {
    const timeline = mapTimelineResponse({
      liveSessionId: 'session_1',
      nextCursor: null,
      items: [
        {
          id: 'event_1',
          organizationId: 'org_1',
          liveSessionId: 'session_1',
          creatorProfileId: 'creator_1',
          eventType: 'GIFT_RECEIVED',
          occurredAt: new Date().toISOString(),
          offsetMs: 0,
          platform: 'TIKTOK',
          platformEventId: null,
          externalActorId: null,
          actorDisplayName: 'Fan123',
          payload: { title: 'Gift received' },
          metadata: {},
          createdAt: new Date().toISOString(),
        },
      ],
    });

    expect(timeline[0]?.category).toBe('GIFT');
  });

  it('builds agency monitoring summary', () => {
    const monitoring = buildAgencyMonitoring(
      [
        {
          id: 'session_1',
          creatorProfileId: 'creator_1',
          creatorDisplayName: 'Alex',
          title: 'Live',
          platform: 'TIKTOK',
          status: 'LIVE',
          viewerCount: 100,
          giftRevenue: '10.00',
          durationLabel: '10m',
          health: 'GOOD',
          healthScore: 75,
          startedAt: new Date().toISOString(),
        },
      ],
      [],
      [],
    );

    expect(monitoring.creatorsLiveNow).toBe(1);
  });
});
