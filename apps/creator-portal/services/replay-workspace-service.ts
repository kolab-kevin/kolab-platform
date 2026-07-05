import { getCreatorProfileId, useMockStudioData } from '@/lib/env';
import {
  buildReplayWorkspaceData,
  createEmptyReplayWorkspaceData,
  type ReplayWorkspaceData,
} from '@/types/replay-adapters';

import { fetchCreatorDashboard } from './dashboard-service';
import { fetchSessionGifters } from './gifter-service';
import { fetchSessionHighlights } from './highlight-service';
import { fetchSessionIntelligence } from './intelligence-service';
import { MOCK_LIVE_SESSION_ID } from './live-mock';
import {
  createMockReplayIntelligence,
  createMockSessionGifters,
  createMockSessionHighlights,
  createMockSessionReplay,
  createMockSessionTriggerAnalysis,
} from './replay-mock';
import { fetchSessionReplay } from './replay-service';
import { fetchSessionTriggerAnalysis } from './trigger-analysis-service';

export type ReplayWorkspaceDataSource = 'mock' | 'live' | 'empty' | 'partial';

export type ReplayWorkspaceFetchResult = {
  data: ReplayWorkspaceData;
  source: ReplayWorkspaceDataSource;
};

function resolveSessionIdFromDashboard(
  dashboard: Awaited<ReturnType<typeof fetchCreatorDashboard>>['data'],
): string | null {
  return dashboard.liveActivity.latestLiveSession?.id ?? null;
}

export async function fetchReplayWorkspace(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<ReplayWorkspaceFetchResult> {
  if (useMockStudioData()) {
    const sessionId = MOCK_LIVE_SESSION_ID;

    return {
      data: buildReplayWorkspaceData({
        sessionId,
        replay: createMockSessionReplay(creatorProfileId, sessionId),
        highlights: createMockSessionHighlights(sessionId),
        triggerAnalysis: createMockSessionTriggerAnalysis(sessionId),
        gifters: createMockSessionGifters(creatorProfileId, sessionId),
        intelligence: createMockReplayIntelligence(creatorProfileId, sessionId),
      }),
      source: 'mock',
    };
  }

  const dashboardResult = await fetchCreatorDashboard(creatorProfileId);
  const sessionId = resolveSessionIdFromDashboard(dashboardResult.data);
  let hadPartialFailure = false;

  if (!sessionId) {
    return {
      data: createEmptyReplayWorkspaceData(),
      source: 'empty',
    };
  }

  const [replayResult, highlightsResult, triggerResult, giftersResult, intelligenceResult] =
    await Promise.all([
      fetchSessionReplay(sessionId, creatorProfileId).catch(() => {
        hadPartialFailure = true;
        return { data: null, source: 'empty' as const };
      }),
      fetchSessionHighlights(sessionId).catch(() => {
        hadPartialFailure = true;
        return { data: null, source: 'empty' as const };
      }),
      fetchSessionTriggerAnalysis(sessionId).catch(() => {
        hadPartialFailure = true;
        return { data: null, source: 'empty' as const };
      }),
      fetchSessionGifters(sessionId, creatorProfileId).catch(() => {
        hadPartialFailure = true;
        return { data: null, source: 'empty' as const };
      }),
      fetchSessionIntelligence(sessionId, creatorProfileId).catch(() => {
        hadPartialFailure = true;
        return { data: null, source: 'empty' as const };
      }),
    ]);

  const data = buildReplayWorkspaceData({
    sessionId,
    replay: replayResult.data,
    highlights: highlightsResult.data,
    triggerAnalysis: triggerResult.data,
    gifters: giftersResult.data,
    intelligence: intelligenceResult.data,
  });

  const isEmpty =
    !data.replay &&
    Object.values(data.highlights).every((items) => items.length === 0) &&
    !data.triggerAnalysis &&
    data.gifters.length === 0 &&
    !data.intelligence;

  return {
    data,
    source: isEmpty ? 'empty' : hadPartialFailure ? 'partial' : 'live',
  };
}

export { createEmptyReplayWorkspaceData };
