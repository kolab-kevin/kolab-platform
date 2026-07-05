import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockProductionWorkspace,
  fetchProductionWorkspace,
  setProductionWorkspaceProvider,
} from '@/services/production-workspace-service';

describe('production-workspace-service', () => {
  const context = {
    creatorProfileId: 'creator_test_001',
    creatorDisplayName: 'Alex Rivera',
    organizationId: 'org_mock_001',
    organizationName: 'Kōlab Creator Agency',
  };

  beforeEach(() => {
    setProductionWorkspaceProvider({
      loadWorkspace: async (ctx) => createMockProductionWorkspace(ctx),
    });
  });

  it('returns mock production workspace data', async () => {
    const result = await fetchProductionWorkspace(context);

    expect(result.source).toBe('mock');
    expect(result.data.scenes.length).toBeGreaterThan(0);
    expect(result.data.sources.length).toBeGreaterThan(0);
    expect(result.data.header.creatorDisplayName).toBe('Alex Rivera');
  });

  it('supports swapping the provider layer for future desktop integration', async () => {
    const loadWorkspace = vi.fn(async () => createMockProductionWorkspace(context));
    setProductionWorkspaceProvider({ loadWorkspace });

    const result = await fetchProductionWorkspace(context);

    expect(loadWorkspace).toHaveBeenCalledWith(context);
    expect(result.data.activeSceneId).toBeTruthy();
  });
});
