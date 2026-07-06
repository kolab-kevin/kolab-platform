import type {
  Campaign,
  CampaignApplication,
  CampaignCreatorAssignment,
  CampaignCreatorDeliverable,
  CampaignDeliverable,
  ListCreatorsResponse,
} from '@kolab/types';

import type {
  CampaignBoardColumn,
  ManagerApplicationItem,
  ManagerApplicationsSummary,
  ManagerCampaignBoard,
  ManagerCampaignBoardItem,
  ManagerCampaignDetail,
  ManagerCampaignListItem,
  ManagerCampaignOverview,
  ManagerCampaignStatusHistoryItem,
  ManagerDeliverableItem,
  ManagerDeliverablesSummary,
} from '@/types/campaign-operations';

export function formatBudgetLabel(campaign: Campaign): string | null {
  if (!campaign.budgetAmount) return null;
  return campaign.budgetCurrency
    ? `${campaign.budgetAmount} ${campaign.budgetCurrency}`
    : campaign.budgetAmount;
}

export function buildCreatorNameMap(creators: ListCreatorsResponse): Map<string, string> {
  return new Map(creators.items.map((creator) => [creator.id, creator.displayName]));
}

export function mapCampaignBoardColumn(
  campaign: Campaign,
  pendingApplications = 0,
): CampaignBoardColumn {
  if (campaign.status === 'DRAFT') return 'draft';
  if (campaign.status === 'PAUSED') return 'review';
  if (campaign.status === 'COMPLETED' || campaign.status === 'ARCHIVED') return 'completed';
  if (campaign.status === 'CANCELLED') return 'completed';
  if (campaign.status === 'ACTIVE' && pendingApplications > 0) return 'recruiting';
  if (campaign.status === 'ACTIVE') return 'active';
  return 'draft';
}

export function mapCampaignHealth(campaign: Campaign, overdueCount = 0): string {
  if (campaign.status === 'CANCELLED') return 'At risk';
  if (overdueCount > 0) return 'Needs attention';
  if (campaign.status === 'PAUSED') return 'In review';
  if (campaign.status === 'COMPLETED') return 'Complete';
  return 'On track';
}

export function mapCampaignListItem(
  campaign: Campaign,
  assignedCreators: number,
  pendingApplications: number,
  overdueCount = 0,
): ManagerCampaignListItem {
  return {
    id: campaign.id,
    title: campaign.title,
    brandName: campaign.brandName,
    status: campaign.status,
    campaignType: campaign.campaignType,
    budgetLabel: formatBudgetLabel(campaign),
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    boardColumn: mapCampaignBoardColumn(campaign, pendingApplications),
    assignedCreators,
    pendingApplications,
    health: mapCampaignHealth(campaign, overdueCount),
  };
}

export function buildCampaignOverview(
  campaigns: ManagerCampaignListItem[],
  assignmentCount: number,
): ManagerCampaignOverview {
  const now = Date.now();
  const activeCount = campaigns.filter((campaign) => campaign.status === 'ACTIVE').length;
  const upcomingCount = campaigns.filter(
    (campaign) => campaign.startsAt && new Date(campaign.startsAt).getTime() > now,
  ).length;
  const completedCount = campaigns.filter((campaign) =>
    ['COMPLETED', 'ARCHIVED'].includes(campaign.status),
  ).length;

  const budgets = campaigns
    .map((campaign) => campaign.budgetLabel)
    .filter((value): value is string => Boolean(value));

  const healthLabel = campaigns.some((campaign) => campaign.health === 'Needs attention')
    ? 'Needs attention'
    : campaigns.some((campaign) => campaign.health === 'At risk')
      ? 'At risk'
      : 'Healthy';

  return {
    activeCount,
    upcomingCount,
    completedCount,
    healthLabel,
    budgetSummary: budgets.length > 0 ? `${budgets.length} campaigns budgeted` : 'No budgets set',
    creatorParticipation: assignmentCount,
  };
}

export function buildCampaignBoard(campaigns: ManagerCampaignListItem[]): ManagerCampaignBoard {
  const board: ManagerCampaignBoard = {
    draft: [],
    recruiting: [],
    active: [],
    review: [],
    completed: [],
  };

  for (const campaign of campaigns) {
    const item: ManagerCampaignBoardItem = {
      id: campaign.id,
      title: campaign.title,
      brandName: campaign.brandName,
      status: campaign.status,
      budgetLabel: campaign.budgetLabel,
    };
    board[campaign.boardColumn].push(item);
  }

  return board;
}

export function buildStatusHistory(campaign: Campaign): ManagerCampaignStatusHistoryItem[] {
  return [
    {
      id: `${campaign.id}_created`,
      status: 'DRAFT',
      occurredAt: campaign.createdAt,
      note: 'Campaign created',
    },
    {
      id: `${campaign.id}_current`,
      status: campaign.status,
      occurredAt: campaign.updatedAt,
      note: 'Latest status',
    },
  ];
}

export function mapCampaignDetail(input: {
  campaign: Campaign;
  templateDeliverables: CampaignDeliverable[];
  assignments: CampaignCreatorAssignment[];
  creatorNames: Map<string, string>;
}): ManagerCampaignDetail {
  const timeline = [
    ...(input.campaign.startsAt
      ? [{ label: 'Starts', value: new Date(input.campaign.startsAt).toLocaleDateString() }]
      : []),
    ...(input.campaign.endsAt
      ? [{ label: 'Ends', value: new Date(input.campaign.endsAt).toLocaleDateString() }]
      : []),
    ...(input.campaign.applicationDeadline
      ? [
          {
            label: 'Application deadline',
            value: new Date(input.campaign.applicationDeadline).toLocaleDateString(),
          },
        ]
      : []),
  ];

  return {
    campaignId: input.campaign.id,
    title: input.campaign.title,
    description: input.campaign.description,
    brandName: input.campaign.brandName,
    budgetLabel: formatBudgetLabel(input.campaign),
    timeline,
    deliverableTemplates: input.templateDeliverables.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      dueAt: item.dueAt,
    })),
    assignedCreators: input.assignments.map((assignment) => ({
      assignmentId: assignment.id,
      creatorProfileId: assignment.creatorProfileId,
      creatorDisplayName:
        input.creatorNames.get(assignment.creatorProfileId) ?? assignment.creatorProfileId,
      status: assignment.status,
    })),
    statusHistory: buildStatusHistory(input.campaign),
  };
}

export function getDeliverableBucket(
  deliverable: CampaignCreatorDeliverable,
  now = Date.now(),
): ManagerDeliverableItem['bucket'] {
  if (deliverable.status === 'SUBMITTED') return 'submitted';
  if (deliverable.status === 'APPROVED') return 'approved';
  if (deliverable.status === 'REJECTED') return 'rejected';

  if (
    deliverable.dueAt &&
    ['ASSIGNED', 'IN_PROGRESS'].includes(deliverable.status) &&
    new Date(deliverable.dueAt).getTime() < now
  ) {
    return 'overdue';
  }

  return 'pending';
}

export function mapCreatorDeliverable(
  deliverable: CampaignCreatorDeliverable,
  campaign: Campaign,
  templateTitle: string,
  creatorDisplayName: string | null,
): ManagerDeliverableItem {
  return {
    id: deliverable.id,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    title: templateTitle,
    creatorDisplayName,
    status: deliverable.status,
    dueAt: deliverable.dueAt,
    bucket: getDeliverableBucket(deliverable),
  };
}

export function groupDeliverables(items: ManagerDeliverableItem[]): ManagerDeliverablesSummary {
  const grouped: ManagerDeliverablesSummary = {
    pending: [],
    submitted: [],
    approved: [],
    rejected: [],
    overdue: [],
  };

  for (const item of items) {
    grouped[item.bucket].push(item);
  }

  return grouped;
}

export function getApplicationBucket(
  status: CampaignApplication['status'],
): ManagerApplicationItem['bucket'] | null {
  if (status === 'INVITED' || status === 'APPLIED') return 'waiting';
  if (status === 'ACCEPTED') return 'accepted';
  if (status === 'REJECTED') return 'rejected';
  return null;
}

export function mapApplication(
  application: CampaignApplication,
  campaign: Campaign,
  creatorDisplayName: string,
): ManagerApplicationItem | null {
  const bucket = getApplicationBucket(application.status);
  if (!bucket) return null;

  return {
    id: application.id,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    creatorProfileId: application.creatorProfileId,
    creatorDisplayName,
    status: application.status,
    bucket,
    appliedAt: application.appliedAt,
  };
}

export function groupApplications(items: ManagerApplicationItem[]): ManagerApplicationsSummary {
  const grouped: ManagerApplicationsSummary = {
    waiting: [],
    accepted: [],
    rejected: [],
  };

  for (const item of items) {
    grouped[item.bucket].push(item);
  }

  return grouped;
}

export function countPendingApplications(applications: CampaignApplication[]): number {
  return applications.filter((item) => item.status === 'INVITED' || item.status === 'APPLIED')
    .length;
}
