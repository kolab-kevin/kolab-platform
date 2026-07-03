import type {
  Campaign as PrismaCampaign,
  CampaignDeliverable as PrismaCampaignDeliverable,
} from '@kolab/database';
import type { Campaign, CampaignDeliverable } from '@kolab/types';

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
