import { parseStorageEnv } from '@kolab/config';

import { loadStorageConfig } from './config';

describe('loadStorageConfig', () => {
  it('requires bucket and credentials', () => {
    expect(() => loadStorageConfig({})).toThrow(/STORAGE_BUCKET is required/);
    expect(() =>
      loadStorageConfig({
        STORAGE_BUCKET: 'kolab-dev',
      }),
    ).toThrow(/STORAGE_ACCESS_KEY_ID/);
  });

  it('defaults minio path-style when endpoint is configured', () => {
    const config = loadStorageConfig({
      STORAGE_PROVIDER: 'minio',
      STORAGE_BUCKET: 'kolab-dev',
      STORAGE_ACCESS_KEY_ID: 'key',
      STORAGE_SECRET_ACCESS_KEY: 'secret',
      STORAGE_ENDPOINT: 'http://localhost:9000',
    });

    expect(config.forcePathStyle).toBe(true);
  });
});

describe('parseStorageEnv', () => {
  it('applies storage defaults', () => {
    const env = parseStorageEnv({
      STORAGE_BUCKET: 'kolab-dev',
      STORAGE_ACCESS_KEY_ID: 'key',
      STORAGE_SECRET_ACCESS_KEY: 'secret',
    });

    expect(env.STORAGE_PROVIDER).toBe('s3');
    expect(env.STORAGE_MAX_FILE_SIZE_BYTES).toBe(25 * 1024 * 1024);
  });
});
