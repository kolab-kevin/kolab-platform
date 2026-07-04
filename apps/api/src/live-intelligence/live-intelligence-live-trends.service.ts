import type { AccessTokenPayload } from '@kolab/auth';
import type { CreatorProfile as PrismaCreatorProfile } from '@kolab/database';
import { MembershipStatus, Prisma, prisma } from '@kolab/database';
import type { CreatorLiveTrendSnapshot } from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toMetadataRecord } from './live-intelligence.utils';
import type { CreatorSessionInput } from './live-intelligence-creator-profile.utils';
import {
  buildCreatorLiveTrendSnapshot,
  CREATOR_LIVE_TREND_SNAPSHOT_METADATA_KEY,
  LIVE_TREND_SESSION_LIMIT,
  parseCreatorLiveTrendSnapshot,
} from './live-intelligence-live-trends.utils';

@Injectable()
export class LiveIntelligenceLiveTrendsService {
  constructor(private readonly auditService: AuditService) {}

  async generateCreatorLiveTrends(
    user: AccessTokenPayload,
    creatorProfileId: string,
  ): Promise<CreatorLiveTrendSnapshot> {
    const organizationId = await this.requireActiveOrganization(user);
    const creator = await this.loadCreatorProfile(organizationId, creatorProfileId);
    const sessions = await this.loadRecentSessions(organizationId, creatorProfileId);
    const snapshot = buildCreatorLiveTrendSnapshot({
      creatorProfileId,
      sessions,
    });

    await prisma.creatorProfile.update({
      where: { id: creator.id },
      data: {
        metadata: {
          ...toMetadataRecord(creator.metadata),
          [CREATOR_LIVE_TREND_SNAPSHOT_METADATA_KEY]: snapshot,
        } as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_LIVE_TRENDS_GENERATED,
      targetType: AUDIT_TARGET_TYPE.CREATOR,
      targetId: creator.id,
      metadata: {
        creatorProfileId: creator.id,
        generatedAt: snapshot.generatedAt,
        sessionsAnalyzed: snapshot.sessionsAnalyzed,
        overallDirection: snapshot.overallDirection,
      },
    });

    return snapshot;
  }

  async getCreatorLiveTrends(
    user: AccessTokenPayload,
    creatorProfileId: string,
  ): Promise<CreatorLiveTrendSnapshot> {
    const organizationId = await this.requireActiveOrganization(user);
    const creator = await this.loadCreatorProfile(organizationId, creatorProfileId);
    const snapshot = parseCreatorLiveTrendSnapshot(creator.id, creator.metadata);

    if (!snapshot) {
      throw new NotFoundException('Creator live trend snapshot not found for this creator');
    }

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_LIVE_TRENDS_VIEWED,
      targetType: AUDIT_TARGET_TYPE.CREATOR,
      targetId: creator.id,
      metadata: {
        creatorProfileId: creator.id,
        generatedAt: snapshot.generatedAt,
        overallDirection: snapshot.overallDirection,
      },
    });

    return snapshot;
  }

  private async loadRecentSessions(
    organizationId: string,
    creatorProfileId: string,
  ): Promise<CreatorSessionInput[]> {
    return prisma.liveSession.findMany({
      where: {
        organizationId,
        creatorProfileId,
      },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      take: LIVE_TREND_SESSION_LIMIT,
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
