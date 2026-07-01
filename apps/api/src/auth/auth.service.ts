import {
  generateRefreshToken,
  hashPassword,
  hashRefreshToken,
  parseDurationToMs,
  signAccessToken,
  verifyPassword,
} from '@kolab/auth';
import { apiEnvSchema, parseEnv } from '@kolab/config';
import {
  MembershipStatus,
  type OrganizationRole,
  prisma,
  Role as PrismaRole,
} from '@kolab/database';
import type {
  AuthResponse,
  LoginWithOrganizationInput,
  RegisterInput,
  UserProfile,
} from '@kolab/types';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { RedisService } from '../redis/redis.service';

const REFRESH_COOKIE_NAME = 'kolab_refresh_token';

type AuthUserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: PrismaRole;
  platforms: string[];
  isSystemAdmin: boolean;
  createdAt: Date;
};

type CreateAuthSessionOptions = {
  organizationId?: string;
  existingSessionId?: string;
};

@Injectable()
export class AuthService {
  private readonly env = parseEnv(apiEnvSchema);

  constructor(private readonly redis: RedisService) {}

  getRefreshCookieName(): string {
    return REFRESH_COOKIE_NAME;
  }

  async register(input: RegisterInput): Promise<AuthResponse & { refreshToken: string }> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: PrismaRole.USER,
      },
    });

    return this.createAuthSession(user);
  }

  async login(input: LoginWithOrganizationInput): Promise<AuthResponse & { refreshToken: string }> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthSession(user, { organizationId: input.organizationId });
  }

  async refresh(refreshToken: string): Promise<AuthResponse & { refreshToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokenHash = hashRefreshToken(refreshToken);

    const cachedUserId = await this.redis.getRefreshTokenUser(tokenHash);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true, session: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.revokeRefreshToken(tokenHash, stored.userId);
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (stored.session?.revokedAt) {
      await this.revokeRefreshToken(tokenHash, stored.userId);
      throw new UnauthorizedException('Session revoked');
    }

    if (stored.session && stored.session.expiresAt < new Date()) {
      await this.revokeRefreshToken(tokenHash, stored.userId);
      throw new UnauthorizedException('Session expired');
    }

    if (cachedUserId && cachedUserId !== stored.userId) {
      await this.revokeAllUserRefreshTokens(stored.userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    await this.deleteRefreshTokenRecord(tokenHash);

    return this.createAuthSession(stored.user, {
      existingSessionId: stored.sessionId ?? undefined,
      organizationId: stored.session?.organizationId ?? undefined,
    });
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      await this.revokeRefreshToken(tokenHash, userId);
    } else {
      await this.revokeAllUserRefreshTokens(userId);
    }

    await this.redis.invalidateUserSession(userId);
  }

  async me(userId: string): Promise<UserProfile> {
    const cached = await this.redis.getCachedUserSession(userId);
    if (cached) return cached;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const profile = this.toProfile(user);
    const sessionTtl = Math.floor(parseDurationToMs(this.env.JWT_REFRESH_EXPIRY) / 1000);
    await this.redis.cacheUserSession(userId, profile, sessionTtl);

    return profile;
  }

  private async createAuthSession(
    user: AuthUserRecord,
    options: CreateAuthSessionOptions = {},
  ): Promise<AuthResponse & { refreshToken: string }> {
    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + parseDurationToMs(this.env.JWT_REFRESH_EXPIRY));
    const refreshTtlSeconds = Math.floor(parseDurationToMs(this.env.JWT_REFRESH_EXPIRY) / 1000);

    const activeMembership = await this.resolveActiveMembership(user.id, options.organizationId);
    const organizationId = options.existingSessionId
      ? (options.organizationId ?? activeMembership?.organizationId)
      : activeMembership?.organizationId;

    let sessionId = options.existingSessionId;

    if (sessionId) {
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          refreshTokenHash: tokenHash,
          expiresAt: refreshExpiresAt,
          organizationId: organizationId ?? null,
        },
      });
    } else {
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          organizationId: organizationId ?? null,
          refreshTokenHash: tokenHash,
          expiresAt: refreshExpiresAt,
        },
      });
      sessionId = session.id;
    }

    const organizationRole = organizationId
      ? await this.loadOrganizationRole(user.id, organizationId)
      : undefined;

    const { token: accessToken, expiresIn } = signAccessToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        isSystemAdmin: user.isSystemAdmin,
        organizationId,
        organizationRole,
        sessionId,
      },
      { secret: this.env.JWT_SECRET, accessExpiry: this.env.JWT_ACCESS_EXPIRY },
    );

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        sessionId,
        expiresAt: refreshExpiresAt,
      },
    });

    const profile = this.toProfile(user);
    await this.redis.trackRefreshToken(tokenHash, user.id, refreshTtlSeconds);
    await this.redis.cacheUserSession(user.id, profile, refreshTtlSeconds);

    return {
      user: profile,
      accessToken,
      expiresIn,
      refreshToken,
    };
  }

  private async resolveActiveMembership(
    userId: string,
    organizationId?: string,
  ): Promise<{ organizationId: string; role: OrganizationRole } | null> {
    const memberships = await prisma.organizationMembership.findMany({
      where: { userId, status: MembershipStatus.ACTIVE },
      orderBy: { joinedAt: 'asc' },
    });

    if (memberships.length === 0) {
      return null;
    }

    if (organizationId) {
      const selected = memberships.find(
        (membership) => membership.organizationId === organizationId,
      );
      if (!selected) {
        throw new ForbiddenException('No active membership in selected organization');
      }
      return {
        organizationId: selected.organizationId,
        role: selected.role,
      };
    }

    return {
      organizationId: memberships[0].organizationId,
      role: memberships[0].role,
    };
  }

  private async loadOrganizationRole(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationRole | undefined> {
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    return membership?.status === MembershipStatus.ACTIVE ? membership.role : undefined;
  }

  private async deleteRefreshTokenRecord(
    tokenHash: string,
  ): Promise<{ sessionId: string | null; userId: string } | null> {
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { sessionId: true, userId: true },
    });

    if (!stored) {
      return null;
    }

    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
    await this.redis.revokeRefreshToken(tokenHash);

    return stored;
  }

  private async revokeRefreshToken(tokenHash: string, userId: string): Promise<void> {
    const deleted = await this.deleteRefreshTokenRecord(tokenHash);
    await this.redis.invalidateUserSession(userId);

    if (deleted?.sessionId) {
      await prisma.session.update({
        where: { id: deleted.sessionId },
        data: { revokedAt: new Date() },
      });
    }
  }

  private async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    const tokens = await prisma.refreshToken.findMany({
      where: { userId },
      select: { tokenHash: true, sessionId: true },
    });

    await prisma.refreshToken.deleteMany({ where: { userId } });
    await Promise.all(tokens.map((token) => this.redis.revokeRefreshToken(token.tokenHash)));

    const sessionIds = [
      ...new Set(tokens.map((token) => token.sessionId).filter((id): id is string => Boolean(id))),
    ];

    if (sessionIds.length > 0) {
      await prisma.session.updateMany({
        where: { id: { in: sessionIds }, userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.redis.invalidateUserSession(userId);
  }

  private toProfile(user: {
    id: string;
    email: string;
    role: PrismaRole;
    platforms: string[];
    createdAt: Date;
  }): UserProfile {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      platforms: user.platforms as UserProfile['platforms'],
      createdAt: user.createdAt.toISOString(),
    };
  }
}

export { REFRESH_COOKIE_NAME };
