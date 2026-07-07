import { describe, expect, it } from 'vitest';

import {
  appendDataSourceSuffix,
  combineWorkspaceDataSources,
  formatWorkspaceDataSourceLabel,
} from '@/lib/data-source';

describe('data source helpers', () => {
  it('formats workspace data source labels', () => {
    expect(formatWorkspaceDataSourceLabel('mock')).toBe('Mock data');
    expect(formatWorkspaceDataSourceLabel('live')).toBe('Live API data');
    expect(formatWorkspaceDataSourceLabel(null)).toBeUndefined();
  });

  it('combines multiple sources with mock taking precedence', () => {
    expect(combineWorkspaceDataSources(['live', 'partial'])).toBe('partial');
    expect(combineWorkspaceDataSources(['live', 'mock'])).toBe('mock');
    expect(combineWorkspaceDataSources([null, 'empty'])).toBe('empty');
  });

  it('appends source suffix to descriptions', () => {
    expect(appendDataSourceSuffix('12 creators in portfolio', 'mock')).toBe(
      '12 creators in portfolio · Mock data',
    );
  });
});
