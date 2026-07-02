import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CreatorDocument as PrismaCreatorDocument,
  CreatorDocumentVersion as PrismaCreatorDocumentVersion,
} from '@kolab/database';
import { CreatorDocumentStatus, MembershipStatus, Prisma, prisma } from '@kolab/database';
import {
  getPresignedDownloadUrl,
  loadStorageConfig,
  StorageKeyError,
  UploadValidationError,
  validateStorageKey,
  validateUploadMetadata,
} from '@kolab/storage';
import type {
  CreateCreatorDocumentInput,
  CreateCreatorDocumentVersionInput,
  CreatorDocument,
  CreatorDocumentDetail,
  CreatorDocumentType,
  DownloadCreatorDocumentInput,
  DownloadCreatorDocumentResponse,
  ListCreatorDocumentsResponse,
  ReviewCreatorDocumentInput,
  UpdateCreatorDocumentInput,
} from '@kolab/types';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toCreatorDocument, toCreatorDocumentDetail } from './creators-documents.mapper';
import {
  assertStorageKeyFileNameMatches,
  isSensitiveDocumentType,
  parseDocumentVersionStorageKey,
} from './creators-documents.utils';

const documentInclude = {
  versions: {
    orderBy: { versionNumber: 'asc' as const },
  },
};

type CreatorDocumentWithVersions = PrismaCreatorDocument & {
  versions: PrismaCreatorDocumentVersion[];
};

@Injectable()
export class CreatorsDocumentsService {
  constructor(private readonly auditService: AuditService) {}

  async listDocuments(
    user: AccessTokenPayload,
    creatorId: string,
  ): Promise<ListCreatorDocumentsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorId);

    const documents = await prisma.creatorDocument.findMany({
      where: {
        organizationId,
        creatorProfileId: creatorId,
        deletedAt: null,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return {
      items: documents.map(toCreatorDocument),
    };
  }

  async getDocument(
    user: AccessTokenPayload,
    creatorId: string,
    documentId: string,
  ): Promise<CreatorDocumentDetail> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorId);

    const document = await this.loadCreatorDocument(organizationId, creatorId, documentId, {
      include: documentInclude,
    });

    return toCreatorDocumentDetail(document);
  }

  async createDocument(
    user: AccessTokenPayload,
    creatorId: string,
    input: CreateCreatorDocumentInput,
  ): Promise<CreatorDocument> {
    const organizationId = await this.requireActiveOrganization(user);
    const creator = await this.requireCreatorProfile(organizationId, creatorId);

    if (input.creatorProfileId && input.creatorProfileId !== creatorId) {
      throw new BadRequestException('creatorProfileId must match the creator in the URL path');
    }

    const document = await prisma.creatorDocument.create({
      data: {
        organizationId,
        creatorProfileId: creatorId,
        sourceLeadId: input.sourceLeadId ?? creator.sourceLeadId,
        documentType: input.documentType,
        status: CreatorDocumentStatus.REQUESTED,
        title: input.title ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_DOCUMENT_CREATED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_DOCUMENT,
      targetId: document.id,
      metadata: {
        creatorId,
        documentType: document.documentType,
        status: document.status,
      },
    });

    return toCreatorDocument(document);
  }

  async updateDocument(
    user: AccessTokenPayload,
    creatorId: string,
    documentId: string,
    input: UpdateCreatorDocumentInput,
  ): Promise<CreatorDocument> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorId);
    await this.loadCreatorDocument(organizationId, creatorId, documentId);

    const document = await prisma.creatorDocument.update({
      where: { id: documentId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.expiresAt !== undefined
          ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }
          : {}),
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_DOCUMENT_UPDATED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_DOCUMENT,
      targetId: document.id,
      metadata: {
        creatorId,
        updatedFields: Object.keys(input),
      },
    });

    return toCreatorDocument(document);
  }

  async addDocumentVersion(
    user: AccessTokenPayload,
    creatorId: string,
    documentId: string,
    input: CreateCreatorDocumentVersionInput,
  ): Promise<CreatorDocumentDetail> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorId);
    const document = await this.loadCreatorDocument(organizationId, creatorId, documentId);

    try {
      validateStorageKey(organizationId, input.storageKey);
    } catch (error) {
      if (error instanceof StorageKeyError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const parsedKey = parseDocumentVersionStorageKey(creatorId, documentId, input.storageKey);

    const config = loadStorageConfig();
    let validatedUpload;

    try {
      validatedUpload = validateUploadMetadata(
        {
          fileName: input.fileName,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
        },
        config,
      );
    } catch (error) {
      if (error instanceof UploadValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    assertStorageKeyFileNameMatches(parsedKey.fileName, validatedUpload.fileName);

    const existingVersion = await prisma.creatorDocumentVersion.findUnique({
      where: { id: parsedKey.versionId },
    });

    if (existingVersion) {
      throw new ConflictException('Document version already exists for this storage key');
    }

    const versionNumber =
      input.versionNumber ??
      ((
        await prisma.creatorDocumentVersion.findFirst({
          where: { documentId },
          orderBy: { versionNumber: 'desc' },
          select: { versionNumber: true },
        })
      )?.versionNumber ?? 0) + 1;

    const versionConflict = await prisma.creatorDocumentVersion.findUnique({
      where: {
        documentId_versionNumber: {
          documentId,
          versionNumber,
        },
      },
    });

    if (versionConflict) {
      throw new ConflictException(`Document version number ${versionNumber} already exists`);
    }

    const uploadedAt = new Date();
    const nextStatus =
      document.status === CreatorDocumentStatus.REQUESTED ||
      document.status === CreatorDocumentStatus.REJECTED
        ? CreatorDocumentStatus.UPLOADED
        : document.status;

    const updatedDocument = await prisma.$transaction(async (tx) => {
      await tx.creatorDocumentVersion.create({
        data: {
          id: parsedKey.versionId,
          organizationId,
          documentId,
          versionNumber,
          storageKey: input.storageKey,
          fileName: validatedUpload.fileName,
          mimeType: validatedUpload.mimeType,
          sizeBytes: validatedUpload.sizeBytes,
          checksum: input.checksum ?? null,
          uploadedById: user.sub,
          uploadedAt,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      return tx.creatorDocument.update({
        where: { id: documentId },
        data: {
          status: nextStatus,
          ...(nextStatus === CreatorDocumentStatus.UPLOADED
            ? {
                reviewedById: null,
                reviewedAt: null,
                rejectionReason: null,
              }
            : {}),
        },
        include: documentInclude,
      });
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_DOCUMENT_VERSION_ADDED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_DOCUMENT,
      targetId: documentId,
      metadata: {
        creatorId,
        versionId: parsedKey.versionId,
        versionNumber,
        mimeType: validatedUpload.mimeType,
        sizeBytes: validatedUpload.sizeBytes,
      },
    });

    return toCreatorDocumentDetail(updatedDocument);
  }

  async reviewDocument(
    user: AccessTokenPayload,
    creatorId: string,
    documentId: string,
    input: ReviewCreatorDocumentInput,
  ): Promise<CreatorDocument> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorId);
    await this.loadCreatorDocument(organizationId, creatorId, documentId);

    const reviewedAt = new Date();
    const document = await prisma.creatorDocument.update({
      where: { id: documentId },
      data: {
        status: input.status,
        reviewedById: user.sub,
        reviewedAt,
        rejectionReason:
          input.status === CreatorDocumentStatus.REJECTED ? input.rejectionReason : null,
        ...(input.expiresAt !== undefined
          ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }
          : {}),
        ...(input.metadata !== undefined
          ? {
              metadata: input.metadata as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_DOCUMENT_REVIEWED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_DOCUMENT,
      targetId: document.id,
      metadata: {
        creatorId,
        status: input.status,
        rejectionReason:
          input.status === CreatorDocumentStatus.REJECTED ? input.rejectionReason : null,
      },
    });

    return toCreatorDocument(document);
  }

  async downloadDocument(
    user: AccessTokenPayload,
    creatorId: string,
    documentId: string,
    input: DownloadCreatorDocumentInput = {},
  ): Promise<DownloadCreatorDocumentResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorId);

    const document = await this.loadCreatorDocument(organizationId, creatorId, documentId, {
      include: documentInclude,
    });

    const version = input.versionId
      ? document.versions.find((item) => item.id === input.versionId)
      : [...document.versions]
          .reverse()
          .find((item) => typeof item.storageKey === 'string' && item.storageKey.length > 0);

    if (!version?.storageKey) {
      throw new BadRequestException('No uploaded document version is available for download');
    }

    try {
      validateStorageKey(organizationId, version.storageKey);
      parseDocumentVersionStorageKey(creatorId, documentId, version.storageKey);
    } catch (error) {
      if (error instanceof StorageKeyError || error instanceof BadRequestException) {
        throw new BadRequestException(
          error instanceof Error ? error.message : 'Invalid document storage key',
        );
      }

      throw error;
    }

    const config = loadStorageConfig();
    const presigned = await getPresignedDownloadUrl({
      storageKey: version.storageKey,
      config,
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_DOCUMENT_DOWNLOADED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_DOCUMENT,
      targetId: document.id,
      metadata: {
        creatorId,
        versionId: version.id,
        versionNumber: version.versionNumber,
        documentType: document.documentType,
        sensitive: isSensitiveDocumentType(document.documentType as CreatorDocumentType),
      },
    });

    return {
      documentId: document.id,
      versionId: version.id,
      storageKey: version.storageKey,
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

  private async requireCreatorProfile(organizationId: string, creatorId: string) {
    const profile = await prisma.creatorProfile.findFirst({
      where: { id: creatorId, organizationId },
    });

    if (!profile) {
      throw new NotFoundException('Creator not found');
    }

    return profile;
  }

  private async loadCreatorDocument(
    organizationId: string,
    creatorId: string,
    documentId: string,
  ): Promise<PrismaCreatorDocument>;
  private async loadCreatorDocument(
    organizationId: string,
    creatorId: string,
    documentId: string,
    options: { include: typeof documentInclude },
  ): Promise<CreatorDocumentWithVersions>;
  private async loadCreatorDocument(
    organizationId: string,
    creatorId: string,
    documentId: string,
    options?: {
      include?: typeof documentInclude;
    },
  ): Promise<PrismaCreatorDocument | CreatorDocumentWithVersions> {
    const document = await prisma.creatorDocument.findFirst({
      where: {
        id: documentId,
        organizationId,
        creatorProfileId: creatorId,
        deletedAt: null,
      },
      ...(options?.include ? { include: options.include } : {}),
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }
}
