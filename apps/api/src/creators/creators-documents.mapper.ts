import type {
  CreatorDocument as PrismaCreatorDocument,
  CreatorDocumentVersion as PrismaCreatorDocumentVersion,
} from '@kolab/database';
import type { CreatorDocument, CreatorDocumentDetail, CreatorDocumentVersion } from '@kolab/types';

import { toMetadataRecord } from './creators-documents.utils';

export function toCreatorDocumentVersion(
  version: PrismaCreatorDocumentVersion,
): CreatorDocumentVersion {
  return {
    id: version.id,
    organizationId: version.organizationId,
    documentId: version.documentId,
    versionNumber: version.versionNumber,
    storageKey: version.storageKey,
    fileName: version.fileName,
    mimeType: version.mimeType,
    sizeBytes: version.sizeBytes,
    checksum: version.checksum,
    uploadedById: version.uploadedById,
    uploadedAt: version.uploadedAt?.toISOString() ?? null,
    metadata: toMetadataRecord(version.metadata),
    createdAt: version.createdAt.toISOString(),
  };
}

export function toCreatorDocument(document: PrismaCreatorDocument): CreatorDocument {
  return {
    id: document.id,
    organizationId: document.organizationId,
    creatorProfileId: document.creatorProfileId,
    sourceLeadId: document.sourceLeadId,
    documentType: document.documentType as CreatorDocument['documentType'],
    status: document.status as CreatorDocument['status'],
    title: document.title,
    expiresAt: document.expiresAt?.toISOString() ?? null,
    reviewedById: document.reviewedById,
    reviewedAt: document.reviewedAt?.toISOString() ?? null,
    rejectionReason: document.rejectionReason,
    metadata: toMetadataRecord(document.metadata),
    deletedAt: document.deletedAt?.toISOString() ?? null,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export function toCreatorDocumentDetail(
  document: PrismaCreatorDocument & { versions: PrismaCreatorDocumentVersion[] },
): CreatorDocumentDetail {
  return {
    ...toCreatorDocument(document),
    versions: document.versions
      .slice()
      .sort((left, right) => left.versionNumber - right.versionNumber)
      .map(toCreatorDocumentVersion),
  };
}
