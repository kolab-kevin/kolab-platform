'use client';

import { Button } from '@kolab/ui';

import { InlineLoading } from '@/components/common/global-loading';
import { WorkspaceError } from '@/components/common/workspace-error';
import { AudioMixerPanel } from '@/components/production/audio-mixer-panel';
import { OutputPanel } from '@/components/production/output-panel';
import { OverlayManagerPanel } from '@/components/production/overlay-manager-panel';
import { ProductionDockLayout } from '@/components/production/production-dock-layout';
import { ProductionHeaderPanel } from '@/components/production/production-header-panel';
import { SceneManagerPanel } from '@/components/production/scene-manager-panel';
import { SourceManagerPanel } from '@/components/production/source-manager-panel';
import { StreamHealthPanel } from '@/components/production/stream-health-panel';
import { useProductionWorkspace } from '@/hooks/use-production-workspace';

export function ProductionWorkspace() {
  const { data, loading, error, source, refresh } = useProductionWorkspace();

  if (loading) {
    return <InlineLoading label="Loading production workspace…" />;
  }

  if (error) {
    return (
      <WorkspaceError
        title="Unable to load production workspace"
        message={error}
        onRetry={() => void refresh()}
      />
    );
  }

  const isEmpty = data.scenes.length === 0 && data.sources.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Production Workspace</h1>
          <p className="text-muted-foreground text-sm">
            Live production UI foundation
            {source ? ` · ${source === 'mock' ? 'Mock provider' : source}` : null}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {isEmpty ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Production workspace is empty. Mock provider data will populate this layout in a future
          integration step.
        </div>
      ) : null}

      <ProductionHeaderPanel header={data.header} />

      <ProductionDockLayout
        left={<SceneManagerPanel scenes={data.scenes} activeSceneId={data.activeSceneId} />}
        center={<OutputPanel output={data.output} />}
        right={<SourceManagerPanel sources={data.sources} />}
        bottom={
          <>
            <AudioMixerPanel channels={data.audioChannels} />
            <OverlayManagerPanel overlays={data.overlays} />
            <StreamHealthPanel metrics={data.streamHealth} />
          </>
        }
      />

      <p className="text-muted-foreground text-xs">
        Dock panels are resizable on desktop. OBS, RTMP, WebRTC, and desktop capture integration are
        intentionally deferred.
      </p>
    </div>
  );
}
