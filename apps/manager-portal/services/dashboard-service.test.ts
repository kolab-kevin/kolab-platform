import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockManagerDashboard } from '@/services/dashboard-mock';
import { fetchManagerDashboard } from '@/services/dashboard-service';
import { ManagerDashboardResponseSchema } from '@/types/manager-dashboard';

const { useMockDashboardMock } = vi.hoisted(() => ({
  useMockDashboardMock: vi.fn(() => true),
}));

vi.mock('@/lib/env', () => ({
  useMockDashboard: () => useMockDashboardMock(),
  getDefaultOrganizationId: () => 'org_mock_001',
  getApiBaseUrl: () => 'http://localhost:4000',
}));

describe('fetchManagerDashboard', () => {
  beforeEach(() => {
    useMockDashboardMock.mockReset();
    useMockDashboardMock.mockReturnValue(true);
  });

  it('returns typed mock dashboard data in mock mode', async () => {
    const result = await fetchManagerDashboard('org_mock_001');
    const parsed = ManagerDashboardResponseSchema.safeParse(result.data);

    expect(parsed.success).toBe(true);
    expect(result.source).toBe('mock');
    expect(result.data.agencyOverview.activeCreators).toBeGreaterThan(0);
    expect(result.data.tasksAndAlerts.items.length).toBeGreaterThan(0);
  });

  it('rejects live mode until API integration ships', async () => {
    useMockDashboardMock.mockReturnValue(false);

    await expect(fetchManagerDashboard('org_mock_001')).rejects.toThrow(
      'Live Manager Portal dashboard API is not available yet.',
    );
  });
});

describe('createMockManagerDashboard', () => {
  it('validates against the manager dashboard schema', () => {
    const data = createMockManagerDashboard('org_test');
    const parsed = ManagerDashboardResponseSchema.safeParse(data);

    expect(parsed.success).toBe(true);
    expect(data.organizationId).toBe('org_test');
    expect(data.revenue.placeholder).toBe(true);
  });
});
