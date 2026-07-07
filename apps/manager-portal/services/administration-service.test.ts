import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockAdministrationWorkspace } from '@/services/administration-mock';
import { fetchAdministrationWorkspace } from '@/services/administration-service';
import { ManagerAdministrationWorkspaceSchema } from '@/types/administration-workspace';

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

describe('fetchAdministrationWorkspace', () => {
  it('returns typed mock workspace data in mock mode', async () => {
    const result = await fetchAdministrationWorkspace('org_mock_001');
    const parsed = ManagerAdministrationWorkspaceSchema.safeParse(result.data);

    expect(parsed.success).toBe(true);
    expect(result.source).toBe('mock');
    expect(result.data.userManagement.users.length).toBeGreaterThan(0);
    expect(result.data.integrations.apiKeys.length).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('loads live administration data from APIs when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockImplementation((path: string) => {
      if (path === '/api/organizations/current') {
        return Promise.resolve({
          organization: {
            id: 'org_mock_001',
            name: 'Live Agency',
            slug: 'live-agency',
            type: 'AGENCY',
            status: 'ACTIVE',
            settings: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          membership: {
            role: 'ORG_ADMIN',
            status: 'ACTIVE',
            joinedAt: new Date().toISOString(),
          },
        });
      }

      if (path === '/api/agency') {
        return Promise.resolve({
          organization: {
            id: 'org_mock_001',
            name: 'Live Agency',
            slug: 'live-agency',
            type: 'AGENCY',
            status: 'ACTIVE',
          },
          profile: {
            description: null,
            logoUrl: null,
            website: null,
            primaryContact: 'Live Admin',
            phone: null,
            country: 'US',
            timezone: 'UTC',
            supportedLanguages: ['en'],
            socialLinks: {},
            businessSettings: {},
          },
          updatedAt: new Date().toISOString(),
        });
      }

      if (path === '/api/agency/settings') {
        return Promise.resolve({
          organization: {
            id: 'org_mock_001',
            name: 'Live Agency',
            slug: 'live-agency',
            type: 'AGENCY',
            status: 'ACTIVE',
          },
          settings: {
            campaigns: { enabled: true },
          },
          updatedAt: new Date().toISOString(),
        });
      }

      if (path === '/api/organizations/members') {
        return Promise.resolve({
          members: [
            {
              organizationId: 'org_mock_001',
              userId: 'user_live_001',
              role: 'ORG_ADMIN',
              status: 'ACTIVE',
              joinedAt: new Date().toISOString(),
              email: 'admin@live.example',
              displayName: 'Live Admin',
            },
          ],
        });
      }

      if (path === '/api/invitations') {
        return Promise.resolve({ invitations: [] });
      }

      if (path.startsWith('/api/audit-logs')) {
        return Promise.resolve({ items: [], nextCursor: null });
      }

      return Promise.resolve({});
    });

    const result = await fetchAdministrationWorkspace('org_mock_001');

    expect(['live', 'partial']).toContain(result.source);
    expect(result.data.organizationProfile.name).toBe('Live Agency');
    expect(result.data.userManagement.users).toHaveLength(1);
  });

  it('validates mock workspace shape', () => {
    const workspace = createMockAdministrationWorkspace('org_mock_001');
    expect(ManagerAdministrationWorkspaceSchema.safeParse(workspace).success).toBe(true);
  });
});
