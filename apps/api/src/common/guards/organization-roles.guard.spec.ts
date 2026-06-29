import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { OrganizationRolesGuard } from './organization-roles.guard';

describe('OrganizationRolesGuard', () => {
  let guard: OrganizationRolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new OrganizationRolesGuard(reflector);
  });

  const createContext = (user?: Record<string, unknown>): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as ExecutionContext;

  it('allows when no organization roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows matching organizationRole from JWT', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ORG_ADMIN', 'ORG_OWNER']);
    expect(
      guard.canActivate(
        createContext({
          role: 'USER',
          organizationRole: 'ORG_ADMIN',
          isSystemAdmin: false,
        }),
      ),
    ).toBe(true);
  });

  it('denies when organizationRole is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ORG_ADMIN']);
    expect(() => guard.canActivate(createContext({ role: 'ADMIN', isSystemAdmin: false }))).toThrow(
      ForbiddenException,
    );
  });

  it('denies viewer for admin-only organization roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ORG_ADMIN']);
    expect(() =>
      guard.canActivate(
        createContext({
          role: 'USER',
          organizationRole: 'VIEWER',
          isSystemAdmin: false,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows system administrator override', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ORG_OWNER']);
    expect(guard.canActivate(createContext({ role: 'USER', isSystemAdmin: true }))).toBe(true);
  });
});
