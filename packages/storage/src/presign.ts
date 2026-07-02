import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { createS3Client } from './client';
import type { StorageConfig } from './config';
import { DEFAULT_DOWNLOAD_URL_TTL_SECONDS, DEFAULT_UPLOAD_URL_TTL_SECONDS } from './constants';

export type PresignedUploadUrlResult = {
  url: string;
  expiresAt: string;
  requiredHeaders: {
    'Content-Type': string;
  };
};

export type PresignedDownloadUrlResult = {
  url: string;
  expiresAt: string;
};

export async function getPresignedUploadUrl(input: {
  storageKey: string;
  mimeType: string;
  config: StorageConfig;
  expiresInSeconds?: number;
}): Promise<PresignedUploadUrlResult> {
  const expiresInSeconds = input.expiresInSeconds ?? DEFAULT_UPLOAD_URL_TTL_SECONDS;
  const client = createS3Client(input.config);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const command = new PutObjectCommand({
    Bucket: input.config.bucket,
    Key: input.storageKey,
    ContentType: input.mimeType,
  });

  const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return {
    url,
    expiresAt: expiresAt.toISOString(),
    requiredHeaders: {
      'Content-Type': input.mimeType,
    },
  };
}

export async function getPresignedDownloadUrl(input: {
  storageKey: string;
  config: StorageConfig;
  expiresInSeconds?: number;
}): Promise<PresignedDownloadUrlResult> {
  const expiresInSeconds = input.expiresInSeconds ?? DEFAULT_DOWNLOAD_URL_TTL_SECONDS;
  const client = createS3Client(input.config);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const command = new GetObjectCommand({
    Bucket: input.config.bucket,
    Key: input.storageKey,
  });

  const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return {
    url,
    expiresAt: expiresAt.toISOString(),
  };
}
