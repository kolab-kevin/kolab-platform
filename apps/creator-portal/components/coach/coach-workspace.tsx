'use client';

import { Button } from '@kolab/ui';

import { AlertsSection } from '@/components/coach/alerts-section';
import { CoachOverviewSection } from '@/components/coach/coach-overview-section';
import { CoachTabNavigation } from '@/components/coach/coach-tab-navigation';
import { CreatorIntelligenceSection } from '@/components/coach/creator-intelligence-section';
import { RecommendationsSection } from '@/components/coach/recommendations-section';
import { SessionIntelligenceSection } from '@/components/coach/session-intelligence-section';
import { InlineLoading } from '@/components/common/global-loading';
import { WorkspaceError } from '@/components/common/workspace-error';
import { useCoachWorkspace } from '@/hooks/use-coach-workspace';

function sourceLabel(source: NonNullable<ReturnType<typeof useCoachWorkspace>['source']>): string {
  switch (source) {
    case 'mock':
      return 'Mock data';
    case 'live':
      return 'Live API';
    case 'empty':
      return 'No coaching data yet';
    case 'partial':
      return 'Partial API data';
    default:
      return source;
  }
}

export function CoachWorkspace() {
  const { data, loading, error, source, view, setView, refresh } = useCoachWorkspace();

  const recommendationCount = Object.values(data.recommendations).reduce(
    (count, items) => count + items.length,
    0,
  );
  const alertCount = Object.values(data.alerts).reduce((count, items) => count + items.length, 0);

  if (loading) {
    return <InlineLoading label="Loading coach workspace…" />;
  }

  if (error) {
    return (
      <WorkspaceError
        title="Unable to load coach workspace"
        message={error}
        onRetry={() => void refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coach</h1>
          <p className="text-muted-foreground text-sm">
            {recommendationCount} recommendations · {alertCount} alerts
            {source ? ` · ${sourceLabel(source)}` : null}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {source === 'empty' && recommendationCount === 0 && alertCount === 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No coaching signals are available yet. Complete a live session to generate recommendations
          and alerts.
        </div>
      ) : null}

      {source === 'partial' ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Some coach data could not be loaded. Showing available results.
        </div>
      ) : null}

      <CoachTabNavigation view={view} onViewChange={setView} />

      {view === 'summary' ? (
        <div className="space-y-6">
          <CoachOverviewSection overview={data.overview} />
          <RecommendationsSection recommendations={data.recommendations} />
          <AlertsSection alerts={data.alerts} />
        </div>
      ) : null}

      {view === 'recommendations' ? (
        <RecommendationsSection recommendations={data.recommendations} />
      ) : null}

      {view === 'alerts' ? <AlertsSection alerts={data.alerts} /> : null}

      {view === 'intelligence' ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SessionIntelligenceSection intelligence={data.sessionIntelligence} />
          <CreatorIntelligenceSection intelligence={data.creatorIntelligence} />
        </div>
      ) : null}
    </div>
  );
}
