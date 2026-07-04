import type { AccessTokenPayload } from '@kolab/auth';
import type { LiveSession as PrismaLiveSession } from '@kolab/database';
import { MembershipStatus, Prisma, prisma } from '@kolab/database';
import type { SessionCoachAlertsResponse } from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toMetadataRecord } from './live-intelligence.utils';
import {
  buildSessionCoachAlerts,
  COACH_ALERTS_METADATA_KEY,
  type CoachAlertEventInput,
  parseSessionCoachAlerts,
} from './live-intelligence-coach-alerts.utils';
import { parseSessionRecommendations } from './live-intelligence-recommendations.utils';

@Injectable()
export class LiveIntelligenceCoachAlertsService {
  constructor(private readonly auditService: AuditService) {}

  async generateSessionCoachAlerts(
    user: AccessTokenPayload,
    sessionId: string,
  ): Promise<SessionCoachAlertsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);
    const [events, topGifters] = await Promise.all([
      this.loadSessionEvents(organizationId, sessionId),
      this.loadTopGifters(organizationId, sessionId),
    ]);

    const alerts = buildSessionCoachAlerts({
      session,
      events: this.toCoachAlertEvents(events),
      topGifters,
      recommendations: parseSessionRecommendations(session.id, session.metadata),
    });

    await prisma.liveSession.update({
      where: { id: session.id },
      data: {
        metadata: {
          ...toMetadataRecord(session.metadata),
          [COACH_ALERTS_METADATA_KEY]: alerts,
        } as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_COACH_ALERTS_GENERATED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: session.id,
      metadata: {
        liveSessionId: session.id,
        generatedAt: alerts.generatedAt,
        alertCount: alerts.alerts.length,
      },
    });

    return alerts;
  }

  async getSessionCoachAlerts(
    user: AccessTokenPayload,
    sessionId: string,
  ): Promise<SessionCoachAlertsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);
    const alerts = parseSessionCoachAlerts(session.id, session.metadata);

    if (!alerts) {
      throw new NotFoundException('Live session coach alerts not found for this session');
    }

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_COACH_ALERTS_VIEWED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: session.id,
      metadata: {
        liveSessionId: session.id,
        generatedAt: alerts.generatedAt,
        alertCount: alerts.alerts.length,
      },
    });

    return alerts;
  }

  private toCoachAlertEvents(
    events: Array<{
      id: string;
      eventType: string;
      occurredAt: Date;
      offsetMs: number | null;
      externalActorId: string | null;
      actorDisplayName: string | null;
      payload: unknown;
    }>,
  ): CoachAlertEventInput[] {
    return events.map((event) => ({
      id: event.id,
      eventType: event.eventType as CoachAlertEventInput['eventType'],
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
