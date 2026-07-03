import {
  assertNotificationPayloadHasNoSecrets,
  buildExpiringContractNotification,
  buildExpiringDocumentNotification,
  buildMissingDocumentNotification,
  summarizeNotificationItems,
} from './creators-notifications.utils';

describe('creators-notifications.utils', () => {
  const creator = {
    id: 'creator-1',
    organizationId: 'org-1',
    userId: 'user-1',
    displayName: 'Jane Creator',
    email: 'jane@kolab.test',
    country: 'US',
    languages: ['en'],
    assignedRecruiterId: 'recruiter-1',
    status: 'ACTIVE' as const,
    platformCount: 1,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  };

  it('builds missing document notification payloads', () => {
    const payload = buildMissingDocumentNotification({
      status: 'MISSING',
      creator,
      documentType: 'GOVERNMENT_ID',
    });

    expect(payload.itemType).toBe('missing_document');
    expect(payload.status).toBe('MISSING');
    expect(payload.recommendedAction).toContain('Upload');
    expect(payload.dueDate).toBeNull();
  });

  it('builds expiring and expired document notification payloads', () => {
    const baseDocument = {
      id: 'doc-1',
      organizationId: 'org-1',
      creatorProfileId: 'creator-1',
      sourceLeadId: 'lead-1',
      documentType: 'GOVERNMENT_ID' as const,
      status: 'APPROVED' as const,
      title: null,
      expiresAt: '2026-08-01T00:00:00.000Z',
      reviewedById: null,
      reviewedAt: null,
      rejectionReason: null,
      metadata: {},
      deletedAt: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    };

    const expiring = buildExpiringDocumentNotification({
      status: 'EXPIRING',
      creator,
      document: baseDocument,
      expiresAt: '2026-08-01T00:00:00.000Z',
    });
    const expired = buildExpiringDocumentNotification({
      status: 'EXPIRED',
      creator,
      document: baseDocument,
      expiresAt: '2026-06-01T00:00:00.000Z',
    });

    expect(expiring.itemType).toBe('expiring_document');
    expect(expired.itemType).toBe('expired_document');
  });

  it('builds expiring and expired contract notification payloads', () => {
    const baseContract = {
      id: 'contract-1',
      organizationId: 'org-1',
      creatorProfileId: 'creator-1',
      sourceLeadId: 'lead-1',
      contractType: 'CREATOR_AGREEMENT' as const,
      status: 'SIGNED' as const,
      title: '2026 Creator Agreement',
      parentContractId: null,
      validFrom: null,
      validUntil: '2026-08-15T00:00:00.000Z',
      signedAt: '2026-07-01T00:00:00.000Z',
      signedByUserId: 'manager-1',
      externalEnvelopeId: null,
      metadata: {},
      deletedAt: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    };

    const expiring = buildExpiringContractNotification({
      status: 'EXPIRING',
      creator,
      contract: baseContract,
      validUntil: '2026-08-15T00:00:00.000Z',
    });
    const expired = buildExpiringContractNotification({
      status: 'EXPIRED',
      creator,
      contract: baseContract,
      validUntil: '2026-06-01T00:00:00.000Z',
    });

    expect(expiring.itemType).toBe('expiring_contract');
    expect(expired.itemType).toBe('expired_contract');
  });

  it('summarizes notification items by type', () => {
    const summary = summarizeNotificationItems([
      buildMissingDocumentNotification({
        status: 'MISSING',
        creator,
        documentType: 'GOVERNMENT_ID',
      }),
      buildExpiringDocumentNotification({
        status: 'EXPIRING',
        creator,
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
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z',
        },
        expiresAt: '2026-08-01T00:00:00.000Z',
      }),
    ]);

    expect(summary.missingDocuments).toBe(1);
    expect(summary.expiringDocuments).toBe(1);
  });

  it('rejects notification payloads containing storage keys', () => {
    expect(() =>
      assertNotificationPayloadHasNoSecrets([
        {
          itemType: 'expiring_document',
          status: 'EXPIRING',
          creator,
          documentId: 'doc-1',
          dueDate: '2026-08-01T00:00:00.000Z',
          recommendedAction: 'Renew',
          storageKey: 'organizations/org-1/secret',
        } as never,
      ]),
    ).toThrow(/storage keys/);
  });
});
