import { z } from 'zod';

import { DateTimeStringSchema } from '../common/datetime';
import { PaginationQuerySchema } from '../common/pagination';
import { MembershipStatusSchema, OrganizationRoleSchema } from './enums';

export const OrganizationMembershipSchema = z.object({
  organizationId: z.string(),
  userId: z.string(),
  role: OrganizationRoleSchema,
  status: MembershipStatusSchema,
  invitedBy: z.string().nullable(),
  joinedAt: DateTimeStringSchema,
});

export type OrganizationMembership = z.infer<typeof OrganizationMembershipSchema>;

export const OrganizationMembershipSummarySchema = z.object({
  organizationId: z.string(),
  organizationName: z.string(),
  organizationSlug: z.string().optional(),
  role: OrganizationRoleSchema,
  status: MembershipStatusSchema,
});

export type OrganizationMembershipSummary = z.infer<typeof OrganizationMembershipSummarySchema>;

export const OrganizationMemberSchema = OrganizationMembershipSchema.extend({
  email: z.string().email().optional(),
  displayName: z.string().nullable().optional(),
});

export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;

export const UpdateOrganizationMembershipSchema = z
  .object({
    role: OrganizationRoleSchema.optional(),
    status: MembershipStatusSchema.optional(),
  })
  .refine((value) => value.role !== undefined || value.status !== undefined, {
    message: 'At least one of role or status must be provided',
  });

export type UpdateOrganizationMembershipInput = z.infer<typeof UpdateOrganizationMembershipSchema>;

export const OrganizationMemberListQuerySchema = PaginationQuerySchema.extend({
  role: OrganizationRoleSchema.optional(),
  status: MembershipStatusSchema.optional(),
  search: z.string().max(255).trim().optional(),
});

export type OrganizationMemberListQuery = z.infer<typeof OrganizationMemberListQuerySchema>;
