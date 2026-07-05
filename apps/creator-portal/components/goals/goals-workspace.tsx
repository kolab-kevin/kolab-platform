'use client';

import { Button } from '@kolab/ui';

import { InlineLoading } from '@/components/common/global-loading';
import { WorkspaceError } from '@/components/common/workspace-error';
import { GoalsSection } from '@/components/goals/goals-section';
import { useGoals } from '@/hooks/use-goals';

function sourceLabel(source: NonNullable<ReturnType<typeof useGoals>['source']>): string {
  switch (source) {
    case 'mock':
      return 'Mock data';
    case 'live':
      return 'Live API';
    case 'empty':
      return 'No goals yet';
    default:
      return source;
  }
}

export function GoalsWorkspace() {
  const { grouped, nextCursor, loading, error, source, refresh } = useGoals();
  const totalGoals = grouped.active.length + grouped.completed.length + grouped.missed.length;

  if (loading) {
    return <InlineLoading label="Loading goals…" />;
  }

  if (error) {
    return (
      <WorkspaceError title="Unable to load goals" message={error} onRetry={() => void refresh()} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground text-sm">
            {totalGoals} goals tracked
            {source ? ` · ${sourceLabel(source)}` : null}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {source === 'empty' && totalGoals === 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No goals are assigned yet. Your agency manager can create goals from the admin tools.
        </div>
      ) : null}

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
    </div>
  );
}
