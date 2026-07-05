import { type CreatorIntelligenceProfile, CreatorIntelligenceProfileSchema } from '@kolab/types';

import { getCreatorProfileId, useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { createMockCreatorIntelligence } from './coach-mock';
import { DashboardApiError } from './dashboard-errors';

export type CreatorIntelligenceDataSource = 'mock' | 'live' | 'empty';

export type CreatorIntelligenceFetchResult = {
  data: CreatorIntelligenceProfile | null;
  source: CreatorIntelligenceDataSource;
};

export function getCreatorIntelligencePath(creatorProfileId: string): string {
  return `/api/creators/${creatorProfileId}/intelligence`;
}

export async function fetchCreatorIntelligence(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<CreatorIntelligenceFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockCreatorIntelligence(creatorProfileId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getCreatorIntelligencePath(creatorProfileId));
    return {
      data: CreatorIntelligenceProfileSchema.parse(data),
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

    throw error instanceof Error ? error : new Error('Failed to load creator intelligence');
  }
}
