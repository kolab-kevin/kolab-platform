import { z } from 'zod';

import { OrganizationRoleSchema, RoleSchema } from './auth';
import {
  MembershipStatusSchema,
  OrganizationStatusSchema,
  OrganizationTypeSchema,
} from './organization';
import { UserAccountInfoSchema, UserProfileFieldsSchema } from './profile';
import { SessionResponseSchema } from './session';

export const AdminUsersQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  role: RoleSchema.optional(),
  organizationId: z.string().min(1).optional(),
});

export type AdminUsersQuery = z.infer<typeof AdminUsersQuerySchema>;

export const AdminUserListItemSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: RoleSchema,
  isSystemAdmin: z.boolean(),
  createdAt: z.string().datetime(),
  organizationCount: z.number().int(),
  activeSessionCount: z.number().int(),
});

export type AdminUserListItem = z.infer<typeof AdminUserListItemSchema>;

export const ListAdminUsersResponseSchema = z.object({
  items: z.array(AdminUserListItemSchema),
  nextCursor: z.string().nullable(),
});

export type ListAdminUsersResponse = z.infer<typeof ListAdminUsersResponseSchema>;

export const AdminUserMembershipSchema = z.object({
  organizationId: z.string(),
  organizationName: z.string(),
  organizationSlug: z.string(),
  role: OrganizationRoleSchema,
  status: MembershipStatusSchema,
  joinedAt: z.string().datetime(),
});

export type AdminUserMembership = z.infer<typeof AdminUserMembershipSchema>;

export const AdminUserDetailResponseSchema = z.object({
  user: UserAccountInfoSchema,
  profile: UserProfileFieldsSchema,
  memberships: z.array(AdminUserMembershipSchema),
  sessions: z.array(SessionResponseSchema.omit({ isCurrent: true })),
});

export type AdminUserDetailResponse = z.infer<typeof AdminUserDetailResponseSchema>;

export const UpdateAdminUserSchema = z
  .object({
    role: RoleSchema.optional(),
    isSystemAdmin: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.isSystemAdmin !== undefined, {
    message: 'At least one field must be provided',
  });

export type UpdateAdminUserInput = z.infer<typeof UpdateAdminUserSchema>;

export const UpdateAdminUserResponseSchema = z.object({
  user: UserAccountInfoSchema,
});

export type UpdateAdminUserResponse = z.infer<typeof UpdateAdminUserResponseSchema>;

export const AdminOrganizationsQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdminOrganizationsQuery = z.infer<typeof AdminOrganizationsQuerySchema>;

export const AdminOrganizationListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: OrganizationTypeSchema,
  status: OrganizationStatusSchema,
  memberCount: z.number().int(),
  createdAt: z.string().datetime(),
});

export type AdminOrganizationListItem = z.infer<typeof AdminOrganizationListItemSchema>;

export const ListAdminOrganizationsResponseSchema = z.object({
  items: z.array(AdminOrganizationListItemSchema),
  nextCursor: z.string().nullable(),
});

export type ListAdminOrganizationsResponse = z.infer<typeof ListAdminOrganizationsResponseSchema>;

export const AdminDashboardResponseSchema = z.object({
  totalUsers: z.number().int(),
  totalOrganizations: z.number().int(),
  activeOrganizations: z.number().int(),
  pendingInvitations: z.number().int(),
  activeSessions: z.number().int(),
  systemAdmins: z.number().int(),
});

export type AdminDashboardResponse = z.infer<typeof AdminDashboardResponseSchema>;

export const AdminUserParamsSchema = z.object({
  id: z.string().min(1),
});

export type AdminUserParams = z.infer<typeof AdminUserParamsSchema>;
