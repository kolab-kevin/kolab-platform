import { type SessionCoachAlertsResponse, SessionCoachAlertsResponseSchema } from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { createMockSessionCoachAlerts } from './coach-mock';
import { DashboardApiError } from './dashboard-errors';

export type AlertDataSource = 'mock' | 'live' | 'empty';

export type AlertsFetchResult = {
  data: SessionCoachAlertsResponse | null;
  source: AlertDataSource;
};

export function getSessionCoachAlertsPath(sessionId: string): string {
  return `/api/live/sessions/${sessionId}/coach/alerts`;
}

export async function fetchSessionCoachAlerts(sessionId: string): Promise<AlertsFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockSessionCoachAlerts(sessionId),
      source: 'mock',
    };
  }

  try {
    const data = await apiClient.get<unknown>(getSessionCoachAlertsPath(sessionId));
    return {
      data: SessionCoachAlertsResponseSchema.parse(data),
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

    throw error instanceof Error ? error : new Error('Failed to load coach alerts');
  }
}
