import type { AccessTokenPayload } from '@kolab/auth';
import type { CreatorProfile as PrismaCreatorProfile } from '@kolab/database';
import { MembershipStatus, Prisma, prisma } from '@kolab/database';
import type {
  CreatorComplianceOverallStatus,
  CreatorOnboardingOverallStatus,
  CreatorPerformanceScore,
} from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toMetadataRecord } from '../live-intelligence/live-intelligence.utils';
import { parseCreatorIntelligenceProfile } from '../live-intelligence/live-intelligence-creator-profile.utils';
import { parseCreatorLiveTrendSnapshot } from '../live-intelligence/live-intelligence-live-trends.utils';
import { buildCreatorOnboardingChecklist } from './creators-onboarding.utils';
import {
  buildCreatorPerformanceScore,
  CREATOR_PERFORMANCE_SCORE_METADATA_KEY,
  parseCreatorPerformanceScore,
} from './creators-performance-score.utils';

const RECENT_ACTIVITY_DAYS = 30;
const SESSION_HISTORY_LIMIT = 20;

@Injectable()
export class CreatorsPerformanceScoreService {
  constructor(private readonly auditService: AuditService) {}

  async generateCreatorPerformanceScore(
    user: AccessTokenPayload,
    creatorProfileId: string,
  ): Promise<CreatorPerformanceScore> {
    const organizationId = await this.requireActiveOrganization(user);
    const creator = await this.loadCreatorProfile(organizationId, creatorProfileId);
    const scoreInput = await this.buildScoreInput(organizationId, creator);
    const score = buildCreatorPerformanceScore(scoreInput);

    await prisma.creatorProfile.update({
      where: { id: creator.id },
      data: {
        metadata: {
          ...toMetadataRecord(creator.metadata),
          [CREATOR_PERFORMANCE_SCORE_METADATA_KEY]: score,
        } as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_PERFORMANCE_SCORE_GENERATED,
      targetType: AUDIT_TARGET_TYPE.CREATOR,
      targetId: creator.id,
      metadata: {
        creatorProfileId: creator.id,
        generatedAt: score.generatedAt,
        overallScore: score.overallScore,
        scoreBand: score.scoreBand,
      },
    });

    return score;
  }

  async getCreatorPerformanceScore(
    user: AccessTokenPayload,
    creatorProfileId: string,
  ): Promise<CreatorPerformanceScore> {
    const organizationId = await this.requireActiveOrganization(user);
    const creator = await this.loadCreatorProfile(organizationId, creatorProfileId);
    const score = parseCreatorPerformanceScore(creator.id, creator.metadata);

    if (!score) {
      throw new NotFoundException('Creator performance score not found for this creator');
    }

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_PERFORMANCE_SCORE_VIEWED,
      targetType: AUDIT_TARGET_TYPE.CREATOR,
      targetId: creator.id,
      metadata: {
        creatorProfileId: creator.id,
        generatedAt: score.generatedAt,
        overallScore: score.overallScore,
        scoreBand: score.scoreBand,
      },
    });

    return score;
  }

  private async buildScoreInput(organizationId: string, creator: PrismaCreatorProfile) {
    const recentActivityCutoff = new Date(Date.now() - RECENT_ACTIVITY_DAYS * 24 * 60 * 60 * 1000);

    const [
      sessions,
      platformAccounts,
      governmentIdDocument,
      creatorAgreement,
      approvedDocuments,
      expiredDocuments,
      expiringContracts,
      campaignAssignments,
      campaignDeliverables,
    ] = await Promise.all([
      prisma.liveSession.findMany({
        where: { organizationId, creatorProfileId: creator.id },
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
        take: SESSION_HISTORY_LIMIT,
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
      }),
      prisma.creatorPlatformAccount.findMany({
        where: { organizationId, creatorProfileId: creator.id },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          status: true,
          platform: true,
          username: true,
        },
      }),
      prisma.creatorDocument.findFirst({
        where: {
          organizationId,
          creatorProfileId: creator.id,
          documentType: 'GOVERNMENT_ID',
          deletedAt: null,
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        select: { id: true, status: true },
      }),
      prisma.creatorContract.findFirst({
        where: {
          organizationId,
          creatorProfileId: creator.id,
          contractType: 'CREATOR_AGREEMENT',
          deletedAt: null,
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        select: { id: true, status: true, signedAt: true },
      }),
      prisma.creatorDocument.findMany({
        where: {
          organizationId,
          creatorProfileId: creator.id,
          deletedAt: null,
          status: 'APPROVED',
        },
        select: { documentType: true },
      }),
      prisma.creatorDocument.findMany({
        where: {
          organizationId,
          creatorProfileId: creator.id,
          deletedAt: null,
          status: 'EXPIRED',
        },
        select: { id: true },
      }),
      prisma.creatorContract.findMany({
        where: {
          organizationId,
          creatorProfileId: creator.id,
          deletedAt: null,
          OR: [{ status: 'EXPIRED' }, { validUntil: { not: null } }],
        },
        select: {
          id: true,
          status: true,
          validUntil: true,
        },
      }),
      prisma.campaignCreatorAssignment.findMany({
        where: { organizationId, creatorProfileId: creator.id },
        select: { status: true },
      }),
      prisma.campaignCreatorDeliverable.findMany({
        where: {
          organizationId,
          assignment: { creatorProfileId: creator.id },
        },
        select: { status: true },
      }),
    ]);

    const onboarding = buildCreatorOnboardingChecklist({
      creatorId: creator.id,
      organizationId: creator.organizationId,
      displayName: creator.displayName,
      country: creator.country,
      availability: creator.availability,
      metadata: creator.metadata,
      platformAccounts,
      governmentIdDocument,
      creatorAgreement,
    });

    const now = Date.now();
    const expiringWindowMs = 30 * 24 * 60 * 60 * 1000;
    const hasApprovedGovernmentId = approvedDocuments.some(
      (document) => document.documentType === 'GOVERNMENT_ID',
    );
    const hasExpiredDocuments = expiredDocuments.length > 0;
    const hasExpiringContracts = expiringContracts.some((contract) => {
      if (contract.status === 'EXPIRED') {
        return true;
      }

      if (!contract.validUntil) {
        return false;
      }

      const validUntilMs = contract.validUntil.getTime();
      return validUntilMs < now || validUntilMs - now <= expiringWindowMs;
    });

    const complianceStatus: CreatorComplianceOverallStatus = derivePerformanceComplianceStatus({
      onboardingStatus: onboarding.overallStatus,
      hasApprovedGovernmentId,
      hasExpiredDocuments,
      hasExpiringContracts,
    });

    const recentActivitySessionCount = sessions.filter(
      (session) => session.startedAt && session.startedAt >= recentActivityCutoff,
    ).length;

    return {
      creatorProfileId: creator.id,
      intelligenceProfile: parseCreatorIntelligenceProfile(creator.id, creator.metadata),
      liveTrendSnapshot: parseCreatorLiveTrendSnapshot(creator.id, creator.metadata),
      sessions,
      complianceStatus,
      onboardingStatus: onboarding.overallStatus,
      campaignAssignments,
      campaignDeliverables,
      recentActivitySessionCount,
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

function derivePerformanceComplianceStatus(input: {
  onboardingStatus: CreatorOnboardingOverallStatus;
  hasApprovedGovernmentId: boolean;
  hasExpiredDocuments: boolean;
  hasExpiringContracts: boolean;
}): CreatorComplianceOverallStatus {
  if (
    input.onboardingStatus === 'INCOMPLETE' ||
    !input.hasApprovedGovernmentId ||
    input.hasExpiredDocuments
  ) {
    return 'NON_COMPLIANT';
  }

  if (input.onboardingStatus === 'WARNING' || input.hasExpiringContracts) {
    return 'AT_RISK';
  }

  return 'COMPLIANT';
}
