'use client';

import { EmptyWorkspaceState } from '@/components/common/empty-workspace-state';
import { WorkspacePage } from '@/components/common/workspace-page';
import { GoalsSection } from '@/components/goals/goals-section';
import { useGoals } from '@/hooks/use-goals';

export function GoalsWorkspace() {
  const { grouped, nextCursor, loading, error, source, refresh } = useGoals();
  const totalGoals = grouped.active.length + grouped.completed.length + grouped.missed.length;

  return (
    <WorkspacePage
      title="Goals"
      description={`${totalGoals} goals tracked`}
      source={source}
      loading={loading}
      loadingLabel="Loading goals…"
      error={error}
      errorTitle="Unable to load goals"
      onRetry={() => void refresh()}
      emptyNotice={
        source === 'empty' && totalGoals === 0 ? (
          <EmptyWorkspaceState message="No goals are assigned yet. Your agency manager can create goals from the admin tools." />
        ) : null
      }
    >
      <GoalsSection
        title="Active Goals"
        goals={grouped.active}
        emptyMessage="No active goals right now."
      />
      <GoalsSection
        title="Completed Goals"
        goals={grouped.completed}
        emptyMessage="No completed goals in the current list."
      />
      <GoalsSection
        title="Missed Goals"
        goals={grouped.missed}
        emptyMessage="No missed goals in the current list."
      />

      {nextCursor ? (
        <p className="text-muted-foreground text-xs">
          Additional goals are available — pagination will load more in a future update.
        </p>
      ) : null}
    </WorkspacePage>
  );
}
