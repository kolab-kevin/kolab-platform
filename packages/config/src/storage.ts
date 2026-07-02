import { z } from 'zod';

export const DEFAULT_STORAGE_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const storageEnvSchema = z.object({
  STORAGE_PROVIDER: z.enum(['s3', 'minio']).default('s3'),
  STORAGE_BUCKET: z.string().trim().min(1).optional(),
  STORAGE_REGION: z.string().trim().min(1).default('us-east-1'),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().trim().min(1).optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().trim().min(1).optional(),
  STORAGE_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  STORAGE_PUBLIC_BASE_URL: z.string().url().optional(),
  STORAGE_MAX_FILE_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_STORAGE_MAX_FILE_SIZE_BYTES),
});

export type StorageEnv = z.infer<typeof storageEnvSchema>;

export function parseStorageEnv(env: NodeJS.ProcessEnv = process.env): StorageEnv {
  const result = storageEnvSchema.safeParse(env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    throw new Error(`Invalid storage environment variables: ${JSON.stringify(formatted)}`);
  }

  return result.data;
}
