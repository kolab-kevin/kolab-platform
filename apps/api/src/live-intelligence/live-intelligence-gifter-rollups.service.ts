import type { AccessTokenPayload } from '@kolab/auth';
import type { LiveSession as PrismaLiveSession } from '@kolab/database';
import { MembershipStatus, Prisma, prisma } from '@kolab/database';
import type { ProcessGifterRollupsResponse } from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import {
  applyRollupEvent,
  calculateSpendingTier,
  createInitialAccumulator,
  GIFTER_ROLLUP_EVENT_TYPES,
  type GifterRollupCheckpoint,
  type LiveEventForRollup,
  mergeProfileRollupMetadata,
  mergeSessionMetadataCheckpoint,
  parseGifterRollupCheckpoint,
  parseGiftPayload,
  parseProfileRollupState,
} from './live-intelligence-gifter-rollups.utils';

@Injectable()
export class LiveIntelligenceGifterRollupsService {
  constructor(private readonly auditService: AuditService) {}

  async processGifterRollups(
    user: AccessTokenPayload,
    sessionId: string,
  ): Promise<ProcessGifterRollupsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const session = await this.loadSession(organizationId, sessionId);
    const checkpoint = parseGifterRollupCheckpoint(session.metadata);
    const processedEventIds = new Set(checkpoint.processedEventIds);

    const events = await prisma.liveEvent.findMany({
      where: {
        organizationId,
        liveSessionId: sessionId,
        eventType: { in: [...GIFTER_ROLLUP_EVENT_TYPES] },
      },
      orderBy: [{ occurredAt: 'asc' }, { offsetMs: 'asc' }, { id: 'asc' }],
    });

    const pendingEvents = events.filter((event) => !processedEventIds.has(event.id));
    const skippedEventCount = events.length - pendingEvents.length;

    let processedEventCount = 0;
    let profilesUpdated = 0;
    let sessionStatsUpdated = 0;
    let sessionGiftCountDelta = 0;
    let sessionGiftValueDelta = new Prisma.Decimal(0);
    let lastProcessedAt = checkpoint.lastProcessedAt;

    await prisma.$transaction(async (tx) => {
      for (const event of pendingEvents) {
        const rollupEvent = this.toRollupEvent(event);
        checkpoint.processedEventIds.push(event.id);
        lastProcessedAt = event.occurredAt.toISOString();
        processedEventCount += 1;

        if (rollupEvent.eventType === 'GIFT_RECEIVED') {
          const gift = parseGiftPayload(rollupEvent.payload);
          sessionGiftCountDelta += gift.giftCount;
          sessionGiftValueDelta = sessionGiftValueDelta.add(gift.giftValue);
        }

        if (!rollupEvent.externalActorId) {
          continue;
        }

        const existingProfile = await tx.gifterProfile.findUnique({
          where: {
            organizationId_platform_externalGifterId: {
              organizationId,
              platform: session.platform,
              externalGifterId: rollupEvent.externalActorId,
            },
          },
        });

        const existingSessionStats = existingProfile
          ? await tx.gifterSessionStats.findUnique({
              where: {
                gifterProfileId_liveSessionId: {
                  gifterProfileId: existingProfile.id,
                  liveSessionId: session.id,
                },
              },
            })
          : null;

        const initialAccumulator = existingProfile
          ? this.buildAccumulatorFromExisting(existingProfile, existingSessionStats)
          : createInitialAccumulator(rollupEvent.actorDisplayName, rollupEvent.occurredAt);

        const accumulator = applyRollupEvent(initialAccumulator, rollupEvent, session.id);
        const spendingTier = calculateSpendingTier(accumulator.totalGiftValue);

        let profileId = existingProfile?.id;
        if (existingProfile) {
          await tx.gifterProfile.update({
            where: { id: existingProfile.id },
            data: {
              displayName: accumulator.displayName,
              totalGiftCount: accumulator.totalGiftCount,
              totalGiftValue: accumulator.totalGiftValue,
              totalSessions: accumulator.totalSessions,
              firstSeenAt: accumulator.firstSeenAt,
              lastSeenAt: accumulator.lastSeenAt,
              favoriteCreatorProfileId: accumulator.favoriteCreatorProfileId,
              favoriteGiftType: accumulator.favoriteGiftType,
              spendingTier,
              metadata: mergeProfileRollupMetadata(
                existingProfile.metadata,
                accumulator.rollupState,
              ) as Prisma.InputJsonValue,
            },
          });
          profilesUpdated += 1;
        } else {
          const createdProfile = await tx.gifterProfile.create({
            data: {
              organizationId,
              platform: session.platform,
              externalGifterId: rollupEvent.externalActorId,
              displayName: accumulator.displayName,
              totalGiftCount: accumulator.totalGiftCount,
              totalGiftValue: accumulator.totalGiftValue,
              totalSessions: accumulator.totalSessions,
              firstSeenAt: accumulator.firstSeenAt,
              lastSeenAt: accumulator.lastSeenAt,
              favoriteCreatorProfileId: accumulator.favoriteCreatorProfileId,
              favoriteGiftType: accumulator.favoriteGiftType,
              spendingTier,
              metadata: mergeProfileRollupMetadata(
                {},
                accumulator.rollupState,
              ) as Prisma.InputJsonValue,
            },
          });
          profileId = createdProfile.id;
          profilesUpdated += 1;
        }

        if (existingSessionStats) {
          await tx.gifterSessionStats.update({
            where: { id: existingSessionStats.id },
            data: {
              giftCount: accumulator.sessionStats.giftCount,
              giftValue: accumulator.sessionStats.giftValue,
              firstGiftAt: accumulator.sessionStats.firstGiftAt,
              lastGiftAt: accumulator.sessionStats.lastGiftAt,
              firstSeenAt: accumulator.sessionStats.firstSeenAt,
              lastSeenAt: accumulator.sessionStats.lastSeenAt,
              chatMessageCount: accumulator.sessionStats.chatMessageCount,
            },
          });
          sessionStatsUpdated += 1;
        } else if (profileId) {
          await tx.gifterSessionStats.create({
            data: {
              organizationId,
              gifterProfileId: profileId,
              liveSessionId: session.id,
              creatorProfileId: session.creatorProfileId,
              giftCount: accumulator.sessionStats.giftCount,
              giftValue: accumulator.sessionStats.giftValue,
              firstGiftAt: accumulator.sessionStats.firstGiftAt,
              lastGiftAt: accumulator.sessionStats.lastGiftAt,
              firstSeenAt: accumulator.sessionStats.firstSeenAt,
              lastSeenAt: accumulator.sessionStats.lastSeenAt,
              chatMessageCount: accumulator.sessionStats.chatMessageCount,
            },
          });
          sessionStatsUpdated += 1;
        }
      }

      const nextCheckpoint: GifterRollupCheckpoint = {
        processedEventIds: checkpoint.processedEventIds,
        lastProcessedAt,
      };

      await tx.liveSession.update({
        where: { id: session.id },
        data: {
          totalGifts: (session.totalGifts ?? 0) + sessionGiftCountDelta,
          totalGiftValue: new Prisma.Decimal(session.totalGiftValue ?? 0).add(
            sessionGiftValueDelta,
          ),
          metadata: mergeSessionMetadataCheckpoint(
            session.metadata,
            nextCheckpoint,
          ) as Prisma.InputJsonValue,
        },
      });
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_GIFTER_ROLLUP_PROCESSED,
      targetType: AUDIT_TARGET_TYPE.LIVE_SESSION,
      targetId: session.id,
      metadata: {
        liveSessionId: session.id,
        processedEventCount,
        skippedEventCount,
        profilesUpdated,
        sessionStatsUpdated,
      },
    });

    return {
      liveSessionId: session.id,
      processedEventCount,
      skippedEventCount,
      profilesUpdated,
      sessionStatsUpdated,
      checkpoint: {
        processedEventIds: checkpoint.processedEventIds,
        lastProcessedAt,
      },
    };
  }

  private buildAccumulatorFromExisting(
    profile: {
      totalGiftCount: number;
      totalGiftValue: Prisma.Decimal;
      totalSessions: number;
      firstSeenAt: Date | null;
      lastSeenAt: Date | null;
      displayName: string | null;
      favoriteCreatorProfileId: string | null;
      favoriteGiftType: string | null;
      metadata: unknown;
    },
    sessionStats: {
      giftCount: number;
      giftValue: Prisma.Decimal;
      firstGiftAt: Date | null;
      lastGiftAt: Date | null;
      firstSeenAt: Date | null;
      lastSeenAt: Date | null;
      chatMessageCount: number;
    } | null,
  ) {
    const rollupState = parseProfileRollupState(profile.metadata);

    return {
      totalGiftCount: profile.totalGiftCount,
      totalGiftValue: new Prisma.Decimal(profile.totalGiftValue),
      totalSessions: profile.totalSessions,
      firstSeenAt: profile.firstSeenAt,
      lastSeenAt: profile.lastSeenAt,
      displayName: profile.displayName,
      favoriteCreatorProfileId: profile.favoriteCreatorProfileId,
      favoriteGiftType: profile.favoriteGiftType,
      rollupState,
      sessionStats: sessionStats
        ? {
            giftCount: sessionStats.giftCount,
            giftValue: new Prisma.Decimal(sessionStats.giftValue),
            firstGiftAt: sessionStats.firstGiftAt,
            lastGiftAt: sessionStats.lastGiftAt,
            firstSeenAt: sessionStats.firstSeenAt,
            lastSeenAt: sessionStats.lastSeenAt,
            chatMessageCount: sessionStats.chatMessageCount,
          }
        : {
            giftCount: 0,
            giftValue: new Prisma.Decimal(0),
            firstGiftAt: null,
            lastGiftAt: null,
            firstSeenAt: null,
            lastSeenAt: null,
            chatMessageCount: 0,
          },
      sessionGiftCountDelta: 0,
      sessionGiftValueDelta: new Prisma.Decimal(0),
    };
  }

  private toRollupEvent(event: {
    id: string;
    eventType: string;
    occurredAt: Date;
    creatorProfileId: string;
    externalActorId: string | null;
    actorDisplayName: string | null;
    payload: unknown;
  }): LiveEventForRollup {
    return {
      id: event.id,
      eventType: event.eventType as LiveEventForRollup['eventType'],
      occurredAt: event.occurredAt,
      creatorProfileId: event.creatorProfileId,
      externalActorId: event.externalActorId,
      actorDisplayName: event.actorDisplayName,
      payload: event.payload,
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
