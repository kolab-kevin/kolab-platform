import { type SessionIntelligenceSnapshot, SessionIntelligenceSnapshotSchema } from '@kolab/types';

import { getCreatorProfileId, useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { createMockSessionIntelligence } from './coach-mock';
import { DashboardApiError } from './dashboard-errors';

export type IntelligenceDataSource = 'mock' | 'live' | 'empty';

export type SessionIntelligenceFetchResult = {
  data: SessionIntelligenceSnapshot | null;
  source: IntelligenceDataSource;
};

export function getSessionIntelligencePath(sessionId: string): string {
  return `/api/live/sessions/${sessionId}/intelligence`;
}

export async function fetchSessionIntelligence(
  sessionId: string,
  creatorProfileId: string = getCreatorProfileId(),
): Promise<SessionIntelligenceFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockSessionIntelligence(creatorProfileId, sessionId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getSessionIntelligencePath(sessionId));
    return {
      data: SessionIntelligenceSnapshotSchema.parse(data),
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

    throw error instanceof Error ? error : new Error('Failed to load session intelligence');
  }
}
