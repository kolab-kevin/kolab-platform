import { type ListSessionGiftersResponse, ListSessionGiftersResponseSchema } from '@kolab/types';

import { getCreatorProfileId, useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { DashboardApiError } from './dashboard-errors';
import { createMockSessionGifters } from './replay-mock';

export type GifterDataSource = 'mock' | 'live' | 'empty';

export type SessionGiftersFetchResult = {
  data: ListSessionGiftersResponse | null;
  source: GifterDataSource;
};

export function getSessionGiftersPath(sessionId: string): string {
  return `/api/live/sessions/${sessionId}/gifters`;
}

export async function fetchSessionGifters(
  sessionId: string,
  creatorProfileId: string = getCreatorProfileId(),
): Promise<SessionGiftersFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockSessionGifters(creatorProfileId, sessionId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getSessionGiftersPath(sessionId));
    return {
      data: ListSessionGiftersResponseSchema.parse(data),
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

    throw error instanceof Error ? error : new Error('Failed to load session gifters');
  }
}
