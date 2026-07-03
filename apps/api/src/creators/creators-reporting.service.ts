import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CreatorContract as PrismaCreatorContract,
  CreatorDocument as PrismaCreatorDocument,
} from '@kolab/database';
import { CreatorDocumentStatus, CreatorStatus, MembershipStatus, prisma } from '@kolab/database';
import type {
  ExpiringContractsQuery,
  ExpiringDocumentsQuery,
  ListExpiringCreatorContractsResponse,
  ListExpiringCreatorDocumentsResponse,
  ListMissingCreatorDocumentsResponse,
  MissingDocumentsQuery,
} from '@kolab/types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { type CreatorProfileWithAccounts, toCreatorSummary } from './creators.mapper';
import { toCreatorContract } from './creators-contracts.mapper';
import { toCreatorDocument } from './creators-documents.mapper';
import {
  addDays,
  buildMissingDocumentCursor,
  getContractExpirationStatus,
  getDocumentExpirationStatus,
  REQUIRED_CREATOR_DOCUMENT_TYPES,
} from './creators-reporting.utils';

const creatorProfileInclude = {
  platformAccounts: true,
  sourceLead: true,
} as const;

type CreatorDocumentWithProfile = PrismaCreatorDocument & {
  creatorProfile: CreatorProfileWithAccounts;
};

type CreatorContractWithProfile = PrismaCreatorContract & {
  creatorProfile: CreatorProfileWithAccounts;
};

@Injectable()
export class CreatorsReportingService {
  async listExpiringDocuments(
    user: AccessTokenPayload,
    query: ExpiringDocumentsQuery,
  ): Promise<ListExpiringCreatorDocumentsResponse> {
    const organizationId = await this.requireActiveOrganization(user);

    if (query.creatorId) {
      await this.requireActiveCreatorProfile(organizationId, query.creatorId);
    }

    const now = new Date();
    const windowEnd = addDays(now, query.days);
    const take = query.limit + 1;

    const documents = await prisma.creatorDocument.findMany({
      where: {
        organizationId,
        deletedAt: null,
        expiresAt: { not: null },
        ...(query.documentType ? { documentType: query.documentType } : {}),
        ...(query.creatorId ? { creatorProfileId: query.creatorId } : {}),
        creatorProfile: {
          organizationId,
          status: CreatorStatus.ACTIVE,
        },
        ...(query.includeExpired
          ? {
              OR: [{ expiresAt: { lt: now } }, { expiresAt: { gte: now, lte: windowEnd } }],
            }
          : {
              expiresAt: { gte: now, lte: windowEnd },
            }),
      },
      include: {
        creatorProfile: {
          include: creatorProfileInclude,
        },
      },
      orderBy: [{ expiresAt: 'asc' }, { id: 'asc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = documents.length > query.limit;
    const page = (
      hasMore ? documents.slice(0, query.limit) : documents
    ) as CreatorDocumentWithProfile[];
    const membershipByUserId = await this.loadMembershipStatusMap(
      organizationId,
      page.map((document) => document.creatorProfile.userId),
    );

    return {
      items: page.map((document) => ({
        status: getDocumentExpirationStatus(document.expiresAt as Date, now),
        creator: toCreatorSummary(
          document.creatorProfile,
          membershipByUserId.get(document.creatorProfile.userId) ?? MembershipStatus.ACTIVE,
        ),
        document: toCreatorDocument(document),
        expiresAt: (document.expiresAt as Date).toISOString(),
      })),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async listMissingDocuments(
    user: AccessTokenPayload,
    query: MissingDocumentsQuery,
  ): Promise<ListMissingCreatorDocumentsResponse> {
    const organizationId = await this.requireActiveOrganization(user);

    if (query.creatorId) {
      await this.requireActiveCreatorProfile(organizationId, query.creatorId);
    }

    const requiredTypes = query.documentType
      ? [query.documentType]
      : REQUIRED_CREATOR_DOCUMENT_TYPES;

    const activeCreators = await prisma.creatorProfile.findMany({
      where: {
        organizationId,
        status: CreatorStatus.ACTIVE,
        ...(query.creatorId ? { id: query.creatorId } : {}),
      },
      include: creatorProfileInclude,
      orderBy: [{ displayName: 'asc' }, { id: 'asc' }],
    });

    const approvedDocuments = await prisma.creatorDocument.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: CreatorDocumentStatus.APPROVED,
        documentType: { in: requiredTypes },
        creatorProfileId: { in: activeCreators.map((creator) => creator.id) },
      },
      select: {
        creatorProfileId: true,
        documentType: true,
      },
    });

    const satisfiedKeys = new Set(
      approvedDocuments.map((document) =>
        buildMissingDocumentCursor(document.creatorProfileId as string, document.documentType),
      ),
    );

    const missingItems = activeCreators.flatMap((creator) =>
      requiredTypes
        .filter(
          (documentType) =>
            !satisfiedKeys.has(buildMissingDocumentCursor(creator.id, documentType)),
        )
        .map((documentType) => ({
          status: 'MISSING' as const,
          creator,
          documentType,
        })),
    );

    let startIndex = 0;

    if (query.cursor) {
      const cursorIndex = missingItems.findIndex(
        (item) => buildMissingDocumentCursor(item.creator.id, item.documentType) === query.cursor,
      );
      startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    }

    const page = missingItems.slice(startIndex, startIndex + query.limit);
    const hasMore = startIndex + query.limit < missingItems.length;

    const membershipByUserId = await this.loadMembershipStatusMap(
      organizationId,
      page.map((item) => item.creator.userId),
    );

    return {
      items: page.map((item) => ({
        status: item.status,
        creator: toCreatorSummary(
          item.creator,
          membershipByUserId.get(item.creator.userId) ?? MembershipStatus.ACTIVE,
        ),
        documentType: item.documentType,
      })),
      nextCursor: hasMore
        ? buildMissingDocumentCursor(page.at(-1)!.creator.id, page.at(-1)!.documentType)
        : null,
    };
  }

  async listExpiringContracts(
    user: AccessTokenPayload,
    query: ExpiringContractsQuery,
  ): Promise<ListExpiringCreatorContractsResponse> {
    const organizationId = await this.requireActiveOrganization(user);

    if (query.creatorId) {
      await this.requireActiveCreatorProfile(organizationId, query.creatorId);
    }

    const now = new Date();
    const windowEnd = addDays(now, query.days);
    const take = query.limit + 1;

    const contracts = await prisma.creatorContract.findMany({
      where: {
        organizationId,
        deletedAt: null,
        validUntil: { not: null },
        ...(query.contractType ? { contractType: query.contractType } : {}),
        ...(query.creatorId ? { creatorProfileId: query.creatorId } : {}),
        creatorProfile: {
          organizationId,
          status: CreatorStatus.ACTIVE,
        },
        ...(query.includeExpired
          ? {
              OR: [{ validUntil: { lt: now } }, { validUntil: { gte: now, lte: windowEnd } }],
            }
          : {
              validUntil: { gte: now, lte: windowEnd },
            }),
      },
      include: {
        creatorProfile: {
          include: creatorProfileInclude,
        },
      },
      orderBy: [{ validUntil: 'asc' }, { id: 'asc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = contracts.length > query.limit;
    const page = (
      hasMore ? contracts.slice(0, query.limit) : contracts
    ) as CreatorContractWithProfile[];
    const membershipByUserId = await this.loadMembershipStatusMap(
      organizationId,
      page.map((contract) => contract.creatorProfile.userId),
    );

    return {
      items: page.map((contract) => ({
        status: getContractExpirationStatus(contract.validUntil as Date, now),
        creator: toCreatorSummary(
          contract.creatorProfile,
          membershipByUserId.get(contract.creatorProfile.userId) ?? MembershipStatus.ACTIVE,
        ),
        contract: toCreatorContract(contract),
        validUntil: (contract.validUntil as Date).toISOString(),
      })),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
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
    });

    if (!profile) {
      throw new NotFoundException('Creator not found');
    }

    return profile;
  }

  private async loadMembershipStatusMap(organizationId: string, userIds: string[]) {
    if (userIds.length === 0) {
      return new Map<string, MembershipStatus>();
    }

    const memberships = await prisma.organizationMembership.findMany({
      where: {
        organizationId,
        userId: { in: userIds },
      },
      select: {
        userId: true,
        status: true,
      },
    });

    return new Map(memberships.map((membership) => [membership.userId, membership.status]));
  }
}
