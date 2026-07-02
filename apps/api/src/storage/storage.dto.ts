import { STORAGE_RESOURCE_KINDS } from '@kolab/storage';
import { z } from 'zod';

const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);

export const PresignUploadRequestSchema = z
  .object({
    creatorId: idSchema,
    resourceKind: z.enum(STORAGE_RESOURCE_KINDS),
    resourceId: idSchema,
    versionId: idSchema,
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(1).max(255),
    sizeBytes: z.number().int().positive(),
  })
  .strict();

export type PresignUploadRequest = z.infer<typeof PresignUploadRequestSchema>;

export const PresignDownloadRequestSchema = z
  .object({
    storageKey: z.string().trim().min(1).max(2048),
  })
  .strict();

export type PresignDownloadRequest = z.infer<typeof PresignDownloadRequestSchema>;

export const PresignUploadResponseSchema = z.object({
  storageKey: z.string(),
  uploadUrl: z.string().url(),
  expiresAt: z.string().datetime(),
  requiredHeaders: z.object({
    'Content-Type': z.string(),
  }),
});

export type PresignUploadResponse = z.infer<typeof PresignUploadResponseSchema>;

export const PresignDownloadResponseSchema = z.object({
  storageKey: z.string(),
  downloadUrl: z.string().url(),
  expiresAt: z.string().datetime(),
});

export type PresignDownloadResponse = z.infer<typeof PresignDownloadResponseSchema>;
