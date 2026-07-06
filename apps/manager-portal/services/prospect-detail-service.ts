import { LeadDetailsSchema } from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { RecruitingOperationsApiError } from './recruiting-operations-errors';

export type ProspectDetailDataSource = 'mock' | 'live' | 'empty';

export async function fetchProspectDetail(prospectId: string): Promise<{
  data: ReturnType<typeof LeadDetailsSchema.parse> | null;
  source: ProspectDetailDataSource;
}> {
  if (useMockStudioData()) {
    return { data: null, source: 'mock' };
  }

  try {
    const data = await apiClient.get<unknown>(`/api/recruitment/leads/${prospectId}`);
    const parsed = LeadDetailsSchema.safeParse(data);
    if (!parsed.success) {
      return { data: null, source: 'empty' };
    }
    return { data: parsed.data, source: 'live' };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new RecruitingOperationsApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { data: null, source: 'empty' };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load prospect detail');
  }
}
