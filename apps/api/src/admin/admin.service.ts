import type { AccessTokenPayload } from '@kolab/auth';
import {
  MembershipStatus,
  type Organization,
  type OrganizationMembership,
  prisma,
  type Session,
  type User,
  type UserProfile,
} from '@kolab/database';
import type {
  AdminDashboardResponse,
  AdminOrganizationsQuery,
  AdminUserDetailResponse,
  AdminUsersQuery,
  ListAdminOrganizationsResponse,
  ListAdminUsersResponse,
  UpdateAdminUserInput,
  UpdateAdminUserResponse,
  UserProfileFields,
} from '@kolab/types';
import { Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';

const DEFAULT_PROFILE_FIELDS: UserProfileFields = {
  displayName: null,
  avatarUrl: null,
  bio: null,
  language: 'en',
  timezone: 'UTC',
  country: null,
};

type UserWithCounts = User & {
  _count: {
    memberships: number;
    sessions: number;
  };
};

@Injectable()
export class AdminService {
  constructor(private readonly auditService: AuditService) {}

  async listUsers(query: AdminUsersQuery): Promise<ListAdminUsersResponse> {
    const where = this.buildUsersWhere(query);
    const take = query.limit + 1;

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
      include: {
        profile: {
          select: { displayName: true },
        },
        _count: {
          select: {
            memberships: {
              where: { status: MembershipStatus.ACTIVE },
            },
            sessions: {
              where: this.activeSessionWhere(),
            },
          },
        },
      },
    });

    const hasMore = users.length > query.limit;
    const items = hasMore ? users.slice(0, query.limit) : users;

    return {
      items: items.map((user) => this.toAdminUserListItem(user)),
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
    };
  }

  async getUser(userId: string): Promise<AdminUserDetailResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        memberships: {
          include: { organization: true },
          orderBy: { joinedAt: 'asc' },
        },
        sessions: {
          where: this.activeSessionWhere(),
          orderBy: { expiresAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: this.toUserAccountInfo(user),
      profile: this.toProfileFields(user.profile),
      memberships: user.memberships.map((membership) => this.toAdminUserMembership(membership)),
      sessions: user.sessions.map((session) => this.toSessionResponse(session)),
    };
  }

  async updateUser(
    actor: AccessTokenPayload,
    userId: string,
    input: UpdateAdminUserInput,
  ): Promise<UpdateAdminUserResponse> {
    const existing = await prisma.user.findUnique({ where: { id: userId } });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.isSystemAdmin !== undefined ? { isSystemAdmin: input.isSystemAdmin } : {}),
      },
    });

    await this.auditService.record({
      organizationId: null,
      actorUserId: actor.sub,
      action: AUDIT_ACTION.ADMIN_USER_UPDATED,
      targetType: AUDIT_TARGET_TYPE.USER,
      targetId: userId,
      metadata: {
        previousRole: existing.role,
        newRole: updated.role,
        previousIsSystemAdmin: existing.isSystemAdmin,
        newIsSystemAdmin: updated.isSystemAdmin,
        changedFields: [
          ...(input.role !== undefined ? ['role'] : []),
          ...(input.isSystemAdmin !== undefined ? ['isSystemAdmin'] : []),
        ],
      },
    });

    return {
      user: this.toUserAccountInfo(updated),
    };
  }

  async listOrganizations(query: AdminOrganizationsQuery): Promise<ListAdminOrganizationsResponse> {
    const take = query.limit + 1;

    const organizations = await prisma.organization.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
      include: {
        _count: {
          select: {
            memberships: {
              where: { status: MembershipStatus.ACTIVE },
            },
          },
        },
      },
    });

    const hasMore = organizations.length > query.limit;
    const items = hasMore ? organizations.slice(0, query.limit) : organizations;

    return {
      items: items.map((organization) => this.toAdminOrganizationListItem(organization)),
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
    };
  }

  async getDashboard(): Promise<AdminDashboardResponse> {
    const now = new Date();

    const [
      totalUsers,
      totalOrganizations,
      activeOrganizations,
      pendingInvitations,
      activeSessions,
      systemAdmins,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.organization.count({ where: { status: 'ACTIVE' } }),
      prisma.invitation.count({
        where: {
          acceptedAt: null,
          expiresAt: { gt: now },
        },
      }),
      prisma.session.count({ where: this.activeSessionWhere(now) }),
      prisma.user.count({ where: { isSystemAdmin: true } }),
    ]);

    return {
      totalUsers,
      totalOrganizations,
      activeOrganizations,
      pendingInvitations,
      activeSessions,
      systemAdmins,
    };
  }

  private buildUsersWhere(query: AdminUsersQuery) {
    const where: Record<string, unknown> = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.organizationId) {
      where.memberships = {
        some: {
          organizationId: query.organizationId,
        },
      };
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        {
          profile: {
            displayName: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    return where;
  }

  private activeSessionWhere(now = new Date()) {
    return {
      revokedAt: null,
      expiresAt: { gt: now },
    };
  }

  private toAdminUserListItem(user: UserWithCounts) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isSystemAdmin: user.isSystemAdmin,
      createdAt: user.createdAt.toISOString(),
      organizationCount: user._count.memberships,
      activeSessionCount: user._count.sessions,
    };
  }

  private toUserAccountInfo(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isSystemAdmin: user.isSystemAdmin,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private toProfileFields(profile: UserProfile | null): UserProfileFields {
    if (!profile) {
      return { ...DEFAULT_PROFILE_FIELDS };
    }

    return {
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      language: profile.language,
      timezone: profile.timezone,
      country: profile.country,
    };
  }

  private toAdminUserMembership(
    membership: OrganizationMembership & { organization: Organization },
  ) {
    return {
      organizationId: membership.organizationId,
      organizationName: membership.organization.name,
      organizationSlug: membership.organization.slug,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt.toISOString(),
    };
  }

  private toSessionResponse(session: Session) {
    return {
      id: session.id,
      organizationId: session.organizationId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      expiresAt: session.expiresAt.toISOString(),
      revokedAt: session.revokedAt?.toISOString() ?? null,
    };
  }

  private toAdminOrganizationListItem(
    organization: Organization & { _count: { memberships: number } },
  ) {
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      type: organization.type,
      status: organization.status,
      memberCount: organization._count.memberships,
      createdAt: organization.createdAt.toISOString(),
    };
  }
}
