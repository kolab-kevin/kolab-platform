import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchSessionCoachAlerts } from '@/services/alert-service';
import { ApiClientError } from '@/services/api-client';
import { MOCK_COACH_SESSION_ID } from '@/services/coach-mock';
import { DashboardApiError } from '@/services/dashboard-errors';

const { apiGetMock, useMockStudioDataMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  useMockStudioDataMock: vi.fn(() => true),
}));

vi.mock('@/lib/env', () => ({
  useMockStudioData: () => useMockStudioDataMock(),
  getApiBaseUrl: () => 'http://localhost:4000',
}));

vi.mock('./api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api-client')>();
  return {
    ...actual,
    apiClient: {
      get: (...args: unknown[]) => apiGetMock(...args),
    },
  };
});

beforeEach(() => {
  apiGetMock.mockReset();
  useMockStudioDataMock.mockReset();
  useMockStudioDataMock.mockReturnValue(true);
});

describe('fetchSessionCoachAlerts', () => {
  it('returns mock alerts when mock mode is enabled', async () => {
    const result = await fetchSessionCoachAlerts(MOCK_COACH_SESSION_ID);

    expect(result.source).toBe('mock');
    expect(result.data?.alerts.length).toBeGreaterThan(0);
  });

  it('returns null data on 404 responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Not found', 404));

    const result = await fetchSessionCoachAlerts(MOCK_COACH_SESSION_ID);

    expect(result.source).toBe('empty');
    expect(result.data).toBeNull();
  });

  it('throws DashboardApiError on forbidden responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Forbidden', 403));

    await expect(fetchSessionCoachAlerts(MOCK_COACH_SESSION_ID)).rejects.toBeInstanceOf(
      DashboardApiError,
    );
  });
});
