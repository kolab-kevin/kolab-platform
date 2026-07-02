export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toRecord(value: unknown): Record<string, unknown> {
  if (isPlainObject(value)) {
    return value;
  }

  return {};
}
