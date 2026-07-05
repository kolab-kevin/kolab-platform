'use client';

import { Button } from '@kolab/ui';
import Link from 'next/link';

import { EmptyWorkspaceState } from '@/components/common/empty-workspace-state';
import {
  PartialWorkspaceNotice,
  RefreshWorkspaceButton,
  WorkspacePage,
} from '@/components/common/workspace-page';
import { LiveIntelligencePanel } from '@/components/live/live-intelligence-panel';
import { LiveOverviewHeader } from '@/components/live/live-overview-header';
import { LiveSummaryPanel } from '@/components/live/live-summary-panel';
import { LiveTimelinePanel } from '@/components/live/live-timeline-panel';
import { useLiveWorkspace } from '@/hooks/use-live-workspace';
import { WORKSPACE_FOCUS_RING_CLASS, WORKSPACE_GRID_3_CLASS } from '@/lib/studio-ui';

export function LiveWorkspace() {
  const { data, loading, error, source, refresh } = useLiveWorkspace();

  return (
    <WorkspacePage
      title="Live"
      description={data.sessionId ? `Session ${data.sessionId}` : 'No active session'}
      source={source}
      loading={loading}
      loadingLabel="Loading live workspace…"
      error={error}
      errorTitle="Unable to load live workspace"
      onRetry={() => void refresh()}
      actions={
        <>
          <RefreshWorkspaceButton onClick={() => void refresh()} />
          <Button variant="outline" size="sm" className={WORKSPACE_FOCUS_RING_CLASS} asChild>
            <Link href="/studio/live/production">Open Production</Link>
          </Button>
        </>
      }
      emptyNotice={
        source === 'empty' ? (
          <EmptyWorkspaceState message="No recent live session is available. Start or complete a live session to populate this workspace." />
        ) : null
      }
      partialNotice={
        source === 'partial' ? (
          <PartialWorkspaceNotice message="Some live session data could not be loaded. Showing available results." />
        ) : null
      }
    >
      <LiveOverviewHeader overview={data.overview} />

      <div className={WORKSPACE_GRID_3_CLASS}>
        <LiveTimelinePanel events={data.timeline} nextCursor={data.timelineNextCursor} />
        <LiveSummaryPanel summary={data.summary} />
        <LiveIntelligencePanel intelligence={data.intelligence} />
      </div>

      <p className="text-muted-foreground text-xs">
        Panels use a consistent workspace layout on desktop and stack responsively on smaller
        screens.
      </p>
    </WorkspacePage>
  );
}
