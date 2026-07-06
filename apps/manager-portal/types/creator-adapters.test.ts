import { describe, expect, it } from 'vitest';

import { getMockCreatorListItems } from '@/services/creator-management-mock';
import {
  filterCreatorListItems,
  paginateCreatorListItems,
  sortCreatorListItems,
} from '@/types/creator-adapters';

describe('creator adapters', () => {
  const items = getMockCreatorListItems();

  it('filters creators by search query', () => {
    const filtered = filterCreatorListItems(items, 'Maya');
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.displayName).toBe('Maya Chen');
  });

  it('sorts creators by performance score descending', () => {
    const sorted = sortCreatorListItems(items, 'performanceScore', 'desc');
    expect(sorted[0]?.performanceScore).toBe(91);
  });

  it('paginates creator list items', () => {
    const page = paginateCreatorListItems(items, 1, 2);
    expect(page.items).toHaveLength(2);
    expect(page.totalPages).toBe(3);
  });
});
