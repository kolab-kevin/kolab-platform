'use client';

import { EmptyWorkspaceState } from '@/components/common/empty-workspace-state';
import { WorkspacePage } from '@/components/common/workspace-page';
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
  const isEmpty = data.scenes.length === 0 && data.sources.length === 0;

  return (
    <WorkspacePage
      title="Production Workspace"
      description="Live production UI foundation"
      source={source === 'mock' ? 'mock' : source}
      loading={loading}
      loadingLabel="Loading production workspace…"
      error={error}
      errorTitle="Unable to load production workspace"
      onRetry={() => void refresh()}
      emptyNotice={
        isEmpty ? (
          <EmptyWorkspaceState message="Production workspace is empty. Mock provider data will populate this layout in a future integration step." />
        ) : null
      }
    >
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
    </WorkspacePage>
  );
}
