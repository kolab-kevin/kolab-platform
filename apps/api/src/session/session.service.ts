import type { AccessTokenPayload } from '@kolab/auth';
import { prisma, type Session } from '@kolab/database';
import type {
  CurrentSessionResponse,
  ListSessionsResponse,
  RevokeOtherSessionsResponse,
  RevokeSessionResponse,
  SessionResponse,
} from '@kolab/types';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { RedisService } from '../redis/redis.service';

type SessionWithCreatedAt = Session & {
  refreshTokens: { createdAt: Date }[];
};

@Injectable()
export class SessionService {
  constructor(private readonly redis: RedisService) {}

  async listActiveSessions(user: AccessTokenPayload): Promise<ListSessionsResponse> {
    const sessions = await prisma.session.findMany({
      where: this.activeSessionWhere(user.sub),
      include: {
        refreshTokens: {
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
      orderBy: { expiresAt: 'desc' },
    });

    return {
      sessions: sessions.map((session) => this.toSessionResponse(session, user.sessionId)),
    };
  }

  async getCurrentSession(user: AccessTokenPayload): Promise<CurrentSessionResponse> {
    const sessionId = this.requireSessionId(user);

    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: user.sub },
      include: {
        refreshTokens: {
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Current session not found');
    }

    return {
      session: this.toSessionResponse(session, user.sessionId, true),
    };
  }

  async revokeSession(user: AccessTokenPayload, sessionId: string): Promise<RevokeSessionResponse> {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: user.sub },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (!session.revokedAt) {
      await this.revokeSessionTokens(session.id);
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }

    if (user.sessionId === session.id) {
      await this.redis.invalidateUserSession(user.sub);
    }

    return { id: session.id, revoked: true };
  }

  async revokeOtherSessions(user: AccessTokenPayload): Promise<RevokeOtherSessionsResponse> {
    const currentSessionId = this.requireSessionId(user);

    const sessions = await prisma.session.findMany({
      where: {
        ...this.activeSessionWhere(user.sub),
        id: { not: currentSessionId },
      },
      select: { id: true },
    });

    if (sessions.length === 0) {
      return { revokedSessionIds: [] };
    }

    const sessionIds = sessions.map((session) => session.id);

    for (const sessionId of sessionIds) {
      await this.revokeSessionTokens(sessionId);
    }

    await prisma.session.updateMany({
      where: { id: { in: sessionIds }, userId: user.sub },
      data: { revokedAt: new Date() },
    });

    return { revokedSessionIds: sessionIds };
  }

  private requireSessionId(user: AccessTokenPayload): string {
    if (!user.sessionId) {
      throw new BadRequestException('Current session id missing from token');
    }

    return user.sessionId;
  }

  private activeSessionWhere(userId: string) {
    return {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    };
  }

  private async revokeSessionTokens(sessionId: string): Promise<void> {
    const tokens = await prisma.refreshToken.findMany({
      where: { sessionId },
      select: { tokenHash: true },
    });

    if (tokens.length === 0) {
      return;
    }

    await prisma.refreshToken.deleteMany({ where: { sessionId } });
    await Promise.all(tokens.map((token) => this.redis.revokeRefreshToken(token.tokenHash)));
  }

  private toSessionResponse(
    session: SessionWithCreatedAt,
    currentSessionId?: string,
    forceCurrent = false,
  ): SessionResponse {
    const createdAt = session.refreshTokens[0]?.createdAt;

    return {
      id: session.id,
      organizationId: session.organizationId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      expiresAt: session.expiresAt.toISOString(),
      revokedAt: session.revokedAt?.toISOString() ?? null,
      ...(createdAt ? { createdAt: createdAt.toISOString() } : {}),
      ...(currentSessionId ? { isCurrent: forceCurrent || session.id === currentSessionId } : {}),
    };
  }
}
