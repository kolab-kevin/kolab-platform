import { getCreatorProfileId, useMockStudioData } from '@/lib/env';
import {
  buildLiveWorkspaceData,
  createEmptyLiveWorkspaceData,
  type LiveWorkspaceData,
} from '@/types/live-adapters';

import { fetchCreatorDashboard } from './dashboard-service';
import { fetchSessionIntelligence } from './intelligence-service';
import {
  createMockLiveSession,
  createMockSessionSummary,
  createMockSessionTimeline,
  MOCK_LIVE_SESSION_ID,
} from './live-mock';
import { fetchLiveSession } from './live-session-service';
import { fetchSessionSummary } from './session-summary-service';
import { fetchSessionTimeline } from './timeline-service';

export type LiveWorkspaceDataSource = 'mock' | 'live' | 'empty' | 'partial';

export type LiveWorkspaceFetchResult = {
  data: LiveWorkspaceData;
  source: LiveWorkspaceDataSource;
};

function resolveSessionIdFromDashboard(
  dashboard: Awaited<ReturnType<typeof fetchCreatorDashboard>>['data'],
): string | null {
  return dashboard.liveActivity.latestLiveSession?.id ?? null;
}

export async function fetchLiveWorkspace(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<LiveWorkspaceFetchResult> {
  if (useMockStudioData()) {
    const sessionId = MOCK_LIVE_SESSION_ID;
    const dashboard = await fetchCreatorDashboard(creatorProfileId);

    return {
      data: buildLiveWorkspaceData({
        sessionId,
        session: createMockLiveSession(creatorProfileId, sessionId),
        timeline: createMockSessionTimeline(creatorProfileId, sessionId),
        summary: createMockSessionSummary(sessionId),
        intelligence: (await fetchSessionIntelligence(sessionId, creatorProfileId)).data,
        dashboardLiveActivity: dashboard.data.liveActivity,
      }),
      source: 'mock',
    };
  }

  const dashboardResult = await fetchCreatorDashboard(creatorProfileId);
  const sessionId = resolveSessionIdFromDashboard(dashboardResult.data);
  let hadPartialFailure = false;

  if (!sessionId) {
    return {
      data: buildLiveWorkspaceData({
        sessionId: null,
        session: null,
        timeline: null,
        summary: null,
        intelligence: null,
        dashboardLiveActivity: dashboardResult.data.liveActivity,
      }),
      source: 'empty',
    };
  }

  const [sessionResult, timelineResult, summaryResult, intelligenceResult] = await Promise.all([
    fetchLiveSession(sessionId, creatorProfileId).catch(() => {
      hadPartialFailure = true;
      return { data: null, source: 'empty' as const };
    }),
    fetchSessionTimeline(sessionId, creatorProfileId).catch(() => {
      hadPartialFailure = true;
      return { data: null, source: 'empty' as const };
    }),
    fetchSessionSummary(sessionId).catch(() => {
      hadPartialFailure = true;
      return { data: null, source: 'empty' as const };
    }),
    fetchSessionIntelligence(sessionId, creatorProfileId).catch(() => {
      hadPartialFailure = true;
      return { data: null, source: 'empty' as const };
    }),
  ]);

  const data = buildLiveWorkspaceData({
    sessionId,
    session: sessionResult.data,
    timeline: timelineResult.data,
    summary: summaryResult.data,
    intelligence: intelligenceResult.data,
    dashboardLiveActivity: dashboardResult.data.liveActivity,
  });

  const isEmpty =
    !data.session && data.timeline.length === 0 && !data.summary && !data.intelligence;

  return {
    data,
    source: isEmpty ? 'empty' : hadPartialFailure ? 'partial' : 'live',
  };
}

export { createEmptyLiveWorkspaceData };
