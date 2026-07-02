import type { LeadSummary } from '@kolab/types';
import { LeadSourceSchema, LeadStatusSchema, PlatformTypeSchema } from '@kolab/types';
import { z } from 'zod';

const leadScoreSchema = z.coerce.number().int().min(0).max(100);

export const RecruitmentLeadListQuerySchema = z
  .object({
    cursor: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().min(1).max(255).optional(),
    status: LeadStatusSchema.optional(),
    source: LeadSourceSchema.optional(),
    recruiterId: z.string().min(1).optional(),
    platform: PlatformTypeSchema.optional(),
    scoreMin: leadScoreSchema.optional(),
    scoreMax: leadScoreSchema.optional(),
  })
  .refine(
    (data) =>
      data.scoreMin === undefined || data.scoreMax === undefined || data.scoreMin <= data.scoreMax,
    { message: 'scoreMin must be less than or equal to scoreMax', path: ['scoreMax'] },
  );

export type RecruitmentLeadListQuery = z.infer<typeof RecruitmentLeadListQuerySchema>;

export const DeleteLeadResponseSchema = z.object({
  id: z.string(),
  deleted: z.literal(true),
});

export type DeleteLeadResponse = z.infer<typeof DeleteLeadResponseSchema>;

export type ListRecruitmentLeadsResponse = {
  items: LeadSummary[];
  nextCursor: string | null;
};

export const MyLeadsQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: LeadStatusSchema.optional(),
  search: z.string().trim().min(1).max(255).optional(),
  platform: PlatformTypeSchema.optional(),
  followUpBefore: z.string().datetime().optional(),
});

export type MyLeadsQuery = z.infer<typeof MyLeadsQuerySchema>;

export const UnassignLeadSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type UnassignLeadInput = z.infer<typeof UnassignLeadSchema>;

export const FollowUpsQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  dueBefore: z.string().datetime().optional(),
  overdueOnly: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => value === true || value === 'true')
    .default(false),
  status: LeadStatusSchema.optional(),
  platform: PlatformTypeSchema.optional(),
});

export type FollowUpsQuery = z.infer<typeof FollowUpsQuerySchema>;
