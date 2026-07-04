import type { GifterSpendingTier, LiveSessionStatus } from '@kolab/types';

import { GIFTER_ROLLUP_CHECKPOINT_KEY } from './live-intelligence-gifter-rollups.utils';
import {
  buildSessionHighlights,
  resolveEventOffsetMs,
  type TimelineEventInput,
} from './live-intelligence-timeline.utils';
import { parseSessionTriggerAnalysis } from './live-intelligence-trigger-analysis.utils';

export const LIVE_SUMMARY_METADATA_KEY = 'liveSummary';
export const TOP_MOMENTS_LIMIT = 5;
export const TOP_GIFT_EVENTS_LIMIT = 5;
export const TOP_GIFTERS_LIMIT = 5;

export type LiveSessionSummaryTopMoment = {
  type: string;
  label: string;
  occurredAt: string | null;
  offsetMs: number | null;
  eventIds: string[];
};

export type LiveSessionSummaryTopGiftEvent = {
  eventId: string;
  occurredAt: string;
  offsetMs: number | null;
  giftType: string | null;
  giftCount: number;
  giftValue: number;
  externalActorId: string | null;
  actorDisplayName: string | null;
};

export type LiveSessionSummaryTopGifter = {
  gifterProfileId: string;
  externalGifterId: string;
  displayName: string | null;
  giftCount: number;
  giftValue: number;
  spendingTier: GifterSpendingTier | null;
};

export type LiveSessionSummaryTriggerSummary = {
  totalTriggers: number;
  topTriggerTypes: Array<{
    triggerType: string;
    count: number;
  }>;
  totalGiftValueAttributed: number;
  generatedAt: string | null;
};

export type LiveSessionSummaryTimelineHealth = {
  totalEvents: number;
  eventsWithOffsetMs: number;
  missingOffsetMsCount: number;
  hasSessionStartedEvent: boolean;
  hasSessionEndedEvent: boolean;
  gifterRollupProcessed: boolean;
  triggerAnalysisAvailable: boolean;
  status: 'HEALTHY' | 'PARTIAL' | 'INCOMPLETE';
};

export type LiveSessionSummary = {
  sessionId: string;
  generatedAt: string;
  status: LiveSessionStatus;
  durationSeconds: number | null;
  totalViewers: number | null;
  peakViewers: number | null;
  totalGifts: number | null;
  totalGiftValue: string | null;
  topMoments: LiveSessionSummaryTopMoment[];
  topGiftEvents: LiveSessionSummaryTopGiftEvent[];
  topGifters: LiveSessionSummaryTopGifter[];
  triggerSummary: LiveSessionSummaryTriggerSummary | null;
  timelineHealth: LiveSessionSummaryTimelineHealth;
  coachingNotes: string[];
  complianceWarnings: string[];
};

export type SummaryEventInput = TimelineEventInput;

export type SummaryGifterInput = {
  gifterProfileId: string;
  externalGifterId: string;
  displayName: string | null;
  giftCount: number;
  giftValue: number | string;
  spendingTier: GifterSpendingTier | null;
};

export type BuildLiveSessionSummaryInput = {
  session: {
    id: string;
    status: LiveSessionStatus;
    startedAt: Date | null;
    durationSeconds: number | null;
    totalViewers: number | null;
    peakViewers: number | null;
    totalGifts: number | null;
    totalGiftValue: { toString: () => string } | null;
    metadata: unknown;
  };
  events: SummaryEventInput[];
  topGifters: SummaryGifterInput[];
  generatedAt?: Date;
};

export function buildLiveSessionSummary(input: BuildLiveSessionSummaryInput): LiveSessionSummary {
  const generatedAt = input.generatedAt ?? new Date();
  const highlights = buildSessionHighlights(input.events, input.session.startedAt);
  const triggerAnalysis = parseSessionTriggerAnalysis(input.session.id, input.session.metadata);
  const timelineHealth = buildTimelineHealth(input.session, input.events, input.session.metadata);

  const topMoments = highlights.slice(0, TOP_MOMENTS_LIMIT).map((highlight) => ({
    type: highlight.type,
    label: highlight.label,
    occurredAt: highlight.occurredAt,
    offsetMs: highlight.offsetMs,
    eventIds: highlight.eventIds,
  }));

  const topGiftEvents = buildTopGiftEvents(input.events, input.session.startedAt);
  const triggerSummary = triggerAnalysis
    ? {
        totalTriggers: triggerAnalysis.summary.totalTriggers,
        topTriggerTypes: triggerAnalysis.summary.topTriggerTypes,
        totalGiftValueAttributed: triggerAnalysis.summary.totalGiftValueAttributed,
        generatedAt: triggerAnalysis.summary.generatedAt,
      }
    : null;

  const complianceWarnings = buildComplianceWarnings({
    session: input.session,
    events: input.events,
    timelineHealth,
    topGiftEvents,
    topGifters: input.topGifters,
  });

  const coachingNotes = buildCoachingNotes({
    triggerSummary,
    topMoments,
    topGiftEvents,
    topGifters: input.topGifters,
    session: input.session,
  });

  return {
    sessionId: input.session.id,
    generatedAt: generatedAt.toISOString(),
    status: input.session.status,
    durationSeconds: input.session.durationSeconds,
    totalViewers: input.session.totalViewers,
    peakViewers: input.session.peakViewers,
    totalGifts: input.session.totalGifts,
    totalGiftValue: input.session.totalGiftValue?.toString() ?? null,
    topMoments,
    topGiftEvents,
    topGifters: input.topGifters.slice(0, TOP_GIFTERS_LIMIT).map((gifter) => ({
      gifterProfileId: gifter.gifterProfileId,
      externalGifterId: gifter.externalGifterId,
      displayName: gifter.displayName,
      giftCount: gifter.giftCount,
      giftValue: Number(gifter.giftValue),
      spendingTier: gifter.spendingTier,
    })),
    triggerSummary,
    timelineHealth,
    coachingNotes,
    complianceWarnings,
  };
}

export function parseLiveSessionSummary(
  sessionId: string,
  metadata: unknown,
): LiveSessionSummary | null {
  const record = toRecord(metadata);
  const summary = record[LIVE_SUMMARY_METADATA_KEY];

  if (typeof summary !== 'object' || summary === null || Array.isArray(summary)) {
    return null;
  }

  const parsed = summary as Record<string, unknown>;

  if (parsed.sessionId !== sessionId || typeof parsed.generatedAt !== 'string') {
    return null;
  }

  return parsed as LiveSessionSummary;
}

function buildTopGiftEvents(
  events: SummaryEventInput[],
  sessionStartedAt: Date | null,
): LiveSessionSummaryTopGiftEvent[] {
  return events
    .filter((event) => event.eventType === 'GIFT_RECEIVED')
    .map((event) => {
      const gift = parseGiftPayload(event.payload);

      return {
        eventId: event.id,
        occurredAt: event.occurredAt.toISOString(),
        offsetMs: event.offsetMs ?? resolveEventOffsetMs(event, sessionStartedAt),
        giftType: gift.giftType,
        giftCount: gift.giftCount,
        giftValue: gift.giftValue,
        externalActorId: event.externalActorId,
        actorDisplayName: event.actorDisplayName,
      };
    })
    .sort(
      (left, right) =>
        right.giftValue - left.giftValue || left.eventId.localeCompare(right.eventId),
    )
    .slice(0, TOP_GIFT_EVENTS_LIMIT);
}

function buildTimelineHealth(
  session: BuildLiveSessionSummaryInput['session'],
  events: SummaryEventInput[],
  metadata: unknown,
): LiveSessionSummaryTimelineHealth {
  const eventsWithOffsetMs = events.filter((event) => event.offsetMs !== null).length;
  const hasSessionStartedEvent = events.some((event) => event.eventType === 'SESSION_STARTED');
  const hasSessionEndedEvent = events.some((event) => event.eventType === 'SESSION_ENDED');
  const gifterRollupProcessed = hasGifterRollupCheckpoint(metadata);
  const triggerAnalysisAvailable = parseSessionTriggerAnalysis(session.id, metadata) !== null;
  const missingOffsetMsCount = events.length - eventsWithOffsetMs;

  let status: LiveSessionSummaryTimelineHealth['status'] = 'PARTIAL';

  if (events.length === 0) {
    status = 'INCOMPLETE';
  } else if (
    hasSessionStartedEvent &&
    (hasSessionEndedEvent || session.status === 'LIVE') &&
    missingOffsetMsCount <= Math.ceil(events.length * 0.1)
  ) {
    status = 'HEALTHY';
  } else if (!hasSessionStartedEvent && session.status === 'SCHEDULED') {
    status = 'INCOMPLETE';
  }

  return {
    totalEvents: events.length,
    eventsWithOffsetMs,
    missingOffsetMsCount,
    hasSessionStartedEvent,
    hasSessionEndedEvent,
    gifterRollupProcessed,
    triggerAnalysisAvailable,
    status,
  };
}

function buildComplianceWarnings(input: {
  session: BuildLiveSessionSummaryInput['session'];
  events: SummaryEventInput[];
  timelineHealth: LiveSessionSummaryTimelineHealth;
  topGiftEvents: LiveSessionSummaryTopGiftEvent[];
  topGifters: SummaryGifterInput[];
}): string[] {
  const warnings: string[] = [];

  if (!input.timelineHealth.hasSessionStartedEvent && input.session.status !== 'SCHEDULED') {
    warnings.push('Timeline is missing a SESSION_STARTED event.');
  }

  if (input.session.status === 'ENDED' && !input.timelineHealth.hasSessionEndedEvent) {
    warnings.push('Session is ENDED but timeline is missing a SESSION_ENDED event.');
  }

  if (
    input.timelineHealth.totalEvents > 0 &&
    input.timelineHealth.missingOffsetMsCount > Math.ceil(input.timelineHealth.totalEvents * 0.5)
  ) {
    warnings.push(
      'More than half of timeline events are missing offsetMs; replay alignment may be inaccurate.',
    );
  }

  if (input.topGiftEvents.length > 0 && !input.timelineHealth.gifterRollupProcessed) {
    warnings.push('Gifter rollups have not been processed for this session.');
  }

  if (!input.timelineHealth.triggerAnalysisAvailable && input.topGiftEvents.length > 0) {
    warnings.push('Trigger analysis has not been generated; triggerSummary is omitted.');
  }

  if (input.session.status === 'ENDED' && input.session.durationSeconds === null) {
    warnings.push('Session durationSeconds is missing for an ENDED session.');
  }

  if (input.session.status === 'ENDED' && input.session.totalViewers === null) {
    warnings.push('Total viewers rollup is missing for an ENDED session.');
  }

  if (input.topGiftEvents.length > 0 && input.topGifters.length === 0) {
    warnings.push('Gift events exist but no gifter session rollups were found.');
  }

  return warnings;
}

function buildCoachingNotes(input: {
  triggerSummary: LiveSessionSummaryTriggerSummary | null;
  topMoments: LiveSessionSummaryTopMoment[];
  topGiftEvents: LiveSessionSummaryTopGiftEvent[];
  topGifters: SummaryGifterInput[];
  session: BuildLiveSessionSummaryInput['session'];
}): string[] {
  const notes: string[] = [];
  const triggerTypes = new Set(
    input.triggerSummary?.topTriggerTypes.map((entry) => entry.triggerType) ?? [],
  );

  if (triggerTypes.has('SONG_STARTED_GIFTS')) {
    notes.push(
      'Song segments correlated with gift activity; repeating strong setlist moments may sustain support.',
    );
  }

  if (triggerTypes.has('PK_STARTED_GIFTS')) {
    notes.push(
      'PK segments correlated with gifts; schedule battles when audience activity is highest.',
    );
  }

  if (triggerTypes.has('GIFT_SPIKE')) {
    notes.push('Gift spike windows were detected; review creator actions during those periods.');
  }

  if (triggerTypes.has('HIGH_VALUE_GIFT')) {
    notes.push('High-value gifts occurred; consider personalized follow-up with top supporters.');
  }

  if (input.topGifters.length > 0) {
    notes.push(
      'Top gifters are available from rollups; review retention opportunities after the session.',
    );
  }

  if (input.topMoments.some((moment) => moment.type === 'VIEWER_SPIKE')) {
    notes.push(
      'Viewer join spikes were detected; capitalize on peak audience moments earlier in the stream.',
    );
  }

  if (input.topGiftEvents.length === 0) {
    notes.push('No gift events were found; review engagement tactics for the next live session.');
  }

  if (input.session.totalGifts !== null && input.session.totalGifts > 0 && !input.triggerSummary) {
    notes.push('Generate trigger analysis after ingest to enrich post-live coaching insights.');
  }

  return notes;
}

function hasGifterRollupCheckpoint(metadata: unknown): boolean {
  const record = toRecord(metadata);
  const checkpoint = record[GIFTER_ROLLUP_CHECKPOINT_KEY];

  if (typeof checkpoint !== 'object' || checkpoint === null || Array.isArray(checkpoint)) {
    return false;
  }

  const processedEventIds = (checkpoint as Record<string, unknown>).processedEventIds;
  return Array.isArray(processedEventIds) && processedEventIds.length > 0;
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
