const FORBIDDEN_METADATA_KEY_PATTERN =
  /(chat|transcript|message|audio|video|payload|content|body|text|recording)/i;

export const RECENT_GIFTER_SESSION_STATS_LIMIT = 10;

export function sanitizeAggregateMetadata(metadata: unknown): Record<string, unknown> {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    return {};
  }

  return sanitizeRecord(metadata as Record<string, unknown>);
}

function sanitizeRecord(record: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (FORBIDDEN_METADATA_KEY_PATTERN.test(key.replace(/[_-]/g, ''))) {
      continue;
    }

    const sanitizedValue = sanitizeValue(value);
    if (!shouldIncludeSanitizedValue(sanitizedValue)) {
      continue;
    }

    sanitized[key] = sanitizedValue;
  }

  return sanitized;
}

function shouldIncludeSanitizedValue(value: unknown): boolean {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }

  return true;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length > 512 || /^data:(audio|video)\//i.test(value)) {
      return '[redacted]';
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (typeof value === 'object' && value !== null) {
    return sanitizeRecord(value as Record<string, unknown>);
  }

  return value;
}
