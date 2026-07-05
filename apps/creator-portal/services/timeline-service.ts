import { type SessionTimelineResponse, SessionTimelineResponseSchema } from '@kolab/types';

import { getCreatorProfileId, useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { DashboardApiError } from './dashboard-errors';
import { createMockSessionTimeline } from './live-mock';

export type TimelineDataSource = 'mock' | 'live' | 'empty';

export type TimelineFetchResult = {
  data: SessionTimelineResponse | null;
  source: TimelineDataSource;
};

export function getSessionTimelinePath(sessionId: string): string {
  return `/api/live/sessions/${sessionId}/timeline`;
}

export async function fetchSessionTimeline(
  sessionId: string,
  creatorProfileId: string = getCreatorProfileId(),
): Promise<TimelineFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockSessionTimeline(creatorProfileId, sessionId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getSessionTimelinePath(sessionId));
    return {
      data: SessionTimelineResponseSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new DashboardApiError(error.message, error.status);
      }

      if (error.status === 404) {
        return { data: null, source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load session timeline');
  }
}
