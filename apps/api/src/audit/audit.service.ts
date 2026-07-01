import type { AccessTokenPayload } from '@kolab/auth';
import { type AuditLog, Prisma, prisma } from '@kolab/database';
import type { AuditLogQuery, AuditLogResponse, ListAuditLogsResponse } from '@kolab/types';
import { ForbiddenException, Injectable } from '@nestjs/common';

import { sanitizeAuditMetadata } from './audit.utils';

export type RecordAuditInput = {
  organizationId: string | null;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  async record(input: RecordAuditInput): Promise<AuditLogResponse> {
    const metadata = sanitizeAuditMetadata(input.metadata ?? {});

    const auditLog = await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    return this.toAuditLogResponse(auditLog);
  }

  async listAuditLogs(
    user: AccessTokenPayload,
    query: AuditLogQuery,
  ): Promise<ListAuditLogsResponse> {
    const organizationId = this.requireOrganizationContext(user);

    const where = {
      organizationId,
      ...(query.action ? { action: query.action } : {}),
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const take = query.limit + 1;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = logs.length > query.limit;
    const items = hasMore ? logs.slice(0, query.limit) : logs;

    return {
      items: items.map((log) => this.toAuditLogResponse(log)),
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
    };
  }

  private requireOrganizationContext(user: AccessTokenPayload): string {
    if (!user.organizationId) {
      throw new ForbiddenException('Active organization context required');
    }

    return user.organizationId;
  }

  private toAuditLogResponse(log: AuditLog): AuditLogResponse {
    return {
      id: log.id,
      organizationId: log.organizationId,
      actorUserId: log.actorUserId,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: this.toMetadataRecord(log.metadata),
      createdAt: log.createdAt.toISOString(),
    };
  }

  private toMetadataRecord(value: AuditLog['metadata']): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }
}
