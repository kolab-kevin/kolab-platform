jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('./client', () => ({
  createS3Client: jest.fn().mockReturnValue({}),
}));

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { StorageConfig } from './config';
import { getPresignedDownloadUrl, getPresignedUploadUrl } from './presign';

const config: StorageConfig = {
  provider: 'minio',
  bucket: 'kolab-dev',
  region: 'us-east-1',
  endpoint: 'http://localhost:9000',
  accessKeyId: 'minioadmin',
  secretAccessKey: 'minioadmin',
  forcePathStyle: true,
  maxFileSizeBytes: 25 * 1024 * 1024,
};

describe('presign helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSignedUrl as jest.Mock).mockResolvedValue('https://example.com/presigned');
  });

  it('returns short-lived upload URLs with required headers', async () => {
    const result = await getPresignedUploadUrl({
      storageKey: 'organizations/org-1/creators/creator-1/documents/doc-1/versions/ver-1/file.pdf',
      mimeType: 'application/pdf',
      config,
      expiresInSeconds: 900,
    });

    expect(result.url).toBe('https://example.com/presigned');
    expect(result.requiredHeaders['Content-Type']).toBe('application/pdf');
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'kolab-dev',
          ContentType: 'application/pdf',
        }),
      }),
      { expiresIn: 900 },
    );
  });

  it('returns short-lived download URLs', async () => {
    const result = await getPresignedDownloadUrl({
      storageKey: 'organizations/org-1/creators/creator-1/documents/doc-1/versions/ver-1/file.pdf',
      config,
      expiresInSeconds: 300,
    });

    expect(result.url).toBe('https://example.com/presigned');
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'kolab-dev',
        }),
      }),
      { expiresIn: 300 },
    );
  });
});
