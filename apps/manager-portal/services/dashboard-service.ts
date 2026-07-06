import { getDefaultOrganizationId, useMockDashboard } from '@/lib/env';
import { createMockManagerDashboard } from '@/services/dashboard-mock';
import type { ManagerDashboardFetchResult } from '@/types/manager-dashboard';

export async function fetchManagerDashboard(
  organizationId: string = getDefaultOrganizationId(),
): Promise<ManagerDashboardFetchResult> {
  if (!useMockDashboard()) {
    throw new Error('Live Manager Portal dashboard API is not available yet.');
  }

  return {
    data: createMockManagerDashboard(organizationId),
    source: 'mock',
  };
}
