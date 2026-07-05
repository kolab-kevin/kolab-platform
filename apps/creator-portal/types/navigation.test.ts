import { describe, expect, it } from 'vitest';

import { STUDIO_NAV_ITEMS } from '@/types/navigation';

describe('STUDIO_NAV_ITEMS', () => {
  it('includes all primary Creator Studio routes', () => {
    const segments = STUDIO_NAV_ITEMS.map((item) => item.segment);
    expect(segments).toContain('dashboard');
    expect(segments).toContain('goals');
    expect(segments).toContain('settings');
  });

  it('uses unique hrefs', () => {
    const hrefs = STUDIO_NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('routes live under /studio', () => {
    for (const item of STUDIO_NAV_ITEMS) {
      expect(item.href.startsWith('/studio/')).toBe(true);
    }
  });
});
