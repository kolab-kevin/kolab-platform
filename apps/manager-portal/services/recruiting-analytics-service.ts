import { fetchRecruiterProfiles } from './recruiter-performance-service';
import { fetchRecruitmentPipeline } from './recruitment-pipeline-service';

export async function fetchRecruitingAnalyticsData() {
  const [leads, recruiters] = await Promise.all([
    fetchRecruitmentPipeline({ limit: 100 }),
    fetchRecruiterProfiles(),
  ]);

  return {
    leads: leads.data.items,
    recruiters: recruiters.data.items,
    source:
      leads.source === 'empty' && recruiters.source === 'empty'
        ? ('empty' as const)
        : leads.source === 'live' || recruiters.source === 'live'
          ? ('live' as const)
          : ('partial' as const),
  };
}
