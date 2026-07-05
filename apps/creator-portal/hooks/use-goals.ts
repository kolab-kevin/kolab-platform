'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useOrganization } from '@/contexts/organization-context';
import { isDashboardUnauthorizedError } from '@/services/dashboard-errors';
import { fetchCreatorGoals, type GoalsDataSource } from '@/services/goal-service';
import { type GroupedGoals, groupGoalsByStatus } from '@/types/goal-adapters';

type GoalsState = {
  grouped: GroupedGoals;
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
  source: GoalsDataSource | null;
  refresh: () => Promise<void>;
};

const EMPTY_GROUPED: GroupedGoals = {
  active: [],
  completed: [],
  missed: [],
};

export function useGoals(): GoalsState {
  const { creatorProfile } = useOrganization();
  const router = useRouter();
  const [grouped, setGrouped] = React.useState<GroupedGoals>(EMPTY_GROUPED);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<GoalsDataSource | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCreatorGoals(creatorProfile.id);
      setGrouped(groupGoalsByStatus(result.data.items));
      setNextCursor(result.data.nextCursor);
      setSource(result.source);
    } catch (err) {
      if (isDashboardUnauthorizedError(err)) {
        router.replace('/unauthorized');
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to load goals');
      setGrouped(EMPTY_GROUPED);
      setNextCursor(null);
      setSource(null);
    } finally {
      setLoading(false);
    }
  }, [creatorProfile.id, router]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { grouped, nextCursor, loading, error, source, refresh };
}
