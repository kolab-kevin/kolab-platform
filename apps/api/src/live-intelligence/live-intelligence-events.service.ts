import type { AccessTokenPayload } from '@kolab/auth';
import type { LiveSession as PrismaLiveSession } from '@kolab/database';
import { MembershipStatus, Prisma, prisma } from '@kolab/database';
import type {
  BatchIngestLiveEventsInput,
  BatchIngestLiveEventsResponse,
  IngestLiveEventInput,
  IngestLiveEventResponse,
  ListLiveEventsResponse,
  LivePlatform,
  SessionLiveEventListQuery,
} from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toLiveEvent } from './live-intelligence.mapper';
import {
  assertLiveEventCreatorProfile,
  assertLiveEventPlatform,
  assertSafeLiveEventPayload,
} from './live-intelligence-events.utils';

@Injectable()
export class LiveIntelligenceEventsService {
  constructor(private readonly auditService: AuditService) {}

  async ingestEvent(
    user: AccessTokenPayload,
    sessionId: string,
    input: IngestLiveEventInput,
    options: { audit?: boolean } = {},
  ): Promise<IngestLiveEventResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);

    const result = await this.ingestEventForSession(organizationId, session, input);

    if (options.audit !== false && result.created) {
      await this.auditService.record({
        organizationId,
        actorUserId: user.sub,
        action: AUDIT_ACTION.LIVE_EVENT_INGESTED,
        targetType: AUDIT_TARGET_TYPE.LIVE_EVENT,
        targetId: result.event.id,
        metadata: {
          liveSessionId: session.id,
          eventType: result.event.eventType,
          platformEventId: result.event.platformEventId,
        },
      });
    }

    return result;
  }

  async ingestEventBatch(
    user: AccessTokenPayload,
    sessionId: string,
    input: BatchIngestLiveEventsInput,
  ): Promise<BatchIngestLiveEventsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);

    const items: IngestLiveEventResponse[] = [];

    for (const eventInput of input.events) {
      items.push(await this.ingestEventForSession(organizationId, session, eventInput));
    }

    const createdCount = items.filter((item) => item.created).length;
    const duplicateCount = items.length - createdCount;

    if (createdCount > 0) {
      await this.auditService.record({
        organizationId,
        actorUserId: user.sub,
        action: AUDIT_ACTION.LIVE_EVENT_BATCH_INGESTED,
        targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
        targetId: session.id,
        metadata: {
          liveSessionId: session.id,
          eventCount: items.length,
          createdCount,
          duplicateCount,
        },
      });
    }

    return {
      items,
      createdCount,
      duplicateCount,
    };
  }

  async listSessionEvents(
    user: AccessTokenPayload,
    sessionId: string,
    query: SessionLiveEventListQuery,
  ): Promise<ListLiveEventsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.loadSession(organizationId, sessionId);

    const take = query.limit + 1;

    const events = await prisma.liveEvent.findMany({
      where: {
        organizationId,
        liveSessionId: sessionId,
        ...(query.eventType ? { eventType: query.eventType } : {}),
        ...(query.externalActorId ? { externalActorId: query.externalActorId } : {}),
      },
      orderBy: [{ occurredAt: 'asc' }, { offsetMs: 'asc' }, { id: 'asc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = events.length > query.limit;
    const page = hasMore ? events.slice(0, query.limit) : events;

    return {
      items: page.map(toLiveEvent),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  private async ingestEventForSession(
    organizationId: string,
    session: PrismaLiveSession,
    input: IngestLiveEventInput,
  ): Promise<IngestLiveEventResponse> {
    assertLiveEventCreatorProfile(session.creatorProfileId, input.creatorProfileId);
    assertSafeLiveEventPayload(input.payload);

    const eventPlatform = (input.platform ?? session.platform) as LivePlatform;
    assertLiveEventPlatform(
      session.platform as LivePlatform,
      eventPlatform,
      input.allowPlatformMismatch,
    );

    if (input.metadata) {
      assertSafeLiveEventPayload(input.metadata, 'metadata');
    }

    if (input.platformEventId) {
      const existing = await prisma.liveEvent.findUnique({
        where: {
          organizationId_platform_platformEventId: {
            organizationId,
            platform: eventPlatform,
            platformEventId: input.platformEventId,
          },
        },
      });

      if (existing) {
        return {
          event: toLiveEvent(existing),
          created: false,
        };
      }
    }

    try {
      const created = await prisma.liveEvent.create({
        data: {
          organizationId,
          liveSessionId: session.id,
          creatorProfileId: session.creatorProfileId,
          eventType: input.eventType,
          occurredAt: new Date(input.occurredAt),
          offsetMs: input.offsetMs ?? null,
          platform: eventPlatform,
          platformEventId: input.platformEventId ?? null,
          externalActorId: input.externalActorId ?? null,
          actorDisplayName: input.actorDisplayName ?? null,
          payload: input.payload as Prisma.InputJsonValue,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      return {
        event: toLiveEvent(created),
        created: true,
      };
    } catch (error) {
      if (
        input.platformEventId &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await prisma.liveEvent.findUnique({
          where: {
            organizationId_platform_platformEventId: {
              organizationId,
              platform: eventPlatform,
              platformEventId: input.platformEventId,
            },
          },
        });

        if (existing) {
          return {
            event: toLiveEvent(existing),
            created: false,
          };
        }
      }

      throw error;
    }
  }

  private async requireActiveOrganization(user: AccessTokenPayload): Promise<string> {
    if (!user.organizationId) {
      throw new ForbiddenException('Active organization context required');
    }

    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: user.organizationId,
          userId: user.sub,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('No active membership in selected organization');
    }

    return user.organizationId;
  }

  private async loadSession(organizationId: string, sessionId: string): Promise<PrismaLiveSession> {
    const session = await prisma.liveSession.findFirst({
      where: {
        id: sessionId,
        organizationId,
      },
    });

    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    return session;
  }
}
