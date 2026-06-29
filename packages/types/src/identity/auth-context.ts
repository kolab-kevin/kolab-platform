import { z } from 'zod';

import { LoginSchema, RegisterSchema } from '../auth';
import { OrganizationRoleSchema } from './enums';
import { OrganizationMembershipSchema, OrganizationMembershipSummarySchema } from './membership';
import { OrganizationSummarySchema } from './organization';
import { PermissionSchema } from './permissions';
import { UserProfileResponseSchema } from './user-profile';

export const JwtAccessTokenClaimsSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  orgId: z.string().optional(),
  orgRole: OrganizationRoleSchema.optional(),
  sessionId: z.string().optional(),
  isSystemAdmin: z.boolean().optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type JwtAccessTokenClaims = z.infer<typeof JwtAccessTokenClaimsSchema>;

export const AuthContextSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  sessionId: z.string().optional(),
  isSystemAdmin: z.boolean(),
});

export type AuthContext = z.infer<typeof AuthContextSchema>;

export const ActiveOrganizationContextSchema = z.object({
  organizationId: z.string(),
  organizationRole: OrganizationRoleSchema,
  permissions: z.array(PermissionSchema),
});

export type ActiveOrganizationContext = z.infer<typeof ActiveOrganizationContextSchema>;

export const AuthenticatedRequestContextSchema = AuthContextSchema.extend({
  organization: ActiveOrganizationContextSchema.optional(),
});

export type AuthenticatedRequestContext = z.infer<typeof AuthenticatedRequestContextSchema>;

/** Release 0.2 register body — extends Phase 1 register without breaking existing schema. */
export const RegisterWithOrganizationSchema = RegisterSchema.extend({
  organizationName: z.string().min(1).max(255).trim().optional(),
});

export type RegisterWithOrganizationInput = z.infer<typeof RegisterWithOrganizationSchema>;

/** Release 0.2 login body — optional org selection for multi-membership users. */
export const LoginWithOrganizationSchema = LoginSchema.extend({
  organizationId: z.string().optional(),
});

export type LoginWithOrganizationInput = z.infer<typeof LoginWithOrganizationSchema>;

export const AuthIdentityUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  isSystemAdmin: z.boolean(),
  profile: UserProfileResponseSchema.nullable(),
  createdAt: z.string().datetime(),
});

export type AuthIdentityUser = z.infer<typeof AuthIdentityUserSchema>;

/** Release 0.2 `/auth/me` response shape (additive; Phase 1 `UserProfile` unchanged). */
export const AuthMeResponseSchema = z.object({
  user: AuthIdentityUserSchema,
  organization: OrganizationSummarySchema,
  membership: OrganizationMembershipSchema.pick({ role: true, status: true }),
  permissions: z.array(PermissionSchema),
  memberships: z.array(OrganizationMembershipSummarySchema),
});

export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;

export const AuthIdentityResponseSchema = z.object({
  user: AuthIdentityUserSchema,
  organization: OrganizationSummarySchema,
  membership: OrganizationMembershipSchema.pick({ role: true, status: true }),
  accessToken: z.string(),
  expiresIn: z.number(),
});

export type AuthIdentityResponse = z.infer<typeof AuthIdentityResponseSchema>;

export const OrganizationContextHeaderSchema = z.object({
  'x-organization-id': z.string().optional(),
});

export type OrganizationContextHeader = z.infer<typeof OrganizationContextHeaderSchema>;
