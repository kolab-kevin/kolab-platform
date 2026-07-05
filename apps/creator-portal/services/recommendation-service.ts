import {
  type SessionRecommendationsResponse,
  SessionRecommendationsResponseSchema,
} from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { createMockSessionRecommendations } from './coach-mock';
import { DashboardApiError } from './dashboard-errors';

export type RecommendationDataSource = 'mock' | 'live' | 'empty';

export type RecommendationsFetchResult = {
  data: SessionRecommendationsResponse | null;
  source: RecommendationDataSource;
};

export function getSessionRecommendationsPath(sessionId: string): string {
  return `/api/live/sessions/${sessionId}/recommendations`;
}

export async function fetchSessionRecommendations(
  sessionId: string,
): Promise<RecommendationsFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockSessionRecommendations(sessionId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getSessionRecommendationsPath(sessionId));
    return {
      data: SessionRecommendationsResponseSchema.parse(data),
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

    throw error instanceof Error ? error : new Error('Failed to load recommendations');
  }
}
