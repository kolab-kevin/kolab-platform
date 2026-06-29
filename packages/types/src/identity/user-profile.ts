import { z } from 'zod';

/**
 * Identity profile record (1:1 with User).
 * Distinct from Phase 1 `UserProfile` in `auth.ts`, which is the auth/session DTO.
 */
export const UserProfileRecordSchema = z.object({
  userId: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().nullable(),
  language: z.string().min(2).max(16),
  timezone: z.string().min(1).max(64),
  country: z.string().length(2).nullable(),
});

export type UserProfileRecord = z.infer<typeof UserProfileRecordSchema>;

export const UserProfileResponseSchema = UserProfileRecordSchema.omit({ userId: true });

export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;

export const UpdateUserProfileSchema = z
  .object({
    displayName: z.string().min(1).max(255).trim().nullable().optional(),
    avatarUrl: z.string().url().max(2048).nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
    language: z.string().min(2).max(16).optional(),
    timezone: z.string().min(1).max(64).optional(),
    country: z.string().length(2).nullable().optional(),
  })
  .refine(
    (value) =>
      value.displayName !== undefined ||
      value.avatarUrl !== undefined ||
      value.bio !== undefined ||
      value.language !== undefined ||
      value.timezone !== undefined ||
      value.country !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;
