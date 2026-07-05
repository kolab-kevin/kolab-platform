import { type SessionReplayResponse, SessionReplayResponseSchema } from '@kolab/types';

import { getCreatorProfileId, useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { DashboardApiError } from './dashboard-errors';
import { createMockSessionReplay } from './replay-mock';

export type ReplayDataSource = 'mock' | 'live' | 'empty';

export type ReplayFetchResult = {
  data: SessionReplayResponse | null;
  source: ReplayDataSource;
};

export function getSessionReplayPath(sessionId: string): string {
  return `/api/live/sessions/${sessionId}/replay`;
}

export async function fetchSessionReplay(
  sessionId: string,
  creatorProfileId: string = getCreatorProfileId(),
): Promise<ReplayFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockSessionReplay(creatorProfileId, sessionId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getSessionReplayPath(sessionId));
    return {
      data: SessionReplayResponseSchema.parse(data),
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

    throw error instanceof Error ? error : new Error('Failed to load session replay');
  }
}
