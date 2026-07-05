'use client';

import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import {
  fetchProductionWorkspace,
  type ProductionWorkspaceDataSource,
} from '@/services/production-workspace-service';
import {
  createEmptyProductionWorkspaceData,
  type ProductionWorkspaceData,
} from '@/types/production-adapters';

type ProductionWorkspaceState = {
  data: ProductionWorkspaceData;
  loading: boolean;
  error: string | null;
  source: ProductionWorkspaceDataSource | null;
  refresh: () => Promise<void>;
};

export function useProductionWorkspace(): ProductionWorkspaceState {
  const { creatorProfile, activeOrganization } = useOrganization();
  const [data, setData] = React.useState<ProductionWorkspaceData>(
    createEmptyProductionWorkspaceData(),
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<ProductionWorkspaceDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchProductionWorkspace({
        creatorProfileId: creatorProfile.id,
        creatorDisplayName: creatorProfile.displayName ?? 'Creator',
        organizationId: activeOrganization.id,
        organizationName: activeOrganization.name,
      });
      setData(result.data);
      setSource(result.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load production workspace');
      setData(createEmptyProductionWorkspaceData());
      setSource(null);
    } finally {
      setLoading(false);
    }
  }, [
    activeOrganization.id,
    activeOrganization.name,
    creatorProfile.displayName,
    creatorProfile.id,
  ]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, source, refresh };
}
