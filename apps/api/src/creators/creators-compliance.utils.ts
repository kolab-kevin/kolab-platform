import type {
  CreatorComplianceContractsSummary,
  CreatorComplianceDocumentsSummary,
  CreatorComplianceOverallStatus,
  CreatorComplianceSensitiveAccess,
  CreatorDocumentType,
  CreatorOnboardingChecklistResponse,
} from '@kolab/types';

import { isSensitiveDocumentType } from './creators-documents.utils';

export function buildCreatorComplianceDocumentsSummary(input: {
  missingItems: CreatorComplianceDocumentsSummary['missingItems'];
  expiringItems: CreatorComplianceDocumentsSummary['expiringItems'];
}): CreatorComplianceDocumentsSummary {
  const expiring = input.expiringItems.filter((item) => item.status === 'EXPIRING').length;
  const expired = input.expiringItems.filter((item) => item.status === 'EXPIRED').length;

  return {
    missing: input.missingItems.length,
    expiring,
    expired,
    missingItems: input.missingItems,
    expiringItems: input.expiringItems,
  };
}

export function buildCreatorComplianceContractsSummary(input: {
  expiringItems: CreatorComplianceContractsSummary['expiringItems'];
}): CreatorComplianceContractsSummary {
  const expiring = input.expiringItems.filter((item) => item.status === 'EXPIRING').length;
  const expired = input.expiringItems.filter((item) => item.status === 'EXPIRED').length;

  return {
    expiring,
    expired,
    expiringItems: input.expiringItems,
  };
}

export function buildCreatorComplianceSensitiveAccess(input: {
  documentTypes: CreatorDocumentType[];
  callerCanDownloadSensitive: boolean;
}): CreatorComplianceSensitiveAccess {
  const sensitiveDocumentTypes = [
    ...new Set(input.documentTypes.filter((documentType) => isSensitiveDocumentType(documentType))),
  ];

  return {
    sensitiveDocumentTypes,
    downloadRequiresPermission: 'documents:download_sensitive',
    callerCanDownloadSensitive: input.callerCanDownloadSensitive,
  };
}

export function deriveCreatorComplianceOverallStatus(input: {
  onboarding: CreatorOnboardingChecklistResponse;
  documents: CreatorComplianceDocumentsSummary;
  contracts: CreatorComplianceContractsSummary;
}): CreatorComplianceOverallStatus {
  if (input.onboarding.overallStatus === 'INCOMPLETE') {
    return 'NON_COMPLIANT';
  }

  if (input.documents.missing > 0 || input.documents.expired > 0 || input.contracts.expired > 0) {
    return 'NON_COMPLIANT';
  }

  if (
    input.onboarding.overallStatus === 'WARNING' ||
    input.documents.expiring > 0 ||
    input.contracts.expiring > 0
  ) {
    return 'AT_RISK';
  }

  return 'COMPLIANT';
}
