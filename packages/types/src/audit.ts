import { z } from 'zod';

export const AuditLogQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().min(1).optional(),
  actorUserId: z.string().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>;

export const AuditLogResponseSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullable(),
  actorUserId: z.string().nullable(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});

export type AuditLogResponse = z.infer<typeof AuditLogResponseSchema>;

export const ListAuditLogsResponseSchema = z.object({
  items: z.array(AuditLogResponseSchema),
  nextCursor: z.string().nullable(),
});

export type ListAuditLogsResponse = z.infer<typeof ListAuditLogsResponseSchema>;
