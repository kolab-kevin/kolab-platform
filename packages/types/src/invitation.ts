import { z } from 'zod';

import { OrganizationRoleSchema } from './auth';

export const InvitationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED']);

export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

export const InvitationResponseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string().email(),
  role: OrganizationRoleSchema,
  status: InvitationStatusSchema,
  expiresAt: z.string().datetime(),
  acceptedAt: z.string().datetime().nullable(),
  invitedBy: z.string(),
});

export type InvitationResponse = z.infer<typeof InvitationResponseSchema>;

export const CreateInvitationSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  role: OrganizationRoleSchema,
});

export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;

export const CreateInvitationResponseSchema = z.object({
  invitation: InvitationResponseSchema,
  token: z.string(),
});

export type CreateInvitationResponse = z.infer<typeof CreateInvitationResponseSchema>;

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

export const AcceptInvitationResponseSchema = z.object({
  organizationId: z.string(),
  userId: z.string(),
  role: OrganizationRoleSchema,
  membershipStatus: z.enum(['ACTIVE', 'SUSPENDED', 'REMOVED']),
});

export type AcceptInvitationResponse = z.infer<typeof AcceptInvitationResponseSchema>;

export const InvitationListQuerySchema = z.object({
  pendingOnly: z.coerce.boolean().optional().default(false),
});

export type InvitationListQuery = z.infer<typeof InvitationListQuerySchema>;

export const ListInvitationsResponseSchema = z.object({
  invitations: z.array(InvitationResponseSchema),
});

export type ListInvitationsResponse = z.infer<typeof ListInvitationsResponseSchema>;

export const RevokeInvitationResponseSchema = z.object({
  id: z.string(),
  revoked: z.literal(true),
});

export type RevokeInvitationResponse = z.infer<typeof RevokeInvitationResponseSchema>;
