import { type ListCreatorGoalsResponse, ListCreatorGoalsResponseSchema } from '@kolab/types';

import { getCreatorProfileId, useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { DashboardApiError } from './dashboard-errors';
import { createEmptyGoalsList, createMockGoalsList } from './goal-mock';

export type GoalsDataSource = 'mock' | 'live' | 'empty';

export type GoalsFetchResult = {
  data: ListCreatorGoalsResponse;
  source: GoalsDataSource;
};

export function getGoalsPath(creatorProfileId: string): string {
  return `/api/creators/${creatorProfileId}/goals`;
}

export async function fetchCreatorGoals(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<GoalsFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockGoalsList(creatorProfileId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getGoalsPath(creatorProfileId));
    return {
      data: ListCreatorGoalsResponseSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new DashboardApiError(error.message, error.status);
      }

      if (error.status === 404) {
        return {
          data: createEmptyGoalsList(),
          source: 'empty',
        };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load goals');
  }
}
