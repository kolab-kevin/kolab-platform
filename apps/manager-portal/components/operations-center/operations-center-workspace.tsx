'use client';

import { Button } from '@kolab/ui';

import { WorkspaceSection } from '@/components/common/workspace-layout';
import { EmptyWorkspaceState, WorkspacePage } from '@/components/common/workspace-page';
import { ActivityFeedPanel } from '@/components/operations-center/activity-feed-panel';
import { AiRecommendationsPanel } from '@/components/operations-center/ai-recommendations-panel';
import { AlertCenterPanel } from '@/components/operations-center/alert-center-panel';
import { DeadlinesPanel } from '@/components/operations-center/deadlines-panel';
import { OperationsOverviewPanel } from '@/components/operations-center/operations-overview-panel';
import { QuickActionsPanel } from '@/components/operations-center/quick-actions-panel';
import { TaskPanel } from '@/components/operations-center/task-panel';
import { useOperationsCenter } from '@/hooks/use-operations-center';

export function OperationsCenterWorkspace() {
  const { workspace, loading, error, source, refresh } = useOperationsCenter();

  const sourceLabel =
    source === 'mock'
      ? 'Mock data'
      : source === 'partial'
        ? 'Partial API data'
        : source === 'live'
          ? 'Live API data'
          : undefined;

  return (
    <WorkspacePage
      title="Operations Center"
      description={
        workspace
          ? `${workspace.overview.openTasks} open tasks${sourceLabel ? ` · ${sourceLabel}` : ''}`
          : 'Operational tasks and alerts'
      }
      loading={loading}
      loadingLabel="Loading operations center…"
      error={error}
      errorTitle="Unable to load operations center"
      onRetry={() => void refresh()}
      actions={
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      }
      emptyNotice={
        source === 'empty' ? (
          <EmptyWorkspaceState message="No operational items are available in this organization yet." />
        ) : null
      }
    >
      {workspace ? (
        <div className="space-y-6">
          <WorkspaceSection title="Quick actions">
            <QuickActionsPanel />
          </WorkspaceSection>

          <OperationsOverviewPanel overview={workspace.overview} />

          <TaskPanel tasks={workspace.tasks} />

          <AlertCenterPanel alerts={workspace.alerts} />

          <div className="grid gap-4 xl:grid-cols-12">
            <div className="space-y-4 xl:col-span-7">
              <DeadlinesPanel deadlines={workspace.deadlines} />
              <ActivityFeedPanel activityFeed={workspace.activityFeed} />
            </div>
            <div className="xl:col-span-5">
              <AiRecommendationsPanel aiRecommendations={workspace.aiRecommendations} />
            </div>
          </div>
        </div>
      ) : null}
    </WorkspacePage>
  );
}
