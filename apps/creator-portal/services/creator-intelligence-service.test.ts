import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/services/api-client';
import { fetchCreatorIntelligence } from '@/services/creator-intelligence-service';
import { DashboardApiError } from '@/services/dashboard-errors';

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

describe('fetchCreatorIntelligence', () => {
  it('returns mock creator intelligence when mock mode is enabled', async () => {
    const result = await fetchCreatorIntelligence('creator_test_001');

    expect(result.source).toBe('mock');
    expect(result.data?.overallScore).toBeGreaterThan(0);
  });

  it('fetches live creator intelligence when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockResolvedValue({
      creatorProfileId: 'creator_test_001',
      generatedAt: new Date().toISOString(),
      sessionsAnalyzed: 0,
      dateRange: { from: null, to: null },
      creatorHealthScore: 0,
      revenueTrendScore: 0,
      engagementTrendScore: 0,
      gifterRetentionScore: 0,
      consistencyScore: 0,
      campaignReadinessScore: 0,
      overallScore: 0,
      strongestTriggerTypes: [],
      weakestTriggerTypes: [],
      topGifters: [],
      bestLivePatterns: [],
      riskSignals: [],
      coachingPriorities: [],
      recommendedNextActions: [],
      dataQualityWarnings: [],
    });

    const result = await fetchCreatorIntelligence('creator_test_001');

    expect(result.source).toBe('live');
    expect(apiGetMock).toHaveBeenCalledWith('/api/creators/creator_test_001/intelligence');
  });

  it('throws DashboardApiError on unauthorized responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Unauthorized', 401));

    await expect(fetchCreatorIntelligence('creator_test_001')).rejects.toBeInstanceOf(
      DashboardApiError,
    );
  });
});
