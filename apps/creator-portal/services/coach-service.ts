import { getCreatorProfileId, useMockStudioData } from '@/lib/env';
import {
  buildCoachWorkspaceData,
  type CoachWorkspaceData,
  createEmptyCoachWorkspaceData,
} from '@/types/coach-adapters';

import { fetchSessionCoachAlerts } from './alert-service';
import {
  createMockCreatorIntelligence,
  createMockSessionCoachAlerts,
  createMockSessionIntelligence,
  createMockSessionRecommendations,
  MOCK_COACH_SESSION_ID,
} from './coach-mock';
import { fetchCreatorIntelligence } from './creator-intelligence-service';
import { fetchCreatorDashboard } from './dashboard-service';
import { fetchSessionIntelligence } from './intelligence-service';
import { fetchSessionRecommendations } from './recommendation-service';

export type CoachWorkspaceDataSource = 'mock' | 'live' | 'empty' | 'partial';

export type CoachWorkspaceFetchResult = {
  data: CoachWorkspaceData;
  source: CoachWorkspaceDataSource;
};

function resolveSessionIdFromDashboard(
  dashboard: Awaited<ReturnType<typeof fetchCreatorDashboard>>['data'],
): string | null {
  return dashboard.liveActivity.latestLiveSession?.id ?? null;
}

export async function fetchCoachWorkspace(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<CoachWorkspaceFetchResult> {
  if (useMockStudioData()) {
    const sessionId = MOCK_COACH_SESSION_ID;
    return {
      data: buildCoachWorkspaceData({
        sessionId,
        recommendations: createMockSessionRecommendations(sessionId),
        alerts: createMockSessionCoachAlerts(sessionId),
        sessionIntelligence: createMockSessionIntelligence(creatorProfileId, sessionId),
        creatorIntelligence: createMockCreatorIntelligence(creatorProfileId),
        topCoachingPriorities: ['Maintain consistency', 'Follow up with top gifters'],
      }),
      source: 'mock',
    };
  }

  const dashboardResult = await fetchCreatorDashboard(creatorProfileId);
  const sessionId = resolveSessionIdFromDashboard(dashboardResult.data);
  let hadPartialFailure = false;

  const creatorIntelligenceResult = await fetchCreatorIntelligence(creatorProfileId).catch(() => {
    hadPartialFailure = true;
    return { data: null, source: 'empty' as const };
  });

  if (!sessionId) {
    const data = buildCoachWorkspaceData({
      sessionId: null,
      recommendations: null,
      alerts: null,
      sessionIntelligence: null,
      creatorIntelligence: creatorIntelligenceResult.data,
      topCoachingPriorities: dashboardResult.data.coach.topCoachingPriorities,
    });

    const isEmpty =
      !creatorIntelligenceResult.data &&
      dashboardResult.data.coach.activeAlerts.length === 0 &&
      dashboardResult.data.coach.activeRecommendations.length === 0;

    return {
      data,
      source: isEmpty ? 'empty' : hadPartialFailure ? 'partial' : 'live',
    };
  }

  const [recommendationsResult, alertsResult, sessionIntelligenceResult] = await Promise.all([
    fetchSessionRecommendations(sessionId).catch(() => {
      hadPartialFailure = true;
      return { data: null, source: 'empty' as const };
    }),
    fetchSessionCoachAlerts(sessionId).catch(() => {
      hadPartialFailure = true;
      return { data: null, source: 'empty' as const };
    }),
    fetchSessionIntelligence(sessionId, creatorProfileId).catch(() => {
      hadPartialFailure = true;
      return { data: null, source: 'empty' as const };
    }),
  ]);

  const data = buildCoachWorkspaceData({
    sessionId,
    recommendations: recommendationsResult.data,
    alerts: alertsResult.data,
    sessionIntelligence: sessionIntelligenceResult.data,
    creatorIntelligence: creatorIntelligenceResult.data,
    topCoachingPriorities: dashboardResult.data.coach.topCoachingPriorities,
  });

  const isEmpty =
    !data.recommendationsResponse &&
    !data.alertsResponse &&
    !data.sessionIntelligence &&
    !data.creatorIntelligence;

  return {
    data,
    source: isEmpty ? 'empty' : hadPartialFailure ? 'partial' : 'live',
  };
}

export { createEmptyCoachWorkspaceData };
