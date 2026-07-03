import { z } from 'zod';

export const CreatorDocumentTypeSchema = z.enum([
  'GOVERNMENT_ID',
  'PASSPORT',
  'TAX_FORM',
  'BANK_INFO',
  'PROFILE_PHOTO',
  'CONTRACT_ATTACHMENT',
  'OTHER',
]);

export type CreatorDocumentType = z.infer<typeof CreatorDocumentTypeSchema>;

export const CreatorDocumentStatusSchema = z.enum([
  'REQUESTED',
  'UPLOADED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'ARCHIVED',
]);

export type CreatorDocumentStatus = z.infer<typeof CreatorDocumentStatusSchema>;

export const CreatorContractTypeSchema = z.enum([
  'CREATOR_AGREEMENT',
  'AGENCY_AGREEMENT',
  'CAMPAIGN_CONTRACT',
  'NDA',
  'OTHER',
]);

export type CreatorContractType = z.infer<typeof CreatorContractTypeSchema>;

export const CreatorContractStatusSchema = z.enum([
  'DRAFT',
  'SENT',
  'VIEWED',
  'SIGNED',
  'EXPIRED',
  'CANCELLED',
  'TERMINATED',
]);

export type CreatorContractStatus = z.infer<typeof CreatorContractStatusSchema>;

const versionNumberSchema = z.number().int().min(1);

const storageKeySchema = z.string().trim().min(1).max(2048);

const fileNameSchema = z.string().trim().min(1).max(255);

const mimeTypeSchema = z.string().trim().min(1).max(255);

const sizeBytesSchema = z.number().int().positive();

const checksumSchema = z.string().trim().min(1).max(128);

const optionalChecksumSchema = checksumSchema.optional();

const metadataSchema = z.record(z.unknown());

const isoDateTimeSchema = z.string().datetime();

const optionalNullableIsoDateTimeSchema = z.string().datetime().nullable().optional();

const forbiddenRawFileFieldKeys = new Set([
  'file',
  'body',
  'base64',
  'content',
  'data',
  'filecontent',
  'raw',
  'blob',
]);

function metadataHasNoRawFileFields(metadata: Record<string, unknown> | undefined): boolean {
  if (!metadata) {
    return true;
  }

  return !Object.keys(metadata).some((key) => forbiddenRawFileFieldKeys.has(key.toLowerCase()));
}

function objectHasNoRawFileFields(data: Record<string, unknown>): boolean {
  return !Object.keys(data).some((key) => forbiddenRawFileFieldKeys.has(key.toLowerCase()));
}

export const CreatorDocumentVersionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  documentId: z.string(),
  versionNumber: versionNumberSchema,
  storageKey: z.string().nullable(),
  fileName: z.string().nullable(),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().int().positive().nullable(),
  checksum: z.string().nullable(),
  uploadedById: z.string(),
  uploadedAt: isoDateTimeSchema.nullable(),
  metadata: metadataSchema,
  createdAt: isoDateTimeSchema,
});

export type CreatorDocumentVersion = z.infer<typeof CreatorDocumentVersionSchema>;

export const CreatorDocumentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  creatorProfileId: z.string().nullable(),
  sourceLeadId: z.string().nullable(),
  documentType: CreatorDocumentTypeSchema,
  status: CreatorDocumentStatusSchema,
  title: z.string().nullable(),
  expiresAt: isoDateTimeSchema.nullable(),
  reviewedById: z.string().nullable(),
  reviewedAt: isoDateTimeSchema.nullable(),
  rejectionReason: z.string().nullable(),
  metadata: metadataSchema,
  deletedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CreatorDocument = z.infer<typeof CreatorDocumentSchema>;

export const CreatorDocumentDetailSchema = CreatorDocumentSchema.extend({
  versions: z.array(CreatorDocumentVersionSchema),
});

export type CreatorDocumentDetail = z.infer<typeof CreatorDocumentDetailSchema>;

export const CreatorContractVersionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  contractId: z.string(),
  versionNumber: versionNumberSchema,
  storageKey: z.string().nullable(),
  fileName: z.string().nullable(),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().int().positive().nullable(),
  checksum: z.string().nullable(),
  signedAt: isoDateTimeSchema.nullable(),
  signedByUserId: z.string().nullable(),
  externalEnvelopeId: z.string().nullable(),
  metadata: metadataSchema,
  createdAt: isoDateTimeSchema,
});

export type CreatorContractVersion = z.infer<typeof CreatorContractVersionSchema>;

export const CreatorContractSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  creatorProfileId: z.string().nullable(),
  sourceLeadId: z.string().nullable(),
  contractType: CreatorContractTypeSchema,
  status: CreatorContractStatusSchema,
  title: z.string(),
  parentContractId: z.string().nullable(),
  validFrom: isoDateTimeSchema.nullable(),
  validUntil: isoDateTimeSchema.nullable(),
  signedAt: isoDateTimeSchema.nullable(),
  signedByUserId: z.string().nullable(),
  externalEnvelopeId: z.string().nullable(),
  metadata: metadataSchema,
  deletedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CreatorContract = z.infer<typeof CreatorContractSchema>;

export const CreatorContractDetailSchema = CreatorContractSchema.extend({
  versions: z.array(CreatorContractVersionSchema),
});

export type CreatorContractDetail = z.infer<typeof CreatorContractDetailSchema>;

export const ListCreatorDocumentsResponseSchema = z.object({
  items: z.array(CreatorDocumentSchema),
});

export type ListCreatorDocumentsResponse = z.infer<typeof ListCreatorDocumentsResponseSchema>;

export const ListCreatorContractsResponseSchema = z.object({
  items: z.array(CreatorContractSchema),
});

export type ListCreatorContractsResponse = z.infer<typeof ListCreatorContractsResponseSchema>;

export const CreateCreatorDocumentSchema = z
  .object({
    documentType: CreatorDocumentTypeSchema,
    title: z.string().trim().min(1).max(255).optional(),
    creatorProfileId: z.string().min(1).optional(),
    sourceLeadId: z.string().min(1).optional(),
    expiresAt: isoDateTimeSchema.optional(),
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => objectHasNoRawFileFields(data), {
    message: 'Raw file upload fields are not allowed on document create',
  })
  .refine((data) => metadataHasNoRawFileFields(data.metadata), {
    message: 'metadata must not contain raw file upload fields',
  })
  .refine(
    (data) =>
      data.documentType !== 'OTHER' ||
      (typeof data.title === 'string' && data.title.trim().length > 0),
    {
      message: 'title is required when documentType is OTHER',
      path: ['title'],
    },
  );

export type CreateCreatorDocumentInput = z.infer<typeof CreateCreatorDocumentSchema>;

export const UpdateCreatorDocumentSchema = z
  .object({
    title: z.string().trim().min(1).max(255).nullable().optional(),
    expiresAt: optionalNullableIsoDateTimeSchema,
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one document field must be provided',
  })
  .refine((data) => objectHasNoRawFileFields(data), {
    message: 'Raw file upload fields are not allowed on document update',
  })
  .refine((data) => metadataHasNoRawFileFields(data.metadata), {
    message: 'metadata must not contain raw file upload fields',
  });

export type UpdateCreatorDocumentInput = z.infer<typeof UpdateCreatorDocumentSchema>;

export const CreateCreatorDocumentVersionSchema = z
  .object({
    versionNumber: versionNumberSchema.optional(),
    storageKey: storageKeySchema,
    fileName: fileNameSchema,
    mimeType: mimeTypeSchema,
    sizeBytes: sizeBytesSchema,
    checksum: optionalChecksumSchema,
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => objectHasNoRawFileFields(data), {
    message: 'Raw file upload fields are not allowed; provide storage metadata only',
  })
  .refine((data) => metadataHasNoRawFileFields(data.metadata), {
    message: 'metadata must not contain raw file upload fields',
  });

export type CreateCreatorDocumentVersionInput = z.infer<typeof CreateCreatorDocumentVersionSchema>;

export const ReviewCreatorDocumentSchema = z
  .object({
    status: z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED']),
    rejectionReason: z.string().trim().min(1).max(2000).optional(),
    expiresAt: optionalNullableIsoDateTimeSchema,
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => objectHasNoRawFileFields(data), {
    message: 'Raw file upload fields are not allowed on document review',
  })
  .refine((data) => metadataHasNoRawFileFields(data.metadata), {
    message: 'metadata must not contain raw file upload fields',
  })
  .refine((data) => data.status !== 'REJECTED' || typeof data.rejectionReason === 'string', {
    message: 'rejectionReason is required when status is REJECTED',
    path: ['rejectionReason'],
  });

export type ReviewCreatorDocumentInput = z.infer<typeof ReviewCreatorDocumentSchema>;

export const DownloadCreatorDocumentSchema = z
  .object({
    versionId: z.string().min(1).optional(),
  })
  .strict();

export type DownloadCreatorDocumentInput = z.infer<typeof DownloadCreatorDocumentSchema>;

export const DownloadCreatorDocumentResponseSchema = z.object({
  documentId: z.string(),
  versionId: z.string(),
  storageKey: z.string(),
  downloadUrl: z.string().url(),
  expiresAt: isoDateTimeSchema,
});

export type DownloadCreatorDocumentResponse = z.infer<typeof DownloadCreatorDocumentResponseSchema>;

export const MutableCreatorContractStatusSchema = z.enum([
  'DRAFT',
  'SENT',
  'VIEWED',
  'SIGNED',
  'EXPIRED',
  'CANCELLED',
  'TERMINATED',
]);

export type MutableCreatorContractStatus = z.infer<typeof MutableCreatorContractStatusSchema>;

export const CreateCreatorContractSchema = z
  .object({
    contractType: CreatorContractTypeSchema,
    title: z.string().trim().min(1).max(255),
    creatorProfileId: z.string().min(1).optional(),
    sourceLeadId: z.string().min(1).optional(),
    parentContractId: z.string().min(1).optional(),
    validFrom: isoDateTimeSchema.optional(),
    validUntil: isoDateTimeSchema.optional(),
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => objectHasNoRawFileFields(data), {
    message: 'Raw file upload fields are not allowed on contract create',
  })
  .refine((data) => metadataHasNoRawFileFields(data.metadata), {
    message: 'metadata must not contain raw file upload fields',
  })
  .refine(
    (data) =>
      data.contractType !== 'OTHER' ||
      (typeof data.title === 'string' && data.title.trim().length > 0),
    {
      message: 'title is required when contractType is OTHER',
      path: ['title'],
    },
  );

export type CreateCreatorContractInput = z.infer<typeof CreateCreatorContractSchema>;

export const UpdateCreatorContractSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    validFrom: optionalNullableIsoDateTimeSchema,
    validUntil: optionalNullableIsoDateTimeSchema,
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one contract field must be provided',
  })
  .refine((data) => objectHasNoRawFileFields(data), {
    message: 'Raw file upload fields are not allowed on contract update',
  })
  .refine((data) => metadataHasNoRawFileFields(data.metadata), {
    message: 'metadata must not contain raw file upload fields',
  });

export type UpdateCreatorContractInput = z.infer<typeof UpdateCreatorContractSchema>;

export const CreateCreatorContractVersionSchema = z
  .object({
    versionNumber: versionNumberSchema.optional(),
    storageKey: storageKeySchema,
    fileName: fileNameSchema,
    mimeType: mimeTypeSchema,
    sizeBytes: sizeBytesSchema,
    checksum: optionalChecksumSchema,
    externalEnvelopeId: z.string().trim().min(1).max(255).optional(),
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => objectHasNoRawFileFields(data), {
    message: 'Raw file upload fields are not allowed; provide storage metadata only',
  })
  .refine((data) => metadataHasNoRawFileFields(data.metadata), {
    message: 'metadata must not contain raw file upload fields',
  });

export type CreateCreatorContractVersionInput = z.infer<typeof CreateCreatorContractVersionSchema>;

export const UpdateCreatorContractStatusSchema = z
  .object({
    status: MutableCreatorContractStatusSchema,
    metadata: metadataSchema.optional(),
  })
  .strict()
  .refine((data) => objectHasNoRawFileFields(data), {
    message: 'Raw file upload fields are not allowed on contract status update',
  })
  .refine((data) => metadataHasNoRawFileFields(data.metadata), {
    message: 'metadata must not contain raw file upload fields',
  });

export type UpdateCreatorContractStatusInput = z.infer<typeof UpdateCreatorContractStatusSchema>;

export const DownloadCreatorContractSchema = z
  .object({
    versionId: z.string().min(1).optional(),
  })
  .strict();

export type DownloadCreatorContractInput = z.infer<typeof DownloadCreatorContractSchema>;

export const DownloadCreatorContractResponseSchema = z.object({
  contractId: z.string(),
  versionId: z.string(),
  storageKey: z.string(),
  downloadUrl: z.string().url(),
  expiresAt: isoDateTimeSchema,
});

export type DownloadCreatorContractResponse = z.infer<typeof DownloadCreatorContractResponseSchema>;
