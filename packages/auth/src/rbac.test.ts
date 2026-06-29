import { describe, expect, it } from 'vitest';
import { hasAnyRole, hasMinimumRole } from './rbac';

describe('rbac', () => {
  it('hasMinimumRole respects hierarchy', () => {
    expect(hasMinimumRole('ADMIN', 'MODERATOR')).toBe(true);
    expect(hasMinimumRole('USER', 'ADMIN')).toBe(false);
    expect(hasMinimumRole('SUPER_ADMIN', 'ADMIN')).toBe(true);
  });

  it('hasAnyRole checks membership', () => {
    expect(hasAnyRole('CREATOR', ['CREATOR', 'ADMIN'])).toBe(true);
    expect(hasAnyRole('USER', ['ADMIN'])).toBe(false);
  });
});
