'use client';

import { EmptyWorkspaceState } from '@/components/common/empty-workspace-state';
import { PartialWorkspaceNotice, WorkspacePage } from '@/components/common/workspace-page';
import { GifterIntelligencePanel } from '@/components/replay/gifter-intelligence-panel';
import { HighlightsPanel } from '@/components/replay/highlights-panel';
import { ReplayTimelinePanel } from '@/components/replay/replay-timeline-panel';
import { SessionSignalsPanel } from '@/components/replay/session-signals-panel';
import { TriggerAnalysisPanel } from '@/components/replay/trigger-analysis-panel';
import { useReplayWorkspace } from '@/hooks/use-replay-workspace';
import { WORKSPACE_GRID_3_CLASS, WORKSPACE_GRID_CLASS } from '@/lib/studio-ui';

export function ReplayWorkspace() {
  const { data, loading, error, source, refresh } = useReplayWorkspace();

  return (
    <WorkspacePage
      title="Replay & Gifter Intelligence"
      description={data.sessionId ? `Session ${data.sessionId}` : 'No recent session'}
      source={source}
      loading={loading}
      loadingLabel="Loading replay workspace…"
      error={error}
      errorTitle="Unable to load replay workspace"
      onRetry={() => void refresh()}
      emptyNotice={
        source === 'empty' ? (
          <EmptyWorkspaceState message="No replay or gifter intelligence is available yet. Complete a live session to populate this workspace." />
        ) : null
      }
      partialNotice={
        source === 'partial' ? (
          <PartialWorkspaceNotice message="Some replay or gifter data could not be loaded. Showing available results." />
        ) : null
      }
    >
      <div className={WORKSPACE_GRID_CLASS}>
        <ReplayTimelinePanel replay={data.replay} />
        <HighlightsPanel highlights={data.highlights} />
      </div>

      <div className={WORKSPACE_GRID_3_CLASS}>
        <TriggerAnalysisPanel analysis={data.triggerAnalysis} />
        <GifterIntelligencePanel gifters={data.gifters} nextCursor={data.gifterNextCursor} />
        <SessionSignalsPanel intelligence={data.intelligence} />
      </div>
    </WorkspacePage>
  );
}
