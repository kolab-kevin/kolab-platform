import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RecruitingOverviewPanel } from '@/components/recruiting/recruiting-overview-panel';
import { createMockRecruitingWorkspace } from '@/services/recruiting-mock';

describe('RecruitingOverviewPanel', () => {
  it('renders recruiting overview metrics', () => {
    const workspace = createMockRecruitingWorkspace('org_mock_001');
    const html = renderToStaticMarkup(<RecruitingOverviewPanel overview={workspace.overview} />);

    expect(html).toContain('Recruiting overview');
    expect(html).toContain('Total prospects');
    expect(html).toContain('Conversion funnel');
  });
});
