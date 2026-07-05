import { type LiveSession, LiveSessionSchema } from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { DashboardApiError } from './dashboard-errors';
import { createMockLiveSession } from './live-mock';

export type LiveSessionDataSource = 'mock' | 'live' | 'empty';

export type LiveSessionFetchResult = {
  data: LiveSession | null;
  source: LiveSessionDataSource;
};

export function getLiveSessionPath(sessionId: string): string {
  return `/api/live/sessions/${sessionId}`;
}

export async function fetchLiveSession(
  sessionId: string,
  creatorProfileId: string,
): Promise<LiveSessionFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockLiveSession(creatorProfileId, sessionId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getLiveSessionPath(sessionId));
    return {
      data: LiveSessionSchema.parse(data),
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

    throw error instanceof Error ? error : new Error('Failed to load live session');
  }
}
