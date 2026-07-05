'use client';

import dynamic from 'next/dynamic';

import { AlertsSection } from '@/components/coach/alerts-section';
import { CoachOverviewSection } from '@/components/coach/coach-overview-section';
import { CoachTabNavigation } from '@/components/coach/coach-tab-navigation';
import { RecommendationsSection } from '@/components/coach/recommendations-section';
import { EmptyWorkspaceState } from '@/components/common/empty-workspace-state';
import { LoadingSkeleton } from '@/components/common/workspace-loading';
import { PartialWorkspaceNotice, WorkspacePage } from '@/components/common/workspace-page';
import { useCoachWorkspace } from '@/hooks/use-coach-workspace';
import { WORKSPACE_GRID_CLASS } from '@/lib/studio-ui';

const SessionIntelligenceSection = dynamic(
  () =>
    import('@/components/coach/session-intelligence-section').then((module) => ({
      default: module.SessionIntelligenceSection,
    })),
  { loading: () => <LoadingSkeleton rows={3} label="Loading session intelligence" /> },
);

const CreatorIntelligenceSection = dynamic(
  () =>
    import('@/components/coach/creator-intelligence-section').then((module) => ({
      default: module.CreatorIntelligenceSection,
    })),
  { loading: () => <LoadingSkeleton rows={3} label="Loading creator intelligence" /> },
);

export function CoachWorkspace() {
  const { data, loading, error, source, view, setView, refresh } = useCoachWorkspace();

  const recommendationCount = Object.values(data.recommendations).reduce(
    (count, items) => count + items.length,
    0,
  );
  const alertCount = Object.values(data.alerts).reduce((count, items) => count + items.length, 0);

  return (
    <WorkspacePage
      title="Coach"
      description={`${recommendationCount} recommendations · ${alertCount} alerts`}
      source={source}
      loading={loading}
      loadingLabel="Loading coach workspace…"
      error={error}
      errorTitle="Unable to load coach workspace"
      onRetry={() => void refresh()}
      emptyNotice={
        source === 'empty' && recommendationCount === 0 && alertCount === 0 ? (
          <EmptyWorkspaceState message="No coaching signals are available yet. Complete a live session to generate recommendations and alerts." />
        ) : null
      }
      partialNotice={
        source === 'partial' ? (
          <PartialWorkspaceNotice message="Some coach data could not be loaded. Showing available results." />
        ) : null
      }
    >
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
        <div className={WORKSPACE_GRID_CLASS}>
          <SessionIntelligenceSection intelligence={data.sessionIntelligence} />
          <CreatorIntelligenceSection intelligence={data.creatorIntelligence} />
        </div>
      ) : null}
    </WorkspacePage>
  );
}
