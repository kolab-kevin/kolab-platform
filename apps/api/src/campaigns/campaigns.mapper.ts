import type {
  Campaign as PrismaCampaign,
  CampaignApplication as PrismaCampaignApplication,
  CampaignCreatorAssignment as PrismaCampaignCreatorAssignment,
  CampaignCreatorDeliverable as PrismaCampaignCreatorDeliverable,
  CampaignDeliverable as PrismaCampaignDeliverable,
} from '@kolab/database';
import type {
  Campaign,
  CampaignApplication,
  CampaignCreatorAssignment,
  CampaignCreatorDeliverable,
  CampaignDeliverable,
} from '@kolab/types';

import { toMetadataRecord } from './campaigns.utils';

function decimalToString(value: PrismaCampaign['budgetAmount']): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value.toString();
}

export function toCampaign(campaign: PrismaCampaign): Campaign {
  return {
    id: campaign.id,
    organizationId: campaign.organizationId,
    title: campaign.title,
    description: campaign.description,
    brandName: campaign.brandName,
    campaignType: campaign.campaignType as Campaign['campaignType'],
    status: campaign.status as Campaign['status'],
    budgetAmount: decimalToString(campaign.budgetAmount),
    budgetCurrency: campaign.budgetCurrency,
    startsAt: campaign.startsAt?.toISOString() ?? null,
    endsAt: campaign.endsAt?.toISOString() ?? null,
    applicationDeadline: campaign.applicationDeadline?.toISOString() ?? null,
    brief: toMetadataRecord(campaign.brief),
    requirements: toMetadataRecord(campaign.requirements),
    metadata: toMetadataRecord(campaign.metadata),
    createdByUserId: campaign.createdByUserId,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };
}

export function toCampaignDeliverable(deliverable: PrismaCampaignDeliverable): CampaignDeliverable {
  return {
    id: deliverable.id,
    organizationId: deliverable.organizationId,
    campaignId: deliverable.campaignId,
    title: deliverable.title,
    description: deliverable.description,
    status: deliverable.status as CampaignDeliverable['status'],
    dueAt: deliverable.dueAt?.toISOString() ?? null,
    requirements: toMetadataRecord(deliverable.requirements),
    metadata: toMetadataRecord(deliverable.metadata),
    createdAt: deliverable.createdAt.toISOString(),
    updatedAt: deliverable.updatedAt.toISOString(),
  };
}

export function toCampaignApplication(application: PrismaCampaignApplication): CampaignApplication {
  return {
    id: application.id,
    organizationId: application.organizationId,
    campaignId: application.campaignId,
    creatorProfileId: application.creatorProfileId,
    status: application.status as CampaignApplication['status'],
    source: application.source as CampaignApplication['source'],
    message: application.message,
    invitedByUserId: application.invitedByUserId,
    appliedAt: application.appliedAt?.toISOString() ?? null,
    reviewedByUserId: application.reviewedByUserId,
    reviewedAt: application.reviewedAt?.toISOString() ?? null,
    decisionReason: application.decisionReason,
    metadata: toMetadataRecord(application.metadata),
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}

export function toCampaignCreatorAssignment(
  assignment: PrismaCampaignCreatorAssignment,
): CampaignCreatorAssignment {
  return {
    id: assignment.id,
    organizationId: assignment.organizationId,
    campaignId: assignment.campaignId,
    creatorProfileId: assignment.creatorProfileId,
    applicationId: assignment.applicationId,
    status: assignment.status as CampaignCreatorAssignment['status'],
    assignedByUserId: assignment.assignedByUserId,
    assignedAt: assignment.assignedAt.toISOString(),
    acceptedAt: assignment.acceptedAt?.toISOString() ?? null,
    completedAt: assignment.completedAt?.toISOString() ?? null,
    cancelledAt: assignment.cancelledAt?.toISOString() ?? null,
    metadata: toMetadataRecord(assignment.metadata),
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  };
}

export function toCampaignCreatorDeliverable(
  deliverable: PrismaCampaignCreatorDeliverable,
): CampaignCreatorDeliverable {
  return {
    id: deliverable.id,
    organizationId: deliverable.organizationId,
    assignmentId: deliverable.assignmentId,
    campaignDeliverableId: deliverable.campaignDeliverableId,
    status: deliverable.status as CampaignCreatorDeliverable['status'],
    dueAt: deliverable.dueAt?.toISOString() ?? null,
    submittedAt: deliverable.submittedAt?.toISOString() ?? null,
    approvedAt: deliverable.approvedAt?.toISOString() ?? null,
    rejectedAt: deliverable.rejectedAt?.toISOString() ?? null,
    rejectionReason: deliverable.rejectionReason,
    submissionUrl: deliverable.submissionUrl,
    notes: deliverable.notes,
    metadata: toMetadataRecord(deliverable.metadata),
    createdAt: deliverable.createdAt.toISOString(),
    updatedAt: deliverable.updatedAt.toISOString(),
  };
}
