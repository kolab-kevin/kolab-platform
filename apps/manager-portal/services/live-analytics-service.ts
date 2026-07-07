import { fetchAgencyLiveSessions } from './agency-live-service';

export async function fetchLiveAnalyticsData(organizationId: string) {
  const sessions = await fetchAgencyLiveSessions(organizationId);
  return {
    items: sessions.items,
    source: sessions.source,
  };
}
