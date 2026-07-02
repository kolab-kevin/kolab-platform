import { z } from 'zod';

import { CommissionPlanSchema } from './recruitment-crm';

export const RecruiterStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);

export type RecruiterStatus = z.infer<typeof RecruiterStatusSchema>;

export const RecruiterAvailabilitySchema = z
  .object({
    timezone: z.string().min(1).max(64).optional(),
    weekdays: z.array(z.number().int().min(0).max(6)).optional(),
    hoursStart: z.string().max(8).optional(),
    hoursEnd: z.string().max(8).optional(),
    notes: z.string().max(500).optional(),
  })
  .passthrough();

export type RecruiterAvailability = z.infer<typeof RecruiterAvailabilitySchema>;

const recruiterGoalSchema = z.number().int().min(0).max(10000);

const languageCodeSchema = z.string().min(2).max(10);

export const RecruiterProfileSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  displayName: z.string().nullable(),
  nickname: z.string().nullable(),
  territory: z.string().nullable(),
  languages: z.array(languageCodeSchema),
  hireDate: z.string().datetime().nullable(),
  commissionPlan: CommissionPlanSchema,
  monthlyLeadGoal: recruiterGoalSchema.nullable(),
  monthlyCreatorGoal: recruiterGoalSchema.nullable(),
  availability: RecruiterAvailabilitySchema,
  managerUserId: z.string().nullable(),
  status: RecruiterStatusSchema,
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type RecruiterProfile = z.infer<typeof RecruiterProfileSchema>;

export const RecruiterProfileSummarySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  displayName: z.string().nullable(),
  nickname: z.string().nullable(),
  territory: z.string().nullable(),
  status: RecruiterStatusSchema,
  managerUserId: z.string().nullable(),
  commissionPlan: CommissionPlanSchema,
  monthlyLeadGoal: recruiterGoalSchema.nullable(),
  monthlyCreatorGoal: recruiterGoalSchema.nullable(),
});

export type RecruiterProfileSummary = z.infer<typeof RecruiterProfileSummarySchema>;

export const CreateRecruiterProfileSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().trim().min(1).max(255).optional(),
  nickname: z.string().trim().min(1).max(255).optional(),
  territory: z.string().trim().min(1).max(255).optional(),
  languages: z.array(languageCodeSchema).min(1).optional(),
  hireDate: z.string().datetime().optional(),
  commissionPlan: CommissionPlanSchema.optional(),
  monthlyLeadGoal: recruiterGoalSchema.optional(),
  monthlyCreatorGoal: recruiterGoalSchema.optional(),
  availability: RecruiterAvailabilitySchema.optional(),
  managerUserId: z.string().min(1).optional(),
  status: RecruiterStatusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateRecruiterProfileInput = z.infer<typeof CreateRecruiterProfileSchema>;

export const UpdateRecruiterProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(255).nullable().optional(),
    nickname: z.string().trim().min(1).max(255).nullable().optional(),
    territory: z.string().trim().min(1).max(255).nullable().optional(),
    languages: z.array(languageCodeSchema).min(1).optional(),
    hireDate: z.string().datetime().nullable().optional(),
    commissionPlan: CommissionPlanSchema.optional(),
    monthlyLeadGoal: recruiterGoalSchema.nullable().optional(),
    monthlyCreatorGoal: recruiterGoalSchema.nullable().optional(),
    availability: RecruiterAvailabilitySchema.optional(),
    managerUserId: z.string().min(1).nullable().optional(),
    status: RecruiterStatusSchema.optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one recruiter profile field must be provided',
  });

export type UpdateRecruiterProfileInput = z.infer<typeof UpdateRecruiterProfileSchema>;

export const RecruiterProfileListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: RecruiterStatusSchema.optional(),
  managerUserId: z.string().min(1).optional(),
  search: z.string().trim().min(1).max(255).optional(),
});

export type RecruiterProfileListQuery = z.infer<typeof RecruiterProfileListQuerySchema>;

export const ListRecruiterProfilesResponseSchema = z.object({
  items: z.array(RecruiterProfileSummarySchema),
  nextCursor: z.string().nullable(),
});

export type ListRecruiterProfilesResponse = z.infer<typeof ListRecruiterProfilesResponseSchema>;
