import type { AccessTokenPayload } from '@kolab/auth';
import type { LiveSession as PrismaLiveSession } from '@kolab/database';
import { MembershipStatus, Prisma, prisma } from '@kolab/database';
import type { LiveSessionSummaryResponse } from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toMetadataRecord } from './live-intelligence.utils';
import {
  buildLiveSessionSummary,
  parseLiveSessionSummary,
  type SummaryEventInput,
} from './live-intelligence-session-summary.utils';

@Injectable()
export class LiveIntelligenceSessionSummaryService {
  constructor(private readonly auditService: AuditService) {}

  async generateSessionSummary(
    user: AccessTokenPayload,
    sessionId: string,
  ): Promise<LiveSessionSummaryResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);
    const [events, topGifters] = await Promise.all([
      this.loadSessionEvents(organizationId, sessionId),
      this.loadTopGifters(organizationId, sessionId),
    ]);

    const summary = buildLiveSessionSummary({
      session,
      events: this.toSummaryEvents(events),
      topGifters,
    });

    await prisma.liveSession.update({
      where: { id: session.id },
      data: {
        metadata: {
          ...toMetadataRecord(session.metadata),
          liveSummary: summary,
        } as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_SESSION_SUMMARY_GENERATED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: session.id,
      metadata: {
        liveSessionId: session.id,
        generatedAt: summary.generatedAt,
        topMomentsCount: summary.topMoments.length,
      },
    });

    return summary;
  }

  async getSessionSummary(
    user: AccessTokenPayload,
    sessionId: string,
  ): Promise<LiveSessionSummaryResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);
    const summary = parseLiveSessionSummary(session.id, session.metadata);

    if (!summary) {
      throw new NotFoundException('Live session summary not found for this session');
    }

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_SESSION_SUMMARY_VIEWED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: session.id,
      metadata: {
        liveSessionId: session.id,
        generatedAt: summary.generatedAt,
      },
    });

    return summary;
  }

  private toSummaryEvents(
    events: Array<{
      id: string;
      eventType: string;
      occurredAt: Date;
      offsetMs: number | null;
      externalActorId: string | null;
      actorDisplayName: string | null;
      payload: unknown;
      metadata: unknown;
    }>,
  ): SummaryEventInput[] {
    return events.map((event) => ({
      id: event.id,
      eventType: event.eventType as SummaryEventInput['eventType'],
      occurredAt: event.occurredAt,
      offsetMs: event.offsetMs,
      externalActorId: event.externalActorId,
      actorDisplayName: event.actorDisplayName,
      payload: event.payload,
    }));
  }

  private async loadTopGifters(organizationId: string, sessionId: string) {
    const stats = await prisma.gifterSessionStats.findMany({
      where: {
        organizationId,
        liveSessionId: sessionId,
      },
      include: {
        gifterProfile: true,
      },
      orderBy: [{ giftValue: 'desc' }, { giftCount: 'desc' }, { id: 'desc' }],
      take: 5,
    });

    return stats.map((row) => ({
      gifterProfileId: row.gifterProfileId,
      externalGifterId: row.gifterProfile.externalGifterId,
      displayName: row.gifterProfile.displayName,
      giftCount: row.giftCount,
      giftValue: row.giftValue.toString(),
      spendingTier: row.gifterProfile.spendingTier,
    }));
  }

  private async loadSessionEvents(organizationId: string, sessionId: string) {
    return prisma.liveEvent.findMany({
      where: {
        organizationId,
        liveSessionId: sessionId,
      },
      orderBy: [{ occurredAt: 'asc' }, { offsetMs: 'asc' }, { id: 'asc' }],
    });
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
