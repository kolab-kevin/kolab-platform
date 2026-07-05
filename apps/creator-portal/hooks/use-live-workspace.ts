'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import { isDashboardUnauthorizedError } from '@/services/dashboard-errors';
import {
  fetchLiveWorkspace,
  type LiveWorkspaceDataSource,
} from '@/services/live-workspace-service';
import { createEmptyLiveWorkspaceData, type LiveWorkspaceData } from '@/types/live-adapters';

type LiveWorkspaceState = {
  data: LiveWorkspaceData;
  loading: boolean;
  error: string | null;
  source: LiveWorkspaceDataSource | null;
  refresh: () => Promise<void>;
};

export function useLiveWorkspace(): LiveWorkspaceState {
  const { creatorProfile } = useOrganization();
  const router = useRouter();
  const [data, setData] = React.useState<LiveWorkspaceData>(createEmptyLiveWorkspaceData());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<LiveWorkspaceDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchLiveWorkspace(creatorProfile.id);
      setData(result.data);
      setSource(result.source);
    } catch (err) {
      if (isDashboardUnauthorizedError(err)) {
        router.replace('/unauthorized');
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to load live workspace');
      setData(createEmptyLiveWorkspaceData());
      setSource(null);
    } finally {
      setLoading(false);
    }
  }, [creatorProfile.id, router]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, source, refresh };
}
