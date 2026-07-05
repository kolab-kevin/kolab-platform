import { ListCreatorGoalsResponseSchema } from '@kolab/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/services/api-client';
import { DashboardApiError } from '@/services/dashboard-errors';
import { createEmptyGoalsList, createMockGoalsList } from '@/services/goal-mock';
import { fetchCreatorGoals } from '@/services/goal-service';

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

describe('fetchCreatorGoals', () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    useMockStudioDataMock.mockReset();
    useMockStudioDataMock.mockReturnValue(true);
  });

  it('returns mock goals when mock mode is enabled', async () => {
    const result = await fetchCreatorGoals('creator_test_001');
    const parsed = ListCreatorGoalsResponseSchema.safeParse(result.data);

    expect(parsed.success).toBe(true);
    expect(result.source).toBe('mock');
    expect(result.data.items.length).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('fetches live goals when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    const livePayload = createMockGoalsList('creator_live_001');
    apiGetMock.mockResolvedValue(livePayload);

    const result = await fetchCreatorGoals('creator_live_001');

    expect(result.source).toBe('live');
    expect(apiGetMock).toHaveBeenCalledWith('/api/creators/creator_live_001/goals');
    expect(result.data.items).toHaveLength(livePayload.items.length);
  });

  it('throws DashboardApiError on 401 unauthorized responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Unauthorized', 401));

    await expect(fetchCreatorGoals('creator_live_001')).rejects.toMatchObject({
      name: 'DashboardApiError',
      status: 401,
    });
  });

  it('throws DashboardApiError on 403 forbidden responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Forbidden', 403));

    await expect(fetchCreatorGoals('creator_live_001')).rejects.toBeInstanceOf(DashboardApiError);
  });

  it('returns empty goals list on 404 responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Not found', 404));

    const result = await fetchCreatorGoals('creator_missing');

    expect(result.source).toBe('empty');
    expect(result.data.items).toHaveLength(0);
    expect(result.data.nextCursor).toBeNull();
  });

  it('propagates other API errors', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Server error', 500));

    await expect(fetchCreatorGoals('creator_live_001')).rejects.toMatchObject({
      status: 500,
    });
  });
});

describe('createMockGoalsList', () => {
  it('includes active, completed, and missed goals', () => {
    const list = createMockGoalsList('creator_xyz');
    const statuses = list.items.map((goal) => goal.status);

    expect(list.items.every((goal) => goal.creatorProfileId === 'creator_xyz')).toBe(true);
    expect(statuses).toContain('ACTIVE');
    expect(statuses).toContain('COMPLETED');
    expect(statuses).toContain('MISSED');
    expect(list.nextCursor).toBeTruthy();
  });
});

describe('createEmptyGoalsList', () => {
  it('matches list response schema', () => {
    const list = createEmptyGoalsList();
    expect(ListCreatorGoalsResponseSchema.safeParse(list).success).toBe(true);
  });
});
