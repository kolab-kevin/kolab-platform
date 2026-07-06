import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchOperationsCenterWorkspace } from '@/services/operations-center-service';
import { createMockOperationsCenterWorkspace } from '@/services/operations-mock';
import { ManagerOperationsCenterWorkspaceSchema } from '@/types/operations-center';

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

describe('fetchOperationsCenterWorkspace', () => {
  it('returns typed mock workspace data in mock mode', async () => {
    const result = await fetchOperationsCenterWorkspace('org_mock_001');
    const parsed = ManagerOperationsCenterWorkspaceSchema.safeParse(result.data);

    expect(parsed.success).toBe(true);
    expect(result.source).toBe('mock');
    expect(result.data.tasks.assigned.length).toBeGreaterThan(0);
    expect(result.data.alerts.live.length).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('loads live operations data from APIs when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockImplementation((path: string) => {
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
              endsAt: new Date(Date.now() + 86400000).toISOString(),
              applicationDeadline: new Date(Date.now() + 86400000).toISOString(),
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

      if (path.startsWith('/api/recruitment/leads')) {
        return Promise.resolve({ items: [], nextCursor: null });
      }

      if (path.startsWith('/api/live/sessions')) {
        return Promise.resolve({ items: [], nextCursor: null });
      }

      if (path.startsWith('/api/creators/documents/expiring')) {
        return Promise.resolve({ items: [], nextCursor: null });
      }

      if (path.startsWith('/api/creators/contracts/expiring')) {
        return Promise.resolve({ items: [], nextCursor: null });
      }

      if (path.startsWith('/api/creators')) {
        return Promise.resolve({ items: [], nextCursor: null });
      }

      if (path.startsWith('/api/audit-logs')) {
        return Promise.resolve({
          items: [
            {
              id: 'audit_001',
              organizationId: 'org_mock_001',
              actorUserId: 'user_001',
              action: 'campaign.updated',
              targetType: 'campaign',
              targetId: 'camp_live_001',
              metadata: {},
              createdAt: new Date().toISOString(),
            },
          ],
          nextCursor: null,
        });
      }

      return Promise.resolve({});
    });

    const result = await fetchOperationsCenterWorkspace('org_mock_001');

    expect(['live', 'partial']).toContain(result.source);
    expect(result.data.activityFeed.length).toBeGreaterThan(0);
  });

  it('validates mock workspace shape', () => {
    const workspace = createMockOperationsCenterWorkspace('org_mock_001');
    expect(ManagerOperationsCenterWorkspaceSchema.safeParse(workspace).success).toBe(true);
  });
});
