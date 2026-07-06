import { type LiveSession, LiveSessionSchema } from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { LiveOperationsApiError } from './live-operations-errors';
import { createMockLiveSessionItem } from './live-operations-mock';

export type LiveSessionFetchResult = {
  data: LiveSession | null;
  source: 'mock' | 'live' | 'empty';
};

export function getLiveSessionPath(sessionId: string): string {
  return `/api/live/sessions/${sessionId}`;
}

export async function fetchLiveSession(sessionId: string): Promise<LiveSessionFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockLiveSessionItem(sessionId),
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
        throw new LiveOperationsApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { data: null, source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load live session');
  }
}
