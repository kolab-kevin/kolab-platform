'use client';

import type { CreatorDashboardResponse } from '@kolab/types';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import { isDashboardUnauthorizedError } from '@/services/dashboard-errors';
import { type DashboardDataSource, fetchCreatorDashboard } from '@/services/dashboard-service';

type DashboardState = {
  data: CreatorDashboardResponse | null;
  loading: boolean;
  error: string | null;
  source: DashboardDataSource | null;
  refresh: () => Promise<void>;
};

export function useDashboard(): DashboardState {
  const { creatorProfile } = useOrganization();
  const router = useRouter();
  const [data, setData] = React.useState<CreatorDashboardResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<DashboardDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCreatorDashboard(creatorProfile.id);
      setData(result.data);
      setSource(result.source);
    } catch (err) {
      if (isDashboardUnauthorizedError(err)) {
        router.replace('/unauthorized');
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
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
