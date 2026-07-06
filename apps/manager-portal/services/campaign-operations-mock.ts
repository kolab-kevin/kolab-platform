import type {
  Campaign,
  CampaignApplication,
  CampaignCreatorAssignment,
  CampaignCreatorDeliverable,
  CampaignDeliverable,
} from '@kolab/types';

import type { ManagerCampaignOperationsWorkspace } from '@/types/campaign-operations';
import {
  buildCampaignBoard,
  buildCampaignOverview,
  groupApplications,
  groupDeliverables,
  mapCampaignDetail,
  mapCampaignListItem,
} from '@/types/campaign-operations-adapters';

const now = new Date();
const iso = (offsetDays: number) =>
  new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000).toISOString();

const CREATOR_NAMES: Record<string, string> = {
  creator_mock_001: 'Alex Rivera',
  creator_mock_002: 'Maya Chen',
  creator_mock_003: 'Sam Ortiz',
  creator_mock_005: 'Jordan Blake',
};

export const MOCK_CAMPAIGN_PRIMARY = 'camp_mock_001';

function createCampaigns(): Campaign[] {
  return [
    {
      id: MOCK_CAMPAIGN_PRIMARY,
      organizationId: 'org_mock_001',
      title: 'Summer Beauty Launch',
      description: 'Promote the summer skincare line through live sessions and short-form content.',
      brandName: 'Glow Labs',
      campaignType: 'BRAND_DEAL',
      status: 'ACTIVE',
      budgetAmount: '5000.00',
      budgetCurrency: 'USD',
      startsAt: iso(-7),
      endsAt: iso(21),
      applicationDeadline: iso(5),
      brief: { platforms: ['TIKTOK', 'INSTAGRAM'] },
      requirements: { posts: 3 },
      metadata: { categories: ['Beauty'] },
      createdByUserId: 'user_manager_001',
      createdAt: iso(-14),
      updatedAt: iso(-1),
    },
    {
      id: 'camp_mock_002',
      organizationId: 'org_mock_001',
      title: 'Back-to-School Tech Drop',
      description: 'Showcase student-friendly accessories ahead of the fall semester.',
      brandName: 'Pulse Gear',
      campaignType: 'UGC',
      status: 'ACTIVE',
      budgetAmount: '2500.00',
      budgetCurrency: 'USD',
      startsAt: iso(3),
      endsAt: iso(30),
      applicationDeadline: iso(10),
      brief: { platforms: ['TIKTOK'] },
      requirements: {},
      metadata: {},
      createdByUserId: 'user_manager_001',
      createdAt: iso(-10),
      updatedAt: iso(-2),
    },
    {
      id: 'camp_mock_003',
      organizationId: 'org_mock_001',
      title: 'Holiday Live Marathon',
      description: 'Multi-creator holiday live event series.',
      brandName: 'Festive Co',
      campaignType: 'LIVE_STREAM',
      status: 'DRAFT',
      budgetAmount: '12000.00',
      budgetCurrency: 'USD',
      startsAt: iso(30),
      endsAt: iso(60),
      applicationDeadline: iso(25),
      brief: {},
      requirements: {},
      metadata: {},
      createdByUserId: 'user_manager_001',
      createdAt: iso(-3),
      updatedAt: iso(-3),
    },
    {
      id: 'camp_mock_004',
      organizationId: 'org_mock_001',
      title: 'Fitness Challenge Q3',
      description: 'Creator fitness challenge with weekly deliverables.',
      brandName: 'ActiveNow',
      campaignType: 'AFFILIATE',
      status: 'PAUSED',
      budgetAmount: '1800.00',
      budgetCurrency: 'USD',
      startsAt: iso(-20),
      endsAt: iso(10),
      applicationDeadline: iso(-25),
      brief: {},
      requirements: {},
      metadata: {},
      createdByUserId: 'user_manager_001',
      createdAt: iso(-30),
      updatedAt: iso(-4),
    },
    {
      id: 'camp_mock_005',
      organizationId: 'org_mock_001',
      title: 'Spring Collection Preview',
      description: 'Completed spring fashion preview campaign.',
      brandName: 'Lumen Apparel',
      campaignType: 'BRAND_DEAL',
      status: 'COMPLETED',
      budgetAmount: '4200.00',
      budgetCurrency: 'USD',
      startsAt: iso(-90),
      endsAt: iso(-30),
      applicationDeadline: iso(-95),
      brief: {},
      requirements: {},
      metadata: {},
      createdByUserId: 'user_manager_001',
      createdAt: iso(-100),
      updatedAt: iso(-30),
    },
  ];
}

function createTemplateDeliverables(): CampaignDeliverable[] {
  return [
    {
      id: 'del_template_001',
      organizationId: 'org_mock_001',
      campaignId: MOCK_CAMPAIGN_PRIMARY,
      title: 'Live session #1',
      description: 'Host a 45-minute launch live session.',
      status: 'OPEN',
      dueAt: iso(7),
      requirements: {},
      metadata: {},
      createdAt: iso(-10),
      updatedAt: iso(-2),
    },
    {
      id: 'del_template_002',
      organizationId: 'org_mock_001',
      campaignId: MOCK_CAMPAIGN_PRIMARY,
      title: 'Short-form review',
      description: 'Submit one short-form review video.',
      status: 'IN_PROGRESS',
      dueAt: iso(14),
      requirements: {},
      metadata: {},
      createdAt: iso(-10),
      updatedAt: iso(-1),
    },
  ];
}

function createAssignments(): CampaignCreatorAssignment[] {
  return [
    {
      id: 'assign_mock_001',
      organizationId: 'org_mock_001',
      campaignId: MOCK_CAMPAIGN_PRIMARY,
      creatorProfileId: 'creator_mock_001',
      applicationId: 'app_mock_accepted_001',
      status: 'IN_PROGRESS',
      assignedByUserId: 'user_manager_001',
      assignedAt: iso(-5),
      acceptedAt: iso(-4),
      completedAt: null,
      cancelledAt: null,
      metadata: { progressPercent: 50 },
      createdAt: iso(-5),
      updatedAt: iso(-1),
    },
    {
      id: 'assign_mock_002',
      organizationId: 'org_mock_001',
      campaignId: MOCK_CAMPAIGN_PRIMARY,
      creatorProfileId: 'creator_mock_002',
      applicationId: 'app_mock_accepted_002',
      status: 'ASSIGNED',
      assignedByUserId: 'user_manager_001',
      assignedAt: iso(-3),
      acceptedAt: iso(-2),
      completedAt: null,
      cancelledAt: null,
      metadata: {},
      createdAt: iso(-3),
      updatedAt: iso(-2),
    },
  ];
}

function createApplications(): CampaignApplication[] {
  return [
    {
      id: 'app_mock_waiting_001',
      organizationId: 'org_mock_001',
      campaignId: 'camp_mock_002',
      creatorProfileId: 'creator_mock_003',
      status: 'APPLIED',
      source: 'CREATOR_APPLIED',
      message: 'Interested in participating.',
      invitedByUserId: null,
      appliedAt: iso(-2),
      reviewedByUserId: null,
      reviewedAt: null,
      decisionReason: null,
      metadata: {},
      createdAt: iso(-2),
      updatedAt: iso(-2),
    },
    {
      id: 'app_mock_waiting_002',
      organizationId: 'org_mock_001',
      campaignId: 'camp_mock_002',
      creatorProfileId: 'creator_mock_005',
      status: 'INVITED',
      source: 'INVITE',
      message: 'We would love to have you join.',
      invitedByUserId: 'user_manager_001',
      appliedAt: null,
      reviewedByUserId: null,
      reviewedAt: null,
      decisionReason: null,
      metadata: {},
      createdAt: iso(-1),
      updatedAt: iso(-1),
    },
    {
      id: 'app_mock_accepted_001',
      organizationId: 'org_mock_001',
      campaignId: MOCK_CAMPAIGN_PRIMARY,
      creatorProfileId: 'creator_mock_001',
      status: 'ACCEPTED',
      source: 'MANUAL',
      message: null,
      invitedByUserId: null,
      appliedAt: iso(-6),
      reviewedByUserId: 'user_manager_001',
      reviewedAt: iso(-5),
      decisionReason: null,
      metadata: {},
      createdAt: iso(-6),
      updatedAt: iso(-5),
    },
    {
      id: 'app_mock_rejected_001',
      organizationId: 'org_mock_001',
      campaignId: 'camp_mock_004',
      creatorProfileId: 'creator_mock_003',
      status: 'REJECTED',
      source: 'CREATOR_APPLIED',
      message: null,
      invitedByUserId: null,
      appliedAt: iso(-8),
      reviewedByUserId: 'user_manager_001',
      reviewedAt: iso(-7),
      decisionReason: 'Capacity reached',
      metadata: {},
      createdAt: iso(-8),
      updatedAt: iso(-7),
    },
  ];
}

function createCreatorDeliverables(): CampaignCreatorDeliverable[] {
  return [
    {
      id: 'cd_mock_001',
      organizationId: 'org_mock_001',
      assignmentId: 'assign_mock_001',
      campaignDeliverableId: 'del_template_001',
      status: 'IN_PROGRESS',
      dueAt: iso(7),
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      submissionUrl: null,
      notes: null,
      metadata: {},
      createdAt: iso(-4),
      updatedAt: iso(-1),
    },
    {
      id: 'cd_mock_002',
      organizationId: 'org_mock_001',
      assignmentId: 'assign_mock_001',
      campaignDeliverableId: 'del_template_002',
      status: 'SUBMITTED',
      dueAt: iso(14),
      submittedAt: iso(-1),
      approvedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      submissionUrl: 'https://example.com/review.mp4',
      notes: null,
      metadata: {},
      createdAt: iso(-4),
      updatedAt: iso(-1),
    },
    {
      id: 'cd_mock_003',
      organizationId: 'org_mock_001',
      assignmentId: 'assign_mock_002',
      campaignDeliverableId: 'del_template_001',
      status: 'ASSIGNED',
      dueAt: iso(-2),
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      submissionUrl: null,
      notes: null,
      metadata: {},
      createdAt: iso(-2),
      updatedAt: iso(-2),
    },
  ];
}

let mockCampaigns = createCampaigns();
let mockTemplateDeliverables = createTemplateDeliverables();
let mockAssignments = createAssignments();
let mockApplications = createApplications();
let mockCreatorDeliverables = createCreatorDeliverables();

export function getMockCampaignById(campaignId: string): Campaign | null {
  return mockCampaigns.find((campaign) => campaign.id === campaignId) ?? null;
}

export function getMockTemplateDeliverablesForCampaign(campaignId: string): CampaignDeliverable[] {
  return mockTemplateDeliverables.filter((item) => item.campaignId === campaignId);
}

export function getMockAssignmentsForCampaign(campaignId: string): CampaignCreatorAssignment[] {
  return mockAssignments.filter((item) => item.campaignId === campaignId);
}

export function getMockApplicationsForCampaign(campaignId: string): CampaignApplication[] {
  return mockApplications.filter((item) => item.campaignId === campaignId);
}

export function getMockCreatorDeliverablesForAssignment(
  assignmentId: string,
): CampaignCreatorDeliverable[] {
  return mockCreatorDeliverables.filter((item) => item.assignmentId === assignmentId);
}

export function createMockCampaignOperationsWorkspace(
  organizationId: string,
): ManagerCampaignOperationsWorkspace {
  mockCampaigns = createCampaigns();
  mockTemplateDeliverables = createTemplateDeliverables();
  mockAssignments = createAssignments();
  mockApplications = createApplications();
  mockCreatorDeliverables = createCreatorDeliverables();

  const creatorNames = new Map(Object.entries(CREATOR_NAMES));
  const applicationsByCampaign = new Map<string, CampaignApplication[]>();
  const assignmentsByCampaign = new Map<string, CampaignCreatorAssignment[]>();

  for (const campaign of mockCampaigns) {
    applicationsByCampaign.set(
      campaign.id,
      mockApplications.filter((item) => item.campaignId === campaign.id),
    );
    assignmentsByCampaign.set(
      campaign.id,
      mockAssignments.filter((item) => item.campaignId === campaign.id),
    );
  }

  const deliverableItems = mockCreatorDeliverables.map((deliverable) => {
    const assignment = mockAssignments.find((item) => item.id === deliverable.assignmentId);
    const campaign = mockCampaigns.find((item) => item.id === assignment?.campaignId)!;
    const template = mockTemplateDeliverables.find(
      (item) => item.id === deliverable.campaignDeliverableId,
    );

    return {
      id: deliverable.id,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      title: template?.title ?? 'Deliverable',
      creatorDisplayName: assignment
        ? (creatorNames.get(assignment.creatorProfileId) ?? assignment.creatorProfileId)
        : null,
      status: deliverable.status,
      dueAt: deliverable.dueAt,
      bucket:
        deliverable.status === 'SUBMITTED'
          ? ('submitted' as const)
          : deliverable.status === 'ASSIGNED' &&
              deliverable.dueAt &&
              new Date(deliverable.dueAt) < now
            ? ('overdue' as const)
            : ('pending' as const),
    };
  });

  const applicationItems = mockApplications
    .map((application) => {
      const campaign = mockCampaigns.find((item) => item.id === application.campaignId);
      if (!campaign) return null;

      const bucket =
        application.status === 'ACCEPTED'
          ? ('accepted' as const)
          : application.status === 'REJECTED'
            ? ('rejected' as const)
            : ('waiting' as const);

      return {
        id: application.id,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        creatorProfileId: application.creatorProfileId,
        creatorDisplayName:
          creatorNames.get(application.creatorProfileId) ?? application.creatorProfileId,
        status: application.status,
        bucket,
        appliedAt: application.appliedAt,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const campaigns = mockCampaigns.map((campaign) => {
    const apps = applicationsByCampaign.get(campaign.id) ?? [];
    const assignments = assignmentsByCampaign.get(campaign.id) ?? [];
    const pendingApplications = apps.filter(
      (item) => item.status === 'INVITED' || item.status === 'APPLIED',
    ).length;
    const overdueCount = deliverableItems.filter(
      (item) => item.campaignId === campaign.id && item.bucket === 'overdue',
    ).length;

    return mapCampaignListItem(campaign, assignments.length, pendingApplications, overdueCount);
  });

  const selectedCampaign = mockCampaigns.find((item) => item.id === MOCK_CAMPAIGN_PRIMARY)!;

  return {
    organizationId,
    generatedAt: now.toISOString(),
    overview: buildCampaignOverview(campaigns, mockAssignments.length),
    campaigns,
    board: buildCampaignBoard(campaigns),
    detail: mapCampaignDetail({
      campaign: selectedCampaign,
      templateDeliverables: getMockTemplateDeliverablesForCampaign(MOCK_CAMPAIGN_PRIMARY),
      assignments: getMockAssignmentsForCampaign(MOCK_CAMPAIGN_PRIMARY),
      creatorNames,
    }),
    deliverables: groupDeliverables(deliverableItems),
    applications: groupApplications(applicationItems),
    selectedCampaignId: MOCK_CAMPAIGN_PRIMARY,
  };
}
