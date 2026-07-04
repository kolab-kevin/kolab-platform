import type { AccessTokenPayload } from '@kolab/auth';
import type { CreatorProfile as PrismaCreatorProfile } from '@kolab/database';
import { MembershipStatus, Prisma, prisma } from '@kolab/database';
import type { CreatorIntelligenceProfile } from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toMetadataRecord } from './live-intelligence.utils';
import {
  buildCreatorIntelligenceProfile,
  CREATOR_INTELLIGENCE_PROFILE_METADATA_KEY,
  CREATOR_INTELLIGENCE_SESSION_LIMIT,
  parseCreatorIntelligenceProfile,
} from './live-intelligence-creator-profile.utils';

@Injectable()
export class LiveIntelligenceCreatorProfileService {
  constructor(private readonly auditService: AuditService) {}

  async generateCreatorIntelligence(
    user: AccessTokenPayload,
    creatorProfileId: string,
  ): Promise<CreatorIntelligenceProfile> {
    const organizationId = await this.requireActiveOrganization(user);
    const creator = await this.loadCreatorProfile(organizationId, creatorProfileId);
    const [sessions, gifterAggregates] = await Promise.all([
      this.loadRecentSessions(organizationId, creatorProfileId),
      this.loadGifterAggregates(organizationId, creatorProfileId),
    ]);

    const profile = buildCreatorIntelligenceProfile({
      creatorProfileId,
      sessions,
      gifterAggregates,
    });

    await prisma.creatorProfile.update({
      where: { id: creator.id },
      data: {
        metadata: {
          ...toMetadataRecord(creator.metadata),
          [CREATOR_INTELLIGENCE_PROFILE_METADATA_KEY]: profile,
        } as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_INTELLIGENCE_PROFILE_GENERATED,
      targetType: AUDIT_TARGET_TYPE.CREATOR,
      targetId: creator.id,
      metadata: {
        creatorProfileId: creator.id,
        generatedAt: profile.generatedAt,
        sessionsAnalyzed: profile.sessionsAnalyzed,
        overallScore: profile.overallScore,
      },
    });

    return profile;
  }

  async getCreatorIntelligence(
    user: AccessTokenPayload,
    creatorProfileId: string,
  ): Promise<CreatorIntelligenceProfile> {
    const organizationId = await this.requireActiveOrganization(user);
    const creator = await this.loadCreatorProfile(organizationId, creatorProfileId);
    const profile = parseCreatorIntelligenceProfile(creator.id, creator.metadata);

    if (!profile) {
      throw new NotFoundException('Creator intelligence profile not found for this creator');
    }

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_INTELLIGENCE_PROFILE_VIEWED,
      targetType: AUDIT_TARGET_TYPE.CREATOR,
      targetId: creator.id,
      metadata: {
        creatorProfileId: creator.id,
        generatedAt: profile.generatedAt,
        overallScore: profile.overallScore,
      },
    });

    return profile;
  }

  private async loadRecentSessions(organizationId: string, creatorProfileId: string) {
    return prisma.liveSession.findMany({
      where: {
        organizationId,
        creatorProfileId,
      },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      take: CREATOR_INTELLIGENCE_SESSION_LIMIT,
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
        status: true,
        campaignId: true,
        totalViewers: true,
        peakViewers: true,
        totalGifts: true,
        totalGiftValue: true,
        metadata: true,
      },
    });
  }

  private async loadGifterAggregates(organizationId: string, creatorProfileId: string) {
    const stats = await prisma.gifterSessionStats.findMany({
      where: {
        organizationId,
        creatorProfileId,
      },
      include: {
        gifterProfile: true,
      },
    });

    const aggregates = new Map<
      string,
      {
        gifterProfileId: string;
        externalGifterId: string;
        displayName: string | null;
        giftCount: number;
        giftValue: number;
        spendingTier: string | null;
        sessionIds: Set<string>;
      }
    >();

    for (const row of stats) {
      const existing = aggregates.get(row.gifterProfileId) ?? {
        gifterProfileId: row.gifterProfileId,
        externalGifterId: row.gifterProfile.externalGifterId,
        displayName: row.gifterProfile.displayName,
        giftCount: 0,
        giftValue: 0,
        spendingTier: row.gifterProfile.spendingTier,
        sessionIds: new Set<string>(),
      };

      existing.giftCount += row.giftCount;
      existing.giftValue += Number(row.giftValue.toString());
      existing.sessionIds.add(row.liveSessionId);
      aggregates.set(row.gifterProfileId, existing);
    }

    return [...aggregates.values()].map((entry) => ({
      gifterProfileId: entry.gifterProfileId,
      externalGifterId: entry.externalGifterId,
      displayName: entry.displayName,
      giftCount: entry.giftCount,
      giftValue: entry.giftValue,
      spendingTier: entry.spendingTier,
      sessionCount: entry.sessionIds.size,
    }));
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

  private async loadCreatorProfile(
    organizationId: string,
    creatorProfileId: string,
  ): Promise<PrismaCreatorProfile> {
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        id: creatorProfileId,
        organizationId,
      },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    return creator;
  }
}
