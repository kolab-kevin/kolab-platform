import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockCampaignOperationsWorkspace } from '@/services/campaign-operations-mock';
import { fetchCampaignOperationsWorkspace } from '@/services/campaign-operations-service';
import { ManagerCampaignOperationsWorkspaceSchema } from '@/types/campaign-operations';

const { useMockStudioDataMock, apiGetMock } = vi.hoisted(() => ({
  useMockStudioDataMock: vi.fn(() => true),
  apiGetMock: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  useMockStudioData: () => useMockStudioDataMock(),
  useMockDashboard: () => useMockStudioDataMock(),
  getDefaultOrganizationId: () => 'org_mock_001',
  getApiBaseUrl: () => 'http://localhost:4000',
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGetMock(...args),
  },
  isApiClientError: () => false,
}));

beforeEach(() => {
  useMockStudioDataMock.mockReset();
  useMockStudioDataMock.mockReturnValue(true);
  apiGetMock.mockReset();
});

describe('fetchCampaignOperationsWorkspace', () => {
  it('returns typed mock workspace data in mock mode', async () => {
    const result = await fetchCampaignOperationsWorkspace('org_mock_001');
    const parsed = ManagerCampaignOperationsWorkspaceSchema.safeParse(result.data);

    expect(parsed.success).toBe(true);
    expect(result.source).toBe('mock');
    expect(result.data.campaigns.length).toBeGreaterThan(0);
    expect(result.data.board.active.length).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('loads live campaigns from API when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockImplementation((path: string) => {
      if (path.match(/^\/api\/campaigns\/[^/?]+$/)) {
        return Promise.resolve({
          id: 'camp_live_001',
          organizationId: 'org_mock_001',
          title: 'Live Campaign',
          description: 'Live campaign description',
          brandName: 'Brand Co',
          campaignType: 'BRAND_DEAL',
          status: 'ACTIVE',
          budgetAmount: '1000.00',
          budgetCurrency: 'USD',
          startsAt: new Date().toISOString(),
          endsAt: null,
          applicationDeadline: null,
          brief: {},
          requirements: {},
          metadata: {},
          createdByUserId: 'user_001',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      if (path.startsWith('/api/campaigns')) {
        return Promise.resolve({
          items: [
            {
              id: 'camp_live_001',
              organizationId: 'org_mock_001',
              title: 'Live Campaign',
              description: 'Live campaign description',
              brandName: 'Brand Co',
              campaignType: 'BRAND_DEAL',
              status: 'ACTIVE',
              budgetAmount: '1000.00',
              budgetCurrency: 'USD',
              startsAt: new Date().toISOString(),
              endsAt: null,
              applicationDeadline: null,
              brief: {},
              requirements: {},
              metadata: {},
              createdByUserId: 'user_001',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          nextCursor: null,
        });
      }

      if (path.startsWith('/api/creators')) {
        return Promise.resolve({ items: [], nextCursor: null });
      }

      if (path.includes('/deliverables')) {
        return Promise.resolve({ items: [] });
      }

      if (path.includes('/applications')) {
        return Promise.resolve({ items: [] });
      }

      if (path.includes('/assignments')) {
        return Promise.resolve({ items: [] });
      }

      if (path.includes('/assignments') && path.includes('/deliverables')) {
        return Promise.resolve({ items: [] });
      }

      return Promise.resolve({});
    });

    const result = await fetchCampaignOperationsWorkspace('org_mock_001');

    expect(['live', 'partial']).toContain(result.source);
    expect(result.data.campaigns[0]?.title).toBe('Live Campaign');
  });

  it('validates mock workspace shape', () => {
    const workspace = createMockCampaignOperationsWorkspace('org_mock_001');
    expect(ManagerCampaignOperationsWorkspaceSchema.safeParse(workspace).success).toBe(true);
  });
});
