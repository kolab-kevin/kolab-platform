import type {
  CreatorExpirationNotificationPreviewItem,
  ExpiringCreatorContractReportItem,
  ExpiringCreatorDocumentReportItem,
  MissingCreatorDocumentReportItem,
} from '@kolab/types';

const RECOMMENDED_ACTIONS = {
  missing_document: 'Upload the required document and submit it for agency review.',
  expiring_document: 'Renew the document before it expires and upload a new version.',
  expired_document: 'Upload a renewed document and resubmit it for review.',
  expiring_contract: 'Review the contract validity window and initiate renewal before expiration.',
  expired_contract: 'Renew or terminate the expired contract and update its status.',
} as const;

export function buildMissingDocumentNotification(
  item: MissingCreatorDocumentReportItem,
): CreatorExpirationNotificationPreviewItem {
  return {
    itemType: 'missing_document',
    status: 'MISSING',
    creator: item.creator,
    documentType: item.documentType,
    dueDate: null,
    recommendedAction: RECOMMENDED_ACTIONS.missing_document,
  };
}

export function buildExpiringDocumentNotification(
  item: ExpiringCreatorDocumentReportItem,
): CreatorExpirationNotificationPreviewItem {
  return {
    itemType: item.status === 'EXPIRED' ? 'expired_document' : 'expiring_document',
    status: item.status,
    creator: item.creator,
    documentType: item.document.documentType,
    documentId: item.document.id,
    dueDate: item.expiresAt,
    recommendedAction:
      item.status === 'EXPIRED'
        ? RECOMMENDED_ACTIONS.expired_document
        : RECOMMENDED_ACTIONS.expiring_document,
  };
}

export function buildExpiringContractNotification(
  item: ExpiringCreatorContractReportItem,
): CreatorExpirationNotificationPreviewItem {
  return {
    itemType: item.status === 'EXPIRED' ? 'expired_contract' : 'expiring_contract',
    status: item.status,
    creator: item.creator,
    contractType: item.contract.contractType,
    contractId: item.contract.id,
    contractTitle: item.contract.title,
    dueDate: item.validUntil,
    recommendedAction:
      item.status === 'EXPIRED'
        ? RECOMMENDED_ACTIONS.expired_contract
        : RECOMMENDED_ACTIONS.expiring_contract,
  };
}

export function summarizeNotificationItems(items: CreatorExpirationNotificationPreviewItem[]) {
  return {
    missingDocuments: items.filter((item) => item.itemType === 'missing_document').length,
    expiringDocuments: items.filter((item) => item.itemType === 'expiring_document').length,
    expiredDocuments: items.filter((item) => item.itemType === 'expired_document').length,
    expiringContracts: items.filter((item) => item.itemType === 'expiring_contract').length,
    expiredContracts: items.filter((item) => item.itemType === 'expired_contract').length,
  };
}

export function assertNotificationPayloadHasNoSecrets(
  payload: CreatorExpirationNotificationPreviewItem[],
): void {
  const serialized = JSON.stringify(payload).toLowerCase();

  if (serialized.includes('storagekey') || serialized.includes('storage_key')) {
    throw new Error('Notification payload must not include storage keys');
  }
}
