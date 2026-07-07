import { getDefaultOrganizationId } from '@/lib/env';

import { fetchCampaignAnalyticsData } from './campaign-analytics-service';
import { fetchCreatorAnalyticsData } from './creator-analytics-service';
import { fetchLiveAnalyticsData } from './live-analytics-service';
import { fetchRecruitingAnalyticsData } from './recruiting-analytics-service';

export type ReportingLoaderResult = {
  creators: Awaited<ReturnType<typeof fetchCreatorAnalyticsData>>['items'];
  campaigns: Awaited<ReturnType<typeof fetchCampaignAnalyticsData>>['data']['items'];
  leads: Awaited<ReturnType<typeof fetchRecruitingAnalyticsData>>['leads'];
  recruiters: Awaited<ReturnType<typeof fetchRecruitingAnalyticsData>>['recruiters'];
  liveSessions: Awaited<ReturnType<typeof fetchLiveAnalyticsData>>['items'];
  partial: boolean;
};

export async function loadReportingSources(
  organizationId: string = getDefaultOrganizationId(),
): Promise<ReportingLoaderResult> {
  const [creatorsResult, campaignsResult, recruitingResult, liveResult] = await Promise.all([
    fetchCreatorAnalyticsData(),
    fetchCampaignAnalyticsData(),
    fetchRecruitingAnalyticsData(),
    fetchLiveAnalyticsData(organizationId),
  ]);

  return {
    creators: creatorsResult.items,
    campaigns: campaignsResult.data.items,
    leads: recruitingResult.leads,
    recruiters: recruitingResult.recruiters,
    liveSessions: liveResult.items,
    partial:
      creatorsResult.source === 'empty' ||
      campaignsResult.source === 'empty' ||
      recruitingResult.source === 'empty' ||
      liveResult.source === 'empty',
  };
}
