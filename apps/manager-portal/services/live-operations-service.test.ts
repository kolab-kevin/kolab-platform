import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockLiveOperationsWorkspace } from '@/services/live-operations-mock';
import { fetchLiveOperationsWorkspace } from '@/services/live-operations-service';
import { ManagerLiveOperationsWorkspaceSchema } from '@/types/live-operations';

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

describe('fetchLiveOperationsWorkspace', () => {
  it('returns typed mock workspace data in mock mode', async () => {
    const result = await fetchLiveOperationsWorkspace('org_mock_001');
    const parsed = ManagerLiveOperationsWorkspaceSchema.safeParse(result.data);

    expect(parsed.success).toBe(true);
    expect(result.source).toBe('mock');
    expect(result.data.sessions.length).toBeGreaterThan(0);
    expect(result.data.agencyMonitoring.creatorsLiveNow).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('loads live sessions from API when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockImplementation((path: string) => {
      if (path.startsWith('/api/live/sessions')) {
        return Promise.resolve({
          items: [
            {
              id: 'live_session_001',
              organizationId: 'org_mock_001',
              creatorProfileId: 'creator_live_001',
              campaignId: null,
              platform: 'TIKTOK',
              platformSessionId: null,
              title: 'Live Now',
              description: null,
              startedAt: new Date().toISOString(),
              endedAt: null,
              scheduledStart: null,
              scheduledEnd: null,
              durationSeconds: null,
              peakViewers: 100,
              totalViewers: 100,
              totalGifts: 5,
              totalGiftValue: '50.00',
              status: 'LIVE',
              metadata: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          nextCursor: null,
        });
      }

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
              platformCount: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          nextCursor: null,
        });
      }

      if (path.includes('/timeline')) {
        return Promise.resolve({
          liveSessionId: 'live_session_001',
          items: [],
          nextCursor: null,
        });
      }

      if (path.includes('/coach/alerts')) {
        return Promise.resolve({
          sessionId: 'live_session_001',
          generatedAt: new Date().toISOString(),
          alerts: [],
        });
      }

      if (path.includes('/recommendations')) {
        return Promise.resolve({
          sessionId: 'live_session_001',
          generatedAt: new Date().toISOString(),
          recommendations: [],
        });
      }

      if (path.includes('/intelligence')) {
        return Promise.resolve({
          sessionId: 'live_session_001',
          creatorProfileId: 'creator_live_001',
          generatedAt: new Date().toISOString(),
          sessionHealthScore: 80,
          revenueScore: 75,
          engagementScore: 82,
          consistencyScore: 70,
          gifterQualityScore: 68,
          coachingOpportunityScore: 60,
          overallScore: 78,
          keyStrengths: [],
          keyRisks: [],
          topSignals: [],
          topGifters: [],
          topTriggerTypes: [],
          bestMoments: [],
          weakMoments: [],
          recommendedNextActions: [],
          dataQualityWarnings: [],
        });
      }

      return Promise.resolve({});
    });

    const result = await fetchLiveOperationsWorkspace('org_mock_001');

    expect(['live', 'partial']).toContain(result.source);
    expect(result.data.sessions[0]?.creatorDisplayName).toBe('Live Creator');
  });

  it('validates mock workspace shape', () => {
    const workspace = createMockLiveOperationsWorkspace('org_mock_001');
    expect(ManagerLiveOperationsWorkspaceSchema.safeParse(workspace).success).toBe(true);
  });
});
