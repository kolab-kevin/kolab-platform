import {
  type CampaignCreatorAssignment,
  type CampaignCreatorDeliverable,
  type CampaignDeliverable,
  ListCampaignCreatorAssignmentsResponseSchema,
  ListCampaignCreatorDeliverablesResponseSchema,
  ListCampaignDeliverablesResponseSchema,
} from '@kolab/types';

import { useMockStudioData } from '@/lib/env';

import { apiClient } from './api-client';
import {
  getMockAssignmentsForCampaign,
  getMockCreatorDeliverablesForAssignment,
  getMockTemplateDeliverablesForCampaign,
} from './campaign-operations-mock';

async function fetchOptional<T>(
  path: string,
  schema: { parse: (value: unknown) => T },
): Promise<T | null> {
  try {
    const data = await apiClient.get<unknown>(path);
    return schema.parse(data);
  } catch {
    return null;
  }
}

export async function fetchCampaignTemplateDeliverables(campaignId: string) {
  if (useMockStudioData()) {
    return { items: getMockTemplateDeliverablesForCampaign(campaignId), source: 'mock' as const };
  }

  const data = await fetchOptional(
    `/api/campaigns/${campaignId}/deliverables`,
    ListCampaignDeliverablesResponseSchema,
  );

  return {
    items: data?.items ?? [],
    source: data ? ('live' as const) : ('empty' as const),
  };
}

export async function fetchCampaignAssignments(campaignId: string) {
  if (useMockStudioData()) {
    return { items: getMockAssignmentsForCampaign(campaignId), source: 'mock' as const };
  }

  const data = await fetchOptional(
    `/api/campaigns/${campaignId}/assignments`,
    ListCampaignCreatorAssignmentsResponseSchema,
  );

  return {
    items: data?.items ?? [],
    source: data ? ('live' as const) : ('empty' as const),
  };
}

export async function fetchAssignmentCreatorDeliverables(campaignId: string, assignmentId: string) {
  if (useMockStudioData()) {
    return getMockCreatorDeliverablesForAssignment(assignmentId);
  }

  const data = await fetchOptional(
    `/api/campaigns/${campaignId}/assignments/${assignmentId}/deliverables`,
    ListCampaignCreatorDeliverablesResponseSchema,
  );

  return data?.items ?? [];
}

export async function fetchCampaignCreatorDeliverables(
  campaignId: string,
  assignments: CampaignCreatorAssignment[],
): Promise<CampaignCreatorDeliverable[]> {
  const bundles = await Promise.all(
    assignments.map((assignment) => fetchAssignmentCreatorDeliverables(campaignId, assignment.id)),
  );

  return bundles.flat();
}

export async function fetchAllCampaignTemplateDeliverables(
  campaignIds: string[],
): Promise<CampaignDeliverable[]> {
  const results = await Promise.all(
    campaignIds.map(async (campaignId) => {
      const result = await fetchCampaignTemplateDeliverables(campaignId);
      return result.items;
    }),
  );

  return results.flat();
}

export async function fetchAllCampaignAssignments(
  campaignIds: string[],
): Promise<CampaignCreatorAssignment[]> {
  const results = await Promise.all(
    campaignIds.map(async (campaignId) => {
      const result = await fetchCampaignAssignments(campaignId);
      return result.items;
    }),
  );

  return results.flat();
}
