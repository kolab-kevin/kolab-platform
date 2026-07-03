import { z } from 'zod';

import {
  CreatorDocumentTypeSchema,
  ExpiringCreatorContractReportItemSchema,
  ExpiringCreatorDocumentReportItemSchema,
  MissingCreatorDocumentReportItemSchema,
} from './creator-documents-contracts';
import { CreatorOnboardingChecklistResponseSchema } from './creator-onboarding';

export const CreatorComplianceOverallStatusSchema = z.enum([
  'COMPLIANT',
  'AT_RISK',
  'NON_COMPLIANT',
]);

export type CreatorComplianceOverallStatus = z.infer<typeof CreatorComplianceOverallStatusSchema>;

export const CreatorComplianceQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  includeExpired: z.coerce.boolean().optional().default(true),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatorComplianceQuery = z.infer<typeof CreatorComplianceQuerySchema>;

export const CreatorComplianceDocumentsSummarySchema = z.object({
  missing: z.number().int().min(0),
  expiring: z.number().int().min(0),
  expired: z.number().int().min(0),
  missingItems: z.array(MissingCreatorDocumentReportItemSchema),
  expiringItems: z.array(ExpiringCreatorDocumentReportItemSchema),
});

export type CreatorComplianceDocumentsSummary = z.infer<
  typeof CreatorComplianceDocumentsSummarySchema
>;

export const CreatorComplianceContractsSummarySchema = z.object({
  expiring: z.number().int().min(0),
  expired: z.number().int().min(0),
  expiringItems: z.array(ExpiringCreatorContractReportItemSchema),
});

export type CreatorComplianceContractsSummary = z.infer<
  typeof CreatorComplianceContractsSummarySchema
>;

export const CreatorComplianceSensitiveAccessSchema = z.object({
  sensitiveDocumentTypes: z.array(CreatorDocumentTypeSchema),
  downloadRequiresPermission: z.literal('documents:download_sensitive'),
  callerCanDownloadSensitive: z.boolean(),
});

export type CreatorComplianceSensitiveAccess = z.infer<
  typeof CreatorComplianceSensitiveAccessSchema
>;

export const CreatorComplianceResponseSchema = z.object({
  creatorId: z.string(),
  organizationId: z.string(),
  generatedAt: z.string().datetime(),
  overallStatus: CreatorComplianceOverallStatusSchema,
  onboarding: CreatorOnboardingChecklistResponseSchema,
  documents: CreatorComplianceDocumentsSummarySchema,
  contracts: CreatorComplianceContractsSummarySchema,
  sensitiveAccess: CreatorComplianceSensitiveAccessSchema,
});

export type CreatorComplianceResponse = z.infer<typeof CreatorComplianceResponseSchema>;
