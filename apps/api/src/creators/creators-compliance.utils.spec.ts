import type {
  CreatorComplianceDocumentsSummary,
  CreatorOnboardingChecklistResponse,
} from '@kolab/types';

import {
  buildCreatorComplianceContractsSummary,
  buildCreatorComplianceDocumentsSummary,
  buildCreatorComplianceSensitiveAccess,
  deriveCreatorComplianceOverallStatus,
} from './creators-compliance.utils';

const completeOnboarding: CreatorOnboardingChecklistResponse = {
  creatorId: 'creator-1',
  organizationId: 'org-1',
  overallStatus: 'COMPLETE',
  items: [],
};

describe('creators compliance utils', () => {
  it('derives COMPLIANT when onboarding and expiration summaries are clear', () => {
    const documents = buildCreatorComplianceDocumentsSummary({
      missingItems: [],
      expiringItems: [],
    });
    const contracts = buildCreatorComplianceContractsSummary({ expiringItems: [] });

    expect(
      deriveCreatorComplianceOverallStatus({
        onboarding: completeOnboarding,
        documents,
        contracts,
      }),
    ).toBe('COMPLIANT');
  });

  it('derives NON_COMPLIANT when onboarding is incomplete', () => {
    const documents = buildCreatorComplianceDocumentsSummary({
      missingItems: [],
      expiringItems: [],
    });
    const contracts = buildCreatorComplianceContractsSummary({ expiringItems: [] });

    expect(
      deriveCreatorComplianceOverallStatus({
        onboarding: { ...completeOnboarding, overallStatus: 'INCOMPLETE' },
        documents,
        contracts,
      }),
    ).toBe('NON_COMPLIANT');
  });

  it('derives NON_COMPLIANT when required documents are missing or expired', () => {
    const documents = buildCreatorComplianceDocumentsSummary({
      missingItems: [
        {
          status: 'MISSING',
          creator: {
            id: 'creator-1',
            organizationId: 'org-1',
            userId: 'user-1',
            displayName: 'Jane Creator',
            email: null,
            country: 'US',
            languages: ['en'],
            assignedRecruiterId: null,
            status: 'ACTIVE',
            platformCount: 0,
            createdAt: '2026-06-28T12:00:00.000Z',
            updatedAt: '2026-06-28T12:00:00.000Z',
          },
          documentType: 'GOVERNMENT_ID',
        },
      ],
      expiringItems: [],
    });
    const contracts = buildCreatorComplianceContractsSummary({ expiringItems: [] });

    expect(
      deriveCreatorComplianceOverallStatus({
        onboarding: completeOnboarding,
        documents,
        contracts,
      }),
    ).toBe('NON_COMPLIANT');
  });

  it('derives AT_RISK when onboarding has warnings or expiring records exist', () => {
    const documents: CreatorComplianceDocumentsSummary = {
      missing: 0,
      expiring: 1,
      expired: 0,
      missingItems: [],
      expiringItems: [
        {
          status: 'EXPIRING',
          creator: {
            id: 'creator-1',
            organizationId: 'org-1',
            userId: 'user-1',
            displayName: 'Jane Creator',
            email: null,
            country: 'US',
            languages: ['en'],
            assignedRecruiterId: null,
            status: 'ACTIVE',
            platformCount: 0,
            createdAt: '2026-06-28T12:00:00.000Z',
            updatedAt: '2026-06-28T12:00:00.000Z',
          },
          document: {
            id: 'doc-1',
            organizationId: 'org-1',
            creatorProfileId: 'creator-1',
            sourceLeadId: null,
            documentType: 'GOVERNMENT_ID',
            status: 'APPROVED',
            title: null,
            expiresAt: '2026-08-01T00:00:00.000Z',
            reviewedById: null,
            reviewedAt: null,
            rejectionReason: null,
            metadata: {},
            deletedAt: null,
            createdAt: '2026-06-28T12:00:00.000Z',
            updatedAt: '2026-06-28T12:00:00.000Z',
          },
          expiresAt: '2026-08-01T00:00:00.000Z',
        },
      ],
    };
    const contracts = buildCreatorComplianceContractsSummary({ expiringItems: [] });

    expect(
      deriveCreatorComplianceOverallStatus({
        onboarding: { ...completeOnboarding, overallStatus: 'WARNING' },
        documents,
        contracts,
      }),
    ).toBe('AT_RISK');
  });

  it('builds sensitive access requirements without storage metadata', () => {
    const result = buildCreatorComplianceSensitiveAccess({
      documentTypes: ['GOVERNMENT_ID', 'PROFILE_PHOTO', 'PASSPORT'],
      callerCanDownloadSensitive: false,
    });

    expect(result).toEqual({
      sensitiveDocumentTypes: ['GOVERNMENT_ID', 'PASSPORT'],
      downloadRequiresPermission: 'documents:download_sensitive',
      callerCanDownloadSensitive: false,
    });
  });
});
