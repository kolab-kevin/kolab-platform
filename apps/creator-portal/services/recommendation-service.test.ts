import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/services/api-client';
import { MOCK_COACH_SESSION_ID } from '@/services/coach-mock';
import { DashboardApiError } from '@/services/dashboard-errors';
import { fetchSessionRecommendations } from '@/services/recommendation-service';

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

describe('fetchSessionRecommendations', () => {
  it('returns mock recommendations when mock mode is enabled', async () => {
    const result = await fetchSessionRecommendations(MOCK_COACH_SESSION_ID);

    expect(result.source).toBe('mock');
    expect(result.data?.recommendations.length).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('fetches live recommendations when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockResolvedValue({
      sessionId: MOCK_COACH_SESSION_ID,
      generatedAt: new Date().toISOString(),
      recommendations: [],
    });

    const result = await fetchSessionRecommendations(MOCK_COACH_SESSION_ID);

    expect(result.source).toBe('live');
    expect(apiGetMock).toHaveBeenCalledWith(
      `/api/live/sessions/${MOCK_COACH_SESSION_ID}/recommendations`,
    );
  });

  it('throws DashboardApiError on unauthorized responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Unauthorized', 401));

    await expect(fetchSessionRecommendations(MOCK_COACH_SESSION_ID)).rejects.toBeInstanceOf(
      DashboardApiError,
    );
  });

  it('returns null data on 404 responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Not found', 404));

    const result = await fetchSessionRecommendations(MOCK_COACH_SESSION_ID);

    expect(result.source).toBe('empty');
    expect(result.data).toBeNull();
  });
});
