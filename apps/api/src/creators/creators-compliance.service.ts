import type { AccessTokenPayload } from '@kolab/auth';
import { userHasPermission } from '@kolab/auth';
import { CreatorStatus, MembershipStatus, prisma } from '@kolab/database';
import type { CreatorComplianceQuery, CreatorComplianceResponse } from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import {
  buildCreatorComplianceContractsSummary,
  buildCreatorComplianceDocumentsSummary,
  buildCreatorComplianceSensitiveAccess,
  deriveCreatorComplianceOverallStatus,
} from './creators-compliance.utils';
import { CreatorsOnboardingService } from './creators-onboarding.service';
import { CreatorsReportingService } from './creators-reporting.service';

@Injectable()
export class CreatorsComplianceService {
  constructor(
    private readonly creatorsOnboardingService: CreatorsOnboardingService,
    private readonly creatorsReportingService: CreatorsReportingService,
  ) {}

  async getCreatorCompliance(
    user: AccessTokenPayload,
    creatorId: string,
    query: CreatorComplianceQuery,
  ): Promise<CreatorComplianceResponse> {
    await this.requireActiveOrganization(user);
    await this.requireActiveCreatorProfile(user.organizationId as string, creatorId);

    const [onboarding, missingDocuments, expiringDocuments, expiringContracts, creatorDocuments] =
      await Promise.all([
        this.creatorsOnboardingService.getCreatorOnboarding(user, creatorId),
        this.creatorsReportingService.listMissingDocuments(user, {
          creatorId,
          limit: query.limit,
        }),
        this.creatorsReportingService.listExpiringDocuments(user, {
          creatorId,
          days: query.days,
          includeExpired: query.includeExpired,
          limit: query.limit,
        }),
        this.creatorsReportingService.listExpiringContracts(user, {
          creatorId,
          days: query.days,
          includeExpired: query.includeExpired,
          limit: query.limit,
        }),
        prisma.creatorDocument.findMany({
          where: {
            organizationId: user.organizationId,
            creatorProfileId: creatorId,
            deletedAt: null,
          },
          select: {
            documentType: true,
          },
        }),
      ]);

    const documents = buildCreatorComplianceDocumentsSummary({
      missingItems: missingDocuments.items,
      expiringItems: expiringDocuments.items,
    });
    const contracts = buildCreatorComplianceContractsSummary({
      expiringItems: expiringContracts.items,
    });
    const sensitiveAccess = buildCreatorComplianceSensitiveAccess({
      documentTypes: creatorDocuments.map((document) => document.documentType),
      callerCanDownloadSensitive: userHasPermission(user, 'documents:download_sensitive'),
    });

    return {
      creatorId,
      organizationId: onboarding.organizationId,
      generatedAt: new Date().toISOString(),
      overallStatus: deriveCreatorComplianceOverallStatus({
        onboarding,
        documents,
        contracts,
      }),
      onboarding,
      documents,
      contracts,
      sensitiveAccess,
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

  private async requireActiveCreatorProfile(organizationId: string, creatorId: string) {
    const profile = await prisma.creatorProfile.findFirst({
      where: {
        id: creatorId,
        organizationId,
        status: CreatorStatus.ACTIVE,
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Creator not found');
    }
  }
}
