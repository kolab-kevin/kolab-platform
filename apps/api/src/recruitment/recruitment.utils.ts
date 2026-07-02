export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toRecord(value: unknown): Record<string, unknown> {
  if (isPlainObject(value)) {
    return value;
  }

  return {};
}

export function isLeadSoftDeleted(metadata: unknown): boolean {
  return toRecord(metadata).deleted === true;
}

export function buildSoftDeleteMetadata(
  existingMetadata: unknown,
  deletedByUserId: string,
): Record<string, unknown> {
  return {
    ...toRecord(existingMetadata),
    deleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: deletedByUserId,
  };
}

export function activeLeadMetadataFilter() {
  return {
    NOT: {
      metadata: {
        path: ['deleted'],
        equals: true,
      },
    },
  };
}
