import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockReportingWorkspace } from '@/services/reporting-mock';
import { fetchReportingWorkspace } from '@/services/reporting-service';
import { ManagerReportingWorkspaceSchema } from '@/types/reporting-workspace';

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

describe('fetchReportingWorkspace', () => {
  it('returns typed mock workspace data in mock mode', async () => {
    const result = await fetchReportingWorkspace('org_mock_001');
    const parsed = ManagerReportingWorkspaceSchema.safeParse(result.data);

    expect(parsed.success).toBe(true);
    expect(result.source).toBe('mock');
    expect(result.data.executiveOverview.totalCreators).toBeGreaterThan(0);
    expect(result.data.exportCenter.options.length).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('loads live reporting data from APIs when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockImplementation((path: string) => {
      if (path.startsWith('/api/creators')) {
        return Promise.resolve({
          items: [
            {
              id: 'creator_live_001',
              organizationId: 'org_mock_001',
              userId: 'user_001',
              displayName: 'Live Creator',
              email: 'live@example.com',
              country: 'US',
              languages: ['en'],
              assignedRecruiterId: null,
              status: 'ACTIVE',
              platformCount: 2,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          nextCursor: null,
        });
      }

      if (path.startsWith('/api/campaigns')) {
        return Promise.resolve({ items: [], nextCursor: null });
      }

      if (path.startsWith('/api/recruitment/leads')) {
        return Promise.resolve({ items: [], nextCursor: null });
      }

      if (path.startsWith('/api/recruiters')) {
        return Promise.resolve({ items: [], nextCursor: null });
      }

      if (path.startsWith('/api/live/sessions')) {
        return Promise.resolve({ items: [], nextCursor: null });
      }

      return Promise.resolve({});
    });

    const result = await fetchReportingWorkspace('org_mock_001');

    expect(['live', 'partial']).toContain(result.source);
    expect(result.data.executiveOverview.totalCreators).toBe(1);
  });

  it('validates mock workspace shape', () => {
    const workspace = createMockReportingWorkspace('org_mock_001');
    expect(ManagerReportingWorkspaceSchema.safeParse(workspace).success).toBe(true);
  });
});
