import { coreApiEnvSchema, parseEnv } from '@kolab/config';
import type { UserProfile } from '@kolab/types';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

const SESSION_PREFIX = 'session:';
const REFRESH_PREFIX = 'refresh:';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  onModuleInit() {
    const env = parseEnv(coreApiEnvSchema);
    this.client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  async cacheUserSession(userId: string, profile: UserProfile, ttlSeconds: number): Promise<void> {
    await this.client.setex(`${SESSION_PREFIX}${userId}`, ttlSeconds, JSON.stringify(profile));
  }

  async getCachedUserSession(userId: string): Promise<UserProfile | null> {
    const data = await this.client.get(`${SESSION_PREFIX}${userId}`);
    if (!data) return null;
    return JSON.parse(data) as UserProfile;
  }

  async invalidateUserSession(userId: string): Promise<void> {
    await this.client.del(`${SESSION_PREFIX}${userId}`);
  }

  async trackRefreshToken(tokenHash: string, userId: string, ttlSeconds: number): Promise<void> {
    await this.client.setex(`${REFRESH_PREFIX}${tokenHash}`, ttlSeconds, userId);
  }

  async getRefreshTokenUser(tokenHash: string): Promise<string | null> {
    return this.client.get(`${REFRESH_PREFIX}${tokenHash}`);
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.client.del(`${REFRESH_PREFIX}${tokenHash}`);
  }
}
