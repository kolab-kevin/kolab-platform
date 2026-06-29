import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { signAccessToken, verifyAccessToken } from './jwt';

const jwtConfig = {
  secret: 'test-secret-key-minimum-32-characters-long',
  accessExpiry: '15m',
};

describe('jwt', () => {
  it('signs and verifies Release 0.2 organization-aware claims', () => {
    const { token } = signAccessToken(
      {
        sub: 'user-1',
        email: 'user@example.com',
        role: 'USER',
        organizationId: 'org-1',
        organizationRole: 'ORG_ADMIN',
        sessionId: 'session-1',
        isSystemAdmin: false,
      },
      jwtConfig,
    );

    expect(verifyAccessToken(token, jwtConfig.secret)).toEqual({
      sub: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      organizationId: 'org-1',
      organizationRole: 'ORG_ADMIN',
      sessionId: 'session-1',
      isSystemAdmin: false,
    });
  });

  it('verifies Phase 1 tokens with legacy role claim only', () => {
    const { token } = signAccessToken(
      {
        sub: 'user-1',
        email: 'legacy@example.com',
        role: 'ADMIN',
      },
      jwtConfig,
    );

    expect(verifyAccessToken(token, jwtConfig.secret)).toEqual({
      sub: 'user-1',
      email: 'legacy@example.com',
      role: 'ADMIN',
      organizationId: undefined,
      organizationRole: undefined,
      sessionId: undefined,
      isSystemAdmin: false,
    });
  });

  it('accepts orgId and orgRole aliases when verifying legacy claim names', () => {
    const token = jwt.sign(
      {
        sub: 'user-1',
        email: 'alias@example.com',
        role: 'USER',
        orgId: 'org-2',
        orgRole: 'VIEWER',
        sessionId: 'session-2',
        isSystemAdmin: false,
      },
      jwtConfig.secret,
      { issuer: 'kolab-platform', audience: 'kolab-api', expiresIn: '15m' },
    );

    expect(verifyAccessToken(token, jwtConfig.secret)).toEqual({
      sub: 'user-1',
      email: 'alias@example.com',
      role: 'USER',
      organizationId: 'org-2',
      organizationRole: 'VIEWER',
      sessionId: 'session-2',
      isSystemAdmin: false,
    });
  });

  it('includes isSystemAdmin in verified payload', () => {
    const { token } = signAccessToken(
      {
        sub: 'admin-1',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        isSystemAdmin: true,
        organizationId: 'org-1',
        organizationRole: 'ORG_OWNER',
        sessionId: 'session-admin',
      },
      jwtConfig,
    );

    expect(verifyAccessToken(token, jwtConfig.secret).isSystemAdmin).toBe(true);
  });
});
