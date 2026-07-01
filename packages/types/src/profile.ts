import { z } from 'zod';

import { RoleSchema } from './auth';

export const UserProfileFieldsSchema = z.object({
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  language: z.string(),
  timezone: z.string(),
  country: z.string().nullable(),
});

export type UserProfileFields = z.infer<typeof UserProfileFieldsSchema>;

export const UserAccountInfoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: RoleSchema,
  isSystemAdmin: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserAccountInfo = z.infer<typeof UserAccountInfoSchema>;

export const ProfileResponseSchema = z.object({
  user: UserAccountInfoSchema,
  profile: UserProfileFieldsSchema,
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const UpdateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(100).nullable().optional(),
    avatarUrl: z.string().url().max(2048).nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
    language: z.string().min(2).max(10).optional(),
    timezone: z.string().min(1).max(64).optional(),
    country: z.string().length(2).nullable().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one profile field must be provided',
  });

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
