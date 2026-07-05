import type {
  Campaign,
  CampaignApplication,
  CampaignCreatorAssignment,
  CampaignCreatorDeliverable,
  CampaignDeliverable,
} from '@kolab/types';

import {
  buildCampaignWorkspaceData,
  type CampaignWorkspaceData,
  toDeliverableDisplayModel,
} from '@/types/campaign-adapters';

const now = new Date();
const iso = (offsetDays: number) =>
  new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000).toISOString();

export function createMockCampaigns(_creatorProfileId: string): Campaign[] {
  return [
    {
      id: 'camp_1',
      organizationId: 'org_mock_001',
      title: 'Summer Beauty Launch',
      description:
        'Promote the new summer skincare line through live sessions and short-form content.',
      brandName: 'Glow Labs',
      campaignType: 'BRAND_DEAL',
      status: 'ACTIVE',
      budgetAmount: '5000.00',
      budgetCurrency: 'USD',
      startsAt: iso(-7),
      endsAt: iso(21),
      applicationDeadline: iso(-1),
      brief: {
        objective: 'Drive awareness for summer skincare launch',
        platforms: ['TIKTOK', 'INSTAGRAM'],
        contentTypes: ['live', 'short_form'],
      },
      requirements: {
        posts: 3,
        responsibilities: ['Host 2 live sessions', 'Submit 1 short-form review video'],
        skills: ['beauty', 'skincare'],
      },
      metadata: {
        categories: ['Beauty', 'Skincare'],
        compensation: '5000 USD flat fee',
      },
      createdByUserId: 'user_manager_001',
      createdAt: iso(-14),
      updatedAt: iso(-1),
    },
    {
      id: 'camp_2',
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
      applicationDeadline: iso(5),
      brief: {
        objective: 'Generate UGC for back-to-school accessories',
        platforms: ['TIKTOK'],
      },
      requirements: {
        responsibilities: ['Create 2 unboxing videos'],
      },
      metadata: {
        categories: ['Tech', 'Accessories'],
      },
      createdByUserId: 'user_manager_001',
      createdAt: iso(-10),
      updatedAt: iso(-2),
    },
  ];
}

export function createMockCampaignAssignments(
  creatorProfileId: string,
): CampaignCreatorAssignment[] {
  return [
    {
      id: 'assign_1',
      organizationId: 'org_mock_001',
      campaignId: 'camp_1',
      creatorProfileId,
      applicationId: 'app_accepted_1',
      status: 'IN_PROGRESS',
      assignedByUserId: 'user_manager_001',
      assignedAt: iso(-5),
      acceptedAt: iso(-4),
      completedAt: null,
      cancelledAt: null,
      metadata: {
        priority: 'HIGH',
        progressPercent: 50,
      },
      createdAt: iso(-5),
      updatedAt: iso(-1),
    },
  ];
}

export function createMockCampaignApplications(creatorProfileId: string): CampaignApplication[] {
  return [
    {
      id: 'app_draft_1',
      organizationId: 'org_mock_001',
      campaignId: 'camp_2',
      creatorProfileId,
      status: 'INVITED',
      source: 'INVITE',
      message: 'We would love to have you on this campaign.',
      invitedByUserId: 'user_manager_001',
      appliedAt: null,
      reviewedByUserId: null,
      reviewedAt: null,
      decisionReason: null,
      metadata: {},
      createdAt: iso(-2),
      updatedAt: iso(-2),
    },
    {
      id: 'app_applied_1',
      organizationId: 'org_mock_001',
      campaignId: 'camp_2',
      creatorProfileId,
      status: 'APPLIED',
      source: 'CREATOR_APPLIED',
      message: 'Excited to participate in this campaign.',
      invitedByUserId: null,
      appliedAt: iso(-3),
      reviewedByUserId: null,
      reviewedAt: null,
      decisionReason: null,
      metadata: {},
      createdAt: iso(-3),
      updatedAt: iso(-3),
    },
    {
      id: 'app_accepted_1',
      organizationId: 'org_mock_001',
      campaignId: 'camp_1',
      creatorProfileId,
      status: 'ACCEPTED',
      source: 'INVITE',
      message: null,
      invitedByUserId: 'user_manager_001',
      appliedAt: iso(-6),
      reviewedByUserId: 'user_manager_001',
      reviewedAt: iso(-5),
      decisionReason: null,
      metadata: {},
      createdAt: iso(-6),
      updatedAt: iso(-5),
    },
    {
      id: 'app_rejected_1',
      organizationId: 'org_mock_001',
      campaignId: 'camp_2',
      creatorProfileId,
      status: 'REJECTED',
      source: 'CREATOR_APPLIED',
      message: null,
      invitedByUserId: null,
      appliedAt: iso(-8),
      reviewedByUserId: 'user_manager_001',
      reviewedAt: iso(-7),
      decisionReason: 'Campaign roster filled.',
      metadata: {},
      createdAt: iso(-8),
      updatedAt: iso(-7),
    },
  ];
}

export function createMockTemplateDeliverables(): CampaignDeliverable[] {
  return [
    {
      id: 'tmpl_del_1',
      organizationId: 'org_mock_001',
      campaignId: 'camp_1',
      title: 'Live launch session',
      description: 'Host a 45-minute launch live featuring hero products.',
      status: 'IN_PROGRESS',
      dueAt: iso(2),
      requirements: { durationMinutes: 45 },
      metadata: {},
      createdAt: iso(-7),
      updatedAt: iso(-1),
    },
    {
      id: 'tmpl_del_2',
      organizationId: 'org_mock_001',
      campaignId: 'camp_1',
      title: 'Short-form review clip',
      description: 'Post a 30-second review clip with campaign hashtags.',
      status: 'OPEN',
      dueAt: iso(7),
      requirements: { durationSeconds: 30 },
      metadata: {},
      createdAt: iso(-7),
      updatedAt: iso(-1),
    },
  ];
}

export function createMockCreatorDeliverables(): CampaignCreatorDeliverable[] {
  return [
    {
      id: 'cdel_1',
      organizationId: 'org_mock_001',
      assignmentId: 'assign_1',
      campaignDeliverableId: 'tmpl_del_1',
      status: 'IN_PROGRESS',
      dueAt: iso(2),
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      submissionUrl: null,
      notes: null,
      metadata: { title: 'Live launch session' },
      createdAt: iso(-5),
      updatedAt: iso(-1),
    },
    {
      id: 'cdel_2',
      organizationId: 'org_mock_001',
      assignmentId: 'assign_1',
      campaignDeliverableId: 'tmpl_del_2',
      status: 'SUBMITTED',
      dueAt: iso(-1),
      submittedAt: iso(-1),
      approvedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      submissionUrl: 'https://example.com/submission.mp4',
      notes: 'Draft clip uploaded for review.',
      metadata: { title: 'Short-form review clip' },
      createdAt: iso(-5),
      updatedAt: iso(-1),
    },
    {
      id: 'cdel_3',
      organizationId: 'org_mock_001',
      assignmentId: 'assign_1',
      campaignDeliverableId: 'tmpl_del_1',
      status: 'APPROVED',
      dueAt: iso(-10),
      submittedAt: iso(-11),
      approvedAt: iso(-10),
      rejectedAt: null,
      rejectionReason: null,
      submissionUrl: 'https://example.com/approved-live.mp4',
      notes: null,
      metadata: { title: 'Kickoff live session' },
      createdAt: iso(-12),
      updatedAt: iso(-10),
    },
    {
      id: 'cdel_4',
      organizationId: 'org_mock_001',
      assignmentId: 'assign_1',
      campaignDeliverableId: 'tmpl_del_2',
      status: 'REJECTED',
      dueAt: iso(-5),
      submittedAt: iso(-6),
      approvedAt: null,
      rejectedAt: iso(-5),
      rejectionReason: 'Missing required hashtags.',
      submissionUrl: 'https://example.com/rejected.mp4',
      notes: null,
      metadata: { title: 'Hashtag clip reshoot' },
      createdAt: iso(-8),
      updatedAt: iso(-5),
    },
    {
      id: 'cdel_5',
      organizationId: 'org_mock_001',
      assignmentId: 'assign_1',
      campaignDeliverableId: 'tmpl_del_2',
      status: 'ASSIGNED',
      dueAt: iso(-3),
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      submissionUrl: null,
      notes: null,
      metadata: { title: 'Overdue reshoot clip' },
      createdAt: iso(-4),
      updatedAt: iso(-4),
    },
  ];
}

function resolveDeliverableTitle(
  deliverable: CampaignCreatorDeliverable,
  templateDeliverables: CampaignDeliverable[],
): string {
  const metadataTitle = deliverable.metadata.title;
  if (typeof metadataTitle === 'string') return metadataTitle;

  const template = templateDeliverables.find(
    (item) => item.id === deliverable.campaignDeliverableId,
  );
  return template?.title ?? deliverable.campaignDeliverableId;
}

export function createMockCampaignWorkspace(creatorProfileId: string): CampaignWorkspaceData {
  const campaigns = createMockCampaigns(creatorProfileId);
  const assignments = createMockCampaignAssignments(creatorProfileId);
  const applications = createMockCampaignApplications(creatorProfileId).filter(
    (application) => application.creatorProfileId === creatorProfileId,
  );
  const templateDeliverables = createMockTemplateDeliverables();
  const creatorDeliverables = createMockCreatorDeliverables();

  const deliverableModels = creatorDeliverables.map((deliverable) => {
    const assignment = assignments.find((item) => item.id === deliverable.assignmentId);
    const campaign = campaigns.find((item) => item.id === assignment?.campaignId);

    return toDeliverableDisplayModel({
      deliverable,
      campaignId: campaign?.id ?? 'camp_1',
      campaignTitle: campaign?.title ?? 'Campaign',
      title: resolveDeliverableTitle(deliverable, templateDeliverables),
    });
  });

  return buildCampaignWorkspaceData({
    campaigns,
    assignments,
    applications,
    creatorDeliverables: deliverableModels,
    templateDeliverables,
  });
}

export function createEmptyCampaignWorkspace(): CampaignWorkspaceData {
  return buildCampaignWorkspaceData({
    campaigns: [],
    assignments: [],
    applications: [],
    creatorDeliverables: [],
    templateDeliverables: [],
  });
}
