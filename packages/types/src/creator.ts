import { z } from 'zod';

import { MembershipStatusSchema } from './organization';
import { CommissionPlanSchema, PlatformTypeSchema } from './recruitment-crm';

export const CreatorAvailabilitySchema = z
  .object({
    timezone: z.string().min(1).max(64).optional(),
    weekdays: z.array(z.number().int().min(0).max(6)).optional(),
    hoursStart: z.string().max(8).optional(),
    hoursEnd: z.string().max(8).optional(),
    notes: z.string().max(500).optional(),
  })
  .passthrough();

export type CreatorAvailability = z.infer<typeof CreatorAvailabilitySchema>;

const languageCodeSchema = z.string().min(2).max(10);

export const CreatorStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED']);

export type CreatorStatus = z.infer<typeof CreatorStatusSchema>;

export const CreatorPlatformAccountStatusSchema = z.enum([
  'ACTIVE',
  'UNVERIFIED',
  'SUSPENDED',
  'REMOVED',
]);

export type CreatorPlatformAccountStatus = z.infer<typeof CreatorPlatformAccountStatusSchema>;

export const CreatorProfileSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  sourceLeadId: z.string().nullable(),
  displayName: z.string(),
  bio: z.string().nullable(),
  country: z.string().nullable(),
  languages: z.array(languageCodeSchema),
  availability: CreatorAvailabilitySchema,
  status: CreatorStatusSchema,
  metadata: z.record(z.unknown()),
  recruiterUserId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreatorProfile = z.infer<typeof CreatorProfileSchema>;

export const CreatorProfilePlatformAccountSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  creatorProfileId: z.string(),
  platform: PlatformTypeSchema,
  username: z.string(),
  profileUrl: z.string().nullable(),
  followers: z.number().int().nullable(),
  verified: z.boolean(),
  status: CreatorPlatformAccountStatusSchema,
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreatorProfilePlatformAccount = z.infer<typeof CreatorProfilePlatformAccountSchema>;

export const CreatorPlatformAccountSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  creatorId: z.string(),
  platform: PlatformTypeSchema,
  username: z.string(),
  profileUrl: z.string().nullable(),
  followers: z.number().int().nullable(),
  verified: z.boolean(),
  status: CreatorPlatformAccountStatusSchema,
  sourceLeadPlatformAccountId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreatorPlatformAccount = z.infer<typeof CreatorPlatformAccountSchema>;

export const CreatorSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  sourceLeadId: z.string(),
  displayName: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  country: z.string().nullable(),
  languages: z.array(z.string()),
  assignedRecruiterId: z.string().nullable(),
  commissionPlan: CommissionPlanSchema,
  platformAccounts: z.array(CreatorPlatformAccountSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Creator = z.infer<typeof CreatorSchema>;

export const CreatorSummarySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  displayName: z.string(),
  email: z.string().email().nullable(),
  country: z.string().nullable(),
  languages: z.array(languageCodeSchema),
  assignedRecruiterId: z.string().nullable(),
  status: MembershipStatusSchema,
  platformCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreatorSummary = z.infer<typeof CreatorSummarySchema>;

export const CreatorListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(255).optional(),
  platform: PlatformTypeSchema.optional(),
  recruiterId: z.string().min(1).optional(),
  country: z.string().trim().min(1).max(64).optional(),
  language: languageCodeSchema.optional(),
  status: MembershipStatusSchema.optional(),
});

export type CreatorListQuery = z.infer<typeof CreatorListQuerySchema>;

export const ListCreatorsResponseSchema = z.object({
  items: z.array(CreatorSummarySchema),
  nextCursor: z.string().nullable(),
});

export type ListCreatorsResponse = z.infer<typeof ListCreatorsResponseSchema>;

export const CreatorUserSummarySchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export type CreatorUserSummary = z.infer<typeof CreatorUserSummarySchema>;

export const CreatorRecruiterSummarySchema = z.object({
  id: z.string(),
  userId: z.string(),
  displayName: z.string().nullable(),
  nickname: z.string().nullable(),
  territory: z.string().nullable(),
  status: z.string(),
});

export type CreatorRecruiterSummary = z.infer<typeof CreatorRecruiterSummarySchema>;

export const CreatorOrganizationSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  status: z.string(),
});

export type CreatorOrganizationSummary = z.infer<typeof CreatorOrganizationSummarySchema>;

export const CreatorManagementProfileSchema = CreatorSchema.extend({
  bio: z.string().nullable(),
  availability: CreatorAvailabilitySchema,
  metadata: z.record(z.unknown()),
  status: MembershipStatusSchema,
});

export type CreatorManagementProfile = z.infer<typeof CreatorManagementProfileSchema>;

export const CreatorDetailResponseSchema = z.object({
  creator: CreatorManagementProfileSchema,
  user: CreatorUserSummarySchema,
  recruiter: CreatorRecruiterSummarySchema.nullable(),
  organization: CreatorOrganizationSummarySchema,
  platformAccounts: z.array(CreatorPlatformAccountSchema),
});

export type CreatorDetailResponse = z.infer<typeof CreatorDetailResponseSchema>;

export const UpdateCreatorSchema = z
  .object({
    displayName: z.string().trim().min(1).max(255).optional(),
    bio: z.string().trim().max(2000).nullable().optional(),
    country: z.string().trim().min(1).max(64).nullable().optional(),
    languages: z.array(languageCodeSchema).optional(),
    availability: CreatorAvailabilitySchema.optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one creator field must be provided',
  });

export type UpdateCreatorInput = z.infer<typeof UpdateCreatorSchema>;

export const ConvertLeadResponseSchema = z.object({
  lead: z.object({
    id: z.string(),
    organizationId: z.string(),
    status: z.string(),
    convertedUserId: z.string().nullable(),
    convertedAt: z.string().datetime().nullable(),
  }),
  creator: CreatorSchema,
  alreadyConverted: z.boolean(),
});

export type ConvertLeadResponse = z.infer<typeof ConvertLeadResponseSchema>;
