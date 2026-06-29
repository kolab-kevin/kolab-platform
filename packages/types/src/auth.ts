import { z } from 'zod';

export const RoleSchema = z.enum([
  'USER',
  'CREATOR',
  'MODERATOR',
  'ADMIN',
  'SUPER_ADMIN',
]);

export type Role = z.infer<typeof RoleSchema>;

export const RegisterSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(1).max(128),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: RoleSchema,
  platforms: z.array(
    z.enum([
      'KOLAB_AGENCY',
      'TIKTOK_CREATOR',
      'TIKTOK_SHOP',
      'AI_SERVICES',
      'LIVE_STREAMING',
      'SYMLCAST',
    ]),
  ),
  createdAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
});

export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const AuthResponseSchema = z.object({
  user: UserProfileSchema,
  accessToken: z.string(),
  expiresIn: z.number(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
