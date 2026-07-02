import type { StorageConfig } from './config';
import { ALLOWED_UPLOAD_MIME_TYPES, type AllowedUploadMimeType } from './constants';
import { sanitizeFileName } from './filename';

export type UploadMetadata = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadValidationError';
  }
}

const forbiddenMetadataKeys = new Set([
  'file',
  'body',
  'base64',
  'content',
  'data',
  'filecontent',
  'raw',
  'blob',
]);

export function validateUploadMetadata(
  metadata: UploadMetadata,
  config: Pick<StorageConfig, 'maxFileSizeBytes'>,
): { fileName: string; mimeType: AllowedUploadMimeType; sizeBytes: number } {
  if (!Number.isInteger(metadata.sizeBytes) || metadata.sizeBytes <= 0) {
    throw new UploadValidationError('sizeBytes must be a positive integer');
  }

  if (metadata.sizeBytes > config.maxFileSizeBytes) {
    throw new UploadValidationError(
      `sizeBytes exceeds maximum allowed size of ${config.maxFileSizeBytes} bytes`,
    );
  }

  const mimeType = metadata.mimeType.trim().toLowerCase();
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(mimeType as AllowedUploadMimeType)) {
    throw new UploadValidationError(`mimeType ${metadata.mimeType} is not allowed`);
  }

  const fileName = sanitizeFileName(metadata.fileName);
  if (!fileName) {
    throw new UploadValidationError('fileName is required');
  }

  return {
    fileName,
    mimeType: mimeType as AllowedUploadMimeType,
    sizeBytes: metadata.sizeBytes,
  };
}

export function assertNoRawFilePayloadKeys(keys: string[]): void {
  for (const key of keys) {
    if (forbiddenMetadataKeys.has(key.toLowerCase())) {
      throw new UploadValidationError(`raw file field ${key} is not allowed`);
    }
  }
}
