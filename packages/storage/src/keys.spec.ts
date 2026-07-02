import { createStorageKey, StorageKeyError, validateStorageKey } from './keys';

describe('storage keys', () => {
  const baseInput = {
    organizationId: 'org-1',
    creatorId: 'creator-1',
    resourceKind: 'documents' as const,
    resourceId: 'doc-1',
    versionId: 'ver-1',
    fileName: 'passport.pdf',
  };

  it('constructs organization-scoped storage keys', () => {
    expect(createStorageKey(baseInput)).toBe(
      'organizations/org-1/creators/creator-1/documents/doc-1/versions/ver-1/passport.pdf',
    );
  });

  it('supports contract resource keys', () => {
    expect(
      createStorageKey({
        ...baseInput,
        resourceKind: 'contracts',
        resourceId: 'contract-1',
        fileName: 'agreement.pdf',
      }),
    ).toBe(
      'organizations/org-1/creators/creator-1/contracts/contract-1/versions/ver-1/agreement.pdf',
    );
  });

  it('rejects path traversal in generated keys', () => {
    expect(() =>
      createStorageKey({
        ...baseInput,
        fileName: '../secret.pdf',
      }),
    ).not.toThrow();

    const key = createStorageKey({
      ...baseInput,
      fileName: '../secret.pdf',
    });

    expect(key).not.toContain('..');
  });

  it('rejects invalid organization ids', () => {
    expect(() =>
      createStorageKey({
        ...baseInput,
        organizationId: '../org',
      }),
    ).toThrow(StorageKeyError);
  });

  it('validates keys for the active organization', () => {
    const key = createStorageKey(baseInput);

    expect(() => validateStorageKey('org-1', key)).not.toThrow();
    expect(() => validateStorageKey('org-2', key)).toThrow(StorageKeyError);
    expect(() => validateStorageKey('org-1', `${key}/../other`)).toThrow(StorageKeyError);
    expect(() => validateStorageKey('org-1', 'organizations/org-1/other/path')).toThrow(
      StorageKeyError,
    );
  });
});
