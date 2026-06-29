import { z } from 'zod';

import { OrganizationRoleSchema } from './auth';

export const OrganizationTypeSchema = z.enum([
  'STANDARD',
  'AGENCY',
  'CREATOR',
  'MERCHANT',
  'ENTERPRISE',
]);

export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;

export const OrganizationStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']);

export type OrganizationStatus = z.infer<typeof OrganizationStatusSchema>;

export const MembershipStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'REMOVED']);

export type MembershipStatus = z.infer<typeof MembershipStatusSchema>;

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: OrganizationTypeSchema,
  status: OrganizationStatusSchema,
  settings: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const OrganizationSummarySchema = OrganizationSchema.pick({
  id: true,
  name: true,
  slug: true,
  type: true,
  status: true,
});

export type OrganizationSummary = z.infer<typeof OrganizationSummarySchema>;

export const OrganizationMembershipSchema = z.object({
  organizationId: z.string(),
  userId: z.string(),
  role: OrganizationRoleSchema,
  status: MembershipStatusSchema,
  joinedAt: z.string().datetime(),
});

export type OrganizationMembership = z.infer<typeof OrganizationMembershipSchema>;

export const OrganizationMemberSchema = OrganizationMembershipSchema.extend({
  email: z.string().email(),
  displayName: z.string().nullable(),
});

export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;

export const UserOrganizationSchema = z.object({
  organization: OrganizationSummarySchema,
  membership: OrganizationMembershipSchema.pick({
    role: true,
    status: true,
    joinedAt: true,
  }),
});

export type UserOrganization = z.infer<typeof UserOrganizationSchema>;

export const CurrentOrganizationResponseSchema = z.object({
  organization: OrganizationSchema,
  membership: OrganizationMembershipSchema.pick({ role: true, status: true, joinedAt: true }),
});

export type CurrentOrganizationResponse = z.infer<typeof CurrentOrganizationResponseSchema>;

export const ListOrganizationsResponseSchema = z.object({
  organizations: z.array(UserOrganizationSchema),
});

export type ListOrganizationsResponse = z.infer<typeof ListOrganizationsResponseSchema>;

export const SwitchOrganizationSchema = z.object({
  organizationId: z.string().min(1),
});

export type SwitchOrganizationInput = z.infer<typeof SwitchOrganizationSchema>;

export const SwitchOrganizationResponseSchema = z.object({
  organization: OrganizationSummarySchema,
  membership: OrganizationMembershipSchema.pick({ role: true, status: true }),
  accessToken: z.string(),
  expiresIn: z.number(),
});

export type SwitchOrganizationResponse = z.infer<typeof SwitchOrganizationResponseSchema>;

export const ListOrganizationMembersResponseSchema = z.object({
  members: z.array(OrganizationMemberSchema),
});

export type ListOrganizationMembersResponse = z.infer<typeof ListOrganizationMembersResponseSchema>;

export const UpdateOrganizationMemberSchema = z
  .object({
    role: OrganizationRoleSchema.optional(),
    status: MembershipStatusSchema.optional(),
  })
  .refine((value) => value.role !== undefined || value.status !== undefined, {
    message: 'At least one of role or status must be provided',
  });

export type UpdateOrganizationMemberInput = z.infer<typeof UpdateOrganizationMemberSchema>;

export const UpdateOrganizationMemberResponseSchema = z.object({
  member: OrganizationMemberSchema,
});

export type UpdateOrganizationMemberResponse = z.infer<
  typeof UpdateOrganizationMemberResponseSchema
>;

export const OrganizationMemberParamsSchema = z.object({
  id: z.string().min(1),
});

export type OrganizationMemberParams = z.infer<typeof OrganizationMemberParamsSchema>;
