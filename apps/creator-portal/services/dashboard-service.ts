import { type CreatorDashboardResponse, CreatorDashboardResponseSchema } from '@kolab/types';

import { getCreatorProfileId, useMockDashboard } from '@/lib/env';
import {
  DEFAULT_STUDIO_CACHE_TTL_MS,
  getCachedValue,
  setCachedValue,
} from '@/lib/studio-data-cache';

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

function getDashboardCacheKey(creatorProfileId: string): string {
  return `dashboard:${creatorProfileId}`;
}

export async function fetchCreatorDashboard(
  creatorProfileId: string = getCreatorProfileId(),
  options?: { force?: boolean },
): Promise<DashboardFetchResult> {
  const cacheKey = getDashboardCacheKey(creatorProfileId);

  if (!options?.force) {
    const cached = getCachedValue<DashboardFetchResult>(cacheKey);
    if (cached) return cached;
  }

  if (useMockDashboard()) {
    const result = {
      data: createMockDashboard(creatorProfileId),
      source: 'mock' as const,
    };
    setCachedValue(cacheKey, result, DEFAULT_STUDIO_CACHE_TTL_MS);
    return result;
  }

  try {
    const data = await apiClient.get<unknown>(getDashboardPath(creatorProfileId));
    const result = {
      data: CreatorDashboardResponseSchema.parse(data),
      source: 'live' as const,
    };
    setCachedValue(cacheKey, result, DEFAULT_STUDIO_CACHE_TTL_MS);
    return result;
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new DashboardApiError(error.message, error.status);
      }

      if (error.status === 404) {
        const result = {
          data: createEmptyDashboard(creatorProfileId),
          source: 'empty' as const,
        };
        setCachedValue(cacheKey, result, DEFAULT_STUDIO_CACHE_TTL_MS);
        return result;
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load dashboard');
  }
}
