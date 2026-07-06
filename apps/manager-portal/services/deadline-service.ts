import type { Campaign } from '@kolab/types';
import {
  ListExpiringCreatorContractsResponseSchema,
  ListExpiringCreatorDocumentsResponseSchema,
} from '@kolab/types';

import type { ManagerDeadlinesSummary } from '@/types/operations-center';
import {
  emptyDeadlinesSummary,
  mapCampaignDeadline,
  mapDeliverableDeadline,
  mapExpiringRecordDeadline,
} from '@/types/operations-center-adapters';

export function buildDeadlinesSummary(input: {
  campaigns: Campaign[];
  deliverables: Array<{
    id: string;
    title: string;
    campaignTitle: string;
    dueAt: string;
    overdue: boolean;
  }>;
  expiringDocuments: ReturnType<typeof ListExpiringCreatorDocumentsResponseSchema.parse> | null;
  expiringContracts: ReturnType<typeof ListExpiringCreatorContractsResponseSchema.parse> | null;
}): ManagerDeadlinesSummary {
  const deadlines = emptyDeadlinesSummary();

  for (const campaign of input.campaigns) {
    const deadline = mapCampaignDeadline(campaign);
    if (deadline) deadlines.campaigns.push(deadline);
  }

  for (const deliverable of input.deliverables) {
    deadlines.deliverables.push(mapDeliverableDeadline(deliverable));
  }

  for (const document of input.expiringDocuments?.items ?? []) {
    deadlines.documents.push(
      mapExpiringRecordDeadline({
        id: document.document.id,
        title: document.document.documentType,
        category: 'documents',
        dueAt: document.expiresAt,
        entityLabel: document.creator.displayName,
      }),
    );
  }

  for (const contract of input.expiringContracts?.items ?? []) {
    deadlines.contracts.push(
      mapExpiringRecordDeadline({
        id: contract.contract.id,
        title: contract.contract.contractType,
        category: 'contracts',
        dueAt: contract.validUntil,
        entityLabel: contract.creator.displayName,
      }),
    );
  }

  return deadlines;
}
