import { buildRecruiterNameMap, mapProspectDetail } from '@/types/recruiting-adapters';
import type { ManagerProspectDetail, RecruitingDataSource } from '@/types/recruiting-workspace';

import { fetchProspectDetail } from './prospect-detail-service';
import { fetchRecruiterProfiles } from './recruiter-performance-service';

export async function loadRecruitingProspectDetail(prospectId: string): Promise<{
  detail: ManagerProspectDetail | null;
  source: RecruitingDataSource;
}> {
  const [prospectResult, recruitersResult] = await Promise.all([
    fetchProspectDetail(prospectId),
    fetchRecruiterProfiles(),
  ]);

  const lead = prospectResult.data;
  if (!lead) {
    return { detail: null, source: 'empty' };
  }

  const recruiterNames = buildRecruiterNameMap(recruitersResult.data.items);

  return {
    detail: mapProspectDetail(lead, recruiterNames),
    source: prospectResult.source === 'empty' ? 'empty' : 'live',
  };
}
