import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CampaignsCard } from '@/components/dashboard/campaigns-card';
import { GoalsCard } from '@/components/dashboard/goals-card';
import { QuickActionsCard } from '@/components/dashboard/quick-actions-card';
import { createEmptyDashboard } from '@/services/dashboard-empty';
import { createMockDashboard } from '@/services/dashboard-mock';

describe('dashboard cards', () => {
  it('renders goals card with partial empty data', () => {
    const dashboard = createEmptyDashboard('creator_partial');
    const html = renderToStaticMarkup(<GoalsCard goals={dashboard.todaysGoals} />);

    expect(html).toContain('No active goals for today');
    expect(html).toContain('0 active');
  });

  it('renders campaigns card with deliverables summary', () => {
    const dashboard = createMockDashboard('creator_partial');
    const html = renderToStaticMarkup(
      <CampaignsCard
        campaigns={dashboard.upcomingCampaigns}
        deliverables={dashboard.deliverables}
      />,
    );

    expect(html).toContain('upcoming deliverables');
    expect(html).toContain('Summer Beauty Launch');
  });

  it('renders quick actions from API response fields', () => {
    const dashboard = createMockDashboard('creator_partial');
    const html = renderToStaticMarkup(<QuickActionsCard actions={dashboard.quickActions} />);

    expect(html).toContain('GO LIVE');
    expect(html).toContain('COMPLETE DELIVERABLE');
    expect(html).toContain('scheduled live session');
  });

  it('renders quick actions empty state', () => {
    const dashboard = createEmptyDashboard('creator_partial');
    const html = renderToStaticMarkup(<QuickActionsCard actions={dashboard.quickActions} />);

    expect(html).toContain('No quick actions right now');
  });
});
