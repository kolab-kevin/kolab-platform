import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  AgencyOverviewCard,
  ComplianceBlockersCard,
  CreatorHealthCard,
} from '@/components/dashboard/dashboard-cards';
import { createMockManagerDashboard } from '@/services/dashboard-mock';
import type { ManagerDashboardResponse } from '@/types/manager-dashboard';

describe('manager dashboard cards', () => {
  const data: ManagerDashboardResponse = createMockManagerDashboard('org_mock_001');

  it('renders agency overview metrics', () => {
    const html = renderToStaticMarkup(<AgencyOverviewCard overview={data.agencyOverview} />);
    expect(html).toContain('Agency overview');
    expect(html).toContain('42');
  });

  it('renders creator health and compliance cards', () => {
    const healthHtml = renderToStaticMarkup(<CreatorHealthCard health={data.creatorHealth} />);
    const complianceHtml = renderToStaticMarkup(
      <ComplianceBlockersCard compliance={data.complianceBlockers} />,
    );

    expect(healthHtml).toContain('Creator health');
    expect(complianceHtml).toContain('Compliance blockers');
  });
});
