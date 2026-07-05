import type { CreatorDashboardResponse } from '@kolab/types';

export type DashboardOverview = CreatorDashboardResponse['overview'];
export type DashboardTodaysGoals = CreatorDashboardResponse['todaysGoals'];
export type DashboardUpcomingCampaigns = CreatorDashboardResponse['upcomingCampaigns'];
export type DashboardPerformance = CreatorDashboardResponse['performance'];
export type DashboardCoach = CreatorDashboardResponse['coach'];
export type DashboardQuickActionItem = CreatorDashboardResponse['quickActions'][number];
