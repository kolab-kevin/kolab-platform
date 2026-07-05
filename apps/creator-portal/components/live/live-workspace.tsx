'use client';

import { Button } from '@kolab/ui';

import { InlineLoading } from '@/components/common/global-loading';
import { WorkspaceError } from '@/components/common/workspace-error';
import { LiveIntelligencePanel } from '@/components/live/live-intelligence-panel';
import { LiveOverviewHeader } from '@/components/live/live-overview-header';
import { LiveSummaryPanel } from '@/components/live/live-summary-panel';
import { LiveTimelinePanel } from '@/components/live/live-timeline-panel';
import { useLiveWorkspace } from '@/hooks/use-live-workspace';

function sourceLabel(source: NonNullable<ReturnType<typeof useLiveWorkspace>['source']>): string {
  switch (source) {
    case 'mock':
      return 'Mock data';
    case 'live':
      return 'Live API';
    case 'empty':
      return 'No live session yet';
    case 'partial':
      return 'Partial API data';
    default:
      return source;
  }
}

export function LiveWorkspace() {
  const { data, loading, error, source, refresh } = useLiveWorkspace();

  if (loading) {
    return <InlineLoading label="Loading live workspace…" />;
  }

  if (error) {
    return (
      <WorkspaceError
        title="Unable to load live workspace"
        message={error}
        onRetry={() => void refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live</h1>
          <p className="text-muted-foreground text-sm">
            {data.sessionId ? `Session ${data.sessionId}` : 'No active session'}
            {source ? ` · ${sourceLabel(source)}` : null}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {source === 'empty' ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No recent live session is available. Start or complete a live session to populate this
          workspace.
        </div>
      ) : null}

      {source === 'partial' ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Some live session data could not be loaded. Showing available results.
        </div>
      ) : null}

      <LiveOverviewHeader overview={data.overview} />

      <div className="grid gap-4 xl:grid-cols-3">
        <LiveTimelinePanel events={data.timeline} nextCursor={data.timelineNextCursor} />
        <LiveSummaryPanel summary={data.summary} />
        <LiveIntelligencePanel intelligence={data.intelligence} />
      </div>

      <p className="text-muted-foreground text-xs">
        Panels are resizable on desktop — drag panel edges to adjust layout (UI only).
      </p>
    </div>
  );
}
