import type { AccessTokenPayload } from '@kolab/auth';
import {
  MembershipStatus,
  Prisma,
  prisma,
  type RecruiterProfile as PrismaRecruiterProfile,
} from '@kolab/database';
import type {
  CreateRecruiterProfileInput,
  ListRecruiterProfilesResponse,
  RecruiterProfile,
  RecruiterProfileListQuery,
  RecruiterProfileSummary,
  UpdateRecruiterProfileInput,
} from '@kolab/types';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import {
  ELIGIBLE_RECRUITER_PROFILE_MEMBER_ROLES,
  RECRUITER_PROFILE_MANAGER_ROLES,
} from './recruiters.constants';
import { toRecord } from './recruiters.utils';

@Injectable()
export class RecruitersService {
  constructor(private readonly auditService: AuditService) {}

  async listRecruiters(
    user: AccessTokenPayload,
    query: RecruiterProfileListQuery,
  ): Promise<ListRecruiterProfilesResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    const where = this.buildListWhere(organizationId, query);
    const take = query.limit + 1;

    const profiles = await prisma.recruiterProfile.findMany({
      where,
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

    return {
      items: page.map((profile) => this.toRecruiterProfileSummary(profile)),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getRecruiter(user: AccessTokenPayload, profileId: string): Promise<RecruiterProfile> {
    const organizationId = await this.requireActiveOrganization(user);
    const profile = await this.findOrganizationProfile(organizationId, profileId);

    return this.toRecruiterProfile(profile);
  }

  async createRecruiterProfile(
    user: AccessTokenPayload,
    input: CreateRecruiterProfileInput,
  ): Promise<RecruiterProfile> {
    const organizationId = await this.requireActiveOrganization(user);
    this.assertRecruiterProfileManager(user);

    await this.assertEligibleProfileMember(organizationId, input.userId);

    if (input.managerUserId) {
      await this.assertActiveOrganizationMember(organizationId, input.managerUserId);
    }

    let profile: PrismaRecruiterProfile;

    try {
      profile = await prisma.recruiterProfile.create({
        data: {
          organizationId,
          userId: input.userId,
          displayName: input.displayName ?? null,
          nickname: input.nickname ?? null,
          territory: input.territory ?? null,
          languages: input.languages ?? [],
          hireDate: input.hireDate ? new Date(input.hireDate) : null,
          commissionPlan: input.commissionPlan ?? 'STANDARD',
          monthlyLeadGoal: input.monthlyLeadGoal ?? null,
          monthlyCreatorGoal: input.monthlyCreatorGoal ?? null,
          availability: (input.availability ?? {}) as Prisma.InputJsonValue,
          managerUserId: input.managerUserId ?? null,
          status: input.status ?? 'ACTIVE',
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Recruiter profile already exists for this user');
      }

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('Recruiter profile already exists for this user');
      }

      throw error;
    }

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.RECRUITER_CREATED,
      targetType: AUDIT_TARGET_TYPE.RECRUITER,
      targetId: profile.id,
      metadata: {
        userId: profile.userId,
        status: profile.status,
      },
    });

    return this.toRecruiterProfile(profile);
  }

  async updateRecruiterProfile(
    user: AccessTokenPayload,
    profileId: string,
    input: UpdateRecruiterProfileInput,
  ): Promise<RecruiterProfile> {
    const organizationId = await this.requireActiveOrganization(user);
    this.assertRecruiterProfileManager(user);

    const existing = await this.findOrganizationProfile(organizationId, profileId);

    if (input.managerUserId) {
      await this.assertActiveOrganizationMember(organizationId, input.managerUserId);
    }

    const data: Prisma.RecruiterProfileUpdateInput = {};

    if (input.displayName !== undefined) {
      data.displayName = input.displayName;
    }
    if (input.nickname !== undefined) {
      data.nickname = input.nickname;
    }
    if (input.territory !== undefined) {
      data.territory = input.territory;
    }
    if (input.languages !== undefined) {
      data.languages = input.languages;
    }
    if (input.hireDate !== undefined) {
      data.hireDate = input.hireDate ? new Date(input.hireDate) : null;
    }
    if (input.commissionPlan !== undefined) {
      data.commissionPlan = input.commissionPlan;
    }
    if (input.monthlyLeadGoal !== undefined) {
      data.monthlyLeadGoal = input.monthlyLeadGoal;
    }
    if (input.monthlyCreatorGoal !== undefined) {
      data.monthlyCreatorGoal = input.monthlyCreatorGoal;
    }
    if (input.availability !== undefined) {
      data.availability = input.availability as Prisma.InputJsonValue;
    }
    if (input.managerUserId !== undefined) {
      data.manager = input.managerUserId
        ? { connect: { id: input.managerUserId } }
        : { disconnect: true };
    }
    if (input.status !== undefined) {
      data.status = input.status;
    }
    if (input.metadata !== undefined) {
      data.metadata = input.metadata as Prisma.InputJsonValue;
    }

    const profile = await prisma.recruiterProfile.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.RECRUITER_UPDATED,
      targetType: AUDIT_TARGET_TYPE.RECRUITER,
      targetId: profile.id,
      metadata: {
        updatedFields: Object.keys(input),
      },
    });

    return this.toRecruiterProfile(profile);
  }

  private buildListWhere(
    organizationId: string,
    query: RecruiterProfileListQuery,
  ): Prisma.RecruiterProfileWhereInput {
    const where: Prisma.RecruiterProfileWhereInput = {
      organizationId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.managerUserId ? { managerUserId: query.managerUserId } : {}),
    };

    if (query.search) {
      where.OR = [
        { displayName: { contains: query.search, mode: 'insensitive' } },
        { nickname: { contains: query.search, mode: 'insensitive' } },
        { territory: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async findOrganizationProfile(
    organizationId: string,
    profileId: string,
  ): Promise<PrismaRecruiterProfile> {
    const profile = await prisma.recruiterProfile.findFirst({
      where: {
        id: profileId,
        organizationId,
      },
    });

    if (!profile) {
      throw new NotFoundException('Recruiter profile not found');
    }

    return profile;
  }

  private async assertEligibleProfileMember(organizationId: string, userId: string): Promise<void> {
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException('User is not an active organization member');
    }

    if (!ELIGIBLE_RECRUITER_PROFILE_MEMBER_ROLES.has(membership.role)) {
      throw new BadRequestException(
        `User role ${membership.role} is not eligible for a recruiter profile`,
      );
    }
  }

  private async assertActiveOrganizationMember(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException('Manager user is not an active organization member');
    }
  }

  private assertRecruiterProfileManager(user: AccessTokenPayload): void {
    if (user.isSystemAdmin) {
      return;
    }

    if (!user.organizationRole || !RECRUITER_PROFILE_MANAGER_ROLES.has(user.organizationRole)) {
      throw new ForbiddenException('Only organization managers can manage recruiter profiles');
    }
  }

  private async requireActiveOrganization(user: AccessTokenPayload): Promise<string> {
    const organizationId = this.requireOrganizationContext(user);
    await this.assertActiveMembership(user.sub, organizationId);
    return organizationId;
  }

  private requireOrganizationContext(user: AccessTokenPayload): string {
    if (!user.organizationId) {
      throw new ForbiddenException('Active organization context required');
    }

    return user.organizationId;
  }

  private async assertActiveMembership(userId: string, organizationId: string): Promise<void> {
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('No active membership in selected organization');
    }
  }

  private toRecruiterProfileSummary(profile: PrismaRecruiterProfile): RecruiterProfileSummary {
    return {
      id: profile.id,
      organizationId: profile.organizationId,
      userId: profile.userId,
      displayName: profile.displayName,
      nickname: profile.nickname,
      territory: profile.territory,
      status: profile.status,
      managerUserId: profile.managerUserId,
      commissionPlan: profile.commissionPlan,
      monthlyLeadGoal: profile.monthlyLeadGoal,
      monthlyCreatorGoal: profile.monthlyCreatorGoal,
    };
  }

  private toRecruiterProfile(profile: PrismaRecruiterProfile): RecruiterProfile {
    return {
      id: profile.id,
      organizationId: profile.organizationId,
      userId: profile.userId,
      displayName: profile.displayName,
      nickname: profile.nickname,
      territory: profile.territory,
      languages: profile.languages,
      hireDate: profile.hireDate?.toISOString() ?? null,
      commissionPlan: profile.commissionPlan,
      monthlyLeadGoal: profile.monthlyLeadGoal,
      monthlyCreatorGoal: profile.monthlyCreatorGoal,
      availability: toRecord(profile.availability),
      managerUserId: profile.managerUserId,
      status: profile.status,
      metadata: toRecord(profile.metadata),
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
