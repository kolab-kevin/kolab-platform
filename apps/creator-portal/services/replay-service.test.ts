import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/services/api-client';
import { DashboardApiError } from '@/services/dashboard-errors';
import { MOCK_LIVE_SESSION_ID } from '@/services/live-mock';
import { fetchSessionReplay } from '@/services/replay-service';

const { apiGetMock, useMockStudioDataMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  useMockStudioDataMock: vi.fn(() => true),
}));

vi.mock('@/lib/env', () => ({
  useMockStudioData: () => useMockStudioDataMock(),
  getCreatorProfileId: () => 'creator_test_001',
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

describe('fetchSessionReplay', () => {
  it('returns mock replay when mock mode is enabled', async () => {
    const result = await fetchSessionReplay(MOCK_LIVE_SESSION_ID);

    expect(result.source).toBe('mock');
    expect(result.data?.segments.length).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('fetches live replay when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockResolvedValue({
      liveSessionId: MOCK_LIVE_SESSION_ID,
      segmentDurationMs: 900000,
      segments: [],
    });

    const result = await fetchSessionReplay(MOCK_LIVE_SESSION_ID);

    expect(result.source).toBe('live');
    expect(apiGetMock).toHaveBeenCalledWith(`/api/live/sessions/${MOCK_LIVE_SESSION_ID}/replay`);
  });

  it('throws DashboardApiError on unauthorized responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Unauthorized', 401));

    await expect(fetchSessionReplay(MOCK_LIVE_SESSION_ID)).rejects.toBeInstanceOf(
      DashboardApiError,
    );
  });

  it('returns null data on 404 responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Not found', 404));

    const result = await fetchSessionReplay(MOCK_LIVE_SESSION_ID);

    expect(result.source).toBe('empty');
    expect(result.data).toBeNull();
  });
});
