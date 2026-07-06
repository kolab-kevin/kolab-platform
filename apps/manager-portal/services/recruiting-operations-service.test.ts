import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockRecruitingWorkspace } from '@/services/recruiting-mock';
import { fetchRecruitingWorkspace } from '@/services/recruiting-operations-service';
import { ManagerRecruitingWorkspaceSchema } from '@/types/recruiting-workspace';

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

describe('fetchRecruitingWorkspace', () => {
  it('returns typed mock workspace data in mock mode', async () => {
    const result = await fetchRecruitingWorkspace('org_mock_001');
    const parsed = ManagerRecruitingWorkspaceSchema.safeParse(result.data);

    expect(parsed.success).toBe(true);
    expect(result.source).toBe('mock');
    expect(result.data.prospects.length).toBeGreaterThan(0);
    expect(result.data.pipeline.interested.length).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('loads live prospects from API when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockImplementation((path: string) => {
      if (path.match(/^\/api\/recruitment\/leads\/[^/?]+$/)) {
        return Promise.resolve({
          id: 'lead_live_001',
          organizationId: 'org_mock_001',
          name: 'Live Lead',
          nickname: 'livelead',
          email: 'live@example.com',
          phone: '+1 555 9999',
          country: 'US',
          languages: ['en'],
          source: 'MANUAL',
          status: 'INTERESTED',
          score: 75,
          assignedRecruiterId: 'user_recruiter_001',
          assignedAt: new Date().toISOString(),
          nextFollowUpAt: new Date().toISOString(),
          commissionPlan: 'STANDARD',
          convertedUserId: null,
          convertedAt: null,
          notesSummary: 'Live lead notes',
          metadata: { tags: ['live'] },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          platformAccounts: [],
          assignments: [],
          notes: [],
          statusHistory: [],
        });
      }

      if (path.startsWith('/api/recruitment/leads')) {
        return Promise.resolve({
          items: [
            {
              id: 'lead_live_001',
              organizationId: 'org_mock_001',
              name: 'Live Lead',
              nickname: 'livelead',
              email: 'live@example.com',
              source: 'MANUAL',
              status: 'INTERESTED',
              score: 75,
              assignedRecruiterId: 'user_recruiter_001',
              assignedAt: new Date().toISOString(),
              nextFollowUpAt: new Date().toISOString(),
              commissionPlan: 'STANDARD',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          nextCursor: null,
        });
      }

      if (path.startsWith('/api/recruiters')) {
        return Promise.resolve({
          items: [
            {
              id: 'recruiter_profile_001',
              organizationId: 'org_mock_001',
              userId: 'user_recruiter_001',
              displayName: 'Jordan Lee',
              nickname: 'Jordan',
              territory: 'West Coast',
              status: 'ACTIVE',
              managerUserId: 'user_manager_001',
              commissionPlan: 'STANDARD',
              monthlyLeadGoal: 40,
              monthlyCreatorGoal: 8,
            },
          ],
          nextCursor: null,
        });
      }

      return Promise.resolve({});
    });

    const result = await fetchRecruitingWorkspace('org_mock_001');

    expect(['live', 'partial']).toContain(result.source);
    expect(result.data.prospects[0]?.name).toBe('Live Lead');
  });

  it('validates mock workspace shape', () => {
    const workspace = createMockRecruitingWorkspace('org_mock_001');
    expect(ManagerRecruitingWorkspaceSchema.safeParse(workspace).success).toBe(true);
  });
});
