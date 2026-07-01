import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';

import { SystemAdminGuard } from './system-admin.guard';

describe('SystemAdminGuard', () => {
  const guard = new SystemAdminGuard();

  const createContext = (user?: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as ExecutionContext;

  it('allows system administrators', () => {
    expect(
      guard.canActivate(
        createContext({
          sub: 'admin-1',
          isSystemAdmin: true,
        }),
      ),
    ).toBe(true);
  });

  it('denies non-system administrators', () => {
    expect(() =>
      guard.canActivate(
        createContext({
          sub: 'user-1',
          isSystemAdmin: false,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('denies unauthenticated requests', () => {
    expect(() => guard.canActivate(createContext(undefined))).toThrow(ForbiddenException);
  });
});
