import { type CreatorDashboardResponse, CreatorDashboardResponseSchema } from '@kolab/types';

import { getCreatorProfileId, useMockDashboard } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { createEmptyDashboard } from './dashboard-empty';
import { DashboardApiError } from './dashboard-errors';
import { createMockDashboard } from './dashboard-mock';

export type DashboardDataSource = 'mock' | 'live' | 'empty';

export type DashboardFetchResult = {
  data: CreatorDashboardResponse;
  source: DashboardDataSource;
};

export function getDashboardPath(creatorProfileId: string): string {
  return `/api/creators/${creatorProfileId}/dashboard`;
}

export async function fetchCreatorDashboard(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<DashboardFetchResult> {
  if (useMockDashboard()) {
    return {
      data: createMockDashboard(creatorProfileId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getDashboardPath(creatorProfileId));
    return {
      data: CreatorDashboardResponseSchema.parse(data),
      source: 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new DashboardApiError(error.message, error.status);
      }

      if (error.status === 404) {
        return {
          data: createEmptyDashboard(creatorProfileId),
          source: 'empty',
        };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load dashboard');
  }
}
