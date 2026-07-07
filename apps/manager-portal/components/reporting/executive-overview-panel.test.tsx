import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ExecutiveOverviewPanel } from '@/components/reporting/executive-overview-panel';
import { createMockReportingWorkspace } from '@/services/reporting-mock';

describe('ExecutiveOverviewPanel', () => {
  it('renders executive overview metrics', () => {
    const workspace = createMockReportingWorkspace('org_mock_001');
    const html = renderToStaticMarkup(
      <ExecutiveOverviewPanel overview={workspace.executiveOverview} />,
    );

    expect(html).toContain('Executive overview');
    expect(html).toContain('Total creators');
    expect(html).toContain('Health score');
  });
});
