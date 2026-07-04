import type { AccessTokenPayload } from '@kolab/auth';
import type { LiveSession as PrismaLiveSession } from '@kolab/database';
import { MembershipStatus, Prisma, prisma } from '@kolab/database';
import type { SessionRecommendationsResponse } from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toMetadataRecord } from './live-intelligence.utils';
import {
  buildSessionRecommendations,
  parseSessionRecommendations,
  type RecommendationEventInput,
  RECOMMENDATIONS_METADATA_KEY,
} from './live-intelligence-recommendations.utils';

@Injectable()
export class LiveIntelligenceRecommendationsService {
  constructor(private readonly auditService: AuditService) {}

  async generateSessionRecommendations(
    user: AccessTokenPayload,
    sessionId: string,
  ): Promise<SessionRecommendationsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);
    const [events, topGifters, recentSessions, schedules, absentWhales] = await Promise.all([
      this.loadSessionEvents(organizationId, sessionId),
      this.loadTopGifters(organizationId, sessionId),
      this.loadRecentSessions(organizationId, session.creatorProfileId, sessionId),
      this.loadCreatorSchedules(organizationId, session.creatorProfileId),
      this.loadAbsentWhales(organizationId, session.creatorProfileId, sessionId),
    ]);

    const recommendations = buildSessionRecommendations({
      session,
      events: this.toRecommendationEvents(events),
      topGifters,
      recentSessions,
      schedules,
      absentWhales,
    });

    await prisma.liveSession.update({
      where: { id: session.id },
      data: {
        metadata: {
          ...toMetadataRecord(session.metadata),
          [RECOMMENDATIONS_METADATA_KEY]: recommendations,
        } as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_RECOMMENDATIONS_GENERATED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: session.id,
      metadata: {
        liveSessionId: session.id,
        generatedAt: recommendations.generatedAt,
        recommendationCount: recommendations.recommendations.length,
      },
    });

    return recommendations;
  }

  async getSessionRecommendations(
    user: AccessTokenPayload,
    sessionId: string,
  ): Promise<SessionRecommendationsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);
    const recommendations = parseSessionRecommendations(session.id, session.metadata);

    if (!recommendations) {
      throw new NotFoundException('Live session recommendations not found for this session');
    }

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_RECOMMENDATIONS_VIEWED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: session.id,
      metadata: {
        liveSessionId: session.id,
        generatedAt: recommendations.generatedAt,
        recommendationCount: recommendations.recommendations.length,
      },
    });

    return recommendations;
  }

  private toRecommendationEvents(
    events: Array<{
      id: string;
      eventType: string;
      occurredAt: Date;
      offsetMs: number | null;
      externalActorId: string | null;
      actorDisplayName: string | null;
      payload: unknown;
    }>,
  ): RecommendationEventInput[] {
    return events.map((event) => ({
      id: event.id,
      eventType: event.eventType as RecommendationEventInput['eventType'],
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

  private async loadRecentSessions(
    organizationId: string,
    creatorProfileId: string,
    sessionId: string,
  ) {
    return prisma.liveSession.findMany({
      where: {
        organizationId,
        creatorProfileId,
        id: { not: sessionId },
        status: 'ENDED',
      },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      take: 5,
      select: {
        id: true,
        startedAt: true,
        status: true,
      },
    });
  }

  private async loadCreatorSchedules(organizationId: string, creatorProfileId: string) {
    return prisma.creatorLiveSchedule.findMany({
      where: {
        organizationId,
        creatorProfileId,
        active: true,
      },
      select: {
        weekdays: true,
        startTime: true,
        endTime: true,
        active: true,
      },
    });
  }

  private async loadAbsentWhales(
    organizationId: string,
    creatorProfileId: string,
    sessionId: string,
  ) {
    const currentStats = await prisma.gifterSessionStats.findMany({
      where: {
        organizationId,
        liveSessionId: sessionId,
      },
      select: {
        gifterProfileId: true,
      },
    });
    const currentGifterIds = new Set(currentStats.map((row) => row.gifterProfileId));

    const whales = await prisma.gifterProfile.findMany({
      where: {
        organizationId,
        spendingTier: { in: ['WHALE', 'VIP'] },
        sessionStats: {
          some: {
            creatorProfileId,
            liveSessionId: { not: sessionId },
            giftCount: { gt: 0 },
          },
        },
      },
      include: {
        sessionStats: {
          where: {
            creatorProfileId,
            giftCount: { gt: 0 },
          },
          orderBy: [{ lastGiftAt: 'desc' }, { id: 'desc' }],
          take: 1,
        },
      },
    });

    return whales
      .filter((profile) => !currentGifterIds.has(profile.id))
      .map((profile) => ({
        gifterProfileId: profile.id,
        externalGifterId: profile.externalGifterId,
        displayName: profile.displayName,
        lastSessionId: profile.sessionStats[0]?.liveSessionId ?? '',
        lastGiftValue: Number(profile.sessionStats[0]?.giftValue.toString() ?? 0),
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
