import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CampaignOverviewPanel } from '@/components/campaigns/campaign-overview-panel';
import { createMockCampaignOperationsWorkspace } from '@/services/campaign-operations-mock';

describe('CampaignOverviewPanel', () => {
  it('renders campaign overview metrics', () => {
    const workspace = createMockCampaignOperationsWorkspace('org_mock_001');
    const html = renderToStaticMarkup(<CampaignOverviewPanel overview={workspace.overview} />);

    expect(html).toContain('Campaign overview');
    expect(html).toContain('Active campaigns');
    expect(html).toContain('Creator participation');
  });
});
