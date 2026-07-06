import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockCreatorDetail,
  createMockCreatorManagementWorkspace,
} from '@/services/creator-management-mock';
import {
  fetchCreatorManagementDetail,
  fetchCreatorManagementWorkspace,
} from '@/services/creator-management-service';
import { ManagerCreatorManagementWorkspaceSchema } from '@/types/creator-management';

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

describe('fetchCreatorManagementWorkspace', () => {
  it('returns typed mock workspace data in mock mode', async () => {
    const result = await fetchCreatorManagementWorkspace('org_mock_001');
    const parsed = ManagerCreatorManagementWorkspaceSchema.safeParse(result.data);

    expect(parsed.success).toBe(true);
    expect(result.source).toBe('mock');
    expect(result.data.list.items.length).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('loads live creator list from API when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockResolvedValue({
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
          platformCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      nextCursor: null,
    });

    const result = await fetchCreatorManagementWorkspace('org_mock_001');

    expect(result.source).toBe('live');
    expect(result.data.list.items[0]?.displayName).toBe('Live Creator');
    expect(apiGetMock).toHaveBeenCalledWith('/api/creators?limit=50');
  });
});

describe('fetchCreatorManagementDetail', () => {
  it('returns mock detail for known creator ids', async () => {
    const result = await fetchCreatorManagementDetail('creator_mock_001');

    expect(result.source).toBe('mock');
    expect(result.data?.profile.displayName).toBe('Alex Rivera');
  });

  it('validates mock workspace and detail shapes', () => {
    const workspace = createMockCreatorManagementWorkspace('org_mock_001');
    const detail = createMockCreatorDetail('creator_mock_001');

    expect(ManagerCreatorManagementWorkspaceSchema.safeParse(workspace).success).toBe(true);
    expect(detail?.creatorId).toBe('creator_mock_001');
  });
});
