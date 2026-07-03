import { z } from 'zod';

export const CreatorOnboardingItemKeySchema = z.enum([
  'profile_complete',
  'government_id_approved',
  'creator_agreement_signed',
  'platform_account_present',
  'availability_present',
  'skills_present',
]);

export type CreatorOnboardingItemKey = z.infer<typeof CreatorOnboardingItemKeySchema>;

export const CreatorOnboardingItemStatusSchema = z.enum(['COMPLETE', 'INCOMPLETE', 'WARNING']);

export type CreatorOnboardingItemStatus = z.infer<typeof CreatorOnboardingItemStatusSchema>;

export const CreatorOnboardingOverallStatusSchema = z.enum(['COMPLETE', 'INCOMPLETE', 'WARNING']);

export type CreatorOnboardingOverallStatus = z.infer<typeof CreatorOnboardingOverallStatusSchema>;

export const CreatorOnboardingChecklistItemSchema = z.object({
  key: CreatorOnboardingItemKeySchema,
  label: z.string(),
  status: CreatorOnboardingItemStatusSchema,
  required: z.boolean(),
  details: z.record(z.unknown()),
});

export type CreatorOnboardingChecklistItem = z.infer<typeof CreatorOnboardingChecklistItemSchema>;

export const CreatorOnboardingChecklistResponseSchema = z.object({
  creatorId: z.string(),
  organizationId: z.string(),
  overallStatus: CreatorOnboardingOverallStatusSchema,
  items: z.array(CreatorOnboardingChecklistItemSchema),
});

export type CreatorOnboardingChecklistResponse = z.infer<
  typeof CreatorOnboardingChecklistResponseSchema
>;
