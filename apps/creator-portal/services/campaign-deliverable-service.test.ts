import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/services/api-client';
import { fetchAssignmentDeliverables } from '@/services/campaign-deliverable-service';
import { DashboardApiError } from '@/services/dashboard-errors';

const { apiGetMock, useMockStudioDataMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  useMockStudioDataMock: vi.fn(() => true),
}));

vi.mock('@/lib/env', () => ({
  useMockStudioData: () => useMockStudioDataMock(),
  getCreatorProfileId: () => 'creator_test_001',
  getApiBaseUrl: () => 'http://localhost:4000',
}));

vi.mock('./api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api-client')>();
  return {
    ...actual,
    apiClient: {
      get: (...args: unknown[]) => apiGetMock(...args),
    },
  };
});

beforeEach(() => {
  apiGetMock.mockReset();
  useMockStudioDataMock.mockReset();
  useMockStudioDataMock.mockReturnValue(true);
});

describe('fetchAssignmentDeliverables', () => {
  it('returns mock creator deliverables for an assignment', async () => {
    const result = await fetchAssignmentDeliverables('camp_1', 'assign_1');

    expect(result.source).toBe('mock');
    expect(result.data.items.length).toBeGreaterThan(0);
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('fetches live deliverables when mock mode is disabled', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockResolvedValue({ items: [] });

    const result = await fetchAssignmentDeliverables('camp_1', 'assign_1');

    expect(result.source).toBe('live');
    expect(apiGetMock).toHaveBeenCalledWith(
      '/api/campaigns/camp_1/assignments/assign_1/deliverables',
    );
    expect(result.data.items).toHaveLength(0);
  });

  it('throws DashboardApiError on unauthorized responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Unauthorized', 401));

    await expect(fetchAssignmentDeliverables('camp_1', 'assign_1')).rejects.toBeInstanceOf(
      DashboardApiError,
    );
  });

  it('returns empty deliverables on 404 responses', async () => {
    useMockStudioDataMock.mockReturnValue(false);
    apiGetMock.mockRejectedValue(new ApiClientError('Not found', 404));

    const result = await fetchAssignmentDeliverables('camp_1', 'assign_1');

    expect(result.source).toBe('empty');
    expect(result.data.items).toHaveLength(0);
  });
});
