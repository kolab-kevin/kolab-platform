import { coreApiEnvSchema, parseEnv } from '@kolab/config';
import { prisma } from '@kolab/database';
import type { HealthResponse } from '@kolab/types';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class HealthService {
  private readonly serviceName = 'KŌLAB Public API';
  private redis: Redis;

  constructor() {
    const env = parseEnv(coreApiEnvSchema);
    this.redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1 });
  }

  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: this.serviceName,
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    const checks: Record<string, string> = {};

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    try {
      await this.redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }

    const ready = Object.values(checks).every((v) => v === 'ok');

    return {
      status: ready ? 'ok' : 'degraded',
      service: this.serviceName,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}
