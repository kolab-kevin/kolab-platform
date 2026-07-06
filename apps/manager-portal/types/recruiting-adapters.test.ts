import { describe, expect, it } from 'vitest';

import {
  buildProspectPipeline,
  buildRecruitingOverview,
  mapPipelineColumn,
  mapProspectListItem,
} from '@/types/recruiting-adapters';

describe('recruiting adapters', () => {
  const lead = {
    id: 'lead_1',
    organizationId: 'org_1',
    name: 'Test Lead',
    nickname: 'testlead',
    email: 'test@example.com',
    source: 'MANUAL' as const,
    status: 'APPLICATION' as const,
    score: 80,
    assignedRecruiterId: 'user_recruiter_001',
    assignedAt: new Date().toISOString(),
    nextFollowUpAt: new Date().toISOString(),
    commissionPlan: 'STANDARD' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('maps backend statuses to pipeline columns', () => {
    expect(mapPipelineColumn('NEW')).toBe('new');
    expect(mapPipelineColumn('APPLICATION')).toBe('interview');
    expect(mapPipelineColumn('CONTRACT_SENT')).toBe('pending');
    expect(mapPipelineColumn('REJECTED')).toBe('declined');
    expect(mapPipelineColumn('ACTIVE_CREATOR')).toBeNull();
  });

  it('builds overview and pipeline from list items', () => {
    const recruiterNames = new Map([['user_recruiter_001', 'Jordan Lee']]);
    const listItem = mapProspectListItem(lead, recruiterNames);
    const overview = buildRecruitingOverview([listItem]);
    const pipeline = buildProspectPipeline([listItem]);

    expect(listItem.pipelineColumn).toBe('interview');
    expect(overview.totalProspects).toBe(1);
    expect(pipeline.interview.length).toBe(1);
  });
});
