import { getDefaultOrganizationId, useMockStudioData } from '@/lib/env';
import {
  buildProspectPipeline,
  buildRecruiterNameMap,
  buildRecruiterPerformance,
  buildRecruitingOverview,
  mapProspectDetail,
  mapProspectListItem,
} from '@/types/recruiting-adapters';
import type {
  ManagerRecruitingWorkspace,
  RecruitingDataSource,
} from '@/types/recruiting-workspace';

import { isApiClientError } from './api-client';
import { buildFollowUpQueue } from './followup-service';
import { fetchProspectDetail } from './prospect-detail-service';
import { fetchRecruiterProfiles } from './recruiter-performance-service';
import { loadRecruitingProspectDetail } from './recruiting-loader';
import {
  createMockRecruitingWorkspace,
  getMockProspectDetail,
  MOCK_PROSPECT_PRIMARY,
} from './recruiting-mock';
import { RecruitingOperationsApiError } from './recruiting-operations-errors';
import { fetchRecruitmentPipeline } from './recruitment-pipeline-service';

export type RecruitingOperationsFetchResult = {
  data: ManagerRecruitingWorkspace;
  source: RecruitingDataSource;
};

export async function fetchRecruitingWorkspace(
  organizationId: string = getDefaultOrganizationId(),
): Promise<RecruitingOperationsFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockRecruitingWorkspace(organizationId),
      source: 'mock',
    };
  }

  try {
    const [pipelineResult, recruitersResult] = await Promise.all([
      fetchRecruitmentPipeline({ limit: 100 }),
      fetchRecruiterProfiles(),
    ]);

    const recruiterNames = buildRecruiterNameMap(recruitersResult.data.items);
    const prospects = pipelineResult.data.items
      .filter((lead) => !['ACTIVE_CREATOR', 'INACTIVE'].includes(lead.status))
      .map((lead) => mapProspectListItem(lead, recruiterNames));

    const selectedProspectId =
      prospects.find((prospect) => prospect.status === 'INTERESTED')?.id ??
      prospects[0]?.id ??
      null;

    let detail = null;
    let detailSource: RecruitingDataSource = pipelineResult.source;

    if (selectedProspectId) {
      const loaded = await loadRecruitingProspectDetail(selectedProspectId);
      detail = loaded.detail;
      detailSource = loaded.source;
    } else if (pipelineResult.data.items[0]) {
      const leadResult = await fetchProspectDetail(pipelineResult.data.items[0].id);
      if (leadResult.data) {
        detail = mapProspectDetail(leadResult.data, recruiterNames);
      }
    }

    const workspace: ManagerRecruitingWorkspace = {
      organizationId,
      generatedAt: new Date().toISOString(),
      overview: buildRecruitingOverview(prospects),
      prospects,
      pipeline: buildProspectPipeline(prospects),
      detail,
      followUpQueue: buildFollowUpQueue(prospects),
      recruiterPerformance: buildRecruiterPerformance(prospects, recruitersResult.data.items),
      selectedProspectId,
    };

    const source: RecruitingDataSource =
      prospects.length === 0
        ? 'empty'
        : detailSource === 'partial' || pipelineResult.source === 'empty'
          ? 'partial'
          : 'live';

    return { data: workspace, source };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new RecruitingOperationsApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return {
          data: createMockRecruitingWorkspace(organizationId),
          source: 'empty',
        };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load recruiting workspace');
  }
}

export async function fetchRecruitingProspectDetail(prospectId: string) {
  if (useMockStudioData()) {
    return {
      data: getMockProspectDetail(prospectId),
      source: 'mock' as const,
    };
  }

  const loaded = await loadRecruitingProspectDetail(prospectId);
  return {
    data: loaded.detail,
    source: loaded.source,
  };
}

export { MOCK_PROSPECT_PRIMARY };
