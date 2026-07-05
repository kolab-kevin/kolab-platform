import { ListCampaignsResponseSchema } from '@kolab/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/services/api-client';
import { createMockCampaigns } from '@/services/campaign-mock';
import {
  fetchCampaign,
  fetchCampaignApplications,
  fetchCampaigns,
  fetchCampaignTemplateDeliverables,
} from '@/services/campaign-service';
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

describe('fetchCampaigns', () => {
  it('returns mock campaigns when mock mode is enabled', async () => {
    const result = await fetchCampaigns();

    expect(result.source).toBe('mock');
    expect(ListCampaignsResponseSchema.safeParse(result.data).success).toBe(true);
    expect(result.data.items.length).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('fetches live campaigns when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    const livePayload = { items: createMockCampaigns('creator_live_001'), nextCursor: null };
    apiGetMock.mockResolvedValue(livePayload);

    const result = await fetchCampaigns();

    expect(result.source).toBe('live');
    expect(apiGetMock).toHaveBeenCalledWith('/api/campaigns');
  });

  it('throws DashboardApiError on unauthorized responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Unauthorized', 401));

    await expect(fetchCampaigns()).rejects.toBeInstanceOf(DashboardApiError);
  });

  it('returns empty list on 404 responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Not found', 404));

    const result = await fetchCampaigns();

    expect(result.source).toBe('empty');
    expect(result.data.items).toHaveLength(0);
  });
});

describe('fetchCampaignApplications', () => {
  it('returns mock applications filtered by campaign', async () => {
    const result = await fetchCampaignApplications('camp_2', 'creator_test_001');

    expect(result.source).toBe('mock');
    expect(result.data.items.every((item) => item.campaignId === 'camp_2')).toBe(true);
  });

  it('returns empty applications on 404 responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Not found', 404));

    const result = await fetchCampaignApplications('camp_missing', 'creator_test_001');

    expect(result.source).toBe('empty');
    expect(result.data.items).toHaveLength(0);
  });
});

describe('fetchCampaignTemplateDeliverables', () => {
  it('returns mock template deliverables for a campaign', async () => {
    const result = await fetchCampaignTemplateDeliverables('camp_1');

    expect(result.source).toBe('mock');
    expect(result.data.items.length).toBeGreaterThan(0);
  });
});

describe('fetchCampaign', () => {
  it('returns a mock campaign by id', async () => {
    const result = await fetchCampaign('camp_1');

    expect(result.source).toBe('mock');
    expect(result.data.id).toBe('camp_1');
  });
});
