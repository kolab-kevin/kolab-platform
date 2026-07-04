import type { LiveEvent } from '@kolab/types';

import {
  buildReplaySegments,
  buildSessionHighlights,
  compareTimelineEvents,
  REPLAY_SEGMENT_DURATION_MS,
} from './live-intelligence-timeline.utils';

describe('live-intelligence-timeline.utils', () => {
  const sessionStartedAt = new Date('2026-07-04T20:00:00.000Z');

  it('orders timeline events by occurredAt, offsetMs, then id', () => {
    const events = [
      {
        occurredAt: new Date('2026-07-04T20:05:00.000Z'),
        offsetMs: 300_000,
        id: 'evt-b',
      },
      {
        occurredAt: new Date('2026-07-04T20:05:00.000Z'),
        offsetMs: 300_000,
        id: 'evt-a',
      },
      {
        occurredAt: new Date('2026-07-04T20:04:00.000Z'),
        offsetMs: 240_000,
        id: 'evt-c',
      },
    ];

    const sorted = [...events].sort(compareTimelineEvents);

    expect(sorted.map((event) => event.id)).toEqual(['evt-c', 'evt-a', 'evt-b']);
  });

  it('groups replay segments without changing event order', () => {
    const events: LiveEvent[] = [
      {
        id: 'evt-1',
        organizationId: 'org-1',
        liveSessionId: 'session-1',
        creatorProfileId: 'creator-1',
        eventType: 'VIEWER_JOINED',
        occurredAt: '2026-07-04T20:00:10.000Z',
        offsetMs: 10_000,
        platform: 'TIKTOK',
        platformEventId: null,
        externalActorId: 'viewer-1',
        actorDisplayName: 'Viewer',
        payload: {},
        metadata: {},
        createdAt: '2026-07-04T20:00:10.000Z',
      },
      {
        id: 'evt-2',
        organizationId: 'org-1',
        liveSessionId: 'session-1',
        creatorProfileId: 'creator-1',
        eventType: 'GIFT_RECEIVED',
        occurredAt: '2026-07-04T20:00:30.000Z',
        offsetMs: 30_000,
        platform: 'TIKTOK',
        platformEventId: null,
        externalActorId: 'gifter-1',
        actorDisplayName: 'Fan',
        payload: { giftType: 'ROSE', quantity: 2, diamondValue: 150 },
        metadata: {},
        createdAt: '2026-07-04T20:00:30.000Z',
      },
      {
        id: 'evt-3',
        organizationId: 'org-1',
        liveSessionId: 'session-1',
        creatorProfileId: 'creator-1',
        eventType: 'CHAT_MESSAGE',
        occurredAt: '2026-07-04T20:01:30.000Z',
        offsetMs: 90_000,
        platform: 'TIKTOK',
        platformEventId: null,
        externalActorId: 'gifter-1',
        actorDisplayName: 'Fan',
        payload: { text: 'hello' },
        metadata: {},
        createdAt: '2026-07-04T20:01:30.000Z',
      },
    ];

    const segments = buildReplaySegments(events, sessionStartedAt, REPLAY_SEGMENT_DURATION_MS);

    expect(segments).toHaveLength(2);
    expect(segments[0]?.startOffsetMs).toBe(0);
    expect(segments[0]?.events.map((event) => event.id)).toEqual(['evt-1', 'evt-2']);
    expect(segments[0]?.viewerActivity).toEqual({ joins: 1, leaves: 0 });
    expect(segments[0]?.giftActivity).toEqual({ giftCount: 2, giftValue: 150 });
    expect(segments[1]?.events.map((event) => event.id)).toEqual(['evt-3']);
    expect(segments[1]?.dominantEventType).toBe('CHAT_MESSAGE');
  });

  it('derives deterministic highlights including spikes and milestone events', () => {
    const highlights = buildSessionHighlights(
      [
        {
          id: 'evt-start',
          eventType: 'SESSION_STARTED',
          occurredAt: new Date('2026-07-04T20:00:00.000Z'),
          offsetMs: 0,
          externalActorId: null,
          actorDisplayName: null,
          payload: {},
        },
        {
          id: 'evt-pk',
          eventType: 'PK_STARTED',
          occurredAt: new Date('2026-07-04T20:01:00.000Z'),
          offsetMs: 60_000,
          externalActorId: null,
          actorDisplayName: null,
          payload: {},
        },
        {
          id: 'evt-gift-1',
          eventType: 'GIFT_RECEIVED',
          occurredAt: new Date('2026-07-04T20:02:00.000Z'),
          offsetMs: 120_000,
          externalActorId: 'gifter-1',
          actorDisplayName: 'Whale',
          payload: { giftType: 'UNIVERSE', diamondValue: 5000 },
        },
        {
          id: 'evt-gift-2',
          eventType: 'GIFT_RECEIVED',
          occurredAt: new Date('2026-07-04T20:02:10.000Z'),
          offsetMs: 130_000,
          externalActorId: 'gifter-2',
          actorDisplayName: 'Fan',
          payload: { giftType: 'ROSE', diamondValue: 50 },
        },
        {
          id: 'evt-gift-3',
          eventType: 'GIFT_RECEIVED',
          occurredAt: new Date('2026-07-04T20:02:20.000Z'),
          offsetMs: 140_000,
          externalActorId: 'gifter-3',
          actorDisplayName: 'Fan2',
          payload: { giftType: 'ROSE', diamondValue: 75 },
        },
        ...Array.from({ length: 10 }, (_, index) => ({
          id: `evt-join-${index}`,
          eventType: 'VIEWER_JOINED' as const,
          occurredAt: new Date(`2026-07-04T20:03:${String(index).padStart(2, '0')}.000Z`),
          offsetMs: 180_000 + index * 1000,
          externalActorId: `viewer-${index}`,
          actorDisplayName: `Viewer ${index}`,
          payload: {},
        })),
        {
          id: 'evt-end',
          eventType: 'SESSION_ENDED',
          occurredAt: new Date('2026-07-04T20:10:00.000Z'),
          offsetMs: 600_000,
          externalActorId: null,
          actorDisplayName: null,
          payload: {},
        },
      ],
      sessionStartedAt,
    );

    expect(highlights.map((item) => item.type)).toEqual(
      expect.arrayContaining([
        'SESSION_STARTED',
        'PK_STARTED',
        'HIGH_VALUE_GIFT',
        'GIFT_SPIKE',
        'VIEWER_SPIKE',
        'SESSION_ENDED',
      ]),
    );
  });
});
