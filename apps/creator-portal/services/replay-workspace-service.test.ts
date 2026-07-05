import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_LIVE_SESSION_ID } from '@/services/live-mock';
import { fetchReplayWorkspace } from '@/services/replay-workspace-service';

const { useMockStudioDataMock, fetchCreatorDashboardMock } = vi.hoisted(() => ({
  useMockStudioDataMock: vi.fn(() => true),
  fetchCreatorDashboardMock: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  useMockStudioData: () => useMockStudioDataMock(),
  getCreatorProfileId: () => 'creator_test_001',
}));

vi.mock('./dashboard-service', () => ({
  fetchCreatorDashboard: (...args: unknown[]) => fetchCreatorDashboardMock(...args),
}));

vi.mock('./replay-service', () => ({
  fetchSessionReplay: vi.fn().mockResolvedValue({ data: null, source: 'empty' }),
}));

vi.mock('./highlight-service', () => ({
  fetchSessionHighlights: vi.fn().mockResolvedValue({ data: null, source: 'empty' }),
}));

vi.mock('./trigger-analysis-service', () => ({
  fetchSessionTriggerAnalysis: vi.fn().mockResolvedValue({ data: null, source: 'empty' }),
}));

vi.mock('./gifter-service', () => ({
  fetchSessionGifters: vi.fn().mockResolvedValue({ data: null, source: 'empty' }),
}));

vi.mock('./intelligence-service', () => ({
  fetchSessionIntelligence: vi.fn().mockResolvedValue({ data: null, source: 'empty' }),
}));

beforeEach(() => {
  useMockStudioDataMock.mockReset();
  useMockStudioDataMock.mockReturnValue(true);
  fetchCreatorDashboardMock.mockReset();
});

describe('fetchReplayWorkspace', () => {
  it('returns mock replay workspace when mock mode is enabled', async () => {
    const result = await fetchReplayWorkspace('creator_test_001');

    expect(result.source).toBe('mock');
    expect(result.data.sessionId).toBe(MOCK_LIVE_SESSION_ID);
    expect(result.data.replay?.segments.length).toBeGreaterThan(0);
    expect(result.data.gifters.length).toBeGreaterThan(0);
    expect(fetchCreatorDashboardMock).not.toHaveBeenCalled();
  });

  it('returns empty workspace when no session is available', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    fetchCreatorDashboardMock.mockResolvedValue({
      data: { liveActivity: { latestLiveSession: null } },
    });

    const result = await fetchReplayWorkspace('creator_test_001');

    expect(result.source).toBe('empty');
    expect(result.data.sessionId).toBeNull();
  });
});
