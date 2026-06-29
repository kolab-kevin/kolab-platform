import { z } from 'zod';

import { DateTimeStringSchema } from '../common/datetime';
import { JsonObjectSchema } from '../common/json';
import { PaginationQuerySchema } from '../common/pagination';

export const AuditLogSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullable(),
  actorUserId: z.string().nullable(),
  targetType: z.string(),
  targetId: z.string(),
  action: z.string(),
  metadata: JsonObjectSchema,
  createdAt: DateTimeStringSchema,
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export const AuditLogResponseSchema = AuditLogSchema.extend({
  requestId: z.string().optional(),
});

export type AuditLogResponse = z.infer<typeof AuditLogResponseSchema>;

export const AuditLogListQuerySchema = PaginationQuerySchema.extend({
  action: z.string().max(128).optional(),
  actorUserId: z.string().optional(),
  targetType: z.string().max(64).optional(),
  targetId: z.string().optional(),
  from: DateTimeStringSchema.optional(),
  to: DateTimeStringSchema.optional(),
});

export type AuditLogListQuery = z.infer<typeof AuditLogListQuerySchema>;

export const CreateAuditLogSchema = z.object({
  organizationId: z.string().nullable().optional(),
  actorUserId: z.string().nullable().optional(),
  targetType: z.string().min(1).max(64),
  targetId: z.string().min(1),
  action: z.string().min(1).max(128),
  metadata: JsonObjectSchema.optional(),
  requestId: z.string().optional(),
});

export type CreateAuditLogInput = z.infer<typeof CreateAuditLogSchema>;
