import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/services/api-client';
import { fetchSessionGifters } from '@/services/gifter-service';
import { MOCK_LIVE_SESSION_ID } from '@/services/live-mock';

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

describe('fetchSessionGifters', () => {
  it('returns mock session gifters when mock mode is enabled', async () => {
    const result = await fetchSessionGifters(MOCK_LIVE_SESSION_ID);

    expect(result.source).toBe('mock');
    expect(result.data?.items.length).toBeGreaterThan(0);
  });

  it('returns null data on 404 responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Not found', 404));

    const result = await fetchSessionGifters(MOCK_LIVE_SESSION_ID);

    expect(result.source).toBe('empty');
    expect(result.data).toBeNull();
  });
});
