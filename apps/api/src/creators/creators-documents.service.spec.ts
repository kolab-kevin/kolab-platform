import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { CreatorsDocumentsService } from './creators-documents.service';

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
    fileName: 'passport.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
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
    creatorDocument: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    creatorDocumentVersion: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    organizationMembership: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  CreatorDocumentStatus: {
    REQUESTED: 'REQUESTED',
    UPLOADED: 'UPLOADED',
    UNDER_REVIEW: 'UNDER_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    EXPIRED: 'EXPIRED',
    ARCHIVED: 'ARCHIVED',
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
import { ReviewCreatorDocumentSchema } from '@kolab/types';

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

const baseDocument = {
  id: 'doc-1',
  organizationId: 'org-1',
  creatorProfileId: 'creator-1',
  sourceLeadId: 'lead-1',
  documentType: 'GOVERNMENT_ID',
  status: 'REQUESTED',
  title: null,
  expiresAt: null,
  reviewedById: null,
  reviewedAt: null,
  rejectionReason: null,
  metadata: {},
  deletedAt: null,
  createdAt: new Date('2026-07-02T12:00:00.000Z'),
  updatedAt: new Date('2026-07-02T12:00:00.000Z'),
};

const baseVersion = {
  id: 'ver-1',
  organizationId: 'org-1',
  documentId: 'doc-1',
  versionNumber: 1,
  storageKey: 'organizations/org-1/creators/creator-1/documents/doc-1/versions/ver-1/passport.pdf',
  fileName: 'passport.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 1024,
  checksum: 'abc123',
  uploadedById: 'manager-1',
  uploadedAt: new Date('2026-07-02T12:10:00.000Z'),
  metadata: {},
  createdAt: new Date('2026-07-02T12:10:00.000Z'),
};

const validStorageKey =
  'organizations/org-1/creators/creator-1/documents/doc-1/versions/ver-1/passport.pdf';

describe('CreatorsDocumentsService', () => {
  let service: CreatorsDocumentsService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CreatorsDocumentsService, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(CreatorsDocumentsService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
    (prisma.creatorProfile.findFirst as jest.Mock).mockResolvedValue(baseCreatorProfile);
  });

  it('lists documents for a creator in the active organization', async () => {
    (prisma.creatorDocument.findMany as jest.Mock).mockResolvedValue([baseDocument]);

    const result = await service.listDocuments(managerToken, 'creator-1');

    expect(prisma.creatorDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          creatorProfileId: 'creator-1',
          deletedAt: null,
        }),
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('doc-1');
  });

  it('returns document detail with versions', async () => {
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue({
      ...baseDocument,
      versions: [baseVersion],
    });

    const result = await service.getDocument(managerToken, 'creator-1', 'doc-1');

    expect(result.id).toBe('doc-1');
    expect(result.versions).toHaveLength(1);
  });

  it('creates a document and audits the event', async () => {
    (prisma.creatorDocument.create as jest.Mock).mockResolvedValue(baseDocument);

    const result = await service.createDocument(managerToken, 'creator-1', {
      documentType: 'GOVERNMENT_ID',
    });

    expect(result.id).toBe('doc-1');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_DOCUMENT_CREATED,
        targetType: AUDIT_TARGET_TYPE.CREATOR_DOCUMENT,
        targetId: 'doc-1',
      }),
    );
  });

  it('updates document metadata and audits the event', async () => {
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue(baseDocument);
    (prisma.creatorDocument.update as jest.Mock).mockResolvedValue({
      ...baseDocument,
      title: 'Updated title',
    });

    const result = await service.updateDocument(managerToken, 'creator-1', 'doc-1', {
      title: 'Updated title',
    });

    expect(result.title).toBe('Updated title');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_DOCUMENT_UPDATED,
      }),
    );
  });

  it('adds a version with storage validation and audits the event', async () => {
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue(baseDocument);
    (prisma.creatorDocumentVersion.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.creatorDocumentVersion.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
      callback({
        creatorDocumentVersion: {
          create: jest.fn(),
        },
        creatorDocument: {
          update: jest.fn().mockResolvedValue({
            ...baseDocument,
            status: 'UPLOADED',
            versions: [baseVersion],
          }),
        },
      }),
    );

    const result = await service.addDocumentVersion(managerToken, 'creator-1', 'doc-1', {
      storageKey: validStorageKey,
      fileName: 'passport.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      checksum: 'abc123',
    });

    expect(validateStorageKey).toHaveBeenCalledWith('org-1', validStorageKey);
    expect(validateUploadMetadata).toHaveBeenCalled();
    expect(result.status).toBe('UPLOADED');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_DOCUMENT_VERSION_ADDED,
      }),
    );
  });

  it('rejects raw file payloads when adding a version', async () => {
    (validateUploadMetadata as jest.Mock).mockImplementationOnce(() => {
      throw new (jest.requireMock('@kolab/storage').UploadValidationError)(
        'Raw file upload fields are not allowed',
      );
    });
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue(baseDocument);

    await expect(
      service.addDocumentVersion(managerToken, 'creator-1', 'doc-1', {
        storageKey: validStorageKey,
        fileName: 'passport.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('approves and rejects documents through review workflow', async () => {
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue(baseDocument);
    (prisma.creatorDocument.update as jest.Mock).mockResolvedValue({
      ...baseDocument,
      status: 'APPROVED',
      reviewedById: 'manager-1',
      reviewedAt: new Date('2026-07-02T13:00:00.000Z'),
    });

    const approved = await service.reviewDocument(managerToken, 'creator-1', 'doc-1', {
      status: 'APPROVED',
    });

    expect(approved.status).toBe('APPROVED');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_DOCUMENT_REVIEWED,
        metadata: expect.objectContaining({ status: 'APPROVED' }),
      }),
    );

    (prisma.creatorDocument.update as jest.Mock).mockResolvedValue({
      ...baseDocument,
      status: 'REJECTED',
      rejectionReason: 'Blurry image',
    });

    const rejected = await service.reviewDocument(managerToken, 'creator-1', 'doc-1', {
      status: 'REJECTED',
      rejectionReason: 'Blurry image',
    });

    expect(rejected.status).toBe('REJECTED');
    expect(rejected.rejectionReason).toBe('Blurry image');
  });

  it('returns presigned download URLs and audits sensitive downloads', async () => {
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue({
      ...baseDocument,
      versions: [baseVersion],
    });

    const result = await service.downloadDocument(managerToken, 'creator-1', 'doc-1');

    expect(getPresignedDownloadUrl).toHaveBeenCalled();
    expect(result.downloadUrl).toBe('https://example.com/download');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.CREATOR_DOCUMENT_DOWNLOADED,
        metadata: expect.objectContaining({
          sensitive: true,
          documentType: 'GOVERNMENT_ID',
        }),
      }),
    );
  });

  it('allows managers to download sensitive documents', async () => {
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue({
      ...baseDocument,
      documentType: 'PASSPORT',
      versions: [baseVersion],
    });

    await expect(service.downloadDocument(managerToken, 'creator-1', 'doc-1')).resolves.toEqual(
      expect.objectContaining({ documentId: 'doc-1' }),
    );
  });

  it('rejects sensitive downloads for recruiters without documents:download_sensitive', async () => {
    const recruiterToken: AccessTokenPayload = {
      ...managerToken,
      sub: 'recruiter-1',
      organizationRole: 'RECRUITER',
    };

    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue({
      ...baseDocument,
      versions: [baseVersion],
    });

    await expect(service.downloadDocument(recruiterToken, 'creator-1', 'doc-1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(getPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('allows recruiters to download non-sensitive documents', async () => {
    const recruiterToken: AccessTokenPayload = {
      ...managerToken,
      sub: 'recruiter-1',
      organizationRole: 'RECRUITER',
    };

    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue({
      ...baseDocument,
      documentType: 'PROFILE_PHOTO',
      versions: [baseVersion],
    });

    await expect(service.downloadDocument(recruiterToken, 'creator-1', 'doc-1')).resolves.toEqual(
      expect.objectContaining({ documentId: 'doc-1' }),
    );
  });

  it('allows system administrators to download sensitive documents', async () => {
    const systemAdminToken: AccessTokenPayload = {
      ...managerToken,
      sub: 'admin-1',
      organizationRole: 'VIEWER',
      isSystemAdmin: true,
    };

    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue({
      ...baseDocument,
      versions: [baseVersion],
    });

    await expect(service.downloadDocument(systemAdminToken, 'creator-1', 'doc-1')).resolves.toEqual(
      expect.objectContaining({ documentId: 'doc-1' }),
    );
  });

  it('enforces organization isolation', async () => {
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getDocument(otherOrgToken, 'creator-1', 'doc-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects document and creator mismatches via scoped lookup', async () => {
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getDocument(managerToken, 'creator-1', 'doc-other')).rejects.toThrow(
      NotFoundException,
    );

    expect(prisma.creatorDocument.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          creatorProfileId: 'creator-1',
        }),
      }),
    );
  });

  it('rejects users without active organization membership', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.listDocuments(managerToken, 'creator-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('requires rejection reason when rejecting documents', () => {
    expect(() => ReviewCreatorDocumentSchema.parse({ status: 'REJECTED' })).toThrow();
  });

  it('rejects duplicate version ids', async () => {
    (prisma.creatorDocument.findFirst as jest.Mock).mockResolvedValue(baseDocument);
    (prisma.creatorDocumentVersion.findUnique as jest.Mock).mockResolvedValue(baseVersion);

    await expect(
      service.addDocumentVersion(managerToken, 'creator-1', 'doc-1', {
        storageKey: validStorageKey,
        fileName: 'passport.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      }),
    ).rejects.toThrow(ConflictException);
  });
});
