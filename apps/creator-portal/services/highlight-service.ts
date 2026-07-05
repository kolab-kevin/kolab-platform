import { type SessionHighlightsResponse, SessionHighlightsResponseSchema } from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { DashboardApiError } from './dashboard-errors';
import { createMockSessionHighlights } from './replay-mock';

export type HighlightDataSource = 'mock' | 'live' | 'empty';

export type HighlightsFetchResult = {
  data: SessionHighlightsResponse | null;
  source: HighlightDataSource;
};

export function getSessionHighlightsPath(sessionId: string): string {
  return `/api/live/sessions/${sessionId}/highlights`;
}

export async function fetchSessionHighlights(sessionId: string): Promise<HighlightsFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockSessionHighlights(sessionId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getSessionHighlightsPath(sessionId));
    return {
      data: SessionHighlightsResponseSchema.parse(data),
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

    throw error instanceof Error ? error : new Error('Failed to load session highlights');
  }
}
