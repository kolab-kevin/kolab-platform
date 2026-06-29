import { z } from 'zod';

import { DateTimeStringSchema } from '../common/datetime';
import { PaginationQuerySchema } from '../common/pagination';

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  expiresAt: DateTimeStringSchema,
  revokedAt: DateTimeStringSchema.nullable(),
});

export type Session = z.infer<typeof SessionSchema>;

/** API response — excludes sensitive `refreshTokenHash`. */
export const SessionResponseSchema = SessionSchema.extend({
  isCurrent: z.boolean().optional(),
});

export type SessionResponse = z.infer<typeof SessionResponseSchema>;

export const SessionListQuerySchema = PaginationQuerySchema.extend({
  includeRevoked: z.coerce.boolean().optional().default(false),
});

export type SessionListQuery = z.infer<typeof SessionListQuerySchema>;

export const RevokeSessionParamsSchema = z.object({
  sessionId: z.string(),
});

export type RevokeSessionParams = z.infer<typeof RevokeSessionParamsSchema>;
