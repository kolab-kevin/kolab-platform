import { ListCreatorsResponseSchema } from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { ReportingApiError } from './reporting-errors';

export type CreatorAnalyticsDataSource = 'mock' | 'live' | 'empty';

export async function fetchCreatorAnalyticsData() {
  if (useMockStudioData()) {
    return { items: [], source: 'mock' as const };
  }

  try {
    const data = await apiClient.get<unknown>('/api/creators?limit=100');
    const parsed = ListCreatorsResponseSchema.parse(data);
    return {
      items: parsed.items,
      source: parsed.items.length === 0 ? ('empty' as const) : ('live' as const),
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new ReportingApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { items: [], source: 'empty' as const };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load creator analytics');
  }
}
