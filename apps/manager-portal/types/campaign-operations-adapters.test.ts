import { describe, expect, it } from 'vitest';

import {
  buildCampaignBoard,
  buildCampaignOverview,
  mapCampaignBoardColumn,
  mapCampaignListItem,
} from '@/types/campaign-operations-adapters';

describe('campaign operations adapters', () => {
  const campaign = {
    id: 'camp_1',
    organizationId: 'org_1',
    title: 'Test Campaign',
    description: 'Desc',
    brandName: 'Brand',
    campaignType: 'BRAND_DEAL' as const,
    status: 'ACTIVE' as const,
    budgetAmount: '1000.00',
    budgetCurrency: 'USD',
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    endsAt: null,
    applicationDeadline: null,
    brief: {},
    requirements: {},
    metadata: {},
    createdByUserId: 'user_1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('maps active campaigns with pending applications to recruiting', () => {
    expect(mapCampaignBoardColumn(campaign, 2)).toBe('recruiting');
    expect(mapCampaignBoardColumn(campaign, 0)).toBe('active');
  });

  it('builds overview and board from list items', () => {
    const listItem = mapCampaignListItem(campaign, 3, 1);
    const overview = buildCampaignOverview([listItem], 3);
    const board = buildCampaignBoard([listItem]);

    expect(overview.activeCount).toBe(1);
    expect(board.recruiting.length + board.active.length).toBeGreaterThan(0);
  });
});
