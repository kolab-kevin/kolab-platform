import { UploadValidationError, validateUploadMetadata } from './validation';

describe('validateUploadMetadata', () => {
  const config = { maxFileSizeBytes: 25 * 1024 * 1024 };

  it('accepts allowed mime types and positive sizes', () => {
    const result = validateUploadMetadata(
      {
        fileName: 'passport.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      },
      config,
    );

    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBe(1024);
  });

  it('rejects unsupported mime types', () => {
    expect(() =>
      validateUploadMetadata(
        {
          fileName: 'script.exe',
          mimeType: 'application/octet-stream',
          sizeBytes: 100,
        },
        config,
      ),
    ).toThrow(UploadValidationError);
  });

  it('rejects non-positive or oversized files', () => {
    expect(() =>
      validateUploadMetadata(
        {
          fileName: 'large.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 0,
        },
        config,
      ),
    ).toThrow(UploadValidationError);

    expect(() =>
      validateUploadMetadata(
        {
          fileName: 'large.pdf',
          mimeType: 'application/pdf',
          sizeBytes: config.maxFileSizeBytes + 1,
        },
        config,
      ),
    ).toThrow(UploadValidationError);
  });
});
