import { z } from 'zod';

export const SessionResponseSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  expiresAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime().optional(),
  isCurrent: z.boolean().optional(),
});

export type SessionResponse = z.infer<typeof SessionResponseSchema>;

export const CurrentSessionResponseSchema = z.object({
  session: SessionResponseSchema,
});

export type CurrentSessionResponse = z.infer<typeof CurrentSessionResponseSchema>;

export const ListSessionsResponseSchema = z.object({
  sessions: z.array(SessionResponseSchema),
});

export type ListSessionsResponse = z.infer<typeof ListSessionsResponseSchema>;

export const RevokeSessionResponseSchema = z.object({
  id: z.string(),
  revoked: z.literal(true),
});

export type RevokeSessionResponse = z.infer<typeof RevokeSessionResponseSchema>;

export const RevokeOtherSessionsResponseSchema = z.object({
  revokedSessionIds: z.array(z.string()),
});

export type RevokeOtherSessionsResponse = z.infer<typeof RevokeOtherSessionsResponseSchema>;

export const SessionParamsSchema = z.object({
  id: z.string().min(1),
});

export type SessionParams = z.infer<typeof SessionParamsSchema>;
