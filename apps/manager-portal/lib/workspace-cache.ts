type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 30_000;

export async function getCachedWorkspaceFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { force?: boolean; ttlMs?: number },
): Promise<T> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;

  if (!options?.force) {
    const hit = cache.get(key) as CacheEntry<T> | undefined;
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value;
    }
  }

  const value = await fetcher();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidateWorkspaceCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
