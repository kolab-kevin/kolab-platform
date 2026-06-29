import { z } from 'zod';

import { DateTimeStringSchema } from '../common/datetime';
import { PaginationQuerySchema } from '../common/pagination';
import { InvitationStatusSchema, OrganizationRoleSchema } from './enums';

export const InvitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string().email(),
  role: OrganizationRoleSchema,
  expiresAt: DateTimeStringSchema,
  acceptedAt: DateTimeStringSchema.nullable(),
  invitedBy: z.string(),
});

export type Invitation = z.infer<typeof InvitationSchema>;

export const InvitationResponseSchema = InvitationSchema.extend({
  status: InvitationStatusSchema,
  acceptUrl: z.string().url().optional(),
});

export type InvitationResponse = z.infer<typeof InvitationResponseSchema>;

export const CreateInvitationSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  role: OrganizationRoleSchema,
});

export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .optional(),
  displayName: z.string().min(1).max(255).trim().optional(),
});

export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>;

export const InvitationListQuerySchema = PaginationQuerySchema.extend({
  email: z.string().email().optional(),
  pendingOnly: z.coerce.boolean().optional().default(true),
});

export type InvitationListQuery = z.infer<typeof InvitationListQuerySchema>;

export const RevokeInvitationParamsSchema = z.object({
  invitationId: z.string(),
});

export type RevokeInvitationParams = z.infer<typeof RevokeInvitationParamsSchema>;
