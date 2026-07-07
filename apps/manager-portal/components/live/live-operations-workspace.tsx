'use client';

import { WorkspaceDataPage } from '@/components/common/workspace-data-page';
import { WorkspaceSection } from '@/components/common/workspace-layout';
import { AgencyMonitorPanel } from '@/components/live/agency-monitor-panel';
import { CoachQueuePanel } from '@/components/live/coach-queue-panel';
import { LiveSessionsPanel } from '@/components/live/live-sessions-panel';
import { QuickActionsPanel } from '@/components/live/quick-actions-panel';
import { TimelinePanel } from '@/components/live/timeline-panel';
import { useLiveOperationsWorkspace } from '@/hooks/use-live-operations-workspace';

export function LiveOperationsWorkspace() {
  const {
    workspace,
    selectedSession,
    selectedSessionId,
    loading,
    detailLoading,
    error,
    source,
    sessionTimeline,
    sessionCoachQueue,
    selectSession,
    refresh,
  } = useLiveOperationsWorkspace();

  return (
    <WorkspaceDataPage
      title="Live Operations"
      fallbackDescription="Live session oversight and coaching signals"
      loadedDescription={
        workspace
          ? `${workspace.sessions.filter((session) => session.status === 'LIVE').length} live now`
          : undefined
      }
      loading={loading}
      loadingLabel="Loading live operations…"
      error={error}
      errorTitle="Unable to load live operations"
      source={source}
      emptyMessage="No live sessions are available in this organization yet."
      onRefresh={refresh}
    >
      {workspace ? (
        <div className="space-y-6">
          <WorkspaceSection title="Quick actions">
            <QuickActionsPanel />
          </WorkspaceSection>

          <div className="grid gap-4 xl:grid-cols-12">
            <div className="space-y-4 xl:col-span-7">
              <LiveSessionsPanel
                sessions={workspace.sessions}
                selectedSessionId={selectedSessionId}
                onSelectSession={selectSession}
              />
              <TimelinePanel
                events={sessionTimeline}
                loading={detailLoading}
                sessionTitle={selectedSession?.title ?? null}
              />
            </div>
            <div className="space-y-4 xl:col-span-5">
              <AgencyMonitorPanel monitoring={workspace.agencyMonitoring} />
              <CoachQueuePanel
                items={sessionCoachQueue.length > 0 ? sessionCoachQueue : workspace.coachQueue}
              />
            </div>
          </div>
        </div>
      ) : null}
    </WorkspaceDataPage>
  );
}
