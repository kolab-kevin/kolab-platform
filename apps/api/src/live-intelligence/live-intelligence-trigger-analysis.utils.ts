import type { LiveEventType } from '@kolab/types';

import {
  GIFT_SPIKE_MIN_COUNT,
  GIFT_SPIKE_WINDOW_MS,
  HIGH_VALUE_GIFT_THRESHOLD,
  resolveEventOffsetMs,
} from './live-intelligence-timeline.utils';

export const TRIGGER_ANALYSIS_WINDOW_MS = 30_000;

export const TRIGGER_ANALYSIS_DISCLAIMER =
  'Patterns indicate correlation with nearby timeline events, not proven causation.';

export type TriggerAnalysisType =
  | 'SONG_STARTED_GIFTS'
  | 'DANCE_MOMENT_GIFTS'
  | 'PERFORMANCE_MOMENT_GIFTS'
  | 'PK_STARTED_GIFTS'
  | 'ACTOR_ACKNOWLEDGEMENT_GIFTS'
  | 'GIFT_SPIKE'
  | 'HIGH_VALUE_GIFT';

export type TriggerAnalysisEventInput = {
  id: string;
  eventType: LiveEventType;
  occurredAt: Date;
  offsetMs: number | null;
  payload: unknown;
  metadata: unknown;
};

export type TriggerAnalysisItem = {
  id: string;
  triggerType: TriggerAnalysisType;
  label: string;
  windowStartOffsetMs: number;
  windowEndOffsetMs: number;
  relatedEventIds: string[];
  giftCount: number;
  giftValue: number;
  viewerDelta: number | null;
  confidenceScore: number;
  evidence: Record<string, unknown>;
  disclaimer: string;
};

export type TriggerAnalysisSummary = {
  totalTriggers: number;
  topTriggerTypes: Array<{
    triggerType: TriggerAnalysisType;
    count: number;
  }>;
  totalGiftValueAttributed: number;
  generatedAt: string;
};

export type SessionTriggerAnalysis = {
  liveSessionId: string;
  summary: TriggerAnalysisSummary;
  items: TriggerAnalysisItem[];
};

type GiftEvent = {
  id: string;
  offsetMs: number;
  giftCount: number;
  giftValue: number;
  giftType: string | null;
};

type AnchorRule = {
  triggerType: TriggerAnalysisType;
  label: string;
  match: (event: TriggerAnalysisEventInput) => boolean;
};

const ANCHOR_RULES: AnchorRule[] = [
  {
    triggerType: 'SONG_STARTED_GIFTS',
    label: 'Gifts correlated within 30s after song started',
    match: (event) => event.eventType === 'SONG_STARTED',
  },
  {
    triggerType: 'DANCE_MOMENT_GIFTS',
    label: 'Gifts correlated within 30s after dance moment',
    match: (event) => event.eventType === 'DANCE_MOMENT',
  },
  {
    triggerType: 'PERFORMANCE_MOMENT_GIFTS',
    label: 'Gifts correlated within 30s after performance moment',
    match: (event) => event.eventType === 'PERFORMANCE_MOMENT',
  },
  {
    triggerType: 'PK_STARTED_GIFTS',
    label: 'Gifts correlated within 30s after PK started',
    match: (event) => event.eventType === 'PK_STARTED',
  },
  {
    triggerType: 'ACTOR_ACKNOWLEDGEMENT_GIFTS',
    label: 'Gifts correlated within 30s after creator acknowledgement',
    match: isActorAcknowledgementEvent,
  },
];

export function buildSessionTriggerAnalysis(
  liveSessionId: string,
  events: TriggerAnalysisEventInput[],
  sessionStartedAt: Date | null,
  generatedAt = new Date(),
): SessionTriggerAnalysis {
  const gifts = buildGiftEvents(events, sessionStartedAt);
  const viewerEvents = buildViewerEvents(events, sessionStartedAt);
  const items: TriggerAnalysisItem[] = [];

  for (const event of events) {
    for (const rule of ANCHOR_RULES) {
      if (!rule.match(event)) {
        continue;
      }

      const anchorOffsetMs = resolveEventOffsetMs(event, sessionStartedAt);
      const windowEndOffsetMs = anchorOffsetMs + TRIGGER_ANALYSIS_WINDOW_MS;
      const giftsInWindow = gifts.filter(
        (gift) => gift.offsetMs > anchorOffsetMs && gift.offsetMs <= windowEndOffsetMs,
      );

      if (giftsInWindow.length === 0) {
        continue;
      }

      items.push(
        buildAnchorTriggerItem({
          triggerType: rule.triggerType,
          label: rule.label,
          anchorEvent: event,
          anchorOffsetMs,
          windowEndOffsetMs,
          giftsInWindow,
          viewerEvents,
        }),
      );
    }
  }

  items.push(...buildGiftSpikeTriggers(gifts, viewerEvents));
  items.push(...buildHighValueGiftTriggers(gifts, viewerEvents));

  const sortedItems = items.sort((left, right) => {
    if (left.windowStartOffsetMs !== right.windowStartOffsetMs) {
      return left.windowStartOffsetMs - right.windowStartOffsetMs;
    }

    return left.id.localeCompare(right.id);
  });

  return {
    liveSessionId,
    summary: buildTriggerAnalysisSummary(sortedItems, gifts, generatedAt),
    items: sortedItems,
  };
}

export function parseSessionTriggerAnalysis(
  liveSessionId: string,
  metadata: unknown,
): SessionTriggerAnalysis | null {
  const record = toRecord(metadata);
  const analysis = record.triggerAnalysis;

  if (typeof analysis !== 'object' || analysis === null || Array.isArray(analysis)) {
    return null;
  }

  const parsed = analysis as Record<string, unknown>;

  if (parsed.liveSessionId !== liveSessionId || !Array.isArray(parsed.items) || !parsed.summary) {
    return null;
  }

  return parsed as SessionTriggerAnalysis;
}

function buildAnchorTriggerItem(input: {
  triggerType: TriggerAnalysisType;
  label: string;
  anchorEvent: TriggerAnalysisEventInput;
  anchorOffsetMs: number;
  windowEndOffsetMs: number;
  giftsInWindow: GiftEvent[];
  viewerEvents: ViewerEvent[];
}): TriggerAnalysisItem {
  const giftCount = sumGiftCount(input.giftsInWindow);
  const giftValue = sumGiftValue(input.giftsInWindow);

  return {
    id: `${input.triggerType}:${input.anchorOffsetMs}:${input.anchorEvent.id}`,
    triggerType: input.triggerType,
    label: input.label,
    windowStartOffsetMs: input.anchorOffsetMs,
    windowEndOffsetMs: input.windowEndOffsetMs,
    relatedEventIds: [input.anchorEvent.id, ...input.giftsInWindow.map((gift) => gift.id)],
    giftCount,
    giftValue,
    viewerDelta: computeViewerDelta(
      input.viewerEvents,
      input.anchorOffsetMs,
      input.windowEndOffsetMs,
    ),
    confidenceScore: computeAnchorConfidence(giftCount),
    evidence: {
      anchorEventId: input.anchorEvent.id,
      anchorEventType: input.anchorEvent.eventType,
      giftEventIds: input.giftsInWindow.map((gift) => gift.id),
      windowMs: TRIGGER_ANALYSIS_WINDOW_MS,
    },
    disclaimer: TRIGGER_ANALYSIS_DISCLAIMER,
  };
}

function buildGiftSpikeTriggers(
  gifts: GiftEvent[],
  viewerEvents: ViewerEvent[],
): TriggerAnalysisItem[] {
  const items: TriggerAnalysisItem[] = [];
  let windowStart = 0;

  while (windowStart < gifts.length) {
    const windowStartOffset = gifts[windowStart]?.offsetMs ?? 0;
    const giftsInWindow = gifts.filter(
      (gift) => gift.offsetMs - windowStartOffset <= GIFT_SPIKE_WINDOW_MS,
    );

    if (giftsInWindow.length >= GIFT_SPIKE_MIN_COUNT) {
      const windowEndOffsetMs = windowStartOffset + GIFT_SPIKE_WINDOW_MS;
      const giftCount = sumGiftCount(giftsInWindow);
      const giftValue = sumGiftValue(giftsInWindow);

      items.push({
        id: `GIFT_SPIKE:${windowStartOffset}`,
        triggerType: 'GIFT_SPIKE',
        label: 'Gift spike pattern detected in 30s window',
        windowStartOffsetMs: windowStartOffset,
        windowEndOffsetMs,
        relatedEventIds: giftsInWindow.map((gift) => gift.id),
        giftCount,
        giftValue,
        viewerDelta: computeViewerDelta(viewerEvents, windowStartOffset, windowEndOffsetMs),
        confidenceScore: computeSpikeConfidence(giftCount),
        evidence: {
          giftEventIds: giftsInWindow.map((gift) => gift.id),
          windowMs: GIFT_SPIKE_WINDOW_MS,
          minimumGiftCount: GIFT_SPIKE_MIN_COUNT,
        },
        disclaimer: TRIGGER_ANALYSIS_DISCLAIMER,
      });

      windowStart += giftsInWindow.length;
      continue;
    }

    windowStart += 1;
  }

  return items;
}

function buildHighValueGiftTriggers(
  gifts: GiftEvent[],
  viewerEvents: ViewerEvent[],
): TriggerAnalysisItem[] {
  return gifts
    .filter((gift) => gift.giftValue >= HIGH_VALUE_GIFT_THRESHOLD)
    .map((gift) => {
      const windowEndOffsetMs = gift.offsetMs + TRIGGER_ANALYSIS_WINDOW_MS;

      return {
        id: `HIGH_VALUE_GIFT:${gift.offsetMs}:${gift.id}`,
        triggerType: 'HIGH_VALUE_GIFT',
        label: 'High-value gift correlated with nearby timeline activity',
        windowStartOffsetMs: gift.offsetMs,
        windowEndOffsetMs,
        relatedEventIds: [gift.id],
        giftCount: gift.giftCount,
        giftValue: gift.giftValue,
        viewerDelta: computeViewerDelta(viewerEvents, gift.offsetMs, windowEndOffsetMs),
        confidenceScore: computeHighValueConfidence(gift.giftValue),
        evidence: {
          giftEventId: gift.id,
          giftType: gift.giftType,
          giftValue: gift.giftValue,
          threshold: HIGH_VALUE_GIFT_THRESHOLD,
        },
        disclaimer: TRIGGER_ANALYSIS_DISCLAIMER,
      };
    });
}

function buildTriggerAnalysisSummary(
  items: TriggerAnalysisItem[],
  gifts: GiftEvent[],
  generatedAt: Date,
): TriggerAnalysisSummary {
  const typeCounts = new Map<TriggerAnalysisType, number>();

  for (const item of items) {
    typeCounts.set(item.triggerType, (typeCounts.get(item.triggerType) ?? 0) + 1);
  }

  const attributedGiftIds = new Set<string>();
  for (const item of items) {
    for (const eventId of item.relatedEventIds) {
      if (gifts.some((gift) => gift.id === eventId)) {
        attributedGiftIds.add(eventId);
      }
    }
  }

  const totalGiftValueAttributed = gifts
    .filter((gift) => attributedGiftIds.has(gift.id))
    .reduce((total, gift) => total + gift.giftValue, 0);

  return {
    totalTriggers: items.length,
    topTriggerTypes: [...typeCounts.entries()]
      .map(([triggerType, count]) => ({ triggerType, count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.triggerType.localeCompare(right.triggerType),
      ),
    totalGiftValueAttributed,
    generatedAt: generatedAt.toISOString(),
  };
}

type ViewerEvent = {
  offsetMs: number;
  delta: 1 | -1;
};

function buildGiftEvents(
  events: TriggerAnalysisEventInput[],
  sessionStartedAt: Date | null,
): GiftEvent[] {
  return events
    .filter((event) => event.eventType === 'GIFT_RECEIVED')
    .map((event) => {
      const gift = parseGiftPayload(event.payload);
      return {
        id: event.id,
        offsetMs: resolveEventOffsetMs(event, sessionStartedAt),
        giftCount: gift.giftCount,
        giftValue: gift.giftValue,
        giftType: gift.giftType,
      };
    })
    .sort((left, right) => left.offsetMs - right.offsetMs || left.id.localeCompare(right.id));
}

function buildViewerEvents(
  events: TriggerAnalysisEventInput[],
  sessionStartedAt: Date | null,
): ViewerEvent[] {
  return events
    .filter((event) => event.eventType === 'VIEWER_JOINED' || event.eventType === 'VIEWER_LEFT')
    .map((event) => ({
      offsetMs: resolveEventOffsetMs(event, sessionStartedAt),
      delta: event.eventType === 'VIEWER_JOINED' ? 1 : -1,
    }));
}

function computeViewerDelta(
  viewerEvents: ViewerEvent[],
  windowStartOffsetMs: number,
  windowEndOffsetMs: number,
): number | null {
  if (viewerEvents.length === 0) {
    return null;
  }

  return viewerEvents
    .filter((event) => event.offsetMs >= windowStartOffsetMs && event.offsetMs <= windowEndOffsetMs)
    .reduce((total, event) => total + event.delta, 0);
}

function computeAnchorConfidence(giftCount: number): number {
  return clampConfidence(0.4 + giftCount * 0.15);
}

function computeSpikeConfidence(giftCount: number): number {
  return clampConfidence(0.5 + (giftCount - GIFT_SPIKE_MIN_COUNT) * 0.1);
}

function computeHighValueConfidence(giftValue: number): number {
  return clampConfidence(0.6 + giftValue / 10_000);
}

function clampConfidence(value: number): number {
  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}

function sumGiftCount(gifts: GiftEvent[]): number {
  return gifts.reduce((total, gift) => total + gift.giftCount, 0);
}

function sumGiftValue(gifts: GiftEvent[]): number {
  return gifts.reduce((total, gift) => total + gift.giftValue, 0);
}

function isActorAcknowledgementEvent(event: TriggerAnalysisEventInput): boolean {
  const payload = toRecord(event.payload);
  const metadata = toRecord(event.metadata);

  if (payload.acknowledgement === true || payload.acknowledgementType === 'DIRECT') {
    return true;
  }

  if (
    payload.momentType === 'ACKNOWLEDGEMENT' ||
    payload.momentType === 'CREATOR_ACKNOWLEDGEMENT'
  ) {
    return true;
  }

  if (metadata.acknowledgement === true || metadata.triggerCategory === 'ACTOR_ACKNOWLEDGEMENT') {
    return true;
  }

  return false;
}

function parseGiftPayload(payload: unknown): {
  giftType: string | null;
  giftCount: number;
  giftValue: number;
} {
  const record = toRecord(payload);
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

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
