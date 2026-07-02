import { z } from 'zod';

export const LeadStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'APPLICATION',
  'CONTRACT_SENT',
  'SIGNED',
  'ACTIVE_CREATOR',
  'INACTIVE',
  'REJECTED',
]);

export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const LeadSourceSchema = z.enum([
  'MANUAL',
  'REFERRAL',
  'SOCIAL',
  'EVENT',
  'IMPORT',
  'OTHER',
]);

export type LeadSource = z.infer<typeof LeadSourceSchema>;

export const PlatformTypeSchema = z.enum([
  'TIKTOK',
  'INSTAGRAM',
  'YOUTUBE',
  'FACEBOOK',
  'TWITCH',
  'OTHER',
]);

export type PlatformType = z.infer<typeof PlatformTypeSchema>;

export const ContactTypeSchema = z.enum([
  'CALL',
  'WHATSAPP',
  'TIKTOK',
  'FACEBOOK',
  'EMAIL',
  'MEETING',
  'OTHER',
]);

export type ContactType = z.infer<typeof ContactTypeSchema>;

export const CommissionPlanSchema = z.enum(['STANDARD', 'PREMIUM', 'CUSTOM']);

export type CommissionPlan = z.infer<typeof CommissionPlanSchema>;

export const LeadPlatformAccountStatusSchema = z.enum([
  'ACTIVE',
  'UNVERIFIED',
  'SUSPENDED',
  'REMOVED',
]);

export type LeadPlatformAccountStatus = z.infer<typeof LeadPlatformAccountStatusSchema>;

const leadScoreSchema = z.number().int().min(0).max(100);

const optionalLeadEmailSchema = z.string().email().max(255).toLowerCase().trim().optional();

const platformUsernameSchema = z.string().trim().min(1).max(255);

const followersSchema = z.number().int().min(0);

const optionalFollowUpAtSchema = z.string().datetime().optional();

const noteContentSchema = z.string().trim().min(1).max(5000);

export const CreatorLeadSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  nickname: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  country: z.string().nullable(),
  languages: z.array(z.string()),
  source: LeadSourceSchema,
  status: LeadStatusSchema,
  score: leadScoreSchema,
  assignedRecruiterId: z.string().nullable(),
  assignedAt: z.string().datetime().nullable(),
  nextFollowUpAt: z.string().datetime().nullable(),
  commissionPlan: CommissionPlanSchema,
  convertedUserId: z.string().nullable(),
  convertedAt: z.string().datetime().nullable(),
  notesSummary: z.string().nullable(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreatorLead = z.infer<typeof CreatorLeadSchema>;

export const LeadSummarySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  nickname: z.string().nullable(),
  email: z.string().email().nullable(),
  source: LeadSourceSchema,
  status: LeadStatusSchema,
  score: leadScoreSchema,
  assignedRecruiterId: z.string().nullable(),
  assignedAt: z.string().datetime().nullable(),
  nextFollowUpAt: z.string().datetime().nullable(),
  commissionPlan: CommissionPlanSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type LeadSummary = z.infer<typeof LeadSummarySchema>;

export const LeadPlatformAccountSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  leadId: z.string(),
  platform: PlatformTypeSchema,
  username: platformUsernameSchema,
  profileUrl: z.string().url().nullable(),
  followers: followersSchema.nullable(),
  verified: z.boolean(),
  status: LeadPlatformAccountStatusSchema,
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type LeadPlatformAccount = z.infer<typeof LeadPlatformAccountSchema>;

export const LeadAssignmentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  leadId: z.string(),
  recruiterId: z.string(),
  assignedById: z.string(),
  assignedAt: z.string().datetime(),
  unassignedAt: z.string().datetime().nullable(),
  reason: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type LeadAssignment = z.infer<typeof LeadAssignmentSchema>;

export const LeadNoteSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  leadId: z.string(),
  authorId: z.string(),
  contactType: ContactTypeSchema,
  note: noteContentSchema,
  createdAt: z.string().datetime(),
});

export type LeadNote = z.infer<typeof LeadNoteSchema>;

export const LeadStatusHistorySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  leadId: z.string(),
  previousStatus: LeadStatusSchema.nullable(),
  newStatus: LeadStatusSchema,
  changedById: z.string(),
  changedAt: z.string().datetime(),
  reason: z.string().nullable(),
});

export type LeadStatusHistory = z.infer<typeof LeadStatusHistorySchema>;

export const LeadDetailsSchema = CreatorLeadSchema.extend({
  platformAccounts: z.array(LeadPlatformAccountSchema).default([]),
  assignments: z.array(LeadAssignmentSchema).default([]),
  notes: z.array(LeadNoteSchema).default([]),
  statusHistory: z.array(LeadStatusHistorySchema).default([]),
});

export type LeadDetails = z.infer<typeof LeadDetailsSchema>;

export const CreateLeadPlatformAccountSchema = z.object({
  platform: PlatformTypeSchema,
  username: platformUsernameSchema,
  profileUrl: z.string().url().max(2048).optional(),
  followers: followersSchema.optional(),
  verified: z.boolean().optional(),
  status: LeadPlatformAccountStatusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateLeadPlatformAccountInput = z.infer<typeof CreateLeadPlatformAccountSchema>;

export const CreateLeadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  nickname: z.string().trim().min(1).max(255).optional(),
  email: optionalLeadEmailSchema,
  phone: z.string().trim().max(50).optional(),
  country: z.string().length(2).optional(),
  languages: z.array(z.string().min(2).max(10)).min(1).optional(),
  source: LeadSourceSchema.optional(),
  score: leadScoreSchema.optional(),
  commissionPlan: CommissionPlanSchema.optional(),
  notesSummary: z.string().max(2000).optional(),
  nextFollowUpAt: optionalFollowUpAtSchema,
  platformAccounts: z.array(CreateLeadPlatformAccountSchema).optional(),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

export const UpdateLeadSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    nickname: z.string().trim().min(1).max(255).nullable().optional(),
    email: z.union([z.string().email().max(255).toLowerCase().trim(), z.null()]).optional(),
    phone: z.string().trim().max(50).nullable().optional(),
    country: z.string().length(2).nullable().optional(),
    languages: z.array(z.string().min(2).max(10)).min(1).optional(),
    source: LeadSourceSchema.optional(),
    score: leadScoreSchema.optional(),
    commissionPlan: CommissionPlanSchema.optional(),
    notesSummary: z.string().max(2000).nullable().optional(),
    nextFollowUpAt: z.string().datetime().nullable().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one lead field must be provided',
  });

export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

export const AssignLeadSchema = z.object({
  recruiterUserId: z.string().min(1),
  reason: z.string().trim().min(1).max(500).optional(),
});

export type AssignLeadInput = z.infer<typeof AssignLeadSchema>;

export const ReassignLeadSchema = z.object({
  recruiterUserId: z.string().min(1),
  reason: z.string().trim().min(1).max(500).optional(),
});

export type ReassignLeadInput = z.infer<typeof ReassignLeadSchema>;

export const AddLeadNoteSchema = z.object({
  contactType: ContactTypeSchema,
  note: noteContentSchema,
});

export type AddLeadNoteInput = z.infer<typeof AddLeadNoteSchema>;

export const UpdateLeadStatusSchema = z.object({
  status: LeadStatusSchema,
  reason: z.string().trim().min(1).max(500).optional(),
});

export type UpdateLeadStatusInput = z.infer<typeof UpdateLeadStatusSchema>;

export const SearchLeadsSchema = z.object({
  search: z.string().trim().min(1).max(255),
});

export type SearchLeadsInput = z.infer<typeof SearchLeadsSchema>;

export const LeadListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: LeadStatusSchema.optional(),
  assignedRecruiterId: z.string().min(1).optional(),
  platform: PlatformTypeSchema.optional(),
  search: z.string().trim().min(1).max(255).optional(),
  followUpBefore: z.string().datetime().optional(),
  followUpAfter: z.string().datetime().optional(),
  minScore: leadScoreSchema.optional(),
});

export type LeadListQuery = z.infer<typeof LeadListQuerySchema>;
