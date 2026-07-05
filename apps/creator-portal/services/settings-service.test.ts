import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/services/api-client';
import { DashboardApiError } from '@/services/dashboard-errors';
import { fetchSettingsWorkspace, fetchUserProfile } from '@/services/settings-service';

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

describe('settings-service', () => {
  it('returns mock user profile when mock mode is enabled', async () => {
    const result = await fetchUserProfile();

    expect(result?.user.email).toBe('alex.rivera@example.com');
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('returns mock settings workspace when mock mode is enabled', async () => {
    const result = await fetchSettingsWorkspace();

    expect(result.source).toBe('mock');
    expect(result.data.general?.email).toBe('alex.rivera@example.com');
    expect(result.data.mockMode).toBe(true);
    expect(result.data.version).toBe('0.0.0');
  });

  it('throws DashboardApiError on unauthorized profile responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Forbidden', 403));

    await expect(fetchUserProfile()).rejects.toBeInstanceOf(DashboardApiError);
  });

  it('returns empty source when live profile is unavailable', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Not found', 404));

    const result = await fetchSettingsWorkspace();

    expect(result.source).toBe('empty');
    expect(result.data.general).toBeNull();
  });
});
