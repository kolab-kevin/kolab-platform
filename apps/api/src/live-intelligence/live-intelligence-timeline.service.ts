import type { AccessTokenPayload } from '@kolab/auth';
import type { LiveSession as PrismaLiveSession } from '@kolab/database';
import { MembershipStatus, Prisma, prisma } from '@kolab/database';
import type {
  SessionHighlightsResponse,
  SessionReplayResponse,
  SessionTimelineQuery,
  SessionTimelineResponse,
} from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toLiveEvent } from './live-intelligence.mapper';
import {
  buildReplaySegments,
  buildSessionHighlights,
  REPLAY_SEGMENT_DURATION_MS,
  type TimelineEventInput,
} from './live-intelligence-timeline.utils';

@Injectable()
export class LiveIntelligenceTimelineService {
  constructor(private readonly auditService: AuditService) {}

  async getSessionTimeline(
    user: AccessTokenPayload,
    sessionId: string,
    query: SessionTimelineQuery,
  ): Promise<SessionTimelineResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.loadSession(organizationId, sessionId);

    const take = query.limit + 1;
    const events = await prisma.liveEvent.findMany({
      where: this.buildTimelineWhere(organizationId, sessionId, query),
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

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_TIMELINE_VIEWED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: sessionId,
      metadata: {
        liveSessionId: sessionId,
        limit: query.limit,
        resultCount: page.length,
        eventType: query.eventType ?? null,
        actorId: query.actorId ?? null,
      },
    });

    return {
      liveSessionId: sessionId,
      items: page.map(toLiveEvent),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getSessionReplay(
    user: AccessTokenPayload,
    sessionId: string,
  ): Promise<SessionReplayResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);

    const events = await prisma.liveEvent.findMany({
      where: {
        organizationId,
        liveSessionId: sessionId,
      },
      orderBy: [{ occurredAt: 'asc' }, { offsetMs: 'asc' }, { id: 'asc' }],
    });

    const mappedEvents = events.map(toLiveEvent);
    const segments = buildReplaySegments(mappedEvents, session.startedAt);

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_REPLAY_VIEWED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: sessionId,
      metadata: {
        liveSessionId: sessionId,
        segmentCount: segments.length,
        eventCount: mappedEvents.length,
      },
    });

    return {
      liveSessionId: sessionId,
      segmentDurationMs: REPLAY_SEGMENT_DURATION_MS,
      segments,
    };
  }

  async getSessionHighlights(
    user: AccessTokenPayload,
    sessionId: string,
  ): Promise<SessionHighlightsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);

    const events = await prisma.liveEvent.findMany({
      where: {
        organizationId,
        liveSessionId: sessionId,
      },
      orderBy: [{ occurredAt: 'asc' }, { offsetMs: 'asc' }, { id: 'asc' }],
    });

    const timelineEvents: TimelineEventInput[] = events.map((event) => ({
      id: event.id,
      eventType: event.eventType as TimelineEventInput['eventType'],
      occurredAt: event.occurredAt,
      offsetMs: event.offsetMs,
      externalActorId: event.externalActorId,
      actorDisplayName: event.actorDisplayName,
      payload: event.payload,
    }));

    return {
      liveSessionId: sessionId,
      items: buildSessionHighlights(timelineEvents, session.startedAt),
    };
  }

  private buildTimelineWhere(
    organizationId: string,
    sessionId: string,
    query: SessionTimelineQuery,
  ): Prisma.LiveEventWhereInput {
    const offsetFilter =
      query.fromOffsetMs !== undefined || query.toOffsetMs !== undefined
        ? {
            ...(query.fromOffsetMs !== undefined ? { gte: query.fromOffsetMs } : {}),
            ...(query.toOffsetMs !== undefined ? { lte: query.toOffsetMs } : {}),
          }
        : undefined;

    return {
      organizationId,
      liveSessionId: sessionId,
      ...(query.eventType ? { eventType: query.eventType } : {}),
      ...(query.actorId ? { externalActorId: query.actorId } : {}),
      ...(offsetFilter ? { offsetMs: offsetFilter } : {}),
    };
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
