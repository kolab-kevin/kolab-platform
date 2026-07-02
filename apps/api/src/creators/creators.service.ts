import { randomBytes } from 'node:crypto';

import type { AccessTokenPayload } from '@kolab/auth';
import { hashPassword } from '@kolab/auth';
import {
  type CreatorLead as PrismaCreatorLead,
  type CreatorProfile as PrismaCreatorProfile,
  type LeadPlatformAccount as PrismaLeadPlatformAccount,
  MembershipStatus,
  OrganizationRole,
  Prisma,
  prisma,
  Role as PrismaRole,
} from '@kolab/database';
import type {
  ConvertLeadResponse,
  CreatorDetailResponse,
  CreatorListQuery,
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
  type CreatorProfileWithAccounts,
  toCreatorFromProfile,
  toCreatorPlatformAccount,
  toCreatorSummary,
} from './creators.mapper';
import { buildConversionMetadata, updateStoredCreatorProfile } from './creators.utils';
import {
  backfillCreatorProfileFromLead,
  backfillCreatorProfilesForOrganization,
  createProfileFromLead,
} from './creators-backfill';

const CONVERTIBLE_LEAD_STATUSES = new Set(['SIGNED', 'ACTIVE_CREATOR']);

const creatorProfileInclude = {
  platformAccounts: true,
  sourceLead: true,
} as const;

@Injectable()
export class CreatorsService {
  constructor(private readonly auditService: AuditService) {}

  async convertLeadFromRecruitment(
    user: AccessTokenPayload,
    leadId: string,
  ): Promise<ConvertLeadResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const lead = await this.findLeadForConversion(organizationId, leadId);

    let existingProfile = await this.findExistingProfileForLead(organizationId, lead);

    if (!existingProfile && lead.convertedUserId && lead.convertedAt) {
      await backfillCreatorProfileFromLead(lead);
      existingProfile = await this.findExistingProfileForLead(organizationId, lead);
    }

    if (existingProfile) {
      const profile = await this.loadCreatorProfile(organizationId, existingProfile.id);

      return {
        lead: this.toConvertedLeadSummary(await this.ensureLeadConverted(lead, profile)),
        creator: toCreatorFromProfile(profile),
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

      const profile = await createProfileFromLead(tx, {
        ...lead,
        convertedUserId: creatorUser.id,
      });

      if (!profile) {
        throw new BadRequestException('Unable to create creator profile');
      }

      const profileWithAccounts = await tx.creatorProfile.findUniqueOrThrow({
        where: { id: profile.id },
        include: creatorProfileInclude,
      });

      const conversionHistoryEntry = {
        convertedAt: now.toISOString(),
        convertedBy: user.sub,
        creatorId: profile.id,
        userId: creatorUser.id,
      };

      const metadataProfile = {
        id: profile.id,
        userId: creatorUser.id,
        sourceLeadId: lead.id,
        displayName: profile.displayName,
        email: lead.email,
        phone: lead.phone,
        country: profile.country,
        languages: profile.languages,
        assignedRecruiterId: profile.recruiterUserId,
        commissionPlan: lead.commissionPlan,
        bio: profile.bio,
        availability:
          profile.availability !== null &&
          typeof profile.availability === 'object' &&
          !Array.isArray(profile.availability)
            ? (profile.availability as Record<string, unknown>)
            : undefined,
        metadata:
          profile.metadata !== null &&
          typeof profile.metadata === 'object' &&
          !Array.isArray(profile.metadata)
            ? (profile.metadata as Record<string, unknown>)
            : undefined,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      };

      const metadataAccounts = profileWithAccounts.platformAccounts.map((account) => ({
        id: account.id,
        organizationId: account.organizationId,
        creatorId: account.creatorProfileId,
        platform: account.platform,
        username: account.username,
        profileUrl: account.profileUrl,
        followers: account.followers,
        verified: account.verified,
        status: account.status,
        sourceLeadPlatformAccountId:
          typeof account.metadata === 'object' &&
          account.metadata !== null &&
          'sourceLeadPlatformAccountId' in account.metadata
            ? String((account.metadata as Record<string, unknown>).sourceLeadPlatformAccountId)
            : null,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      }));

      const updatedLead = await tx.creatorLead.update({
        where: { id: lead.id },
        data: {
          status: 'ACTIVE_CREATOR',
          convertedUserId: creatorUser.id,
          convertedAt: now,
          metadata: buildConversionMetadata(
            lead.metadata,
            metadataProfile,
            metadataAccounts,
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

      return { updatedLead, profile: profileWithAccounts };
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_CREATED,
      targetType: AUDIT_TARGET_TYPE.CREATOR,
      targetId: result.profile.id,
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
        creatorId: result.profile.id,
        convertedUserId: creatorUser.id,
        previousStatus: lead.status,
        newStatus: 'ACTIVE_CREATOR',
      },
    });

    return {
      lead: this.toConvertedLeadSummary(result.updatedLead),
      creator: toCreatorFromProfile(result.profile),
      alreadyConverted: false,
    };
  }

  async listCreators(
    user: AccessTokenPayload,
    query: CreatorListQuery,
  ): Promise<ListCreatorsResponse> {
    const organizationId = await this.requireActiveOrganization(user);

    await backfillCreatorProfilesForOrganization(organizationId);

    let userIdsFilter: string[] | undefined;

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

      userIdsFilter = memberships.map((membership) => membership.userId);
    }

    const where = await this.buildCreatorProfileListWhere(organizationId, query, userIdsFilter);
    const take = query.limit + 1;

    const profiles = await prisma.creatorProfile.findMany({
      where,
      include: creatorProfileInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
    const membershipByUserId = await this.loadMembershipStatusMap(
      organizationId,
      page.map((profile) => profile.userId),
    );

    return {
      items: page.map((profile) =>
        toCreatorSummary(
          profile,
          membershipByUserId.get(profile.userId) ?? MembershipStatus.ACTIVE,
        ),
      ),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getCreator(user: AccessTokenPayload, creatorId: string): Promise<CreatorDetailResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const profile = await this.findCreatorProfileOrBackfill(organizationId, creatorId);

    return this.buildCreatorDetail(organizationId, profile);
  }

  async updateCreator(
    user: AccessTokenPayload,
    creatorId: string,
    input: UpdateCreatorInput,
  ): Promise<CreatorDetailResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const existing = await this.findCreatorProfileOrBackfill(organizationId, creatorId);

    await prisma.$transaction(async (tx) => {
      await tx.creatorProfile.update({
        where: { id: existing.id },
        data: {
          ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
          ...(input.bio !== undefined ? { bio: input.bio } : {}),
          ...(input.country !== undefined ? { country: input.country } : {}),
          ...(input.languages !== undefined ? { languages: input.languages } : {}),
          ...(input.availability !== undefined
            ? { availability: input.availability as Prisma.InputJsonValue }
            : {}),
          ...(input.metadata !== undefined
            ? { metadata: input.metadata as Prisma.InputJsonValue }
            : {}),
        },
      });

      if (
        input.displayName !== undefined ||
        input.bio !== undefined ||
        input.country !== undefined ||
        input.languages !== undefined
      ) {
        await tx.userProfile.upsert({
          where: { userId: existing.userId },
          create: {
            userId: existing.userId,
            displayName: input.displayName ?? existing.displayName,
            bio: input.bio ?? existing.bio ?? undefined,
            country: input.country ?? existing.country ?? undefined,
            language: input.languages?.[0] ?? existing.languages[0] ?? 'en',
          },
          update: {
            ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
            ...(input.bio !== undefined ? { bio: input.bio } : {}),
            ...(input.country !== undefined ? { country: input.country } : {}),
            ...(input.languages !== undefined ? { language: input.languages[0] ?? 'en' } : {}),
          },
        });
      }

      if (existing.sourceLeadId) {
        const lead = await tx.creatorLead.findUnique({ where: { id: existing.sourceLeadId } });

        if (lead) {
          await tx.creatorLead.update({
            where: { id: lead.id },
            data: {
              metadata: updateStoredCreatorProfile(lead.metadata, {
                ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
                ...(input.bio !== undefined ? { bio: input.bio } : {}),
                ...(input.country !== undefined ? { country: input.country } : {}),
                ...(input.languages !== undefined ? { languages: input.languages } : {}),
                ...(input.availability !== undefined ? { availability: input.availability } : {}),
                ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
              }) as Prisma.InputJsonValue,
            },
          });
        }
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
        sourceLeadId: existing.sourceLeadId,
      },
    });

    const updatedProfile = await this.loadCreatorProfile(organizationId, creatorId);

    return this.buildCreatorDetail(organizationId, updatedProfile);
  }

  private async findCreatorProfileOrBackfill(
    organizationId: string,
    creatorId: string,
  ): Promise<CreatorProfileWithAccounts> {
    const profile = await prisma.creatorProfile.findFirst({
      where: { id: creatorId, organizationId },
      include: creatorProfileInclude,
    });

    if (profile) {
      return profile;
    }

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
      include: { platformAccounts: true },
    });

    if (!lead) {
      throw new NotFoundException('Creator not found');
    }

    await backfillCreatorProfileFromLead(lead);

    return this.loadCreatorProfile(organizationId, creatorId);
  }

  private async loadCreatorProfile(
    organizationId: string,
    creatorId: string,
  ): Promise<CreatorProfileWithAccounts> {
    const profile = await prisma.creatorProfile.findFirst({
      where: { id: creatorId, organizationId },
      include: creatorProfileInclude,
    });

    if (!profile) {
      throw new NotFoundException('Creator not found');
    }

    return profile;
  }

  private async findExistingProfileForLead(
    organizationId: string,
    lead: PrismaCreatorLead,
  ): Promise<PrismaCreatorProfile | null> {
    const bySourceLead = await prisma.creatorProfile.findUnique({
      where: { sourceLeadId: lead.id },
    });

    if (bySourceLead) {
      return bySourceLead;
    }

    if (lead.convertedUserId) {
      return prisma.creatorProfile.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: lead.convertedUserId,
          },
        },
      });
    }

    return null;
  }

  private async ensureLeadConverted(
    lead: PrismaCreatorLead,
    profile: CreatorProfileWithAccounts,
  ): Promise<PrismaCreatorLead> {
    if (lead.convertedUserId && lead.convertedAt) {
      return lead;
    }

    return prisma.creatorLead.update({
      where: { id: lead.id },
      data: {
        status: 'ACTIVE_CREATOR',
        convertedUserId: profile.userId,
        convertedAt: profile.createdAt,
      },
    });
  }

  private async buildCreatorProfileListWhere(
    organizationId: string,
    query: CreatorListQuery,
    userIds?: string[],
  ): Promise<Prisma.CreatorProfileWhereInput> {
    const where: Prisma.CreatorProfileWhereInput = {
      organizationId,
      ...(userIds ? { userId: { in: userIds } } : {}),
      ...(query.recruiterId ? { recruiterUserId: query.recruiterId } : {}),
      ...(query.country ? { country: query.country } : {}),
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

    if (query.search) {
      where.OR = [
        { displayName: { contains: query.search, mode: 'insensitive' } },
        {
          sourceLead: {
            email: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          sourceLead: {
            nickname: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          platformAccounts: {
            some: {
              username: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    return where;
  }

  private async buildCreatorDetail(
    organizationId: string,
    profile: CreatorProfileWithAccounts,
  ): Promise<CreatorDetailResponse> {
    const [user, userProfile, organization, recruiterProfile, membership] = await Promise.all([
      prisma.user.findUnique({ where: { id: profile.userId } }),
      prisma.userProfile.findUnique({ where: { userId: profile.userId } }),
      prisma.organization.findUnique({ where: { id: organizationId } }),
      profile.recruiterUserId
        ? prisma.recruiterProfile.findFirst({
            where: {
              organizationId,
              userId: profile.recruiterUserId,
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

    const creator = toCreatorFromProfile(profile);

    return {
      creator: {
        ...creator,
        bio: profile.bio ?? userProfile?.bio ?? null,
        availability: (profile.availability ??
          {}) as CreatorDetailResponse['creator']['availability'],
        metadata: (profile.metadata ?? {}) as Record<string, unknown>,
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
      platformAccounts: profile.platformAccounts.map(toCreatorPlatformAccount),
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
}
