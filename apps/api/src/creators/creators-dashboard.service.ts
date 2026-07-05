import type { AccessTokenPayload } from '@kolab/auth';
import { MembershipStatus, prisma } from '@kolab/database';
import type { CreatorDashboardResponse } from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import {
  ACTIVE_CAMPAIGN_APPLICATION_STATUSES,
  ACTIVE_CAMPAIGN_ASSIGNMENT_STATUSES,
} from '../campaigns/campaigns.utils';
import { buildCreatorDashboard } from './creators-dashboard.utils';

@Injectable()
export class CreatorsDashboardService {
  constructor(private readonly auditService: AuditService) {}

  async getCreatorDashboard(
    user: AccessTokenPayload,
    creatorProfileId: string,
  ): Promise<CreatorDashboardResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const creator = await this.loadCreatorProfile(organizationId, creatorProfileId);
    const now = new Date();

    const [
      goals,
      assignments,
      applications,
      deliverables,
      latestLiveSession,
      nextScheduledLiveSession,
      governmentIdDocument,
      creatorAgreement,
    ] = await Promise.all([
      prisma.creatorGoal.findMany({
        where: {
          organizationId,
          creatorProfileId,
        },
        orderBy: [{ status: 'asc' }, { periodEnd: 'asc' }, { id: 'asc' }],
        take: 50,
      }),
      prisma.campaignCreatorAssignment.findMany({
        where: {
          organizationId,
          creatorProfileId,
          status: { in: [...ACTIVE_CAMPAIGN_ASSIGNMENT_STATUSES, 'COMPLETED'] },
        },
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
              endsAt: true,
              applicationDeadline: true,
            },
          },
        },
        orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
      }),
      prisma.campaignApplication.findMany({
        where: {
          organizationId,
          creatorProfileId,
          status: { in: [...ACTIVE_CAMPAIGN_APPLICATION_STATUSES] },
        },
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
              endsAt: true,
              applicationDeadline: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      prisma.campaignCreatorDeliverable.findMany({
        where: {
          organizationId,
          assignment: {
            creatorProfileId,
          },
        },
        include: {
          assignment: {
            include: {
              campaign: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: [{ dueAt: 'asc' }, { id: 'asc' }],
        take: 50,
      }),
      prisma.liveSession.findFirst({
        where: {
          organizationId,
          creatorProfileId,
          status: { in: ['ENDED', 'LIVE'] },
        },
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      }),
      prisma.liveSession.findFirst({
        where: {
          organizationId,
          creatorProfileId,
          status: 'SCHEDULED',
          OR: [{ scheduledStart: { gte: now } }, { scheduledStart: null }],
        },
        orderBy: [{ scheduledStart: 'asc' }, { id: 'asc' }],
      }),
      prisma.creatorDocument.findFirst({
        where: {
          organizationId,
          creatorProfileId,
          documentType: 'GOVERNMENT_ID',
          deletedAt: null,
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          status: true,
        },
      }),
      prisma.creatorContract.findFirst({
        where: {
          organizationId,
          creatorProfileId,
          contractType: 'CREATOR_AGREEMENT',
          deletedAt: null,
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          status: true,
          signedAt: true,
        },
      }),
    ]);

    const dashboard = buildCreatorDashboard({
      creator: {
        id: creator.id,
        organizationId: creator.organizationId,
        displayName: creator.displayName,
        status: creator.status,
        country: creator.country,
        availability: creator.availability,
        metadata: creator.metadata,
        platformAccounts: creator.platformAccounts.map((account) => ({
          id: account.id,
          status: account.status,
          platform: account.platform,
          username: account.username,
        })),
      },
      goals,
      assignments,
      applications,
      deliverables,
      latestLiveSession,
      nextScheduledLiveSession,
      onboardingSource: {
        governmentIdDocument,
        creatorAgreement,
      },
      generatedAt: now,
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_DASHBOARD_VIEWED,
      targetType: AUDIT_TARGET_TYPE.CREATOR,
      targetId: creator.id,
      metadata: {
        creatorProfileId: creator.id,
        generatedAt: dashboard.generatedAt,
      },
    });

    return dashboard;
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

  private async loadCreatorProfile(organizationId: string, creatorProfileId: string) {
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        id: creatorProfileId,
        organizationId,
      },
      include: {
        platformAccounts: {
          where: {
            organizationId,
            status: { not: 'REMOVED' },
          },
          select: {
            id: true,
            status: true,
            platform: true,
            username: true,
          },
        },
      },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    return creator;
  }
}
