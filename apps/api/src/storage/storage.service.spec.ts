import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { StorageService } from './storage.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    organizationMembership: {
      findUnique: jest.fn(),
    },
  },
  MembershipStatus: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REMOVED: 'REMOVED' },
}));

jest.mock('@kolab/storage', () => ({
  createStorageKey: jest
    .fn()
    .mockReturnValue(
      'organizations/org-1/creators/creator-1/documents/doc-1/versions/ver-1/passport.pdf',
    ),
  getPresignedDownloadUrl: jest.fn().mockResolvedValue({
    url: 'https://example.com/download',
    expiresAt: '2026-07-02T12:05:00.000Z',
  }),
  getPresignedUploadUrl: jest.fn().mockResolvedValue({
    url: 'https://example.com/upload',
    expiresAt: '2026-07-02T12:15:00.000Z',
    requiredHeaders: { 'Content-Type': 'application/pdf' },
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
  validateStorageKey: jest.fn(),
  validateUploadMetadata: jest.fn().mockReturnValue({
    fileName: 'passport.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
  }),
}));

import type { AccessTokenPayload } from '@kolab/auth';
import { prisma } from '@kolab/database';
import {
  createStorageKey,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
  validateStorageKey,
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

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get(StorageService);
    jest.clearAllMocks();

    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
    });
  });

  it('returns presigned upload URLs and normalized storage keys', async () => {
    const result = await service.presignUpload(managerToken, {
      creatorId: 'creator-1',
      resourceKind: 'documents',
      resourceId: 'doc-1',
      versionId: 'ver-1',
      fileName: 'passport.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });

    expect(createStorageKey).toHaveBeenCalled();
    expect(getPresignedUploadUrl).toHaveBeenCalled();
    expect(result.storageKey).toContain('organizations/org-1/');
    expect(result.uploadUrl).toBe('https://example.com/upload');
  });

  it('returns presigned download URLs for organization-scoped keys', async () => {
    const storageKey =
      'organizations/org-1/creators/creator-1/documents/doc-1/versions/ver-1/passport.pdf';

    const result = await service.presignDownload(managerToken, { storageKey });

    expect(validateStorageKey).toHaveBeenCalledWith('org-1', storageKey);
    expect(getPresignedDownloadUrl).toHaveBeenCalled();
    expect(result.downloadUrl).toBe('https://example.com/download');
  });

  it('rejects users without active organization membership', async () => {
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.presignUpload(managerToken, {
        creatorId: 'creator-1',
        resourceKind: 'documents',
        resourceId: 'doc-1',
        versionId: 'ver-1',
        fileName: 'passport.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
