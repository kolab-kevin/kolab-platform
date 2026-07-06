import { ListCreatorsResponseSchema } from '@kolab/types';

import { getDefaultOrganizationId, useMockStudioData } from '@/lib/env';
import type {
  LiveOperationsDataSource,
  ManagerLiveOperationsWorkspace,
} from '@/types/live-operations';
import {
  buildAgencyMonitoring,
  buildCreatorNameMap,
  mapCoachQueueItems,
  mapLiveSessionToManagerItem,
  mapTimelineResponse,
} from '@/types/live-operations-adapters';

import {
  fetchAgencyLiveSessions,
  fetchSessionCoachBundle,
  fetchSessionIntelligence,
} from './agency-live-service';
import { apiClient, isApiClientError } from './api-client';
import { LiveOperationsApiError } from './live-operations-errors';
import { loadLiveOperationsSessionDetail } from './live-operations-loader';
import { createMockLiveOperationsWorkspace } from './live-operations-mock';
import { fetchSessionTimeline } from './timeline-service';

export type LiveOperationsFetchResult = {
  data: ManagerLiveOperationsWorkspace;
  source: LiveOperationsDataSource;
};

export type LiveOperationsSessionDetail = Pick<
  ManagerLiveOperationsWorkspace,
  'timeline' | 'coachQueue' | 'agencyMonitoring'
>;

export type LiveOperationsSessionDetailResult = {
  data: LiveOperationsSessionDetail | null;
  source: LiveOperationsDataSource;
};

const MAX_COACH_SESSIONS = 8;

export async function fetchLiveOperationsWorkspace(
  organizationId: string = getDefaultOrganizationId(),
): Promise<LiveOperationsFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockLiveOperationsWorkspace(organizationId),
      source: 'mock',
    };
  }

  try {
    const [agencySessions, creatorsResponse] = await Promise.all([
      fetchAgencyLiveSessions(organizationId),
      apiClient.get<unknown>('/api/creators?limit=100'),
    ]);

    const creators = ListCreatorsResponseSchema.parse(creatorsResponse);
    const creatorNames = buildCreatorNameMap(creators);

    const liveSessions = agencySessions.items.filter((session) => session.status === 'LIVE');
    const intelligenceResults = await Promise.all(
      liveSessions
        .slice(0, MAX_COACH_SESSIONS)
        .map((session) => fetchSessionIntelligence(session.id)),
    );

    const sessions = agencySessions.items.map((session) => {
      const intelligenceIndex = liveSessions.findIndex((item) => item.id === session.id);
      const intelligence =
        intelligenceIndex >= 0 ? (intelligenceResults[intelligenceIndex]?.data ?? null) : null;

      return mapLiveSessionToManagerItem(session, creatorNames, intelligence);
    });

    const defaultSessionId =
      sessions.find((session) => session.status === 'LIVE')?.id ?? sessions[0]?.id ?? null;

    let timeline = [] as ManagerLiveOperationsWorkspace['timeline'];
    let coachQueue = [] as ManagerLiveOperationsWorkspace['coachQueue'];
    let detailSource: LiveOperationsDataSource = agencySessions.source;

    if (defaultSessionId) {
      const detail = await loadLiveOperationsSessionDetail(
        defaultSessionId,
        creatorNames.get(
          agencySessions.items.find((session) => session.id === defaultSessionId)
            ?.creatorProfileId ?? '',
        ) ?? 'Creator',
      );
      timeline = detail.timeline;
      coachQueue = detail.coachQueue;
      detailSource = detail.source;
    }

    const coachBundles = await Promise.all(
      liveSessions.slice(0, MAX_COACH_SESSIONS).map(async (session) => {
        const bundle = await fetchSessionCoachBundle(session.id);
        return mapCoachQueueItems(
          session.id,
          creatorNames.get(session.creatorProfileId) ?? session.title,
          bundle.alerts,
          bundle.recommendations,
        );
      }),
    );

    coachQueue = [...coachQueue, ...coachBundles.flat()];

    const workspace: ManagerLiveOperationsWorkspace = {
      organizationId,
      generatedAt: new Date().toISOString(),
      sessions,
      coachQueue,
      timeline,
      agencyMonitoring: buildAgencyMonitoring(sessions, coachQueue, timeline),
      selectedSessionId: defaultSessionId,
    };

    const source: LiveOperationsDataSource =
      agencySessions.items.length === 0
        ? 'empty'
        : detailSource === 'partial' || agencySessions.source === 'partial'
          ? 'partial'
          : 'live';

    return { data: workspace, source };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new LiveOperationsApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return {
          data: {
            organizationId,
            generatedAt: new Date().toISOString(),
            sessions: [],
            coachQueue: [],
            timeline: [],
            agencyMonitoring: buildAgencyMonitoring([], [], []),
            selectedSessionId: null,
          },
          source: 'empty',
        };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load live operations workspace');
  }
}

export async function fetchLiveOperationsSessionDetail(
  sessionId: string,
  creatorDisplayName: string,
): Promise<LiveOperationsSessionDetailResult> {
  if (useMockStudioData()) {
    const workspace = createMockLiveOperationsWorkspace(getDefaultOrganizationId());
    return {
      data: {
        timeline: workspace.timeline,
        coachQueue: workspace.coachQueue.filter((item) => item.sessionId === sessionId),
        agencyMonitoring: workspace.agencyMonitoring,
      },
      source: 'mock',
    };
  }

  const detail = await loadLiveOperationsSessionDetail(sessionId, creatorDisplayName);
  return {
    data: {
      timeline: detail.timeline,
      coachQueue: detail.coachQueue,
      agencyMonitoring: buildAgencyMonitoring([], detail.coachQueue, detail.timeline),
    },
    source: detail.source,
  };
}

export async function refreshLiveOperationsTimeline(
  sessionId: string,
): Promise<LiveOperationsSessionDetailResult> {
  if (useMockStudioData()) {
    const timeline = mapTimelineResponse((await fetchSessionTimeline(sessionId)).data);
    return {
      data: {
        timeline,
        coachQueue: [],
        agencyMonitoring: buildAgencyMonitoring([], [], timeline),
      },
      source: 'mock',
    };
  }

  const timelineResult = await fetchSessionTimeline(sessionId);

  return {
    data: {
      timeline: mapTimelineResponse(timelineResult.data),
      coachQueue: [],
      agencyMonitoring: buildAgencyMonitoring([], [], mapTimelineResponse(timelineResult.data)),
    },
    source: timelineResult.source,
  };
}
