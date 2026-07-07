import { getDefaultOrganizationId, useMockStudioData } from '@/lib/env';
import type {
  ManagerOperationsCenterWorkspace,
  OperationsCenterDataSource,
} from '@/types/operations-center';
import {
  buildOperationsOverview,
  countOverdueFollowUps,
  groupAiRecommendations,
  groupTasksByBucket,
  mapRecommendationToAiItem,
} from '@/types/operations-center-adapters';

import { buildAlertCenter } from './alert-center-service';
import { isApiClientError } from './api-client';
import { buildDeadlinesSummary } from './deadline-service';
import { OperationsCenterApiError } from './operations-center-errors';
import { loadOperationsCenterSources } from './operations-loader';
import { createMockOperationsCenterWorkspace } from './operations-mock';
import { buildManagerTasks } from './task-service';

export type OperationsCenterFetchResult = {
  data: ManagerOperationsCenterWorkspace;
  source: OperationsCenterDataSource;
};

export async function fetchOperationsCenterWorkspace(
  organizationId: string = getDefaultOrganizationId(),
): Promise<OperationsCenterFetchResult> {
  if (useMockStudioData()) {
    return {
      data: createMockOperationsCenterWorkspace(organizationId),
      source: 'mock',
    };
  }

  try {
    const sources = await loadOperationsCenterSources();
    const tasks = groupTasksByBucket(
      buildManagerTasks({
        leads: sources.leads,
        campaigns: sources.campaigns,
      }),
    );
    const alerts = buildAlertCenter({
      liveSessions: sources.liveSessions,
      coachAlerts: sources.coachAlerts,
      campaigns: sources.campaigns,
      leads: sources.leads,
      expiringDocuments: sources.expiringDocuments,
      expiringContracts: sources.expiringContracts,
      creatorNames: sources.creatorNames,
    });
    const deadlines = buildDeadlinesSummary({
      campaigns: sources.campaigns,
      deliverables: sources.deliverables,
      expiringDocuments: sources.expiringDocuments,
      expiringContracts: sources.expiringContracts,
    });

    const aiFromRecommendations = sources.coachAlerts.flatMap((bundle) =>
      (bundle.recommendations?.recommendations ?? []).map((recommendation) =>
        mapRecommendationToAiItem(bundle.session.title, recommendation),
      ),
    );

    const aiRecommendations = groupAiRecommendations(aiFromRecommendations);

    const workspace: ManagerOperationsCenterWorkspace = {
      organizationId,
      generatedAt: new Date().toISOString(),
      overview: buildOperationsOverview({
        tasks,
        alerts,
        deadlines,
        overdueFollowUps: countOverdueFollowUps(sources.leads),
      }),
      tasks,
      alerts,
      deadlines,
      activityFeed: sources.activityFeed.items,
      aiRecommendations:
        aiRecommendations.high.length +
          aiRecommendations.medium.length +
          aiRecommendations.low.length >
        0
          ? aiRecommendations
          : groupAiRecommendations([]),
    };

    const source: OperationsCenterDataSource = sources.partial ? 'partial' : 'live';

    return { data: workspace, source };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new OperationsCenterApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return {
          data: createMockOperationsCenterWorkspace(organizationId),
          source: 'empty',
        };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load operations center');
  }
}
