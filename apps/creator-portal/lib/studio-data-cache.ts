type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

export const DEFAULT_STUDIO_CACHE_TTL_MS = 30_000;

export function getCachedValue<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCachedValue<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_STUDIO_CACHE_TTL_MS,
): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearCachedValue(key: string): void {
  cache.delete(key);
}

export function clearStudioDataCache(): void {
  cache.clear();
}
