import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import { RedisService } from '../redis/redis.service';
import { SessionService } from './session.service';

jest.mock('@kolab/database', () => ({
  prisma: {
    session: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    refreshToken: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import type { AccessTokenPayload } from '@kolab/auth';
import { prisma } from '@kolab/database';

const userToken: AccessTokenPayload = {
  sub: 'user-1',
  email: 'user@kolab.test',
  role: 'USER',
  organizationId: 'org-1',
  organizationRole: 'VIEWER',
  sessionId: 'session-current',
  isSystemAdmin: false,
};

const activeSession = {
  id: 'session-current',
  userId: 'user-1',
  organizationId: 'org-1',
  refreshTokenHash: 'secret-hash',
  ipAddress: '127.0.0.1',
  userAgent: 'jest',
  expiresAt: new Date(Date.now() + 86_400_000),
  revokedAt: null,
  refreshTokens: [{ createdAt: new Date('2026-01-01T00:00:00.000Z') }],
};

describe('SessionService', () => {
  let service: SessionService;
  let redis: jest.Mocked<RedisService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    redis = {
      revokeRefreshToken: jest.fn(),
      invalidateUserSession: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    auditService = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: RedisService, useValue: redis },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(SessionService);
    jest.clearAllMocks();
  });

  describe('listActiveSessions', () => {
    it('returns active sessions without refresh token hash', async () => {
      (prisma.session.findMany as jest.Mock).mockResolvedValue([
        activeSession,
        {
          ...activeSession,
          id: 'session-other',
          refreshTokens: [{ createdAt: new Date('2026-01-02T00:00:00.000Z') }],
        },
      ]);

      const result = await service.listActiveSessions(userToken);

      expect(result.sessions).toHaveLength(2);
      expect(result.sessions[0]).not.toHaveProperty('refreshTokenHash');
      expect(result.sessions[0]?.isCurrent).toBe(true);
      expect(prisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            revokedAt: null,
            expiresAt: expect.objectContaining({ gt: expect.any(Date) }),
          }),
        }),
      );
    });

    it('excludes expired and revoked sessions via active query', async () => {
      (prisma.session.findMany as jest.Mock).mockResolvedValue([]);

      await service.listActiveSessions(userToken);

      expect(prisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            revokedAt: null,
            expiresAt: { gt: expect.any(Date) },
          },
        }),
      );
    });
  });

  describe('getCurrentSession', () => {
    it('returns the current session from JWT sessionId', async () => {
      (prisma.session.findFirst as jest.Mock).mockResolvedValue(activeSession);

      const result = await service.getCurrentSession(userToken);

      expect(result.session.id).toBe('session-current');
      expect(result.session.isCurrent).toBe(true);
    });

    it('throws when sessionId is missing from token', async () => {
      await expect(
        service.getCurrentSession({ ...userToken, sessionId: undefined }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('revokeSession', () => {
    it('revokes the users own session and linked refresh tokens', async () => {
      (prisma.session.findFirst as jest.Mock).mockResolvedValue(activeSession);
      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue([
        { tokenHash: 'token-hash-1' },
      ]);
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.session.update as jest.Mock).mockResolvedValue({});

      const result = await service.revokeSession(userToken, 'session-current');

      expect(result).toEqual({ id: 'session-current', revoked: true });
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-current' },
      });
      expect(redis.revokeRefreshToken).toHaveBeenCalledWith('token-hash-1');
      expect(redis.invalidateUserSession).toHaveBeenCalledWith('user-1');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'session.revoked',
          targetId: 'session-current',
        }),
      );
    });

    it('cannot revoke another users session', async () => {
      (prisma.session.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.revokeSession(userToken, 'session-other-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('revokeOtherSessions', () => {
    it('revokes all other active sessions except the current one', async () => {
      (prisma.session.findMany as jest.Mock).mockResolvedValue([{ id: 'session-other' }]);
      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.session.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.revokeOtherSessions(userToken);

      expect(result.revokedSessionIds).toEqual(['session-other']);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'sessions.revoked_others',
          metadata: expect.objectContaining({
            revokedSessionIds: ['session-other'],
          }),
        }),
      );
      expect(prisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            id: { not: 'session-current' },
          }),
        }),
      );
    });

    it('requires sessionId in token', async () => {
      await expect(
        service.revokeOtherSessions({ ...userToken, sessionId: undefined }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
