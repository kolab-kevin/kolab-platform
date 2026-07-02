import { sanitizeFileName } from '@kolab/storage';
import type { CreatorDocumentType } from '@kolab/types';
import { BadRequestException } from '@nestjs/common';

export const SENSITIVE_CREATOR_DOCUMENT_TYPES = new Set<CreatorDocumentType>([
  'GOVERNMENT_ID',
  'PASSPORT',
  'TAX_FORM',
  'BANK_INFO',
]);

export function isSensitiveDocumentType(documentType: CreatorDocumentType): boolean {
  return SENSITIVE_CREATOR_DOCUMENT_TYPES.has(documentType);
}

export function toMetadataRecord(metadata: unknown): Record<string, unknown> {
  if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }

  return {};
}

export function parseDocumentVersionStorageKey(
  creatorId: string,
  documentId: string,
  storageKey: string,
): { versionId: string; fileName: string } {
  const segments = storageKey.split('/');

  if (segments.length !== 9) {
    throw new BadRequestException('storageKey does not match the expected creator document layout');
  }

  const [, , , keyCreatorId, resourceKind, keyDocumentId, , versionId, fileName] = segments;

  if (keyCreatorId !== creatorId || resourceKind !== 'documents' || keyDocumentId !== documentId) {
    throw new BadRequestException('storageKey does not match the target creator document');
  }

  return { versionId, fileName };
}

export function assertStorageKeyFileNameMatches(
  storageKeyFileName: string,
  requestedFileName: string,
): void {
  const sanitized = sanitizeFileName(requestedFileName);

  if (storageKeyFileName !== sanitized) {
    throw new BadRequestException('storageKey file segment does not match fileName');
  }
}
