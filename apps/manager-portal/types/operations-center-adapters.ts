import type {
  AuditLogResponse,
  Campaign,
  LeadSummary,
  LiveCoachAlertItem,
  LiveRecommendationItem,
  LiveSession,
} from '@kolab/types';

import type {
  ManagerActivityItem,
  ManagerActivityType,
  ManagerAiRecommendationItem,
  ManagerAlertCenter,
  ManagerAlertItem,
  ManagerDeadlineItem,
  ManagerDeadlinesSummary,
  ManagerOperationsOverview,
  ManagerPriority,
  ManagerTaskBucket,
  ManagerTaskItem,
  ManagerTasksSummary,
} from '@/types/operations-center';

export function groupTasksByBucket(tasks: ManagerTaskItem[]): ManagerTasksSummary {
  return {
    assigned: tasks.filter((task) => task.bucket === 'assigned'),
    inProgress: tasks.filter((task) => task.bucket === 'inProgress'),
    waiting: tasks.filter((task) => task.bucket === 'waiting'),
    completed: tasks.filter((task) => task.bucket === 'completed'),
  };
}

export function flattenAlerts(alerts: ManagerAlertCenter): ManagerAlertItem[] {
  return [
    ...alerts.live,
    ...alerts.coach,
    ...alerts.compliance,
    ...alerts.campaign,
    ...alerts.recruiting,
  ];
}

export function flattenDeadlines(deadlines: ManagerDeadlinesSummary): ManagerDeadlineItem[] {
  return [
    ...deadlines.deliverables,
    ...deadlines.campaigns,
    ...deadlines.contracts,
    ...deadlines.compliance,
    ...deadlines.documents,
  ];
}

export function buildOperationsOverview(input: {
  tasks: ManagerTasksSummary;
  alerts: ManagerAlertCenter;
  deadlines: ManagerDeadlinesSummary;
  overdueFollowUps: number;
}): ManagerOperationsOverview {
  const openTasks =
    input.tasks.assigned.length + input.tasks.inProgress.length + input.tasks.waiting.length;

  const criticalAlerts = flattenAlerts(input.alerts).filter(
    (alert) => alert.priority === 'HIGH',
  ).length;

  const campaignDeadlines = input.deadlines.campaigns.length + input.deadlines.deliverables.length;
  const liveIssues = input.alerts.live.length + input.alerts.coach.length;
  const complianceIssues = input.alerts.compliance.length + input.deadlines.documents.length;

  return {
    openTasks,
    criticalAlerts,
    overdueFollowUps: input.overdueFollowUps,
    campaignDeadlines,
    liveIssues,
    complianceIssues,
  };
}

export function mapRecruitingFollowUpTask(lead: LeadSummary, overdue: boolean): ManagerTaskItem {
  return {
    id: `task_followup_${lead.id}`,
    title: `Follow up with ${lead.name}`,
    description: lead.nickname,
    priority: overdue ? 'HIGH' : 'MEDIUM',
    bucket: overdue ? 'assigned' : 'waiting',
    assigneeName: lead.assignedRecruiterId,
    dueAt: lead.nextFollowUpAt,
    sourceLabel: 'Recruiting',
  };
}

export function mapCampaignReviewTask(campaign: Campaign): ManagerTaskItem {
  return {
    id: `task_campaign_${campaign.id}`,
    title: `Review campaign: ${campaign.title}`,
    description: campaign.brandName,
    priority: 'MEDIUM',
    bucket: campaign.status === 'ACTIVE' ? 'inProgress' : 'waiting',
    assigneeName: null,
    dueAt: campaign.applicationDeadline,
    sourceLabel: 'Campaign',
  };
}

export function mapLiveCoachAlert(
  session: LiveSession,
  alert: LiveCoachAlertItem,
  creatorName: string,
  occurredAt: string,
): ManagerAlertItem {
  return {
    id: `alert_coach_${session.id}_${alert.id}`,
    title: alert.title,
    category: 'coach',
    priority: alert.priority,
    occurredAt,
    entityLabel: `${creatorName} · ${session.title}`,
  };
}

export function mapLiveSessionAlert(session: LiveSession, creatorName: string): ManagerAlertItem {
  return {
    id: `alert_live_${session.id}`,
    title: `Live session requires attention: ${session.title}`,
    category: 'live',
    priority: 'HIGH',
    occurredAt: session.startedAt ?? session.updatedAt,
    entityLabel: creatorName,
  };
}

export function mapCampaignAlert(campaign: Campaign, reason: string): ManagerAlertItem {
  return {
    id: `alert_campaign_${campaign.id}`,
    title: reason,
    category: 'campaign',
    priority: 'MEDIUM',
    occurredAt: campaign.updatedAt,
    entityLabel: campaign.title,
  };
}

export function mapRecruitingAlert(lead: LeadSummary, reason: string): ManagerAlertItem {
  return {
    id: `alert_recruiting_${lead.id}`,
    title: reason,
    category: 'recruiting',
    priority: 'HIGH',
    occurredAt: lead.nextFollowUpAt ?? lead.updatedAt,
    entityLabel: lead.name,
  };
}

export function mapComplianceAlert(
  id: string,
  title: string,
  priority: ManagerPriority,
): ManagerAlertItem {
  return {
    id: `alert_compliance_${id}`,
    title,
    category: 'compliance',
    priority,
    occurredAt: new Date().toISOString(),
    entityLabel: null,
  };
}

export function mapCampaignDeadline(campaign: Campaign): ManagerDeadlineItem | null {
  const dueAt = campaign.endsAt ?? campaign.applicationDeadline;
  if (!dueAt) return null;

  return {
    id: `deadline_campaign_${campaign.id}`,
    title: campaign.title,
    category: 'campaigns',
    dueAt,
    entityLabel: campaign.brandName,
    priority: campaign.status === 'ACTIVE' ? 'HIGH' : 'MEDIUM',
  };
}

export function mapDeliverableDeadline(input: {
  id: string;
  title: string;
  campaignTitle: string;
  dueAt: string;
  overdue: boolean;
}): ManagerDeadlineItem {
  return {
    id: `deadline_deliverable_${input.id}`,
    title: input.title,
    category: 'deliverables',
    dueAt: input.dueAt,
    entityLabel: input.campaignTitle,
    priority: input.overdue ? 'HIGH' : 'MEDIUM',
  };
}

export function mapExpiringRecordDeadline(input: {
  id: string;
  title: string;
  category: 'contracts' | 'documents' | 'compliance';
  dueAt: string;
  entityLabel: string | null;
}): ManagerDeadlineItem {
  return {
    id: `deadline_${input.category}_${input.id}`,
    title: input.title,
    category: input.category,
    dueAt: input.dueAt,
    entityLabel: input.entityLabel,
    priority: 'MEDIUM',
  };
}

function mapAuditActionToActivityType(action: string): ManagerActivityType {
  if (action.includes('creator') && action.includes('converted')) return 'creator_signed';
  if (action.includes('campaign')) return 'campaign_updated';
  if (action.includes('live') && action.includes('started')) return 'live_session_started';
  if (action.includes('goal')) return 'goal_completed';
  if (action.includes('alert')) return 'alert_created';
  return 'other';
}

export function mapAuditLogToActivity(log: AuditLogResponse): ManagerActivityItem {
  const activityType = mapAuditActionToActivityType(log.action);

  return {
    id: log.id,
    title: log.action.replaceAll('.', ' '),
    activityType,
    occurredAt: log.createdAt,
    actorLabel: log.actorUserId,
    description: `${log.targetType} · ${log.targetId}`,
  };
}

export function mapRecommendationToAiItem(
  sessionTitle: string,
  recommendation: LiveRecommendationItem,
): ManagerAiRecommendationItem {
  return {
    id: recommendation.id,
    title: recommendation.title,
    priority: recommendation.priority,
    summary: recommendation.description,
    sourceLabel: sessionTitle,
  };
}

export function groupAiRecommendations(items: ManagerAiRecommendationItem[]): {
  high: ManagerAiRecommendationItem[];
  medium: ManagerAiRecommendationItem[];
  low: ManagerAiRecommendationItem[];
} {
  return {
    high: items.filter((item) => item.priority === 'HIGH'),
    medium: items.filter((item) => item.priority === 'MEDIUM'),
    low: items.filter((item) => item.priority === 'LOW'),
  };
}

export function countOverdueFollowUps(leads: LeadSummary[], now = new Date()): number {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return leads.filter(
    (lead) =>
      lead.nextFollowUpAt && new Date(lead.nextFollowUpAt).getTime() < startOfToday.getTime(),
  ).length;
}

export function emptyAlertCenter(): ManagerAlertCenter {
  return {
    live: [],
    coach: [],
    compliance: [],
    campaign: [],
    recruiting: [],
  };
}

export function emptyDeadlinesSummary(): ManagerDeadlinesSummary {
  return {
    deliverables: [],
    campaigns: [],
    contracts: [],
    compliance: [],
    documents: [],
  };
}

export function createTask(
  input: Omit<ManagerTaskItem, 'bucket'> & { bucket?: ManagerTaskBucket },
): ManagerTaskItem {
  return {
    bucket: 'assigned',
    ...input,
  };
}
