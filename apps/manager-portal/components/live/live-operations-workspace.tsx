'use client';

import { Button } from '@kolab/ui';

import { WorkspaceSection } from '@/components/common/workspace-layout';
import { EmptyWorkspaceState, WorkspacePage } from '@/components/common/workspace-page';
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
      title="Live Operations"
      description={
        workspace
          ? `${workspace.sessions.filter((session) => session.status === 'LIVE').length} live now${sourceLabel ? ` · ${sourceLabel}` : ''}`
          : 'Live session oversight and coaching signals'
      }
      loading={loading}
      loadingLabel="Loading live operations…"
      error={error}
      errorTitle="Unable to load live operations"
      onRetry={() => void refresh()}
      actions={
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      }
      emptyNotice={
        source === 'empty' ? (
          <EmptyWorkspaceState message="No live sessions are available in this organization yet." />
        ) : null
      }
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
    </WorkspacePage>
  );
}
