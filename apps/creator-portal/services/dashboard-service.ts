import { type CreatorDashboardResponse, CreatorDashboardResponseSchema } from '@kolab/types';

import { getCreatorProfileId, useMockDashboard } from '@/lib/env';

import { apiClient } from './api-client';
import { createMockDashboard } from './dashboard-mock';

export async function fetchCreatorDashboard(
  creatorProfileId: string = getCreatorProfileId(),
): Promise<CreatorDashboardResponse> {
  if (useMockDashboard()) {
    return createMockDashboard(creatorProfileId);
  }

  const data = await apiClient.get<unknown>(`/api/creators/${creatorProfileId}/dashboard`);
  return CreatorDashboardResponseSchema.parse(data);
}
