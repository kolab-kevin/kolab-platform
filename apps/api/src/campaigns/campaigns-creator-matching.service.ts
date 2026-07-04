import type { AccessTokenPayload } from '@kolab/auth';
import type { Campaign as PrismaCampaign } from '@kolab/database';
import { CreatorStatus, MembershipStatus, Prisma, prisma } from '@kolab/database';
import type { CampaignCreatorMatchesSnapshot, CampaignType } from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { parseCreatorPerformanceScore } from '../creators/creators-performance-score.utils';
import { parseCreatorLiveTrendSnapshot } from '../live-intelligence/live-intelligence-live-trends.utils';
import { ACTIVE_CAMPAIGN_ASSIGNMENT_STATUSES, toMetadataRecord } from './campaigns.utils';
import {
  buildCampaignCreatorMatches,
  CAMPAIGN_CREATOR_MATCHES_METADATA_KEY,
  deriveCreatorComplianceForMatching,
  parseCampaignCreatorMatchesSnapshot,
} from './campaigns-creator-matching.utils';

@Injectable()
export class CampaignsCreatorMatchingService {
  constructor(private readonly auditService: AuditService) {}

  async generateCampaignCreatorMatches(
    user: AccessTokenPayload,
    campaignId: string,
  ): Promise<CampaignCreatorMatchesSnapshot> {
    const organizationId = await this.requireActiveOrganization(user);
    const campaign = await this.loadCampaign(organizationId, campaignId);
    const candidates = await this.loadMatchCandidates(organizationId, campaignId);
    const snapshot = buildCampaignCreatorMatches({
      campaignId: campaign.id,
      campaignType: campaign.campaignType as CampaignType,
      requirements: campaign.requirements,
      brief: campaign.brief,
      candidates,
    });

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        metadata: {
          ...toMetadataRecord(campaign.metadata),
          [CAMPAIGN_CREATOR_MATCHES_METADATA_KEY]: snapshot,
        } as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_CREATOR_MATCHES_GENERATED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN,
      targetId: campaign.id,
      metadata: {
        campaignId: campaign.id,
        generatedAt: snapshot.generatedAt,
        totalCandidates: snapshot.totalCandidates,
        matchCount: snapshot.matches.length,
      },
    });

    return snapshot;
  }

  async getCampaignCreatorMatches(
    user: AccessTokenPayload,
    campaignId: string,
  ): Promise<CampaignCreatorMatchesSnapshot> {
    const organizationId = await this.requireActiveOrganization(user);
    const campaign = await this.loadCampaign(organizationId, campaignId);
    const snapshot = parseCampaignCreatorMatchesSnapshot(campaign.id, campaign.metadata);

    if (!snapshot) {
      throw new NotFoundException('Campaign creator matches snapshot not found for this campaign');
    }

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CAMPAIGN_CREATOR_MATCHES_VIEWED,
      targetType: AUDIT_TARGET_TYPE.CAMPAIGN,
      targetId: campaign.id,
      metadata: {
        campaignId: campaign.id,
        generatedAt: snapshot.generatedAt,
        totalCandidates: snapshot.totalCandidates,
        matchCount: snapshot.matches.length,
      },
    });

    return snapshot;
  }

  private async loadMatchCandidates(organizationId: string, campaignId: string) {
    const [creators, activeAssignments, completedAssignments, approvedDocuments, signedAgreements] =
      await Promise.all([
        prisma.creatorProfile.findMany({
          where: {
            organizationId,
            status: CreatorStatus.ACTIVE,
          },
          include: {
            platformAccounts: {
              where: {
                organizationId,
                status: { not: 'REMOVED' },
              },
              select: {
                platform: true,
                status: true,
              },
            },
          },
          orderBy: [{ displayName: 'asc' }, { id: 'asc' }],
        }),
        prisma.campaignCreatorAssignment.findMany({
          where: {
            organizationId,
            campaignId,
            status: { in: [...ACTIVE_CAMPAIGN_ASSIGNMENT_STATUSES] },
          },
          select: {
            creatorProfileId: true,
          },
        }),
        prisma.campaignCreatorAssignment.findMany({
          where: {
            organizationId,
            status: 'COMPLETED',
          },
          select: {
            creatorProfileId: true,
          },
        }),
        prisma.creatorDocument.findMany({
          where: {
            organizationId,
            deletedAt: null,
            status: 'APPROVED',
            documentType: 'GOVERNMENT_ID',
          },
          select: {
            creatorProfileId: true,
          },
        }),
        prisma.creatorContract.findMany({
          where: {
            organizationId,
            deletedAt: null,
            contractType: 'CREATOR_AGREEMENT',
            status: 'SIGNED',
          },
          select: {
            creatorProfileId: true,
          },
        }),
      ]);

    const assignedCreatorIds = new Set(
      activeAssignments.map((assignment) => assignment.creatorProfileId),
    );
    const completedCounts = completedAssignments.reduce<Map<string, number>>(
      (counts, assignment) => {
        counts.set(assignment.creatorProfileId, (counts.get(assignment.creatorProfileId) ?? 0) + 1);
        return counts;
      },
      new Map(),
    );
    const approvedGovernmentIds = new Set(
      approvedDocuments.map((document) => document.creatorProfileId),
    );
    const signedAgreementIds = new Set(
      signedAgreements.map((contract) => contract.creatorProfileId),
    );

    return creators
      .filter((creator) => !assignedCreatorIds.has(creator.id))
      .map((creator) => {
        const performanceScore = parseCreatorPerformanceScore(creator.id, creator.metadata);
        const liveTrendSnapshot = parseCreatorLiveTrendSnapshot(creator.id, creator.metadata);

        return {
          creatorProfileId: creator.id,
          displayName: creator.displayName,
          country: creator.country,
          languages: creator.languages,
          metadata: creator.metadata,
          availability: creator.availability,
          platformAccounts: creator.platformAccounts,
          performanceScore,
          liveTrendSnapshot,
          complianceStatus: deriveCreatorComplianceForMatching({
            performanceScore,
            hasApprovedGovernmentId: approvedGovernmentIds.has(creator.id),
            hasSignedAgreement: signedAgreementIds.has(creator.id),
          }),
          completedCampaignCount: completedCounts.get(creator.id) ?? 0,
        };
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

  private async loadCampaign(organizationId: string, campaignId: string): Promise<PrismaCampaign> {
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
}
