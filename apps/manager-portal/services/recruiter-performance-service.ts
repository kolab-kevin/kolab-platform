import { ListRecruiterProfilesResponseSchema } from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { RecruitingOperationsApiError } from './recruiting-operations-errors';

export type RecruiterPerformanceDataSource = 'mock' | 'live' | 'empty';

export async function fetchRecruiterProfiles(): Promise<{
  data: ReturnType<typeof ListRecruiterProfilesResponseSchema.parse>;
  source: RecruiterPerformanceDataSource;
}> {
  if (useMockStudioData()) {
    return { data: { items: [], nextCursor: null }, source: 'mock' };
  }

  try {
    const data = await apiClient.get<unknown>('/api/recruiters?limit=50');
    const parsed = ListRecruiterProfilesResponseSchema.parse(data);
    return {
      data: parsed,
      source: parsed.items.length === 0 ? 'empty' : 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new RecruitingOperationsApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { data: { items: [], nextCursor: null }, source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load recruiter profiles');
  }
}
