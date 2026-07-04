import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CreatorLiveSchedule as PrismaCreatorLiveSchedule,
  LiveSession as PrismaLiveSession,
} from '@kolab/database';
import { LiveSessionStatus, MembershipStatus, Prisma, prisma } from '@kolab/database';
import type {
  CreateCreatorLiveScheduleInput,
  CreateLiveSessionInput,
  CreatorLiveSchedule,
  CreatorLiveScheduleListQuery,
  ListCreatorLiveSchedulesResponse,
  ListLiveSessionsResponse,
  LiveSession,
  LiveSessionListQuery,
  UpdateCreatorLiveScheduleInput,
  UpdateLiveSessionInput,
  UpdateLiveSessionStatusInput,
} from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toCreatorLiveSchedule, toLiveSession } from './live-intelligence.mapper';
import {
  assertAllowedLiveSessionStatusTransition,
  assertLiveSessionIsEditable,
  computeDurationSeconds,
} from './live-intelligence.utils';

@Injectable()
export class LiveIntelligenceService {
  constructor(private readonly auditService: AuditService) {}

  async listSessions(
    user: AccessTokenPayload,
    query: LiveSessionListQuery,
  ): Promise<ListLiveSessionsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const take = query.limit + 1;

    const sessions = await prisma.liveSession.findMany({
      where: {
        organizationId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.platform ? { platform: query.platform } : {}),
        ...(query.creatorProfileId ? { creatorProfileId: query.creatorProfileId } : {}),
        ...(query.campaignId ? { campaignId: query.campaignId } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = sessions.length > query.limit;
    const page = hasMore ? sessions.slice(0, query.limit) : sessions;

    return {
      items: page.map(toLiveSession),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getSession(user: AccessTokenPayload, sessionId: string): Promise<LiveSession> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);

    return toLiveSession(session);
  }

  async createSession(
    user: AccessTokenPayload,
    input: CreateLiveSessionInput,
  ): Promise<LiveSession> {
    const organizationId = await this.requireActiveOrganization(user);

    await this.loadCreatorProfile(organizationId, input.creatorProfileId);

    if (input.campaignId) {
      await this.loadCampaign(organizationId, input.campaignId);
    }

    const session = await prisma.liveSession.create({
      data: {
        organizationId,
        creatorProfileId: input.creatorProfileId,
        campaignId: input.campaignId ?? null,
        platform: input.platform,
        platformSessionId: input.platformSessionId ?? null,
        title: input.title,
        description: input.description ?? null,
        scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : null,
        scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : null,
        status: LiveSessionStatus.SCHEDULED,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_SESSION_CREATED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: session.id,
      metadata: {
        creatorProfileId: session.creatorProfileId,
        campaignId: session.campaignId,
        platform: session.platform,
        status: session.status,
      },
    });

    return toLiveSession(session);
  }

  async updateSession(
    user: AccessTokenPayload,
    sessionId: string,
    input: UpdateLiveSessionInput,
  ): Promise<LiveSession> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.loadSession(organizationId, sessionId);

    assertLiveSessionIsEditable(existing.status as LiveSession['status'], input);

    if (input.campaignId) {
      await this.loadCampaign(organizationId, input.campaignId);
    }

    const updated = await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        ...(input.campaignId !== undefined ? { campaignId: input.campaignId } : {}),
        ...(input.platform !== undefined ? { platform: input.platform } : {}),
        ...(input.platformSessionId !== undefined
          ? { platformSessionId: input.platformSessionId }
          : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.scheduledStart !== undefined
          ? { scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : null }
          : {}),
        ...(input.scheduledEnd !== undefined
          ? { scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : null }
          : {}),
        ...(input.peakViewers !== undefined ? { peakViewers: input.peakViewers } : {}),
        ...(input.totalViewers !== undefined ? { totalViewers: input.totalViewers } : {}),
        ...(input.totalGifts !== undefined ? { totalGifts: input.totalGifts } : {}),
        ...(input.totalGiftValue !== undefined
          ? {
              totalGiftValue:
                input.totalGiftValue === null ? null : new Prisma.Decimal(input.totalGiftValue),
            }
          : {}),
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_SESSION_UPDATED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: updated.id,
      metadata: {
        status: updated.status,
      },
    });

    return toLiveSession(updated);
  }

  async updateSessionStatus(
    user: AccessTokenPayload,
    sessionId: string,
    input: UpdateLiveSessionStatusInput,
  ): Promise<LiveSession> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.loadSession(organizationId, sessionId);
    const currentStatus = existing.status as LiveSession['status'];
    const nextStatus = input.status;

    assertAllowedLiveSessionStatusTransition(currentStatus, nextStatus);

    const now = new Date();
    const startedAt = nextStatus === 'LIVE' && !existing.startedAt ? now : existing.startedAt;
    const endedAt = nextStatus === 'ENDED' ? now : existing.endedAt;
    const durationSeconds =
      nextStatus === 'ENDED' && startedAt && existing.durationSeconds === null
        ? computeDurationSeconds(startedAt, now)
        : existing.durationSeconds;

    const updated = await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        status: nextStatus,
        ...(nextStatus === 'LIVE' ? { startedAt } : {}),
        ...(nextStatus === 'ENDED' ? { endedAt, durationSeconds } : {}),
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_SESSION_STATUS_CHANGED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: updated.id,
      metadata: {
        previousStatus: currentStatus,
        status: nextStatus,
      },
    });

    return toLiveSession(updated);
  }

  async listSchedules(
    user: AccessTokenPayload,
    query: CreatorLiveScheduleListQuery,
  ): Promise<ListCreatorLiveSchedulesResponse> {
    const organizationId = await this.requireActiveOrganization(user);

    const schedules = await prisma.creatorLiveSchedule.findMany({
      where: {
        organizationId,
        ...(query.creatorProfileId ? { creatorProfileId: query.creatorProfileId } : {}),
        ...(query.active !== undefined ? { active: query.active } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return {
      items: schedules.map(toCreatorLiveSchedule),
    };
  }

  async getSchedule(user: AccessTokenPayload, scheduleId: string): Promise<CreatorLiveSchedule> {
    const organizationId = await this.requireActiveOrganization(user);
    const schedule = await this.loadSchedule(organizationId, scheduleId);

    return toCreatorLiveSchedule(schedule);
  }

  async createSchedule(
    user: AccessTokenPayload,
    input: CreateCreatorLiveScheduleInput,
  ): Promise<CreatorLiveSchedule> {
    const organizationId = await this.requireActiveOrganization(user);

    await this.loadCreatorProfile(organizationId, input.creatorProfileId);

    const schedule = await prisma.creatorLiveSchedule.create({
      data: {
        organizationId,
        creatorProfileId: input.creatorProfileId,
        timezone: input.timezone,
        recurrenceRule: input.recurrenceRule ?? null,
        weekdays: input.weekdays,
        startTime: input.startTime,
        endTime: input.endTime,
        active: input.active ?? true,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_SCHEDULE_CREATED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SCHEDULE,
      targetId: schedule.id,
      metadata: {
        creatorProfileId: schedule.creatorProfileId,
        active: schedule.active,
      },
    });

    return toCreatorLiveSchedule(schedule);
  }

  async updateSchedule(
    user: AccessTokenPayload,
    scheduleId: string,
    input: UpdateCreatorLiveScheduleInput,
  ): Promise<CreatorLiveSchedule> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.loadSchedule(organizationId, scheduleId);

    const updated = await prisma.creatorLiveSchedule.update({
      where: { id: scheduleId },
      data: {
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
        ...(input.recurrenceRule !== undefined ? { recurrenceRule: input.recurrenceRule } : {}),
        ...(input.weekdays !== undefined ? { weekdays: input.weekdays } : {}),
        ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
        ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_SCHEDULE_UPDATED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SCHEDULE,
      targetId: updated.id,
      metadata: {
        active: updated.active,
      },
    });

    return toCreatorLiveSchedule(updated);
  }

  async deleteSchedule(user: AccessTokenPayload, scheduleId: string): Promise<void> {
    const organizationId = await this.requireActiveOrganization(user);
    const schedule = await this.loadSchedule(organizationId, scheduleId);

    await prisma.creatorLiveSchedule.delete({
      where: { id: scheduleId },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_SCHEDULE_DELETED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SCHEDULE,
      targetId: schedule.id,
      metadata: {
        creatorProfileId: schedule.creatorProfileId,
      },
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

  private async loadSchedule(
    organizationId: string,
    scheduleId: string,
  ): Promise<PrismaCreatorLiveSchedule> {
    const schedule = await prisma.creatorLiveSchedule.findFirst({
      where: {
        id: scheduleId,
        organizationId,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Live schedule not found');
    }

    return schedule;
  }

  private async loadCampaign(organizationId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        organizationId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  private async loadCreatorProfile(organizationId: string, creatorProfileId: string) {
    const creatorProfile = await prisma.creatorProfile.findFirst({
      where: {
        id: creatorProfileId,
        organizationId,
      },
    });

    if (!creatorProfile) {
      throw new NotFoundException('Creator profile not found');
    }

    return creatorProfile;
  }
}
