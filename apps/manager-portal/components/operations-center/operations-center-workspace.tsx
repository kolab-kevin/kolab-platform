'use client';

import { WorkspaceDataPage } from '@/components/common/workspace-data-page';
import { WorkspaceSection } from '@/components/common/workspace-layout';
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

  return (
    <WorkspaceDataPage
      title="Operations Center"
      fallbackDescription="Operational tasks and alerts"
      loadedDescription={workspace ? `${workspace.overview.openTasks} open tasks` : undefined}
      loading={loading}
      loadingLabel="Loading operations center…"
      error={error}
      errorTitle="Unable to load operations center"
      source={source}
      emptyMessage="No operational items are available in this organization yet."
      onRefresh={refresh}
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
    </WorkspaceDataPage>
  );
}
