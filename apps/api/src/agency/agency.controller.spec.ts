import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';

describe('AgencyController authorization', () => {
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);

    await Test.createTestingModule({
      controllers: [AgencyController],
      providers: [
        {
          provide: AgencyService,
          useValue: {
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
            getSettings: jest.fn(),
            updateSettings: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  const createContext = (
    handler: keyof AgencyController,
    user: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: () => AgencyController.prototype[handler],
      getClass: () => AgencyController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('allows org owners to read agency profile', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['org:read']);

    expect(
      permissionsGuard.canActivate(
        createContext('getProfile', {
          role: 'ADMIN',
          organizationRole: 'ORG_OWNER',
          isSystemAdmin: false,
        }),
      ),
    ).toBe(true);
  });

  it('denies viewers from updating agency profile', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['org:update']);

    expect(() =>
      permissionsGuard.canActivate(
        createContext('updateProfile', {
          role: 'USER',
          organizationRole: 'VIEWER',
          isSystemAdmin: false,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows org admins to update agency settings', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['org:update']);

    expect(
      permissionsGuard.canActivate(
        createContext('updateSettings', {
          role: 'ADMIN',
          organizationRole: 'ORG_ADMIN',
          isSystemAdmin: false,
        }),
      ),
    ).toBe(true);
  });
});
