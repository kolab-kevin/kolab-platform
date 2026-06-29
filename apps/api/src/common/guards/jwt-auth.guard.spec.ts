import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtAuthGuard } from './jwt-auth.guard';

const mockVerifyAccessToken = jest.fn();

jest.mock('@kolab/auth', () => ({
  verifyAccessToken: (...args: unknown[]) => mockVerifyAccessToken(...args),
}));

jest.mock('@kolab/config', () => ({
  apiEnvSchema: {},
  parseEnv: () => ({
    JWT_SECRET: 'test-secret-key-minimum-32-characters-long',
  }),
}));

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
    jest.clearAllMocks();
  });

  const createContext = (headers: Record<string, string>): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    }) as ExecutionContext;

  it('allows public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    expect(guard.canActivate(createContext({}))).toBe(true);
  });

  it('throws when authorization header is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    expect(() => guard.canActivate(createContext({}))).toThrow(UnauthorizedException);
  });

  it('validates bearer token and attaches Release 0.2 user claims', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockVerifyAccessToken.mockReturnValue({
      sub: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      organizationId: 'org-1',
      organizationRole: 'VIEWER',
      sessionId: 'session-1',
      isSystemAdmin: false,
    });

    const request: { headers: { authorization: string }; user?: unknown } = {
      headers: { authorization: 'Bearer valid-token' },
    };
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;

    expect(guard.canActivate(ctx)).toBe(true);
    expect(request.user).toEqual(
      expect.objectContaining({
        sub: 'user-1',
        organizationId: 'org-1',
        organizationRole: 'VIEWER',
        sessionId: 'session-1',
        isSystemAdmin: false,
      }),
    );
  });

  it('accepts legacy Phase 1 tokens with role claim only', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockVerifyAccessToken.mockReturnValue({
      sub: 'user-1',
      email: 'legacy@example.com',
      role: 'ADMIN',
      isSystemAdmin: false,
    });

    const request: { headers: { authorization: string }; user?: unknown } = {
      headers: { authorization: 'Bearer legacy-token' },
    };
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;

    expect(guard.canActivate(ctx)).toBe(true);
    expect(request.user).toEqual({
      sub: 'user-1',
      email: 'legacy@example.com',
      role: 'ADMIN',
      isSystemAdmin: false,
    });
  });
});
