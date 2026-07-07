import type {
  Campaign,
  CreatorSummary,
  LeadSummary,
  LiveSession,
  RecruiterProfileSummary,
} from '@kolab/types';

import type {
  ManagerCampaignAnalytics,
  ManagerCreatorAnalytics,
  ManagerExecutiveOverview,
  ManagerIntelligenceDashboard,
  ManagerLiveAnalytics,
  ManagerRecruitingAnalytics,
} from '@/types/reporting-workspace';

const ACTIVE_CREATOR_STATUSES = new Set(['ACTIVE']);

export function buildExecutiveOverview(input: {
  creators: CreatorSummary[];
  campaigns: Campaign[];
  leads: LeadSummary[];
  liveSessions: LiveSession[];
}): ManagerExecutiveOverview {
  const activeCreators = input.creators.filter((creator) =>
    ACTIVE_CREATOR_STATUSES.has(creator.status),
  ).length;

  const activeCampaigns = input.campaigns.filter((campaign) => campaign.status === 'ACTIVE').length;
  const funnelStages = [
    input.leads.filter((lead) => lead.status === 'NEW').length,
    input.leads.filter((lead) => lead.status === 'CONTACTED').length,
    input.leads.filter((lead) => lead.status === 'INTERESTED').length,
    input.leads.filter((lead) => lead.status === 'SIGNED' || lead.status === 'ACTIVE_CREATOR')
      .length,
  ];

  const liveHours = input.liveSessions.reduce(
    (total, session) => total + (session.durationSeconds ?? 0) / 3600,
    0,
  );

  const healthScore = Math.min(
    100,
    Math.round(
      (activeCreators / Math.max(input.creators.length, 1)) * 40 +
        (activeCampaigns / Math.max(input.campaigns.length, 1)) * 30 +
        (input.leads.filter((lead) => lead.status === 'SIGNED').length /
          Math.max(input.leads.length, 1)) *
          30,
    ),
  );

  return {
    totalCreators: input.creators.length,
    activeCreators,
    revenueLabel: formatCurrency(
      input.liveSessions.reduce((total, session) => total + Number(session.totalGiftValue ?? 0), 0),
    ),
    liveHoursLabel: `${liveHours.toFixed(1)}h`,
    activeCampaigns,
    recruitingFunnelLabel: funnelStages.join(' → '),
    organizationHealthScore: healthScore,
    healthLabel: healthScore >= 80 ? 'Healthy' : healthScore >= 60 ? 'Stable' : 'Needs attention',
  };
}

function formatCurrency(value: number): string {
  if (value <= 0) return '$0';
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function buildCreatorAnalytics(creators: CreatorSummary[]): ManagerCreatorAnalytics {
  const now = Date.now();
  const recentCreators = creators.filter(
    (creator) => now - new Date(creator.createdAt).getTime() <= 30 * 24 * 60 * 60 * 1000,
  ).length;

  const distribution = [
    {
      label: '0-2 platforms',
      count: creators.filter((creator) => creator.platformCount <= 2).length,
    },
    {
      label: '3-4 platforms',
      count: creators.filter(
        (creator) => creator.platformCount === 3 || creator.platformCount === 4,
      ).length,
    },
    {
      label: '5+ platforms',
      count: creators.filter((creator) => creator.platformCount >= 5).length,
    },
  ];

  const topPerformers = creators.slice(0, 5).map((creator) => ({
    name: creator.displayName,
    value: `${creator.platformCount} platforms`,
    detail: creator.country,
  }));

  const atRiskCreators = creators
    .filter((creator) => creator.status !== 'ACTIVE')
    .slice(0, 5)
    .map((creator) => ({
      name: creator.displayName,
      value: creator.status,
      detail: creator.email,
    }));

  return {
    growthLabel: `+${recentCreators} creators in 30 days`,
    performanceDistribution: distribution,
    retentionLabel: `${Math.round((creators.filter((creator) => creator.status === 'ACTIVE').length / Math.max(creators.length, 1)) * 100)}% active retention`,
    topPerformers,
    atRiskCreators,
  };
}

export function buildCampaignAnalytics(campaigns: Campaign[]): ManagerCampaignAnalytics {
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'ACTIVE').length;
  const completed = campaigns.filter((campaign) =>
    ['COMPLETED', 'ARCHIVED'].includes(campaign.status),
  ).length;
  const completionRate =
    campaigns.length === 0 ? 0 : Math.round((completed / campaigns.length) * 100);

  const budgets = campaigns
    .map((campaign) => Number(campaign.budgetAmount ?? 0))
    .filter((value) => value > 0);

  const totalBudget = budgets.reduce((sum, value) => sum + value, 0);

  return {
    activeCampaigns,
    completionRateLabel: `${completionRate}%`,
    deliverablesSummary: `${campaigns.filter((campaign) => campaign.status === 'ACTIVE').length} active campaigns with deliverables in flight`,
    revenueLabel: formatCurrency(totalBudget),
    roiLabel: 'ROI reporting connects in a future milestone',
  };
}

export function buildRecruitingAnalytics(
  leads: LeadSummary[],
  recruiters: RecruiterProfileSummary[],
): ManagerRecruitingAnalytics {
  const sourceMap = new Map<string, number>();
  for (const lead of leads) {
    sourceMap.set(lead.source, (sourceMap.get(lead.source) ?? 0) + 1);
  }

  const leadSources = [...sourceMap.entries()].map(([label, count]) => ({ label, count }));
  const signed = leads.filter((lead) => ['SIGNED', 'ACTIVE_CREATOR'].includes(lead.status)).length;

  const recruiterPerformance = recruiters.map((recruiter) => {
    const assigned = leads.filter((lead) => lead.assignedRecruiterId === recruiter.userId);
    const converted = assigned.filter((lead) =>
      ['SIGNED', 'ACTIVE_CREATOR'].includes(lead.status),
    ).length;

    return {
      name: recruiter.displayName ?? recruiter.nickname ?? recruiter.userId,
      value: `${converted} signed`,
      detail: `${assigned.length} assigned leads`,
    };
  });

  return {
    leadSources,
    conversionFunnelLabel: `${signed}/${Math.max(leads.length, 1)} converted`,
    recruiterPerformance,
    timeToConversionLabel: 'Median 18 days (presentation estimate)',
  };
}

export function buildLiveAnalytics(sessions: LiveSession[]): ManagerLiveAnalytics {
  const liveHours = sessions.reduce(
    (total, session) => total + (session.durationSeconds ?? 0) / 3600,
    0,
  );
  const viewers = sessions.reduce(
    (total, session) => total + (session.peakViewers ?? session.totalViewers ?? 0),
    0,
  );
  const gifts = sessions.reduce((total, session) => total + Number(session.totalGiftValue ?? 0), 0);

  return {
    sessionCount: sessions.length,
    liveHoursLabel: `${liveHours.toFixed(1)}h`,
    viewerTrendLabel: `${viewers.toLocaleString()} peak viewers`,
    giftTrendLabel: formatCurrency(gifts),
    engagementLabel:
      sessions.filter((session) => session.status === 'LIVE').length > 0
        ? 'Elevated during live sessions'
        : 'Stable between sessions',
  };
}

export function buildIntelligenceDashboard(input: {
  creators: CreatorSummary[];
  campaigns: Campaign[];
  leads: LeadSummary[];
  liveSessions: LiveSession[];
}): ManagerIntelligenceDashboard {
  const recommendations: ManagerIntelligenceDashboard['recommendations'] = [];
  const emergingTrends: ManagerIntelligenceDashboard['emergingTrends'] = [];
  const organizationRisks: ManagerIntelligenceDashboard['organizationRisks'] = [];
  const coachingOpportunities: ManagerIntelligenceDashboard['coachingOpportunities'] = [];

  if (input.liveSessions.some((session) => session.status === 'LIVE')) {
    coachingOpportunities.push({
      id: 'intel_coach_live',
      title: 'Coach active live sessions',
      summary: 'Live sessions are running — review coach recommendations for real-time support.',
      priority: 'HIGH',
    });
  }

  if (input.leads.filter((lead) => lead.nextFollowUpAt).length > 0) {
    recommendations.push({
      id: 'intel_recruiting_followups',
      title: 'Clear recruiting follow-up backlog',
      summary: 'Multiple leads have scheduled follow-ups that need recruiter attention.',
      priority: 'MEDIUM',
    });
  }

  if (input.campaigns.some((campaign) => campaign.status === 'PAUSED')) {
    organizationRisks.push({
      id: 'intel_campaign_paused',
      title: 'Paused campaigns need review',
      summary: 'One or more campaigns are paused and may impact portfolio momentum.',
      priority: 'HIGH',
    });
  }

  const recentCreators = input.creators.filter(
    (creator) => Date.now() - new Date(creator.createdAt).getTime() <= 14 * 24 * 60 * 60 * 1000,
  ).length;

  if (recentCreators > 0) {
    emergingTrends.push({
      id: 'intel_creator_growth',
      title: 'Creator roster expanding',
      summary: `${recentCreators} creators joined in the last two weeks.`,
      priority: 'LOW',
    });
  }

  if (input.creators.some((creator) => creator.status !== 'ACTIVE')) {
    organizationRisks.push({
      id: 'intel_creator_risk',
      title: 'Creators flagged for follow-up',
      summary: 'Non-active creators may need manager outreach or onboarding support.',
      priority: 'MEDIUM',
    });
  }

  return {
    recommendations,
    emergingTrends,
    organizationRisks,
    coachingOpportunities,
  };
}

export function buildExportCenter(): {
  options: Array<{ id: string; label: string; description: string }>;
} {
  return {
    options: [
      {
        id: 'export_executive',
        label: 'Executive summary',
        description: 'Portfolio overview, health score, and key KPIs',
      },
      {
        id: 'export_creator',
        label: 'Creator analytics',
        description: 'Growth, performance distribution, and retention metrics',
      },
      {
        id: 'export_campaign',
        label: 'Campaign analytics',
        description: 'Campaign completion, deliverables, and revenue placeholders',
      },
      {
        id: 'export_recruiting',
        label: 'Recruiting analytics',
        description: 'Lead sources, funnel, and recruiter performance',
      },
      {
        id: 'export_live',
        label: 'Live analytics',
        description: 'Sessions, hours, viewers, gifts, and engagement',
      },
    ],
  };
}
