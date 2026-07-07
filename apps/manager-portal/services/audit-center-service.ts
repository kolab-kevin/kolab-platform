import { ListAuditLogsResponseSchema } from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { AdministrationApiError } from './administration-errors';
import { apiClient, isApiClientError } from './api-client';

export type AuditCenterDataSource = 'mock' | 'live' | 'empty';

export async function fetchAuditLogs(limit = 50): Promise<{
  items: ReturnType<typeof ListAuditLogsResponseSchema.parse>['items'];
  source: AuditCenterDataSource;
}> {
  if (useMockStudioData()) {
    return { items: [], source: 'mock' };
  }

  try {
    const data = await apiClient.get<unknown>(`/api/audit-logs?limit=${limit}`);
    const parsed = ListAuditLogsResponseSchema.parse(data);
    return {
      items: parsed.items,
      source: parsed.items.length === 0 ? 'empty' : 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new AdministrationApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { items: [], source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load audit logs');
  }
}
