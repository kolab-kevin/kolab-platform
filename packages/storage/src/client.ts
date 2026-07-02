import { S3Client } from '@aws-sdk/client-s3';

import type { StorageConfig } from './config';

let cachedClient: S3Client | undefined;
let cachedSignature: string | undefined;

function buildClientSignature(config: StorageConfig): string {
  return [
    config.provider,
    config.region,
    config.endpoint ?? '',
    String(config.forcePathStyle),
    config.accessKeyId,
  ].join('|');
}

export function createS3Client(config: StorageConfig): S3Client {
  const signature = buildClientSignature(config);

  if (cachedClient && cachedSignature === signature) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  cachedSignature = signature;

  return cachedClient;
}

export function resetS3ClientCache(): void {
  cachedClient = undefined;
  cachedSignature = undefined;
}
