import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/services/api-client';
import {
  fetchCampaignAssignment,
  fetchCampaignAssignments,
} from '@/services/campaign-assignment-service';
import { createMockCampaignAssignments } from '@/services/campaign-mock';
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

describe('fetchCampaignAssignments', () => {
  it('returns mock assignments for a campaign', async () => {
    const result = await fetchCampaignAssignments('camp_1', 'creator_test_001');

    expect(result.source).toBe('mock');
    expect(result.data.items.length).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('fetches live assignments when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    const livePayload = {
      items: createMockCampaignAssignments('creator_live_001').filter(
        (item) => item.campaignId === 'camp_1',
      ),
    };
    apiGetMock.mockResolvedValue(livePayload);

    const result = await fetchCampaignAssignments('camp_1', 'creator_live_001');

    expect(result.source).toBe('live');
    expect(apiGetMock).toHaveBeenCalledWith(
      '/api/campaigns/camp_1/assignments?creatorProfileId=creator_live_001',
    );
    expect(result.data.items).toHaveLength(livePayload.items.length);
  });

  it('throws DashboardApiError on forbidden responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Forbidden', 403));

    await expect(fetchCampaignAssignments('camp_1', 'creator_test_001')).rejects.toBeInstanceOf(
      DashboardApiError,
    );
  });

  it('returns empty assignments on 404 responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Not found', 404));

    const result = await fetchCampaignAssignments('camp_missing', 'creator_test_001');

    expect(result.source).toBe('empty');
    expect(result.data.items).toHaveLength(0);
  });
});

describe('fetchCampaignAssignment', () => {
  it('returns a mock assignment by id', async () => {
    const result = await fetchCampaignAssignment('camp_1', 'assign_1');

    expect(result.source).toBe('mock');
    expect(result.data.id).toBe('assign_1');
  });
});
