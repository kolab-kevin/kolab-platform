import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { AudioMixerPanel } from '@/components/production/audio-mixer-panel';
import { OutputPanel } from '@/components/production/output-panel';
import { OverlayManagerPanel } from '@/components/production/overlay-manager-panel';
import { ProductionDockLayout } from '@/components/production/production-dock-layout';
import { ProductionHeaderPanel } from '@/components/production/production-header-panel';
import { SceneManagerPanel } from '@/components/production/scene-manager-panel';
import { SourceManagerPanel } from '@/components/production/source-manager-panel';
import { StreamHealthPanel } from '@/components/production/stream-health-panel';
import { createMockProductionWorkspace } from '@/services/production-mock';

const context = {
  creatorProfileId: 'creator_test_001',
  creatorDisplayName: 'Alex Rivera',
  organizationId: 'org_mock_001',
  organizationName: 'Kōlab Creator Agency',
};

describe('production workspace rendering', () => {
  const workspace = createMockProductionWorkspace(context);

  it('renders production header panel', () => {
    const html = renderToStaticMarkup(<ProductionHeaderPanel header={workspace.header} />);
    expect(html).toContain('Production');
    expect(html).toContain('Alex Rivera');
    expect(html).toContain('Disconnected (mock)');
  });

  it('renders scene manager panel with disabled actions', () => {
    const html = renderToStaticMarkup(
      <SceneManagerPanel scenes={workspace.scenes} activeSceneId={workspace.activeSceneId} />,
    );
    expect(html).toContain('Scene Manager');
    expect(html).toContain('Main Live');
    expect(html).toContain('disabled');
  });

  it('renders source manager panel', () => {
    const html = renderToStaticMarkup(<SourceManagerPanel sources={workspace.sources} />);
    expect(html).toContain('Source Manager');
    expect(html).toContain('Camera');
    expect(html).toContain('Browser Source');
  });

  it('renders audio mixer panel with read-only controls', () => {
    const html = renderToStaticMarkup(<AudioMixerPanel channels={workspace.audioChannels} />);
    expect(html).toContain('Audio Mixer');
    expect(html).toContain('Desktop');
    expect(html).toContain('readOnly');
  });

  it('renders overlay manager panel', () => {
    const html = renderToStaticMarkup(<OverlayManagerPanel overlays={workspace.overlays} />);
    expect(html).toContain('Overlay Manager');
    expect(html).toContain('Gift overlay');
    expect(html).toContain('Sponsor overlay');
  });

  it('renders stream health panel with mock metrics', () => {
    const html = renderToStaticMarkup(<StreamHealthPanel metrics={workspace.streamHealth} />);
    expect(html).toContain('Stream Health');
    expect(html).toContain('6,200');
    expect(html).toContain('Mock telemetry only');
  });

  it('renders output panel with disabled streaming controls', () => {
    const html = renderToStaticMarkup(<OutputPanel output={workspace.output} />);
    expect(html).toContain('Start Streaming');
    expect(html).toContain('Program preview placeholder');
    expect(html).toContain('disabled');
  });

  it('renders dock layout regions', () => {
    const html = renderToStaticMarkup(
      <ProductionDockLayout
        left={<div>Left dock</div>}
        center={<div>Center dock</div>}
        right={<div>Right dock</div>}
        bottom={<div>Bottom dock</div>}
      />,
    );
    expect(html).toContain('Left dock');
    expect(html).toContain('Center dock');
    expect(html).toContain('Right dock');
    expect(html).toContain('Bottom dock');
    expect(html).toContain('Resize left dock panel');
  });
});
