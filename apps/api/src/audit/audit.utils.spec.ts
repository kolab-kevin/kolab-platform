import { sanitizeAuditMetadata } from './audit.utils';

describe('sanitizeAuditMetadata', () => {
  it('removes sensitive keys including nested values', () => {
    const sanitized = sanitizeAuditMetadata({
      email: 'user@kolab.test',
      token: 'secret-token',
      tokenHash: 'hashed',
      nested: {
        password: 'hidden',
        role: 'RECRUITER',
      },
    });

    expect(sanitized).toEqual({
      email: 'user@kolab.test',
      nested: {
        role: 'RECRUITER',
      },
    });
  });
});
