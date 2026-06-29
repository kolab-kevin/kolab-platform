import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { prisma, Role as PrismaRole } from '@kolab/database';
import {
  generateRefreshToken,
  hashPassword,
  hashRefreshToken,
  parseDurationToMs,
  signAccessToken,
  verifyPassword,
} from '@kolab/auth';
import { apiEnvSchema, parseEnv } from '@kolab/config';
import type { AuthResponse, LoginInput, RegisterInput, UserProfile } from '@kolab/types';
import { RedisService } from '../redis/redis.service';

const REFRESH_COOKIE_NAME = 'kolab_refresh_token';

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

    return this.createAuthSession(this.toProfile(user));
  }

  async login(input: LoginInput): Promise<AuthResponse & { refreshToken: string }> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthSession(this.toProfile(user));
  }

  async refresh(refreshToken: string): Promise<AuthResponse & { refreshToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokenHash = hashRefreshToken(refreshToken);

    const cachedUserId = await this.redis.getRefreshTokenUser(tokenHash);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.revokeRefreshToken(tokenHash, stored.userId);
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (cachedUserId && cachedUserId !== stored.userId) {
      await this.revokeAllUserRefreshTokens(stored.userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    await this.revokeRefreshToken(tokenHash, stored.userId);

    return this.createAuthSession(this.toProfile(stored.user));
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
    profile: UserProfile,
  ): Promise<AuthResponse & { refreshToken: string }> {
    const { token: accessToken, expiresIn } = signAccessToken(
      { sub: profile.id, email: profile.email, role: profile.role },
      { secret: this.env.JWT_SECRET, accessExpiry: this.env.JWT_ACCESS_EXPIRY },
    );

    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + parseDurationToMs(this.env.JWT_REFRESH_EXPIRY));
    const refreshTtlSeconds = Math.floor(parseDurationToMs(this.env.JWT_REFRESH_EXPIRY) / 1000);

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: profile.id,
        expiresAt: refreshExpiresAt,
      },
    });

    await this.redis.trackRefreshToken(tokenHash, profile.id, refreshTtlSeconds);
    await this.redis.cacheUserSession(profile.id, profile, refreshTtlSeconds);

    return {
      user: profile,
      accessToken,
      expiresIn,
      refreshToken,
    };
  }

  private async revokeRefreshToken(tokenHash: string, userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
    await this.redis.revokeRefreshToken(tokenHash);
    await this.redis.invalidateUserSession(userId);
  }

  private async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    const tokens = await prisma.refreshToken.findMany({ where: { userId }, select: { tokenHash: true } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await Promise.all(tokens.map((t) => this.redis.revokeRefreshToken(t.tokenHash)));
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
