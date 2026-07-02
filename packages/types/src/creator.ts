import { z } from 'zod';

import { CommissionPlanSchema, PlatformTypeSchema } from './recruitment-crm';

export const CreatorPlatformAccountStatusSchema = z.enum([
  'ACTIVE',
  'UNVERIFIED',
  'SUSPENDED',
  'REMOVED',
]);

export type CreatorPlatformAccountStatus = z.infer<typeof CreatorPlatformAccountStatusSchema>;

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
