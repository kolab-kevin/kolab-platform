import type { ManagerDashboardResponse } from '@/types/manager-dashboard';

export function createMockManagerDashboard(organizationId: string): ManagerDashboardResponse {
  const now = new Date();

  return {
    organizationId,
    generatedAt: now.toISOString(),
    agencyOverview: {
      activeCreators: 42,
      totalCreators: 58,
      liveSessionsToday: 6,
      openCampaigns: 11,
    },
    creatorHealth: {
      atRiskCount: 5,
      improvingCount: 18,
      averagePerformanceScore: 74,
      highlights: [
        '12 creators improved performance score this week',
        '3 creators completed all active goals',
      ],
    },
    liveOperations: {
      liveNow: 2,
      scheduledToday: 9,
      alertsOpen: 4,
      recentSessions: [
        { id: 'session_101', title: 'Morning Live Shop', status: 'LIVE' },
        { id: 'session_102', title: 'Creator Q&A', status: 'SCHEDULED' },
        { id: 'session_103', title: 'Brand Collab Stream', status: 'ENDED' },
      ],
    },
    campaignHealth: {
      activeCampaigns: 11,
      overdueDeliverables: 3,
      pendingApplications: 7,
      atRiskAssignments: 2,
    },
    recruitingPipeline: {
      newLeads: 14,
      inReview: 9,
      convertedThisMonth: 6,
      stages: [
        { label: 'New', count: 14 },
        { label: 'Screening', count: 9 },
        { label: 'Interview', count: 4 },
        { label: 'Offer', count: 2 },
      ],
    },
    tasksAndAlerts: {
      openTasks: 12,
      urgentAlerts: 3,
      items: [
        { id: 'task_1', title: 'Review overdue deliverables for Summer launch', priority: 'HIGH' },
        { id: 'task_2', title: 'Approve 2 campaign applications', priority: 'MEDIUM' },
        { id: 'task_3', title: 'Follow up on expiring contracts', priority: 'HIGH' },
      ],
    },
    revenue: {
      placeholder: true,
      mtdRevenue: '$128,400',
      note: 'Revenue reporting connects in a future Manager Portal milestone.',
    },
    complianceBlockers: {
      blockedCreators: 2,
      expiringDocuments: 5,
      items: [
        { id: 'comp_1', label: '2 creators blocked pending tax documents', severity: 'critical' },
        { id: 'comp_2', label: '5 contracts expiring within 14 days', severity: 'warning' },
      ],
    },
  };
}
