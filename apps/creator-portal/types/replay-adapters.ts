import type {
  GifterSessionStats,
  ListSessionGiftersResponse,
  LiveEvent,
  LiveReplaySegment,
  LiveSessionHighlight,
  LiveSessionHighlightType,
  SessionHighlightsResponse,
  SessionIntelligenceSnapshot,
  SessionReplayResponse,
  SessionTriggerAnalysisResponse,
  TriggerAnalysisItem,
} from '@kolab/types';

export type HighlightGroup =
  | 'topMoments'
  | 'giftSpikes'
  | 'viewerSpikes'
  | 'highValueGifts'
  | 'pkMoments'
  | 'songMoments'
  | 'performanceMoments';

export type GroupedHighlights = Record<HighlightGroup, LiveSessionHighlight[]>;

export type GifterDisplayModel = {
  profileId: string;
  displayName: string;
  spendingTier: string;
  giftCount: number;
  giftValue: string;
  lastGiftAt: string | null;
  sessionContribution: string;
  isWhale: boolean;
  isVip: boolean;
};

export type ReplayWorkspaceData = {
  sessionId: string | null;
  replay: SessionReplayResponse | null;
  highlights: GroupedHighlights;
  triggerAnalysis: SessionTriggerAnalysisResponse | null;
  gifters: GifterDisplayModel[];
  gifterNextCursor: string | null;
  intelligence: SessionIntelligenceSnapshot | null;
};

const HIGHLIGHT_GROUP_MAP: Partial<Record<LiveSessionHighlightType, HighlightGroup>> = {
  SESSION_STARTED: 'topMoments',
  SESSION_ENDED: 'topMoments',
  GIFT_SPIKE: 'giftSpikes',
  VIEWER_SPIKE: 'viewerSpikes',
  HIGH_VALUE_GIFT: 'highValueGifts',
  PK_STARTED: 'pkMoments',
  PK_ENDED: 'pkMoments',
  SONG_STARTED: 'songMoments',
  SONG_ENDED: 'songMoments',
  PERFORMANCE_MOMENT: 'performanceMoments',
};

export const HIGHLIGHT_GROUP_LABELS: Record<HighlightGroup, string> = {
  topMoments: 'Top moments',
  giftSpikes: 'Gift spikes',
  viewerSpikes: 'Viewer spikes',
  highValueGifts: 'High value gifts',
  pkMoments: 'PK moments',
  songMoments: 'Song moments',
  performanceMoments: 'Performance moments',
};

export function formatReplayLabel(value: string): string {
  return value.replaceAll('_', ' ');
}

export function formatOffsetMs(offsetMs: number): string {
  const totalMinutes = Math.floor(offsetMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatConfidenceScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function groupHighlights(response: SessionHighlightsResponse | null): GroupedHighlights {
  const grouped: GroupedHighlights = {
    topMoments: [],
    giftSpikes: [],
    viewerSpikes: [],
    highValueGifts: [],
    pkMoments: [],
    songMoments: [],
    performanceMoments: [],
  };

  if (!response) return grouped;

  for (const item of response.items) {
    const group = HIGHLIGHT_GROUP_MAP[item.type];
    if (group) grouped[group].push(item);
  }

  return grouped;
}

export function toGifterDisplayModels(response: ListSessionGiftersResponse | null): {
  items: GifterDisplayModel[];
  nextCursor: string | null;
} {
  if (!response) {
    return { items: [], nextCursor: null };
  }

  const items = response.items
    .map((item) => toGifterDisplayModel(item.profile, item.sessionStats))
    .sort((left, right) => Number.parseFloat(right.giftValue) - Number.parseFloat(left.giftValue));

  return { items, nextCursor: response.nextCursor };
}

export function toGifterDisplayModel(
  profile: ListSessionGiftersResponse['items'][number]['profile'],
  sessionStats: GifterSessionStats,
): GifterDisplayModel {
  return {
    profileId: profile.id,
    displayName: profile.displayName ?? profile.externalGifterId,
    spendingTier: profile.spendingTier,
    giftCount: sessionStats.giftCount,
    giftValue: sessionStats.giftValue,
    lastGiftAt: sessionStats.lastGiftAt,
    sessionContribution: sessionStats.giftValue,
    isWhale: profile.spendingTier === 'WHALE',
    isVip: profile.spendingTier === 'VIP',
  };
}

export function buildReplayWorkspaceData(input: {
  sessionId: string | null;
  replay: SessionReplayResponse | null;
  highlights: SessionHighlightsResponse | null;
  triggerAnalysis: SessionTriggerAnalysisResponse | null;
  gifters: ListSessionGiftersResponse | null;
  intelligence: SessionIntelligenceSnapshot | null;
}): ReplayWorkspaceData {
  const gifterModels = toGifterDisplayModels(input.gifters);

  return {
    sessionId: input.sessionId,
    replay: input.replay,
    highlights: groupHighlights(input.highlights),
    triggerAnalysis: input.triggerAnalysis,
    gifters: gifterModels.items,
    gifterNextCursor: gifterModels.nextCursor,
    intelligence: input.intelligence,
  };
}

export function createEmptyReplayWorkspaceData(): ReplayWorkspaceData {
  return buildReplayWorkspaceData({
    sessionId: null,
    replay: null,
    highlights: null,
    triggerAnalysis: null,
    gifters: null,
    intelligence: null,
  });
}

export function getReplaySegmentSummary(segment: LiveReplaySegment): string {
  return `${segment.eventCount} events · ${segment.viewerActivity.joins} joins · ${segment.giftActivity.giftCount} gifts`;
}

export function getTriggerEvidenceLines(item: TriggerAnalysisItem): string[] {
  const evidenceEntries = Object.entries(item.evidence);
  if (evidenceEntries.length === 0) return [];
  return evidenceEntries.map(([key, value]) => `${formatReplayLabel(key)}: ${String(value)}`);
}

export function getReplayEventLabel(event: LiveEvent): string {
  const payloadTitle = event.payload.title;
  if (typeof payloadTitle === 'string') return payloadTitle;
  if (event.actorDisplayName) {
    return `${formatReplayLabel(event.eventType)} · ${event.actorDisplayName}`;
  }
  return formatReplayLabel(event.eventType);
}
