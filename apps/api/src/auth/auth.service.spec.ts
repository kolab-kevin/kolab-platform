import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { RedisService } from '../redis/redis.service';
import { AuthService } from './auth.service';

const mockVerifyPassword = jest.fn();
const mockSignAccessToken = jest.fn();
const mockGenerateRefreshToken = jest.fn();
const mockHashRefreshToken = jest.fn();

jest.mock('@kolab/auth', () => ({
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
  signAccessToken: (...args: unknown[]) => mockSignAccessToken(...args),
  generateRefreshToken: (...args: unknown[]) => mockGenerateRefreshToken(...args),
  hashRefreshToken: (...args: unknown[]) => mockHashRefreshToken(...args),
  parseDurationToMs: () => 604800000,
}));

jest.mock('@kolab/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    session: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    organizationMembership: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
  Role: { USER: 'USER', ADMIN: 'ADMIN', SUPER_ADMIN: 'SUPER_ADMIN' },
  MembershipStatus: { ACTIVE: 'ACTIVE' },
}));

jest.mock('@kolab/config', () => ({
  apiEnvSchema: {},
  parseEnv: () => ({
    JWT_SECRET: 'test-secret-key-minimum-32-characters-long',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    NODE_ENV: 'test',
  }),
}));

import { prisma } from '@kolab/database';

const baseUser = {
  id: 'user-1',
  email: 'user@example.com',
  passwordHash: 'hash',
  role: 'USER',
  platforms: [],
  isSystemAdmin: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const membership = {
  organizationId: 'org-1',
  userId: 'user-1',
  role: 'VIEWER',
  status: 'ACTIVE',
  invitedBy: null,
  joinedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('AuthService', () => {
  let service: AuthService;
  let redis: jest.Mocked<RedisService>;

  beforeEach(async () => {
    redis = {
      cacheUserSession: jest.fn(),
      getCachedUserSession: jest.fn(),
      invalidateUserSession: jest.fn(),
      trackRefreshToken: jest.fn(),
      getRefreshTokenUser: jest.fn(),
      revokeRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: RedisService, useValue: redis }],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();

    mockSignAccessToken.mockReturnValue({ token: 'access', expiresIn: 900 });
    mockGenerateRefreshToken.mockReturnValue('refresh-plain');
    mockHashRefreshToken.mockReturnValue('refresh-hash');
    (prisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-1' });
    (prisma.session.update as jest.Mock).mockResolvedValue({
      id: 'session-1',
      organizationId: 'org-1',
    });
    (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});
    (prisma.organizationMembership.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(null);
  });

  describe('login', () => {
    it('throws UnauthorizedException for unknown email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@example.com', password: 'Password1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for invalid password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(baseUser);
      mockVerifyPassword.mockResolvedValue(false);

      await expect(
        service.login({ email: 'user@example.com', password: 'WrongPass1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns auth response and creates a session for valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(baseUser);
      mockVerifyPassword.mockResolvedValue(true);
      (prisma.organizationMembership.findMany as jest.Mock).mockResolvedValue([membership]);
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(membership);

      const result = await service.login({ email: 'user@example.com', password: 'Password1' });

      expect(result.accessToken).toBe('access');
      expect(result.user.email).toBe('user@example.com');
      expect(prisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            organizationId: 'org-1',
            refreshTokenHash: 'refresh-hash',
          }),
        }),
      );
      expect(prisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            sessionId: 'session-1',
            tokenHash: 'refresh-hash',
          }),
        }),
      );
      expect(mockSignAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-1',
          organizationId: 'org-1',
          organizationRole: 'VIEWER',
          sessionId: 'session-1',
          isSystemAdmin: false,
        }),
        expect.any(Object),
      );
      expect(redis.trackRefreshToken).toHaveBeenCalled();
    });

    it('selects requested organization when user has multiple memberships', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(baseUser);
      mockVerifyPassword.mockResolvedValue(true);
      (prisma.organizationMembership.findMany as jest.Mock).mockResolvedValue([
        membership,
        {
          ...membership,
          organizationId: 'org-2',
          role: 'ORG_ADMIN',
        },
      ]);
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
        ...membership,
        organizationId: 'org-2',
        role: 'ORG_ADMIN',
      });

      await service.login({
        email: 'user@example.com',
        password: 'Password1',
        organizationId: 'org-2',
      });

      expect(mockSignAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-2',
          organizationRole: 'ORG_ADMIN',
        }),
        expect.any(Object),
      );
    });

    it('throws ForbiddenException when organizationId is not a membership', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(baseUser);
      mockVerifyPassword.mockResolvedValue(true);
      (prisma.organizationMembership.findMany as jest.Mock).mockResolvedValue([membership]);

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'Password1',
          organizationId: 'missing-org',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('includes isSystemAdmin in JWT claims for platform admins', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...baseUser,
        role: 'SUPER_ADMIN',
        isSystemAdmin: true,
      });
      mockVerifyPassword.mockResolvedValue(true);
      (prisma.organizationMembership.findMany as jest.Mock).mockResolvedValue([
        { ...membership, role: 'ORG_OWNER' },
      ]);
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue({
        ...membership,
        role: 'ORG_OWNER',
      });

      await service.login({ email: 'user@example.com', password: 'Password1' });

      expect(mockSignAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          isSystemAdmin: true,
          organizationRole: 'ORG_OWNER',
        }),
        expect.any(Object),
      );
    });
  });

  describe('refresh', () => {
    it('rotates refresh token and reuses session context', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        tokenHash: 'refresh-hash',
        userId: 'user-1',
        sessionId: 'session-1',
        expiresAt: new Date(Date.now() + 60_000),
        user: baseUser,
        session: {
          id: 'session-1',
          organizationId: 'org-1',
          expiresAt: new Date(Date.now() + 60_000),
          revokedAt: null,
        },
      });
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(membership);

      const result = await service.refresh('refresh-plain');

      expect(result.accessToken).toBe('access');
      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'session-1' } }),
      );
      expect(prisma.session.create).not.toHaveBeenCalled();
      expect(mockSignAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          organizationId: 'org-1',
        }),
        expect.any(Object),
      );
    });

    it('creates a session when refreshing a legacy refresh token without sessionId', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        tokenHash: 'refresh-hash',
        userId: 'user-1',
        sessionId: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: baseUser,
        session: null,
      });
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.organizationMembership.findMany as jest.Mock).mockResolvedValue([membership]);
      (prisma.organizationMembership.findUnique as jest.Mock).mockResolvedValue(membership);

      await service.refresh('refresh-plain');

      expect(prisma.session.create).toHaveBeenCalled();
      expect(mockSignAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: 'session-1' }),
        expect.any(Object),
      );
    });

    it('throws when refresh token is missing', async () => {
      await expect(service.refresh('')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revokes refresh token and session', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        sessionId: 'session-1',
        userId: 'user-1',
      });
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.session.update as jest.Mock).mockResolvedValue({});

      await service.logout('user-1', 'refresh-plain');

      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-1' },
          data: { revokedAt: expect.any(Date) },
        }),
      );
      expect(redis.invalidateUserSession).toHaveBeenCalledWith('user-1');
    });
  });

  describe('me', () => {
    it('returns cached profile for protected endpoint usage', async () => {
      redis.getCachedUserSession.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        role: 'USER',
        platforms: [],
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      const profile = await service.me('user-1');

      expect(profile.email).toBe('user@example.com');
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });
});
