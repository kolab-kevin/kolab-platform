import { type LeadListQuery, LeadSummarySchema } from '@kolab/types';
import { z } from 'zod';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { RecruitingOperationsApiError } from './recruiting-operations-errors';

export type RecruitmentPipelineDataSource = 'mock' | 'live' | 'empty';

const ListRecruitmentLeadsResponseSchema = z.object({
  items: z.array(LeadSummarySchema),
  nextCursor: z.string().nullable(),
});

export type ListRecruitmentLeadsResponse = z.infer<typeof ListRecruitmentLeadsResponseSchema>;

function buildLeadsQuery(query: LeadListQuery = { limit: 100 }): string {
  const params = new URLSearchParams();
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.assignedRecruiterId) params.set('recruiterId', query.assignedRecruiterId);
  if (query.platform) params.set('platform', query.platform);
  if (query.search) params.set('search', query.search);
  if (query.followUpBefore) params.set('followUpBefore', query.followUpBefore);
  if (query.followUpAfter) params.set('followUpAfter', query.followUpAfter);
  if (query.minScore !== undefined) params.set('scoreMin', String(query.minScore));

  const serialized = params.toString();
  return serialized ? `/api/recruitment/leads?${serialized}` : '/api/recruitment/leads?limit=100';
}

export async function fetchRecruitmentPipeline(
  query: LeadListQuery = { limit: 100 },
): Promise<{ data: ListRecruitmentLeadsResponse; source: RecruitmentPipelineDataSource }> {
  if (useMockStudioData()) {
    return { data: { items: [], nextCursor: null }, source: 'mock' };
  }

  try {
    const data = await apiClient.get<unknown>(buildLeadsQuery(query));
    const parsed = ListRecruitmentLeadsResponseSchema.parse(data);
    return {
      data: parsed,
      source: parsed.items.length === 0 ? 'empty' : 'live',
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new RecruitingOperationsApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { data: { items: [], nextCursor: null }, source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load recruitment pipeline');
  }
}
