import { randomBytes } from 'node:crypto';

import type { AccessTokenPayload } from '@kolab/auth';
import { hashPassword } from '@kolab/auth';
import {
  type CreatorLead as PrismaCreatorLead,
  type LeadPlatformAccount as PrismaLeadPlatformAccount,
  MembershipStatus,
  OrganizationRole,
  Prisma,
  prisma,
  Role as PrismaRole,
} from '@kolab/database';
import type {
  ConvertLeadResponse,
  Creator,
  CreatorDetailResponse,
  CreatorListQuery,
  CreatorPlatformAccount,
  CreatorSummary,
  ListCreatorsResponse,
  UpdateCreatorInput,
} from '@kolab/types';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { activeLeadMetadataFilter } from '../recruitment/recruitment.utils';
import {
  buildConversionMetadata,
  createCreatorId,
  createCreatorPlatformAccountId,
  getCreatorPlatformAccounts,
  getCreatorProfile,
  type StoredCreatorPlatformAccount,
  type StoredCreatorProfile,
  updateStoredCreatorProfile,
} from './creators.utils';

const CONVERTIBLE_LEAD_STATUSES = new Set(['SIGNED', 'ACTIVE_CREATOR']);

@Injectable()
export class CreatorsService {
  constructor(private readonly auditService: AuditService) {}

  async convertLeadFromRecruitment(
    user: AccessTokenPayload,
    leadId: string,
  ): Promise<ConvertLeadResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const lead = await this.findLeadForConversion(organizationId, leadId);

    if (lead.convertedUserId && lead.convertedAt) {
      return {
        lead: this.toConvertedLeadSummary(lead),
        creator: this.toCreatorResponse(lead),
        alreadyConverted: true,
      };
    }

    if (!CONVERTIBLE_LEAD_STATUSES.has(lead.status)) {
      throw new BadRequestException(
        'Lead must be in SIGNED or ACTIVE_CREATOR status before conversion',
      );
    }

    const creatorUser = await this.resolveCreatorUser(lead);
    const now = new Date();
    const creatorId = createCreatorId();
    const platformAccounts = this.buildCreatorPlatformAccounts(lead, creatorId, now);

    const creatorProfile: StoredCreatorProfile = {
      id: creatorId,
      userId: creatorUser.id,
      sourceLeadId: lead.id,
      displayName: lead.name,
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      languages: lead.languages,
      assignedRecruiterId: lead.assignedRecruiterId,
      commissionPlan: lead.commissionPlan,
      bio: null,
      availability: {},
      metadata: {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const conversionHistoryEntry = {
      convertedAt: now.toISOString(),
      convertedBy: user.sub,
      creatorId,
      userId: creatorUser.id,
    };

    const result = await prisma.$transaction(async (tx) => {
      await tx.userProfile.upsert({
        where: { userId: creatorUser.id },
        create: {
          userId: creatorUser.id,
          displayName: lead.name,
          country: lead.country ?? undefined,
          language: lead.languages[0] ?? 'en',
        },
        update: {
          displayName: lead.name,
          ...(lead.country ? { country: lead.country } : {}),
          ...(lead.languages[0] ? { language: lead.languages[0] } : {}),
        },
      });

      await tx.organizationMembership.upsert({
        where: {
          organizationId_userId: {
            organizationId,
            userId: creatorUser.id,
          },
        },
        create: {
          organizationId,
          userId: creatorUser.id,
          role: OrganizationRole.CREATOR,
          status: MembershipStatus.ACTIVE,
          invitedBy: user.sub,
        },
        update: {
          role: OrganizationRole.CREATOR,
          status: MembershipStatus.ACTIVE,
        },
      });

      const updatedLead = await tx.creatorLead.update({
        where: { id: lead.id },
        data: {
          status: 'ACTIVE_CREATOR',
          convertedUserId: creatorUser.id,
          convertedAt: now,
          metadata: buildConversionMetadata(
            lead.metadata,
            creatorProfile,
            platformAccounts,
            conversionHistoryEntry,
          ) as Prisma.InputJsonValue,
        },
      });

      if (lead.status !== 'ACTIVE_CREATOR') {
        await tx.leadStatusHistory.create({
          data: {
            organizationId,
            leadId: lead.id,
            previousStatus: lead.status,
            newStatus: 'ACTIVE_CREATOR',
            changedById: user.sub,
            reason: 'Lead converted to creator roster',
          },
        });
      }

      return updatedLead;
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_CREATED,
      targetType: AUDIT_TARGET_TYPE.CREATOR,
      targetId: creatorId,
      metadata: {
        userId: creatorUser.id,
        sourceLeadId: lead.id,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.LEAD_CONVERTED,
      targetType: AUDIT_TARGET_TYPE.LEAD,
      targetId: lead.id,
      metadata: {
        creatorId,
        convertedUserId: creatorUser.id,
        previousStatus: lead.status,
        newStatus: 'ACTIVE_CREATOR',
      },
    });

    return {
      lead: this.toConvertedLeadSummary(result),
      creator: this.toCreatorResponse(result),
      alreadyConverted: false,
    };
  }

  toCreatorResponse(lead: PrismaCreatorLead): Creator {
    const profile = getCreatorProfile(lead.metadata);

    if (!profile || !lead.convertedUserId) {
      throw new NotFoundException('Creator record not found for lead');
    }

    return {
      id: profile.id,
      organizationId: lead.organizationId,
      userId: profile.userId,
      sourceLeadId: profile.sourceLeadId,
      displayName: profile.displayName,
      email: profile.email,
      phone: profile.phone,
      country: profile.country,
      languages: profile.languages,
      assignedRecruiterId: profile.assignedRecruiterId,
      commissionPlan: profile.commissionPlan as Creator['commissionPlan'],
      platformAccounts: getCreatorPlatformAccounts(lead.metadata).map((account) =>
        this.toCreatorPlatformAccount(account),
      ),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async listCreators(
    user: AccessTokenPayload,
    query: CreatorListQuery,
  ): Promise<ListCreatorsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    let convertedUserIds: string[] | undefined;

    if (query.status) {
      const memberships = await prisma.organizationMembership.findMany({
        where: {
          organizationId,
          role: OrganizationRole.CREATOR,
          status: query.status,
        },
        select: { userId: true },
      });

      if (memberships.length === 0) {
        return { items: [], nextCursor: null };
      }

      convertedUserIds = memberships.map((membership) => membership.userId);
    }

    const where = await this.buildCreatorListWhere(organizationId, query, convertedUserIds);
    const take = query.limit + 1;

    const leads = await prisma.creatorLead.findMany({
      where,
      orderBy: [{ convertedAt: 'desc' }, { id: 'desc' }],
      take,
    });

    const hasMore = leads.length > query.limit;
    const page = hasMore ? leads.slice(0, query.limit) : leads;
    const membershipByUserId = await this.loadMembershipStatusMap(
      organizationId,
      page
        .map((lead) => lead.convertedUserId)
        .filter((userId): userId is string => Boolean(userId)),
    );

    return {
      items: page
        .map((lead) => this.toCreatorSummary(lead, membershipByUserId))
        .filter((summary): summary is CreatorSummary => summary !== null),
      nextCursor: hasMore
        ? page.at(-1)
          ? (getCreatorProfile(page.at(-1)!.metadata)?.id ?? null)
          : null
        : null,
    };
  }

  async getCreator(user: AccessTokenPayload, creatorId: string): Promise<CreatorDetailResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const lead = await this.findLeadByCreatorId(organizationId, creatorId);

    return this.buildCreatorDetail(organizationId, lead);
  }

  async updateCreator(
    user: AccessTokenPayload,
    creatorId: string,
    input: UpdateCreatorInput,
  ): Promise<CreatorDetailResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const lead = await this.findLeadByCreatorId(organizationId, creatorId);
    const profile = getCreatorProfile(lead.metadata);

    if (!profile || !lead.convertedUserId) {
      throw new NotFoundException('Creator not found');
    }

    const profileUpdates = {
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.languages !== undefined ? { languages: input.languages } : {}),
      ...(input.availability !== undefined ? { availability: input.availability } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    };

    await prisma.$transaction(async (tx) => {
      await tx.creatorLead.update({
        where: { id: lead.id },
        data: {
          metadata: updateStoredCreatorProfile(
            lead.metadata,
            profileUpdates,
          ) as Prisma.InputJsonValue,
        },
      });

      if (
        input.displayName !== undefined ||
        input.bio !== undefined ||
        input.country !== undefined ||
        input.languages !== undefined
      ) {
        await tx.userProfile.upsert({
          where: { userId: lead.convertedUserId! },
          create: {
            userId: lead.convertedUserId!,
            displayName: input.displayName ?? profile.displayName,
            bio: input.bio ?? profile.bio ?? undefined,
            country: input.country ?? profile.country ?? undefined,
            language: input.languages?.[0] ?? profile.languages[0] ?? 'en',
          },
          update: {
            ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
            ...(input.bio !== undefined ? { bio: input.bio } : {}),
            ...(input.country !== undefined ? { country: input.country } : {}),
            ...(input.languages !== undefined ? { language: input.languages[0] ?? 'en' } : {}),
          },
        });
      }
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_UPDATED,
      targetType: AUDIT_TARGET_TYPE.CREATOR,
      targetId: creatorId,
      metadata: {
        updatedFields: Object.keys(input),
        sourceLeadId: lead.id,
      },
    });

    const updatedLead = await this.findLeadByCreatorId(organizationId, creatorId);

    return this.buildCreatorDetail(organizationId, updatedLead);
  }

  private async buildCreatorListWhere(
    organizationId: string,
    query: CreatorListQuery,
    convertedUserIds?: string[],
  ): Promise<Prisma.CreatorLeadWhereInput> {
    const metadataFilters: Prisma.CreatorLeadWhereInput[] = [];

    if (query.recruiterId) {
      metadataFilters.push({
        metadata: {
          path: ['creatorProfile', 'assignedRecruiterId'],
          equals: query.recruiterId,
        },
      });
    }

    if (query.country) {
      metadataFilters.push({
        metadata: {
          path: ['creatorProfile', 'country'],
          equals: query.country,
        },
      });
    }

    const where: Prisma.CreatorLeadWhereInput = {
      organizationId,
      convertedUserId: convertedUserIds ? { in: convertedUserIds } : { not: null },
      convertedAt: { not: null },
      ...activeLeadMetadataFilter(),
      ...(query.language ? { languages: { has: query.language } } : {}),
      ...(query.platform
        ? {
            platformAccounts: {
              some: {
                platform: query.platform,
              },
            },
          }
        : {}),
    };

    if (metadataFilters.length > 0) {
      where.AND = [...(Array.isArray(where.AND) ? where.AND : []), ...metadataFilters];
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { nickname: { contains: query.search, mode: 'insensitive' } },
        {
          platformAccounts: {
            some: {
              username: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (query.cursor) {
      const cursorLead = await prisma.creatorLead.findFirst({
        where: {
          organizationId,
          metadata: {
            path: ['creatorProfile', 'id'],
            equals: query.cursor,
          },
        },
      });

      if (cursorLead?.convertedAt) {
        const cursorFilter = {
          OR: [
            { convertedAt: { lt: cursorLead.convertedAt } },
            {
              convertedAt: cursorLead.convertedAt,
              id: { lt: cursorLead.id },
            },
          ],
        };
        where.AND = [...(Array.isArray(where.AND) ? where.AND : []), cursorFilter];
      }
    }

    return where;
  }

  private async findLeadByCreatorId(
    organizationId: string,
    creatorId: string,
  ): Promise<PrismaCreatorLead> {
    const lead = await prisma.creatorLead.findFirst({
      where: {
        organizationId,
        convertedUserId: { not: null },
        metadata: {
          path: ['creatorProfile', 'id'],
          equals: creatorId,
        },
        ...activeLeadMetadataFilter(),
      },
    });

    if (!lead || !getCreatorProfile(lead.metadata)) {
      throw new NotFoundException('Creator not found');
    }

    return lead;
  }

  private async buildCreatorDetail(
    organizationId: string,
    lead: PrismaCreatorLead,
  ): Promise<CreatorDetailResponse> {
    const profile = getCreatorProfile(lead.metadata)!;
    const platformAccounts = getCreatorPlatformAccounts(lead.metadata).map((account) =>
      this.toCreatorPlatformAccount(account),
    );

    const [user, userProfile, organization, recruiterProfile, membership] = await Promise.all([
      prisma.user.findUnique({ where: { id: profile.userId } }),
      prisma.userProfile.findUnique({ where: { userId: profile.userId } }),
      prisma.organization.findUnique({ where: { id: organizationId } }),
      profile.assignedRecruiterId
        ? prisma.recruiterProfile.findFirst({
            where: {
              organizationId,
              userId: profile.assignedRecruiterId,
            },
          })
        : Promise.resolve(null),
      prisma.organizationMembership.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: profile.userId,
          },
        },
      }),
    ]);

    if (!user || !organization) {
      throw new NotFoundException('Creator not found');
    }

    return {
      creator: {
        ...this.toCreatorResponse(lead),
        bio: profile.bio ?? userProfile?.bio ?? null,
        availability: (profile.availability ??
          {}) as CreatorDetailResponse['creator']['availability'],
        metadata: profile.metadata ?? {},
        status: membership?.status ?? MembershipStatus.ACTIVE,
      },
      user: {
        id: user.id,
        email: user.email,
        displayName: userProfile?.displayName ?? profile.displayName,
        avatarUrl: userProfile?.avatarUrl ?? null,
      },
      recruiter: recruiterProfile
        ? {
            id: recruiterProfile.id,
            userId: recruiterProfile.userId,
            displayName: recruiterProfile.displayName,
            nickname: recruiterProfile.nickname,
            territory: recruiterProfile.territory,
            status: recruiterProfile.status,
          }
        : null,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        type: organization.type,
        status: organization.status,
      },
      platformAccounts,
    };
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
    });

    return new Map(memberships.map((membership) => [membership.userId, membership.status]));
  }

  private toCreatorSummary(
    lead: PrismaCreatorLead,
    membershipByUserId: Map<string, MembershipStatus>,
  ): CreatorSummary | null {
    const profile = getCreatorProfile(lead.metadata);

    if (!profile || !lead.convertedUserId) {
      return null;
    }

    return {
      id: profile.id,
      organizationId: lead.organizationId,
      userId: profile.userId,
      displayName: profile.displayName,
      email: profile.email,
      country: profile.country,
      languages: profile.languages,
      assignedRecruiterId: profile.assignedRecruiterId,
      status: membershipByUserId.get(profile.userId) ?? MembershipStatus.ACTIVE,
      platformCount: getCreatorPlatformAccounts(lead.metadata).length,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private buildCreatorPlatformAccounts(
    lead: PrismaCreatorLead & { platformAccounts: PrismaLeadPlatformAccount[] },
    creatorId: string,
    now: Date,
  ): StoredCreatorPlatformAccount[] {
    const timestamp = now.toISOString();

    return lead.platformAccounts.map((account) => ({
      id: createCreatorPlatformAccountId(),
      organizationId: lead.organizationId,
      creatorId,
      platform: account.platform,
      username: account.username,
      profileUrl: account.profileUrl,
      followers: account.followers,
      verified: account.verified,
      status: account.status,
      sourceLeadPlatformAccountId: account.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
  }

  private async resolveCreatorUser(lead: PrismaCreatorLead) {
    if (lead.convertedUserId) {
      const user = await prisma.user.findUnique({ where: { id: lead.convertedUserId } });

      if (!user) {
        throw new BadRequestException('Linked converted user no longer exists');
      }

      return user;
    }

    if (!lead.email) {
      throw new BadRequestException('Lead email is required to create a creator user');
    }

    const existingUser = await prisma.user.findUnique({ where: { email: lead.email } });

    if (existingUser) {
      return existingUser;
    }

    return prisma.user.create({
      data: {
        email: lead.email,
        passwordHash: await hashPassword(randomBytes(32).toString('hex')),
        role: PrismaRole.USER,
        profile: {
          create: {
            displayName: lead.name,
            country: lead.country ?? undefined,
            language: lead.languages[0] ?? 'en',
          },
        },
      },
    });
  }

  private async findLeadForConversion(
    organizationId: string,
    leadId: string,
  ): Promise<PrismaCreatorLead & { platformAccounts: PrismaLeadPlatformAccount[] }> {
    const lead = await prisma.creatorLead.findFirst({
      where: {
        id: leadId,
        organizationId,
        ...activeLeadMetadataFilter(),
      },
      include: {
        platformAccounts: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  private async requireActiveOrganization(user: AccessTokenPayload): Promise<string> {
    const organizationId = this.requireOrganizationContext(user);

    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.sub,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('No active membership in selected organization');
    }

    return organizationId;
  }

  private requireOrganizationContext(user: AccessTokenPayload): string {
    if (!user.organizationId) {
      throw new ForbiddenException('Active organization context required');
    }

    return user.organizationId;
  }

  private toConvertedLeadSummary(lead: PrismaCreatorLead) {
    return {
      id: lead.id,
      organizationId: lead.organizationId,
      status: lead.status,
      convertedUserId: lead.convertedUserId,
      convertedAt: lead.convertedAt?.toISOString() ?? null,
    };
  }

  private toCreatorPlatformAccount(account: StoredCreatorPlatformAccount): CreatorPlatformAccount {
    return {
      id: account.id,
      organizationId: account.organizationId,
      creatorId: account.creatorId,
      platform: account.platform as CreatorPlatformAccount['platform'],
      username: account.username,
      profileUrl: account.profileUrl,
      followers: account.followers,
      verified: account.verified,
      status: account.status as CreatorPlatformAccount['status'],
      sourceLeadPlatformAccountId: account.sourceLeadPlatformAccountId,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
