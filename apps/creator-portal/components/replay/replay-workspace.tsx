'use client';

import { Button } from '@kolab/ui';

import { InlineLoading } from '@/components/common/global-loading';
import { WorkspaceError } from '@/components/common/workspace-error';
import { GifterIntelligencePanel } from '@/components/replay/gifter-intelligence-panel';
import { HighlightsPanel } from '@/components/replay/highlights-panel';
import { ReplayTimelinePanel } from '@/components/replay/replay-timeline-panel';
import { SessionSignalsPanel } from '@/components/replay/session-signals-panel';
import { TriggerAnalysisPanel } from '@/components/replay/trigger-analysis-panel';
import { useReplayWorkspace } from '@/hooks/use-replay-workspace';

function sourceLabel(source: NonNullable<ReturnType<typeof useReplayWorkspace>['source']>): string {
  switch (source) {
    case 'mock':
      return 'Mock data';
    case 'live':
      return 'Live API';
    case 'empty':
      return 'No replay data yet';
    case 'partial':
      return 'Partial API data';
    default:
      return source;
  }
}

export function ReplayWorkspace() {
  const { data, loading, error, source, refresh } = useReplayWorkspace();

  if (loading) {
    return <InlineLoading label="Loading replay workspace…" />;
  }

  if (error) {
    return (
      <WorkspaceError
        title="Unable to load replay workspace"
        message={error}
        onRetry={() => void refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Replay &amp; Gifter Intelligence</h1>
          <p className="text-muted-foreground text-sm">
            {data.sessionId ? `Session ${data.sessionId}` : 'No recent session'}
            {source ? ` · ${sourceLabel(source)}` : null}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {source === 'empty' ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No replay or gifter intelligence is available yet. Complete a live session to populate
          this workspace.
        </div>
      ) : null}

      {source === 'partial' ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Some replay or gifter data could not be loaded. Showing available results.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <ReplayTimelinePanel replay={data.replay} />
        <HighlightsPanel highlights={data.highlights} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <TriggerAnalysisPanel analysis={data.triggerAnalysis} />
        <GifterIntelligencePanel gifters={data.gifters} nextCursor={data.gifterNextCursor} />
        <SessionSignalsPanel intelligence={data.intelligence} />
      </div>
    </div>
  );
}
