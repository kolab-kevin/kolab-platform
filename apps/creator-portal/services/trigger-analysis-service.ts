import {
  type SessionTriggerAnalysisResponse,
  SessionTriggerAnalysisResponseSchema,
} from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { DashboardApiError } from './dashboard-errors';
import { createMockSessionTriggerAnalysis } from './replay-mock';

export type TriggerAnalysisDataSource = 'mock' | 'live' | 'empty';

export type TriggerAnalysisFetchResult = {
  data: SessionTriggerAnalysisResponse | null;
  source: TriggerAnalysisDataSource;
};

export function getSessionTriggerAnalysisPath(sessionId: string): string {
  return `/api/live/sessions/${sessionId}/analysis/triggers`;
}

export async function fetchSessionTriggerAnalysis(
  sessionId: string,
): Promise<TriggerAnalysisFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockSessionTriggerAnalysis(sessionId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getSessionTriggerAnalysisPath(sessionId));
    return {
      data: SessionTriggerAnalysisResponseSchema.parse(data),
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

    throw error instanceof Error ? error : new Error('Failed to load trigger analysis');
  }
}
