import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/services/api-client';
import { DashboardApiError } from '@/services/dashboard-errors';
import {
  fetchCreatorAvailability,
  fetchCreatorCompliance,
  fetchCreatorDetail,
  fetchCreatorPlatformAccounts,
  fetchCreatorSkills,
} from '@/services/profile-service';

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

describe('profile-service', () => {
  it('returns mock creator detail when mock mode is enabled', async () => {
    const result = await fetchCreatorDetail('creator_test_001');

    expect(result.source).toBe('mock');
    expect(result.data?.creator.displayName).toBe('Alex Rivera');
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('returns mock platform accounts when mock mode is enabled', async () => {
    const result = await fetchCreatorPlatformAccounts('creator_test_001');

    expect(result.source).toBe('mock');
    expect(result.data?.items.length).toBeGreaterThan(0);
  });

  it('returns mock skills and availability when mock mode is enabled', async () => {
    const skills = await fetchCreatorSkills('creator_test_001');
    const availability = await fetchCreatorAvailability('creator_test_001');

    expect(skills.data?.skills.length).toBeGreaterThan(0);
    expect(availability.data?.weeklySchedule.length).toBeGreaterThan(0);
  });

  it('returns mock compliance when mock mode is enabled', async () => {
    const result = await fetchCreatorCompliance('creator_test_001');

    expect(result.source).toBe('mock');
    expect(result.data?.onboarding.items.length).toBeGreaterThan(0);
  });

  it('throws DashboardApiError on unauthorized responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Unauthorized', 401));

    await expect(fetchCreatorDetail('creator_test_001')).rejects.toBeInstanceOf(DashboardApiError);
  });

  it('returns null data on 404 responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Not found', 404));

    const result = await fetchCreatorCompliance('creator_test_001');

    expect(result.source).toBe('empty');
    expect(result.data).toBeNull();
  });
});
