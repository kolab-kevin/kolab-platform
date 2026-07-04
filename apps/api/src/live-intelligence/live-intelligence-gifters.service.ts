import type { AccessTokenPayload } from '@kolab/auth';
import type { GifterProfile as PrismaGifterProfile } from '@kolab/database';
import { MembershipStatus, Prisma, prisma } from '@kolab/database';
import type {
  GifterProfileDetailResponse,
  GifterProfileListQuery,
  GifterProfileSessionsQuery,
  ListGifterProfilesResponse,
  ListGifterSessionStatsResponse,
  ListSessionGiftersResponse,
  SessionGifterListQuery,
} from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import {
  toFavoriteCreatorSummary,
  toGifterProfile,
  toGifterSessionStats,
} from './live-intelligence.mapper';
import { RECENT_GIFTER_SESSION_STATS_LIMIT } from './live-intelligence-gifters.utils';

@Injectable()
export class LiveIntelligenceGiftersService {
  constructor(private readonly auditService: AuditService) {}

  async listGifterProfiles(
    user: AccessTokenPayload,
    query: GifterProfileListQuery,
  ): Promise<ListGifterProfilesResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const take = query.limit + 1;

    const profiles = await prisma.gifterProfile.findMany({
      where: this.buildProfileListWhere(organizationId, query),
      orderBy: [{ lastSeenAt: 'desc' }, { id: 'desc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = profiles.length > query.limit;
    const page = hasMore ? profiles.slice(0, query.limit) : profiles;

    return {
      items: page.map(toGifterProfile),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getGifterProfile(
    user: AccessTokenPayload,
    gifterId: string,
  ): Promise<GifterProfileDetailResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const profile = await this.loadGifterProfile(organizationId, gifterId);

    const [recentSessionStats, favoriteCreatorProfile] = await Promise.all([
      prisma.gifterSessionStats.findMany({
        where: {
          organizationId,
          gifterProfileId: profile.id,
        },
        orderBy: [{ lastSeenAt: 'desc' }, { id: 'desc' }],
        take: RECENT_GIFTER_SESSION_STATS_LIMIT,
      }),
      profile.favoriteCreatorProfileId
        ? prisma.creatorProfile.findFirst({
            where: {
              id: profile.favoriteCreatorProfileId,
              organizationId,
            },
            select: {
              id: true,
              displayName: true,
            },
          })
        : Promise.resolve(null),
    ]);

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LIVE_GIFTER_PROFILE_VIEWED,
      targetType: AUDIT_TARGET_TYPE.GIFTER_PROFILE,
      targetId: profile.id,
      metadata: {
        platform: profile.platform,
        externalGifterId: profile.externalGifterId,
      },
    });

    return {
      profile: toGifterProfile(profile),
      recentSessionStats: recentSessionStats.map(toGifterSessionStats),
      favoriteCreator: toFavoriteCreatorSummary(favoriteCreatorProfile),
    };
  }

  async listGifterSessions(
    user: AccessTokenPayload,
    gifterId: string,
    query: GifterProfileSessionsQuery,
  ): Promise<ListGifterSessionStatsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.loadGifterProfile(organizationId, gifterId);

    return this.listSessionStats(organizationId, {
      ...query,
      gifterProfileId: gifterId,
    });
  }

  async listSessionGifters(
    user: AccessTokenPayload,
    sessionId: string,
    query: SessionGifterListQuery,
  ): Promise<ListSessionGiftersResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.loadLiveSession(organizationId, sessionId);

    const take = query.limit + 1;

    const stats = await prisma.gifterSessionStats.findMany({
      where: {
        organizationId,
        liveSessionId: sessionId,
        ...(query.spendingTier || query.platform
          ? {
              gifterProfile: {
                ...(query.spendingTier ? { spendingTier: query.spendingTier } : {}),
                ...(query.platform ? { platform: query.platform } : {}),
              },
            }
          : {}),
      },
      include: {
        gifterProfile: true,
      },
      orderBy: [{ giftValue: 'desc' }, { giftCount: 'desc' }, { id: 'desc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = stats.length > query.limit;
    const page = hasMore ? stats.slice(0, query.limit) : stats;

    return {
      items: page.map((row) => ({
        profile: toGifterProfile(row.gifterProfile),
        sessionStats: toGifterSessionStats(row),
      })),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  private async listSessionStats(
    organizationId: string,
    query: GifterProfileSessionsQuery & { gifterProfileId?: string; liveSessionId?: string },
  ): Promise<ListGifterSessionStatsResponse> {
    const take = query.limit + 1;

    const stats = await prisma.gifterSessionStats.findMany({
      where: {
        organizationId,
        ...(query.gifterProfileId ? { gifterProfileId: query.gifterProfileId } : {}),
        ...(query.liveSessionId ? { liveSessionId: query.liveSessionId } : {}),
      },
      orderBy: [{ lastSeenAt: 'desc' }, { id: 'desc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = stats.length > query.limit;
    const page = hasMore ? stats.slice(0, query.limit) : stats;

    return {
      items: page.map(toGifterSessionStats),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  private buildProfileListWhere(
    organizationId: string,
    query: GifterProfileListQuery,
  ): Prisma.GifterProfileWhereInput {
    const lastSeenAtFilter =
      query.lastSeenFrom || query.lastSeenTo
        ? {
            ...(query.lastSeenFrom ? { gte: new Date(query.lastSeenFrom) } : {}),
            ...(query.lastSeenTo ? { lte: new Date(query.lastSeenTo) } : {}),
          }
        : undefined;

    return {
      organizationId,
      ...(query.platform ? { platform: query.platform } : {}),
      ...(query.spendingTier ? { spendingTier: query.spendingTier } : {}),
      ...(query.externalGifterId ? { externalGifterId: query.externalGifterId } : {}),
      ...(query.search ? { displayName: { contains: query.search, mode: 'insensitive' } } : {}),
      ...(lastSeenAtFilter ? { lastSeenAt: lastSeenAtFilter } : {}),
      ...(query.creatorProfileId
        ? {
            OR: [
              { favoriteCreatorProfileId: query.creatorProfileId },
              {
                sessionStats: {
                  some: {
                    creatorProfileId: query.creatorProfileId,
                  },
                },
              },
            ],
          }
        : {}),
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

  private async loadGifterProfile(
    organizationId: string,
    gifterId: string,
  ): Promise<PrismaGifterProfile> {
    const profile = await prisma.gifterProfile.findFirst({
      where: {
        id: gifterId,
        organizationId,
      },
    });

    if (!profile) {
      throw new NotFoundException('Gifter profile not found');
    }

    return profile;
  }

  private async loadLiveSession(organizationId: string, sessionId: string) {
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
