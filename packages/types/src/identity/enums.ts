import { z } from 'zod';

export const OrganizationTypeSchema = z.enum([
  'STANDARD',
  'AGENCY',
  'CREATOR',
  'MERCHANT',
  'ENTERPRISE',
]);

export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;

export const ORGANIZATION_TYPES = OrganizationTypeSchema.options;

export const OrganizationStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']);

export type OrganizationStatus = z.infer<typeof OrganizationStatusSchema>;

export const ORGANIZATION_STATUSES = OrganizationStatusSchema.options;

export const OrganizationRoleSchema = z.enum([
  'ORG_OWNER',
  'ORG_ADMIN',
  'AGENCY_MANAGER',
  'RECRUITER',
  'CREATOR',
  'MODERATOR',
  'FINANCE',
  'SUPPORT',
  'VIEWER',
]);

export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;

export const ORGANIZATION_ROLES = OrganizationRoleSchema.options;

export const MembershipStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'REMOVED']);

export type MembershipStatus = z.infer<typeof MembershipStatusSchema>;

export const MEMBERSHIP_STATUSES = MembershipStatusSchema.options;

/** Computed invitation lifecycle for API responses (not stored in Prisma). */
export const InvitationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED']);

export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

export const INVITATION_STATUSES = InvitationStatusSchema.options;
