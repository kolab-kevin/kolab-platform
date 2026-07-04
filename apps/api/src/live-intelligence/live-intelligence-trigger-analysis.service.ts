import type { AccessTokenPayload } from '@kolab/auth';
import type { LiveSession as PrismaLiveSession } from '@kolab/database';
import { MembershipStatus, Prisma, prisma } from '@kolab/database';
import type { SessionTriggerAnalysisResponse } from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toMetadataRecord } from './live-intelligence.utils';
import {
  buildSessionTriggerAnalysis,
  parseSessionTriggerAnalysis,
  type TriggerAnalysisEventInput,
} from './live-intelligence-trigger-analysis.utils';

@Injectable()
export class LiveIntelligenceTriggerAnalysisService {
  constructor(private readonly auditService: AuditService) {}

  async generateSessionTriggerAnalysis(
    user: AccessTokenPayload,
    sessionId: string,
  ): Promise<SessionTriggerAnalysisResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);
    const events = await this.loadSessionEvents(organizationId, sessionId);
    const analysis = buildSessionTriggerAnalysis(
      session.id,
      this.toTriggerAnalysisEvents(events),
      session.startedAt,
    );

    await prisma.liveSession.update({
      where: { id: session.id },
      data: {
        metadata: {
          ...toMetadataRecord(session.metadata),
          triggerAnalysis: analysis,
        } as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_TRIGGER_ANALYSIS_GENERATED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: session.id,
      metadata: {
        liveSessionId: session.id,
        totalTriggers: analysis.summary.totalTriggers,
        generatedAt: analysis.summary.generatedAt,
      },
    });

    return analysis;
  }

  async getSessionTriggerAnalysis(
    user: AccessTokenPayload,
    sessionId: string,
  ): Promise<SessionTriggerAnalysisResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);
    const analysis = parseSessionTriggerAnalysis(session.id, session.metadata);

    if (!analysis) {
      throw new NotFoundException('Trigger analysis not found for this session');
    }

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_TRIGGER_ANALYSIS_VIEWED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: session.id,
      metadata: {
        liveSessionId: session.id,
        totalTriggers: analysis.summary.totalTriggers,
        generatedAt: analysis.summary.generatedAt,
      },
    });

    return analysis;
  }

  private toTriggerAnalysisEvents(
    events: Array<{
      id: string;
      eventType: string;
      occurredAt: Date;
      offsetMs: number | null;
      payload: unknown;
      metadata: unknown;
    }>,
  ): TriggerAnalysisEventInput[] {
    return events.map((event) => ({
      id: event.id,
      eventType: event.eventType as TriggerAnalysisEventInput['eventType'],
      occurredAt: event.occurredAt,
      offsetMs: event.offsetMs,
      payload: event.payload,
      metadata: event.metadata,
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
