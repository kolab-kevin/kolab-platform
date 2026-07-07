import { describe, expect, it, vi } from 'vitest';

import { getCachedWorkspaceFetch, invalidateWorkspaceCache } from '@/lib/workspace-cache';

describe('workspace cache', () => {
  it('deduplicates repeated fetches within ttl', async () => {
    invalidateWorkspaceCache();
    const fetcher = vi.fn(async () => ({ value: 1 }));

    await getCachedWorkspaceFetch('test-key', fetcher);
    await getCachedWorkspaceFetch('test-key', fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('bypasses cache when force is true', async () => {
    invalidateWorkspaceCache();
    const fetcher = vi.fn(async () => ({ value: 2 }));

    await getCachedWorkspaceFetch('force-key', fetcher);
    await getCachedWorkspaceFetch('force-key', fetcher, { force: true });

    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
