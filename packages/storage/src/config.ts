import {
  DEFAULT_STORAGE_MAX_FILE_SIZE_BYTES,
  parseStorageEnv,
  type StorageEnv,
} from '@kolab/config';

export type StorageConfig = {
  provider: StorageEnv['STORAGE_PROVIDER'];
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  publicBaseUrl?: string;
  maxFileSizeBytes: number;
};

export function loadStorageConfig(env: NodeJS.ProcessEnv = process.env): StorageConfig {
  const parsed = parseStorageEnv(env);

  if (!parsed.STORAGE_BUCKET) {
    throw new Error('STORAGE_BUCKET is required for object storage operations');
  }

  if (!parsed.STORAGE_ACCESS_KEY_ID || !parsed.STORAGE_SECRET_ACCESS_KEY) {
    throw new Error(
      'STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY are required for object storage operations',
    );
  }

  const forcePathStyle =
    parsed.STORAGE_FORCE_PATH_STYLE ??
    (parsed.STORAGE_PROVIDER === 'minio' || Boolean(parsed.STORAGE_ENDPOINT));

  return {
    provider: parsed.STORAGE_PROVIDER,
    bucket: parsed.STORAGE_BUCKET,
    region: parsed.STORAGE_REGION,
    endpoint: parsed.STORAGE_ENDPOINT,
    accessKeyId: parsed.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: parsed.STORAGE_SECRET_ACCESS_KEY,
    forcePathStyle,
    publicBaseUrl: parsed.STORAGE_PUBLIC_BASE_URL,
    maxFileSizeBytes: parsed.STORAGE_MAX_FILE_SIZE_BYTES ?? DEFAULT_STORAGE_MAX_FILE_SIZE_BYTES,
  };
}
