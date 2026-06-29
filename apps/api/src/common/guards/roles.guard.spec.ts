import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createContext = (user?: Record<string, unknown>): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as ExecutionContext;

  it('allows when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('throws ForbiddenException when user lacks required legacy role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(createContext({ role: 'USER' }))).toThrow(ForbiddenException);
  });

  it('allows when user has required legacy role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'SUPER_ADMIN']);
    expect(guard.canActivate(createContext({ role: 'ADMIN', isSystemAdmin: false }))).toBe(true);
  });

  it('allows ORG_ADMIN organizationRole for legacy ADMIN decorator', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    expect(
      guard.canActivate(
        createContext({ role: 'USER', organizationRole: 'ORG_ADMIN', isSystemAdmin: false }),
      ),
    ).toBe(true);
  });

  it('allows system administrator override', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN']);
    expect(guard.canActivate(createContext({ role: 'USER', isSystemAdmin: true }))).toBe(true);
  });
});
