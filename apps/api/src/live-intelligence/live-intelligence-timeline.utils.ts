import type { LiveEvent, LiveEventType } from '@kolab/types';

export const REPLAY_SEGMENT_DURATION_MS = 60_000;
export const HIGH_VALUE_GIFT_THRESHOLD = 1_000;
export const GIFT_SPIKE_MIN_COUNT = 3;
export const GIFT_SPIKE_WINDOW_MS = 30_000;
export const VIEWER_SPIKE_MIN_COUNT = 10;
export const VIEWER_SPIKE_WINDOW_MS = 60_000;

export type TimelineEventInput = {
  id: string;
  eventType: LiveEventType;
  occurredAt: Date;
  offsetMs: number | null;
  externalActorId: string | null;
  actorDisplayName: string | null;
  payload: unknown;
};

export type LiveReplaySegment = {
  startOffsetMs: number;
  endOffsetMs: number;
  eventCount: number;
  dominantEventType: LiveEventType | null;
  viewerActivity: {
    joins: number;
    leaves: number;
  };
  giftActivity: {
    giftCount: number;
    giftValue: number;
  };
  events: LiveEvent[];
};

export type LiveSessionHighlightType =
  | 'GIFT_SPIKE'
  | 'PK_STARTED'
  | 'PK_ENDED'
  | 'SONG_STARTED'
  | 'SONG_ENDED'
  | 'PERFORMANCE_MOMENT'
  | 'VIEWER_SPIKE'
  | 'HIGH_VALUE_GIFT'
  | 'SESSION_STARTED'
  | 'SESSION_ENDED';

export type LiveSessionHighlight = {
  type: LiveSessionHighlightType;
  label: string;
  occurredAt: string;
  offsetMs: number | null;
  eventIds: string[];
  metadata: Record<string, unknown>;
};

export function compareTimelineEvents(
  left: Pick<TimelineEventInput, 'occurredAt' | 'offsetMs' | 'id'>,
  right: Pick<TimelineEventInput, 'occurredAt' | 'offsetMs' | 'id'>,
): number {
  const occurredAtDiff = left.occurredAt.getTime() - right.occurredAt.getTime();
  if (occurredAtDiff !== 0) {
    return occurredAtDiff;
  }

  const leftOffset = left.offsetMs ?? Number.MAX_SAFE_INTEGER;
  const rightOffset = right.offsetMs ?? Number.MAX_SAFE_INTEGER;
  if (leftOffset !== rightOffset) {
    return leftOffset - rightOffset;
  }

  return left.id.localeCompare(right.id);
}

export function resolveEventOffsetMs(
  event: Pick<TimelineEventInput, 'occurredAt' | 'offsetMs'>,
  sessionStartedAt: Date | null,
): number {
  if (event.offsetMs !== null) {
    return event.offsetMs;
  }

  if (sessionStartedAt) {
    return Math.max(0, event.occurredAt.getTime() - sessionStartedAt.getTime());
  }

  return 0;
}

export function buildReplaySegments(
  events: LiveEvent[],
  sessionStartedAt: Date | null,
  segmentDurationMs = REPLAY_SEGMENT_DURATION_MS,
): LiveReplaySegment[] {
  if (events.length === 0) {
    return [];
  }

  const segmentMap = new Map<number, LiveEvent[]>();

  for (const event of events) {
    const offsetMs = resolveEventOffsetMs(
      {
        occurredAt: new Date(event.occurredAt),
        offsetMs: event.offsetMs,
      },
      sessionStartedAt,
    );
    const segmentIndex = Math.floor(offsetMs / segmentDurationMs);
    const bucket = segmentMap.get(segmentIndex) ?? [];
    bucket.push(event);
    segmentMap.set(segmentIndex, bucket);
  }

  return [...segmentMap.entries()]
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([segmentIndex, segmentEvents]) => {
      const startOffsetMs = segmentIndex * segmentDurationMs;
      const endOffsetMs = startOffsetMs + segmentDurationMs - 1;

      let joins = 0;
      let leaves = 0;
      let giftCount = 0;
      let giftValue = 0;
      const typeCounts = new Map<LiveEventType, number>();

      for (const event of segmentEvents) {
        typeCounts.set(event.eventType, (typeCounts.get(event.eventType) ?? 0) + 1);

        if (event.eventType === 'VIEWER_JOINED') {
          joins += 1;
        }

        if (event.eventType === 'VIEWER_LEFT') {
          leaves += 1;
        }

        if (event.eventType === 'GIFT_RECEIVED') {
          const gift = parseGiftPayload(event.payload);
          giftCount += gift.giftCount;
          giftValue += gift.giftValue;
        }
      }

      return {
        startOffsetMs,
        endOffsetMs,
        eventCount: segmentEvents.length,
        dominantEventType: resolveDominantEventType(typeCounts),
        viewerActivity: { joins, leaves },
        giftActivity: { giftCount, giftValue },
        events: segmentEvents,
      };
    });
}

export function buildSessionHighlights(
  events: TimelineEventInput[],
  sessionStartedAt: Date | null,
): LiveSessionHighlight[] {
  const highlights: LiveSessionHighlight[] = [];

  for (const event of events) {
    switch (event.eventType) {
      case 'SESSION_STARTED':
        highlights.push(createHighlight('SESSION_STARTED', 'Session started', event));
        break;
      case 'SESSION_ENDED':
        highlights.push(createHighlight('SESSION_ENDED', 'Session ended', event));
        break;
      case 'PK_STARTED':
        highlights.push(createHighlight('PK_STARTED', 'PK battle started', event));
        break;
      case 'PK_ENDED':
        highlights.push(createHighlight('PK_ENDED', 'PK battle ended', event));
        break;
      case 'SONG_STARTED':
        highlights.push(createHighlight('SONG_STARTED', 'Song started', event, event.payload));
        break;
      case 'SONG_ENDED':
        highlights.push(createHighlight('SONG_ENDED', 'Song ended', event, event.payload));
        break;
      case 'PERFORMANCE_MOMENT':
        highlights.push(
          createHighlight('PERFORMANCE_MOMENT', 'Performance moment', event, event.payload),
        );
        break;
      case 'GIFT_RECEIVED': {
        const gift = parseGiftPayload(event.payload);
        if (gift.giftValue >= HIGH_VALUE_GIFT_THRESHOLD) {
          highlights.push({
            type: 'HIGH_VALUE_GIFT',
            label: 'High-value gift received',
            occurredAt: event.occurredAt.toISOString(),
            offsetMs: event.offsetMs,
            eventIds: [event.id],
            metadata: {
              giftType: gift.giftType,
              giftCount: gift.giftCount,
              giftValue: gift.giftValue,
              externalActorId: event.externalActorId,
              actorDisplayName: event.actorDisplayName,
            },
          });
        }
        break;
      }
      default:
        break;
    }
  }

  highlights.push(...detectGiftSpikes(events, sessionStartedAt));
  highlights.push(...detectViewerSpikes(events, sessionStartedAt));

  return highlights.sort((left, right) => {
    const leftTime = new Date(left.occurredAt).getTime();
    const rightTime = new Date(right.occurredAt).getTime();
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.type.localeCompare(right.type);
  });
}

function detectGiftSpikes(
  events: TimelineEventInput[],
  sessionStartedAt: Date | null,
): LiveSessionHighlight[] {
  const giftEvents = events
    .filter((event) => event.eventType === 'GIFT_RECEIVED')
    .map((event) => ({
      event,
      offsetMs: resolveEventOffsetMs(event, sessionStartedAt),
    }))
    .sort((left, right) => left.offsetMs - right.offsetMs);

  const highlights: LiveSessionHighlight[] = [];
  let windowStart = 0;

  while (windowStart < giftEvents.length) {
    const windowStartOffset = giftEvents[windowStart]?.offsetMs ?? 0;
    const windowEvents = giftEvents.filter(
      (entry) => entry.offsetMs - windowStartOffset <= GIFT_SPIKE_WINDOW_MS,
    );

    if (windowEvents.length >= GIFT_SPIKE_MIN_COUNT) {
      const anchor = windowEvents[0]?.event;
      if (anchor) {
        highlights.push({
          type: 'GIFT_SPIKE',
          label: 'Gift spike detected',
          occurredAt: anchor.occurredAt.toISOString(),
          offsetMs: anchor.offsetMs,
          eventIds: windowEvents.map((entry) => entry.event.id),
          metadata: {
            giftCount: windowEvents.length,
            windowMs: GIFT_SPIKE_WINDOW_MS,
          },
        });
      }
      windowStart += windowEvents.length;
      continue;
    }

    windowStart += 1;
  }

  return highlights;
}

function detectViewerSpikes(
  events: TimelineEventInput[],
  sessionStartedAt: Date | null,
): LiveSessionHighlight[] {
  const joinEvents = events
    .filter((event) => event.eventType === 'VIEWER_JOINED')
    .map((event) => ({
      event,
      offsetMs: resolveEventOffsetMs(event, sessionStartedAt),
    }))
    .sort((left, right) => left.offsetMs - right.offsetMs);

  const highlights: LiveSessionHighlight[] = [];
  let windowStart = 0;

  while (windowStart < joinEvents.length) {
    const windowStartOffset = joinEvents[windowStart]?.offsetMs ?? 0;
    const windowEvents = joinEvents.filter(
      (entry) => entry.offsetMs - windowStartOffset <= VIEWER_SPIKE_WINDOW_MS,
    );

    if (windowEvents.length >= VIEWER_SPIKE_MIN_COUNT) {
      const anchor = windowEvents[0]?.event;
      if (anchor) {
        highlights.push({
          type: 'VIEWER_SPIKE',
          label: 'Viewer join spike detected',
          occurredAt: anchor.occurredAt.toISOString(),
          offsetMs: anchor.offsetMs,
          eventIds: windowEvents.map((entry) => entry.event.id),
          metadata: {
            joinCount: windowEvents.length,
            windowMs: VIEWER_SPIKE_WINDOW_MS,
          },
        });
      }
      windowStart += windowEvents.length;
      continue;
    }

    windowStart += 1;
  }

  return highlights;
}

function createHighlight(
  type: LiveSessionHighlightType,
  label: string,
  event: TimelineEventInput,
  payload?: unknown,
): LiveSessionHighlight {
  return {
    type,
    label,
    occurredAt: event.occurredAt.toISOString(),
    offsetMs: event.offsetMs,
    eventIds: [event.id],
    metadata: sanitizeHighlightMetadata(payload),
  };
}

function sanitizeHighlightMetadata(payload: unknown): Record<string, unknown> {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return {};
  }

  const record = payload as Record<string, unknown>;
  const metadata: Record<string, unknown> = {};

  for (const key of ['momentType', 'label', 'title', 'giftType', 'quantity']) {
    if (record[key] !== undefined) {
      metadata[key] = record[key];
    }
  }

  if (typeof record.diamondValue === 'number') {
    metadata.giftValue = record.diamondValue;
  }

  return metadata;
}

function resolveDominantEventType(typeCounts: Map<LiveEventType, number>): LiveEventType | null {
  let dominantEventType: LiveEventType | null = null;
  let highestCount = -1;

  for (const [eventType, count] of typeCounts.entries()) {
    if (count > highestCount || (count === highestCount && dominantEventType === null)) {
      highestCount = count;
      dominantEventType = eventType;
    } else if (
      count === highestCount &&
      dominantEventType !== null &&
      eventType < dominantEventType
    ) {
      dominantEventType = eventType;
    }
  }

  return dominantEventType;
}

function parseGiftPayload(payload: unknown): {
  giftType: string | null;
  giftCount: number;
  giftValue: number;
} {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { giftType: null, giftCount: 1, giftValue: 0 };
  }

  const record = payload as Record<string, unknown>;
  const giftType = typeof record.giftType === 'string' ? record.giftType : null;
  const giftCount =
    typeof record.quantity === 'number' && Number.isFinite(record.quantity) && record.quantity > 0
      ? Math.floor(record.quantity)
      : 1;

  let giftValue = 0;
  if (typeof record.diamondValue === 'number' && Number.isFinite(record.diamondValue)) {
    giftValue = record.diamondValue;
  } else if (
    typeof record.currencyEquivalent === 'number' &&
    Number.isFinite(record.currencyEquivalent)
  ) {
    giftValue = record.currencyEquivalent;
  }

  return { giftType, giftCount, giftValue };
}
