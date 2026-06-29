import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createContext = (user?: Record<string, unknown>): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as ExecutionContext;

  it('allows when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows ORG_OWNER to invite members', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['members:invite']);
    expect(
      guard.canActivate(
        createContext({
          role: 'USER',
          organizationRole: 'ORG_OWNER',
          isSystemAdmin: false,
        }),
      ),
    ).toBe(true);
  });

  it('allows ORG_ADMIN to update organization', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['org:update']);
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

  it('allows RECRUITER to invite but not update roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['members:invite']);
    expect(
      guard.canActivate(
        createContext({
          role: 'USER',
          organizationRole: 'RECRUITER',
          isSystemAdmin: false,
        }),
      ),
    ).toBe(true);

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['members:update_role']);
    expect(() =>
      guard.canActivate(
        createContext({
          role: 'USER',
          organizationRole: 'RECRUITER',
          isSystemAdmin: false,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows MODERATOR to read audit logs', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['audit:read']);
    expect(
      guard.canActivate(
        createContext({
          role: 'USER',
          organizationRole: 'MODERATOR',
          isSystemAdmin: false,
        }),
      ),
    ).toBe(true);
  });

  it('denies VIEWER write permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['org:update']);
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

  it('falls back to legacy ADMIN permissions when organizationRole is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['members:invite']);
    expect(guard.canActivate(createContext({ role: 'ADMIN', isSystemAdmin: false }))).toBe(true);
  });

  it('denies legacy USER when organizationRole is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['members:invite']);
    expect(() => guard.canActivate(createContext({ role: 'USER', isSystemAdmin: false }))).toThrow(
      ForbiddenException,
    );
  });

  it('allows system administrator override', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['members:remove']);
    expect(
      guard.canActivate(
        createContext({
          role: 'USER',
          organizationRole: 'VIEWER',
          isSystemAdmin: true,
        }),
      ),
    ).toBe(true);
  });
});
