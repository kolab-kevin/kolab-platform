import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LiveIntelligencePanel } from '@/components/live/live-intelligence-panel';
import { LiveOverviewHeader } from '@/components/live/live-overview-header';
import { LiveSummaryPanel } from '@/components/live/live-summary-panel';
import { LiveTimelinePanel } from '@/components/live/live-timeline-panel';
import { createMockSessionIntelligence } from '@/services/coach-mock';
import {
  createMockLiveSession,
  createMockSessionSummary,
  createMockSessionTimeline,
  MOCK_LIVE_SESSION_ID,
} from '@/services/live-mock';
import {
  buildLiveWorkspaceData,
  getTimelineEventCategory,
  toTimelineEventDisplayModel,
} from '@/types/live-adapters';

describe('live adapters', () => {
  const workspace = buildLiveWorkspaceData({
    sessionId: MOCK_LIVE_SESSION_ID,
    session: createMockLiveSession('creator_test_001'),
    timeline: createMockSessionTimeline('creator_test_001'),
    summary: createMockSessionSummary(),
    intelligence: createMockSessionIntelligence('creator_test_001', MOCK_LIVE_SESSION_ID),
    dashboardLiveActivity: {
      latestLiveSession: {
        id: MOCK_LIVE_SESSION_ID,
        title: 'Evening Q&A',
        status: 'ENDED',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: 3600,
        totalGiftValue: '1250.00',
      },
      nextScheduledLive: null,
      lastPerformanceScore: 78,
      sessionDuration: 3600,
      latestRevenue: '1250.00',
    },
  });

  it('maps timeline event categories', () => {
    const event = createMockSessionTimeline('creator_test_001').items[0]!;
    expect(getTimelineEventCategory(event.eventType)).toBe('Session started');
    expect(toTimelineEventDisplayModel(event).label).toContain('Session started');
  });

  it('builds overview from session, summary, and intelligence', () => {
    expect(workspace.overview.status).toBe('ENDED');
    expect(workspace.overview.sessionHealthScore).toBeGreaterThan(0);
    expect(workspace.timeline.length).toBeGreaterThan(0);
  });
});

describe('live workspace rendering', () => {
  const workspace = buildLiveWorkspaceData({
    sessionId: MOCK_LIVE_SESSION_ID,
    session: createMockLiveSession('creator_test_001'),
    timeline: createMockSessionTimeline('creator_test_001'),
    summary: createMockSessionSummary(),
    intelligence: createMockSessionIntelligence('creator_test_001', MOCK_LIVE_SESSION_ID),
    dashboardLiveActivity: {
      latestLiveSession: null,
      nextScheduledLive: null,
      lastPerformanceScore: null,
      sessionDuration: null,
      latestRevenue: null,
    },
  });

  it('renders live overview header', () => {
    const html = renderToStaticMarkup(<LiveOverviewHeader overview={workspace.overview} />);
    expect(html).toContain('Evening Q&amp;A');
    expect(html).toContain('Peak viewers');
  });

  it('renders timeline panel with events', () => {
    const html = renderToStaticMarkup(
      <LiveTimelinePanel events={workspace.timeline} nextCursor={null} />,
    );
    expect(html).toContain('Live Timeline');
    expect(html).toContain('Session started');
  });

  it('renders timeline empty state', () => {
    const html = renderToStaticMarkup(<LiveTimelinePanel events={[]} nextCursor={null} />);
    expect(html).toContain('No timeline events available.');
  });

  it('renders summary panel', () => {
    const html = renderToStaticMarkup(<LiveSummaryPanel summary={workspace.summary} />);
    expect(html).toContain('Top moments');
    expect(html).toContain('Coaching notes');
  });

  it('renders summary empty state', () => {
    const html = renderToStaticMarkup(<LiveSummaryPanel summary={null} />);
    expect(html).toContain('No session summary available.');
  });

  it('renders intelligence panel', () => {
    const html = renderToStaticMarkup(
      <LiveIntelligencePanel intelligence={workspace.intelligence} />,
    );
    expect(html).toContain('Live Intelligence');
    expect(html).toContain('Gifter quality');
  });

  it('renders intelligence empty state', () => {
    const html = renderToStaticMarkup(<LiveIntelligencePanel intelligence={null} />);
    expect(html).toContain('No live intelligence snapshot available.');
  });
});

describe('partial live workspace data', () => {
  it('handles missing summary and intelligence', () => {
    const workspace = buildLiveWorkspaceData({
      sessionId: MOCK_LIVE_SESSION_ID,
      session: createMockLiveSession('creator_test_001'),
      timeline: createMockSessionTimeline('creator_test_001'),
      summary: null,
      intelligence: null,
      dashboardLiveActivity: {
        latestLiveSession: null,
        nextScheduledLive: null,
        lastPerformanceScore: null,
        sessionDuration: null,
        latestRevenue: null,
      },
    });

    expect(workspace.summary).toBeNull();
    expect(workspace.intelligence).toBeNull();
    expect(workspace.timeline.length).toBeGreaterThan(0);
  });
});
