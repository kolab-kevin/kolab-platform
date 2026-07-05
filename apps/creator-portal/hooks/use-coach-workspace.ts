'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import { useWorkspaceTabs } from '@/hooks/use-workspace-tabs';
import { type CoachWorkspaceDataSource, fetchCoachWorkspace } from '@/services/coach-service';
import { isDashboardUnauthorizedError } from '@/services/dashboard-errors';
import {
  type CoachWorkspaceData,
  type CoachWorkspaceView,
  createEmptyCoachWorkspaceData,
} from '@/types/coach-adapters';

const COACH_TABS: CoachWorkspaceView[] = ['summary', 'recommendations', 'alerts', 'intelligence'];

type CoachWorkspaceState = {
  data: CoachWorkspaceData;
  loading: boolean;
  error: string | null;
  source: CoachWorkspaceDataSource | null;
  view: CoachWorkspaceView;
  setView: (view: CoachWorkspaceView) => void;
  refresh: () => Promise<void>;
};

export function useCoachWorkspace(): CoachWorkspaceState {
  const { creatorProfile } = useOrganization();
  const router = useRouter();
  const [data, setData] = React.useState<CoachWorkspaceData>(createEmptyCoachWorkspaceData());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<CoachWorkspaceDataSource | null>(null);
  const [view, setView] = useWorkspaceTabs<CoachWorkspaceView>('coach', 'summary', COACH_TABS);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchCoachWorkspace(creatorProfile.id);
      setData(result.data);
      setSource(result.source);
    } catch (err) {
      if (isDashboardUnauthorizedError(err)) {
        router.replace('/unauthorized');
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to load coach workspace');
      setData(createEmptyCoachWorkspaceData());
      setSource(null);
    } finally {
      setLoading(false);
    }
  }, [creatorProfile.id, router]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, source, view, setView, refresh };
}
