import { CreatorPerformanceScoreSchema } from '@kolab/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/services/api-client';
import { DashboardApiError } from '@/services/dashboard-errors';
import { createMockPerformanceScore } from '@/services/performance-mock';
import { fetchCreatorPerformanceScore } from '@/services/performance-service';

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

describe('fetchCreatorPerformanceScore', () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    useMockStudioDataMock.mockReset();
    useMockStudioDataMock.mockReturnValue(true);
  });

  it('returns mock performance score when mock mode is enabled', async () => {
    const result = await fetchCreatorPerformanceScore('creator_test_001');

    expect(result.source).toBe('mock');
    expect(result.data).not.toBeNull();
    expect(CreatorPerformanceScoreSchema.safeParse(result.data).success).toBe(true);
    expect(result.data?.trendDirection).toBe('IMPROVING');
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('fetches live performance score when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    const livePayload = createMockPerformanceScore('creator_live_001');
    const { trendDirection: _trend, ...apiPayload } = livePayload;
    apiGetMock.mockResolvedValue(apiPayload);

    const result = await fetchCreatorPerformanceScore('creator_live_001');

    expect(result.source).toBe('live');
    expect(apiGetMock).toHaveBeenCalledWith('/api/creators/creator_live_001/performance-score');
    expect(result.data?.overallScore).toBe(livePayload.overallScore);
  });

  it('throws DashboardApiError on 401 unauthorized responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Unauthorized', 401));

    await expect(fetchCreatorPerformanceScore('creator_live_001')).rejects.toMatchObject({
      name: 'DashboardApiError',
      status: 401,
    });
  });

  it('throws DashboardApiError on 403 forbidden responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Forbidden', 403));

    await expect(fetchCreatorPerformanceScore('creator_live_001')).rejects.toBeInstanceOf(
      DashboardApiError,
    );
  });

  it('returns null data on 404 responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Not found', 404));

    const result = await fetchCreatorPerformanceScore('creator_missing');

    expect(result.source).toBe('empty');
    expect(result.data).toBeNull();
  });

  it('propagates other API errors', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Server error', 500));

    await expect(fetchCreatorPerformanceScore('creator_live_001')).rejects.toMatchObject({
      status: 500,
    });
  });
});

describe('createMockPerformanceScore', () => {
  it('uses the provided creator profile id', () => {
    const score = createMockPerformanceScore('creator_xyz');
    expect(score.creatorProfileId).toBe('creator_xyz');
    expect(score.strengths.length).toBeGreaterThan(0);
  });
});
