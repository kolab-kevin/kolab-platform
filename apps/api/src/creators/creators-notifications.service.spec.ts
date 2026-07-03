import type { AccessTokenPayload } from '@kolab/auth';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION } from '../audit/audit-actions';
import { CreatorsNotificationsService } from './creators-notifications.service';
import { CreatorsReportingService } from './creators-reporting.service';

const managerToken: AccessTokenPayload = {
  sub: 'manager-1',
  email: 'manager@kolab.test',
  role: 'ADMIN',
  organizationId: 'org-1',
  organizationRole: 'AGENCY_MANAGER',
  sessionId: 'session-1',
  isSystemAdmin: false,
};

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

describe('CreatorsNotificationsService', () => {
  let service: CreatorsNotificationsService;
  let reportingService: jest.Mocked<CreatorsReportingService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    reportingService = {
      listMissingDocuments: jest.fn(),
      listExpiringDocuments: jest.fn(),
      listExpiringContracts: jest.fn(),
    } as unknown as jest.Mocked<CreatorsReportingService>;

    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsNotificationsService,
        { provide: CreatorsReportingService, useValue: reportingService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(CreatorsNotificationsService);
    jest.clearAllMocks();
  });

  it('previews missing document notifications', async () => {
    reportingService.listMissingDocuments.mockResolvedValue({
      items: [{ status: 'MISSING', creator, documentType: 'GOVERNMENT_ID' }],
      nextCursor: null,
    });
    reportingService.listExpiringDocuments.mockResolvedValue({ items: [], nextCursor: null });
    reportingService.listExpiringContracts.mockResolvedValue({ items: [], nextCursor: null });

    const result = await service.previewExpirationNotifications(managerToken, {
      days: 30,
      includeExpired: true,
    });

    expect(result.summary.missingDocuments).toBe(1);
    expect(result.items[0].itemType).toBe('missing_document');
  });

  it('previews expiring document notifications', async () => {
    reportingService.listMissingDocuments.mockResolvedValue({ items: [], nextCursor: null });
    reportingService.listExpiringDocuments
      .mockResolvedValueOnce({
        items: [
          {
            status: 'EXPIRING',
            creator,
            document: baseDocument,
            expiresAt: baseDocument.expiresAt,
          },
        ],
        nextCursor: null,
      })
      .mockResolvedValueOnce({ items: [], nextCursor: null });
    reportingService.listExpiringContracts.mockResolvedValue({ items: [], nextCursor: null });

    const result = await service.previewExpirationNotifications(managerToken, {
      days: 30,
      includeExpired: true,
    });

    expect(result.summary.expiringDocuments).toBe(1);
    expect(result.items.some((item) => item.itemType === 'expiring_document')).toBe(true);
  });

  it('previews expired document notifications when includeExpired is true', async () => {
    reportingService.listMissingDocuments.mockResolvedValue({ items: [], nextCursor: null });
    reportingService.listExpiringDocuments
      .mockResolvedValueOnce({ items: [], nextCursor: null })
      .mockResolvedValueOnce({
        items: [
          {
            status: 'EXPIRED',
            creator,
            document: baseDocument,
            expiresAt: '2026-06-01T00:00:00.000Z',
          },
        ],
        nextCursor: null,
      });
    reportingService.listExpiringContracts.mockResolvedValue({ items: [], nextCursor: null });

    const result = await service.previewExpirationNotifications(managerToken, {
      days: 30,
      includeExpired: true,
    });

    expect(result.summary.expiredDocuments).toBe(1);
    expect(result.items.some((item) => item.itemType === 'expired_document')).toBe(true);
  });

  it('previews expiring contract notifications', async () => {
    reportingService.listMissingDocuments.mockResolvedValue({ items: [], nextCursor: null });
    reportingService.listExpiringDocuments.mockResolvedValue({ items: [], nextCursor: null });
    reportingService.listExpiringContracts
      .mockResolvedValueOnce({
        items: [
          {
            status: 'EXPIRING',
            creator,
            contract: baseContract,
            validUntil: baseContract.validUntil,
          },
        ],
        nextCursor: null,
      })
      .mockResolvedValueOnce({ items: [], nextCursor: null });

    const result = await service.previewExpirationNotifications(managerToken, {
      days: 30,
      includeExpired: true,
    });

    expect(result.summary.expiringContracts).toBe(1);
    expect(result.items.some((item) => item.itemType === 'expiring_contract')).toBe(true);
  });

  it('does not include storage keys in notification payloads', async () => {
    reportingService.listMissingDocuments.mockResolvedValue({ items: [], nextCursor: null });
    reportingService.listExpiringDocuments
      .mockResolvedValueOnce({
        items: [
          {
            status: 'EXPIRING',
            creator,
            document: baseDocument,
            expiresAt: baseDocument.expiresAt,
          },
        ],
        nextCursor: null,
      })
      .mockResolvedValueOnce({ items: [], nextCursor: null });
    reportingService.listExpiringContracts.mockResolvedValue({ items: [], nextCursor: null });

    const result = await service.previewExpirationNotifications(managerToken, {
      days: 30,
      includeExpired: false,
    });

    expect(JSON.stringify(result)).not.toMatch(/storageKey/i);
  });

  it('audits notification preview generation', async () => {
    reportingService.listMissingDocuments.mockResolvedValue({ items: [], nextCursor: null });
    reportingService.listExpiringDocuments.mockResolvedValue({ items: [], nextCursor: null });
    reportingService.listExpiringContracts.mockResolvedValue({ items: [], nextCursor: null });

    await service.previewExpirationNotifications(managerToken, {
      days: 30,
      includeExpired: true,
    });

    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_DOCUMENT_NOTIFICATION_PREVIEWED,
        organizationId: 'org-1',
      }),
    );
  });

  it('scopes preview generation to the active organization', async () => {
    reportingService.listMissingDocuments.mockResolvedValue({ items: [], nextCursor: null });
    reportingService.listExpiringDocuments.mockResolvedValue({ items: [], nextCursor: null });
    reportingService.listExpiringContracts.mockResolvedValue({ items: [], nextCursor: null });

    const result = await service.previewExpirationNotifications(managerToken, {
      days: 30,
      includeExpired: true,
    });

    expect(result.organizationId).toBe('org-1');
    expect(reportingService.listMissingDocuments).toHaveBeenCalledWith(
      managerToken,
      expect.any(Object),
    );
  });
});

describe('CreatorsReportingController notification preview authorization', () => {
  it('requires organization context through the notifications service', async () => {
    const reportingService = {
      listMissingDocuments: jest.fn().mockRejectedValue(new ForbiddenException()),
      listExpiringDocuments: jest.fn(),
      listExpiringContracts: jest.fn(),
    } as unknown as jest.Mocked<CreatorsReportingService>;

    const auditService = {
      record: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsNotificationsService,
        { provide: CreatorsReportingService, useValue: reportingService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    const service = module.get(CreatorsNotificationsService);

    await expect(
      service.previewExpirationNotifications(
        { ...managerToken, organizationId: undefined },
        { days: 30, includeExpired: true },
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
