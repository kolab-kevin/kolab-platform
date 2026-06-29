import type { AccessTokenPayload } from '@kolab/auth';
import { signAccessToken } from '@kolab/auth';
import { apiEnvSchema, parseEnv } from '@kolab/config';
import {
  MembershipStatus,
  type Organization,
  type OrganizationMembership,
  OrganizationRole,
  prisma,
  type User,
  type UserProfile,
} from '@kolab/database';
import type {
  CurrentOrganizationResponse,
  ListOrganizationMembersResponse,
  ListOrganizationsResponse,
  SwitchOrganizationResponse,
  UpdateOrganizationMemberInput,
  UpdateOrganizationMemberResponse,
} from '@kolab/types';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class OrganizationService {
  private readonly env = parseEnv(apiEnvSchema);

  async getCurrentOrganization(user: AccessTokenPayload): Promise<CurrentOrganizationResponse> {
    const organizationId = this.requireOrganizationContext(user);
    const membership = await this.getActiveMembership(user.sub, organizationId);
    const organization = await this.getOrganizationOrThrow(organizationId);

    return {
      organization: this.toOrganization(organization),
      membership: {
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt.toISOString(),
      },
    };
  }

  async listOrganizations(userId: string): Promise<ListOrganizationsResponse> {
    const memberships = await prisma.organizationMembership.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: { joinedAt: 'asc' },
    });

    return {
      organizations: memberships.map((membership) => ({
        organization: this.toOrganizationSummary(membership.organization),
        membership: {
          role: membership.role,
          status: membership.status,
          joinedAt: membership.joinedAt.toISOString(),
        },
      })),
    };
  }

  async switchOrganization(
    user: AccessTokenPayload,
    organizationId: string,
  ): Promise<SwitchOrganizationResponse> {
    const membership = await this.getActiveMembership(user.sub, organizationId);
    const organization = await this.getOrganizationOrThrow(organizationId);

    if (user.sessionId) {
      await prisma.session.update({
        where: { id: user.sessionId },
        data: { organizationId },
      });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    const { token: accessToken, expiresIn } = signAccessToken(
      {
        sub: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        isSystemAdmin: dbUser.isSystemAdmin,
        organizationId,
        organizationRole: membership.role,
        sessionId: user.sessionId,
      },
      { secret: this.env.JWT_SECRET, accessExpiry: this.env.JWT_ACCESS_EXPIRY },
    );

    return {
      organization: this.toOrganizationSummary(organization),
      membership: {
        role: membership.role,
        status: membership.status,
      },
      accessToken,
      expiresIn,
    };
  }

  async listMembers(user: AccessTokenPayload): Promise<ListOrganizationMembersResponse> {
    const organizationId = this.requireOrganizationContext(user);
    await this.getActiveMembership(user.sub, organizationId);

    const memberships = await prisma.organizationMembership.findMany({
      where: { organizationId },
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return {
      members: memberships.map((membership) =>
        this.toOrganizationMember(membership, membership.user, membership.user.profile),
      ),
    };
  }

  async updateMember(
    user: AccessTokenPayload,
    memberUserId: string,
    input: UpdateOrganizationMemberInput,
  ): Promise<UpdateOrganizationMemberResponse> {
    const organizationId = this.requireOrganizationContext(user);
    await this.getActiveMembership(user.sub, organizationId);

    const existing = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: memberUserId,
        },
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Organization member not found');
    }

    if (
      input.role === OrganizationRole.ORG_OWNER &&
      user.organizationRole !== OrganizationRole.ORG_OWNER
    ) {
      throw new ForbiddenException('Only organization owners can assign the owner role');
    }

    if (
      existing.role === OrganizationRole.ORG_OWNER &&
      input.role &&
      input.role !== OrganizationRole.ORG_OWNER
    ) {
      const otherOwners = await prisma.organizationMembership.count({
        where: {
          organizationId,
          role: OrganizationRole.ORG_OWNER,
          status: MembershipStatus.ACTIVE,
          userId: { not: memberUserId },
        },
      });

      if (otherOwners === 0) {
        throw new ForbiddenException('Cannot change role of the sole organization owner');
      }
    }

    const updated = await prisma.organizationMembership.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId: memberUserId,
        },
      },
      data: {
        role: input.role,
        status: input.status,
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    return {
      member: this.toOrganizationMember(updated, updated.user, updated.user.profile),
    };
  }

  private requireOrganizationContext(user: AccessTokenPayload): string {
    if (!user.organizationId) {
      throw new ForbiddenException('Active organization context required');
    }

    return user.organizationId;
  }

  private async getOrganizationOrThrow(organizationId: string): Promise<Organization> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  private async getActiveMembership(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMembership> {
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

    return membership;
  }

  private toOrganization(organization: Organization) {
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      type: organization.type,
      status: organization.status,
      settings: this.toSettingsRecord(organization.settings),
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    };
  }

  private toOrganizationSummary(organization: Organization) {
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      type: organization.type,
      status: organization.status,
    };
  }

  private toOrganizationMember(
    membership: OrganizationMembership,
    user: User,
    profile: UserProfile | null,
  ) {
    return {
      organizationId: membership.organizationId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt.toISOString(),
      email: user.email,
      displayName: profile?.displayName ?? null,
    };
  }

  private toSettingsRecord(value: Organization['settings']): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }
}
