import type { AccessTokenPayload } from '@kolab/auth';
import { MembershipStatus, prisma } from '@kolab/database';
import type { CreatorOnboardingChecklistResponse } from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { buildCreatorOnboardingChecklist } from './creators-onboarding.utils';

@Injectable()
export class CreatorsOnboardingService {
  async getCreatorOnboarding(
    user: AccessTokenPayload,
    creatorId: string,
  ): Promise<CreatorOnboardingChecklistResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const profile = await this.requireCreatorProfile(organizationId, creatorId);

    const [governmentIdDocument, creatorAgreement] = await Promise.all([
      prisma.creatorDocument.findFirst({
        where: {
          organizationId,
          creatorProfileId: creatorId,
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
          creatorProfileId: creatorId,
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

    return buildCreatorOnboardingChecklist({
      creatorId: profile.id,
      organizationId: profile.organizationId,
      displayName: profile.displayName,
      country: profile.country,
      availability: profile.availability,
      metadata: profile.metadata,
      platformAccounts: profile.platformAccounts.map((account) => ({
        id: account.id,
        status: account.status,
        platform: account.platform,
        username: account.username,
      })),
      governmentIdDocument,
      creatorAgreement,
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

  private async requireCreatorProfile(organizationId: string, creatorId: string) {
    const profile = await prisma.creatorProfile.findFirst({
      where: { id: creatorId, organizationId },
      include: {
        platformAccounts: {
          where: { organizationId },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Creator not found');
    }

    return profile;
  }
}
