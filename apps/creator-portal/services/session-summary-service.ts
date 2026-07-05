import { type LiveSessionSummaryResponse, LiveSessionSummaryResponseSchema } from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { DashboardApiError } from './dashboard-errors';
import { createMockSessionSummary } from './live-mock';

export type SessionSummaryDataSource = 'mock' | 'live' | 'empty';

export type SessionSummaryFetchResult = {
  data: LiveSessionSummaryResponse | null;
  source: SessionSummaryDataSource;
};

export function getSessionSummaryPath(sessionId: string): string {
  return `/api/live/sessions/${sessionId}/summary`;
}

export async function fetchSessionSummary(sessionId: string): Promise<SessionSummaryFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockSessionSummary(sessionId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getSessionSummaryPath(sessionId));
    return {
      data: LiveSessionSummaryResponseSchema.parse(data),
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

    throw error instanceof Error ? error : new Error('Failed to load session summary');
  }
}
