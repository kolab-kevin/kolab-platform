import { ListAuditLogsResponseSchema } from '@kolab/types';

import { useMockStudioData } from '@/lib/env';
import type { ManagerActivityItem } from '@/types/operations-center';
import { mapAuditLogToActivity } from '@/types/operations-center-adapters';

import { apiClient, isApiClientError } from './api-client';
import { OperationsCenterApiError } from './operations-center-errors';

export type ActivityFeedDataSource = 'mock' | 'live' | 'empty';

export async function fetchActivityFeed(): Promise<{
  items: ManagerActivityItem[];
  source: ActivityFeedDataSource;
}> {
  if (useMockStudioData()) {
    return { items: [], source: 'mock' };
  }

  try {
    const data = await apiClient.get<unknown>('/api/audit-logs?limit=30');
    const parsed = ListAuditLogsResponseSchema.parse(data);
    return {
      items: parsed.items.map(mapAuditLogToActivity),
      source: parsed.items.length === 0 ? 'empty' : 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new OperationsCenterApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { items: [], source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load activity feed');
  }
}
