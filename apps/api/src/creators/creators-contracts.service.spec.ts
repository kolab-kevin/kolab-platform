import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { CreatorsContractsService } from './creators-contracts.service';
import { assertAllowedContractStatusTransition } from './creators-contracts.utils';

jest.mock('@kolab/storage', () => ({
  getPresignedDownloadUrl: jest.fn().mockResolvedValue({
    url: 'https://example.com/download',
    expiresAt: '2026-07-02T12:05:00.000Z',
  }),
  loadStorageConfig: jest.fn().mockReturnValue({
    provider: 'minio',
    bucket: 'kolab-dev',
    region: 'us-east-1',
    endpoint: 'http://localhost:9000',
    accessKeyId: 'key',
    secretAccessKey: 'secret',
    forcePathStyle: true,
    maxFileSizeBytes: 25 * 1024 * 1024,
  }),
  sanitizeFileName: jest.fn((fileName: string) => fileName),
  validateStorageKey: jest.fn(),
  validateUploadMetadata: jest.fn().mockReturnValue({
    fileName: 'agreement.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2048,
  }),
  StorageKeyError: class StorageKeyError extends Error {
    name = 'StorageKeyError';
  },
  UploadValidationError: class UploadValidationError extends Error {
    name = 'UploadValidationError';
  },
}));

jest.mock('@kolab/database', () => ({
  prisma: {
    creatorProfile: {
      findFirst: jest.fn(),
    },
    creatorContract: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    creatorContractVersion: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  CreatorContractStatus: {
    DRAFT: 'DRAFT',
    SENT: 'SENT',
    VIEWED: 'VIEWED',
    SIGNED: 'SIGNED',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED',
    TERMINATED: 'TERMINATED',
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
}));

import type { AccessTokenPayload } from '@kolab/auth';
import { prisma } from '@kolab/database';
import {
  getPresignedDownloadUrl,
  validateStorageKey,
  validateUploadMetadata,
} from '@kolab/storage';

const managerToken: AccessTokenPayload = {
  sub: 'manager-1',
  email: 'manager@kolab.test',
  role: 'ADMIN',
  organizationId: 'org-1',
  organizationRole: 'AGENCY_MANAGER',
  sessionId: 'session-1',
  isSystemAdmin: false,
};

const otherOrgToken: AccessTokenPayload = {
  ...managerToken,
  sub: 'manager-2',
  organizationId: 'org-2',
};

const baseCreatorProfile = {
  id: 'creator-1',
  organizationId: 'org-1',
  sourceLeadId: 'lead-1',
};

const baseContract = {
  id: 'contract-1',
  organizationId: 'org-1',
  creatorProfileId: 'creator-1',
  sourceLeadId: 'lead-1',
  contractType: 'CREATOR_AGREEMENT',
  status: 'DRAFT',
  title: '2026 Creator Agreement',
  parentContractId: null,
  validFrom: null,
  validUntil: null,
  signedAt: null,
  signedByUserId: null,
  externalEnvelopeId: null,
  metadata: {},
  deletedAt: null,
  createdAt: new Date('2026-07-02T12:00:00.000Z'),
  updatedAt: new Date('2026-07-02T12:00:00.000Z'),
};

const baseVersion = {
  id: 'ver-1',
  organizationId: 'org-1',
  contractId: 'contract-1',
  versionNumber: 1,
  storageKey:
    'organizations/org-1/creators/creator-1/contracts/contract-1/versions/ver-1/agreement.pdf',
  fileName: 'agreement.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 2048,
  checksum: 'abc123',
  signedAt: null,
  signedByUserId: null,
  externalEnvelopeId: null,
  metadata: {},
  createdAt: new Date('2026-07-02T12:10:00.000Z'),
};

const validStorageKey =
  'organizations/org-1/creators/creator-1/contracts/contract-1/versions/ver-1/agreement.pdf';

describe('CreatorsContractsService', () => {
  let service: CreatorsContractsService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CreatorsContractsService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(CreatorsContractsService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(baseCreatorProfile);
  });

  it('lists contracts for a creator in the active organization', async () => {
    (prisma.creatorContract.findMany as jest.Mock).mockResolvedValue([baseContract]);

    const result = await service.listContracts(managerToken, 'creator-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('contract-1');
  });

  it('returns contract detail with versions', async () => {
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue({
      ...baseContract,
      versions: [baseVersion],
    });

    const result = await service.getContract(managerToken, 'creator-1', 'contract-1');

    expect(result.id).toBe('contract-1');
    expect(result.versions).toHaveLength(1);
  });

  it('creates a contract and audits the event', async () => {
    (prisma.creatorContract.create as jest.Mock).mockResolvedValue(baseContract);

    const result = await service.createContract(managerToken, 'creator-1', {
      contractType: 'CREATOR_AGREEMENT',
      title: '2026 Creator Agreement',
    });

    expect(result.status).toBe('DRAFT');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_CONTRACT_CREATED,
        targetType: AUDIT_TARGET_TYPE.CREATOR_CONTRACT,
      }),
    );
  });

  it('updates contract metadata and audits the event', async () => {
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue(baseContract);
    (prisma.creatorContract.update as jest.Mock).mockResolvedValue({
      ...baseContract,
      title: 'Updated Agreement',
    });

    const result = await service.updateContract(managerToken, 'creator-1', 'contract-1', {
      title: 'Updated Agreement',
    });

    expect(result.title).toBe('Updated Agreement');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_CONTRACT_UPDATED,
      }),
    );
  });

  it('adds a version with storage validation and audits the event', async () => {
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue(baseContract);
    (prisma.creatorContractVersion.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.creatorContractVersion.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
      callback({
        creatorContractVersion: { create: jest.fn() },
        creatorContract: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({
            ...baseContract,
            versions: [baseVersion],
          }),
        },
      }),
    );

    const result = await service.addContractVersion(managerToken, 'creator-1', 'contract-1', {
      storageKey: validStorageKey,
      fileName: 'agreement.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
    });

    expect(validateStorageKey).toHaveBeenCalledWith('org-1', validStorageKey);
    expect(validateUploadMetadata).toHaveBeenCalled();
    expect(result.versions).toHaveLength(1);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_CONTRACT_VERSION_ADDED,
      }),
    );
  });

  it('allows valid status transitions and sets signed timestamps', async () => {
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue({
      ...baseContract,
      status: 'SENT',
      versions: [baseVersion],
    });
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
      callback({
        creatorContractVersion: { update: jest.fn() },
        creatorContract: {
          update: jest.fn().mockResolvedValue({
            ...baseContract,
            status: 'SIGNED',
            signedAt: new Date('2026-07-02T14:00:00.000Z'),
            signedByUserId: 'manager-1',
          }),
        },
      }),
    );

    const result = await service.updateContractStatus(managerToken, 'creator-1', 'contract-1', {
      status: 'SIGNED',
    });

    expect(result.status).toBe('SIGNED');
    expect(result.signedByUserId).toBe('manager-1');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_CONTRACT_STATUS_CHANGED,
        metadata: expect.objectContaining({
          previousStatus: 'SENT',
          status: 'SIGNED',
        }),
      }),
    );
  });

  it('rejects invalid status transitions', async () => {
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue({
      ...baseContract,
      status: 'DRAFT',
      versions: [],
    });

    await expect(
      service.updateContractStatus(managerToken, 'creator-1', 'contract-1', {
        status: 'SIGNED',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects signed contract title updates', async () => {
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue({
      ...baseContract,
      status: 'SIGNED',
    });

    await expect(
      service.updateContract(managerToken, 'creator-1', 'contract-1', {
        title: 'Changed title',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows signed contract metadata-only updates', async () => {
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue({
      ...baseContract,
      status: 'SIGNED',
    });
    (prisma.creatorContract.update as jest.Mock).mockResolvedValue({
      ...baseContract,
      status: 'SIGNED',
      metadata: { amendmentNote: 'Termination scheduled' },
    });

    const result = await service.updateContract(managerToken, 'creator-1', 'contract-1', {
      metadata: { amendmentNote: 'Termination scheduled' },
    });

    expect(result.metadata).toEqual({ amendmentNote: 'Termination scheduled' });
  });

  it('rejects new versions on signed contracts', async () => {
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue({
      ...baseContract,
      status: 'SIGNED',
    });

    await expect(
      service.addContractVersion(managerToken, 'creator-1', 'contract-1', {
        storageKey: validStorageKey,
        fileName: 'agreement.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns presigned download URLs and audits downloads', async () => {
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue({
      ...baseContract,
      versions: [baseVersion],
    });

    const result = await service.downloadContract(managerToken, 'creator-1', 'contract-1');

    expect(getPresignedDownloadUrl).toHaveBeenCalled();
    expect(result.downloadUrl).toBe('https://example.com/download');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_CONTRACT_DOWNLOADED,
      }),
    );
  });

  it('rejects raw file payloads when adding a version', async () => {
    (validateUploadMetadata as jest.Mock).mockImplementationOnce(() => {
      throw new (jest.requireMock('@kolab/storage').UploadValidationError)(
        'Raw file upload fields are not allowed',
      );
    });
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue(baseContract);

    await expect(
      service.addContractVersion(managerToken, 'creator-1', 'contract-1', {
        storageKey: validStorageKey,
        fileName: 'agreement.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('enforces organization isolation', async () => {
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getContract(otherOrgToken, 'creator-1', 'contract-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects contract and creator mismatches via scoped lookup', async () => {
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getContract(managerToken, 'creator-1', 'contract-other')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects users without active organization membership', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.listContracts(managerToken, 'creator-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects duplicate version ids', async () => {
    (prisma.creatorContract.findFirst as jest.Mock).mockResolvedValue(baseContract);
    (prisma.creatorContractVersion.findUnique as jest.Mock).mockResolvedValue(baseVersion);

    await expect(
      service.addContractVersion(managerToken, 'creator-1', 'contract-1', {
        storageKey: validStorageKey,
        fileName: 'agreement.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
      }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('contract status workflow helpers', () => {
  it('allows DRAFT to SENT', () => {
    expect(() => assertAllowedContractStatusTransition('DRAFT', 'SENT')).not.toThrow();
  });

  it('rejects DRAFT to SIGNED directly', () => {
    expect(() => assertAllowedContractStatusTransition('DRAFT', 'SIGNED')).toThrow(
      BadRequestException,
    );
  });

  it('allows SIGNED to TERMINATED', () => {
    expect(() => assertAllowedContractStatusTransition('SIGNED', 'TERMINATED')).not.toThrow();
  });
});
