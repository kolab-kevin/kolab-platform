import { CreatorDashboardResponseSchema } from '@kolab/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/services/api-client';
import { createEmptyDashboard } from '@/services/dashboard-empty';
import { DashboardApiError } from '@/services/dashboard-errors';
import { createMockDashboard } from '@/services/dashboard-mock';
import { fetchCreatorDashboard } from '@/services/dashboard-service';

const { apiGetMock, useMockDashboardMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  useMockDashboardMock: vi.fn(() => true),
}));

vi.mock('@/lib/env', () => ({
  useMockDashboard: () => useMockDashboardMock(),
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

describe('fetchCreatorDashboard', () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    useMockDashboardMock.mockReset();
    useMockDashboardMock.mockReturnValue(true);
  });

  it('returns mock dashboard data when mock mode is enabled', async () => {
    useMockDashboardMock.mockReturnValue(true);

    const result = await fetchCreatorDashboard('creator_test_001');
    const parsed = CreatorDashboardResponseSchema.safeParse(result.data);

    expect(parsed.success).toBe(true);
    expect(result.source).toBe('mock');
    expect(result.data.quickActions.length).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('fetches live dashboard data when mock mode is disabled', async () => {
    useMockDashboardMock.mockReturnValue(false);
    const livePayload = createMockDashboard('creator_live_001');
    apiGetMock.mockResolvedValue(livePayload);

    const result = await fetchCreatorDashboard('creator_live_001');

    expect(result.source).toBe('live');
    expect(apiGetMock).toHaveBeenCalledWith('/api/creators/creator_live_001/dashboard');
    expect(result.data.overview.displayName).toBe(livePayload.overview.displayName);
  });

  it('throws DashboardApiError on 401 unauthorized responses', async () => {
    useMockDashboardMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Unauthorized', 401));

    await expect(fetchCreatorDashboard('creator_live_001')).rejects.toMatchObject({
      name: 'DashboardApiError',
      status: 401,
    });
  });

  it('throws DashboardApiError on 403 forbidden responses', async () => {
    useMockDashboardMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Forbidden', 403));

    await expect(fetchCreatorDashboard('creator_live_001')).rejects.toBeInstanceOf(
      DashboardApiError,
    );
  });

  it('returns empty dashboard on 404 responses', async () => {
    useMockDashboardMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Not found', 404));

    const result = await fetchCreatorDashboard('creator_missing');

    expect(result.source).toBe('empty');
    expect(result.data.creatorProfileId).toBe('creator_missing');
    expect(result.data.quickActions).toHaveLength(0);
  });

  it('propagates other API errors', async () => {
    useMockDashboardMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Server error', 500));

    await expect(fetchCreatorDashboard('creator_live_001')).rejects.toMatchObject({
      status: 500,
    });
  });
});

describe('createMockDashboard', () => {
  it('uses the provided creator profile id', () => {
    const dashboard = createMockDashboard('creator_xyz');
    expect(dashboard.creatorProfileId).toBe('creator_xyz');
    expect(dashboard.overview.creatorProfileId).toBe('creator_xyz');
  });
});

describe('createEmptyDashboard', () => {
  it('matches dashboard response schema', () => {
    const dashboard = createEmptyDashboard('creator_empty');
    expect(CreatorDashboardResponseSchema.safeParse(dashboard).success).toBe(true);
  });
});
