import type { AccessTokenPayload } from '@kolab/auth';
import { MembershipStatus, prisma } from '@kolab/database';
import {
  createStorageKey,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
  loadStorageConfig,
  validateStorageKey,
  validateUploadMetadata,
} from '@kolab/storage';
import { ForbiddenException, Injectable } from '@nestjs/common';

import type {
  PresignDownloadRequest,
  PresignDownloadResponse,
  PresignUploadRequest,
  PresignUploadResponse,
} from './storage.dto';

@Injectable()
export class StorageService {
  async presignUpload(
    user: AccessTokenPayload,
    input: PresignUploadRequest,
  ): Promise<PresignUploadResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const config = loadStorageConfig();
    const validated = validateUploadMetadata(
      {
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      },
      config,
    );

    const storageKey = createStorageKey({
      organizationId,
      creatorId: input.creatorId,
      resourceKind: input.resourceKind,
      resourceId: input.resourceId,
      versionId: input.versionId,
      fileName: validated.fileName,
    });

    const presigned = await getPresignedUploadUrl({
      storageKey,
      mimeType: validated.mimeType,
      config,
    });

    return {
      storageKey,
      uploadUrl: presigned.url,
      expiresAt: presigned.expiresAt,
      requiredHeaders: presigned.requiredHeaders,
    };
  }

  async presignDownload(
    user: AccessTokenPayload,
    input: PresignDownloadRequest,
  ): Promise<PresignDownloadResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    validateStorageKey(organizationId, input.storageKey);

    const config = loadStorageConfig();
    const presigned = await getPresignedDownloadUrl({
      storageKey: input.storageKey,
      config,
    });

    return {
      storageKey: input.storageKey,
      downloadUrl: presigned.url,
      expiresAt: presigned.expiresAt,
    };
  }

  private async requireActiveOrganization(user: AccessTokenPayload): Promise<string> {
    if (!user.organizationId) {
      throw new ForbiddenException('Active organization context required');
    }

    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: user.organizationId,
          userId: user.sub,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('No active membership in selected organization');
    }

    return user.organizationId;
  }
}
