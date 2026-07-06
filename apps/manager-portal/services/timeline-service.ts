import { type SessionTimelineResponse, SessionTimelineResponseSchema } from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { LiveOperationsApiError } from './live-operations-errors';
import { createMockSessionTimeline } from './live-operations-mock';

export type TimelineFetchResult = {
  data: SessionTimelineResponse | null;
  source: 'mock' | 'live' | 'empty';
};

export function getSessionTimelinePath(sessionId: string): string {
  return `/api/live/sessions/${sessionId}/timeline`;
}

export async function fetchSessionTimeline(sessionId: string): Promise<TimelineFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockSessionTimeline(sessionId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getSessionTimelinePath(sessionId));
    const parsed = SessionTimelineResponseSchema.safeParse(data);

    if (!parsed.success) {
      return { data: null, source: 'empty' };
    }

    return {
      data: parsed.data,
      source: 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new LiveOperationsApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { data: null, source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load session timeline');
  }
}
