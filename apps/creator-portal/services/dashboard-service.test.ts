import { CreatorDashboardResponseSchema } from '@kolab/types';
import { describe, expect, it, vi } from 'vitest';

import { createMockDashboard } from '@/services/dashboard-mock';
import { fetchCreatorDashboard } from '@/services/dashboard-service';

describe('fetchCreatorDashboard', () => {
  it('returns mock dashboard data that matches the API schema', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_DASHBOARD', 'true');

    const dashboard = await fetchCreatorDashboard('creator_test_001');
    const parsed = CreatorDashboardResponseSchema.safeParse(dashboard);

    expect(parsed.success).toBe(true);
    expect(dashboard.overview.displayName).toBeTruthy();
    expect(dashboard.quickActions.length).toBeGreaterThan(0);
  });
});

describe('createMockDashboard', () => {
  it('uses the provided creator profile id', () => {
    const dashboard = createMockDashboard('creator_xyz');
    expect(dashboard.creatorProfileId).toBe('creator_xyz');
    expect(dashboard.overview.creatorProfileId).toBe('creator_xyz');
  });
});
