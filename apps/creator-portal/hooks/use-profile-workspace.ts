'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import { isDashboardUnauthorizedError } from '@/services/dashboard-errors';
import {
  fetchProfileWorkspace,
  type ProfileWorkspaceDataSource,
} from '@/services/profile-workspace-service';
import {
  createEmptyProfileWorkspaceData,
  type ProfileWorkspaceData,
} from '@/types/profile-adapters';

type ProfileWorkspaceState = {
  data: ProfileWorkspaceData;
  loading: boolean;
  error: string | null;
  source: ProfileWorkspaceDataSource | null;
  refresh: () => Promise<void>;
};

export function useProfileWorkspace(): ProfileWorkspaceState {
  const { creatorProfile } = useOrganization();
  const router = useRouter();
  const [data, setData] = React.useState<ProfileWorkspaceData>(createEmptyProfileWorkspaceData());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<ProfileWorkspaceDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchProfileWorkspace(creatorProfile.id);
      setData(result.data);
      setSource(result.source);
    } catch (err) {
      if (isDashboardUnauthorizedError(err)) {
        router.replace('/unauthorized');
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to load profile workspace');
      setData(createEmptyProfileWorkspaceData());
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
