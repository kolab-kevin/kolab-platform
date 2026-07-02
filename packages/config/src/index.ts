import { z } from 'zod';

import { observabilityEnvSchema } from './observability';

export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
});

export const redisEnvSchema = z.object({
  REDIS_URL: z.string().url().startsWith('redis://'),
});

export const jwtEnvSchema = z.object({
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
});

export const coreApiEnvSchema = baseEnvSchema
  .merge(databaseEnvSchema)
  .merge(redisEnvSchema)
  .extend({
    PORT: z.coerce.number().default(4000),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
  });

export const apiEnvSchema = coreApiEnvSchema.merge(jwtEnvSchema).merge(observabilityEnvSchema);

export type CoreApiEnv = z.infer<typeof coreApiEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  env: NodeJS.ProcessEnv = process.env,
): z.infer<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    throw new Error(`Invalid environment variables: ${JSON.stringify(formatted)}`);
  }
  return result.data;
}

export * from './observability';
export * from './services';
export * from './storage';
