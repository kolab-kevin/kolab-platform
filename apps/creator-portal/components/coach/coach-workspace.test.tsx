import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { AlertCard } from '@/components/coach/alert-card';
import { AlertsSection } from '@/components/coach/alerts-section';
import { CoachOverviewSection } from '@/components/coach/coach-overview-section';
import { CreatorIntelligenceSection } from '@/components/coach/creator-intelligence-section';
import { RecommendationCard } from '@/components/coach/recommendation-card';
import { RecommendationsSection } from '@/components/coach/recommendations-section';
import { SessionIntelligenceSection } from '@/components/coach/session-intelligence-section';
import { ConfidenceIndicator } from '@/components/common/confidence-indicator';
import { PriorityBadge } from '@/components/common/priority-badge';
import {
  createMockCreatorIntelligence,
  createMockSessionCoachAlerts,
  createMockSessionIntelligence,
  createMockSessionRecommendations,
  MOCK_COACH_SESSION_ID,
} from '@/services/coach-mock';
import {
  buildCoachWorkspaceData,
  groupAlertsByPriority,
  groupRecommendationsByPriority,
  sortByPriority,
} from '@/types/coach-adapters';

describe('coach adapters', () => {
  const workspace = buildCoachWorkspaceData({
    sessionId: MOCK_COACH_SESSION_ID,
    recommendations: createMockSessionRecommendations(),
    alerts: createMockSessionCoachAlerts(),
    sessionIntelligence: createMockSessionIntelligence('creator_test_001'),
    creatorIntelligence: createMockCreatorIntelligence('creator_test_001'),
    topCoachingPriorities: ['Maintain consistency'],
  });

  it('sorts recommendations by priority', () => {
    const sorted = sortByPriority(createMockSessionRecommendations().recommendations);
    expect(sorted[0]?.priority).toBe('HIGH');
    expect(sorted.at(-1)?.priority).toBe('LOW');
  });

  it('groups recommendations and alerts by priority', () => {
    expect(workspace.recommendations.HIGH.length).toBeGreaterThan(0);
    expect(workspace.alerts.MEDIUM.length).toBeGreaterThan(0);
    expect(groupRecommendationsByPriority([])).toEqual({
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    });
    expect(groupAlertsByPriority([])).toEqual({
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    });
  });

  it('builds overview from API data', () => {
    expect(workspace.overview.currentPriority).toBeTruthy();
    expect(workspace.overview.overallIntelligenceScore).toBeGreaterThan(0);
    expect(workspace.overview.coachingStatus).toContain('alert');
  });
});

describe('coach workspace rendering', () => {
  const workspace = buildCoachWorkspaceData({
    sessionId: MOCK_COACH_SESSION_ID,
    recommendations: createMockSessionRecommendations(),
    alerts: createMockSessionCoachAlerts(),
    sessionIntelligence: createMockSessionIntelligence('creator_test_001'),
    creatorIntelligence: createMockCreatorIntelligence('creator_test_001'),
  });

  it('renders coach overview section', () => {
    const html = renderToStaticMarkup(<CoachOverviewSection overview={workspace.overview} />);
    expect(html).toContain('Coach Overview');
    expect(html).toContain('Today');
  });

  it('renders recommendation card with priority and confidence', () => {
    const recommendation = workspace.recommendations.HIGH[0]!;
    const html = renderToStaticMarkup(<RecommendationCard recommendation={recommendation} />);
    expect(html).toContain('Thank your top gifter');
    expect(html).toContain('confidence');
  });

  it('renders recommendations section empty state', () => {
    const html = renderToStaticMarkup(
      <RecommendationsSection recommendations={{ HIGH: [], MEDIUM: [], LOW: [] }} />,
    );
    expect(html).toContain('No recommendations available.');
  });

  it('renders alert card with dismiss placeholder', () => {
    const alert = workspace.alerts.HIGH[0]!;
    const html = renderToStaticMarkup(<AlertCard alert={alert} />);
    expect(html).toContain('Recommended action');
    expect(html).toContain('Dismiss');
  });

  it('renders alerts grouped by priority', () => {
    const html = renderToStaticMarkup(<AlertsSection alerts={workspace.alerts} />);
    expect(html).toContain('High');
    expect(html).toContain('Medium');
  });

  it('renders session intelligence snapshot', () => {
    const html = renderToStaticMarkup(
      <SessionIntelligenceSection intelligence={workspace.sessionIntelligence} />,
    );
    expect(html).toContain('Intelligence Snapshot');
    expect(html).toContain('Session health');
    expect(html).toContain('Gifter quality');
  });

  it('renders creator intelligence section', () => {
    const html = renderToStaticMarkup(
      <CreatorIntelligenceSection intelligence={workspace.creatorIntelligence} />,
    );
    expect(html).toContain('Creator Intelligence');
    expect(html).toContain('Coaching priorities');
  });

  it('renders partial intelligence empty states', () => {
    const html = renderToStaticMarkup(
      <>
        <SessionIntelligenceSection intelligence={null} />
        <CreatorIntelligenceSection intelligence={null} />
      </>,
    );
    expect(html).toContain('No session intelligence snapshot available.');
    expect(html).toContain('No creator intelligence profile available.');
  });
});

describe('coach shared components', () => {
  it('renders priority badge', () => {
    const html = renderToStaticMarkup(<PriorityBadge priority="HIGH" />);
    expect(html).toContain('HIGH');
  });

  it('renders confidence indicator', () => {
    const html = renderToStaticMarkup(<ConfidenceIndicator score={0.91} />);
    expect(html).toContain('91% confidence');
  });
});
