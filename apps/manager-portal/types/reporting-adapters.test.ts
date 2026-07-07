import { describe, expect, it } from 'vitest';

import { buildExecutiveOverview, buildExportCenter } from '@/types/reporting-adapters';

describe('reporting adapters', () => {
  it('builds executive overview from portfolio inputs', () => {
    const overview = buildExecutiveOverview({
      creators: [
        {
          id: 'creator_1',
          organizationId: 'org_1',
          userId: 'user_1',
          displayName: 'Creator One',
          email: 'one@example.com',
          country: 'US',
          languages: ['en'],
          assignedRecruiterId: null,
          status: 'ACTIVE',
          platformCount: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      campaigns: [],
      leads: [],
      liveSessions: [],
    });

    expect(overview.totalCreators).toBe(1);
    expect(overview.activeCreators).toBe(1);
    expect(overview.organizationHealthScore).toBeGreaterThan(0);
  });

  it('provides export center options', () => {
    const exportCenter = buildExportCenter();
    expect(exportCenter.options.length).toBeGreaterThan(0);
  });
});
