import { CreatorPerformanceScoreSchema } from '@kolab/types';

import { getCreatorProfileId, useMockStudioData } from '@/lib/env';
import type { PerformanceWorkspaceData } from '@/types/performance-adapters';

import { apiClient, isApiClientError } from './api-client';
import { DashboardApiError } from './dashboard-errors';
import { createMockPerformanceScore } from './performance-mock';

export type PerformanceDataSource = 'mock' | 'live' | 'empty';

export type PerformanceFetchResult = {
  data: PerformanceWorkspaceData | null;
  source: PerformanceDataSource;
};

export function getPerformanceScorePath(creatorProfileId: string): string {
  return `/api/creators/${creatorProfileId}/performance-score`;
}

export async function fetchCreatorPerformanceScore(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<PerformanceFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockPerformanceScore(creatorProfileId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getPerformanceScorePath(creatorProfileId));
    const score = CreatorPerformanceScoreSchema.parse(data);
    return {
      data: score,
      source: 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new DashboardApiError(error.message, error.status);
      }

      if (error.status === 404) {
        return {
          data: null,
          source: 'empty',
        };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load performance score');
  }
}
