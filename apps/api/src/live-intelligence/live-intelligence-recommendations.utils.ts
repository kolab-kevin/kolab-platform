import type { LiveSessionStatus } from '@kolab/types';
import { SessionRecommendationsResponseSchema } from '@kolab/types';

import {
  buildSessionHighlights,
  resolveEventOffsetMs,
  type TimelineEventInput,
} from './live-intelligence-timeline.utils';
import {
  buildSessionTriggerAnalysis,
  parseSessionTriggerAnalysis,
  type SessionTriggerAnalysis,
  type TriggerAnalysisItem,
} from './live-intelligence-trigger-analysis.utils';

export const RECOMMENDATIONS_METADATA_KEY = 'recommendations';

export const LONG_STREAM_BREAK_SECONDS = 5_400;
export const EXTENDED_STREAM_BREAK_SECONDS = 7_200;
export const GIFT_VELOCITY_DECLINE_RATIO = 0.6;
export const PK_UNDERPERFORM_GIFT_VALUE = 100;

export type LiveRecommendationType =
  | 'TRY_MUSIC'
  | 'START_PK'
  | 'END_PK'
  | 'ENGAGE_TOP_GIFTER'
  | 'WELCOME_NEW_VIEWERS'
  | 'THANK_TOP_SUPPORTERS'
  | 'TAKE_SHORT_BREAK'
  | 'IMPROVE_CONSISTENCY'
  | 'RUN_CAMPAIGN_PROMOTION'
  | 'FOLLOW_UP_WITH_WHALES';

export type LiveRecommendationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type LiveRecommendation = {
  id: string;
  recommendationType: LiveRecommendationType;
  priority: LiveRecommendationPriority;
  confidenceScore: number;
  title: string;
  description: string;
  supportingEvidence: string[];
  generatedAt: string;
};

export type SessionRecommendations = {
  sessionId: string;
  generatedAt: string;
  recommendations: LiveRecommendation[];
};

export type RecommendationEventInput = TimelineEventInput;

export type RecommendationGifterInput = {
  gifterProfileId: string;
  externalGifterId: string;
  displayName: string | null;
  giftCount: number;
  giftValue: number | string;
  spendingTier: string | null;
};

export type RecommendationScheduleInput = {
  weekdays: number[];
  startTime: string;
  endTime: string;
  active: boolean;
};

export type RecommendationRecentSessionInput = {
  id: string;
  startedAt: Date | null;
  status: string;
};

export type AbsentWhaleInput = {
  gifterProfileId: string;
  externalGifterId: string;
  displayName: string | null;
  lastSessionId: string;
  lastGiftValue: number;
};

export type BuildSessionRecommendationsInput = {
  session: {
    id: string;
    creatorProfileId: string;
    campaignId: string | null;
    status: LiveSessionStatus;
    startedAt: Date | null;
    durationSeconds: number | null;
    metadata: unknown;
  };
  events: RecommendationEventInput[];
  topGifters: RecommendationGifterInput[];
  recentSessions: RecommendationRecentSessionInput[];
  schedules: RecommendationScheduleInput[];
  absentWhales: AbsentWhaleInput[];
  generatedAt?: Date;
};

const IMPACT_WEIGHT: Record<LiveRecommendationType, number> = {
  TRY_MUSIC: 0.9,
  START_PK: 0.85,
  END_PK: 0.8,
  ENGAGE_TOP_GIFTER: 0.9,
  WELCOME_NEW_VIEWERS: 0.75,
  THANK_TOP_SUPPORTERS: 0.85,
  TAKE_SHORT_BREAK: 0.7,
  IMPROVE_CONSISTENCY: 0.65,
  RUN_CAMPAIGN_PROMOTION: 0.8,
  FOLLOW_UP_WITH_WHALES: 0.9,
};

const PRIORITY_ORDER: Record<LiveRecommendationPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

export function clampConfidenceScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, Math.round(value * 100) / 100));
}

export function deriveRecommendationPriority(
  confidenceScore: number,
  recommendationType: LiveRecommendationType,
): LiveRecommendationPriority {
  const composite = clampConfidenceScore(confidenceScore) * IMPACT_WEIGHT[recommendationType];

  if (composite >= 0.65) {
    return 'HIGH';
  }

  if (composite >= 0.35) {
    return 'MEDIUM';
  }

  return 'LOW';
}

export function buildSessionRecommendations(
  input: BuildSessionRecommendationsInput,
): SessionRecommendations {
  const generatedAt = input.generatedAt ?? new Date();
  const highlights = buildSessionHighlights(input.events, input.session.startedAt);
  const triggerAnalysis =
    parseSessionTriggerAnalysis(input.session.id, input.session.metadata) ??
    buildTriggerAnalysisFromEvents(input);
  const giftEvents = buildGiftEvents(input.events, input.session.startedAt);

  const recommendations: LiveRecommendation[] = [];

  appendIfPresent(recommendations, buildTryMusicRecommendation(triggerAnalysis, generatedAt));
  appendIfPresent(recommendations, buildStartPkRecommendation(triggerAnalysis, generatedAt));
  appendIfPresent(
    recommendations,
    buildEndPkRecommendation(input.events, triggerAnalysis, generatedAt),
  );
  appendIfPresent(
    recommendations,
    buildEngageTopGifterRecommendation(giftEvents, input.topGifters, generatedAt),
  );
  appendIfPresent(recommendations, buildWelcomeNewViewersRecommendation(highlights, generatedAt));
  appendIfPresent(
    recommendations,
    buildThankTopSupportersRecommendation(input.topGifters, triggerAnalysis, generatedAt),
  );
  appendIfPresent(recommendations, buildTakeShortBreakRecommendation(input.session, generatedAt));
  appendIfPresent(
    recommendations,
    buildImproveConsistencyRecommendation(input.recentSessions, input.schedules, generatedAt),
  );
  appendIfPresent(
    recommendations,
    buildRunCampaignPromotionRecommendation(input.session, input.events, generatedAt),
  );
  appendIfPresent(
    recommendations,
    buildFollowUpWithWhalesRecommendation(input.absentWhales, generatedAt),
  );

  recommendations.sort((left, right) => {
    const priorityDelta = PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const confidenceDelta = right.confidenceScore - left.confidenceScore;
    if (confidenceDelta !== 0) {
      return confidenceDelta;
    }

    return left.recommendationType.localeCompare(right.recommendationType);
  });

  return {
    sessionId: input.session.id,
    generatedAt: generatedAt.toISOString(),
    recommendations,
  };
}

export function parseSessionRecommendations(
  sessionId: string,
  metadata: unknown,
): SessionRecommendations | null {
  const record = toRecord(metadata);
  const snapshot = record[RECOMMENDATIONS_METADATA_KEY];

  if (typeof snapshot !== 'object' || snapshot === null || Array.isArray(snapshot)) {
    return null;
  }

  const parsed = SessionRecommendationsResponseSchema.safeParse({
    ...snapshot,
    sessionId,
  });

  if (!parsed.success || parsed.data.sessionId !== sessionId) {
    return null;
  }

  return parsed.data;
}

function buildTriggerAnalysisFromEvents(
  input: BuildSessionRecommendationsInput,
): SessionTriggerAnalysis | null {
  if (input.events.length === 0) {
    return null;
  }

  return buildSessionTriggerAnalysis(
    input.session.id,
    input.events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
      offsetMs: event.offsetMs,
      payload: event.payload,
      metadata: {},
    })),
    input.session.startedAt,
  );
}

function buildTryMusicRecommendation(
  triggerAnalysis: SessionTriggerAnalysis | null,
  generatedAt: Date,
): LiveRecommendation | null {
  const musicTriggers = filterTriggers(triggerAnalysis, 'SONG_STARTED_GIFTS');
  if (musicTriggers.length === 0) {
    return null;
  }

  const topTrigger = musicTriggers.sort((left, right) => right.giftValue - left.giftValue)[0];
  const confidence = clampConfidenceScore(
    Math.max(topTrigger.confidenceScore, Math.min(1, topTrigger.giftValue / 2_000)),
  );

  return createRecommendation({
    recommendationType: 'TRY_MUSIC',
    confidenceScore: confidence,
    title: 'Repeat music segments that drove gifts',
    description:
      'Song starts correlated with gift activity in this session. Reuse strong setlist moments in the next live.',
    supportingEvidence: [
      `${musicTriggers.length} song-start trigger(s) detected.`,
      `Top correlated gift value: ${topTrigger.giftValue}.`,
      `Related timeline events: ${topTrigger.relatedEventIds.join(', ')}.`,
    ],
    generatedAt,
  });
}

function buildStartPkRecommendation(
  triggerAnalysis: SessionTriggerAnalysis | null,
  generatedAt: Date,
): LiveRecommendation | null {
  const pkTriggers = filterTriggers(triggerAnalysis, 'PK_STARTED_GIFTS');
  if (pkTriggers.length === 0) {
    return null;
  }

  const topTrigger = pkTriggers.sort((left, right) => right.giftValue - left.giftValue)[0];
  const averagePkGiftValue =
    pkTriggers.reduce((sum, item) => sum + item.giftValue, 0) / pkTriggers.length;

  if (averagePkGiftValue < PK_UNDERPERFORM_GIFT_VALUE) {
    return null;
  }

  const confidence = clampConfidenceScore(
    Math.max(topTrigger.confidenceScore, Math.min(1, averagePkGiftValue / 1_500)),
  );

  return createRecommendation({
    recommendationType: 'START_PK',
    confidenceScore: confidence,
    title: 'Schedule PK battles during peak gift windows',
    description:
      'PK segments outperformed baseline gift activity. Plan battles when audience engagement is highest.',
    supportingEvidence: [
      `${pkTriggers.length} PK-start trigger(s) detected.`,
      `Average PK-window gift value: ${Math.round(averagePkGiftValue)}.`,
      `Best PK window gift value: ${topTrigger.giftValue}.`,
    ],
    generatedAt,
  });
}

function buildEndPkRecommendation(
  events: RecommendationEventInput[],
  triggerAnalysis: SessionTriggerAnalysis | null,
  generatedAt: Date,
): LiveRecommendation | null {
  const pkStartedCount = events.filter((event) => event.eventType === 'PK_STARTED').length;
  if (pkStartedCount === 0) {
    return null;
  }

  const pkTriggers = filterTriggers(triggerAnalysis, 'PK_STARTED_GIFTS');
  const averagePkGiftValue =
    pkTriggers.length > 0
      ? pkTriggers.reduce((sum, item) => sum + item.giftValue, 0) / pkTriggers.length
      : 0;

  if (pkTriggers.length > 0 && averagePkGiftValue >= PK_UNDERPERFORM_GIFT_VALUE) {
    return null;
  }

  const confidence = clampConfidenceScore(
    pkTriggers.length === 0
      ? 0.75
      : Math.max(0.45, 1 - averagePkGiftValue / PK_UNDERPERFORM_GIFT_VALUE),
  );

  return createRecommendation({
    recommendationType: 'END_PK',
    confidenceScore: confidence,
    title: 'End underperforming PK segments earlier',
    description:
      'PK periods did not sustain gift momentum in this session. Shorten or pause PK when conversion drops.',
    supportingEvidence: [
      `${pkStartedCount} PK segment(s) started.`,
      pkTriggers.length === 0
        ? 'No gift activity correlated within 30s after PK starts.'
        : `Average PK-window gift value (${Math.round(averagePkGiftValue)}) is below target.`,
    ],
    generatedAt,
  });
}

function buildEngageTopGifterRecommendation(
  giftEvents: Array<{ offsetMs: number; giftValue: number }>,
  topGifters: RecommendationGifterInput[],
  generatedAt: Date,
): LiveRecommendation | null {
  if (giftEvents.length < 2 || topGifters.length === 0) {
    return null;
  }

  const maxOffset = Math.max(...giftEvents.map((event) => event.offsetMs));
  const midpoint = maxOffset / 2;
  const firstHalfValue = giftEvents
    .filter((event) => event.offsetMs <= midpoint)
    .reduce((sum, event) => sum + event.giftValue, 0);
  const secondHalfValue = giftEvents
    .filter((event) => event.offsetMs > midpoint)
    .reduce((sum, event) => sum + event.giftValue, 0);

  if (firstHalfValue <= 0 || secondHalfValue >= firstHalfValue * GIFT_VELOCITY_DECLINE_RATIO) {
    return null;
  }

  const declineRatio = secondHalfValue / firstHalfValue;
  const topGifter = topGifters[0];
  const confidence = clampConfidenceScore(Math.min(1, (1 - declineRatio) * 1.1));

  return createRecommendation({
    recommendationType: 'ENGAGE_TOP_GIFTER',
    confidenceScore: confidence,
    title: 'Re-engage top gifters after gift velocity declined',
    description:
      'Gift velocity dropped in the second half of the stream. Directly acknowledge top supporters to recover momentum.',
    supportingEvidence: [
      `First-half gift value: ${Math.round(firstHalfValue)}.`,
      `Second-half gift value: ${Math.round(secondHalfValue)}.`,
      `Top gifter candidate: ${topGifter.displayName ?? topGifter.externalGifterId}.`,
    ],
    generatedAt,
  });
}

function buildWelcomeNewViewersRecommendation(
  highlights: ReturnType<typeof buildSessionHighlights>,
  generatedAt: Date,
): LiveRecommendation | null {
  const viewerSpikes = highlights.filter((highlight) => highlight.type === 'VIEWER_SPIKE');
  if (viewerSpikes.length === 0) {
    return null;
  }

  const topSpike = viewerSpikes.sort(
    (left, right) => Number(right.metadata.joinCount ?? 0) - Number(left.metadata.joinCount ?? 0),
  )[0];
  const joinCount = Number(topSpike.metadata.joinCount ?? 0);
  const confidence = clampConfidenceScore(Math.min(1, joinCount / 15));

  return createRecommendation({
    recommendationType: 'WELCOME_NEW_VIEWERS',
    confidenceScore: confidence,
    title: 'Welcome incoming viewer spikes with a clear hook',
    description:
      'Many viewers joined in a short window. Use an immediate welcome and content hook to retain the spike.',
    supportingEvidence: [
      `${viewerSpikes.length} viewer join spike(s) detected.`,
      `Peak spike join count: ${joinCount}.`,
      `Highlight event IDs: ${topSpike.eventIds.join(', ')}.`,
    ],
    generatedAt,
  });
}

function buildThankTopSupportersRecommendation(
  topGifters: RecommendationGifterInput[],
  triggerAnalysis: SessionTriggerAnalysis | null,
  generatedAt: Date,
): LiveRecommendation | null {
  const supporterTiers = new Set(['WHALE', 'VIP']);
  const topSupporters = topGifters.filter((gifter) =>
    gifter.spendingTier ? supporterTiers.has(gifter.spendingTier) : false,
  );
  const highValueTriggers = filterTriggers(triggerAnalysis, 'HIGH_VALUE_GIFT');

  if (topSupporters.length === 0 && highValueTriggers.length === 0) {
    return null;
  }

  const supporter = topSupporters[0];
  const confidence = clampConfidenceScore(
    Math.max(
      supporter ? 0.7 : 0.55,
      Math.min(1, highValueTriggers.length * 0.2 + topSupporters.length * 0.25),
    ),
  );

  return createRecommendation({
    recommendationType: 'THANK_TOP_SUPPORTERS',
    confidenceScore: confidence,
    title: 'Thank whale and VIP supporters while momentum is fresh',
    description:
      'High-tier supporters contributed during this session. Send a timely thank-you or follow-up to reinforce retention.',
    supportingEvidence: [
      topSupporters.length > 0
        ? `${topSupporters.length} whale/VIP supporter(s) in session rollups.`
        : 'No whale/VIP rollups found.',
      highValueTriggers.length > 0
        ? `${highValueTriggers.length} high-value gift trigger(s) detected.`
        : 'No high-value gift triggers detected.',
      supporter
        ? `Top supporter: ${supporter.displayName ?? supporter.externalGifterId}.`
        : 'Review high-value gift timeline moments.',
    ],
    generatedAt,
  });
}

function buildTakeShortBreakRecommendation(
  session: BuildSessionRecommendationsInput['session'],
  generatedAt: Date,
): LiveRecommendation | null {
  const durationSeconds = session.durationSeconds;
  if (durationSeconds === null || durationSeconds < LONG_STREAM_BREAK_SECONDS) {
    return null;
  }

  const confidence = clampConfidenceScore(
    durationSeconds >= EXTENDED_STREAM_BREAK_SECONDS
      ? 0.9
      : (durationSeconds - LONG_STREAM_BREAK_SECONDS) /
          (EXTENDED_STREAM_BREAK_SECONDS - LONG_STREAM_BREAK_SECONDS),
  );

  return createRecommendation({
    recommendationType: 'TAKE_SHORT_BREAK',
    confidenceScore: confidence,
    title: 'Take a short break to sustain stream quality',
    description:
      'The session ran continuously for an extended period. Schedule brief breaks to maintain energy and engagement.',
    supportingEvidence: [
      `Session duration: ${durationSeconds} seconds.`,
      `Break threshold: ${LONG_STREAM_BREAK_SECONDS} seconds.`,
      session.status === 'LIVE' ? 'Session is still live.' : 'Session has ended.',
    ],
    generatedAt,
  });
}

function buildImproveConsistencyRecommendation(
  recentSessions: RecommendationRecentSessionInput[],
  schedules: RecommendationScheduleInput[],
  generatedAt: Date,
): LiveRecommendation | null {
  const activeSchedules = schedules.filter((schedule) => schedule.active);
  const sessionsWithStart = recentSessions.filter((session) => session.startedAt instanceof Date);

  if (activeSchedules.length === 0 || sessionsWithStart.length < 2) {
    return null;
  }

  const scheduledWeekdays = new Set(activeSchedules.flatMap((schedule) => schedule.weekdays));
  const mismatchedSessions = sessionsWithStart.filter((session) => {
    const weekday = session.startedAt?.getUTCDay();
    return weekday !== undefined && scheduledWeekdays.size > 0 && !scheduledWeekdays.has(weekday);
  });

  const mismatchRatio = mismatchedSessions.length / sessionsWithStart.length;
  if (mismatchRatio < 0.5) {
    return null;
  }

  const confidence = clampConfidenceScore(Math.min(1, mismatchRatio));

  return createRecommendation({
    recommendationType: 'IMPROVE_CONSISTENCY',
    confidenceScore: confidence,
    title: 'Align live sessions with the published schedule',
    description:
      'Recent sessions frequently fall outside scheduled weekdays. Improve consistency to build audience expectations.',
    supportingEvidence: [
      `${activeSchedules.length} active creator schedule(s) found.`,
      `${sessionsWithStart.length} recent ended session(s) analyzed.`,
      `${mismatchedSessions.length} session(s) started outside scheduled weekdays.`,
    ],
    generatedAt,
  });
}

function buildRunCampaignPromotionRecommendation(
  session: BuildSessionRecommendationsInput['session'],
  events: RecommendationEventInput[],
  generatedAt: Date,
): LiveRecommendation | null {
  if (!session.campaignId) {
    return null;
  }

  const campaignMoments = events.filter((event) => {
    if (event.eventType === 'PERFORMANCE_MOMENT') {
      return true;
    }

    const payload = toRecord(event.payload);
    return payload.campaignId === session.campaignId || payload.momentType === 'CAMPAIGN';
  });

  if (campaignMoments.length > 0) {
    return null;
  }

  return createRecommendation({
    recommendationType: 'RUN_CAMPAIGN_PROMOTION',
    confidenceScore: 0.72,
    title: 'Promote the linked campaign during the live session',
    description:
      'This session is linked to a campaign but no campaign promotion moments were captured. Add explicit campaign callouts.',
    supportingEvidence: [
      `Linked campaign ID: ${session.campaignId}.`,
      'No PERFORMANCE_MOMENT or campaign-tagged timeline events found.',
    ],
    generatedAt,
  });
}

function buildFollowUpWithWhalesRecommendation(
  absentWhales: AbsentWhaleInput[],
  generatedAt: Date,
): LiveRecommendation | null {
  if (absentWhales.length === 0) {
    return null;
  }

  const topWhale = absentWhales.sort((left, right) => right.lastGiftValue - left.lastGiftValue)[0];
  const confidence = clampConfidenceScore(Math.min(1, 0.5 + absentWhales.length * 0.15));

  return createRecommendation({
    recommendationType: 'FOLLOW_UP_WITH_WHALES',
    confidenceScore: confidence,
    title: 'Follow up with whales who did not return this session',
    description:
      'Known whale supporters gifted in prior sessions but were absent here. Prioritize personalized follow-up outreach.',
    supportingEvidence: [
      `${absentWhales.length} absent whale profile(s) identified.`,
      `Top absent whale: ${topWhale.displayName ?? topWhale.externalGifterId}.`,
      `Last session gift value: ${topWhale.lastGiftValue}.`,
    ],
    generatedAt,
  });
}

function createRecommendation(input: {
  recommendationType: LiveRecommendationType;
  confidenceScore: number;
  title: string;
  description: string;
  supportingEvidence: string[];
  generatedAt: Date;
}): LiveRecommendation {
  const confidenceScore = clampConfidenceScore(input.confidenceScore);

  return {
    id: input.recommendationType.toLowerCase(),
    recommendationType: input.recommendationType,
    priority: deriveRecommendationPriority(confidenceScore, input.recommendationType),
    confidenceScore,
    title: input.title,
    description: input.description,
    supportingEvidence: input.supportingEvidence,
    generatedAt: input.generatedAt.toISOString(),
  };
}

function filterTriggers(
  triggerAnalysis: SessionTriggerAnalysis | null,
  triggerType: TriggerAnalysisItem['triggerType'],
): TriggerAnalysisItem[] {
  return triggerAnalysis?.items.filter((item) => item.triggerType === triggerType) ?? [];
}

function buildGiftEvents(
  events: RecommendationEventInput[],
  sessionStartedAt: Date | null,
): Array<{ offsetMs: number; giftValue: number }> {
  return events
    .filter((event) => event.eventType === 'GIFT_RECEIVED')
    .map((event) => {
      const payload = toRecord(event.payload);
      const giftValue =
        typeof payload.diamondValue === 'number' && Number.isFinite(payload.diamondValue)
          ? payload.diamondValue
          : typeof payload.currencyEquivalent === 'number' &&
              Number.isFinite(payload.currencyEquivalent)
            ? payload.currencyEquivalent
            : 0;

      return {
        offsetMs: resolveEventOffsetMs(event, sessionStartedAt),
        giftValue,
      };
    })
    .filter((event) => event.giftValue > 0);
}

function appendIfPresent(
  recommendations: LiveRecommendation[],
  recommendation: LiveRecommendation | null,
): void {
  if (recommendation) {
    recommendations.push(recommendation);
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
