import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RedisService } from '../redis/redis.service';

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
  },
  Role: { USER: 'USER' },
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
  });

  describe('login', () => {
    it('throws UnauthorizedException for unknown email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@example.com', password: 'Password1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for invalid password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: 'hash',
        role: 'USER',
        platforms: [],
        createdAt: new Date(),
      });
      mockVerifyPassword.mockResolvedValue(false);

      await expect(
        service.login({ email: 'user@example.com', password: 'WrongPass1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns auth response for valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: 'hash',
        role: 'USER',
        platforms: [],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      mockVerifyPassword.mockResolvedValue(true);
      mockSignAccessToken.mockReturnValue({ token: 'access', expiresIn: 900 });
      mockGenerateRefreshToken.mockReturnValue('refresh-plain');
      mockHashRefreshToken.mockReturnValue('refresh-hash');
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await service.login({ email: 'user@example.com', password: 'Password1' });

      expect(result.accessToken).toBe('access');
      expect(result.user.email).toBe('user@example.com');
      expect(redis.trackRefreshToken).toHaveBeenCalled();
    });
  });
});
