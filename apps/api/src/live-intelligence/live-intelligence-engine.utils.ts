import type { LiveSessionStatus, SessionIntelligenceSnapshot } from '@kolab/types';
import { SessionIntelligenceSnapshotSchema } from '@kolab/types';

import { parseSessionCoachAlerts } from './live-intelligence-coach-alerts.utils';
import { parseSessionRecommendations } from './live-intelligence-recommendations.utils';
import {
  buildLiveSessionSummary,
  type LiveSessionSummary,
  parseLiveSessionSummary,
  type SummaryEventInput,
  type SummaryGifterInput,
} from './live-intelligence-session-summary.utils';
import { buildSessionHighlights } from './live-intelligence-timeline.utils';
import {
  buildSessionTriggerAnalysis,
  parseSessionTriggerAnalysis,
  type SessionTriggerAnalysis,
} from './live-intelligence-trigger-analysis.utils';

export const INTELLIGENCE_SNAPSHOT_METADATA_KEY = 'intelligenceSnapshot';

export type IntelligenceEventInput = SummaryEventInput;

export type IntelligenceGifterInput = SummaryGifterInput;

export type BuildIntelligenceSnapshotInput = {
  session: {
    id: string;
    creatorProfileId: string;
    status: LiveSessionStatus;
    startedAt: Date | null;
    durationSeconds: number | null;
    totalViewers: number | null;
    peakViewers: number | null;
    totalGifts: number | null;
    totalGiftValue: { toString: () => string } | null;
    metadata: unknown;
  };
  events: IntelligenceEventInput[];
  topGifters: IntelligenceGifterInput[];
  generatedAt?: Date;
};

export function clampIntelligenceScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function buildIntelligenceSnapshot(
  input: BuildIntelligenceSnapshotInput,
): SessionIntelligenceSnapshot {
  const generatedAt = input.generatedAt ?? new Date();
  const storedSummary = parseLiveSessionSummary(input.session.id, input.session.metadata);
  const summary =
    storedSummary ??
    buildLiveSessionSummary({
      session: input.session,
      events: input.events,
      topGifters: input.topGifters,
      generatedAt,
    });
  const storedTriggerAnalysis = parseSessionTriggerAnalysis(
    input.session.id,
    input.session.metadata,
  );
  const triggerAnalysis =
    storedTriggerAnalysis ?? buildTriggerAnalysisFromEvents(input, generatedAt);
  const recommendations = parseSessionRecommendations(input.session.id, input.session.metadata);
  const coachAlerts = parseSessionCoachAlerts(input.session.id, input.session.metadata);
  const highlights = buildSessionHighlights(input.events, input.session.startedAt);
  const totalGiftValue = resolveTotalGiftValue(input.session, input.events);

  const sessionHealthScore = computeSessionHealthScore(summary);
  const revenueScore = computeRevenueScore(totalGiftValue, summary);
  const engagementScore = computeEngagementScore(input.session, highlights);
  const consistencyScore = computeConsistencyScore(input.session, summary);
  const gifterQualityScore = computeGifterQualityScore(summary, input.topGifters);
  const coachingOpportunityScore = computeCoachingOpportunityScore(
    summary,
    recommendations,
    coachAlerts,
  );
  const overallScore = clampIntelligenceScore(
    (sessionHealthScore +
      revenueScore +
      engagementScore +
      consistencyScore +
      gifterQualityScore +
      (100 - coachingOpportunityScore)) /
      6,
  );

  const topSignals = buildTopSignals(highlights, triggerAnalysis, summary);
  const bestMoments = buildBestMoments(summary, highlights);
  const weakMoments = buildWeakMoments(summary, highlights, recommendations);
  const dataQualityWarnings = buildDataQualityWarnings({
    summary,
    triggerAnalysisAvailable: storedTriggerAnalysis !== null,
    storedSummaryAvailable: storedSummary !== null,
    recommendations,
    coachAlerts,
  });

  return {
    sessionId: input.session.id,
    creatorProfileId: input.session.creatorProfileId,
    generatedAt: generatedAt.toISOString(),
    sessionHealthScore,
    revenueScore,
    engagementScore,
    consistencyScore,
    gifterQualityScore,
    coachingOpportunityScore,
    overallScore,
    keyStrengths: buildKeyStrengths({
      revenueScore,
      engagementScore,
      gifterQualityScore,
      summary,
      triggerAnalysis,
    }),
    keyRisks: buildKeyRisks({
      revenueScore,
      engagementScore,
      sessionHealthScore,
      summary,
      recommendations,
    }),
    topSignals,
    topGifters: summary.topGifters,
    topTriggerTypes:
      summary.triggerSummary?.topTriggerTypes.map((entry) => ({
        triggerType: entry.triggerType,
        count: entry.count,
      })) ?? [],
    bestMoments,
    weakMoments,
    recommendedNextActions: buildRecommendedNextActions(summary, recommendations, coachAlerts),
    dataQualityWarnings,
  };
}

export function parseIntelligenceSnapshot(
  sessionId: string,
  metadata: unknown,
): SessionIntelligenceSnapshot | null {
  const record = toRecord(metadata);
  const snapshot = record[INTELLIGENCE_SNAPSHOT_METADATA_KEY];

  if (typeof snapshot !== 'object' || snapshot === null || Array.isArray(snapshot)) {
    return null;
  }

  const parsed = SessionIntelligenceSnapshotSchema.safeParse({
    ...snapshot,
    sessionId,
  });

  if (!parsed.success || parsed.data.sessionId !== sessionId) {
    return null;
  }

  return parsed.data;
}

function buildTriggerAnalysisFromEvents(
  input: BuildIntelligenceSnapshotInput,
  generatedAt: Date,
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
    generatedAt,
  );
}

function computeSessionHealthScore(summary: LiveSessionSummary): number {
  const health = summary.timelineHealth;
  let score =
    health.status === 'HEALTHY'
      ? 85
      : health.status === 'PARTIAL'
        ? 55
        : health.status === 'INCOMPLETE'
          ? 25
          : 0;

  if (health.totalEvents === 0) {
    return 0;
  }

  const offsetCoverage = health.eventsWithOffsetMs / Math.max(health.totalEvents, 1);
  score += offsetCoverage * 10;

  if (health.hasSessionStartedEvent) {
    score += 5;
  }

  if (health.hasSessionEndedEvent) {
    score += 5;
  }

  if (health.gifterRollupProcessed) {
    score += 5;
  }

  if (health.triggerAnalysisAvailable) {
    score += 5;
  }

  return clampIntelligenceScore(score);
}

function computeRevenueScore(totalGiftValue: number, summary: LiveSessionSummary): number {
  if (totalGiftValue <= 0) {
    return summary.totalGifts && summary.totalGifts > 0 ? 20 : 0;
  }

  if (totalGiftValue >= 10_000) {
    return 95;
  }

  if (totalGiftValue >= 5_000) {
    return 85;
  }

  if (totalGiftValue >= 1_000) {
    return 70;
  }

  if (totalGiftValue >= 100) {
    return 50;
  }

  return clampIntelligenceScore(25 + totalGiftValue / 4);
}

function computeEngagementScore(
  session: BuildIntelligenceSnapshotInput['session'],
  highlights: ReturnType<typeof buildSessionHighlights>,
): number {
  let score = 0;

  if (session.peakViewers !== null) {
    score += Math.min(40, session.peakViewers / 5);
  }

  if (session.totalViewers !== null) {
    score += Math.min(30, session.totalViewers / 20);
  }

  const viewerSpikes = highlights.filter((highlight) => highlight.type === 'VIEWER_SPIKE').length;
  score += Math.min(20, viewerSpikes * 10);

  if (session.totalGifts !== null) {
    score += Math.min(20, session.totalGifts * 4);
  }

  if (session.peakViewers === null && session.totalViewers === null) {
    score = Math.min(score, 30);
  }

  return clampIntelligenceScore(score);
}

function computeConsistencyScore(
  session: BuildIntelligenceSnapshotInput['session'],
  summary: LiveSessionSummary,
): number {
  let score = 0;

  if (session.status === 'ENDED') {
    score += 35;
  }

  if (session.durationSeconds !== null && session.durationSeconds > 0) {
    score += Math.min(25, session.durationSeconds / 240);
  }

  if (summary.timelineHealth.hasSessionStartedEvent) {
    score += 15;
  }

  if (summary.timelineHealth.hasSessionEndedEvent) {
    score += 15;
  }

  if (summary.triggerSummary) {
    score += 5;
  }

  if (summary.timelineHealth.gifterRollupProcessed) {
    score += 5;
  }

  return clampIntelligenceScore(score);
}

function computeGifterQualityScore(
  summary: LiveSessionSummary,
  topGifters: IntelligenceGifterInput[],
): number {
  if (topGifters.length === 0) {
    return summary.topGiftEvents.length > 0 ? 20 : 10;
  }

  let score = 20;
  const premiumTiers = topGifters.filter((gifter) =>
    gifter.spendingTier ? ['WHALE', 'VIP'].includes(gifter.spendingTier) : false,
  );

  score += Math.min(50, premiumTiers.length * 25);
  score += Math.min(15, topGifters.length * 5);

  if (summary.timelineHealth.gifterRollupProcessed) {
    score += 15;
  }

  return clampIntelligenceScore(score);
}

function computeCoachingOpportunityScore(
  summary: LiveSessionSummary,
  recommendations: ReturnType<typeof parseSessionRecommendations>,
  coachAlerts: ReturnType<typeof parseSessionCoachAlerts>,
): number {
  let score = summary.complianceWarnings.length * 8;
  score += (recommendations?.recommendations.length ?? 0) * 10;
  score += (coachAlerts?.alerts.length ?? 0) * 8;
  score += summary.coachingNotes.length * 5;

  if (summary.topGiftEvents.length === 0) {
    score += 10;
  }

  return clampIntelligenceScore(score);
}

function buildTopSignals(
  highlights: ReturnType<typeof buildSessionHighlights>,
  triggerAnalysis: SessionTriggerAnalysis | null,
  summary: LiveSessionSummary,
): SessionIntelligenceSnapshot['topSignals'] {
  const signals: SessionIntelligenceSnapshot['topSignals'] = [];

  for (const highlight of highlights.slice(0, 5)) {
    signals.push({
      signalType: highlight.type,
      label: highlight.label,
      value:
        typeof highlight.metadata.giftValue === 'number'
          ? highlight.metadata.giftValue
          : typeof highlight.metadata.joinCount === 'number'
            ? highlight.metadata.joinCount
            : null,
      relatedEventIds: highlight.eventIds,
    });
  }

  for (const item of triggerAnalysis?.items.slice(0, 3) ?? []) {
    signals.push({
      signalType: item.triggerType,
      label: item.label,
      value: item.giftValue,
      relatedEventIds: item.relatedEventIds,
    });
  }

  if (signals.length === 0 && summary.topGiftEvents.length > 0) {
    const topGift = summary.topGiftEvents[0];
    signals.push({
      signalType: 'TOP_GIFT_EVENT',
      label: 'Top gift event correlated with timeline activity',
      value: topGift.giftValue,
      relatedEventIds: [topGift.eventId],
    });
  }

  return signals.slice(0, 8);
}

function buildBestMoments(
  summary: LiveSessionSummary,
  highlights: ReturnType<typeof buildSessionHighlights>,
): SessionIntelligenceSnapshot['bestMoments'] {
  const positiveTypes = new Set([
    'HIGH_VALUE_GIFT',
    'GIFT_SPIKE',
    'VIEWER_SPIKE',
    'SONG_STARTED',
    'PK_STARTED',
    'PERFORMANCE_MOMENT',
  ]);

  const fromHighlights = highlights
    .filter((highlight) => positiveTypes.has(highlight.type))
    .map((highlight) => ({
      type: highlight.type,
      label: highlight.label,
      offsetMs: highlight.offsetMs,
      eventIds: highlight.eventIds,
    }));

  if (fromHighlights.length > 0) {
    return fromHighlights.slice(0, 5);
  }

  return summary.topMoments.slice(0, 5).map((moment) => ({
    type: moment.type,
    label: moment.label,
    offsetMs: moment.offsetMs,
    eventIds: moment.eventIds,
  }));
}

function buildWeakMoments(
  summary: LiveSessionSummary,
  highlights: ReturnType<typeof buildSessionHighlights>,
  recommendations: ReturnType<typeof parseSessionRecommendations>,
): SessionIntelligenceSnapshot['weakMoments'] {
  const weakMoments: SessionIntelligenceSnapshot['weakMoments'] = [];

  if (summary.topGiftEvents.length === 0) {
    weakMoments.push({
      type: 'LOW_GIFT_ACTIVITY',
      label: 'No gift events captured in timeline',
      offsetMs: null,
      eventIds: [],
    });
  }

  if (summary.timelineHealth.missingOffsetMsCount > 0) {
    weakMoments.push({
      type: 'TIMELINE_ALIGNMENT',
      label: 'Timeline events missing offsetMs alignment',
      offsetMs: null,
      eventIds: [],
    });
  }

  const endPk = recommendations?.recommendations.find(
    (item) => item.recommendationType === 'END_PK',
  );
  if (endPk) {
    weakMoments.push({
      type: 'END_PK',
      label: endPk.title,
      offsetMs: null,
      eventIds: [],
    });
  }

  const lowEngagement = highlights.filter((highlight) => highlight.type === 'SESSION_ENDED');
  if (summary.totalViewers !== null && summary.totalViewers < 20 && lowEngagement.length > 0) {
    weakMoments.push({
      type: 'LOW_VIEWER_RETENTION',
      label: 'Viewer totals remained low through session end',
      offsetMs: lowEngagement[0]?.offsetMs ?? null,
      eventIds: lowEngagement[0]?.eventIds ?? [],
    });
  }

  return weakMoments.slice(0, 5);
}

function buildKeyStrengths(input: {
  revenueScore: number;
  engagementScore: number;
  gifterQualityScore: number;
  summary: LiveSessionSummary;
  triggerAnalysis: SessionTriggerAnalysis | null;
}): string[] {
  const strengths: string[] = [];

  if (input.revenueScore >= 70) {
    strengths.push('Gift revenue correlated strongly with captured timeline activity.');
  }

  if (input.engagementScore >= 60) {
    strengths.push('Viewer engagement signals suggest an active audience during the session.');
  }

  if (input.gifterQualityScore >= 60) {
    strengths.push('High-tier supporter rollups indicate meaningful gifter quality.');
  }

  if ((input.triggerAnalysis?.summary.totalTriggers ?? 0) > 0) {
    strengths.push('Repeatable trigger patterns were detected in timeline correlations.');
  }

  if (input.summary.timelineHealth.status === 'HEALTHY') {
    strengths.push('Timeline data quality appears sufficient for downstream coaching analysis.');
  }

  return strengths.slice(0, 5);
}

function buildKeyRisks(input: {
  revenueScore: number;
  engagementScore: number;
  sessionHealthScore: number;
  summary: LiveSessionSummary;
  recommendations: ReturnType<typeof parseSessionRecommendations>;
}): string[] {
  const risks: string[] = [];

  if (input.revenueScore < 40) {
    risks.push('Gift revenue signals appear weak relative to session activity.');
  }

  if (input.engagementScore < 40) {
    risks.push('Viewer engagement signals may be insufficient to sustain momentum.');
  }

  if (input.sessionHealthScore < 50) {
    risks.push('Timeline completeness issues may reduce confidence in coaching insights.');
  }

  for (const warning of input.summary.complianceWarnings.slice(0, 2)) {
    risks.push(warning);
  }

  const velocityRisk = input.recommendations?.recommendations.find(
    (item) => item.recommendationType === 'ENGAGE_TOP_GIFTER',
  );
  if (velocityRisk) {
    risks.push('Gift velocity may have declined during the session window.');
  }

  return risks.slice(0, 5);
}

function buildRecommendedNextActions(
  summary: LiveSessionSummary,
  recommendations: ReturnType<typeof parseSessionRecommendations>,
  coachAlerts: ReturnType<typeof parseSessionCoachAlerts>,
): string[] {
  const actions = new Set<string>();

  for (const note of summary.coachingNotes) {
    actions.add(note);
  }

  for (const recommendation of recommendations?.recommendations ?? []) {
    actions.add(recommendation.description);
  }

  for (const alert of coachAlerts?.alerts ?? []) {
    actions.add(alert.recommendedAction);
  }

  if (actions.size === 0 && summary.topGiftEvents.length === 0) {
    actions.add(
      'Review engagement tactics and ingest richer timeline events for the next session.',
    );
  }

  return [...actions].slice(0, 8);
}

function buildDataQualityWarnings(input: {
  summary: LiveSessionSummary;
  triggerAnalysisAvailable: boolean;
  storedSummaryAvailable: boolean;
  recommendations: ReturnType<typeof parseSessionRecommendations>;
  coachAlerts: ReturnType<typeof parseSessionCoachAlerts>;
}): string[] {
  const warnings = [...input.summary.complianceWarnings];

  if (!input.triggerAnalysisAvailable) {
    warnings.push(
      'Trigger analysis snapshot was not available; trigger signals were derived inline or omitted.',
    );
  }

  if (!input.storedSummaryAvailable) {
    warnings.push('Session summary snapshot was generated inline during intelligence scoring.');
  }

  if (!input.recommendations) {
    warnings.push('Recommendations snapshot was not available; next actions may be limited.');
  }

  if (!input.coachAlerts) {
    warnings.push('Coach alerts snapshot was not available; live alert signals were omitted.');
  }

  return [...new Set(warnings)].slice(0, 8);
}

function resolveTotalGiftValue(
  session: BuildIntelligenceSnapshotInput['session'],
  events: IntelligenceEventInput[],
): number {
  if (session.totalGiftValue) {
    const parsed = Number(session.totalGiftValue.toString());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return events
    .filter((event) => event.eventType === 'GIFT_RECEIVED')
    .reduce((sum, event) => sum + parseGiftValue(event.payload), 0);
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

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
