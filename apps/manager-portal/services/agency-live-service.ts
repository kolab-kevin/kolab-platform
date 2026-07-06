import {
  ListLiveSessionsResponseSchema,
  type LiveSessionListQuery,
  type SessionCoachAlertsResponse,
  SessionCoachAlertsResponseSchema,
  type SessionIntelligenceSnapshot,
  SessionIntelligenceSnapshotSchema,
  type SessionRecommendationsResponse,
  SessionRecommendationsResponseSchema,
} from '@kolab/types';

import { getDefaultOrganizationId, useMockStudioData } from '@/lib/env';

import { apiClient, isApiClientError } from './api-client';
import { LiveOperationsApiError } from './live-operations-errors';

export type LiveSessionDataSource = 'mock' | 'live' | 'empty';

function buildSessionsQuery(query: LiveSessionListQuery): string {
  const params = new URLSearchParams();
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.platform) params.set('platform', query.platform);
  if (query.creatorProfileId) params.set('creatorProfileId', query.creatorProfileId);
  if (query.campaignId) params.set('campaignId', query.campaignId);

  const serialized = params.toString();
  return serialized ? `/api/live/sessions?${serialized}` : '/api/live/sessions';
}

export async function fetchLiveSessions(query: LiveSessionListQuery = { limit: 50 }) {
  if (useMockStudioData()) {
    return { items: [], nextCursor: null, source: 'mock' as const };
  }

  try {
    const data = await apiClient.get<unknown>(buildSessionsQuery(query));
    const parsed = ListLiveSessionsResponseSchema.parse(data);
    return {
      items: parsed.items,
      nextCursor: parsed.nextCursor,
      source: parsed.items.length === 0 ? ('empty' as const) : ('live' as const),
    };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401 || error.status === 403) {
        throw new LiveOperationsApiError(error.message, error.status);
      }
      if (error.status === 404) {
        return { items: [], nextCursor: null, source: 'empty' as const };
      }
    }

    throw error instanceof Error ? error : new Error('Failed to load live sessions');
  }
}

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

export async function fetchSessionIntelligence(sessionId: string) {
  if (useMockStudioData()) {
    return { data: null, source: 'mock' as const };
  }

  const data = await fetchOptional<SessionIntelligenceSnapshot>(
    `/api/live/sessions/${sessionId}/intelligence`,
    SessionIntelligenceSnapshotSchema,
  );

  return { data, source: data ? ('live' as const) : ('empty' as const) };
}

export async function fetchSessionCoachAlerts(sessionId: string) {
  if (useMockStudioData()) {
    return { data: null, source: 'mock' as const };
  }

  const data = await fetchOptional<SessionCoachAlertsResponse>(
    `/api/live/sessions/${sessionId}/coach/alerts`,
    SessionCoachAlertsResponseSchema,
  );

  return { data, source: data ? ('live' as const) : ('empty' as const) };
}

export async function fetchSessionRecommendations(sessionId: string) {
  if (useMockStudioData()) {
    return { data: null, source: 'mock' as const };
  }

  const data = await fetchOptional<SessionRecommendationsResponse>(
    `/api/live/sessions/${sessionId}/recommendations`,
    SessionRecommendationsResponseSchema,
  );

  return { data, source: data ? ('live' as const) : ('empty' as const) };
}

export async function fetchAgencyLiveSessions(organizationId: string = getDefaultOrganizationId()) {
  const [live, scheduled, ended] = await Promise.all([
    fetchLiveSessions({ status: 'LIVE', limit: 50 }),
    fetchLiveSessions({ status: 'SCHEDULED', limit: 20 }),
    fetchLiveSessions({ status: 'ENDED', limit: 10 }),
  ]);

  const items = [...live.items, ...scheduled.items, ...ended.items];

  return {
    organizationId,
    items,
    source:
      live.source === 'live' || scheduled.source === 'live' || ended.source === 'live'
        ? ('live' as const)
        : items.length === 0
          ? ('empty' as const)
          : ('partial' as const),
  };
}

export type SessionCoachBundle = {
  alerts: SessionCoachAlertsResponse | null;
  recommendations: SessionRecommendationsResponse | null;
};

export async function fetchSessionCoachBundle(sessionId: string): Promise<SessionCoachBundle> {
  const [alerts, recommendations] = await Promise.all([
    fetchSessionCoachAlerts(sessionId),
    fetchSessionRecommendations(sessionId),
  ]);

  return {
    alerts: alerts.data,
    recommendations: recommendations.data,
  };
}
