import { z } from 'zod';

export const observabilityEnvSchema = z.object({
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SENTRY_DSN: z.preprocess(
    (val: unknown) => (val === '' || val === undefined ? undefined : val),
    z.string().url().optional(),
  ),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.preprocess(
    (val: unknown) => (val === '' || val === undefined ? undefined : val),
    z.string().url().optional(),
  ),
  OTEL_SERVICE_NAME: z.string().default('kolab-api'),
});

export type ObservabilityEnv = z.infer<typeof observabilityEnvSchema>;
