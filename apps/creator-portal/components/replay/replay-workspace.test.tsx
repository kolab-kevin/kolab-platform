import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { GifterIntelligencePanel } from '@/components/replay/gifter-intelligence-panel';
import { HighlightsPanel } from '@/components/replay/highlights-panel';
import { ReplayTimelinePanel } from '@/components/replay/replay-timeline-panel';
import { SessionSignalsPanel } from '@/components/replay/session-signals-panel';
import { TriggerAnalysisPanel } from '@/components/replay/trigger-analysis-panel';
import { MOCK_LIVE_SESSION_ID } from '@/services/live-mock';
import {
  createMockReplayIntelligence,
  createMockSessionGifters,
  createMockSessionHighlights,
  createMockSessionReplay,
  createMockSessionTriggerAnalysis,
} from '@/services/replay-mock';
import { buildReplayWorkspaceData, groupHighlights } from '@/types/replay-adapters';

describe('replay adapters', () => {
  const workspace = buildReplayWorkspaceData({
    sessionId: MOCK_LIVE_SESSION_ID,
    replay: createMockSessionReplay('creator_test_001'),
    highlights: createMockSessionHighlights(),
    triggerAnalysis: createMockSessionTriggerAnalysis(),
    gifters: createMockSessionGifters('creator_test_001'),
    intelligence: createMockReplayIntelligence('creator_test_001'),
  });

  it('groups highlights by type', () => {
    expect(workspace.highlights.giftSpikes.length).toBeGreaterThan(0);
    expect(workspace.highlights.performanceMoments.length).toBeGreaterThan(0);
    expect(groupHighlights(null).giftSpikes).toHaveLength(0);
  });

  it('maps gifters with whale and vip flags', () => {
    expect(workspace.gifters.some((gifter) => gifter.isWhale)).toBe(true);
    expect(workspace.gifters.some((gifter) => gifter.isVip)).toBe(true);
  });
});

describe('replay workspace rendering', () => {
  const workspace = buildReplayWorkspaceData({
    sessionId: MOCK_LIVE_SESSION_ID,
    replay: createMockSessionReplay('creator_test_001'),
    highlights: createMockSessionHighlights(),
    triggerAnalysis: createMockSessionTriggerAnalysis(),
    gifters: createMockSessionGifters('creator_test_001'),
    intelligence: createMockReplayIntelligence('creator_test_001'),
  });

  it('renders replay timeline panel', () => {
    const html = renderToStaticMarkup(<ReplayTimelinePanel replay={workspace.replay} />);
    expect(html).toContain('Replay Timeline');
    expect(html).toContain('no video playback');
  });

  it('renders replay timeline empty state', () => {
    const html = renderToStaticMarkup(<ReplayTimelinePanel replay={null} />);
    expect(html).toContain('No replay segments available.');
  });

  it('renders highlights panel grouped sections', () => {
    const html = renderToStaticMarkup(<HighlightsPanel highlights={workspace.highlights} />);
    expect(html).toContain('Gift spikes');
    expect(html).toContain('Performance moments');
  });

  it('renders trigger analysis panel with disclaimer', () => {
    const html = renderToStaticMarkup(
      <TriggerAnalysisPanel analysis={workspace.triggerAnalysis} />,
    );
    expect(html).toContain('Trigger Analysis');
    expect(html).toContain('Correlation does not imply causation');
  });

  it('renders gifter intelligence panel', () => {
    const html = renderToStaticMarkup(
      <GifterIntelligencePanel gifters={workspace.gifters} nextCursor={null} />,
    );
    expect(html).toContain('Gifter Intelligence');
    expect(html).toContain('Whales');
    expect(html).toContain('LunaStar');
  });

  it('renders session signals panel', () => {
    const html = renderToStaticMarkup(
      <SessionSignalsPanel intelligence={workspace.intelligence} />,
    );
    expect(html).toContain('Session Signals');
    expect(html).toContain('Top signals');
    expect(html).toContain('Recommended actions');
  });

  it('renders partial empty states', () => {
    const html = renderToStaticMarkup(
      <>
        <TriggerAnalysisPanel analysis={null} />
        <GifterIntelligencePanel gifters={[]} nextCursor={null} />
        <SessionSignalsPanel intelligence={null} />
      </>,
    );
    expect(html).toContain('No trigger analysis available.');
    expect(html).toContain('No gifter intelligence available.');
    expect(html).toContain('No session signals available.');
  });
});
