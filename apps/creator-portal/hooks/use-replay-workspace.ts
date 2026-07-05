'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import { isDashboardUnauthorizedError } from '@/services/dashboard-errors';
import {
  fetchReplayWorkspace,
  type ReplayWorkspaceDataSource,
} from '@/services/replay-workspace-service';
import { createEmptyReplayWorkspaceData, type ReplayWorkspaceData } from '@/types/replay-adapters';

type ReplayWorkspaceState = {
  data: ReplayWorkspaceData;
  loading: boolean;
  error: string | null;
  source: ReplayWorkspaceDataSource | null;
  refresh: () => Promise<void>;
};

export function useReplayWorkspace(): ReplayWorkspaceState {
  const { creatorProfile } = useOrganization();
  const router = useRouter();
  const [data, setData] = React.useState<ReplayWorkspaceData>(createEmptyReplayWorkspaceData());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<ReplayWorkspaceDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchReplayWorkspace(creatorProfile.id);
      setData(result.data);
      setSource(result.source);
    } catch (err) {
      if (isDashboardUnauthorizedError(err)) {
        router.replace('/unauthorized');
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to load replay workspace');
      setData(createEmptyReplayWorkspaceData());
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
