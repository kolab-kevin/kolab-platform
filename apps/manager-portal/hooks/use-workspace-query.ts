'use client';

import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import { getCachedWorkspaceFetch } from '@/lib/workspace-cache';
import type { WorkspaceDataSource } from '@/types/data-source';

type WorkspaceFetchResult<T> = {
  data: T;
  source: WorkspaceDataSource;
};

type UseWorkspaceQueryOptions<T> = {
  queryKey: string;
  fetcher: (organizationId: string) => Promise<WorkspaceFetchResult<T>>;
  errorMessage: string;
};

export function useWorkspaceQuery<T>({
  queryKey,
  fetcher,
  errorMessage,
}: UseWorkspaceQueryOptions<T>) {
  const { activeOrganization } = useOrganization();
  const [workspace, setWorkspace] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<WorkspaceDataSource | null>(null);

  const load = React.useCallback(
    async (force: boolean) => {
      setLoading(true);
      setError(null);

      try {
        const cacheKey = `${queryKey}:${activeOrganization.id}`;
        const result = await getCachedWorkspaceFetch(
          cacheKey,
          () => fetcher(activeOrganization.id),
          { force },
        );
        setWorkspace(result.data);
        setSource(result.source);
      } catch (err) {
        setWorkspace(null);
        setSource(null);
        setError(err instanceof Error ? err.message : errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [activeOrganization.id, errorMessage, fetcher, queryKey],
  );

  const refresh = React.useCallback(async () => {
    await load(true);
  }, [load]);

  React.useEffect(() => {
    void load(false);
  }, [load]);

  return {
    workspace,
    loading,
    error,
    source,
    refresh,
  };
}
