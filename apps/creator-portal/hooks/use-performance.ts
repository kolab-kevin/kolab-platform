'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import { isDashboardUnauthorizedError } from '@/services/dashboard-errors';
import {
  fetchCreatorPerformanceScore,
  type PerformanceDataSource,
} from '@/services/performance-service';
import type { PerformanceWorkspaceData } from '@/types/performance-adapters';

type PerformanceState = {
  data: PerformanceWorkspaceData | null;
  loading: boolean;
  error: string | null;
  source: PerformanceDataSource | null;
  refresh: () => Promise<void>;
};

export function usePerformance(): PerformanceState {
  const { creatorProfile } = useOrganization();
  const router = useRouter();
  const [data, setData] = React.useState<PerformanceWorkspaceData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<PerformanceDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCreatorPerformanceScore(creatorProfile.id);
      setData(result.data);
      setSource(result.source);
    } catch (err) {
      if (isDashboardUnauthorizedError(err)) {
        router.replace('/unauthorized');
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to load performance score');
      setData(null);
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
