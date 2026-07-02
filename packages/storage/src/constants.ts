export const ALLOWED_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedUploadMimeType = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

export const DEFAULT_UPLOAD_URL_TTL_SECONDS = 15 * 60;

export const DEFAULT_DOWNLOAD_URL_TTL_SECONDS = 5 * 60;

export const STORAGE_KEY_PREFIX = 'organizations';

export const STORAGE_RESOURCE_KINDS = ['documents', 'contracts'] as const;

export type StorageResourceKind = (typeof STORAGE_RESOURCE_KINDS)[number];
