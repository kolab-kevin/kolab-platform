import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchProfileWorkspace } from '@/services/profile-workspace-service';

const { useMockStudioDataMock } = vi.hoisted(() => ({
  useMockStudioDataMock: vi.fn(() => true),
}));

vi.mock('@/lib/env', () => ({
  useMockStudioData: () => useMockStudioDataMock(),
  getCreatorProfileId: () => 'creator_test_001',
  getApiBaseUrl: () => 'http://localhost:4000',
}));

beforeEach(() => {
  useMockStudioDataMock.mockReset();
  useMockStudioDataMock.mockReturnValue(true);
});

describe('fetchProfileWorkspace', () => {
  it('returns mock profile workspace when mock mode is enabled', async () => {
    const result = await fetchProfileWorkspace('creator_test_001');

    expect(result.source).toBe('mock');
    expect(result.data.profile?.displayName).toBe('Alex Rivera');
    expect(result.data.platformAccounts.length).toBeGreaterThan(0);
    expect(result.data.skills?.skills.length).toBeGreaterThan(0);
    expect(result.data.compliance?.onboardingItems.length).toBeGreaterThan(0);
  });
});
