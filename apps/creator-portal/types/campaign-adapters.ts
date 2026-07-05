import type {
  Campaign,
  CampaignApplication,
  CampaignApplicationStatus,
  CampaignAssignmentStatus,
  CampaignCreatorAssignment,
  CampaignCreatorDeliverable,
  CampaignCreatorDeliverableStatus,
  CampaignDeliverable,
} from '@kolab/types';

export type AssignedCampaignDisplayModel = {
  assignmentId: string;
  campaignId: string;
  campaignTitle: string;
  brandName: string | null;
  campaignStatus: Campaign['status'];
  assignmentStatus: CampaignAssignmentStatus;
  priority: string | null;
  startsAt: string | null;
  endsAt: string | null;
  dueAt: string | null;
  progressPercent: number | null;
  deliverableCount: number;
};

export type DeliverableDisplayModel = {
  id: string;
  assignmentId: string;
  campaignId: string;
  campaignTitle: string;
  title: string;
  status: CampaignCreatorDeliverableStatus;
  dueAt: string | null;
  bucket: DeliverableBucket;
};

export type DeliverableBucket = 'pending' | 'submitted' | 'approved' | 'rejected' | 'overdue';

export type GroupedDeliverables = Record<DeliverableBucket, DeliverableDisplayModel[]>;

export type ApplicationDisplayModel = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  brandName: string | null;
  status: CampaignApplicationStatus;
  bucket: ApplicationBucket;
  dueAt: string | null;
};

export type ApplicationBucket = 'draft' | 'applied' | 'accepted' | 'rejected';

export type GroupedApplications = Record<ApplicationBucket, ApplicationDisplayModel[]>;

export type CampaignDetailDisplayModel = {
  campaign: Campaign;
  templateDeliverables: CampaignDeliverable[];
  creatorDeliverables: DeliverableDisplayModel[];
  assignment: CampaignCreatorAssignment | null;
};

export type CampaignWorkspaceData = {
  assignedCampaigns: AssignedCampaignDisplayModel[];
  deliverables: GroupedDeliverables;
  applications: GroupedApplications;
  campaignsById: Record<string, Campaign>;
  templateDeliverablesByCampaignId: Record<string, CampaignDeliverable[]>;
};

export type CampaignWorkspaceView = 'list' | 'kanban' | 'calendar';

function readMetadataString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === 'string' ? value : null;
}

function readMetadataNumber(metadata: Record<string, unknown>, key: string): number | null {
  const value = metadata[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function formatCampaignStatus(status: string): string {
  return status.replaceAll('_', ' ');
}

export function getDeliverableBucket(
  deliverable: CampaignCreatorDeliverable,
  now: Date = new Date(),
): DeliverableBucket {
  if (deliverable.status === 'SUBMITTED') return 'submitted';
  if (deliverable.status === 'APPROVED') return 'approved';
  if (deliverable.status === 'REJECTED') return 'rejected';

  if (
    deliverable.dueAt &&
    (deliverable.status === 'ASSIGNED' || deliverable.status === 'IN_PROGRESS') &&
    new Date(deliverable.dueAt) < now
  ) {
    return 'overdue';
  }

  if (deliverable.status === 'ASSIGNED' || deliverable.status === 'IN_PROGRESS') {
    return 'pending';
  }

  return 'pending';
}

export function getApplicationBucket(status: CampaignApplicationStatus): ApplicationBucket | null {
  switch (status) {
    case 'INVITED':
      return 'draft';
    case 'APPLIED':
      return 'applied';
    case 'ACCEPTED':
      return 'accepted';
    case 'REJECTED':
      return 'rejected';
    default:
      return null;
  }
}

export function toDeliverableDisplayModel(input: {
  deliverable: CampaignCreatorDeliverable;
  campaignId: string;
  campaignTitle: string;
  title: string;
}): DeliverableDisplayModel {
  return {
    id: input.deliverable.id,
    assignmentId: input.deliverable.assignmentId,
    campaignId: input.campaignId,
    campaignTitle: input.campaignTitle,
    title: input.title,
    status: input.deliverable.status,
    dueAt: input.deliverable.dueAt,
    bucket: getDeliverableBucket(input.deliverable),
  };
}

export function toApplicationDisplayModel(input: {
  application: CampaignApplication;
  campaignTitle: string;
  brandName: string | null;
  dueAt: string | null;
}): ApplicationDisplayModel | null {
  const bucket = getApplicationBucket(input.application.status);
  if (!bucket) return null;

  return {
    id: input.application.id,
    campaignId: input.application.campaignId,
    campaignTitle: input.campaignTitle,
    brandName: input.brandName,
    status: input.application.status,
    bucket,
    dueAt: input.dueAt,
  };
}

export function toAssignedCampaignDisplayModel(input: {
  campaign: Campaign;
  assignment: CampaignCreatorAssignment;
  deliverableCount: number;
  dueAt: string | null;
}): AssignedCampaignDisplayModel {
  const metadata = input.assignment.metadata;

  return {
    assignmentId: input.assignment.id,
    campaignId: input.campaign.id,
    campaignTitle: input.campaign.title,
    brandName: input.campaign.brandName,
    campaignStatus: input.campaign.status,
    assignmentStatus: input.assignment.status,
    priority: readMetadataString(metadata, 'priority'),
    startsAt: input.campaign.startsAt,
    endsAt: input.campaign.endsAt,
    dueAt: input.dueAt,
    progressPercent: readMetadataNumber(metadata, 'progressPercent'),
    deliverableCount: input.deliverableCount,
  };
}

export function groupDeliverables(items: DeliverableDisplayModel[]): GroupedDeliverables {
  const grouped: GroupedDeliverables = {
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

export function groupApplications(items: ApplicationDisplayModel[]): GroupedApplications {
  const grouped: GroupedApplications = {
    draft: [],
    applied: [],
    accepted: [],
    rejected: [],
  };

  for (const item of items) {
    grouped[item.bucket].push(item);
  }

  return grouped;
}

export function extractCampaignDetailSections(campaign: Campaign): {
  description: string | null;
  requirements: Array<{ label: string; value: string }>;
  brief: Array<{ label: string; value: string }>;
  compensation: string | null;
  categories: string[];
  platforms: string[];
  creatorResponsibilities: string[];
  timeline: Array<{ label: string; value: string }>;
} {
  const requirements = metadataEntries(campaign.requirements);
  const brief = metadataEntries(campaign.brief);

  const compensation =
    campaign.budgetAmount && campaign.budgetCurrency
      ? `${campaign.budgetAmount} ${campaign.budgetCurrency}`
      : readMetadataString(campaign.metadata, 'compensation');

  return {
    description: campaign.description,
    requirements,
    brief,
    compensation,
    categories: readMetadataStringArray(campaign.metadata, 'categories'),
    platforms: readMetadataStringArray(campaign.brief, 'platforms'),
    creatorResponsibilities: readMetadataStringArray(campaign.requirements, 'responsibilities'),
    timeline: [
      ...(campaign.startsAt
        ? [{ label: 'Starts', value: new Date(campaign.startsAt).toLocaleDateString() }]
        : []),
      ...(campaign.endsAt
        ? [{ label: 'Ends', value: new Date(campaign.endsAt).toLocaleDateString() }]
        : []),
      ...(campaign.applicationDeadline
        ? [
            {
              label: 'Application deadline',
              value: new Date(campaign.applicationDeadline).toLocaleDateString(),
            },
          ]
        : []),
    ],
  };
}

function metadataEntries(
  metadata: Record<string, unknown>,
): Array<{ label: string; value: string }> {
  return Object.entries(metadata).map(([key, value]) => ({
    label: key.replaceAll('_', ' '),
    value: formatMetadataValue(value),
  }));
}

function formatMetadataValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ');
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function readMetadataStringArray(metadata: Record<string, unknown>, key: string): string[] {
  const value = metadata[key];
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

export function buildCampaignWorkspaceData(input: {
  campaigns: Campaign[];
  assignments: CampaignCreatorAssignment[];
  applications: CampaignApplication[];
  creatorDeliverables: DeliverableDisplayModel[];
  templateDeliverables: CampaignDeliverable[];
}): CampaignWorkspaceData {
  const campaignsById = Object.fromEntries(
    input.campaigns.map((campaign) => [campaign.id, campaign]),
  );
  const templateDeliverablesByCampaignId: Record<string, CampaignDeliverable[]> = {};

  for (const deliverable of input.templateDeliverables) {
    templateDeliverablesByCampaignId[deliverable.campaignId] ??= [];
    templateDeliverablesByCampaignId[deliverable.campaignId]?.push(deliverable);
  }

  const assignedCampaigns = input.assignments
    .map((assignment) => {
      const campaign = campaignsById[assignment.campaignId];
      if (!campaign) return null;

      const deliverablesForAssignment = input.creatorDeliverables.filter(
        (item) => item.assignmentId === assignment.id,
      );
      const dueAt =
        deliverablesForAssignment
          .map((item) => item.dueAt)
          .filter((value): value is string => Boolean(value))
          .sort()[0] ?? null;

      return toAssignedCampaignDisplayModel({
        campaign,
        assignment,
        deliverableCount: deliverablesForAssignment.length,
        dueAt,
      });
    })
    .filter((item): item is AssignedCampaignDisplayModel => item !== null);

  const applicationModels = input.applications
    .map((application) => {
      const campaign = campaignsById[application.campaignId];
      if (!campaign) return null;

      return toApplicationDisplayModel({
        application,
        campaignTitle: campaign.title,
        brandName: campaign.brandName,
        dueAt: campaign.applicationDeadline,
      });
    })
    .filter((item): item is ApplicationDisplayModel => item !== null);

  return {
    assignedCampaigns,
    deliverables: groupDeliverables(input.creatorDeliverables),
    applications: groupApplications(applicationModels),
    campaignsById,
    templateDeliverablesByCampaignId,
  };
}

export function toCampaignDetailDisplayModel(input: {
  campaign: Campaign;
  templateDeliverables: CampaignDeliverable[];
  creatorDeliverables: DeliverableDisplayModel[];
  assignment: CampaignCreatorAssignment | null;
}): CampaignDetailDisplayModel {
  return input;
}
