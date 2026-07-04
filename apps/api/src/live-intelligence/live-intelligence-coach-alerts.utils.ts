import type { LiveSessionStatus } from '@kolab/types';
import { SessionCoachAlertsResponseSchema } from '@kolab/types';

import {
  clampConfidenceScore,
  GIFT_VELOCITY_DECLINE_RATIO,
  type LiveRecommendation,
  LONG_STREAM_BREAK_SECONDS,
  type SessionRecommendations,
} from './live-intelligence-recommendations.utils';
import {
  buildSessionHighlights,
  HIGH_VALUE_GIFT_THRESHOLD,
  resolveEventOffsetMs,
  type TimelineEventInput,
} from './live-intelligence-timeline.utils';

export const COACH_ALERTS_METADATA_KEY = 'coachAlerts';
export const RECENT_ALERT_WINDOW_MS = 900_000;
export const GIFT_VELOCITY_WINDOW_MS = 300_000;

export type LiveCoachAlertType =
  | 'TOP_GIFTER_ACTIVE'
  | 'GIFT_VELOCITY_DROPPING'
  | 'VIEWER_SPIKE'
  | 'HIGH_VALUE_GIFT_RECEIVED'
  | 'TRY_MUSIC_NOW'
  | 'START_PK_NOW'
  | 'THANK_SUPPORTER'
  | 'PROMOTE_CAMPAIGN'
  | 'TAKE_BREAK_SOON';

export type LiveCoachAlertPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type LiveCoachAlert = {
  id: string;
  alertType: LiveCoachAlertType;
  priority: LiveCoachAlertPriority;
  title: string;
  message: string;
  recommendedAction: string;
  relatedRecommendationId: string | null;
  relatedEventIds: string[];
  confidenceScore: number;
  generatedAt: string;
};

export type SessionCoachAlerts = {
  sessionId: string;
  generatedAt: string;
  alerts: LiveCoachAlert[];
};

export type CoachAlertEventInput = TimelineEventInput;

export type CoachAlertGifterInput = {
  gifterProfileId: string;
  externalGifterId: string;
  displayName: string | null;
  giftCount: number;
  giftValue: number | string;
  spendingTier: string | null;
};

export type BuildSessionCoachAlertsInput = {
  session: {
    id: string;
    campaignId: string | null;
    status: LiveSessionStatus;
    startedAt: Date | null;
    durationSeconds: number | null;
  };
  events: CoachAlertEventInput[];
  topGifters: CoachAlertGifterInput[];
  recommendations: SessionRecommendations | null;
  generatedAt?: Date;
};

const ALERT_IMPACT_WEIGHT: Record<LiveCoachAlertType, number> = {
  TOP_GIFTER_ACTIVE: 0.9,
  GIFT_VELOCITY_DROPPING: 0.85,
  VIEWER_SPIKE: 0.8,
  HIGH_VALUE_GIFT_RECEIVED: 0.9,
  TRY_MUSIC_NOW: 0.85,
  START_PK_NOW: 0.85,
  THANK_SUPPORTER: 0.9,
  PROMOTE_CAMPAIGN: 0.75,
  TAKE_BREAK_SOON: 0.7,
};

const PRIORITY_ORDER: Record<LiveCoachAlertPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

const RECOMMENDATION_ALERT_MAP: Partial<
  Record<LiveRecommendation['recommendationType'], LiveCoachAlertType>
> = {
  TRY_MUSIC: 'TRY_MUSIC_NOW',
  START_PK: 'START_PK_NOW',
  ENGAGE_TOP_GIFTER: 'GIFT_VELOCITY_DROPPING',
  WELCOME_NEW_VIEWERS: 'VIEWER_SPIKE',
  THANK_TOP_SUPPORTERS: 'THANK_SUPPORTER',
  RUN_CAMPAIGN_PROMOTION: 'PROMOTE_CAMPAIGN',
  TAKE_SHORT_BREAK: 'TAKE_BREAK_SOON',
};

export function deriveAlertPriority(
  confidenceScore: number,
  alertType: LiveCoachAlertType,
): LiveCoachAlertPriority {
  const composite = clampConfidenceScore(confidenceScore) * ALERT_IMPACT_WEIGHT[alertType];

  if (composite >= 0.65) {
    return 'HIGH';
  }

  if (composite >= 0.35) {
    return 'MEDIUM';
  }

  return 'LOW';
}

export function buildSessionCoachAlerts(input: BuildSessionCoachAlertsInput): SessionCoachAlerts {
  const generatedAt = input.generatedAt ?? new Date();
  const highlights = buildSessionHighlights(input.events, input.session.startedAt);
  const recentEvents = getRecentEvents(input.events, input.session.startedAt);
  const alerts: LiveCoachAlert[] = [];
  const seenTypes = new Set<LiveCoachAlertType>();

  appendUniqueAlert(
    alerts,
    seenTypes,
    buildTopGifterActiveAlert(recentEvents, input.topGifters, generatedAt),
  );
  appendUniqueAlert(
    alerts,
    seenTypes,
    buildHighValueGiftAlert(recentEvents, input.session.startedAt, generatedAt),
  );
  appendUniqueAlert(alerts, seenTypes, buildViewerSpikeAlert(highlights, generatedAt));
  appendUniqueAlert(
    alerts,
    seenTypes,
    buildGiftVelocityDroppingAlert(input.events, input.session.startedAt, generatedAt),
  );
  appendUniqueAlert(
    alerts,
    seenTypes,
    buildTakeBreakSoonAlert(input.session, input.recommendations, generatedAt),
  );
  appendUniqueAlert(
    alerts,
    seenTypes,
    buildPromoteCampaignAlert(input.session, input.recommendations, generatedAt),
  );

  for (const recommendation of input.recommendations?.recommendations ?? []) {
    appendUniqueAlert(
      alerts,
      seenTypes,
      buildRecommendationAlert(recommendation, recentEvents, input.topGifters, generatedAt),
    );
  }

  alerts.sort((left, right) => {
    const priorityDelta = PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const confidenceDelta = right.confidenceScore - left.confidenceScore;
    if (confidenceDelta !== 0) {
      return confidenceDelta;
    }

    return left.alertType.localeCompare(right.alertType);
  });

  return {
    sessionId: input.session.id,
    generatedAt: generatedAt.toISOString(),
    alerts,
  };
}

export function parseSessionCoachAlerts(
  sessionId: string,
  metadata: unknown,
): SessionCoachAlerts | null {
  const record = toRecord(metadata);
  const snapshot = record[COACH_ALERTS_METADATA_KEY];

  if (typeof snapshot !== 'object' || snapshot === null || Array.isArray(snapshot)) {
    return null;
  }

  const parsed = SessionCoachAlertsResponseSchema.safeParse({
    ...snapshot,
    sessionId,
  });

  if (!parsed.success || parsed.data.sessionId !== sessionId) {
    return null;
  }

  return parsed.data;
}

function buildTopGifterActiveAlert(
  recentEvents: CoachAlertEventInput[],
  topGifters: CoachAlertGifterInput[],
  generatedAt: Date,
): LiveCoachAlert | null {
  const topGifter = topGifters[0];
  if (!topGifter) {
    return null;
  }

  const recentGiftEvents = recentEvents.filter(
    (event) =>
      event.eventType === 'GIFT_RECEIVED' && event.externalActorId === topGifter.externalGifterId,
  );

  if (recentGiftEvents.length === 0) {
    return null;
  }

  const confidence = clampConfidenceScore(Math.min(1, 0.6 + recentGiftEvents.length * 0.15));

  return createAlert({
    alertType: 'TOP_GIFTER_ACTIVE',
    confidenceScore: confidence,
    title: 'Top gifter is active now',
    message: `${topGifter.displayName ?? topGifter.externalGifterId} sent gifts during the recent live window.`,
    recommendedAction: 'Acknowledge the top gifter on stream and reinforce engagement.',
    relatedRecommendationId: null,
    relatedEventIds: recentGiftEvents.map((event) => event.id),
    generatedAt,
  });
}

function buildHighValueGiftAlert(
  recentEvents: CoachAlertEventInput[],
  sessionStartedAt: Date | null,
  generatedAt: Date,
): LiveCoachAlert | null {
  const highValueGifts = recentEvents
    .filter((event) => event.eventType === 'GIFT_RECEIVED')
    .map((event) => ({
      event,
      giftValue: parseGiftValue(event.payload),
    }))
    .filter((entry) => entry.giftValue >= HIGH_VALUE_GIFT_THRESHOLD);

  if (highValueGifts.length === 0) {
    return null;
  }

  const topGift = highValueGifts.sort((left, right) => right.giftValue - left.giftValue)[0];
  const confidence = clampConfidenceScore(
    Math.min(1, topGift.giftValue / (HIGH_VALUE_GIFT_THRESHOLD * 2)),
  );

  return createAlert({
    alertType: 'HIGH_VALUE_GIFT_RECEIVED',
    confidenceScore: confidence,
    title: 'High-value gift received',
    message: `A high-value gift (${Math.round(topGift.giftValue)}) was received in the recent live window.`,
    recommendedAction: 'Thank the supporter immediately and highlight the moment.',
    relatedRecommendationId: null,
    relatedEventIds: [topGift.event.id],
    generatedAt,
  });
}

function buildViewerSpikeAlert(
  highlights: ReturnType<typeof buildSessionHighlights>,
  generatedAt: Date,
): LiveCoachAlert | null {
  const viewerSpikes = highlights.filter((highlight) => highlight.type === 'VIEWER_SPIKE');
  if (viewerSpikes.length === 0) {
    return null;
  }

  const topSpike = viewerSpikes.sort(
    (left, right) => Number(right.metadata.joinCount ?? 0) - Number(left.metadata.joinCount ?? 0),
  )[0];
  const joinCount = Number(topSpike.metadata.joinCount ?? 0);
  const confidence = clampConfidenceScore(Math.min(1, joinCount / 15));

  return createAlert({
    alertType: 'VIEWER_SPIKE',
    confidenceScore: confidence,
    title: 'Viewer join spike detected',
    message: `${joinCount} viewers joined within the spike window.`,
    recommendedAction: 'Welcome incoming viewers with a clear hook and call to action.',
    relatedRecommendationId: 'welcome_new_viewers',
    relatedEventIds: topSpike.eventIds,
    generatedAt,
  });
}

function buildGiftVelocityDroppingAlert(
  events: CoachAlertEventInput[],
  sessionStartedAt: Date | null,
  generatedAt: Date,
): LiveCoachAlert | null {
  const giftEvents = events
    .filter((event) => event.eventType === 'GIFT_RECEIVED')
    .map((event) => ({
      offsetMs: resolveEventOffsetMs(event, sessionStartedAt),
      giftValue: parseGiftValue(event.payload),
    }))
    .filter((event) => event.giftValue > 0);

  if (giftEvents.length < 2) {
    return null;
  }

  const maxOffset = Math.max(...giftEvents.map((event) => event.offsetMs));
  const recentCutoff = Math.max(0, maxOffset - GIFT_VELOCITY_WINDOW_MS);
  const priorCutoff = Math.max(0, recentCutoff - GIFT_VELOCITY_WINDOW_MS);

  const recentValue = giftEvents
    .filter((event) => event.offsetMs > recentCutoff)
    .reduce((sum, event) => sum + event.giftValue, 0);
  const priorValue = giftEvents
    .filter((event) => event.offsetMs > priorCutoff && event.offsetMs <= recentCutoff)
    .reduce((sum, event) => sum + event.giftValue, 0);

  if (priorValue <= 0 || recentValue >= priorValue * GIFT_VELOCITY_DECLINE_RATIO) {
    return null;
  }

  const declineRatio = recentValue / priorValue;
  const confidence = clampConfidenceScore(Math.min(1, (1 - declineRatio) * 1.1));

  return createAlert({
    alertType: 'GIFT_VELOCITY_DROPPING',
    confidenceScore: confidence,
    title: 'Gift velocity is dropping',
    message: `Recent gift value (${Math.round(recentValue)}) is below the prior window (${Math.round(priorValue)}).`,
    recommendedAction: 'Re-engage top supporters and shift to a proven trigger moment.',
    relatedRecommendationId: 'engage_top_gifter',
    relatedEventIds: [],
    generatedAt,
  });
}

function buildTakeBreakSoonAlert(
  session: BuildSessionCoachAlertsInput['session'],
  recommendations: SessionRecommendations | null,
  generatedAt: Date,
): LiveCoachAlert | null {
  const recommendation = findRecommendation(recommendations, 'TAKE_SHORT_BREAK');
  const durationSeconds = session.durationSeconds;

  if (
    !recommendation &&
    (durationSeconds === null || durationSeconds < LONG_STREAM_BREAK_SECONDS)
  ) {
    return null;
  }

  const confidence = clampConfidenceScore(
    recommendation?.confidenceScore ??
      (durationSeconds !== null
        ? Math.min(1, durationSeconds / (LONG_STREAM_BREAK_SECONDS * 1.5))
        : 0.5),
  );

  return createAlert({
    alertType: 'TAKE_BREAK_SOON',
    confidenceScore: confidence,
    title: 'Schedule a short break soon',
    message:
      durationSeconds !== null
        ? `The session has run for ${durationSeconds} seconds continuously.`
        : 'The session has run for an extended period.',
    recommendedAction: 'Take a brief break to maintain stream energy and quality.',
    relatedRecommendationId: recommendation?.id ?? null,
    relatedEventIds: [],
    generatedAt,
  });
}

function buildPromoteCampaignAlert(
  session: BuildSessionCoachAlertsInput['session'],
  recommendations: SessionRecommendations | null,
  generatedAt: Date,
): LiveCoachAlert | null {
  if (!session.campaignId) {
    return null;
  }

  const recommendation = findRecommendation(recommendations, 'RUN_CAMPAIGN_PROMOTION');
  if (!recommendation) {
    return null;
  }

  return createAlert({
    alertType: 'PROMOTE_CAMPAIGN',
    confidenceScore: recommendation.confidenceScore,
    title: 'Promote the linked campaign now',
    message: 'This live session is linked to a campaign without captured promotion moments.',
    recommendedAction: 'Add an explicit campaign callout while viewers are active.',
    relatedRecommendationId: recommendation.id,
    relatedEventIds: [],
    generatedAt,
  });
}

function buildRecommendationAlert(
  recommendation: LiveRecommendation,
  recentEvents: CoachAlertEventInput[],
  topGifters: CoachAlertGifterInput[],
  generatedAt: Date,
): LiveCoachAlert | null {
  const alertType = RECOMMENDATION_ALERT_MAP[recommendation.recommendationType];
  if (!alertType) {
    return null;
  }

  if (alertType === 'GIFT_VELOCITY_DROPPING' || alertType === 'VIEWER_SPIKE') {
    return null;
  }

  if (alertType === 'THANK_SUPPORTER') {
    const supporter = topGifters.find((gifter) =>
      gifter.spendingTier ? ['WHALE', 'VIP'].includes(gifter.spendingTier) : false,
    );
    const relatedEventIds = recentEvents
      .filter((event) => event.eventType === 'GIFT_RECEIVED')
      .map((event) => event.id);

    return createAlert({
      alertType,
      confidenceScore: recommendation.confidenceScore,
      title: 'Thank a top supporter now',
      message: supporter
        ? `${supporter.displayName ?? supporter.externalGifterId} is a high-tier supporter in this session.`
        : recommendation.description,
      recommendedAction: 'Deliver a direct thank-you to reinforce supporter retention.',
      relatedRecommendationId: recommendation.id,
      relatedEventIds,
      generatedAt,
    });
  }

  if (alertType === 'TRY_MUSIC_NOW') {
    const songEvents = recentEvents
      .filter((event) => event.eventType === 'SONG_STARTED')
      .map((event) => event.id);

    return createAlert({
      alertType,
      confidenceScore: recommendation.confidenceScore,
      title: 'Try music now',
      message: recommendation.description,
      recommendedAction: 'Start or repeat a song segment that previously drove gifts.',
      relatedRecommendationId: recommendation.id,
      relatedEventIds: songEvents,
      generatedAt,
    });
  }

  if (alertType === 'START_PK_NOW') {
    const pkEvents = recentEvents
      .filter((event) => event.eventType === 'PK_STARTED')
      .map((event) => event.id);

    return createAlert({
      alertType,
      confidenceScore: recommendation.confidenceScore,
      title: 'Start PK now',
      message: recommendation.description,
      recommendedAction: 'Launch a PK battle while audience activity is elevated.',
      relatedRecommendationId: recommendation.id,
      relatedEventIds: pkEvents,
      generatedAt,
    });
  }

  return createAlert({
    alertType,
    confidenceScore: recommendation.confidenceScore,
    title: recommendation.title,
    message: recommendation.description,
    recommendedAction: mapRecommendedAction(recommendation.recommendationType),
    relatedRecommendationId: recommendation.id,
    relatedEventIds: [],
    generatedAt,
  });
}

function mapRecommendedAction(
  recommendationType: LiveRecommendation['recommendationType'],
): string {
  switch (recommendationType) {
    case 'RUN_CAMPAIGN_PROMOTION':
      return 'Add an explicit campaign callout while viewers are active.';
    case 'TAKE_SHORT_BREAK':
      return 'Take a brief break to maintain stream energy and quality.';
    default:
      return 'Follow the linked coaching recommendation during the live session.';
  }
}

function findRecommendation(
  recommendations: SessionRecommendations | null,
  recommendationType: LiveRecommendation['recommendationType'],
): LiveRecommendation | undefined {
  return recommendations?.recommendations.find(
    (item) => item.recommendationType === recommendationType,
  );
}

function createAlert(input: {
  alertType: LiveCoachAlertType;
  confidenceScore: number;
  title: string;
  message: string;
  recommendedAction: string;
  relatedRecommendationId: string | null;
  relatedEventIds: string[];
  generatedAt: Date;
}): LiveCoachAlert {
  const confidenceScore = clampConfidenceScore(input.confidenceScore);

  return {
    id: input.alertType.toLowerCase(),
    alertType: input.alertType,
    priority: deriveAlertPriority(confidenceScore, input.alertType),
    title: input.title,
    message: input.message,
    recommendedAction: input.recommendedAction,
    relatedRecommendationId: input.relatedRecommendationId,
    relatedEventIds: input.relatedEventIds,
    confidenceScore,
    generatedAt: input.generatedAt.toISOString(),
  };
}

function getRecentEvents(
  events: CoachAlertEventInput[],
  sessionStartedAt: Date | null,
): CoachAlertEventInput[] {
  if (events.length === 0) {
    return [];
  }

  const maxOffset = Math.max(
    ...events.map((event) => resolveEventOffsetMs(event, sessionStartedAt)),
  );
  const cutoff = Math.max(0, maxOffset - RECENT_ALERT_WINDOW_MS);

  return events.filter((event) => resolveEventOffsetMs(event, sessionStartedAt) >= cutoff);
}

function parseGiftValue(payload: unknown): number {
  const record = toRecord(payload);

  if (typeof record.diamondValue === 'number' && Number.isFinite(record.diamondValue)) {
    return record.diamondValue;
  }

  if (typeof record.currencyEquivalent === 'number' && Number.isFinite(record.currencyEquivalent)) {
    return record.currencyEquivalent;
  }

  return 0;
}

function appendUniqueAlert(
  alerts: LiveCoachAlert[],
  seenTypes: Set<LiveCoachAlertType>,
  alert: LiveCoachAlert | null,
): void {
  if (!alert || seenTypes.has(alert.alertType)) {
    return;
  }

  seenTypes.add(alert.alertType);
  alerts.push(alert);
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
